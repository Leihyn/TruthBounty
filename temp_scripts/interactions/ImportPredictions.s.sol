// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "@forge-std/Script.sol";
import {TruthBountyCore} from "../../src/core/TruthBountyCore.sol";
import {ReputationNFT} from "../../src/core/ReputationNFT.sol";
import {IReputationNFT} from "../../src/interfaces/IReputationNFT.sol";
import {PlatformRegistry} from "../../src/core/PlatformRegistry.sol";

/**
 * @title ImportPredictions
 * @notice Imports prediction data for a registered user
 * @dev Interaction script for testing deployed contracts with mock data
 * @author TruthBounty Team
 *
 * USAGE:
 * Import with default mock data:
 *   forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvv
 *
 * Import custom data (via environment variables):
 *   PLATFORM_ID=1 TOTAL=100 CORRECT=75 VOLUME=10 \
 *   forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvv
 */
contract ImportPredictions is Script {
    // ============================================
    // Contract Addresses (Update after deployment)
    // ============================================

    // BNB Testnet addresses - UPDATE THESE
    address constant TRUTH_BOUNTY_CORE_TESTNET = address(0); // UPDATE
    address constant PLATFORM_REGISTRY_TESTNET = address(0); // UPDATE
    address constant REPUTATION_NFT_TESTNET = address(0); // UPDATE

    // BNB Mainnet addresses
    address constant TRUTH_BOUNTY_CORE_MAINNET = address(0); // UPDATE
    address constant PLATFORM_REGISTRY_MAINNET = address(0); // UPDATE
    address constant REPUTATION_NFT_MAINNET = address(0); // UPDATE

    // ============================================
    // State Variables
    // ============================================

    TruthBountyCore public core;
    PlatformRegistry public registry;
    ReputationNFT public nft;

    // ============================================
    // Main Function
    // ============================================

    function run() external {
        // Load contracts
        _loadContracts();

        address user = msg.sender;

        console.log("\n==============================================");
        console.log("IMPORT PREDICTIONS");
        console.log("==============================================");
        console.log("Network:", _getNetworkName());
        console.log("User:", user);
        console.log("==============================================\n");

        // Check if registered
        if (!core.hasRegistered(user)) {
            console.log("ERROR: User not registered!");
            console.log("Run RegisterUser.s.sol first");
            return;
        }

        // Get or use environment variables for prediction data
        uint256 platformId = vm.envOr("PLATFORM_ID", uint256(1)); // PancakePrediction
        uint256 totalPredictions = vm.envOr("TOTAL", uint256(100));
        uint256 correctPredictions = vm.envOr("CORRECT", uint256(75));
        uint256 totalVolume = vm.envOr("VOLUME", uint256(10)) * 1e18; // Convert to wei

        // Validate platform
        if (!registry.isPlatformActive(platformId)) {
            console.log("ERROR: Platform not active!");
            console.log("Platform ID:", platformId);
            return;
        }

        // Check if connected
        if (!core.isPlatformConnected(user, platformId)) {
            console.log("Platform not connected. Connecting now...");
            vm.startBroadcast();
            core.connectPlatform(platformId);
            vm.stopBroadcast();
            console.log("Connected to platform:", platformId);
        }

        // Get platform info
        PlatformRegistry.Platform memory platform = registry.getPlatform(platformId);

        console.log("Platform:", platform.name);
        console.log("Total Predictions:", totalPredictions);
        console.log("Correct Predictions:", correctPredictions);
        uint256 winRateCalc = (correctPredictions * 10000) / totalPredictions;
        console.log("Win Rate:", winRateCalc / 100, "%");
        console.log("Total Volume:", totalVolume / 1e18, "BNB");
        console.log("");

        // Generate unique batch proof
        bytes32 proof = keccak256(abi.encodePacked(user, platformId, block.timestamp, totalPredictions));

        console.log("Batch Proof:", vm.toString(proof));
        console.log("");

        // Import predictions
        vm.startBroadcast();

        try core.importPredictions(platformId, totalPredictions, correctPredictions, totalVolume, proof) {
            vm.stopBroadcast();

            console.log("\n==============================================");
            console.log("SUCCESS - Predictions Imported!");
            console.log("==============================================");
            console.log("Platform:", platform.name);
            console.log("Batch Proof:", vm.toString(proof));
            console.log("==============================================\n");

            // Display updated profile
            _displayUserProfile(user);
        } catch Error(string memory reason) {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Import Failed");
            console.log("==============================================");
            console.log("Reason:", reason);
            console.log("\nCommon Issues:");
            console.log("- Rate limited (wait 1 hour)");
            console.log("- Batch already imported");
            console.log("- Invalid data (correct > total)");
            console.log("- Platform not connected");
            console.log("==============================================\n");
        } catch {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Import Failed (Unknown)");
            console.log("==============================================\n");
        }
    }

    // ============================================
    // Preset Scenarios
    // ============================================

    /**
     * @notice Import scenario: Beginner trader
     */
    function importBeginner() external {
        _loadContracts();
        address user = msg.sender;

        uint256 platformId = 1;
        uint256 totalPredictions = 20;
        uint256 correctPredictions = 12; // 60% win rate
        uint256 totalVolume = 1 ether; // 1 BNB

        _importWithData(user, platformId, totalPredictions, correctPredictions, totalVolume);
    }

    /**
     * @notice Import scenario: Intermediate trader
     */
    function importIntermediate() external {
        _loadContracts();
        address user = msg.sender;

        uint256 platformId = 1;
        uint256 totalPredictions = 100;
        uint256 correctPredictions = 75; // 75% win rate
        uint256 totalVolume = 10 ether; // 10 BNB

        _importWithData(user, platformId, totalPredictions, correctPredictions, totalVolume);
    }

    /**
     * @notice Import scenario: Expert trader
     */
    function importExpert() external {
        _loadContracts();
        address user = msg.sender;

        uint256 platformId = 1;
        uint256 totalPredictions = 500;
        uint256 correctPredictions = 425; // 85% win rate
        uint256 totalVolume = 100 ether; // 100 BNB

        _importWithData(user, platformId, totalPredictions, correctPredictions, totalVolume);
    }

    /**
     * @notice Import scenario: High volume whale
     */
    function importWhale() external {
        _loadContracts();
        address user = msg.sender;

        uint256 platformId = 1;
        uint256 totalPredictions = 1000;
        uint256 correctPredictions = 700; // 70% win rate
        uint256 totalVolume = 500 ether; // 500 BNB

        _importWithData(user, platformId, totalPredictions, correctPredictions, totalVolume);
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Import with specific data
     */
    function _importWithData(
        address user,
        uint256 platformId,
        uint256 totalPredictions,
        uint256 correctPredictions,
        uint256 totalVolume
    ) internal {
        console.log("\n==============================================");
        console.log("IMPORT PREDICTIONS");
        console.log("==============================================");
        console.log("User:", user);
        console.log("Total:", totalPredictions);
        console.log("Correct:", correctPredictions);
        console.log("Volume:", totalVolume / 1e18, "BNB");
        console.log("==============================================\n");

        // Connect if needed
        if (!core.isPlatformConnected(user, platformId)) {
            vm.startBroadcast();
            core.connectPlatform(platformId);
            vm.stopBroadcast();
        }

        bytes32 proof = keccak256(abi.encodePacked(user, platformId, block.timestamp, totalPredictions));

        vm.startBroadcast();
        core.importPredictions(platformId, totalPredictions, correctPredictions, totalVolume, proof);
        vm.stopBroadcast();

        console.log("SUCCESS - Imported!");
        _displayUserProfile(user);
    }

    /**
     * @dev Load contracts based on chain ID
     */
    function _loadContracts() internal {
        if (block.chainid == 97) {
            // BNB Testnet
            require(TRUTH_BOUNTY_CORE_TESTNET != address(0), "Update TRUTH_BOUNTY_CORE_TESTNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_TESTNET);
            registry = PlatformRegistry(PLATFORM_REGISTRY_TESTNET);
            nft = ReputationNFT(REPUTATION_NFT_TESTNET);
        } else if (block.chainid == 56) {
            // BNB Mainnet
            require(TRUTH_BOUNTY_CORE_MAINNET != address(0), "Update TRUTH_BOUNTY_CORE_MAINNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_MAINNET);
            registry = PlatformRegistry(PLATFORM_REGISTRY_MAINNET);
            nft = ReputationNFT(REPUTATION_NFT_MAINNET);
        } else {
            revert("Unsupported network");
        }
    }

    /**
     * @dev Display user profile
     */
    function _displayUserProfile(address user) internal view {
        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);
        uint256 winRate = core.getWinRate(user);

        console.log("\n----------------------------------------------");
        console.log("UPDATED USER PROFILE");
        console.log("----------------------------------------------");
        console.log("Address:", user);
        console.log("TruthScore:", profile.truthScore);
        console.log("Total Predictions:", profile.totalPredictions);
        console.log("Correct Predictions:", profile.correctPredictions);
        console.log("Win Rate (bps):", winRate);
        console.log("Total Volume:", profile.totalVolume / 1e18, "BNB");
        console.log("Connected Platforms:", profile.connectedPlatforms.length);

        // Get NFT tier
        try nft.getTier(profile.reputationNFTId) returns (IReputationNFT.ReputationTier tier) {
            console.log("Reputation Tier:", _tierToString(tier));
        } catch {}

        console.log("----------------------------------------------\n");
    }

    /**
     * @dev Get network name
     */
    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == 97) return "BNB Testnet";
        if (block.chainid == 56) return "BNB Mainnet";
        return "Unknown";
    }

    /**
     * @dev Convert tier to string
     */
    function _tierToString(IReputationNFT.ReputationTier tier) internal pure returns (string memory) {
        if (tier == IReputationNFT.ReputationTier.BRONZE) return "BRONZE";
        if (tier == IReputationNFT.ReputationTier.SILVER) return "SILVER";
        if (tier == IReputationNFT.ReputationTier.GOLD) return "GOLD";
        if (tier == IReputationNFT.ReputationTier.PLATINUM) return "PLATINUM";
        if (tier == IReputationNFT.ReputationTier.DIAMOND) return "DIAMOND";
        return "UNKNOWN";
    }
}
