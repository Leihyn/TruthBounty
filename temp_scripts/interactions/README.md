# TruthBounty Interaction Scripts

Scripts for interacting with deployed TruthBounty contracts for testing and management.

## 📁 Scripts

| Script | Purpose | Broadcast? |
|--------|---------|------------|
| `RegisterUser.s.sol` | Register new user + mint NFT | ✅ Yes |
| `ImportPredictions.s.sol` | Import prediction data | ✅ Yes |
| `UpdateScore.s.sol` | Update TruthScore | ✅ Yes |
| `ViewUserProfile.s.sol` | View user profile | ❌ No (read-only) |

---

## 🚀 Quick Start

### 1. Update Contract Addresses

After deployment, update addresses in each script:

```solidity
// In each script file, update these:
address constant TRUTH_BOUNTY_CORE_TESTNET = 0x...; // Your deployed address
address constant REPUTATION_NFT_TESTNET = 0x...;
address constant PLATFORM_REGISTRY_TESTNET = 0x...;
address constant SCORE_CALCULATOR_TESTNET = 0x...;
```

### 2. Run Scripts

```bash
# Example: Register a user
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

---

## 📖 Script Details

### 1. RegisterUser.s.sol

**Purpose**: Register a new user and mint their reputation NFT

**Usage**:
```bash
# Register current wallet
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv

# Register with specific private key
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvv
```

**Output**:
```
==============================================
SUCCESS - User Registered!
==============================================
User: 0x...
NFT Token ID: 1
View NFT on Explorer: https://testnet.bscscan.com/token/0x...?a=1
==============================================

USER PROFILE
----------------------------------------------
Address: 0x...
NFT Token ID: 1
TruthScore: 0
Total Predictions: 0
Correct Predictions: 0
Total Volume: 0 BNB
Connected Platforms: 0
```

**Error Handling**:
- Checks if already registered
- Shows existing token ID if registered

---

### 2. ImportPredictions.s.sol

**Purpose**: Import prediction data for testing

**Default Usage** (mock data):
```bash
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

**Custom Data** (via environment variables):
```bash
# Import custom stats
PLATFORM_ID=1 TOTAL=100 CORRECT=75 VOLUME=10 \
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

**Preset Scenarios**:

```bash
# Beginner (20 bets, 60% win rate, 1 BNB)
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importBeginner()" \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast

# Intermediate (100 bets, 75% win rate, 10 BNB)
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importIntermediate()" \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast

# Expert (500 bets, 85% win rate, 100 BNB)
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importExpert()" \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast

# Whale (1000 bets, 70% win rate, 500 BNB)
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importWhale()" \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast
```

**Output**:
```
==============================================
IMPORT PREDICTIONS
==============================================
Platform: PancakePrediction V2
Total Predictions: 100
Correct Predictions: 75
Win Rate: 75.00%
Total Volume: 10 BNB

SUCCESS - Predictions Imported!
==============================================

UPDATED USER PROFILE
----------------------------------------------
TruthScore: 2371
Total Predictions: 100
Correct Predictions: 75
Win Rate: 75.00%
Total Volume: 10 BNB
Reputation Tier: PLATINUM
```

**Error Handling**:
- User must be registered first
- Platform must be active
- Auto-connects platform if needed
- Rate limiting: 1 hour between imports
- Prevents duplicate batch imports

---

### 3. UpdateScore.s.sol

**Purpose**: Update TruthScore and NFT metadata

**Update Own Score**:
```bash
forge script script/interactions/UpdateScore.s.sol:UpdateScore \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

**Update Specific User**:
```bash
USER=0x123... forge script script/interactions/UpdateScore.s.sol:UpdateScore \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

**Batch Update** (multiple users):
```bash
forge script script/interactions/UpdateScore.s.sol:UpdateScore \
  --sig "batchUpdate()" \
  --rpc-url $BNB_TESTNET_RPC \
  --broadcast \
  -vvv
```

**Output**:
```
BEFORE UPDATE:
----------------------------------------------
TruthScore: 2300
Total Predictions: 100
Correct Predictions: 75
Total Volume: 10 BNB
Calculated Score: 2371

==============================================
SUCCESS - Score Updated!
==============================================
Old Score: 2300
New Score: 2371
Increase: +71
==============================================

TIER PROGRESSION
----------------------------------------------
Current Tier: PLATINUM
Current Score: 2371
Next Tier at: 5000
Points Needed: 2629
Progress: 12%
```

**Error Handling**:
- User must be registered
- Requires at least 1 prediction
- Shows error if contract paused

---

### 4. ViewUserProfile.s.sol

**Purpose**: View complete user profile (read-only, no broadcast needed)

**View Own Profile**:
```bash
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**View Specific User**:
```bash
USER=0x123... forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**View NFT Only**:
```bash
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --sig "viewNFT()" \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**View Platforms**:
```bash
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --sig "viewPlatforms()" \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**View Score Breakdown**:
```bash
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --sig "viewScoreBreakdown()" \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**Compare Two Users**:
```bash
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --sig "compareUsers(address,address)" 0x123... 0x456... \
  --rpc-url $BNB_TESTNET_RPC \
  -vvv
```

