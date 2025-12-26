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
    const transformedData = traders.map((trader, index) => ({
      rank: parseInt(trader.rank) || index + 1,
      address: trader.proxyWallet,
      username: trader.userName || null,
      truthScore: calculateTruthScore(trader),
      winRate: calculateWinRate(trader),
      totalBets: 0, // Not available from this endpoint
      wins: 0,
      losses: 0,
      totalVolume: (trader.vol * 1e18).toString(), // Convert to wei-like format
      pnl: trader.pnl,
      platforms: ['Polymarket'],
      platformBreakdown: [{
        platform: 'Polymarket',
        bets: 0,
        winRate: calculateWinRate(trader),
        score: calculateTruthScore(trader),
        volume: (trader.vol * 1e18).toString(),
        pnl: trader.pnl,
      }],
      profileImage: trader.profileImage,
      xUsername: trader.xUsername,
      verifiedBadge: trader.verifiedBadge,
    }));

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

/**
 * Calculate TruthScore from Polymarket PnL
 * Higher PnL = better predictions = higher score
 */
function calculateTruthScore(trader: PolymarketTrader): number {
  const pnl = trader.pnl || 0;
  const volume = trader.vol || 0;

  // Base score from positive PnL (100 points per $100 profit)
  const pnlScore = Math.max(0, pnl);

  // Volume bonus (1 point per $100 volume, capped at 500)
  const volumeBonus = Math.min(500, volume / 100);

  // Win rate approximation bonus
  const winRateBonus = pnl > 0 && volume > 0
    ? Math.min(200, (pnl / volume) * 1000)
    : 0;

  return Math.floor(pnlScore + volumeBonus + winRateBonus);
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
