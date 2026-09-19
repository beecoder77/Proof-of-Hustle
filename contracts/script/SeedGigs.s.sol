// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/GigEscrow.sol";
import "../src/MockERC20.sol";
import "../src/HustleToken.sol";

/**
 * @title SeedGigsScript
 * @notice Idempotent seeding script for ProofOfHustle protocol on Monad.
 *         Ensures 20 unique ecosystem gigs are seeded onchain if and only if
 *         the GigEscrow contract has not been seeded yet (gigCount == 0).
 *         If gigs already exist, it will NEVER seed again.
 */
contract SeedGigsScript is Script {
    struct GigSeed {
        string title;
        uint96 rewardAmount;
        bool isNative;
        GigEscrow.GigType gigType;
        bool isSealed;
        uint32 durationSeconds;
        string metadataCid;
    }

    function run() external {
        uint256 deployerPrivateKey;
        if (vm.envExists("PRIVATE_KEY")) {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        } else if (block.chainid == 31337) {
            // Local Anvil fallback only for isolated local simulation using derived test key
            (, deployerPrivateKey) = makeAddrAndKey("localDeployer");
        } else {
            revert("PRIVATE_KEY not found in environment. Please configure .env.");
        }

        address deployer = vm.addr(deployerPrivateKey);

        // Load deployed addresses from JSON file or environment
        string memory root = vm.projectRoot();
        string memory path;
        if (vm.envExists("DEPLOYED_ADDRESSES_PATH")) {
            path = vm.envString("DEPLOYED_ADDRESSES_PATH");
        } else {
            path = string.concat(root, "/deployed-addresses.json");
        }
        string memory json = vm.readFile(path);

        address escrowAddress = vm.parseJsonAddress(json, ".gigEscrow");
        address mockUsdtAddress = vm.parseJsonAddress(json, ".mockUsdt");

        GigEscrow escrow = GigEscrow(payable(escrowAddress));
        MockERC20 mockUsdt = MockERC20(mockUsdtAddress);

        console2.log("=== ProofOfHustle Seeding Script ===");
        console2.log("Deployer:", deployer);
        console2.log("Escrow Contract:", address(escrow));
        console2.log("Chain ID:", block.chainid);

        // --- STRICT IDEMPOTENCY GUARD ---
        uint256 existingGigs = escrow.gigCount();
        if (existingGigs > 0) {
            console2.log("----------------------------------------------------------------");
            console2.log("IDEMPOTENCY GUARD TRIGGERED: Gigs already exist onchain!");
            console2.log("Current gigCount:", existingGigs);
            console2.log("ABORTING: Will NEVER seed duplicate gigs into an active contract.");
            console2.log("----------------------------------------------------------------");
            return;
        }

        // Prepare the 20 unique gigs
        GigSeed[20] memory seeds = get20UniqueGigSeeds();

        // Calculate total USDT needed
        uint256 totalUsdtNeeded = 0;
        uint256 totalNativeNeeded = 0;
        for (uint256 i = 0; i < 20; i++) {
            if (seeds[i].isNative) {
                totalNativeNeeded += seeds[i].rewardAmount;
            } else {
                totalUsdtNeeded += seeds[i].rewardAmount;
            }
        }

        vm.startBroadcast(deployerPrivateKey);

        // Mint MockUSDT to deployer if needed
        if (mockUsdt.balanceOf(deployer) < totalUsdtNeeded) {
            mockUsdt.mint(deployer, totalUsdtNeeded * 2);
        }

        // Approve Escrow contract for total USDT required
        mockUsdt.approve(address(escrow), totalUsdtNeeded);

        console2.log("Approved GigEscrow for total USDT:", totalUsdtNeeded / 1e18);

        // Seed all 20 unique gigs
        for (uint256 i = 0; i < 20; i++) {
            address token = seeds[i].isNative ? address(0) : address(mockUsdt);
            uint256 msgValue = seeds[i].isNative ? seeds[i].rewardAmount : 0;
            uint32 deadline = uint32(block.timestamp + seeds[i].durationSeconds);

            uint256 gigId = escrow.createGig{value: msgValue}(
                token,
                seeds[i].rewardAmount,
                seeds[i].gigType,
                seeds[i].isSealed,
                deadline,
                seeds[i].metadataCid
            );

            console2.log(
                string.concat(
                    "Seeded Gig #",
                    vm.toString(gigId),
                    ": ",
                    seeds[i].title,
                    " (",
                    vm.toString(uint256(seeds[i].rewardAmount / 1e18)),
                    seeds[i].isNative ? " MON" : " USDT",
                    seeds[i].isSealed ? " [MERA Sealed])" : ")"
                )
            );
        }

        vm.stopBroadcast();

        console2.log("================================================================");
        console2.log("SUCCESS: 20 Unique Gigs successfully seeded onchain!");
        console2.log("Final gigCount:", escrow.gigCount());
        console2.log("================================================================");
    }

    function get20UniqueGigSeeds() internal pure returns (GigSeed[20] memory) {
        return [
            // 1
            GigSeed({
                title: "Parallel EVM Hot Storage Slot Collision Benchmark",
                rewardAmount: uint96(2500 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 7 days,
                metadataCid: "ipfs://QmParallelBenchmarkSuite"
            }),
            // 2
            GigSeed({
                title: "Alchemy Multi-Transport Failover & Latency Monitor",
                rewardAmount: uint96(1200 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmAlchemyFailoverMonitor"
            }),
            // 3
            GigSeed({
                title: "MERA Passkey PRF Decryption Chrome MV3 Extension",
                rewardAmount: uint96(1800 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 5 days,
                metadataCid: "ipfs://QmMeraExtensionZkReveal"
            }),
            // 4
            GigSeed({
                title: "3D Animated Molandak & Chog Mascot Discord Sticker Pack",
                rewardAmount: uint96(800 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: false,
                durationSeconds: 4 days,
                metadataCid: "ipfs://Qm3DChogStickersMonad"
            }),
            // 5
            GigSeed({
                title: "Cairo to Monad Solidity Transpiler Opcode Cheatsheet",
                rewardAmount: uint96(950 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmCairoToMonadOpcodeGuide"
            }),
            // 6
            GigSeed({
                title: "EIP-7702 Delegation Simulator & Gasless Sponsor Relayer",
                rewardAmount: uint96(2000 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 6 days,
                metadataCid: "ipfs://QmEIP7702BatchRelayer"
            }),
            // 7
            GigSeed({
                title: "Devnads Multi-Explorer Verification GitHub Action",
                rewardAmount: uint96(650 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 2 days,
                metadataCid: "ipfs://QmDevnadsCiCdWorkflow"
            }),
            // 8
            GigSeed({
                title: "Telegram Mini App for 1-Tap Monad Gig Claiming",
                rewardAmount: uint96(1500 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: false,
                durationSeconds: 5 days,
                metadataCid: "ipfs://QmTelegramMiniAppPoH"
            }),
            // 9
            GigSeed({
                title: "Monad BFT Consensus Latency Telemetry Dashboard",
                rewardAmount: uint96(1100 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 4 days,
                metadataCid: "ipfs://QmMonadBftTelemetryView"
            }),
            // 10
            GigSeed({
                title: "Zero-Knowledge Sealed Bug Bounty Audit Escrow",
                rewardAmount: uint96(2200 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 7 days,
                metadataCid: "ipfs://QmZkAuditReportEscrow"
            }),
            // 11
            GigSeed({
                title: "Liquid Staking Adapter for $HUSTLE Attention Curation",
                rewardAmount: uint96(1400 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 4 days,
                metadataCid: "ipfs://QmLiquidStakingVaultHustle"
            }),
            // 12
            GigSeed({
                title: "Monad Hacker House London Kinetic Video Recap",
                rewardAmount: uint96(750 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmLondonHackerHouseRecap"
            }),
            // 13
            GigSeed({
                title: "Sub-400ms Pyth Oracle Binary Prediction Escrow",
                rewardAmount: uint96(1750 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 5 days,
                metadataCid: "ipfs://QmPythFastPredictionEscrow"
            }),
            // 14
            GigSeed({
                title: "Precision Studio Obsidian Dark Component Library",
                rewardAmount: uint96(850 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmPrecisionStudioComponents"
            }),
            // 15
            GigSeed({
                title: "Cross-Chain Outbox Gas & Finality Estimator Widget",
                rewardAmount: uint96(900 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmBridgeGasEstimatorWidget"
            }),
            // 16
            GigSeed({
                title: "Monad Deferred Execution MEV Backrunning Simulator",
                rewardAmount: uint96(2400 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 7 days,
                metadataCid: "ipfs://QmMevBackrunSimulatorMonad"
            }),
            // 17
            GigSeed({
                title: "Decentralized Juror Dispute Tribunal Smart Contract",
                rewardAmount: uint96(1350 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 4 days,
                metadataCid: "ipfs://QmJurorDisputeTribunal"
            }),
            // 18
            GigSeed({
                title: "Social Guardian WebAuthn Passkey Recovery Flow",
                rewardAmount: uint96(1600 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: false,
                durationSeconds: 5 days,
                metadataCid: "ipfs://QmSocialGuardianRecovery"
            }),
            // 19
            GigSeed({
                title: "Onchain Sybil-Resistant Hustler Credibility Index",
                rewardAmount: uint96(1000 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.FCFS,
                isSealed: false,
                durationSeconds: 3 days,
                metadataCid: "ipfs://QmHustleCredibilityIndex"
            }),
            // 20
            GigSeed({
                title: "Category Labs 'One Passkey, Many Keys' 3D Showcase",
                rewardAmount: uint96(1900 * 1e18),
                isNative: false,
                gigType: GigEscrow.GigType.CONTEST,
                isSealed: true,
                durationSeconds: 6 days,
                metadataCid: "ipfs://QmCategoryLabs3DShowcase"
            })
        ];
    }
}
