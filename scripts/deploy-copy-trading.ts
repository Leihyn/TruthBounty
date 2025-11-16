/**
 * Deploy CopyTradingVault contract to BSC Testnet
 *
 * Prerequisites:
 * 1. Install dependencies: npm install --save-dev @nomiclabs/hardhat-ethers ethers
 * 2. Configure hardhat.config.ts with BSC testnet
 * 3. Get testnet BNB from https://testnet.binance.org/faucet-smart
 * 4. Set PRIVATE_KEY in .env
 *
 * Usage:
 *   npx hardhat run scripts/deploy-copy-trading.ts --network bscTestnet
 */

import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying CopyTradingVault contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'BNB\n');

  if (balance < ethers.parseEther('0.1')) {
    console.warn('⚠️  Low balance! Get testnet BNB from https://testnet.binance.org/faucet-smart\n');
  }

  // Deploy CopyTradingVault
  console.log('📦 Deploying CopyTradingVault...');
  const CopyTradingVault = await ethers.getContractFactory('CopyTradingVault');
  const vault = await CopyTradingVault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log('✅ CopyTradingVault deployed to:', vaultAddress);

  // Approve PancakeSwap Prediction contract
  const PANCAKESWAP_PREDICTION = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';
  console.log('\n🔧 Approving PancakeSwap Prediction platform...');
  const approveTx = await vault.setPlatformApproval(PANCAKESWAP_PREDICTION, true);
  await approveTx.wait();
  console.log('✅ PancakeSwap Prediction approved');

  // Summary
  console.log('\n📋 Deployment Summary:');
  console.log('==========================================');
  console.log('CopyTradingVault:', vaultAddress);
  console.log('Network:', 'BSC Testnet');
  console.log('Deployer:', deployer.address);
  console.log('==========================================\n');

  console.log('📝 Next steps:');
  console.log('1. Verify contract on BSCScan:');
  console.log(`   npx hardhat verify --network bscTestnet ${vaultAddress}`);
  console.log('\n2. Update frontend/.env.local with:');
  console.log(`   NEXT_PUBLIC_COPY_TRADING_VAULT=${vaultAddress}`);
  console.log('\n3. Test deposit:');
  console.log(`   Visit https://testnet.bscscan.com/address/${vaultAddress}`);
  console.log('   Call deposit() with 0.01 BNB');
  console.log('\n4. Configure bet watcher service to use this contract');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
