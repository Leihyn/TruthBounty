// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "@forge-std/Script.sol";

/**
 * @title HelperConfig
 * @notice Network-specific configurations for TruthBounty deployment
 * @dev Provides addresses and parameters for different networks
 * @author TruthBounty Team
 */
contract HelperConfig is Script {
    // ============================================
    // Network Configuration Struct
    // ============================================

    struct NetworkConfig {
        address pancakePredictionV2;
        string networkName;
        uint256 chainId;
        string rpcUrl;
        string explorerUrl;
        string explorerApiUrl;
    }

    // ============================================
    // State Variables
    // ============================================

    NetworkConfig public activeNetworkConfig;

    /**
     * @notice Gets the active network configuration
     * @return NetworkConfig for current network
     */
    function getActiveNetworkConfig() public view returns (NetworkConfig memory) {
        return activeNetworkConfig;
    }

    // ============================================
    // Chain IDs
    // ============================================

    uint256 constant BNB_MAINNET_CHAIN_ID = 56;
    uint256 constant BNB_TESTNET_CHAIN_ID = 97;
    uint256 constant LOCAL_CHAIN_ID = 31337;

    // ============================================
    // PancakePrediction V2 Addresses
    // ============================================

    // BNB Mainnet
    address constant PANCAKE_PREDICTION_MAINNET = 0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA;

    // BNB Testnet
    address constant PANCAKE_PREDICTION_TESTNET = 0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA;

    // ============================================
    // Constructor
    // ============================================

    constructor() {
        if (block.chainid == BNB_MAINNET_CHAIN_ID) {
            activeNetworkConfig = getBnbMainnetConfig();
        } else if (block.chainid == BNB_TESTNET_CHAIN_ID) {
            activeNetworkConfig = getBnbTestnetConfig();
        } else {
            activeNetworkConfig = getAnvilConfig();
        }
    }

    // ============================================
    // Network Configurations
    // ============================================

    /**
     * @notice BNB Chain Mainnet configuration
     * @return config NetworkConfig for mainnet
     */
    function getBnbMainnetConfig() public pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            pancakePredictionV2: PANCAKE_PREDICTION_MAINNET,
            networkName: "BNB Chain Mainnet",
            chainId: BNB_MAINNET_CHAIN_ID,
            rpcUrl: "https://bsc-dataseed.binance.org/",
            explorerUrl: "https://bscscan.com",
            explorerApiUrl: "https://api.bscscan.com/api"
        });
    }

    /**
     * @notice BNB Chain Testnet configuration
     * @return config NetworkConfig for testnet
     */
    function getBnbTestnetConfig() public pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            pancakePredictionV2: PANCAKE_PREDICTION_TESTNET,
            networkName: "BNB Chain Testnet",
            chainId: BNB_TESTNET_CHAIN_ID,
            rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            explorerUrl: "https://testnet.bscscan.com",
            explorerApiUrl: "https://api-testnet.bscscan.com/api"
        });
    }

    /**
     * @notice Local Anvil/Hardhat configuration
     * @return config NetworkConfig for local development
     */
    function getAnvilConfig() public pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            pancakePredictionV2: address(0), // Deploy mock in local
            networkName: "Anvil Local",
            chainId: LOCAL_CHAIN_ID,
            rpcUrl: "http://localhost:8545",
            explorerUrl: "http://localhost:8545",
            explorerApiUrl: ""
        });
    }

    /**
     * @notice Gets configuration for specific chain ID
     * @param chainId Chain ID to get config for
     * @return config NetworkConfig for the chain
     */
    function getConfigByChainId(uint256 chainId) public pure returns (NetworkConfig memory config) {
        if (chainId == BNB_MAINNET_CHAIN_ID) {
            return getBnbMainnetConfig();
        } else if (chainId == BNB_TESTNET_CHAIN_ID) {
            return getBnbTestnetConfig();
        } else {
            return getAnvilConfig();
        }
    }

    /**
     * @notice Checks if on a live network (not local)
     * @return True if on mainnet or testnet
     */
    function isLiveNetwork() public view returns (bool) {
        return block.chainid == BNB_MAINNET_CHAIN_ID || block.chainid == BNB_TESTNET_CHAIN_ID;
    }

    /**
     * @notice Gets the current network name
     * @return Network name string
     */
    function getNetworkName() public view returns (string memory) {
        return activeNetworkConfig.networkName;
    }

    /**
     * @notice Gets PancakePrediction V2 address for current network
     * @return PancakePrediction contract address
     */
    function getPancakePredictionAddress() public view returns (address) {
        return activeNetworkConfig.pancakePredictionV2;
    }
}
