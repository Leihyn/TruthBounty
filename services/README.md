# TruthBounty Blockchain Indexers

This directory contains blockchain indexers that fetch real prediction data from various platforms and store it in Supabase.

## 🎯 Supported Platforms

- ✅ **PancakeSwap Prediction** (BSC) - Fully implemented
- 🔄 **Polymarket** (Polygon) - Coming soon
- 🔄 **Azuro Protocol** (Polygon) - Coming soon
- 🔄 **Thales** (Optimism) - Coming soon

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd services
npm install
```

### 2. Configure Environment

Create `.env` file (copy from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NETWORK=testnet
```

### 3. Run Indexer

**Testnet (BSC Testnet):**
```bash
npm run dev
# or
npm run index:pancakeswap:testnet
```

**Mainnet (BSC Mainnet):**
```bash
npm run index:pancakeswap:mainnet
```

## 📊 How It Works

### PancakeSwap Indexer

The PancakeSwap indexer:

1. **Connects to BSC** (mainnet or testnet)
2. **Fetches Events:**
   - `BetBull` - User bet on bull (price up)
   - `BetBear` - User bet on bear (price down)
   - `Claim` - User claimed winnings
   - `EndRound` - Round finished with result

3. **Processes Data:**
   - Creates user records in database
   - Stores individual bets with amounts
   - Updates bet results when claimed
   - Automatically calculates user stats (wins, losses, win rate, volume)

4. **Updates Database:**
   - `users` table - Creates user if doesn't exist
   - `bets` table - Stores each bet
   - `user_platform_stats` table - Auto-updated by database trigger

### Block Processing

- **Batch Size:** 10,000 blocks per batch
- **Polling Interval:** 10 seconds
- **Error Retry:** 30 seconds
- **Resume Support:** Automatically resumes from last processed block

## 📈 Monitoring

The indexer outputs real-time progress:

