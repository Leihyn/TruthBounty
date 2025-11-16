// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "@forge-std/Script.sol";
import {TruthBountyCore} from "../../src/core/TruthBountyCore.sol";
import {ReputationNFT} from "../../src/core/ReputationNFT.sol";

/**
 * @title RegisterUser
 * @notice Registers a new user and mints their reputation NFT
 * @dev Interaction script for testing deployed contracts
 * @author TruthBounty Team
 *
 * USAGE:
 * Register current wallet:
 *   forge script script/interactions/RegisterUser.s.sol:RegisterUser \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvv
 *
 * Register specific address (via private key):
 *   forge script script/interactions/RegisterUser.s.sol:RegisterUser \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     -vvv
 */
contract RegisterUser is Script {
    // ============================================
    // Contract Addresses (Update after deployment)
    // ============================================

    // BNB Testnet addresses - UPDATE THESE
    address constant TRUTH_BOUNTY_CORE_TESTNET = address(0); // UPDATE
    address constant REPUTATION_NFT_TESTNET = address(0); // UPDATE

    // BNB Mainnet addresses
    address constant TRUTH_BOUNTY_CORE_MAINNET = address(0); // UPDATE
    address constant REPUTATION_NFT_MAINNET = address(0); // UPDATE

    // ============================================
    // State Variables
    // ============================================

    TruthBountyCore public core;
    ReputationNFT public nft;

    // ============================================
    // Main Function
    // ============================================

    function run() external {
        // Load contracts based on chain ID
        _loadContracts();

        address user = msg.sender;

        console.log("\n==============================================");
        console.log("REGISTER USER");
        console.log("==============================================");
        console.log("Network:", _getNetworkName());
        console.log("Chain ID:", block.chainid);
        console.log("User Address:", user);
        console.log("TruthBountyCore:", address(core));
        console.log("==============================================\n");

        // Check if already registered
        if (_isRegistered(user)) {
            console.log("ERROR: User already registered!");
            console.log("Token ID:", nft.tokenOfOwner(user));
            return;
        }

        // Register user
        vm.startBroadcast();

        try core.registerUser() returns (uint256 tokenId) {
            vm.stopBroadcast();

            console.log("\n==============================================");
            console.log("SUCCESS - User Registered!");
            console.log("==============================================");
            console.log("User:", user);
            console.log("NFT Token ID:", tokenId);
            console.log("View NFT on Explorer:");
            console.log(_getExplorerUrl(), "/token/", addressToString(address(nft)), "?a=", tokenId);
            console.log("==============================================\n");

            // Display user profile
            _displayUserProfile(user);
        } catch Error(string memory reason) {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Registration Failed");
            console.log("==============================================");
            console.log("Reason:", reason);
            console.log("==============================================\n");
        } catch {
            vm.stopBroadcast();
            console.log("\n==============================================");
            console.log("ERROR - Registration Failed (Unknown)");
            console.log("==============================================\n");
        }
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Load contract instances based on chain ID
     */
    function _loadContracts() internal {
        if (block.chainid == 97) {
            // BNB Testnet
            require(TRUTH_BOUNTY_CORE_TESTNET != address(0), "Update TRUTH_BOUNTY_CORE_TESTNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_TESTNET);
            nft = ReputationNFT(REPUTATION_NFT_TESTNET);
        } else if (block.chainid == 56) {
            // BNB Mainnet
            require(TRUTH_BOUNTY_CORE_MAINNET != address(0), "Update TRUTH_BOUNTY_CORE_MAINNET address");
            core = TruthBountyCore(TRUTH_BOUNTY_CORE_MAINNET);
            nft = ReputationNFT(REPUTATION_NFT_MAINNET);
        } else {
            revert("Unsupported network. Use BNB Testnet (97) or Mainnet (56)");
        }
    }

    /**
     * @dev Check if user is registered
     */
    function _isRegistered(address user) internal view returns (bool) {
        return core.hasRegistered(user);
    }

    /**
     * @dev Display user profile
     */
    function _displayUserProfile(address user) internal view {
        TruthBountyCore.UserProfile memory profile = core.getUserProfile(user);

        console.log("\n----------------------------------------------");
        console.log("USER PROFILE");
        console.log("----------------------------------------------");
        console.log("Address:", user);
        console.log("NFT Token ID:", profile.reputationNFTId);
        console.log("TruthScore:", profile.truthScore);
        console.log("Total Predictions:", profile.totalPredictions);
        console.log("Correct Predictions:", profile.correctPredictions);
        console.log("Total Volume:", profile.totalVolume / 1e18, "BNB");
        console.log("Connected Platforms:", profile.connectedPlatforms.length);
        console.log("Created At:", profile.createdAt);
        console.log("Last Update:", profile.lastUpdate);
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
}
