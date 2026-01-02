import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Azuro Protocol Leaderboard API
 *
 * Azuro is a decentralized betting infrastructure on Polygon, Gnosis, Arbitrum, and more.
 * Uses The Graph subgraph for data: https://gem.azuro.org/subgraph/overview
 */

// Azuro subgraph endpoints
const AZURO_SUBGRAPHS = {
  polygon: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3',
  gnosis: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v3',
  arbitrum: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-arbitrum-one-v3',
  linea: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-linea-v3',
  chiliz: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-chiliz-v3',
} as const;

type AzuroNetwork = keyof typeof AZURO_SUBGRAPHS;

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

interface AzuroBettor {
  id: string;
  rawTurnover: string;
  rawInBets: string;
  rawToPayout: string;
  rawBiggestBetPayout: string;
  betsCount: string;
  wonBetsCount: string;
  lostBetsCount: string;
  canceledBetsCount: string;
  redeemedBetsCount: string;
  pnl: string;
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
 * Calculate TruthScore for Azuro bettor
 */
function calculateAzuroScore(wins: number, totalBets: number, volume: number, pnl: number): number {
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
 * Query Azuro subgraph for top bettors
 */
async function queryAzuroSubgraph(network: AzuroNetwork, limit: number = 100): Promise<AzuroBettor[]> {
  const query = `
    query GetTopBettors($first: Int!) {
      bettors(
        first: $first
        orderBy: rawTurnover
        orderDirection: desc
        where: { betsCount_gt: "0" }
      ) {
        id
        rawTurnover
        rawInBets
        rawToPayout
        rawBiggestBetPayout
        betsCount
        wonBetsCount
        lostBetsCount
        canceledBetsCount
        redeemedBetsCount
        pnl
      }
    }
  `;

  try {
    const response = await fetch(AZURO_SUBGRAPHS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { first: limit },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Subgraph error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('Azuro subgraph errors:', result.errors);
      return [];
    }

    return result.data?.bettors || [];
  } catch (error) {
    console.error(`Azuro ${network} subgraph query failed:`, error);
    return [];
  }
}

/**
 * Fetch bettors from multiple networks and merge
 */
async function fetchAllNetworkBettors(limit: number): Promise<{ bettors: AzuroBettor[]; network: string }[]> {
  const networks: AzuroNetwork[] = ['polygon', 'gnosis', 'arbitrum'];

  const results = await Promise.all(
    networks.map(async (network) => {
      const bettors = await queryAzuroSubgraph(network, limit);
      return { bettors, network };
    })
  );

  return results.filter(r => r.bettors.length > 0);
}

/**
 * GET /api/azuro-leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') as AzuroNetwork | 'all' | null;
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const search = searchParams.get('search')?.toLowerCase();

  try {
    let allBettors: { bettor: AzuroBettor; network: string }[] = [];

    if (network && network !== 'all' && AZURO_SUBGRAPHS[network as AzuroNetwork]) {
      // Query single network
      const bettors = await queryAzuroSubgraph(network as AzuroNetwork, limit);
      allBettors = bettors.map(b => ({ bettor: b, network }));
    } else {
      // Query all networks
      const results = await fetchAllNetworkBettors(Math.ceil(limit / 3));
      for (const result of results) {
        for (const bettor of result.bettors) {
          allBettors.push({ bettor, network: result.network });
        }
      }
    }

    if (allBettors.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        source: 'none',
        platform: 'Azuro',
        network: network || 'all',
        error: 'Azuro subgraph unavailable. Please try again later.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = allBettors.map(({ bettor, network: net }) => {
      const volume = parseFloat(bettor.rawTurnover || '0') / 1e18; // Convert from wei
      const pnl = parseFloat(bettor.pnl || '0') / 1e18;
      const totalBets = parseInt(bettor.betsCount || '0');
      const wins = parseInt(bettor.wonBetsCount || '0');
      const losses = parseInt(bettor.lostBetsCount || '0');
      const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

      const score = calculateAzuroScore(wins, totalBets, volume, pnl);

      return {
        rank: 0, // Will be set after sorting
        address: bettor.id,
        truthScore: score,
        winRate: Math.round(winRate * 10) / 10,
        totalBets,
        wins,
        losses,
        totalVolume: volume.toFixed(2),
        pnl,
        platforms: ['Azuro'],
        network: net,
      };
    });

    // Sort by TruthScore
    leaderboard.sort((a, b) => b.truthScore - a.truthScore);

    // Assign ranks
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Filter by search if provided
    let filteredData = leaderboard;
    if (search) {
      filteredData = leaderboard.filter(entry =>
        entry.address.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData.slice(0, limit),
      count: filteredData.length,
      isMock: false,
      source: 'azuro-subgraph',
      platform: 'Azuro',
      network: network || 'all',
      networks: ['polygon', 'gnosis', 'arbitrum'],
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Azuro leaderboard error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      source: 'none',
      platform: 'Azuro',
      network: network || 'all',
      error: `Azuro API error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