```
🚀 Initializing PancakeSwap Prediction indexer...
   Network: testnet
   Contract: 0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA
✅ Platform ID: 1
📍 Resuming from block: 45678900
📊 Current block: 45689000
📈 Blocks to process: 10100

🏁 Starting indexer...

📦 Processing blocks 45678901 → 45688900
   📊 Found 234 bets, 156 claims, 89 round ends
✅ Processed up to block 45688900

📦 Processing blocks 45688901 → 45689000
   📊 Found 45 bets, 23 claims, 12 round ends
✅ Processed up to block 45689000

✅ All caught up! Waiting for new blocks...
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Required |
| `NETWORK` | `testnet` or `mainnet` | `testnet` |
| `START_BLOCK` | Block to start indexing from | Last processed or 0 |
| `BSC_RPC_URL` | Custom BSC mainnet RPC | Default BSC RPC |
| `BSC_TESTNET_RPC_URL` | Custom BSC testnet RPC | Default testnet RPC |

### Start from Specific Block

To start indexing from a specific block:

```bash
START_BLOCK=45000000 npm run dev
```

## 🗄️ Database Schema

The indexer populates these tables:

### `users`
- `id` - UUID
- `wallet_address` - User's wallet (unique)
- `username`, `bio`, `avatar_url` - Optional profile data
- `created_at`, `updated_at` - Timestamps

### `bets`
- `id` - UUID
- `user_id` - References users
- `platform_id` - References platforms (1 = PancakeSwap)
- `market_id` - Round/epoch number
- `position` - 'Bull' or 'Bear'
- `amount` - Bet amount in wei (string)
- `claimed_amount` - Winnings in wei (string, null if not claimed)
- `won` - Boolean (true/false/null)
- `tx_hash` - Transaction hash (unique)
- `block_number` - Block number
- `timestamp` - Bet timestamp
- `created_at` - Record created timestamp

### `user_platform_stats` (Auto-Updated)
This table is automatically updated by database triggers when bets are inserted:

- `user_id`, `platform_id` - Composite key
- `total_bets` - Total number of bets
- `wins` - Number of won bets
- `losses` - Number of lost bets
- `win_rate` - Percentage (0-100)
- `volume` - Total volume bet in wei
- `score` - Calculated score (wins * 10 - losses * 3)
- `last_updated` - Last update timestamp

## 🛠️ Development

### TypeScript

The indexer is written in TypeScript and uses:
- **viem** - Ethereum client
- **@supabase/supabase-js** - Database client
- **tsx** - TypeScript execution

### Adding New Platforms

To add a new platform (e.g., Polymarket):

1. Create `indexer/polymarket-indexer.ts`
2. Implement similar structure to `pancakeswap-indexer.ts`
3. Add script to `package.json`:
   ```json
   "index:polymarket": "tsx indexer/polymarket-indexer.ts"
   ```
4. Update `index:all` script to include new indexer

## ⚡ Performance

### Optimization Tips

1. **Use Archive Node** - For historical data:
   ```env
   BSC_RPC_URL=https://bsc-dataseed.binance.org/
   ```

2. **Smaller Batch Size** - If hitting rate limits:
   - Edit `batchSize` in indexer (currently 10,000)
   - Reduce to 5,000 or 1,000

3. **Parallel Processing** - Run multiple indexers:
   ```bash
   npm run index:all
   ```

## 🐛 Troubleshooting

### "Failed to get platform" Error

**Problem:** Platform not in database

**Solution:** Run Supabase schema first:
```bash
# In Supabase SQL Editor, run:
# supabase/schema.sql
```

### "Rate limited" or "429" Errors

**Problem:** Too many requests to RPC

**Solutions:**
1. Use different RPC endpoint
2. Reduce batch size
3. Increase polling interval

### "Duplicate key" Errors (23505)

**Problem:** Trying to insert same bet twice

**Solution:** This is normal and handled. The indexer will skip duplicates.

### Indexer Crashes or Hangs

**Solutions:**
1. Check RPC endpoint is accessible
2. Verify Supabase credentials
3. Check network connectivity
4. Restart indexer (it will resume from last block)

## 📝 Maintenance

### Restart Indexer

The indexer automatically saves progress. To restart:

1. Stop with `Ctrl+C`
2. Restart with `npm run dev`
3. It will resume from last processed block

### Reset and Re-index

To start from scratch:

```sql
-- In Supabase SQL Editor
DELETE FROM bets WHERE platform_id = 1;
DELETE FROM user_platform_stats WHERE platform_id = 1;
```

Then restart indexer with `START_BLOCK=0`

### Check Progress

```sql
-- Check total indexed bets
SELECT COUNT(*) FROM bets WHERE platform_id = 1;

-- Check top users
SELECT
  u.wallet_address,
  ups.total_bets,
  ups.wins,
  ups.win_rate,
  ups.score
FROM user_platform_stats ups
JOIN users u ON ups.user_id = u.id
WHERE ups.platform_id = 1
ORDER BY ups.score DESC
LIMIT 10;
```

## 🚀 Production Deployment

### Using PM2

```bash
npm install -g pm2

# Start indexer
pm2 start npm --name "pancakeswap-indexer" -- run index:pancakeswap:mainnet

# Monitor
pm2 logs pancakeswap-indexer

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "index:pancakeswap:mainnet"]
```

Build and run:
```bash
docker build -t truthbounty-indexer .
docker run -d --env-file .env truthbounty-indexer
```

## 📚 Resources

- **PancakeSwap Prediction V2:** https://github.com/pancakeswap/pancake-prediction
- **Contract Address (Mainnet):** `0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA`
- **BSC Explorer:** https://bscscan.com/address/0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA
- **Viem Docs:** https://viem.sh
- **Supabase Docs:** https://supabase.com/docs

## 🔐 Security

- ✅ Uses `anon` key (read/write access through RLS)
- ✅ No private keys needed (read-only blockchain access)
- ✅ All database writes go through RLS policies
- ✅ Credentials in `.env` (gitignored)

## ❓ Support

If you encounter issues:

1. Check logs for error messages
2. Verify Supabase connection
3. Test RPC endpoint manually
4. Check GitHub issues
