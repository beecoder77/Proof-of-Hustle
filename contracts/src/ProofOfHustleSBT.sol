// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title IERC5192 Minimal Soulbound Token Interface
interface IERC5192 {
    /// @notice Emitted when the lock status of a token is set.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the lock status of a token is unset.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the lock status of an NFT.
    /// @dev In ProofOfHustle, all minted credentials are permanently locked.
    function locked(uint256 tokenId) external view returns (bool);
}

/**
 * @title ProofOfHustleSBT
 * @notice ERC-5192 compliant Soulbound Token representing verified onchain work history.
 * @dev Tokens are non-transferable and can only be minted by the GigEscrow contract upon successful task settlement.
 */
contract ProofOfHustleSBT is ERC721, IERC5192, Ownable {
    using Strings for uint256;

    struct ProofMetadata {
        uint256 gigId;
        address hustler;
        address creator;
        uint256 payoutAmount;
        uint8 rating; // 1 - 5 stars
        uint40 completedTimestamp;
        string deliverableCid;
    }

    uint256 private _nextTokenId;
    address public escrowContract;

    /// @notice Mapping from tokenId to ProofMetadata
    mapping(uint256 => ProofMetadata) public proofs;

    /// @notice Mapping from user address to their earned token IDs
    mapping(address => uint256[]) private _userTokens;

    event ProofMinted(
        uint256 indexed tokenId,
        uint256 indexed gigId,
        address indexed hustler,
        address creator,
        uint256 payoutAmount,
        uint8 rating,
        string deliverableCid
    );

    error SoulboundTokenLocked();
    error OnlyEscrowContract();
    error InvalidRating();
    error TokenDoesNotExist();
    error ZeroAddress();

    modifier onlyEscrow() {
        if (msg.sender != escrowContract && msg.sender != owner()) {
            revert OnlyEscrowContract();
        }
        _;
    }

    constructor(address initialOwner) ERC721("ProofOfHustle Credential", "POH-SBT") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    /**
     * @notice Set the authorized GigEscrow contract address
     * @param _escrowContract Address of the escrow protocol
     */
    function setEscrowContract(address _escrowContract) external onlyOwner {
        if (_escrowContract == address(0)) revert ZeroAddress();
        escrowContract = _escrowContract;
    }

    /**
     * @notice Mint a permanent Soulbound credential to the worker upon payout release
     */
    function mintProof(
        uint256 gigId,
        address hustler,
        address creator,
        uint256 payoutAmount,
        uint8 rating,
        string calldata deliverableCid
    ) external onlyEscrow returns (uint256) {
        if (hustler == address(0)) revert ZeroAddress();
        if (rating == 0 || rating > 5) revert InvalidRating();

        uint256 tokenId = ++_nextTokenId;

        proofs[tokenId] = ProofMetadata({
            gigId: gigId,
            hustler: hustler,
            creator: creator,
            payoutAmount: payoutAmount,
            rating: rating,
            completedTimestamp: uint40(block.timestamp),
            deliverableCid: deliverableCid
        });

        _userTokens[hustler].push(tokenId);

        _safeMint(hustler, tokenId);

        emit Locked(tokenId);
        emit ProofMinted(tokenId, gigId, hustler, creator, payoutAmount, rating, deliverableCid);

        return tokenId;
    }

    /**
     * @notice Returns whether the token is locked per ERC-5192.
     * @dev All ProofOfHustle tokens are permanently soulbound.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return true;
    }

    /**
     * @notice Get all token IDs earned by a hustler
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userTokens[user];
    }

    /**
     * @notice In OpenZeppelin v5, _update intercepts all mints, burns, and transfers.
     * @dev Enforces non-transferability: reverts on any transfer between accounts.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // If this is a transfer (from != 0 and to != 0), revert unconditionally!
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenLocked();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice ERC-165 support including IERC5192 interface ID (0xb45a3c0e)
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
