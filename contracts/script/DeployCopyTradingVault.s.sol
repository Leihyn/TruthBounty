// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CopyTradingVault} from "../src/core/CopyTradingVault.sol";

/**
 * @title DeployCopyTradingVault
 * @notice Deployment script for the CopyTradingVault contract
 *
 * Usage:
 *   # Deploy to BSC Testnet
 *   forge script script/DeployCopyTradingVault.s.sol:DeployCopyTradingVault \
 *     --rpc-url $BSC_TESTNET_RPC \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 *   # Deploy to BSC Mainnet
 *   forge script script/DeployCopyTradingVault.s.sol:DeployCopyTradingVault \
 *     --rpc-url $BSC_MAINNET_RPC \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployCopyTradingVault is Script {
    function run() external {
        // Get executor address from environment
        // This should be your backend's hot wallet address
        address executor = vm.envAddress("COPY_TRADING_EXECUTOR");

        console.log("Deploying CopyTradingVault...");
        console.log("Executor address:", executor);

        vm.startBroadcast();

        CopyTradingVault vault = new CopyTradingVault(executor);

        vm.stopBroadcast();

        console.log("=================================");
        console.log("CopyTradingVault deployed to:", address(vault));
        console.log("Executor:", executor);
        console.log("Owner:", vault.owner());
        console.log("=================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update frontend/lib/contracts.ts with the new address");
        console.log("2. Set COPY_TRADING_VAULT_ADDRESS in your backend .env");
        console.log("3. Fund the executor wallet with BNB for gas");
        console.log("4. Start the monitoring service");
    }
}
