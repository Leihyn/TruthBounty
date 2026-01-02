import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * SX Bet Leaderboard API
 *
 * SX Bet is a decentralized sports betting platform on SX Network.
 * API: https://api.sx.bet/ (Documentation: https://api.docs.sx.bet/)
 *
 * Note: SX Bet doesn't have a public leaderboard API, so we aggregate
 * trader data from recent trades.
 */

const SX_API = 'https://api.sx.bet';

// Scoring config (matches main leaderboard)
const SCORING_CONFIG = {
  MAX_SCORE: 1300,
  MIN_BETS_FOR_LEADERBOARD: 5,
  MIN_BETS_FOR_FULL_SCORE: 50,
  SKILL_MAX: 500,
  ACTIVITY_MAX: 500,
  VOLUME_MAX: 200,
  WILSON_Z: 1.96,
};

interface SXTrade {
  tradeHash: string;
  bettor: string;
  baseToken: string;
  stake: string;
  odds: string;
  maker: boolean;
  betTime: number;
  settleTime?: number;
  settled: boolean;
  won?: boolean;
  marketHash: string;
}

interface TraderStats {
  address: string;
  totalBets: number;
  wins: number;
  losses: number;
  volume: number;
  pnl: number;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
  wins: number;
  losses: number;
  totalVolume: string;
  pnl: number;
  platforms: string[];
}

/**
 * Wilson Score Lower Bound
 */
function wilsonScoreLower(wins: number, total: number, z = SCORING_CONFIG.WILSON_Z): number {
  if (total === 0) return 0;
  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (center - spread) / denominator);
}

/**
 * Calculate TruthScore
 */
function calculateScore(wins: number, totalBets: number, volume: number, pnl: number): number {
  if (totalBets < SCORING_CONFIG.MIN_BETS_FOR_LEADERBOARD) {
    return 0;
  }

  // Skill Score: Wilson Score based (0-500)
  const wilsonWinRate = wilsonScoreLower(wins, totalBets);
  const skillScore = Math.min(
    SCORING_CONFIG.SKILL_MAX,
    Math.max(0, Math.floor(wilsonWinRate * SCORING_CONFIG.SKILL_MAX))
  );

  // Activity Score: Logarithmic based on volume (0-500)
  const activityScore = volume > 0
    ? Math.min(SCORING_CONFIG.ACTIVITY_MAX, Math.max(0, Math.floor(Math.log10(volume) * 65)))
    : 0;

  // Profit Bonus: Based on PnL (0-200)
  const profitBonus = pnl > 0
    ? Math.min(SCORING_CONFIG.VOLUME_MAX, Math.floor(Math.log10(pnl) * 50))
    : 0;

  // Sample size multiplier
  const sampleMultiplier = Math.min(1, totalBets / SCORING_CONFIG.MIN_BETS_FOR_FULL_SCORE);

  const rawScore = skillScore + activityScore + profitBonus;
  return Math.min(SCORING_CONFIG.MAX_SCORE, Math.floor(rawScore * sampleMultiplier));
}

/**
 * Fetch recent trades from SX Bet
 */
async function fetchRecentTrades(limit: number = 1000): Promise<SXTrade[]> {
  try {
    const response = await fetch(
      `${SX_API}/trades?pageSize=${limit}&settled=true`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error('SX Bet trades API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('SX Bet trades fetch failed:', error);
    return [];
  }
}

/**
 * Aggregate trades into trader stats
 */
function aggregateTraderStats(trades: SXTrade[]): TraderStats[] {
  const traderMap = new Map<string, TraderStats>();

  for (const trade of trades) {
    const address = trade.bettor?.toLowerCase();
    if (!address) continue;

    let stats = traderMap.get(address);
    if (!stats) {
      stats = {
        address,
        totalBets: 0,
        wins: 0,
        losses: 0,
        volume: 0,
        pnl: 0,
      };
      traderMap.set(address, stats);
    }

    stats.totalBets++;

    // Parse stake (in wei)
    const stake = parseFloat(trade.stake || '0') / 1e18;
    stats.volume += stake;

    if (trade.settled && trade.won !== undefined) {
      if (trade.won) {
        stats.wins++;
        const odds = parseFloat(trade.odds || '1') / 1e18;
        stats.pnl += stake * (odds - 1);
      } else {
        stats.losses++;
        stats.pnl -= stake;
      }
    }
  }

  return Array.from(traderMap.values());
}

/**
 * GET /api/sxbet-leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const search = searchParams.get('search')?.toLowerCase();

  try {
    // Fetch recent trades
    const trades = await fetchRecentTrades(2000);

    if (trades.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        source: 'none',
        platform: 'SX Bet',
        error: 'Could not fetch trades from SX Bet API. The API may be temporarily unavailable.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Aggregate into trader stats
    const traderStats = aggregateTraderStats(trades);

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = traderStats.map(stats => {
      const score = calculateScore(stats.wins, stats.totalBets, stats.volume, stats.pnl);
      const winRate = stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0;

      return {
        rank: 0,
        address: stats.address,
        truthScore: score,
        winRate: Math.round(winRate * 10) / 10,
        totalBets: stats.totalBets,
        wins: stats.wins,
        losses: stats.losses,
        totalVolume: stats.volume.toFixed(2),
        pnl: stats.pnl,
        platforms: ['SX Bet'],
      };
    });

    // Sort by TruthScore
    leaderboard.sort((a, b) => b.truthScore - a.truthScore);

    // Filter out zero-score entries and assign ranks
    const ranked = leaderboard
      .filter(e => e.truthScore > 0)
      .slice(0, limit);

    ranked.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Filter by search if provided
    let filteredData = ranked;
    if (search) {
      filteredData = ranked.filter(entry =>
        entry.address.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      count: filteredData.length,
      totalTraders: traderStats.length,
      isMock: false,
      source: 'sxbet-trades',
      platform: 'SX Bet',
      chain: 'SX Network',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('SX Bet leaderboard error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      source: 'none',
      platform: 'SX Bet',
      error: `SX Bet API error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
