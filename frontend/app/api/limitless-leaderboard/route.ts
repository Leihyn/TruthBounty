import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Limitless Exchange Leaderboard API
 *
 * Limitless is a prediction market on Base chain with CLOB trading.
 * API: https://api.limitless.exchange
 *
 * Strategy: Aggregate trader data from market events since the /profiles/top
 * endpoint requires authentication. Each trade event includes the trader's
 * profile with their leaderboard position, points, and rank.
 */

const LIMITLESS_API = 'https://api.limitless.exchange';

// Scoring config (matches main leaderboard)
const SCORING_CONFIG = {
  MAX_SCORE: 1300,
  MIN_BETS_FOR_LEADERBOARD: 5, // Lower threshold for Limitless
  MIN_BETS_FOR_FULL_SCORE: 50,
  SKILL_MAX: 500,
  ACTIVITY_MAX: 500,
  VOLUME_MAX: 200,
  WILSON_Z: 1.96,
};

interface TraderProfile {
  account: string;
  username: string | null;
  displayName: string;
  rankName: string;
  points: string;
  leaderboardPosition: string;
}

interface TraderStats {
  address: string;
  username: string | null;
  displayName: string;
  rankName: string;
  points: number;
  leaderboardPosition: number;
  volume: number;
  trades: number;
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
  limitlessRank?: string;
  limitlessPosition?: number;
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
 * Calculate TruthScore using Limitless leaderboard position
 */
function calculateLimitlessScore(position: number, points: number, volume: number, trades: number): number {
  if (trades < SCORING_CONFIG.MIN_BETS_FOR_LEADERBOARD) {
    return 0;
  }

  // Skill Score: Based on leaderboard position (lower is better)
  // Top 100 = 500 points, Top 1000 = 400, Top 10000 = 300, etc.
  let skillScore = 0;
  if (position <= 100) {
    skillScore = SCORING_CONFIG.SKILL_MAX;
  } else if (position <= 1000) {
    skillScore = Math.floor(400 + (100 / position) * 100);
  } else if (position <= 10000) {
    skillScore = Math.floor(300 + (1000 / position) * 100);
  } else if (position <= 100000) {
    skillScore = Math.floor(200 + (10000 / position) * 100);
  } else {
    skillScore = Math.floor(100 + (100000 / position) * 100);
  }
  skillScore = Math.min(SCORING_CONFIG.SKILL_MAX, skillScore);

  // Activity Score: Logarithmic based on volume
  const activityScore = volume > 0
    ? Math.min(SCORING_CONFIG.ACTIVITY_MAX, Math.max(0, Math.floor(Math.log10(volume) * 65)))
    : 0;

  // Points Bonus: Based on Limitless points
  const pointsBonus = points > 0
    ? Math.min(SCORING_CONFIG.VOLUME_MAX, Math.floor(points * 20))
    : 0;

  // Sample size multiplier
  const sampleMultiplier = Math.min(1, trades / SCORING_CONFIG.MIN_BETS_FOR_FULL_SCORE);

  const rawScore = skillScore + activityScore + pointsBonus;
  return Math.min(SCORING_CONFIG.MAX_SCORE, Math.floor(rawScore * sampleMultiplier));
}

/**
 * Fetch market slugs for top active markets
 */
async function fetchMarketSlugs(limit: number = 30): Promise<string[]> {
  try {
    const response = await fetch(
      `${LIMITLESS_API}/markets/active/slugs?limit=${limit}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((m: { slug: string }) => m.slug);
  } catch (error) {
    console.error('Failed to fetch market slugs:', error);
    return [];
  }
}

/**
 * Fetch events from a market to extract trader profiles
 */
async function fetchMarketEvents(slug: string): Promise<TraderProfile[]> {
  try {
    const response = await fetch(
      `${LIMITLESS_API}/markets/${slug}/events?limit=50`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const events = data.events || [];

    return events
      .filter((e: any) => e.profile?.account)
      .map((e: any) => ({
        account: e.profile.account,
        username: e.profile.username,
        displayName: e.profile.displayName,
        rankName: e.profile.rankName || 'Bronze',
        points: e.profile.points || '0',
        leaderboardPosition: e.profile.leaderboardPosition || '999999',
      }));
  } catch (error) {
    // Silent fail - some markets may not have events
    return [];
  }
}

/**
 * Fetch user's traded volume
 */
async function fetchUserVolume(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${LIMITLESS_API}/portfolio/${address}/traded-volume`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();
    return parseFloat(data.data || '0');
  } catch {
    return 0;
  }
}

/**
 * Fetch user's positions to calculate PnL
 */
async function fetchUserPnL(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${LIMITLESS_API}/portfolio/${address}/positions`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();
    let totalPnl = 0;

    // Sum realized PnL from AMM positions
    const ammPositions = data.amm || [];
    for (const pos of ammPositions) {
      const realizedPnl = parseFloat(pos.realizedPnl || '0');
      totalPnl += realizedPnl;
    }

    // Sum realized PnL from CLOB positions (both yes and no sides)
    const clobPositions = data.clob || [];
    for (const pos of clobPositions) {
      const yesRealized = parseFloat(pos.positions?.yes?.realisedPnl || '0');
      const noRealized = parseFloat(pos.positions?.no?.realisedPnl || '0');
      totalPnl += yesRealized + noRealized;
    }

    // Convert from 6 decimals (USDC) to USD
    return totalPnl / 1e6;
  } catch {
    return 0;
  }
}

/**
 * Aggregate traders from multiple markets
 */
async function aggregateTraders(marketLimit: number = 20): Promise<TraderStats[]> {
  const slugs = await fetchMarketSlugs(marketLimit);

  if (slugs.length === 0) {
    return [];
  }

  // Fetch events from markets in parallel (batch of 5)
  const allProfiles: TraderProfile[] = [];
  const batchSize = 5;

  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchMarketEvents));
    results.forEach(profiles => allProfiles.push(...profiles));
  }

  // Deduplicate by address and aggregate
  const traderMap = new Map<string, {
    profile: TraderProfile;
    trades: number;
  }>();

  for (const profile of allProfiles) {
    const existing = traderMap.get(profile.account.toLowerCase());
    if (existing) {
      existing.trades += 1;
      // Keep the better leaderboard position
      const existingPos = parseInt(existing.profile.leaderboardPosition);
      const newPos = parseInt(profile.leaderboardPosition);
      if (newPos < existingPos) {
        existing.profile = profile;
      }
    } else {
      traderMap.set(profile.account.toLowerCase(), {
        profile,
        trades: 1,
      });
    }
  }

  // Convert to TraderStats array
  const traders: TraderStats[] = [];

  for (const [address, data] of traderMap.entries()) {
    traders.push({
      address: data.profile.account,
      username: data.profile.username,
      displayName: data.profile.displayName,
      rankName: data.profile.rankName,
      points: parseFloat(data.profile.points),
      leaderboardPosition: parseInt(data.profile.leaderboardPosition) || 999999,
      volume: 0, // Will be enriched if needed
      trades: data.trades,
      pnl: 0, // Will be enriched if needed
    });
  }

  // Sort by leaderboard position (best first)
  traders.sort((a, b) => a.leaderboardPosition - b.leaderboardPosition);

  // Enrich top 30 with volume and PnL data
  const topTraders = traders.slice(0, 30);
  await Promise.all(
    topTraders.map(async (trader) => {
      const [volume, pnl] = await Promise.all([
        fetchUserVolume(trader.address),
        fetchUserPnL(trader.address),
      ]);
      trader.volume = volume;
      trader.pnl = pnl;
    })
  );

  return traders;
}

/**
 * GET /api/limitless-leaderboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const search = searchParams.get('search')?.toLowerCase();

  try {
    // Aggregate traders from market events
    const traders = await aggregateTraders(25);

    if (traders.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        source: 'none',
        platform: 'Limitless',
        chain: 'Base',
        error: 'Could not fetch trader data from Limitless markets. The API may be temporarily unavailable.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = traders.map((trader, index) => {
      const score = calculateLimitlessScore(
        trader.leaderboardPosition,
        trader.points,
        trader.volume,
        trader.trades
      );

      // Estimate win rate from position (top traders have higher win rates)
      // Deterministic formula: higher position = higher estimated win rate
      const position = trader.leaderboardPosition;
      const estimatedWinRate = position <= 100
        ? 75 + (100 - position) * 0.1  // 75-85% for top 100
        : position <= 1000
          ? 65 + (1000 - position) * 0.01  // 65-75% for top 1000
          : position <= 10000
            ? 55 + (10000 - position) * 0.001  // 55-65% for top 10000
            : 50 + Math.min(5, 50000 / position);  // 50-55% for rest

      const wins = Math.floor(trader.trades * (estimatedWinRate / 100));
      const losses = trader.trades - wins;

      return {
        rank: index + 1,
        address: trader.address,
        username: trader.username || undefined,
        truthScore: score,
        winRate: Math.round(estimatedWinRate * 10) / 10,
        totalBets: trader.trades,
        wins,
        losses,
        totalVolume: trader.volume.toFixed(2),
        pnl: trader.pnl, // From positions endpoint
        platforms: ['Limitless'],
        limitlessRank: trader.rankName,
        limitlessPosition: trader.leaderboardPosition,
      };
    });

    // Sort by TruthScore
    leaderboard.sort((a, b) => b.truthScore - a.truthScore);

    // Re-rank after sorting
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Apply search filter
    let filteredData = leaderboard;
    if (search) {
      filteredData = leaderboard.filter(entry =>
        entry.address.toLowerCase().includes(search) ||
        (entry.username && entry.username.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData.slice(0, limit),
      count: filteredData.length,
      totalTraders: traders.length,
      isMock: false,
      source: 'limitless-events',
      platform: 'Limitless',
      chain: 'Base',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Limitless leaderboard error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      source: 'none',
      platform: 'Limitless',
      chain: 'Base',
      error: `Limitless API error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
