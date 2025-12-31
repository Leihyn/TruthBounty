import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PancakeSwap Prediction Leaderboard API
 *
 * Fetches real user data from PancakeSwap Prediction V2 subgraph on The Graph.
 * Data includes total bets, volume, win rate, and profit/loss.
 */

// Graph API key (from thales-data - works for any subgraph)
const GRAPH_API_KEY = 'a6068becfe82e6542c05ec1385be2942';

// PancakeSwap Prediction V2 subgraph ID
const PANCAKE_PREDICTION_SUBGRAPH = '4kRuZVKCR9dsG2ePXhLSiKw5oaw3YMJo4nAwxZbUaqVY';

const SUBGRAPH_URL = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${PANCAKE_PREDICTION_SUBGRAPH}`;

// Scoring config (matches main leaderboard)
const SCORING_CONFIG = {
  MAX_SCORE: 1300,
  MIN_BETS_FOR_LEADERBOARD: 10,
  MIN_BETS_FOR_FULL_SCORE: 100,
  SKILL_MAX: 500,
  ACTIVITY_MAX: 500,
  VOLUME_MAX: 200,
  WILSON_Z: 1.96,
};

interface PancakeUser {
  id: string;
  totalBets: string;
  totalBNB: string;
  netBNB: string;
  winRate: string;
  totalBetsBull?: string;
  totalBetsBear?: string;
  totalBNBBull?: string;
  totalBNBBear?: string;
  averageBNB?: string;
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
  network: string;
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
 * Calculate TruthScore for PancakeSwap user
 *
 * Uses baseline-adjusted scoring: Since binary prediction has 50% random chance,
 * skill score is based on performance ABOVE the 50% baseline.
 */
function calculatePancakeScore(winRate: number, totalBets: number, volumeBNB: number, pnlBNB: number): number {
  if (totalBets < SCORING_CONFIG.MIN_BETS_FOR_LEADERBOARD) {
    return 0;
  }

  // Calculate wins from win rate
  const wins = Math.floor(totalBets * (winRate / 100));

  // Wilson Score adjusted win rate (conservative estimate for sample size)
  const wilsonWinRate = wilsonScoreLower(wins, totalBets);

  // Skill Score: Based on Wilson-adjusted win rate MINUS 50% baseline
  // Binary prediction has 50% random chance, so only reward performance above that
  // (adjustedWinRate - 0.5) * 1000 means:
  // - 50% win rate → 0 points (random chance)
  // - 55% win rate → 50 points
  // - 60% win rate → 100 points
  // - 65% win rate → 150 points
  const skillScore = Math.min(
    SCORING_CONFIG.SKILL_MAX,
    Math.max(0, Math.floor((wilsonWinRate - 0.5) * 1000))
  );

  // Activity Score: Logarithmic based on number of WINS (not volume)
  // log10(10) = 1 → 166 pts, log10(100) = 2 → 332 pts, log10(1000) = 3 → 498 pts
  const activityScore = wins > 0
    ? Math.min(SCORING_CONFIG.ACTIVITY_MAX, Math.floor(Math.log10(wins) * 166))
    : 0;

  // Volume Bonus: Logarithmic based on volume in BNB (0-200)
  const volumeBonus = volumeBNB >= 1
    ? Math.min(SCORING_CONFIG.VOLUME_MAX, Math.floor(Math.log10(volumeBNB) * 100))
    : 0;

  // Sample size multiplier (higher threshold for PancakeSwap due to high frequency)
  const sampleMultiplier = Math.min(1, totalBets / SCORING_CONFIG.MIN_BETS_FOR_FULL_SCORE);

  const rawScore = skillScore + activityScore + volumeBonus;
  return Math.min(SCORING_CONFIG.MAX_SCORE, Math.floor(rawScore * sampleMultiplier));
}

/**
 * Query PancakeSwap Prediction subgraph
 */
async function queryPancakeSubgraph(limit: number = 100, orderBy: string = 'totalBets'): Promise<PancakeUser[]> {
  const query = `
    query GetTopUsers($first: Int!, $orderBy: String!) {
      users(
        first: $first
        orderBy: $orderBy
        orderDirection: desc
        where: { totalBets_gt: "0" }
      ) {
        id
        totalBets
        totalBNB
        netBNB
        winRate
        totalBetsBull
        totalBetsBear
        totalBNBBull
        totalBNBBear
        averageBNB
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { first: limit, orderBy },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Subgraph error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('PancakeSwap subgraph errors:', result.errors);
      return [];
    }

    return result.data?.users || [];
  } catch (error) {
    console.error('PancakeSwap subgraph query failed:', error);
    return [];
  }
}

/**
 * GET /api/pancakeswap-leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const search = searchParams.get('search')?.toLowerCase();
  const orderBy = searchParams.get('orderBy') || 'totalBets'; // totalBets, totalBNB, netBNB, winRate

  try {
    // Query subgraph for top users
    const users = await queryPancakeSubgraph(limit * 2, orderBy); // Get more to filter

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        source: 'none',
        platform: 'PancakeSwap Prediction',
        network: 'BSC',
        error: 'PancakeSwap Prediction subgraph unavailable. Try again later.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = users.map((user, index) => {
      const totalBets = parseInt(user.totalBets || '0');
      const volumeBNB = parseFloat(user.totalBNB || '0');
      const pnlBNB = parseFloat(user.netBNB || '0');
      const winRate = parseFloat(user.winRate || '0');

      const wins = Math.floor(totalBets * (winRate / 100));
      const losses = totalBets - wins;

      const score = calculatePancakeScore(winRate, totalBets, volumeBNB, pnlBNB);

      return {
        rank: index + 1,
        address: user.id,
        truthScore: score,
        winRate: Math.round(winRate * 100) / 100,
        totalBets,
        wins,
        losses,
        totalVolume: volumeBNB.toFixed(2),
        pnl: pnlBNB,
        platforms: ['PancakeSwap Prediction'],
        network: 'BSC',
      };
    });

    // Filter only users with enough bets
    const qualifiedUsers = leaderboard.filter(
      entry => entry.totalBets >= SCORING_CONFIG.MIN_BETS_FOR_LEADERBOARD
    );

    // Sort by TruthScore
    qualifiedUsers.sort((a, b) => b.truthScore - a.truthScore);

    // Re-rank after sorting
    qualifiedUsers.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Apply search filter
    let filteredData = qualifiedUsers;
    if (search) {
      filteredData = qualifiedUsers.filter(entry =>
        entry.address.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData.slice(0, limit),
      count: filteredData.length,
      isMock: false,
      source: 'pancakeswap-subgraph',
      platform: 'PancakeSwap Prediction',
      network: 'BSC',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('PancakeSwap leaderboard error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      source: 'none',
      platform: 'PancakeSwap Prediction',
      network: 'BSC',
      error: `PancakeSwap subgraph error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
