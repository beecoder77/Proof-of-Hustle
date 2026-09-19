// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HustleToken.sol";
import "./ProofOfHustleSBT.sol";
import "./ProtocolBurnPool.sol";

/**
 * @title GigEscrow
 * @notice Production-grade, non-custodial escrow protocol on Monad for freelance tasks,
 *         challenges, and attention curation.
 * @dev Enforces strict Track 03 invariants:
 *      - 1.0% protocol fee model (40% burn, 40% treasury, 20% hype curators)
 *      - 72-hour auto-release clock against client ghosting
 *      - MERA PRF sealed submission support
 *      - Curation staking (Attention Futures) and early-supporter provenance registries
 *      - Decentralized 3-jury Schelling point dispute arbitration
 */
contract GigEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for HustleToken;


    enum GigType { FCFS, CONTEST, MILESTONE }
    enum GigStatus { CREATED, OPEN, IN_PROGRESS, IN_REVIEW, SETTLED, DISPUTED, CANCELED, REFUNDED }
    enum DisputeVote { NONE, WORKER, CLIENT }

    /// @notice 72-hour review window before permissionless auto-release
    uint256 public constant AUTO_RELEASE_DELAY = 72 hours;

    /// @notice Protocol fee in basis points: 100 bps = 1.00%
    uint256 public constant PROTOCOL_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Fee split: 40% burn, 40% treasury, 20% hype curators
    uint256 public constant BURN_SPLIT_BPS = 4000;
    uint256 public constant TREASURY_SPLIT_BPS = 4000;
    uint256 public constant CURATOR_SPLIT_BPS = 2000;

    /// @notice Mining bonuses in basis points (+1.5% worker, +0.5% creator)
    uint256 public constant WORKER_MINING_BPS = 150;
    uint256 public constant CREATOR_MINING_BPS = 50;

    /// @notice Tightly packed Gig structure for optimal Monad EVM storage access
    struct Gig {
        address creator;            // 20 bytes - Slot 0
        uint8 gigType;              // 1 byte   - Slot 0
        uint8 status;               // 1 byte   - Slot 0
        bool isSealed;              // 1 byte   - Slot 0
        uint72 totalHypeStaked;     // 9 bytes  - Slot 0 (Total 32 bytes!)

        address token;              // 20 bytes - Slot 1 (address(0) = native MON)
        uint96 rewardAmount;        // 12 bytes - Slot 1 (Total 32 bytes!)

        address hustler;            // 20 bytes - Slot 2 (Winner / claimed worker)
        uint32 createdAt;           // 4 bytes  - Slot 2
        uint32 submittedAt;         // 4 bytes  - Slot 2
        uint32 deadline;            // 4 bytes  - Slot 2 (Total 32 bytes!)

        uint16 submissionsCount;    // 2 bytes  - Slot 3
        uint8 finalRating;          // 1 byte   - Slot 3
        uint96 curatorFeePool;      // 12 bytes - Slot 3
        string metadataCid;         // Dynamic  - IPFS CID for brief & specs
    }

    struct Submission {
        address hustler;
        uint40 submittedAt;
        bool isSealed;
        string deliverableUri;      // Plaintext or encrypted payload CID
        bytes32 commitHash;         // keccak256 commit hash for sealed submissions
    }

    struct Dispute {
        address initiator;
        uint40 raisedAt;
        uint8 workerVotes;
        uint8 clientVotes;
        bool resolved;
        string reasonCid;
        mapping(address => DisputeVote) votes;
        address[] jurors;
    }

    uint256 public gigCount;
    HustleToken public hustleToken;
    ProofOfHustleSBT public sbtContract;
    ProtocolBurnPool public burnPool;
    address public treasury;

    /// @notice Primary gig storage: gigId => Gig
    mapping(uint256 => Gig) public gigs;

    /// @notice Submissions per gig: gigId => submissionId => Submission
    mapping(uint256 => mapping(uint256 => Submission)) public submissions;

    /// @notice Winning submission ID per gig
    mapping(uint256 => uint256) public winningSubmissionId;

    /// @notice Staked hype per user per gig: gigId => user => amount
    mapping(uint256 => mapping(address => uint256)) public userHypeStake;

    /// @notice Early curators registry (first 10 hypers per gig): gigId => array of addresses
    mapping(uint256 => address[]) private _earlyCurators;

    /// @notice Track if curator reward was claimed: gigId => user => claimed
    mapping(uint256 => mapping(address => bool)) public curatorRewardClaimed;

    /// @notice Disputes per gig: gigId => Dispute
    mapping(uint256 => Dispute) internal _disputes;

    /// @notice Authorized jury members for arbitration
    mapping(address => bool) public isJuror;

    // Events
    event GigCreated(
        uint256 indexed gigId,
        address indexed creator,
        address indexed token,
        uint256 rewardAmount,
        GigType gigType,
        bool isSealed,
        uint256 deadline,
        string metadataCid
    );
    event TaskClaimed(uint256 indexed gigId, address indexed hustler);
    event WorkSubmitted(uint256 indexed gigId, uint256 indexed submissionId, address indexed hustler, bool isSealed);
    event PayoutReleased(uint256 indexed gigId, address indexed hustler, uint256 payoutAmount, uint8 rating);
    event PayoutAutoReleased(uint256 indexed gigId, address indexed hustler, uint256 payoutAmount, uint256 timestamp);
    event HypeStaked(uint256 indexed gigId, address indexed curator, uint256 amount, uint256 totalHype);
    event HypeUnstaked(uint256 indexed gigId, address indexed curator, uint256 amount);
    event EarlyCuratorRegistered(uint256 indexed gigId, address indexed curator, uint256 rank);
    event CurationRewardClaimed(uint256 indexed gigId, address indexed curator, uint256 reward);
    event DisputeRaised(uint256 indexed gigId, address indexed initiator, string reasonCid);
    event DisputeResolved(uint256 indexed gigId, address indexed winner, uint256 payout);

    // Errors
    error ZeroAddress();
    error ZeroAmount();
    error InvalidDeadline();
    error GigNotOpen();
    error GigNotInProgress();
    error GigNotInReview();
    error GigNotDisputed();
    error NotCreator();
    error NotClaimedHustler();
    error ReviewWindowActive();
    error AutoReleaseWindowExpired();
    error InvalidRating();
    error AlreadyVoted();
    error NotAuthorizedJuror();
    error DisputeAlreadyResolved();
    error InsufficientPayment();
    error TransferFailed();
    error SealedSubmissionRequiresHash();

    constructor(
        address initialOwner,
        address _hustleToken,
        address _sbtContract,
        address _burnPool,
        address _treasury
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) ||
            _hustleToken == address(0) ||
            _sbtContract == address(0) ||
            _burnPool == address(0) ||
            _treasury == address(0)
        ) revert ZeroAddress();

        hustleToken = HustleToken(_hustleToken);
        sbtContract = ProofOfHustleSBT(_sbtContract);
        burnPool = ProtocolBurnPool(payable(_burnPool));
        treasury = _treasury;

        // Default owner is also initial juror
        isJuror[initialOwner] = true;
    }

    /**
     * @notice Set authorized juror status for decentralized arbitration
     */
    function setJuror(address juror, bool status) external onlyOwner {
        if (juror == address(0)) revert ZeroAddress();
        isJuror[juror] = status;
    }

    /**
     * @notice Post a new gig with escrow deposit
     */
    function createGig(
        address token,
        uint96 rewardAmount,
        GigType gigType,
        bool isSealed,
        uint32 deadline,
        string calldata metadataCid
    ) external payable nonReentrant returns (uint256) {
        if (rewardAmount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        uint256 gigId = ++gigCount;

        // Collect escrow deposit
        if (token == address(0)) {
            if (msg.value < rewardAmount) revert InsufficientPayment();
            // Refund any excess native MON
            if (msg.value > rewardAmount) {
                (bool refundOk, ) = msg.sender.call{value: msg.value - rewardAmount}("");
                if (!refundOk) revert TransferFailed();
            }
        } else {
            if (msg.value > 0) revert InsufficientPayment();
            IERC20(token).safeTransferFrom(msg.sender, address(this), rewardAmount);
        }

        gigs[gigId] = Gig({
            creator: msg.sender,
            gigType: uint8(gigType),
            status: uint8(GigStatus.OPEN),
            isSealed: isSealed,
            totalHypeStaked: 0,
            token: token,
            rewardAmount: rewardAmount,
            hustler: address(0),
            createdAt: uint32(block.timestamp),
            submittedAt: 0,
            deadline: deadline,
            submissionsCount: 0,
            finalRating: 0,
            curatorFeePool: 0,
            metadataCid: metadataCid
        });

        emit GigCreated(gigId, msg.sender, token, rewardAmount, gigType, isSealed, deadline, metadataCid);
        return gigId;
    }

    /**
     * @notice Claim a FCFS task
     */
    function claimTask(uint256 gigId) external nonReentrant {
        Gig storage gig = gigs[gigId];
        if (gig.status != uint8(GigStatus.OPEN)) revert GigNotOpen();
        if (gig.gigType != uint8(GigType.FCFS)) revert GigNotOpen();
        if (block.timestamp > gig.deadline) revert InvalidDeadline();

        gig.hustler = msg.sender;
        gig.status = uint8(GigStatus.IN_PROGRESS);

        emit TaskClaimed(gigId, msg.sender);
    }

    /**
     * @notice Submit work deliverable (for FCFS or Contest)
     */
    function submitWork(
        uint256 gigId,
        string calldata deliverableUri,
        bool isSealed,
        bytes32 commitHash
    ) external nonReentrant returns (uint256) {
        Gig storage gig = gigs[gigId];
        if (block.timestamp > gig.deadline) revert InvalidDeadline();

        if (gig.gigType == uint8(GigType.FCFS)) {
            if (gig.status != uint8(GigStatus.IN_PROGRESS)) revert GigNotInProgress();
            if (gig.hustler != msg.sender) revert NotClaimedHustler();
            gig.status = uint8(GigStatus.IN_REVIEW);
            gig.submittedAt = uint32(block.timestamp);
        } else if (gig.gigType == uint8(GigType.CONTEST)) {
            if (gig.status != uint8(GigStatus.OPEN)) revert GigNotOpen();
            if (isSealed && commitHash == bytes32(0)) revert SealedSubmissionRequiresHash();
        }

        uint256 submissionId = ++gig.submissionsCount;
        submissions[gigId][submissionId] = Submission({
            hustler: msg.sender,
            submittedAt: uint40(block.timestamp),
            isSealed: isSealed,
            deliverableUri: deliverableUri,
            commitHash: commitHash
        });

        emit WorkSubmitted(gigId, submissionId, msg.sender, isSealed);
        return submissionId;
    }

    /**
     * @notice Creator approves work and releases payout
     */
    function releasePayout(
        uint256 gigId,
        uint256 winningSubmission,
        uint8 rating
    ) external nonReentrant {
        Gig storage gig = gigs[gigId];
        if (msg.sender != gig.creator) revert NotCreator();
        if (rating == 0 || rating > 5) revert InvalidRating();

        address worker;
        string memory deliverableUri;

        if (gig.gigType == uint8(GigType.FCFS)) {
            if (gig.status != uint8(GigStatus.IN_REVIEW)) revert GigNotInReview();
            worker = gig.hustler;
            deliverableUri = submissions[gigId][1].deliverableUri;
        } else {
            if (gig.status != uint8(GigStatus.OPEN)) revert GigNotOpen();
            Submission storage sub = submissions[gigId][winningSubmission];
            if (sub.hustler == address(0)) revert ZeroAddress();
            worker = sub.hustler;
            deliverableUri = sub.deliverableUri;
            winningSubmissionId[gigId] = winningSubmission;
            gig.hustler = worker;
        }

        gig.status = uint8(GigStatus.SETTLED);
        gig.finalRating = rating;

        _executePayout(gigId, gig, worker, rating, deliverableUri);
        emit PayoutReleased(gigId, worker, gig.rewardAmount, rating);
    }

    /**
     * @notice INVARIANT 2.2: 72-Hour Anti-Ghosting Clock
     * @dev Permissionless: callable by worker, creator, or any user after 72h from submission
     */
    function autoRelease(uint256 gigId) external nonReentrant {
        Gig storage gig = gigs[gigId];
        if (gig.status != uint8(GigStatus.IN_REVIEW)) revert GigNotInReview();
        if (block.timestamp < gig.submittedAt + AUTO_RELEASE_DELAY) revert ReviewWindowActive();

        address worker = gig.hustler;
        gig.status = uint8(GigStatus.SETTLED);
        gig.finalRating = 5; // Default 5-star rating for ghosted approval

        string memory deliverableUri = submissions[gigId][1].deliverableUri;
        _executePayout(gigId, gig, worker, 5, deliverableUri);

        emit PayoutAutoReleased(gigId, worker, gig.rewardAmount, block.timestamp);
    }

    /**
     * @notice Internal payout execution with 1.0% fee split and soulbound credential minting
     */
    function _executePayout(
        uint256 gigId,
        Gig storage gig,
        address worker,
        uint8 rating,
        string memory deliverableUri
    ) internal {
        uint256 totalAmount = gig.rewardAmount;
        address token = gig.token;

        // Protocol fee: 1.0%
        uint256 protocolFee = (totalAmount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 workerPayout = totalAmount - protocolFee;

        // Fee allocation: 40% burn, 40% treasury, 20% curators
        uint256 burnAmount = (protocolFee * BURN_SPLIT_BPS) / BPS_DENOMINATOR;
        uint256 treasuryAmount = (protocolFee * TREASURY_SPLIT_BPS) / BPS_DENOMINATOR;
        uint256 curatorAmount = protocolFee - burnAmount - treasuryAmount;

        // If no hypers staked, route curator fee to burn pool
        if (gig.totalHypeStaked == 0 || rating < 4) {
            burnAmount += curatorAmount;
            curatorAmount = 0;
        } else {
            gig.curatorFeePool = uint96(curatorAmount);
        }

        // Transfer funds
        _transferAsset(token, worker, workerPayout);
        _transferAsset(token, treasury, treasuryAmount);
        _transferAssetToBurnPool(token, burnAmount);

        // Mint Soulbound Credential NFT
        try sbtContract.mintProof(gigId, worker, gig.creator, totalAmount, rating, deliverableUri) {} catch {}

        // Hustle-to-Earn Mining Bonus (+1.5% to worker, +0.5% to creator in $HUSTLE)
        uint256 workerBonus = (totalAmount * WORKER_MINING_BPS) / BPS_DENOMINATOR;
        uint256 creatorBonus = (totalAmount * CREATOR_MINING_BPS) / BPS_DENOMINATOR;
        try hustleToken.mintReward(worker, workerBonus) {} catch {}
        try hustleToken.mintReward(gig.creator, creatorBonus) {} catch {}
    }

    /**
     * @notice INVARIANT 5.1: Attention Futures & Curation Staking
     * @param gigId Target gig
     * @param amount Amount of $HUSTLE to stake
     */
    function stakeHype(uint256 gigId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Gig storage gig = gigs[gigId];
        if (gig.status != uint8(GigStatus.OPEN) && gig.status != uint8(GigStatus.IN_PROGRESS)) {
            revert GigNotOpen();
        }

        hustleToken.safeTransferFrom(msg.sender, address(this), amount);

        // Register early curator if within first 10
        if (_earlyCurators[gigId].length < 10 && userHypeStake[gigId][msg.sender] == 0) {
            _earlyCurators[gigId].push(msg.sender);
            emit EarlyCuratorRegistered(gigId, msg.sender, _earlyCurators[gigId].length);
        }

        userHypeStake[gigId][msg.sender] += amount;
        gig.totalHypeStaked += uint72(amount);

        emit HypeStaked(gigId, msg.sender, amount, gig.totalHypeStaked);
    }

    /**
     * @notice Unstake hype after gig reaches settlement or cancellation
     */
    function unstakeHype(uint256 gigId) external nonReentrant {
        Gig storage gig = gigs[gigId];
        uint8 status = gig.status;
        if (
            status != uint8(GigStatus.SETTLED) &&
            status != uint8(GigStatus.CANCELED) &&
            status != uint8(GigStatus.REFUNDED)
        ) revert GigNotOpen();

        uint256 staked = userHypeStake[gigId][msg.sender];
        if (staked == 0) revert ZeroAmount();

        userHypeStake[gigId][msg.sender] = 0;
        hustleToken.safeTransfer(msg.sender, staked);

        emit HypeUnstaked(gigId, msg.sender, staked);
    }

    /**
     * @notice Claim proportional curation yield earned from fee pool
     */
    function claimCurationReward(uint256 gigId) external nonReentrant {
        Gig storage gig = gigs[gigId];
        if (gig.status != uint8(GigStatus.SETTLED)) revert GigNotOpen();
        if (curatorRewardClaimed[gigId][msg.sender]) revert AlreadyVoted();

        uint256 staked = userHypeStake[gigId][msg.sender];
        if (staked == 0) revert ZeroAmount();

        uint256 totalPool = gig.curatorFeePool;
        if (totalPool == 0) revert ZeroAmount();

        curatorRewardClaimed[gigId][msg.sender] = true;
        uint256 reward = (totalPool * staked) / gig.totalHypeStaked;

        _transferAsset(gig.token, msg.sender, reward);
        emit CurationRewardClaimed(gigId, msg.sender, reward);
    }

    /**
     * @notice Get early curators list (first 10 hypers)
     */
    function getEarlyCurators(uint256 gigId) external view returns (address[] memory) {
        return _earlyCurators[gigId];
    }

    /**
     * @notice Raise a dispute to community arbitration
     */
    function raiseDispute(uint256 gigId, string calldata reasonCid) external nonReentrant {
        Gig storage gig = gigs[gigId];
        if (msg.sender != gig.creator && msg.sender != gig.hustler) revert NotCreator();
        if (gig.status != uint8(GigStatus.IN_REVIEW) && gig.status != uint8(GigStatus.IN_PROGRESS)) {
            revert GigNotInReview();
        }

        gig.status = uint8(GigStatus.DISPUTED);

        Dispute storage d = _disputes[gigId];
        d.initiator = msg.sender;
        d.raisedAt = uint40(block.timestamp);
        d.reasonCid = reasonCid;

        emit DisputeRaised(gigId, msg.sender, reasonCid);
    }

    /**
     * @notice Authorized juror votes on an active dispute
     */
    function voteDispute(uint256 gigId, DisputeVote vote) external nonReentrant {
        if (!isJuror[msg.sender]) revert NotAuthorizedJuror();
        if (vote == DisputeVote.NONE) revert ZeroAmount();

        Gig storage gig = gigs[gigId];
        if (gig.status != uint8(GigStatus.DISPUTED)) revert GigNotDisputed();

        Dispute storage d = _disputes[gigId];
        if (d.resolved) revert DisputeAlreadyResolved();
        if (d.votes[msg.sender] != DisputeVote.NONE) revert AlreadyVoted();

        d.votes[msg.sender] = vote;
        d.jurors.push(msg.sender);

        if (vote == DisputeVote.WORKER) {
            d.workerVotes++;
        } else {
            d.clientVotes++;
        }

        // 2-of-3 quorum resolves the dispute
        if (d.workerVotes >= 2) {
            d.resolved = true;
            gig.status = uint8(GigStatus.SETTLED);
            _executePayout(gigId, gig, gig.hustler, 3, "");
            emit DisputeResolved(gigId, gig.hustler, gig.rewardAmount);
        } else if (d.clientVotes >= 2) {
            d.resolved = true;
            gig.status = uint8(GigStatus.REFUNDED);
            _transferAsset(gig.token, gig.creator, gig.rewardAmount);
            emit DisputeResolved(gigId, gig.creator, gig.rewardAmount);
        }
    }

    function _transferAsset(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool ok, ) = to.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _transferAssetToBurnPool(address token, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool ok, ) = address(burnPool).call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(address(burnPool), amount);
            burnPool.notifyFeeDeposit(token, amount);
        }
    }

    /**
     * @notice Get full gig struct
     */
    function getGig(uint256 gigId) external view returns (Gig memory) {
        return gigs[gigId];
    }
}


