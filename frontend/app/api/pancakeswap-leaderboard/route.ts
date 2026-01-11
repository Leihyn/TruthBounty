import { NextRequest, NextResponse } from 'next/server';
import { calculateTruthScore, TRUTHSCORE_CONFIG } from '@/lib/truthscore';

export const dynamic = 'force-dynamic';

/**
 * PancakeSwap Prediction Leaderboard API
 *
 * Fetches real user data from PancakeSwap Prediction V2 subgraph on The Graph.
 * Data includes total bets, volume, win rate, and profit/loss.
 *
 * Uses unified TruthScore v2.0 system (binary market scoring).
 */

// Graph API key (from thales-data - works for any subgraph)
const GRAPH_API_KEY = 'a6068becfe82e6542c05ec1385be2942';

// PancakeSwap Prediction V2 subgraph ID
const PANCAKE_PREDICTION_SUBGRAPH = '4kRuZVKCR9dsG2ePXhLSiKw5oaw3YMJo4nAwxZbUaqVY';

const SUBGRAPH_URL = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${PANCAKE_PREDICTION_SUBGRAPH}`;

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

      // Use unified TruthScore system (binary market)
      const scoreResult = calculateTruthScore({
        wins,
        losses,
        totalBets,
        platform: 'PancakeSwap',
      });
      const score = scoreResult.score;

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

    // Filter only users with enough bets (using unified config)
    const qualifiedUsers = leaderboard.filter(
      entry => entry.totalBets >= TRUTHSCORE_CONFIG.MIN_BETS_BINARY
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
