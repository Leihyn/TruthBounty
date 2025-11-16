// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "@forge-std/Script.sol";
import {TruthBountyCore} from "../../src/core/TruthBountyCore.sol";
import {ReputationNFT} from "../../src/core/ReputationNFT.sol";
import {PlatformRegistry} from "../../src/core/PlatformRegistry.sol";
import {ScoreCalculator} from "../../src/core/ScoreCalculator.sol";

/**
 * @title ViewUserProfile
 * @notice View complete user profile with detailed statistics
 * @dev Read-only script for querying deployed contracts
 * @author TruthBounty Team
 *
 * USAGE:
 * View own profile:
 *   forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     -vvv
 *
 * View specific user:
 *   USER=0x123... forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     -vvv
 *
 * Compare multiple users:
 *   forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
 *     --sig "compareUsers(address,address)" 0x123... 0x456... \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     -vvv
 */
contract ViewUserProfile is Script {
    // ============================================
    // Contract Addresses (Update after deployment)
    // ============================================

    // BNB Testnet addresses - UPDATE THESE
    address constant TRUTH_BOUNTY_CORE_TESTNET = address(0); // UPDATE
    address constant REPUTATION_NFT_TESTNET = address(0); // UPDATE
    address constant PLATFORM_REGISTRY_TESTNET = address(0); // UPDATE
    address constant SCORE_CALCULATOR_TESTNET = address(0); // UPDATE

    // BNB Mainnet addresses
    address constant TRUTH_BOUNTY_CORE_MAINNET = address(0); // UPDATE
    address constant REPUTATION_NFT_MAINNET = address(0); // UPDATE
    address constant PLATFORM_REGISTRY_MAINNET = address(0); // UPDATE
    address constant SCORE_CALCULATOR_MAINNET = address(0); // UPDATE

    // ============================================
    // State Variables
    // ============================================

    TruthBountyCore public core;
    ReputationNFT public nft;
    PlatformRegistry public registry;
    ScoreCalculator public calculator;

    // ============================================
    // Main Function
    // ============================================

    function run() external view {
        // Load contracts
        _loadContracts();

        // Get user address
        address user = vm.envOr("USER", msg.sender);

        console.log("\n==============================================");
        console.log("TRUTHBOUNTY USER PROFILE");
        console.log("==============================================");
        console.log("Network:", _getNetworkName());
        console.log("Explorer:", _getExplorerUrl());
        console.log("==============================================\n");

        // Check if registered
        if (!core.hasRegistered(user)) {
            console.log("User NOT registered:", user);
            console.log("\nRun RegisterUser.s.sol to register");
            return;
        }

        // Display full profile
        _displayFullProfile(user);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice View NFT metadata
     */
    function viewNFT() external view {
        _loadContracts();
        address user = vm.envOr("USER", msg.sender);

        if (!core.hasRegistered(user)) {
            console.log("User not registered");
            return;
        }

        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);
        uint256 tokenId = profile.reputationNFTId;

        console.log("\n==============================================");
        console.log("REPUTATION NFT");
        console.log("==============================================");

        try nft.getMetadata(tokenId) returns (ReputationNFT.NFTMetadata memory metadata) {
            console.log("Token ID:", tokenId);
            console.log("Owner:", user);
            console.log("");
            console.log("TruthScore:", metadata.truthScore);
            console.log("Tier:", _tierToString(metadata.tier));
            console.log("Total Predictions:", metadata.totalPredictions);
            console.log("Correct Predictions:", metadata.correctPredictions);
            console.log("Win Rate:", metadata.winRate / 100, ".", metadata.winRate % 100, "%");
            console.log("Total Volume:", metadata.totalVolume / 1e18, "BNB");
            console.log("");
            console.log("Connected Platforms:");
            for (uint256 i = 0; i < metadata.connectedPlatforms.length; i++) {
                console.log("  -", metadata.connectedPlatforms[i]);
            }
            console.log("");
            console.log("Minted:", metadata.mintTimestamp);
            console.log("Last Update:", metadata.lastUpdate);
            console.log("");
            console.log("View on Explorer:");
            console.log(_getExplorerUrl(), "/token/", addressToString(address(nft)), "?a=", tokenId);
        } catch {
            console.log("ERROR: Could not fetch NFT metadata");
        }

        console.log("==============================================\n");
    }

    /**
     * @notice View connected platforms
     */
    function viewPlatforms() external view {
        _loadContracts();
        address user = vm.envOr("USER", msg.sender);

        if (!core.hasRegistered(user)) {
            console.log("User not registered");
            return;
        }

        uint256[] memory platformIds = core.getConnectedPlatforms(user);

        console.log("\n==============================================");
        console.log("CONNECTED PLATFORMS");
        console.log("==============================================");
        console.log("User:", user);
        console.log("Connected:", platformIds.length);
        console.log("----------------------------------------------\n");

        if (platformIds.length == 0) {
            console.log("No platforms connected");
        } else {
            for (uint256 i = 0; i < platformIds.length; i++) {
                uint256 platformId = platformIds[i];
                PlatformRegistry.Platform memory platform = registry.getPlatform(platformId);

                console.log("Platform", i + 1, ":");
                console.log("  ID:", platformId);
                console.log("  Name:", platform.name);
                console.log("  Type:", _platformTypeToString(platform.platformType));
                console.log("  Active:", platform.isActive);
                console.log("  Adapter:", platform.adapter);
                console.log("");
            }
        }

        console.log("==============================================\n");
    }

    /**
     * @notice View score breakdown
     */
    function viewScoreBreakdown() external view {
        _loadContracts();
        address user = vm.envOr("USER", msg.sender);

        if (!core.hasRegistered(user)) {
            console.log("User not registered");
            return;
        }

        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);

        if (profile.totalPredictions == 0) {
            console.log("No predictions yet");
            return;
        }

        console.log("\n==============================================");
        console.log("TRUTHSCORE BREAKDOWN");
        console.log("==============================================");
        console.log("User:", user);
        console.log("----------------------------------------------\n");

        ScoreCalculator.ScoreBreakdown memory breakdown =
            calculator.calculateScoreWithBreakdown(profile.totalPredictions, profile.correctPredictions, profile.totalVolume);

        console.log("Total TruthScore:", breakdown.totalScore);
        console.log("");
        console.log("Component Breakdown:");
        console.log("  Win Rate:", breakdown.winRate / 100, ".", breakdown.winRate % 100, "%");
        console.log("  Win Rate Points:", breakdown.winRatePoints);
        console.log("  Volume Multiplier:", breakdown.volumeMultiplier);
        console.log("  Volume (BNB):", breakdown.volumeInBnb / 100, ".", breakdown.volumeInBnb % 100);
        console.log("");
        console.log("Tier:", _calcTierToString(breakdown.tier));
        console.log("Tier Threshold:", calculator.getTierThreshold(breakdown.tier));

        if (breakdown.tier != ScoreCalculator.Tier.DIAMOND) {
            uint256 nextRequired = calculator.getNextTierRequirement(breakdown.totalScore);
            console.log("Next Tier at:", nextRequired);
            console.log("Points Needed:", nextRequired - breakdown.totalScore);
        }

        console.log("==============================================\n");
    }

    /**
     * @notice Compare two users
     */
    function compareUsers(address user1, address user2) external view {
        _loadContracts();

        console.log("\n==============================================");
        console.log("USER COMPARISON");
        console.log("==============================================\n");

        bool registered1 = core.hasRegistered(user1);
        bool registered2 = core.hasRegistered(user2);

        if (!registered1 || !registered2) {
            console.log("ERROR: Both users must be registered");
            console.log("User 1:", registered1 ? "Registered" : "Not registered");
            console.log("User 2:", registered2 ? "Registered" : "Not registered");
            return;
        }

        TruthBountyCore.UserProfile memory profile1 = core.getUserProfile(user1);
        TruthBountyCore.UserProfile memory profile2 = core.getUserProfile(user2);

        // User 1
        console.log("USER 1:", user1);
        console.log("----------------------------------------------");
        console.log("TruthScore:", profile1.truthScore);
        console.log("Total Predictions:", profile1.totalPredictions);
        console.log("Win Rate:", core.getWinRate(user1) / 100, ".", core.getWinRate(user1) % 100, "%");
        console.log("Volume:", profile1.totalVolume / 1e18, "BNB");
        console.log("");

        // User 2
        console.log("USER 2:", user2);
        console.log("----------------------------------------------");
        console.log("TruthScore:", profile2.truthScore);
        console.log("Total Predictions:", profile2.totalPredictions);
        console.log("Win Rate:", core.getWinRate(user2) / 100, ".", core.getWinRate(user2) % 100, "%");
        console.log("Volume:", profile2.totalVolume / 1e18, "BNB");
        console.log("");

        // Comparison
        console.log("COMPARISON");
        console.log("----------------------------------------------");
        if (profile1.truthScore > profile2.truthScore) {
            console.log("User 1 has higher TruthScore (+", profile1.truthScore - profile2.truthScore, ")");
        } else if (profile2.truthScore > profile1.truthScore) {
            console.log("User 2 has higher TruthScore (+", profile2.truthScore - profile1.truthScore, ")");
        } else {
            console.log("Equal TruthScore");
        }

        console.log("==============================================\n");
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Display complete profile
     */
    function _displayFullProfile(address user) internal view {
        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);
        uint256 winRate = core.getWinRate(user);

        console.log("USER:", user);
        console.log("==============================================");
        console.log("");

        // Basic Info
        console.log("BASIC INFORMATION");
        console.log("----------------------------------------------");
        console.log("NFT Token ID:", profile.reputationNFTId);
        console.log("Registered:", _formatTimestamp(profile.createdAt));
        console.log("Last Update:", _formatTimestamp(profile.lastUpdate));
        console.log("");

        // Reputation
        console.log("REPUTATION");
        console.log("----------------------------------------------");
        console.log("TruthScore:", profile.truthScore);

        try nft.getTier(profile.reputationNFTId) returns (ReputationNFT.ReputationTier tier) {
            console.log("Tier:", _tierToString(tier));
        } catch {}

        console.log("");

        // Performance Stats
        console.log("PERFORMANCE STATISTICS");
        console.log("----------------------------------------------");
        console.log("Total Predictions:", profile.totalPredictions);
        console.log("Correct Predictions:", profile.correctPredictions);

        if (profile.totalPredictions > 0) {
            console.log("Wrong Predictions:", profile.totalPredictions - profile.correctPredictions);
            console.log("Win Rate:", winRate / 100, ".", winRate % 100, "%");
            console.log("Accuracy:", (profile.correctPredictions * 100) / profile.totalPredictions, "%");
        }

        console.log("Total Volume:", profile.totalVolume / 1e18, "BNB");

        if (profile.totalPredictions > 0) {
            console.log("Avg Volume/Bet:", (profile.totalVolume / profile.totalPredictions) / 1e18, "BNB");
        }

        console.log("");

        // Platforms
        console.log("CONNECTED PLATFORMS");
        console.log("----------------------------------------------");
        console.log("Count:", profile.connectedPlatforms.length);

        if (profile.connectedPlatforms.length > 0) {
            for (uint256 i = 0; i < profile.connectedPlatforms.length; i++) {
                try registry.getPlatform(profile.connectedPlatforms[i]) returns (PlatformRegistry.Platform memory platform)
                {
                    console.log("  ", i + 1, ".", platform.name);
                } catch {
                    console.log("  ", i + 1, ". Unknown Platform");
                }
            }
        }

        console.log("");
        console.log("==============================================");
        console.log("View NFT:", _getExplorerUrl(), "/token/", addressToString(address(nft)), "?a=", profile.reputationNFTId);
        console.log("==============================================\n");
    }

    /**
     * @dev Load contracts
     */
    function _loadContracts() internal view {
        if (block.chainid == 97) {
            require(TRUTH_BOUNTY_CORE_TESTNET != address(0), "Update TRUTH_BOUNTY_CORE_TESTNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_TESTNET);
            nft = ReputationNFT(REPUTATION_NFT_TESTNET);
            registry = PlatformRegistry(PLATFORM_REGISTRY_TESTNET);
            calculator = ScoreCalculator(SCORE_CALCULATOR_TESTNET);
        } else if (block.chainid == 56) {
            require(TRUTH_BOUNTY_CORE_MAINNET != address(0), "Update TRUTH_BOUNTY_CORE_MAINNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_MAINNET);
            nft = ReputationNFT(REPUTATION_NFT_MAINNET);
            registry = PlatformRegistry(PLATFORM_REGISTRY_MAINNET);
            calculator = ScoreCalculator(SCORE_CALCULATOR_MAINNET);
        } else {
            revert("Unsupported network");
        }
    }

    /**
     * @dev Format timestamp
     */
    function _formatTimestamp(uint256 timestamp) internal view returns (string memory) {
        if (timestamp == 0) return "Never";
        if (timestamp > block.timestamp) return "Future";

        uint256 diff = block.timestamp - timestamp;

        if (diff < 60) return string.concat(vm.toString(diff), " seconds ago");
        if (diff < 3600) return string.concat(vm.toString(diff / 60), " minutes ago");
        if (diff < 86400) return string.concat(vm.toString(diff / 3600), " hours ago");
        return string.concat(vm.toString(diff / 86400), " days ago");
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
     * @dev Get explorer URL
     */
    function _getExplorerUrl() internal view returns (string memory) {
        if (block.chainid == 97) return "https://testnet.bscscan.com";
        if (block.chainid == 56) return "https://bscscan.com";
        return "";
    }

    /**
     * @dev Convert address to string
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
     * @dev Convert tier to string
     */
    function _tierToString(ReputationNFT.ReputationTier tier) internal pure returns (string memory) {
        if (tier == ReputationNFT.ReputationTier.BRONZE) return "BRONZE";
        if (tier == ReputationNFT.ReputationTier.SILVER) return "SILVER";
        if (tier == ReputationNFT.ReputationTier.GOLD) return "GOLD";
        if (tier == ReputationNFT.ReputationTier.PLATINUM) return "PLATINUM";
        if (tier == ReputationNFT.ReputationTier.DIAMOND) return "DIAMOND";
        return "UNKNOWN";
    }

    /**
     * @dev Convert calculator tier to string
     */
    function _calcTierToString(ScoreCalculator.Tier tier) internal pure returns (string memory) {
        if (tier == ScoreCalculator.Tier.BRONZE) return "BRONZE";
        if (tier == ScoreCalculator.Tier.SILVER) return "SILVER";
        if (tier == ScoreCalculator.Tier.GOLD) return "GOLD";
        if (tier == ScoreCalculator.Tier.PLATINUM) return "PLATINUM";
        if (tier == ScoreCalculator.Tier.DIAMOND) return "DIAMOND";
        return "UNKNOWN";
    }

    /**
     * @dev Convert platform type to string
     */
    function _platformTypeToString(PlatformRegistry.PlatformType platformType) internal pure returns (string memory) {
        if (platformType == PlatformRegistry.PlatformType.BINARY_PREDICTION) return "Binary Prediction";
        if (platformType == PlatformRegistry.PlatformType.SPORTS_BETTING) return "Sports Betting";
        if (platformType == PlatformRegistry.PlatformType.CATEGORICAL) return "Categorical";
        return "Custom";
    }
}
