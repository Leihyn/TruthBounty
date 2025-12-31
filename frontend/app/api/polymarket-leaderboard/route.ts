import { NextRequest, NextResponse } from 'next/server';

/**
 * Polymarket Leaderboard API
 * Fetches real trader data from Polymarket's official Data API
 * Endpoint: https://data-api.polymarket.com/v1/leaderboard
 */

const POLYMARKET_LEADERBOARD_URL = 'https://data-api.polymarket.com/v1/leaderboard';

export interface PolymarketTrader {
  rank: string;
  proxyWallet: string;
  userName?: string;
  vol: number;      // Volume in USD
  pnl: number;      // Profit/Loss in USD
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query params
    const params = new URLSearchParams({
      category: searchParams.get('category') || 'OVERALL',
      timePeriod: searchParams.get('timePeriod') || 'ALL',
      orderBy: searchParams.get('orderBy') || 'PNL',
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    });

    // Optional user filter
    const user = searchParams.get('user');
    if (user) params.append('user', user);

    const response = await fetch(`${POLYMARKET_LEADERBOARD_URL}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const traders: PolymarketTrader[] = await response.json();

    // Transform to match our leaderboard format
    const transformedData = traders.map((trader, index) => {
      const volume = trader.vol || 0;
      const pnl = trader.pnl || 0;
      const winRate = calculateWinRate(trader);
      const truthScore = calculateTruthScore(trader);

      // Estimate trades from volume (avg trade ~$500)
      const estimatedTrades = Math.max(1, Math.floor(volume / 500));
      const estimatedWinRate = winRate / 100;
      const estimatedWins = Math.floor(estimatedTrades * estimatedWinRate);
      const estimatedLosses = estimatedTrades - estimatedWins;

      return {
        rank: parseInt(trader.rank) || index + 1,
        address: trader.proxyWallet,
        username: trader.userName || null,
        truthScore,
        winRate,
        totalBets: estimatedTrades,
        wins: estimatedWins,
        losses: estimatedLosses,
        totalVolume: volume.toFixed(2), // Keep as USD string, not wei
        pnl,
        platforms: ['Polymarket'],
        platformBreakdown: [{
          platform: 'Polymarket',
          bets: estimatedTrades,
          winRate,
          score: truthScore,
          volume: volume.toFixed(2),
          pnl,
        }],
        profileImage: trader.profileImage,
        xUsername: trader.xUsername,
        verifiedBadge: trader.verifiedBadge,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: 'polymarket-api',
      timestamp: Date.now(),
      count: transformedData.length,
    });

  } catch (error: any) {
    console.error('Polymarket Leaderboard API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      data: [],
    }, { status: 500 });
  }
}

// Scoring config (matches other platforms - max 1300)
const SCORING_CONFIG = {
  MAX_SCORE: 1300,
  SKILL_MAX: 500,
  ACTIVITY_MAX: 500,
  PROFIT_MAX: 200,
  WILSON_Z: 1.96,
};

/**
 * Wilson Score Lower Bound - conservative estimate for small samples
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
 * Calculate TruthScore from Polymarket data
 * Normalized to 0-1300 scale like other platforms
 */
function calculateTruthScore(trader: PolymarketTrader): number {
  const pnl = trader.pnl || 0;
  const volume = trader.vol || 0;

  if (volume <= 0) return 0;

  // ROI = PnL / Volume (can be negative or positive)
  const roi = pnl / volume;

  // Estimate win rate from ROI (ROI of 0 = 50% win rate approximately)
  // Positive ROI suggests >50%, negative suggests <50%
  const estimatedWinRate = Math.max(0.1, Math.min(0.95, 0.5 + roi));

  // Estimate number of trades from volume (assume avg trade is $500)
  const estimatedTrades = Math.max(1, Math.floor(volume / 500));
  const estimatedWins = Math.floor(estimatedTrades * estimatedWinRate);

  // Skill Score: Wilson-adjusted win rate (0-500)
  const wilsonWinRate = wilsonScoreLower(estimatedWins, estimatedTrades);
  const skillScore = Math.min(
    SCORING_CONFIG.SKILL_MAX,
    Math.max(0, Math.floor(wilsonWinRate * SCORING_CONFIG.SKILL_MAX))
  );

  // Activity Score: Logarithmic based on volume (0-500)
  // $1000 = ~195, $10000 = ~260, $100000 = ~325, $1M = ~390, $10M = ~455
  const activityScore = Math.min(
    SCORING_CONFIG.ACTIVITY_MAX,
    Math.max(0, Math.floor(Math.log10(Math.max(1, volume)) * 65))
  );

  // Profit Bonus: Based on positive PnL (0-200)
  // Uses log scale: $100 = ~100, $1000 = ~150, $10000 = ~200
  const profitBonus = pnl > 0
    ? Math.min(SCORING_CONFIG.PROFIT_MAX, Math.floor(Math.log10(Math.max(1, pnl)) * 50))
    : 0;

  // Sample size multiplier (more trades = more reliable score)
  const sampleMultiplier = Math.min(1, estimatedTrades / 50);

  const rawScore = skillScore + activityScore + profitBonus;
  return Math.min(SCORING_CONFIG.MAX_SCORE, Math.floor(rawScore * sampleMultiplier));
}

/**
 * Estimate win rate from PnL and volume
 * This is an approximation since exact trade count isn't available
 */
function calculateWinRate(trader: PolymarketTrader): number {
  const pnl = trader.pnl || 0;
  const volume = trader.vol || 1;

  // ROI-based estimation
  const roi = pnl / volume;

  // Convert ROI to approximate win rate
  // Positive ROI suggests >50% win rate
  if (roi > 0) {
    return Math.min(95, 50 + (roi * 100));
  } else {
    return Math.max(5, 50 + (roi * 100));
  }
}
