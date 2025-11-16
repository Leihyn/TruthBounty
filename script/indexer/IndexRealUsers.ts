import { createPublicClient, http, parseAbiItem, Address } from 'viem';
import { bsc } from 'viem/chains';
import fs from 'fs';
import path from 'path';

// PancakeSwap Prediction Contract on BSC Mainnet
const PANCAKE_PREDICTION_ADDRESS = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA' as Address;

// Simplified ABI for the events we need
const PREDICTION_ABI = [
  parseAbiItem('event BetBull(address indexed sender, uint256 indexed epoch, uint256 amount)'),
  parseAbiItem('event BetBear(address indexed sender, uint256 indexed epoch, uint256 amount)'),
  parseAbiItem('event Claim(address indexed sender, uint256 indexed epoch, uint256 amount)'),
];

interface UserBet {
  epoch: bigint;
  amount: bigint;
  position: 'bull' | 'bear';
  claimed?: boolean;
  claimedAmount?: bigint;
}

interface UserStats {
  address: Address;
  totalBets: number;
  totalVolume: bigint;
  wins: number;
  losses: number;
  unclaimed: number;
  winRate: number;
  truthScore: number;
  rank?: number;
  bets: UserBet[];
}

interface RealUsersData {
  lastIndexed: number;
  totalUsers: number;
  fromBlock: bigint;
  toBlock: bigint;
  users: UserStats[];
}

// Create public client for BSC
const client = createPublicClient({
  chain: bsc,
  transport: http('https://bsc-dataseed1.binance.org'),
});

/**
 * Calculate TruthScore based on performance
 * Formula: (winRate * 100) + (totalBets * 2) + (volume in BNB / 10)
 */
function calculateTruthScore(stats: UserStats): number {
  const winRate = stats.totalBets > 0 ? (stats.wins / stats.totalBets) : 0;
  const volumeInBNB = Number(stats.totalVolume) / 1e18;

  const score = Math.floor(
    (winRate * 1000) + // Win rate contribution (0-1000)
    (stats.totalBets * 2) + // Activity contribution
    (volumeInBNB / 10) // Volume contribution
  );

  return Math.max(0, Math.min(10000, score)); // Cap between 0-10000
}

/**
 * Fetch all bet events from PancakePrediction contract
 */
