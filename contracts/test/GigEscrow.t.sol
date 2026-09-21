// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/GigEscrow.sol";
import "../src/HustleToken.sol";
import "../src/ProofOfHustleSBT.sol";
import "../src/ProtocolBurnPool.sol";
import "../src/MockERC20.sol";

contract GigEscrowTest is Test {
    GigEscrow public escrow;
    HustleToken public hustleToken;
    ProofOfHustleSBT public sbt;
    ProtocolBurnPool public burnPool;
    MockERC20 public mockUsdt;

    address public owner = address(0x1);
    address public treasury = address(0x2);
    address public creator = address(0x3);
    address public worker = address(0x4);
    address public curator1 = address(0x5);
    address public curator2 = address(0x6);
    address public juror1 = address(0x7);
    address public juror2 = address(0x8);

    function setUp() public {
        vm.startPrank(owner);

        hustleToken = new HustleToken(owner);
        sbt = new ProofOfHustleSBT(owner);
        burnPool = new ProtocolBurnPool(owner, address(hustleToken));

        escrow = new GigEscrow(
            owner,
            address(hustleToken),
            address(sbt),
            address(burnPool),
            treasury
        );

        sbt.setEscrowContract(address(escrow));
        hustleToken.setMinter(address(escrow), true);
        burnPool.setEscrowContract(address(escrow));

        escrow.setJuror(juror1, true);
        escrow.setJuror(juror2, true);

        mockUsdt = new MockERC20("Mock USDT", "USDT");

        // Fund test accounts
        mockUsdt.transfer(creator, 50_000 * 1e18);
        hustleToken.transfer(curator1, 10_000 * 1e18);
        hustleToken.transfer(curator2, 10_000 * 1e18);

        vm.stopPrank();

        vm.deal(creator, 100 ether);
        vm.deal(worker, 1 ether);
    }

    function testCreateGigNativeMON() public {
        vm.prank(creator);
        uint256 gigId = escrow.createGig{value: 5 ether}(
            address(0),
            uint96(5 ether),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 3 days),
            "ipfs://QmMetadata1"
        );

        assertEq(gigId, 1);
        GigEscrow.Gig memory gig = escrow.getGig(gigId);

        assertEq(gig.creator, creator);
        assertEq(gig.gigType, uint8(GigEscrow.GigType.FCFS));
        assertEq(gig.status, uint8(GigEscrow.GigStatus.OPEN));
        assertFalse(gig.isSealed);
        assertEq(gig.totalHypeStaked, 0);
    }


    function testFCFSFlowAndPayout() public {
        // 1. Creator creates FCFS gig with 1,000 USDT
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 1000 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(1000 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmBrief"
        );
        vm.stopPrank();

        // 2. Worker claims task
        vm.prank(worker);
        escrow.claimTask(gigId);

        // 3. Worker submits work
        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmDeliverable", false, bytes32(0));

        // Verify status is IN_REVIEW
        GigEscrow.Gig memory gigAfterSubmit = escrow.getGig(gigId);
        assertEq(gigAfterSubmit.status, uint8(GigEscrow.GigStatus.IN_REVIEW));


        // 4. Creator approves payout with 5-star rating
        uint256 workerBalBefore = mockUsdt.balanceOf(worker);
        uint256 treasuryBalBefore = mockUsdt.balanceOf(treasury);

        vm.prank(creator);
        escrow.releasePayout(gigId, 1, 5);

        // Verify 1% fee calculation:
        // Total: 1,000 USDT
        // Protocol fee: 1% = 10 USDT
        // Worker payout: 99% = 990 USDT
        // Treasury cut (40% of fee): 4 USDT
        assertEq(mockUsdt.balanceOf(worker) - workerBalBefore, 990 * 1e18);
        assertEq(mockUsdt.balanceOf(treasury) - treasuryBalBefore, 4 * 1e18);

        // Verify SBT minted to worker
        assertEq(sbt.balanceOf(worker), 1);
        uint256[] memory workerTokens = sbt.getUserTokens(worker);
        assertEq(workerTokens.length, 1);

        // Verify worker Hustle-to-earn mining reward (+1.5% in $HUSTLE)
        // 1,000 * 1.5% = 15 $HUSTLE
        assertEq(hustleToken.balanceOf(worker), 15 * 1e18);
    }

    function testAutoReleaseAfter72Hours() public {
        // 1. Creator creates FCFS task
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmBrief"
        );
        vm.stopPrank();

        vm.prank(worker);
        escrow.claimTask(gigId);

        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmCodePR", false, bytes32(0));

        // 2. Attempt autoRelease before 72 hours -> must revert
        vm.warp(block.timestamp + 48 hours);
        vm.expectRevert(GigEscrow.ReviewWindowActive.selector);
        escrow.autoRelease(gigId);

        // 3. Fast-forward past 72 hours
        vm.warp(block.timestamp + 25 hours); // Total 73 hours

        // Anyone (even a third-party bot or worker) can call autoRelease
        address bot = address(0x999);
        vm.prank(bot);
        escrow.autoRelease(gigId);

        // Worker received 495 USDT (500 - 1% fee)
        assertEq(mockUsdt.balanceOf(worker), 495 * 1e18);
        assertEq(sbt.balanceOf(worker), 1);
    }

    function testContestFlow() public {
        // Creator posts contest with 2,000 USDT
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 2000 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(2000 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 5 days),
            "ipfs://QmContestBrief"
        );
        vm.stopPrank();

        address contestant2 = address(0x22);

        // Worker 1 submits public deliverable
        vm.prank(worker);
        uint256 subId1 = escrow.submitWork(gigId, "ipfs://QmDesign1", false, bytes32(0));

        // Contestant 2 submits sealed deliverable with MERA PRF commit hash
        bytes32 commitHash = keccak256("ipfs://QmEncryptedDesign2");
        vm.prank(contestant2);
        uint256 subId2 = escrow.submitWork(gigId, "ipfs://QmEncryptedDesign2", true, commitHash);

        assertEq(subId1, 1);
        assertEq(subId2, 2);

        // Creator chooses Contestant 2 as winner
        vm.prank(creator);
        escrow.releasePayout(gigId, 2, 5);

        // Contestant 2 received 99% payout (1,980 USDT)
        assertEq(mockUsdt.balanceOf(contestant2), 1980 * 1e18);
        assertEq(sbt.balanceOf(contestant2), 1);
    }

    function testSealedSubmissionRequiresCommitHash() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            true,
            uint32(block.timestamp + 2 days),
            "ipfs://QmSealedContest"
        );
        vm.stopPrank();

        vm.prank(worker);
        vm.expectRevert(GigEscrow.SealedSubmissionRequiresHash.selector);
        escrow.submitWork(gigId, "ipfs://QmPlaintext", true, bytes32(0));
    }

    function testAttentionFuturesAndEarlyCuratorRegistry() public {
        // Creator creates gig
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 1000 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(1000 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 3 days),
            "ipfs://QmHotGig"
        );
        vm.stopPrank();

        // Curator 1 stakes 1,000 $HUSTLE
        vm.startPrank(curator1);
        hustleToken.approve(address(escrow), 1000 * 1e18);
        escrow.stakeHype(gigId, 1000 * 1e18);
        vm.stopPrank();

        // Curator 2 stakes 3,000 $HUSTLE
        vm.startPrank(curator2);
        hustleToken.approve(address(escrow), 3000 * 1e18);
        escrow.stakeHype(gigId, 3000 * 1e18);
        vm.stopPrank();

        // Verify early curator registry
        address[] memory earlyCurators = escrow.getEarlyCurators(gigId);
        assertEq(earlyCurators.length, 2);
        assertEq(earlyCurators[0], curator1);
        assertEq(earlyCurators[1], curator2);

        // Worker claims and completes task
        vm.prank(worker);
        escrow.claimTask(gigId);
        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmSuperbWork", false, bytes32(0));

        // Creator approves with 5-star rating (rating >= 4 unlocks 20% curator fee pool)
        vm.prank(creator);
        escrow.releasePayout(gigId, 1, 5);

        // Protocol fee = 10 USDT. Curator pool (20%) = 2 USDT
        // Curator 1 staked 25% (1000 / 4000) -> earns 0.5 USDT
        // Curator 2 staked 75% (3000 / 4000) -> earns 1.5 USDT
        vm.prank(curator1);
        escrow.claimCurationReward(gigId);
        assertEq(mockUsdt.balanceOf(curator1), 0.5 * 1e18);

        vm.prank(curator2);
        escrow.claimCurationReward(gigId);
        assertEq(mockUsdt.balanceOf(curator2), 1.5 * 1e18);

        // Curators unstake their original $HUSTLE
        vm.prank(curator1);
        escrow.unstakeHype(gigId);
        assertEq(hustleToken.balanceOf(curator1), 10_000 * 1e18);

        vm.prank(curator2);
        escrow.unstakeHype(gigId);
        assertEq(hustleToken.balanceOf(curator2), 10_000 * 1e18);
    }

    function testDisputeResolutionWorkerWins() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 1000 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(1000 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 3 days),
            "ipfs://QmDisputedTask"
        );
        vm.stopPrank();

        vm.prank(worker);
        escrow.claimTask(gigId);
        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmDeliverable", false, bytes32(0));

        // Creator raises dispute
        vm.prank(creator);
        escrow.raiseDispute(gigId, "ipfs://QmReasonIncomplete");

        // 2 jurors vote for WORKER
        vm.prank(juror1);
        escrow.voteDispute(gigId, GigEscrow.DisputeVote.WORKER);

        vm.prank(juror2);
        escrow.voteDispute(gigId, GigEscrow.DisputeVote.WORKER);

        // Worker received settlement
        assertEq(mockUsdt.balanceOf(worker), 990 * 1e18);
    }

    function testDisputeResolutionClientRefunded() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 1000 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(1000 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 3 days),
            "ipfs://QmDisputedTask2"
        );
        vm.stopPrank();

        vm.prank(worker);
        escrow.claimTask(gigId);
        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmSpamDeliverable", false, bytes32(0));

        vm.prank(creator);
        escrow.raiseDispute(gigId, "ipfs://QmSpamClaim");

        uint256 creatorBalBefore = mockUsdt.balanceOf(creator);

        // 2 jurors vote for CLIENT
        vm.prank(juror1);
        escrow.voteDispute(gigId, GigEscrow.DisputeVote.CLIENT);

        vm.prank(juror2);
        escrow.voteDispute(gigId, GigEscrow.DisputeVote.CLIENT);

        // Creator receives 100% refund
        assertEq(mockUsdt.balanceOf(creator) - creatorBalBefore, 1000 * 1e18);
    }

    function testCreatorCannotClaimOwnGig() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmFcfs"
        );

        vm.expectRevert(GigEscrow.CreatorCannotClaim.selector);
        escrow.claimTask(gigId);
        vm.stopPrank();
    }

    function testCreatorCannotSubmitToOwnGig() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmContest"
        );

        vm.expectRevert(GigEscrow.CreatorCannotSubmit.selector);
        escrow.submitWork(gigId, "ipfs://QmWork", false, bytes32(0));
        vm.stopPrank();
    }

    function testCreatorCannotHypeOwnGig() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmContest"
        );

        hustleToken.approve(address(escrow), 100 * 1e18);
        vm.expectRevert(GigEscrow.CreatorCannotHype.selector);
        escrow.stakeHype(gigId, 100 * 1e18);
        vm.stopPrank();
    }

    function testCannotStakeHypeAfterDeadline() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmContest"
        );
        vm.stopPrank();

        // Warp past deadline
        vm.warp(block.timestamp + 3 days);

        vm.startPrank(curator1);
        hustleToken.approve(address(escrow), 100 * 1e18);
        vm.expectRevert(GigEscrow.InvalidDeadline.selector);
        escrow.stakeHype(gigId, 100 * 1e18);
        vm.stopPrank();
    }

    function testCancelGigRefundsCreator() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmContest"
        );

        uint256 creatorBalBefore = mockUsdt.balanceOf(creator);

        // Cancel with 0 submissions
        escrow.cancelGig(gigId);
        assertEq(mockUsdt.balanceOf(creator) - creatorBalBefore, 500 * 1e18);

        GigEscrow.Gig memory gig = escrow.getGig(gigId);
        assertEq(gig.status, uint8(GigEscrow.GigStatus.CANCELED));
        vm.stopPrank();
    }

    function testCannotCancelActiveGigWithSubmissionsBeforeDeadline() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.CONTEST,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmContest"
        );
        vm.stopPrank();

        vm.prank(worker);
        escrow.submitWork(gigId, "ipfs://QmWork", false, bytes32(0));

        // Creator tries to cancel while active with submissions before deadline
        vm.prank(creator);
        vm.expectRevert(GigEscrow.CannotCancelActiveGig.selector);
        escrow.cancelGig(gigId);
    }

    function testCancelAbandonedFCFSGigPastDeadline() public {
        vm.startPrank(creator);
        mockUsdt.approve(address(escrow), 500 * 1e18);
        uint256 gigId = escrow.createGig(
            address(mockUsdt),
            uint96(500 * 1e18),
            GigEscrow.GigType.FCFS,
            false,
            uint32(block.timestamp + 2 days),
            "ipfs://QmFcfs"
        );
        vm.stopPrank();

        vm.prank(worker);
        escrow.claimTask(gigId);

        // Worker abandons, time passes deadline
        vm.warp(block.timestamp + 3 days);

        uint256 creatorBalBefore = mockUsdt.balanceOf(creator);
        vm.prank(creator);
        escrow.cancelGig(gigId);

        assertEq(mockUsdt.balanceOf(creator) - creatorBalBefore, 500 * 1e18);
        GigEscrow.Gig memory gig = escrow.getGig(gigId);
        assertEq(gig.status, uint8(GigEscrow.GigStatus.CANCELED));
    }
}