**Output**:
```
==============================================
TRUTHBOUNTY USER PROFILE
==============================================

USER: 0x...
==============================================

BASIC INFORMATION
----------------------------------------------
NFT Token ID: 1
Registered: 2 hours ago
Last Update: 5 minutes ago

REPUTATION
----------------------------------------------
TruthScore: 2371
Tier: PLATINUM

PERFORMANCE STATISTICS
----------------------------------------------
Total Predictions: 100
Correct Predictions: 75
Wrong Predictions: 25
Win Rate: 75.00%
Accuracy: 75%
Total Volume: 10 BNB
Avg Volume/Bet: 0.1 BNB

CONNECTED PLATFORMS
----------------------------------------------
Count: 1
  1. PancakePrediction V2

==============================================
View NFT: https://testnet.bscscan.com/token/0x...?a=1
==============================================
```

---

## 🔄 Complete User Journey

Run these scripts in order to test the full flow:

```bash
# 1. Register user
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC --broadcast -vvv

# 2. Import predictions (intermediate scenario)
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importIntermediate()" \
  --rpc-url $BNB_TESTNET_RPC --broadcast -vvv

# 3. Update score
forge script script/interactions/UpdateScore.s.sol:UpdateScore \
  --rpc-url $BNB_TESTNET_RPC --broadcast -vvv

# 4. View profile
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --rpc-url $BNB_TESTNET_RPC -vvv
```

---

## 📊 Testing Scenarios

### Scenario 1: New Beginner Trader

```bash
# Register
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC --broadcast

# Import beginner stats
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importBeginner()" \
  --rpc-url $BNB_TESTNET_RPC --broadcast

# Expected: BRONZE tier, ~600 score
```

### Scenario 2: Experienced Trader

```bash
# Import expert stats
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importExpert()" \
  --rpc-url $BNB_TESTNET_RPC --broadcast

# Expected: DIAMOND tier, ~8000+ score
```

### Scenario 3: Multiple Imports (Progression)

```bash
# Import beginner
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importBeginner()" \
  --rpc-url $BNB_TESTNET_RPC --broadcast

# Wait 1 hour (rate limit)
sleep 3600

# Import intermediate
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --sig "importIntermediate()" \
  --rpc-url $BNB_TESTNET_RPC --broadcast

# View progression
forge script script/interactions/ViewUserProfile.s.sol:ViewUserProfile \
  --rpc-url $BNB_TESTNET_RPC
```

---

## 🛠️ Environment Variables

Scripts support these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `USER` | Target user address | `0x123...` |
| `PLATFORM_ID` | Platform to import from | `1` |
| `TOTAL` | Total predictions | `100` |
| `CORRECT` | Correct predictions | `75` |
| `VOLUME` | Total volume in BNB | `10` |

**Usage**:
```bash
PLATFORM_ID=1 TOTAL=200 CORRECT=160 VOLUME=25 \
forge script script/interactions/ImportPredictions.s.sol:ImportPredictions \
  --rpc-url $BNB_TESTNET_RPC --broadcast
```

---

## 🔍 Troubleshooting

### "User not registered"
```bash
# Run RegisterUser first
forge script script/interactions/RegisterUser.s.sol:RegisterUser \
  --rpc-url $BNB_TESTNET_RPC --broadcast
```

### "Platform not connected"
```bash
# ImportPredictions auto-connects, or manually:
cast send <TRUTH_BOUNTY_CORE> "connectPlatform(uint256)" 1 \
  --rpc-url $BNB_TESTNET_RPC --private-key $PRIVATE_KEY
```

### "Rate limit exceeded"
```bash
# Check last import time
cast call <TRUTH_BOUNTY_CORE> "lastImportTime(address)" <YOUR_ADDRESS> \
  --rpc-url $BNB_TESTNET_RPC

# Wait 1 hour or use different user
```

### "Update contract addresses"
Edit each script file and update the constant addresses at the top:
```solidity
address constant TRUTH_BOUNTY_CORE_TESTNET = 0xYOUR_ADDRESS;
```

---

## 📚 Additional Commands

### Check if user is registered
```bash
cast call <TRUTH_BOUNTY_CORE> \
  "hasRegistered(address)" <USER_ADDRESS> \
  --rpc-url $BNB_TESTNET_RPC
```

### Get user's token ID
```bash
cast call <REPUTATION_NFT> \
  "tokenOfOwner(address)" <USER_ADDRESS> \
  --rpc-url $BNB_TESTNET_RPC
```

### Get platform count
```bash
cast call <PLATFORM_REGISTRY> \
  "getPlatformCount()" \
  --rpc-url $BNB_TESTNET_RPC
```

### View NFT metadata on-chain
```bash
cast call <REPUTATION_NFT> \
  "tokenURI(uint256)" 1 \
  --rpc-url $BNB_TESTNET_RPC
```

---

## 🎯 Best Practices

1. **Always update addresses** after deployment
2. **Use dry runs** first (no `--broadcast`)
3. **Check user is registered** before other operations
4. **Respect rate limits** (1 hour between imports)
5. **Use preset scenarios** for consistent testing
6. **Save test user addresses** for repeated testing

---

**Generated for TruthBounty MVP - Seedify Hackathon**