async function fetchBetEvents(fromBlock: bigint, toBlock: bigint, batchSize: bigint = 2000n) {
  console.log(`📊 Fetching bet events from block ${fromBlock} to ${toBlock}...`);

  const allBullBets: any[] = [];
  const allBearBets: any[] = [];
  const allClaims: any[] = [];

  // Fetch in batches to avoid RPC limits
  for (let start = fromBlock; start <= toBlock; start += batchSize) {
    const end = start + batchSize - 1n > toBlock ? toBlock : start + batchSize - 1n;

    console.log(`  Fetching batch: ${start} to ${end}...`);

    try {
      // Fetch BetBull events
      const bullBets = await client.getLogs({
        address: PANCAKE_PREDICTION_ADDRESS,
        event: PREDICTION_ABI[0],
        fromBlock: start,
        toBlock: end,
      });
      allBullBets.push(...bullBets);

      // Fetch BetBear events
      const bearBets = await client.getLogs({
        address: PANCAKE_PREDICTION_ADDRESS,
        event: PREDICTION_ABI[1],
        fromBlock: start,
        toBlock: end,
      });
      allBearBets.push(...bearBets);

      // Fetch Claim events
      const claims = await client.getLogs({
        address: PANCAKE_PREDICTION_ADDRESS,
        event: PREDICTION_ABI[2],
        fromBlock: start,
        toBlock: end,
      });
      allClaims.push(...claims);

      console.log(`  ✓ Bull bets: ${bullBets.length}, Bear bets: ${bearBets.length}, Claims: ${claims.length}`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ Error fetching batch ${start}-${end}:`, error);
      // Continue with next batch
    }
  }

  console.log(`\n✅ Total events fetched:`);
  console.log(`   Bull bets: ${allBullBets.length}`);
  console.log(`   Bear bets: ${allBearBets.length}`);
  console.log(`   Claims: ${allClaims.length}\n`);

  return { bullBets: allBullBets, bearBets: allBearBets, claims: allClaims };
}

/**
 * Process events and build user statistics
 */
function processUserStats(bullBets: any[], bearBets: any[], claims: any[]): Map<Address, UserStats> {
  console.log('📈 Processing user statistics...\n');

  const userMap = new Map<Address, UserStats>();

  // Process bull bets
  for (const bet of bullBets) {
    const { sender, epoch, amount } = bet.args;

    if (!userMap.has(sender)) {
      userMap.set(sender, {
        address: sender,
        totalBets: 0,
        totalVolume: 0n,
        wins: 0,
        losses: 0,
        unclaimed: 0,
        winRate: 0,
        truthScore: 0,
        bets: [],
      });
    }

    const user = userMap.get(sender)!;
    user.totalBets++;
    user.totalVolume += amount;
    user.bets.push({
      epoch,
      amount,
      position: 'bull',
      claimed: false,
    });
  }

  // Process bear bets
  for (const bet of bearBets) {
    const { sender, epoch, amount } = bet.args;

    if (!userMap.has(sender)) {
      userMap.set(sender, {
        address: sender,
        totalBets: 0,
        totalVolume: 0n,
        wins: 0,
        losses: 0,
        unclaimed: 0,
        winRate: 0,
        truthScore: 0,
        bets: [],
      });
    }

    const user = userMap.get(sender)!;
    user.totalBets++;
    user.totalVolume += amount;
    user.bets.push({
      epoch,
      amount,
      position: 'bear',
      claimed: false,
    });
  }

  // Process claims (indicates wins)
  for (const claim of claims) {
    const { sender, epoch, amount } = claim.args;

    if (!userMap.has(sender)) continue;

    const user = userMap.get(sender)!;
    const bet = user.bets.find(b => b.epoch === epoch);

    if (bet) {
      bet.claimed = true;
      bet.claimedAmount = amount;
      user.wins++;
    }
  }

  // Calculate derived stats
  for (const [address, user] of userMap) {
    user.losses = user.totalBets - user.wins;
    user.unclaimed = user.bets.filter(b => !b.claimed).length;
    user.winRate = user.totalBets > 0 ? (user.wins / user.totalBets) * 100 : 0;
    user.truthScore = calculateTruthScore(user);
  }

  console.log(`✅ Processed ${userMap.size} unique users\n`);

  return userMap;
}

/**
 * Rank users by TruthScore
 */
function rankUsers(users: UserStats[]): UserStats[] {
  // Sort by TruthScore descending
  users.sort((a, b) => b.truthScore - a.truthScore);

  // Assign ranks
  users.forEach((user, index) => {
    user.rank = index + 1;
  });

  return users;
}

/**
 * Filter and get top users
 */
function getTopUsers(users: UserStats[], minBets: number = 5, topN: number = 100): UserStats[] {
  // Filter users with minimum bet requirement
  const qualifiedUsers = users.filter(u => u.totalBets >= minBets);

  console.log(`🎯 Filtered users with ${minBets}+ bets: ${qualifiedUsers.length}`);

  // Rank all qualified users
  const rankedUsers = rankUsers(qualifiedUsers);

  // Take top N
  const topUsers = rankedUsers.slice(0, topN);

  console.log(`🏆 Selected top ${topN} users\n`);

  return topUsers;
}

/**
 * Save data to JSON file
 */
function saveToJson(data: RealUsersData, filename: string) {
  const outputDir = path.join(__dirname, '..', '..', 'frontend', 'data');
  const outputPath = path.join(outputDir, filename);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Convert BigInt to string for JSON serialization
  const jsonData = JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);

  fs.writeFileSync(outputPath, jsonData);
  console.log(`💾 Data saved to: ${outputPath}\n`);
}

/**
 * Print summary statistics
 */
function printSummary(data: RealUsersData) {
  console.log('═══════════════════════════════════════════════════');
  console.log('                    SUMMARY                        ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📅 Last Indexed: ${new Date(data.lastIndexed).toLocaleString()}`);
  console.log(`📊 Block Range: ${data.fromBlock} → ${data.toBlock}`);
  console.log(`👥 Total Users Indexed: ${data.totalUsers}`);
  console.log('\n🏆 Top 10 Users:');
  console.log('───────────────────────────────────────────────────');

  data.users.slice(0, 10).forEach((user, index) => {
    console.log(`${index + 1}. ${user.address.slice(0, 6)}...${user.address.slice(-4)}`);
    console.log(`   Score: ${user.truthScore} | Bets: ${user.totalBets} | Win Rate: ${user.winRate.toFixed(1)}%`);
    console.log(`   Volume: ${(Number(user.totalVolume) / 1e18).toFixed(4)} BNB\n`);
  });

  console.log('═══════════════════════════════════════════════════\n');
}

/**
 * Main indexer function
 */
async function main() {
  console.log('\n🚀 TruthBounty Real User Indexer\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    console.log(`📍 Current BSC block: ${currentBlock}\n`);

    // Define block range (last 100,000 blocks for demo - adjust as needed)
    // For production, you might want to index from contract deployment
    const blocksToIndex = 100000n;
    const toBlock = currentBlock;
    const fromBlock = currentBlock - blocksToIndex;

    console.log(`🔍 Indexing range: ${blocksToIndex} blocks`);
    console.log(`   From: ${fromBlock}`);
    console.log(`   To: ${toBlock}\n`);

    // Step 1: Fetch all events
    const { bullBets, bearBets, claims } = await fetchBetEvents(fromBlock, toBlock);

    // Step 2: Process user statistics
    const userMap = processUserStats(bullBets, bearBets, claims);

    // Step 3: Get top users (minimum 5 bets, top 100)
    const allUsers = Array.from(userMap.values());
    const topUsers = getTopUsers(allUsers, 5, 100);

    // Step 4: Prepare data structure
    const realUsersData: RealUsersData = {
      lastIndexed: Date.now(),
      totalUsers: topUsers.length,
      fromBlock,
      toBlock,
      users: topUsers.map(user => ({
        ...user,
        // Remove individual bets from export to keep file size manageable
        bets: [],
      })),
    };

    // Step 5: Save to JSON
    saveToJson(realUsersData, 'real-users.json');

    // Step 6: Print summary
    printSummary(realUsersData);

    console.log('✅ Indexing complete!\n');

  } catch (error) {
    console.error('❌ Error during indexing:', error);
    process.exit(1);
  }
}

// Run the indexer
main().catch(console.error);
