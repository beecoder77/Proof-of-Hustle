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
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        } else if (block.chainid == 31337) {
            // Local Anvil fallback only for isolated local simulation
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
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
}
