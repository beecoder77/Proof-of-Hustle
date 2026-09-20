// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/HustlerProfileRegistry.sol";

contract DeployProfileRegistryScript is Script {
    function run() external {
        uint256 deployerPrivateKey;
        if (vm.envExists("PRIVATE_KEY")) {
            try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
                deployerPrivateKey = key;
            } catch {
                deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));
            }
        } else if (block.chainid == 31337) {
            (, deployerPrivateKey) = makeAddrAndKey("localDeployer");
        } else {
            revert("PRIVATE_KEY environment variable not set.");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Deploying HustlerProfileRegistry to Monad Testnet ===");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        HustlerProfileRegistry registry = new HustlerProfileRegistry(deployer);
        console2.log("HustlerProfileRegistry deployed at:", address(registry));

        // Register initial onchain handle for deployer
        registry.registerHandle("nad_architect", "Founding Architect & Core Contributor of ProofOfHustle on Monad");
        console2.log("Initial handle registered onchain: @nad_architect for", deployer);

        vm.stopBroadcast();

        // Append to deployed-addresses.json
        console2.log("Successfully deployed and seeded initial onchain handle.");
    }
}
