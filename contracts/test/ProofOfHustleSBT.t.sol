// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/ProofOfHustleSBT.sol";

contract ProofOfHustleSBTTest is Test {
    ProofOfHustleSBT public sbt;
    address public owner = address(0x1);
    address public escrow = address(0x2);
    address public worker = address(0x3);
    address public creator = address(0x4);
    address public attacker = address(0x5);

    function setUp() public {
        vm.prank(owner);
        sbt = new ProofOfHustleSBT(owner);

        vm.prank(owner);
        sbt.setEscrowContract(escrow);
    }

    function testMintProofAndMetadata() public {
        vm.prank(escrow);
        uint256 tokenId = sbt.mintProof(1, worker, creator, 500 * 1e18, 5, "ipfs://QmTest123");

        assertEq(tokenId, 1);
        assertEq(sbt.ownerOf(tokenId), worker);
        assertTrue(sbt.locked(tokenId));

        (
            uint256 gigId,
            address hustler,
            address gigCreator,
            uint256 payoutAmount,
            uint8 rating,
            uint40 completedTimestamp,
            string memory cid
        ) = sbt.proofs(tokenId);

        assertEq(gigId, 1);
        assertEq(hustler, worker);
        assertEq(gigCreator, creator);
        assertEq(payoutAmount, 500 * 1e18);
        assertEq(rating, 5);
        assertEq(completedTimestamp, uint40(block.timestamp));
        assertEq(cid, "ipfs://QmTest123");
    }

    function testNonEscrowCannotMint() public {
        vm.prank(attacker);
        vm.expectRevert(ProofOfHustleSBT.OnlyEscrowContract.selector);
        sbt.mintProof(1, worker, creator, 500 * 1e18, 5, "ipfs://QmTest123");
    }

    function testSoulboundTransferReverts() public {
        vm.prank(escrow);
        uint256 tokenId = sbt.mintProof(1, worker, creator, 500 * 1e18, 5, "ipfs://QmTest123");

        // Attempt transferFrom
        vm.prank(worker);
        vm.expectRevert(ProofOfHustleSBT.SoulboundTokenLocked.selector);
        sbt.transferFrom(worker, attacker, tokenId);

        // Attempt safeTransferFrom
        vm.prank(worker);
        vm.expectRevert(ProofOfHustleSBT.SoulboundTokenLocked.selector);
        sbt.safeTransferFrom(worker, attacker, tokenId);
    }

    function testGetUserTokens() public {
        vm.startPrank(escrow);
        sbt.mintProof(1, worker, creator, 100 * 1e18, 5, "ipfs://Qm1");
        sbt.mintProof(2, worker, creator, 200 * 1e18, 4, "ipfs://Qm2");
        vm.stopPrank();

        uint256[] memory tokens = sbt.getUserTokens(worker);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], 1);
        assertEq(tokens[1], 2);
    }
}
