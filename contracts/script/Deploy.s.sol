// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "@forge-std/Script.sol";
import {ReputationNFT} from "../src/core/ReputationNFT.sol";
import {ScoreCalculator} from "../src/core/ScoreCalculator.sol";
import {PlatformRegistry} from "../src/core/PlatformRegistry.sol";
import {TruthBountyCore} from "../src/core/TruthBountyCore.sol";
import {PancakePredictionAdapter} from "../src/adapters/PancakePredictionAdapter.sol";
import {HelperConfig} from "./helpers/HelperConfig.s.sol";

/**
 * @title Deploy
 * @notice Main deployment script for TruthBounty protocol
 * @dev Deploys all contracts in correct order and configures them
 * @author TruthBounty Team
 *
 * USAGE:
 * Deploy to BNB Testnet:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $BNB_TESTNET_RPC --broadcast --verify -vvvv
 *
 * Deploy to BNB Mainnet:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url $BNB_MAINNET_RPC --broadcast --verify -vvvv
 *
 * Deploy locally (no verification):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast -vvvv
 */
contract Deploy is Script {
    // ============================================
    // Deployed Contract Addresses
    // ============================================

    ReputationNFT public reputationNFT;
    ScoreCalculator public scoreCalculator;
    PlatformRegistry public platformRegistry;
    TruthBountyCore public truthBountyCore;
    PancakePredictionAdapter public pancakeAdapter;

    HelperConfig public helperConfig;

    // ============================================
    // Main Deployment Function
    // ============================================

    function run() external returns (address, address, address, address, address) {
        // Load network configuration
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getActiveNetworkConfig();

        console.log("\n==============================================");
        console.log("TRUTHBOUNTY DEPLOYMENT");
        console.log("==============================================");
        console.log("Network:", config.networkName);
        console.log("Chain ID:", config.chainId);
        console.log("Deployer:", msg.sender);
        console.log("==============================================\n");

        // Start broadcasting transactions
        vm.startBroadcast();

        // 1. Deploy ReputationNFT
        console.log("1/7 Deploying ReputationNFT...");
        reputationNFT = new ReputationNFT();
        console.log("   ReputationNFT deployed at:", address(reputationNFT));

        // 2. Deploy ScoreCalculator
        console.log("\n2/7 Deploying ScoreCalculator...");
        scoreCalculator = new ScoreCalculator();
        console.log("   ScoreCalculator deployed at:", address(scoreCalculator));

        // 3. Deploy PlatformRegistry
        console.log("\n3/7 Deploying PlatformRegistry...");
        platformRegistry = new PlatformRegistry();
        console.log("   PlatformRegistry deployed at:", address(platformRegistry));

        // 4. Deploy TruthBountyCore
        console.log("\n4/7 Deploying TruthBountyCore...");
        truthBountyCore =
            new TruthBountyCore(address(reputationNFT), address(scoreCalculator), address(platformRegistry));
        console.log("   TruthBountyCore deployed at:", address(truthBountyCore));

        // 5. Deploy PancakePredictionAdapter
        console.log("\n5/7 Deploying PancakePredictionAdapter...");
        if (config.pancakePredictionV2 == address(0)) {
            console.log("   WARNING: No PancakePrediction address for this network!");
            console.log("   Skipping adapter deployment.");
        } else {
            pancakeAdapter = new PancakePredictionAdapter(config.pancakePredictionV2);
            console.log("   PancakePredictionAdapter deployed at:", address(pancakeAdapter));
            console.log("   Connected to PancakePrediction:", config.pancakePredictionV2);
        }

        // 6. Register PancakePrediction platform in registry
        console.log("\n6/7 Registering PancakePrediction platform...");
        if (address(pancakeAdapter) != address(0)) {
            uint256 platformId = platformRegistry.addPlatform(
                "PancakePrediction V2",
                address(pancakeAdapter),
                config.explorerUrl,
                PlatformRegistry.PlatformType.BINARY_PREDICTION
            );
            console.log("   Platform registered with ID:", platformId);
            console.log("   Platform Name: PancakePrediction V2");
            console.log("   Platform Type: BINARY_PREDICTION");
        } else {
            console.log("   Skipped (no adapter deployed)");
        }

        // 7. Set TruthBountyCore as NFT minter
        console.log("\n7/7 Setting TruthBountyCore as NFT minter...");
        reputationNFT.setCore(address(truthBountyCore));
        console.log("   TruthBountyCore set as minter");

        vm.stopBroadcast();

        // Print deployment summary
        _printDeploymentSummary(config);

        // Generate JSON for deployments file
        _generateDeploymentJson(config);

        return (
            address(reputationNFT),
            address(scoreCalculator),
            address(platformRegistry),
            address(truthBountyCore),
            address(pancakeAdapter)
        );
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Prints formatted deployment summary
     */
    function _printDeploymentSummary(HelperConfig.NetworkConfig memory config) internal view {
        console.log("\n==============================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("==============================================");
        console.log("Network:", config.networkName);
        console.log("Chain ID:", config.chainId);
        console.log("Deployer:", msg.sender);
        console.log("----------------------------------------------");
        console.log("Core Contracts:");
        console.log("  ReputationNFT:      ", address(reputationNFT));
        console.log("  ScoreCalculator:    ", address(scoreCalculator));
        console.log("  PlatformRegistry:   ", address(platformRegistry));
        console.log("  TruthBountyCore:    ", address(truthBountyCore));
        console.log("----------------------------------------------");
        console.log("Adapters:");
        if (address(pancakeAdapter) != address(0)) {
            console.log("  PancakeAdapter:     ", address(pancakeAdapter));
        } else {
            console.log("  PancakeAdapter:      Not deployed");
        }
        console.log("----------------------------------------------");
        console.log("External Contracts:");
        if (config.pancakePredictionV2 != address(0)) {
            console.log("  PancakePrediction:  ", config.pancakePredictionV2);
        } else {
            console.log("  PancakePrediction:   Not available");
        }
        console.log("==============================================");

        if (helperConfig.isLiveNetwork()) {
            console.log("\nView on Explorer:");
            console.log(config.explorerUrl, "/address/", addressToString(address(truthBountyCore)));
            console.log("\nVerification (if needed):");
            console.log("forge verify-contract", addressToString(address(truthBountyCore)), "src/core/TruthBountyCore.sol:TruthBountyCore --chain-id", config.chainId);
        }

        console.log("\n");
    }

    /**
     * @dev Generates deployment JSON string for saving to file
     */
    function _generateDeploymentJson(HelperConfig.NetworkConfig memory config) internal view {
        console.log("\n==============================================");
        console.log("DEPLOYMENT JSON (save to deployments/*.json)");
        console.log("==============================================");
        console.log("{");
        console.log('  "network": "', config.networkName, '",');
        console.log('  "chainId":', config.chainId, ",");
        console.log('  "timestamp":', block.timestamp, ",");
        console.log('  "deployer": "', addressToString(msg.sender), '",');
        console.log('  "contracts": {');
        console.log('    "ReputationNFT": "', addressToString(address(reputationNFT)), '",');
        console.log('    "ScoreCalculator": "', addressToString(address(scoreCalculator)), '",');
        console.log('    "PlatformRegistry": "', addressToString(address(platformRegistry)), '",');
        console.log('    "TruthBountyCore": "', addressToString(address(truthBountyCore)), '",');
        if (address(pancakeAdapter) != address(0)) {
            console.log('    "PancakePredictionAdapter": "', addressToString(address(pancakeAdapter)), '"');
        } else {
            console.log('    "PancakePredictionAdapter": null');
        }
        console.log("  },");
        console.log('  "external": {');
        if (config.pancakePredictionV2 != address(0)) {
            console.log('    "PancakePredictionV2": "', addressToString(config.pancakePredictionV2), '"');
        } else {
            console.log('    "PancakePredictionV2": null');
        }
        console.log("  }");
        console.log("}");
        console.log("==============================================\n");
    }

    /**
     * @dev Converts address to string
     */
    function addressToString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Helper for testing - deploys to local network
     */
    function deployForTesting()
        external
        returns (ReputationNFT, ScoreCalculator, PlatformRegistry, TruthBountyCore, PancakePredictionAdapter)
    {
        helperConfig = new HelperConfig();

        vm.startBroadcast();

        reputationNFT = new ReputationNFT();
        scoreCalculator = new ScoreCalculator();
        platformRegistry = new PlatformRegistry();
        truthBountyCore =
            new TruthBountyCore(address(reputationNFT), address(scoreCalculator), address(platformRegistry));

        // For testing, use a mock address
        pancakeAdapter = new PancakePredictionAdapter(address(0x1));

        platformRegistry.addPlatform(
            "PancakePrediction V2",
            address(pancakeAdapter),
            "https://testnet.bscscan.com",
            PlatformRegistry.PlatformType.BINARY_PREDICTION
        );

        reputationNFT.setCore(address(truthBountyCore));

        vm.stopBroadcast();

        return (reputationNFT, scoreCalculator, platformRegistry, truthBountyCore, pancakeAdapter);
    }
}
