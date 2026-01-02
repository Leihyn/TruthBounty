import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * SX Bet Markets API
 *
 * Fetches active betting markets from SX Bet.
 * API: https://api.sx.bet/
 */

const SX_API = 'https://api.sx.bet';

interface SXMarket {
  marketHash: string;
  outcomeOneName: string;
  outcomeTwoName: string;
  outcomeVoidName?: string;
  teamOneName: string;
  teamTwoName: string;
  type: number; // 1 = moneyline, 2 = spread, 3 = total
  sportId: number;
  leagueId: number;
  gameTime: number;
  line?: number;
  status: string;
  group1?: string; // Sport name
  group2?: string; // League name
}

interface SXSport {
  sportId: number;
  label: string;
}

interface MarketData {
  id: string;
  marketHash: string;
  type: string;
  sport: string;
  league: string;
  teamOne: string;
  teamTwo: string;
  outcomeOne: string;
  outcomeTwo: string;
  line?: number;
  gameTime: number;
  status: string;
}

// Market type mapping
const MARKET_TYPES: Record<number, string> = {
  1: 'Moneyline',
  2: 'Spread',
  3: 'Total',
  52: 'Player Props',
  63: 'Game Props',
};

// Sport ID mapping
const SPORT_NAMES: Record<number, string> = {
  1: 'Soccer',
  2: 'Basketball',
  3: 'Baseball',
  4: 'Hockey',
  5: 'MMA',
  6: 'Football',
  7: 'Tennis',
  8: 'Cricket',
  9: 'Esports',
  10: 'Golf',
};

/**
 * Fetch sports list
 */
async function fetchSports(): Promise<SXSport[]> {
  try {
    const response = await fetch(`${SX_API}/sports`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('SX Bet sports fetch failed:', error);
    return [];
  }
}

/**
 * Fetch active markets
 */
async function fetchActiveMarkets(sportId?: number): Promise<SXMarket[]> {
  try {
    let url = `${SX_API}/markets/active?pageSize=50`;
    if (sportId) {
      url += `&sportId=${sportId}`;
    }

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('SX Bet markets API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('SX Bet markets fetch failed:', error);
    return [];
  }
}

/**
 * Fetch popular markets
 */
async function fetchPopularMarkets(): Promise<SXMarket[]> {
  try {
    const response = await fetch(`${SX_API}/markets/popular`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error('SX Bet popular markets fetch failed:', error);
    return [];
  }
}

/**
 * Transform SX markets to common format
 */
function transformMarkets(markets: SXMarket[]): MarketData[] {
  return markets.map(market => ({
    id: market.marketHash,
    marketHash: market.marketHash,
    type: MARKET_TYPES[market.type] || `Type ${market.type}`,
    sport: market.group1 || SPORT_NAMES[market.sportId] || `Sport ${market.sportId}`,
    league: market.group2 || `League ${market.leagueId}`,
    teamOne: market.teamOneName,
    teamTwo: market.teamTwoName,
    outcomeOne: market.outcomeOneName,
    outcomeTwo: market.outcomeTwoName,
    line: market.line,
    gameTime: market.gameTime * 1000, // Convert to milliseconds
    status: market.status,
  }));
}

/**
 * GET /api/sxbet
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sportId = searchParams.get('sportId') ? parseInt(searchParams.get('sportId')!) : undefined;
  const popular = searchParams.get('popular') === 'true';
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

  try {
    let markets: SXMarket[];

    if (popular) {
      markets = await fetchPopularMarkets();
    } else {
      markets = await fetchActiveMarkets(sportId);
    }

    if (markets.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        platform: 'SX Bet',
        error: 'Could not fetch markets from SX Bet API.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    const transformed = transformMarkets(markets);

    // Filter to upcoming games only
    const now = Date.now();
    const upcomingMarkets = transformed.filter(m => m.gameTime > now);

    return NextResponse.json({
      success: true,
      data: upcomingMarkets.slice(0, limit),
      count: upcomingMarkets.length,
      isMock: false,
      platform: 'SX Bet',
      chain: 'SX Network',
      sports: Object.entries(SPORT_NAMES).map(([id, name]) => ({ id: parseInt(id), name })),
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('SX Bet markets error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      platform: 'SX Bet',
      error: `SX Bet API error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
