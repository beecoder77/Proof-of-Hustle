// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../script/SeedGigs.s.sol";
import "../src/GigEscrow.sol";
import "../src/MockERC20.sol";
import "../src/HustleToken.sol";
import "../src/ProofOfHustleSBT.sol";
import "../src/ProtocolBurnPool.sol";

contract SeedGigsTest is Test {
    GigEscrow public escrow;
    MockERC20 public mockUsdt;
    HustleToken public hustleToken;
    ProofOfHustleSBT public sbt;
    ProtocolBurnPool public burnPool;

    address public deployer = address(0x1234567890123456789012345678901234567890);
    address public treasury = address(0x9999999999999999999999999999999999999999);

    function setUp() public {
        vm.startPrank(deployer);
        hustleToken = new HustleToken(deployer);
        sbt = new ProofOfHustleSBT(deployer);
        burnPool = new ProtocolBurnPool(deployer, address(hustleToken));
        escrow = new GigEscrow(
            deployer,
            address(hustleToken),
            address(sbt),
            address(burnPool),
            treasury
        );
        mockUsdt = new MockERC20("Mock USDT", "USDT");

        sbt.setEscrowContract(address(escrow));
        hustleToken.setMinter(address(escrow), true);
        vm.stopPrank();

        // Write test addresses to isolated test JSON file
        string memory json = "{\n";
        json = string.concat(json, '  "chainId": ', vm.toString(block.chainid), ",\n");
        json = string.concat(json, '  "hustleToken": "', vm.toString(address(hustleToken)), '",\n');
        json = string.concat(json, '  "proofOfHustleSBT": "', vm.toString(address(sbt)), '",\n');
        json = string.concat(json, '  "protocolBurnPool": "', vm.toString(address(burnPool)), '",\n');
        json = string.concat(json, '  "gigEscrow": "', vm.toString(address(escrow)), '",\n');
        json = string.concat(json, '  "mockUsdt": "', vm.toString(address(mockUsdt)), '"\n');
        json = string.concat(json, "}");
        string memory testJsonPath = string.concat(vm.projectRoot(), "/test-deployed-addresses.json");
        vm.writeFile(testJsonPath, json);
        vm.setEnv("DEPLOYED_ADDRESSES_PATH", testJsonPath);
    }

    function testIdempotentSeedingNeverSeedsTwice() public {
        assertEq(escrow.gigCount(), 0, "Initial gig count must be 0");

        // First Run: SeedGigsScript should seed 20 gigs
        SeedGigsScript script = new SeedGigsScript();
        vm.setEnv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        script.run();

        assertEq(escrow.gigCount(), 20, "Must have exactly 20 gigs seeded on first run");

        // Verify Gig #1 properties
        (
            ,
            uint8 gigType,
            uint8 status,
            bool isSealed,
            ,
            address token,
            uint96 rewardAmount,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            string memory metadataCid
        ) = escrow.gigs(1);

        assertEq(gigType, uint8(GigEscrow.GigType.CONTEST));
        assertEq(status, uint8(GigEscrow.GigStatus.OPEN));
        assertTrue(isSealed);
        assertEq(token, address(mockUsdt));
        assertEq(rewardAmount, 2500 * 1e18);
        assertEq(metadataCid, "ipfs://QmParallelBenchmarkSuite");

        // Verify Gig #2 is FCFS
        (, uint8 gig2Type, , bool gig2Sealed, , , uint96 gig2Reward, , , , , , , , ) = escrow.gigs(2);
        assertEq(gig2Type, uint8(GigEscrow.GigType.FCFS));
        assertFalse(gig2Sealed);
        assertEq(gig2Reward, 1200 * 1e18);

        // SECOND RUN: Should be completely blocked by Idempotency Guard!
        script.run();

        assertEq(escrow.gigCount(), 20, "Idempotency guard must prevent duplicate seeding! Count must stay 20.");

        // Cleanup isolated test file
        string memory testJsonPath = string.concat(vm.projectRoot(), "/test-deployed-addresses.json");
        vm.removeFile(testJsonPath);
    }
}
