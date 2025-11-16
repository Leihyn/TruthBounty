# TruthBounty Deployments

This directory contains deployment information for TruthBounty contracts across different networks.

## Structure

Each network has its own JSON file:
- `bnb-testnet.json` - BNB Chain Testnet (Chain ID: 97)
- `bnb-mainnet.json` - BNB Chain Mainnet (Chain ID: 56)
- `*.json.example` - Example templates

## Deployment Process

### Prerequisites

1. **Get BNB for gas**:
   - **Testnet**: https://testnet.binance.org/faucet-smart
   - **Mainnet**: Purchase BNB on an exchange

2. **Get BscScan API Key**:
   - Visit: https://bscscan.com/myapikey
   - Create account and generate API key
   - Add to `.env` file

3. **Set up environment**:
   ```bash
   cd contracts
   cp .env.example .env
   # Edit .env with your private key and API key
   ```

### Deploy to BNB Testnet

```bash
# Make sure you're in contracts directory
cd contracts

# Load environment variables
source .env

# Deploy and verify
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### Deploy to BNB Mainnet

```bash
# ⚠️ MAINNET DEPLOYMENT - USE WITH CAUTION ⚠️

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BNB_MAINNET_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### Deployment Output

The script will:
1. Deploy all 5 contracts in order
2. Configure relationships (NFT minter, platform registration)
3. Print deployment summary
4. Generate JSON with all addresses
5. Verify contracts on BscScan (if `--verify` flag used)

### Save Deployment Addresses

Copy the JSON output from the script and save to:
- `deployments/bnb-testnet.json` (for testnet)
- `deployments/bnb-mainnet.json` (for mainnet)

## Contract Verification

### Automatic Verification

The `--verify` flag will automatically verify contracts during deployment.

### Manual Verification

If automatic verification fails:

```bash
# Verify ReputationNFT
forge verify-contract <ADDRESS> \
  src/core/ReputationNFT.sol:ReputationNFT \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "<OWNER_ADDRESS>")

# Verify ScoreCalculator
forge verify-contract <ADDRESS> \
  src/core/ScoreCalculator.sol:ScoreCalculator \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify PlatformRegistry
forge verify-contract <ADDRESS> \
  src/core/PlatformRegistry.sol:PlatformRegistry \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify TruthBountyCore
forge verify-contract <ADDRESS> \
  src/core/TruthBountyCore.sol:TruthBountyCore \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" "<NFT>" "<CALC>" "<REGISTRY>")

# Verify PancakePredictionAdapter
forge verify-contract <ADDRESS> \
  src/adapters/PancakePredictionAdapter.sol:PancakePredictionAdapter \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "<PANCAKE_PREDICTION>")
```

## Post-Deployment Checklist

After deployment, verify:

- [ ] All contracts deployed successfully
- [ ] All contracts verified on BscScan
- [ ] TruthBountyCore set as NFT minter
- [ ] PancakePrediction platform registered in registry
- [ ] Platform is active in registry
- [ ] Deployer address is owner of all contracts
- [ ] Deployment addresses saved to JSON file
- [ ] Frontend updated with new contract addresses

## Interacting with Deployed Contracts

### Using Cast

```bash
# Register a user
cast send <TRUTH_BOUNTY_CORE> "registerUser()" \
  --rpc-url $BNB_TESTNET_RPC \
  --private-key $PRIVATE_KEY

# Connect platform
cast send <TRUTH_BOUNTY_CORE> "connectPlatform(uint256)" 1 \
  --rpc-url $BNB_TESTNET_RPC \
  --private-key $PRIVATE_KEY

# Check user profile
cast call <TRUTH_BOUNTY_CORE> "getUserProfile(address)" <USER_ADDRESS> \
  --rpc-url $BNB_TESTNET_RPC
```

### Using Frontend

Update your frontend configuration with deployed addresses:

```typescript
// config/contracts.ts
export const CONTRACTS = {
  TRUTH_BOUNTY_CORE: '0x...',
  REPUTATION_NFT: '0x...',
  PLATFORM_REGISTRY: '0x...',
  // ... etc
}
```

## Gas Costs (Approximate)

| Contract | Gas Used | BNB (30 gwei) |
|----------|----------|---------------|
| ReputationNFT | 2,500,000 | ~0.075 BNB |
| ScoreCalculator | 500,000 | ~0.015 BNB |
| PlatformRegistry | 1,000,000 | ~0.030 BNB |
| TruthBountyCore | 1,500,000 | ~0.045 BNB |
| PancakeAdapter | 800,000 | ~0.024 BNB |
| **Total** | **~6,300,000** | **~0.189 BNB** |

*Prices vary with gas price. Add 20-30% buffer for configuration transactions.*

## Troubleshooting

### Error: "Insufficient funds for gas"
- Get more BNB from faucet (testnet) or exchange (mainnet)
- Current balance: `cast balance <YOUR_ADDRESS> --rpc-url $BNB_TESTNET_RPC`

### Error: "Contract verification failed"
- Wait 30 seconds and try manual verification
- Check that contract is deployed: `cast code <ADDRESS> --rpc-url $BNB_TESTNET_RPC`
- Verify API key is correct: `echo $BSCSCAN_API_KEY`

### Error: "Nonce too low"
- Clear transaction queue: `cast nonce <YOUR_ADDRESS> --rpc-url $BNB_TESTNET_RPC`
- Wait a few minutes and retry

### Error: "Transaction underpriced"
- Increase gas price in foundry.toml
- Or use legacy transactions: Add `--legacy` flag

## Security Notes

⚠️ **IMPORTANT**:
- NEVER commit `.env` file with real private keys
- Use hardware wallet for mainnet deployments
- Test thoroughly on testnet first
- Verify all contract addresses after deployment
- Transfer ownership to multisig for production

## Support

For deployment issues:
- Check Foundry docs: https://book.getfoundry.sh/
- BscScan docs: https://docs.bscscan.com/
- GitHub Issues: https://github.com/truthbounty/issues
