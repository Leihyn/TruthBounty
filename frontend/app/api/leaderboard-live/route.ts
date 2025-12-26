import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// PancakeSwap Prediction V2 on BSC Mainnet
const PANCAKE_PREDICTION = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';

// Event signatures
const BET_BULL_TOPIC = ethers.id('BetBull(address,uint256,uint256)');
const BET_BEAR_TOPIC = ethers.id('BetBear(address,uint256,uint256)');
const CLAIM_TOPIC = ethers.id('Claim(address,uint256,uint256)');

// BSC RPC endpoints
const BSC_RPCS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
];

// Cache for leaderboard data (refresh every 10 minutes)
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface TraderStats {
  address: string;
  totalBets: number;
  bullBets: number;
  bearBets: number;
  claims: number;
  totalBetAmount: bigint;
  totalClaimedAmount: bigint;
  estimatedWinRate: number;
  truthScore: number;
}

async function getProvider(): Promise<ethers.JsonRpcProvider> {
  for (const rpc of BSC_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      await provider.getBlockNumber();
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error('All BSC RPCs failed');
}

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function indexTraders(provider: ethers.JsonRpcProvider): Promise<TraderStats[]> {
  const currentBlock = await provider.getBlockNumber();

  // Scan last ~4 hours only (BSC ~3s per block = ~4800 blocks)
  // This avoids rate limits while still getting active traders
  const blocksToScan = 2000; // ~1.5 hours
  const fromBlock = currentBlock - blocksToScan;

  console.log(`[Leaderboard] Scanning blocks ${fromBlock} to ${currentBlock}`);

  const tradersMap = new Map<string, TraderStats>();

  // Helper to update trader stats
  const updateTrader = (address: string, update: Partial<TraderStats>) => {
    const existing = tradersMap.get(address.toLowerCase()) || {
      address: address.toLowerCase(),
      totalBets: 0,
      bullBets: 0,
      bearBets: 0,
      claims: 0,
      totalBetAmount: 0n,
      totalClaimedAmount: 0n,
      estimatedWinRate: 0,
      truthScore: 0,
    };

    tradersMap.set(address.toLowerCase(), {
      ...existing,
      ...update,
      totalBets: (existing.totalBets || 0) + (update.totalBets || 0),
      bullBets: (existing.bullBets || 0) + (update.bullBets || 0),
      bearBets: (existing.bearBets || 0) + (update.bearBets || 0),
      claims: (existing.claims || 0) + (update.claims || 0),
      totalBetAmount: (existing.totalBetAmount || 0n) + (update.totalBetAmount || 0n),
      totalClaimedAmount: (existing.totalClaimedAmount || 0n) + (update.totalClaimedAmount || 0n),
    });
  };

  // Scan in smaller chunks with delays to avoid rate limits
  const chunkSize = 500; // Smaller chunks

  for (let start = fromBlock; start < currentBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, currentBlock);

    try {
      // Add delay between requests to avoid rate limiting
      await delay(200);

      // Get BetBull events
      const bullLogs = await provider.getLogs({
        address: PANCAKE_PREDICTION,
        topics: [BET_BULL_TOPIC],
        fromBlock: start,
        toBlock: end,
      });

      for (const log of bullLogs) {
        const sender = '0x' + log.topics[1]?.slice(26);
        const amount = BigInt(log.data.slice(0, 66));
        updateTrader(sender, { bullBets: 1, totalBets: 1, totalBetAmount: amount });
      }

      await delay(200);

      // Get BetBear events
      const bearLogs = await provider.getLogs({
        address: PANCAKE_PREDICTION,
        topics: [BET_BEAR_TOPIC],
        fromBlock: start,
        toBlock: end,
      });

      for (const log of bearLogs) {
        const sender = '0x' + log.topics[1]?.slice(26);
        const amount = BigInt(log.data.slice(0, 66));
        updateTrader(sender, { bearBets: 1, totalBets: 1, totalBetAmount: amount });
      }

      await delay(200);

      // Get Claim events
      const claimLogs = await provider.getLogs({
        address: PANCAKE_PREDICTION,
        topics: [CLAIM_TOPIC],
        fromBlock: start,
        toBlock: end,
      });

      for (const log of claimLogs) {
        const sender = '0x' + log.topics[1]?.slice(26);
        const amount = BigInt(log.data.slice(0, 66));
        updateTrader(sender, { claims: 1, totalClaimedAmount: amount });
      }

      console.log(`[Leaderboard] Scanned blocks ${start}-${end}, found ${tradersMap.size} traders so far`);

    } catch (error: any) {
      console.error(`[Leaderboard] Error scanning blocks ${start}-${end}:`, error.message);
      // Wait longer on error
      await delay(1000);
    }
  }

  // Calculate win rate and score for each trader
  const traders = Array.from(tradersMap.values()).map(trader => {
    // Estimate win rate from claims vs bets
    const estimatedWinRate = trader.totalBets > 0
      ? Math.min(100, (trader.claims / trader.totalBets) * 100)
      : 0;

    // Calculate TruthScore
    // Formula: (wins * 100) + (winRate bonus) + (volume bonus)
    const winPoints = trader.claims * 100;
    const winRateBonus = estimatedWinRate > 55 ? (estimatedWinRate - 55) * 10 : 0;
    const volumeBNB = Number(trader.totalBetAmount) / 1e18;
    const volumeBonus = Math.min(500, Math.floor(volumeBNB * 10));

    const truthScore = Math.floor(winPoints + winRateBonus + volumeBonus);

    return {
      ...trader,
      estimatedWinRate: Math.round(estimatedWinRate * 10) / 10,
      truthScore,
    };
  });

  // Sort by TruthScore descending
  traders.sort((a, b) => b.truthScore - a.truthScore);

  // Return top 100
  return traders.slice(0, 100);
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      });
    }

    console.log('[Leaderboard] Fetching fresh data from BSC...');

    const provider = await getProvider();
    const traders = await indexTraders(provider);

    // Format for leaderboard
    const leaderboardData = traders
      .filter(t => t.totalBets >= 5) // Minimum 5 bets to appear
      .map((trader, index) => ({
        rank: index + 1,
        address: trader.address,
        truthScore: trader.truthScore,
        tier: trader.truthScore >= 2000 ? 4 : trader.truthScore >= 1000 ? 3 : trader.truthScore >= 500 ? 2 : trader.truthScore >= 200 ? 1 : 0,
        winRate: trader.estimatedWinRate,
        totalBets: trader.totalBets,
        wins: trader.claims,
        losses: trader.totalBets - trader.claims,
        totalVolume: trader.totalBetAmount.toString(),
        platforms: ['PancakeSwap Prediction'],
        platformBreakdown: [{
          platform: 'PancakeSwap Prediction',
          bets: trader.totalBets,
          winRate: trader.estimatedWinRate,
          score: trader.truthScore,
          volume: trader.totalBetAmount.toString(),
        }],
      }));

    // Update cache
    cachedData = {
      data: leaderboardData,
      totalUsers: leaderboardData.length,
      timestamp: now,
      source: 'bsc-live',
      blocksScanned: 50000,
    };
    cacheTimestamp = now;

    console.log(`[Leaderboard] Found ${leaderboardData.length} traders`);

    return NextResponse.json({
      ...cachedData,
      cached: false,
    });

  } catch (error: any) {
    console.error('[Leaderboard] Error:', error);
    return NextResponse.json({
      data: [],
      error: error.message,
      source: 'error',
    }, { status: 500 });
  }
}
