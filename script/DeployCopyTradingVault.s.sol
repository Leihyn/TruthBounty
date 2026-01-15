// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../contracts/CopyTradingVault.sol";

contract DeployCopyTradingVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CopyTradingVault
        CopyTradingVault vault = new CopyTradingVault();
        console.log("CopyTradingVault deployed to:", address(vault));

        // Approve PancakeSwap Prediction platform
        address pancakeswapPrediction = 0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA;
        vault.setPlatformApproval(pancakeswapPrediction, true);
        console.log("PancakeSwap Prediction approved:", pancakeswapPrediction);

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("Deployment Summary:");
        console.log("===========================================");
        console.log("CopyTradingVault:", address(vault));
        console.log("Network: BSC Testnet");
        console.log("===========================================\n");

        console.log("Next steps:");
        console.log("1. Verify on BSCScan:");
        console.log(
            "   forge verify-contract",
            address(vault),
            "contracts/CopyTradingVault.sol:CopyTradingVault --chain bscTestnet"
        );
        console.log("\n2. Update frontend/.env.local:");
        console.log("   NEXT_PUBLIC_COPY_TRADING_VAULT=", address(vault));
    }
}
