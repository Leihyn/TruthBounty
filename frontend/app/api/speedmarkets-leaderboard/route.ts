import { NextRequest, NextResponse } from 'next/server';
import { calculateTruthScore, TRUTHSCORE_CONFIG } from '@/lib/truthscore';

export const dynamic = 'force-dynamic';

/**
 * Thales Speed Markets Leaderboard API
 *
 * Speed Markets allow users to predict if BTC/ETH price will go UP or DOWN
 * within a short timeframe (5 min to 24 hours) on Optimism.
 *
 * Uses Thales subgraph via The Graph's decentralized network.
 * Uses unified TruthScore v2.0 system (binary market scoring).
 */

// Graph API key for DigitalOptions/Thales Markets (from thales-data)
const GRAPH_API_KEY = 'a6068becfe82e6542c05ec1385be2942';

// Subgraph IDs for DigitalOptions (Thales Markets)
const SUBGRAPH_IDS = {
  optimism: 'GADfDRePpbqyjK2Y3JkQTBPBVQj98imhgKo7oRWW7RqQ',
  arbitrum: 'FZH9ySiLCdqKrwefaospe6seSqV1ZoW4FvPQUGP7MFob',
} as const;

const THALES_SPEED_SUBGRAPHS = {
  optimism: `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS.optimism}`,
  arbitrum: `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS.arbitrum}`,
} as const;

interface SpeedMarketUser {
  id: string;
  volume: string;
  pnl: string;
  trades: string;
  wins?: number;
  losses?: number;
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
  asset?: string;
}


/**
 * Query Thales subgraph for speed market users using PositionBalance entity
 * This provides accurate win/loss data based on market results
 */
async function querySpeedMarketsSubgraph(network: 'optimism' | 'arbitrum', limit: number = 100): Promise<SpeedMarketUser[]> {
  // Query PositionBalance with market result for accurate win determination
  // result: 0 = long wins (price > strike), 1 = short wins (price < strike)
  const query = `
    query GetSpeedMarketUsers($first: Int!) {
      positionBalances(
        first: $first
        orderBy: paid
        orderDirection: desc
      ) {
        account
        paid
        amount
        position {
          side
          market {
            result
            isOpen
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(THALES_SPEED_SUBGRAPHS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { first: 1000 }, // Get many positions to aggregate users
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Subgraph error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('Speed Markets subgraph errors:', result.errors);
      return [];
    }

    // Aggregate positions by user
    const userMap = new Map<string, {
      volume: number;
      pnl: number;
      trades: number;
      wins: number;
    }>();

    const positions = result.data?.positionBalances || [];

    for (const pos of positions) {
      const account = pos.account?.toLowerCase();
      if (!account) continue;

      const paid = parseFloat(pos.paid || '0') / 1e18; // Amount paid for position (sUSD)
      const remaining = parseFloat(pos.amount || '0') / 1e18; // Remaining balance
      const side = pos.position?.side; // 'long' or 'short'
      const marketResult = pos.position?.market?.result; // 0 = long wins, 1 = short wins
      const isOpen = pos.position?.market?.isOpen;

      const existing = userMap.get(account) || { volume: 0, pnl: 0, trades: 0, wins: 0 };

      // Count as a trade and add to volume
      existing.volume += paid;
      existing.trades += 1;

      // Determine win/loss if market is resolved
      if (!isOpen && marketResult !== null && marketResult !== undefined) {
        // result=0 means long wins, result=1 means short wins
        const isWin = (side === 'long' && marketResult === 0) ||
                      (side === 'short' && marketResult === 1);

        if (isWin) {
          existing.wins += 1;
          // Approximate payout (typically 2x for binary options minus fees)
          existing.pnl += paid * 0.8; // Net profit after ~90% payout
        } else {
          existing.pnl -= paid; // Lost the position
        }
      } else if (remaining > 0) {
        // Position still open, neutral PnL for now
      } else {
        // Closed position with 0 remaining = loss
        existing.pnl -= paid;
      }

      userMap.set(account, existing);
    }

    return Array.from(userMap.entries()).map(([id, stats]) => ({
      id,
      volume: (stats.volume * 1e18).toString(),
      pnl: (stats.pnl * 1e18).toString(),
      trades: stats.trades.toString(),
      wins: stats.wins,
      losses: stats.trades - stats.wins,
    }));
  } catch (error) {
    console.error(`Speed Markets ${network} subgraph query failed:`, error);
    return [];
  }
}


/**
 * GET /api/speedmarkets-leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = (searchParams.get('network') || 'optimism') as 'optimism' | 'arbitrum';
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const search = searchParams.get('search')?.toLowerCase();

  try {
    // Query subgraph for users
    const users = await querySpeedMarketsSubgraph(network, limit);

    if (users.length === 0) {
      // Subgraph unavailable - return error (no mock data)
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        source: 'none',
        platform: 'Speed Markets',
        network,
        error: 'Thales subgraph unavailable. The Graph hosted service was sunset in June 2024. A Graph API key may be required.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = users.map((user, index) => {
      const volume = parseFloat(user.volume) / 1e18;
      const pnl = parseFloat(user.pnl || '0') / 1e18;
      const trades = parseInt(user.trades || '0');
      const wins = user.wins || 0;
      const losses = user.losses || trades - wins;

      // Use unified TruthScore system (binary market)
      const scoreResult = calculateTruthScore({
        wins,
        losses,
        totalBets: trades,
        platform: 'Speed Markets',
      });
      const score = scoreResult.score;
      const winRate = trades > 0 ? (wins / trades) * 100 : 0;

      return {
        rank: index + 1,
        address: user.id,
        truthScore: score,
        winRate,
        totalBets: trades,
        wins,
        losses,
        totalVolume: volume.toFixed(2),
        pnl,
        platforms: ['Speed Markets'],
        network,
      };
    });

    // Sort by score
    leaderboard.sort((a, b) => b.truthScore - a.truthScore);

    // Re-rank after sorting
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Filter only users with enough bets (allow lower threshold for Speed Markets since it has fewer indexed transactions)
    const qualifiedUsers = leaderboard.filter(
      entry => entry.totalBets >= 1
    );

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
      source: 'thales-subgraph',
      platform: 'Speed Markets',
      network,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Speed Markets leaderboard error:', error);

    // Return error (no mock data)
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      source: 'none',
      platform: 'Speed Markets',
      network,
      error: `Thales subgraph error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
