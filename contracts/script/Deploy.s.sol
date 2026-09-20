// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/HustleToken.sol";
import "../src/ProofOfHustleSBT.sol";
import "../src/ProtocolBurnPool.sol";
import "../src/GigEscrow.sol";
import "../src/MockERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey;
        if (vm.envExists("PRIVATE_KEY")) {
            try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
                deployerPrivateKey = key;
            } catch {
                deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));
            }
        } else if (block.chainid == 31337) {
            // Local Anvil fallback only for isolated local simulation using derived test key
            (, deployerPrivateKey) = makeAddrAndKey("localDeployer");
        } else {
            revert("PRIVATE_KEY environment variable not set. Please copy .env.example to .env and configure your key.");
        }
        address deployer = vm.addr(deployerPrivateKey);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        console2.log("=== ProofOfHustle Protocol Deployment ===");
        console2.log("Deployer:", deployer);
        console2.log("Treasury:", treasury);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy HustleToken ($HUSTLE)
        HustleToken hustleToken = new HustleToken(deployer);
        console2.log("HustleToken deployed at:", address(hustleToken));

        // 2. Deploy ProofOfHustleSBT (ERC-5192)
        ProofOfHustleSBT sbt = new ProofOfHustleSBT(deployer);
        console2.log("ProofOfHustleSBT deployed at:", address(sbt));

        // 3. Deploy ProtocolBurnPool
        ProtocolBurnPool burnPool = new ProtocolBurnPool(deployer, address(hustleToken));
        console2.log("ProtocolBurnPool deployed at:", address(burnPool));

        // 4. Deploy GigEscrow
        GigEscrow escrow = new GigEscrow(
            deployer,
            address(hustleToken),
            address(sbt),
            address(burnPool),
            treasury
        );
        console2.log("GigEscrow deployed at:", address(escrow));

        // 5. Deploy MockUSDT for testnet
        MockERC20 mockUsdt = new MockERC20("Mock Tether USD", "USDT");
        console2.log("MockUSDT deployed at:", address(mockUsdt));

        // 6. Configure Protocol Authorizations
        sbt.setEscrowContract(address(escrow));
        hustleToken.setMinter(address(escrow), true);
        console2.log("Protocol authorizations configured successfully.");

        // 7. Idempotent Initial Seeding (Check if gigs exist, NEVER seed twice)
        if (escrow.gigCount() == 0) {
            console2.log("--- Idempotent Seeding: Adding initial 20 unique ecosystem gigs ---");
            mockUsdt.mint(deployer, 50_000 * 1e18);
            mockUsdt.approve(address(escrow), 50_000 * 1e18);

            _seed20Gigs(escrow, mockUsdt);
            console2.log("Seeding complete. Current gigCount:", escrow.gigCount());
        } else {
            console2.log("IDEMPOTENCY GUARD: Gigs already exist on GigEscrow (count =", escrow.gigCount(), "). Skipping seeding.");
        }

        vm.stopBroadcast();

        // Output JSON for Envio indexer and Frontend
        string memory json = "{\n";
        json = string.concat(json, '  "chainId": ', vm.toString(block.chainid), ",\n");
        json = string.concat(json, '  "hustleToken": "', vm.toString(address(hustleToken)), '",\n');
        json = string.concat(json, '  "proofOfHustleSBT": "', vm.toString(address(sbt)), '",\n');
        json = string.concat(json, '  "protocolBurnPool": "', vm.toString(address(burnPool)), '",\n');
        json = string.concat(json, '  "gigEscrow": "', vm.toString(address(escrow)), '",\n');
        json = string.concat(json, '  "mockUsdt": "', vm.toString(address(mockUsdt)), '"\n');
        json = string.concat(json, "}");

        vm.writeFile("deployed-addresses.json", json);
        console2.log("Deployment addresses written to deployed-addresses.json");
    }

    function _seed20Gigs(GigEscrow escrow, MockERC20 mockUsdt) internal {
        // Gig 1: Parallel EVM Benchmark
        escrow.createGig(address(mockUsdt), uint96(2500 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 7 days), "ipfs://QmParallelBenchmarkSuite");
        // Gig 2: Alchemy Multi-Transport Failover
        escrow.createGig(address(mockUsdt), uint96(1200 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 3 days), "ipfs://QmAlchemyFailoverMonitor");
        // Gig 3: MERA Passkey PRF Decryption Extension
        escrow.createGig(address(mockUsdt), uint96(1800 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 5 days), "ipfs://QmMeraExtensionZkReveal");
        // Gig 4: 3D Animated Mascot Stickers
        escrow.createGig(address(mockUsdt), uint96(800 * 1e18), GigEscrow.GigType.CONTEST, false, uint32(block.timestamp + 4 days), "ipfs://Qm3DChogStickersMonad");
        // Gig 5: Cairo to Monad Transpiler Cheatsheet
        escrow.createGig(address(mockUsdt), uint96(950 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 3 days), "ipfs://QmCairoToMonadOpcodeGuide");
        // Gig 6: EIP-7702 Delegation Simulator
        escrow.createGig(address(mockUsdt), uint96(2000 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 6 days), "ipfs://QmEIP7702BatchRelayer");
        // Gig 7: Devnads Multi-Explorer Verification Action
        escrow.createGig(address(mockUsdt), uint96(650 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 2 days), "ipfs://QmDevnadsCiCdWorkflow");
        // Gig 8: Telegram Mini App for 1-Tap Claiming
        escrow.createGig(address(mockUsdt), uint96(1500 * 1e18), GigEscrow.GigType.CONTEST, false, uint32(block.timestamp + 5 days), "ipfs://QmTelegramMiniAppPoH");
        // Gig 9: Monad BFT Consensus Latency Dashboard
        escrow.createGig(address(mockUsdt), uint96(1100 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 4 days), "ipfs://QmMonadBftTelemetryView");
        // Gig 10: Zero-Knowledge Sealed Bug Bounty Audit
        escrow.createGig(address(mockUsdt), uint96(2200 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 7 days), "ipfs://QmZkAuditReportEscrow");
        // Gig 11: Liquid Staking Adapter for $HUSTLE
        escrow.createGig(address(mockUsdt), uint96(1400 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 4 days), "ipfs://QmLiquidStakingVaultHustle");
        // Gig 12: Monad Hacker House London Recap Video
        escrow.createGig(address(mockUsdt), uint96(750 * 1e18), GigEscrow.GigType.CONTEST, false, uint32(block.timestamp + 3 days), "ipfs://QmLondonHackerHouseRecap");
        // Gig 13: Sub-400ms Pyth Oracle Prediction Escrow
        escrow.createGig(address(mockUsdt), uint96(1750 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 5 days), "ipfs://QmPythFastPredictionEscrow");
        // Gig 14: Precision Studio Component Library
        escrow.createGig(address(mockUsdt), uint96(850 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 3 days), "ipfs://QmPrecisionStudioComponents");
        // Gig 15: Cross-Chain Outbox Gas & Finality Estimator
        escrow.createGig(address(mockUsdt), uint96(900 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 3 days), "ipfs://QmBridgeGasEstimatorWidget");
        // Gig 16: Monad MEV Backrunning Simulator
        escrow.createGig(address(mockUsdt), uint96(2400 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 7 days), "ipfs://QmMevBackrunSimulatorMonad");
        // Gig 17: Decentralized Juror Dispute Tribunal
        escrow.createGig(address(mockUsdt), uint96(1350 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 4 days), "ipfs://QmJurorDisputeTribunal");
        // Gig 18: Social Guardian WebAuthn Passkey Recovery
        escrow.createGig(address(mockUsdt), uint96(1600 * 1e18), GigEscrow.GigType.CONTEST, false, uint32(block.timestamp + 5 days), "ipfs://QmSocialGuardianRecovery");
        // Gig 19: Onchain Hustler Credibility Index
        escrow.createGig(address(mockUsdt), uint96(1000 * 1e18), GigEscrow.GigType.FCFS, false, uint32(block.timestamp + 3 days), "ipfs://QmHustleCredibilityIndex");
        // Gig 20: Category Labs 'One Passkey, Many Keys' 3D Showcase
        escrow.createGig(address(mockUsdt), uint96(1900 * 1e18), GigEscrow.GigType.CONTEST, true, uint32(block.timestamp + 6 days), "ipfs://QmCategoryLabs3DShowcase");
    }
}
