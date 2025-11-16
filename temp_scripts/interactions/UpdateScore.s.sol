// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "@forge-std/Script.sol";
import {TruthBountyCore} from "../../src/core/TruthBountyCore.sol";
import {ReputationNFT} from "../../src/core/ReputationNFT.sol";
import {ScoreCalculator} from "../../src/core/ScoreCalculator.sol";

/**
 * @title UpdateScore
 * @notice Updates TruthScore and NFT metadata for a user
 * @dev Interaction script for testing deployed contracts
 * @author TruthBounty Team
 *
 * USAGE:
 * Update own score:
 *   forge script script/interactions/UpdateScore.s.sol:UpdateScore \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvv
 *
 * Update specific user (requires no gas from target):
 *   USER=0x123... forge script script/interactions/UpdateScore.s.sol:UpdateScore \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvv
 */
contract UpdateScore is Script {
    // ============================================
    // Contract Addresses (Update after deployment)
    // ============================================

    // BNB Testnet addresses - UPDATE THESE
    address constant TRUTH_BOUNTY_CORE_TESTNET = address(0); // UPDATE
    address constant REPUTATION_NFT_TESTNET = address(0); // UPDATE
    address constant SCORE_CALCULATOR_TESTNET = address(0); // UPDATE

    // BNB Mainnet addresses
    address constant TRUTH_BOUNTY_CORE_MAINNET = address(0); // UPDATE
    address constant REPUTATION_NFT_MAINNET = address(0); // UPDATE
    address constant SCORE_CALCULATOR_MAINNET = address(0); // UPDATE

    // ============================================
    // State Variables
    // ============================================

    TruthBountyCore public core;
    ReputationNFT public nft;
    ScoreCalculator public calculator;

    // ============================================
    // Main Function
    // ============================================

    function run() external {
        // Load contracts
        _loadContracts();

        // Get user address (from env or use msg.sender)
        address user = vm.envOr("USER", msg.sender);

        console.log("\n==============================================");
        console.log("UPDATE TRUTHSCORE");
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

        // Get current profile
        TruthBountyCore.UserProfile memory profileBefore = core.getUserProfile(user);

        console.log("BEFORE UPDATE:");
        console.log("----------------------------------------------");
        console.log("TruthScore:", profileBefore.truthScore);
        console.log("Total Predictions:", profileBefore.totalPredictions);
        console.log("Correct Predictions:", profileBefore.correctPredictions);
        console.log("Total Volume:", profileBefore.totalVolume / 1e18, "BNB");
        console.log("");

        // Show calculated score
        if (profileBefore.totalPredictions > 0) {
            uint256 calculatedScore = calculator.calculateTruthScore(
                profileBefore.totalPredictions, profileBefore.correctPredictions, profileBefore.totalVolume
            );
            console.log("Calculated Score:", calculatedScore);
            console.log("");
        }

        // Update score
        vm.startBroadcast();

        try core.updateTruthScore(user) {
            vm.stopBroadcast();

            // Get updated profile
            TruthBountyCore.UserProfile memory profileAfter = core.getUserProfile(user);

            console.log("\n==============================================");
            console.log("SUCCESS - Score Updated!");
            console.log("==============================================");
            console.log("Old Score:", profileBefore.truthScore);
            console.log("New Score:", profileAfter.truthScore);

            if (profileAfter.truthScore > profileBefore.truthScore) {
                uint256 increase = profileAfter.truthScore - profileBefore.truthScore;
                console.log("Increase: +", increase);
            } else if (profileAfter.truthScore < profileBefore.truthScore) {
                uint256 decrease = profileBefore.truthScore - profileAfter.truthScore;
                console.log("Decrease: -", decrease);
            } else {
                console.log("No change");
            }

            console.log("==============================================\n");

            // Display full profile
            _displayUserProfile(user);

            // Show tier progression
            _showTierProgression(user);
        } catch Error(string memory reason) {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Update Failed");
            console.log("==============================================");
            console.log("Reason:", reason);
            console.log("\nCommon Issues:");
            console.log("- User not registered");
            console.log("- No predictions to calculate score");
            console.log("- Contract paused");
            console.log("==============================================\n");
        } catch {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Update Failed (Unknown)");
            console.log("==============================================\n");
        }
    }

    // ============================================
    // Batch Update Function
    // ============================================

    /**
     * @notice Update scores for multiple users
     */
    function batchUpdate() external {
        _loadContracts();

        // Get users from environment or use defaults
        string memory usersEnv = vm.envOr("USERS", string(""));
        address[] memory users;

        if (bytes(usersEnv).length == 0) {
            // Default: just msg.sender
            users = new address[](1);
            users[0] = msg.sender;
        } else {
            // Parse comma-separated addresses (simplified)
            users = new address[](1);
            users[0] = msg.sender;
            console.log("Note: Batch parsing not implemented, updating msg.sender only");
        }

        console.log("\n==============================================");
        console.log("BATCH UPDATE TRUTHSCORES");
        console.log("==============================================");
        console.log("Users to update:", users.length);
        console.log("==============================================\n");

        vm.startBroadcast();

        uint256 successCount = 0;
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];

            if (!core.hasRegistered(user)) {
                console.log("Skipping unregistered user:", user);
                continue;
            }

            try core.updateTruthScore(user) {
                successCount++;
                console.log("Updated:", user);
            } catch {
                console.log("Failed:", user);
            }
        }

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("Batch Update Complete");
        console.log("==============================================");
        console.log("Success:", successCount, "/", users.length);
        console.log("==============================================\n");
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Load contracts based on chain ID
     */
    function _loadContracts() internal {
        if (block.chainid == 97) {
            // BNB Testnet
            require(TRUTH_BOUNTY_CORE_TESTNET != address(0), "Update TRUTH_BOUNTY_CORE_TESTNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_TESTNET);
            nft = ReputationNFT(REPUTATION_NFT_TESTNET);
            calculator = ScoreCalculator(SCORE_CALCULATOR_TESTNET);
        } else if (block.chainid == 56) {
            // BNB Mainnet
            require(TRUTH_BOUNTY_CORE_MAINNET != address(0), "Update TRUTH_BOUNTY_CORE_MAINNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_MAINNET);
            nft = ReputationNFT(REPUTATION_NFT_MAINNET);
            calculator = ScoreCalculator(SCORE_CALCULATOR_MAINNET);
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

        console.log("----------------------------------------------");
        console.log("UPDATED USER PROFILE");
        console.log("----------------------------------------------");
        console.log("Address:", user);
        console.log("NFT Token ID:", profile.reputationNFTId);
        console.log("TruthScore:", profile.truthScore);
        console.log("Total Predictions:", profile.totalPredictions);
        console.log("Correct Predictions:", profile.correctPredictions);
        console.log("Win Rate:", winRate / 100, ".", winRate % 100, "%");
        console.log("Total Volume:", profile.totalVolume / 1e18, "BNB");
        console.log("Connected Platforms:", profile.connectedPlatforms.length);
        console.log("Last Update:", profile.lastUpdate);

        // Get tier
        try nft.getTier(profile.reputationNFTId) returns (ReputationNFT.ReputationTier tier) {
            console.log("Reputation Tier:", _tierToString(tier));
        } catch {}

        console.log("----------------------------------------------\n");
    }

    /**
     * @dev Show tier progression
     */
    function _showTierProgression(address user) internal view {
        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);

        console.log("----------------------------------------------");
        console.log("TIER PROGRESSION");
        console.log("----------------------------------------------");

        uint256 currentScore = profile.truthScore;
        ScoreCalculator.Tier currentTier = calculator.getTier(currentScore);

        console.log("Current Tier:", _tierNameToString(currentTier));
        console.log("Current Score:", currentScore);

        // Show thresholds
        console.log("");
        console.log("Tier Thresholds:");
        console.log("  BRONZE:   0 - 499");
        console.log("  SILVER:   500 - 999");
        console.log("  GOLD:     1,000 - 1,999");
        console.log("  PLATINUM: 2,000 - 4,999");
        console.log("  DIAMOND:  5,000+");

        // Show next tier requirement
        if (currentTier != ScoreCalculator.Tier.DIAMOND) {
            uint256 nextRequired = calculator.getNextTierRequirement(currentScore);
            uint256 pointsNeeded = nextRequired > currentScore ? nextRequired - currentScore : 0;

            console.log("");
            console.log("Next Tier at:", nextRequired);
            console.log("Points Needed:", pointsNeeded);

            // Calculate percentage to next tier
            uint256 currentThreshold = calculator.getTierThreshold(currentTier);
            uint256 progress = ((currentScore - currentThreshold) * 100) / (nextRequired - currentThreshold);
            console.log("Progress:", progress, "%");
        } else {
            console.log("");
            console.log("Max Tier Reached! (DIAMOND)");
        }

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
    function _tierToString(ReputationNFT.ReputationTier tier) internal pure returns (string memory) {
        if (tier == ReputationNFT.ReputationTier.BRONZE) return "BRONZE";
        if (tier == ReputationNFT.ReputationTier.SILVER) return "SILVER";
        if (tier == ReputationNFT.ReputationTier.GOLD) return "GOLD";
        if (tier == ReputationNFT.ReputationTier.PLATINUM) return "PLATINUM";
        if (tier == ReputationNFT.ReputationTier.DIAMOND) return "DIAMOND";
        return "UNKNOWN";
    }

    /**
     * @dev Convert ScoreCalculator tier to string
     */
    function _tierNameToString(ScoreCalculator.Tier tier) internal pure returns (string memory) {
        if (tier == ScoreCalculator.Tier.BRONZE) return "BRONZE";
        if (tier == ScoreCalculator.Tier.SILVER) return "SILVER";
        if (tier == ScoreCalculator.Tier.GOLD) return "GOLD";
        if (tier == ScoreCalculator.Tier.PLATINUM) return "PLATINUM";
        if (tier == ScoreCalculator.Tier.DIAMOND) return "DIAMOND";
        return "UNKNOWN";
    }
}
