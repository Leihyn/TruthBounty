import { NextRequest, NextResponse } from 'next/server';
import { SPORT_NAMES, OvertimePredictionMarket } from '@/lib/overtime';

export const dynamic = 'force-dynamic';

// The Odds API configuration
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Map The Odds API sport keys to our sport IDs
const SPORT_KEY_MAP: Record<string, { id: number; name: string }> = {
  'americanfootball_nfl': { id: 2, name: 'Football' },
  'americanfootball_ncaaf': { id: 2, name: 'Football' },
  'basketball_nba': { id: 3, name: 'Basketball' },
  'basketball_ncaab': { id: 3, name: 'Basketball' },
  'icehockey_nhl': { id: 4, name: 'Hockey' },
  'baseball_mlb': { id: 5, name: 'Baseball' },
  'tennis_atp_wimbledon': { id: 6, name: 'Tennis' },
  'tennis_wta_wimbledon': { id: 6, name: 'Tennis' },
  'mma_mixed_martial_arts': { id: 7, name: 'MMA' },
  'soccer_epl': { id: 1, name: 'Soccer' },
  'soccer_spain_la_liga': { id: 1, name: 'Soccer' },
  'soccer_germany_bundesliga': { id: 1, name: 'Soccer' },
  'soccer_italy_serie_a': { id: 1, name: 'Soccer' },
  'soccer_france_ligue_one': { id: 1, name: 'Soccer' },
  'soccer_usa_mls': { id: 1, name: 'Soccer' },
};

// Sports to fetch (prioritized list)
const SPORTS_TO_FETCH = [
  'basketball_nba',
  'americanfootball_nfl',
  'icehockey_nhl',
  'soccer_epl',
  'mma_mixed_martial_arts',
  'baseball_mlb',
];

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

/**
 * Fetch odds from The Odds API
 */
async function fetchOddsAPI(sport: string): Promise<OddsAPIEvent[]> {
  if (!ODDS_API_KEY) {
    throw new Error('ODDS_API_KEY not configured');
  }

  const url = `${ODDS_API_BASE}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=decimal`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    if (response.status === 429) {
      throw new Error('API rate limit exceeded');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Transform The Odds API event to our format
 */
function transformEvent(event: OddsAPIEvent, index: number): OvertimePredictionMarket | null {
  const sportInfo = SPORT_KEY_MAP[event.sport_key];
  if (!sportInfo) return null;

  const now = Math.floor(Date.now() / 1000);
  const maturity = Math.floor(new Date(event.commence_time).getTime() / 1000);
  const timeRemaining = Math.max(0, maturity - now);

  // Get odds from first bookmaker with h2h market
  let homeOdds = 2.0;
  let awayOdds = 2.0;
  let drawOdds: number | undefined;

  for (const bookmaker of event.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (h2hMarket && h2hMarket.outcomes.length >= 2) {
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === event.home_team);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === event.away_team);
      const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

      if (homeOutcome) homeOdds = homeOutcome.price;
      if (awayOutcome) awayOdds = awayOutcome.price;
      if (drawOutcome) drawOdds = drawOutcome.price;
      break;
    }
  }

  const outcomes = drawOdds
    ? [event.home_team, 'Draw', event.away_team]
    : [event.home_team, event.away_team];

  const odds = drawOdds
    ? [homeOdds, drawOdds, awayOdds]
    : [homeOdds, awayOdds];

  // Convert decimal odds to probabilities
  const totalInverseOdds = odds.reduce((sum, o) => sum + 1 / o, 0);
  const probabilities = odds.map((o) => (1 / o / totalInverseOdds) * 100);

  // Extract league name from sport title
  const leagueName = event.sport_title || sportInfo.name;

  return {
    id: `odds-${event.id}-${index}`,
    platform: 'overtime',
    gameId: event.id,
    sportId: sportInfo.id,
    sportName: sportInfo.name,
    leagueName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    question: `${event.home_team} vs ${event.away_team}`,
    outcomes,
    probabilities,
    odds,
    maturity,
    timeRemaining,
    isLive: timeRemaining <= 0,
    status: timeRemaining > 0 ? 'upcoming' : 'live',
    marketType: 'moneyline',
  };
}


/**
 * GET /api/overtime
 * Fetch sports markets from The Odds API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sportId = searchParams.get('sportId');
  const live = searchParams.get('live') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');

  // Check if API key is configured
  if (!ODDS_API_KEY) {
    return NextResponse.json({
      success: false,
      markets: [],
      count: 0,
      isMock: false,
      source: 'none',
      error: 'ODDS_API_KEY not configured. Add your free API key from https://the-odds-api.com to .env.local',
    }, { status: 503 });
  }

  try {
    // Fetch odds from multiple sports
    const allMarkets: OvertimePredictionMarket[] = [];
    const errors: string[] = [];

    // Determine which sports to fetch based on filter
    let sportsToFetch = SPORTS_TO_FETCH;
    if (sportId) {
      const sportIdNum = parseInt(sportId);
      sportsToFetch = Object.entries(SPORT_KEY_MAP)
        .filter(([_, info]) => info.id === sportIdNum)
        .map(([key]) => key);
    }

    // Fetch up to 3 sports to conserve API quota
    const sportsSlice = sportsToFetch.slice(0, 3);

    for (const sport of sportsSlice) {
      try {
        const events = await fetchOddsAPI(sport);
        const markets = events
          .map((event, idx) => transformEvent(event, idx))
          .filter((m): m is OvertimePredictionMarket => m !== null);
        allMarkets.push(...markets);
      } catch (error: any) {
        console.warn(`Failed to fetch ${sport}:`, error.message);
        errors.push(`${sport}: ${error.message}`);
      }
    }

    if (allMarkets.length > 0) {
      // Sort by commence time
      allMarkets.sort((a, b) => a.maturity - b.maturity);

      // Filter live if requested
      const finalMarkets = live
        ? allMarkets.filter(m => m.isLive)
        : allMarkets;

      return NextResponse.json({
        success: true,
        markets: finalMarkets.slice(0, limit),
        count: finalMarkets.length,
        isMock: false,
        source: 'the-odds-api',
        sportsFetched: sportsSlice,
        ...(errors.length > 0 && { warnings: errors }),
      });
    }

    throw new Error('No markets available');
  } catch (error: any) {
    console.error('The Odds API failed:', error);

    // Return error (no mock data)
    return NextResponse.json({
      success: false,
      markets: [],
      count: 0,
      isMock: false,
      source: 'none',
      error: `The Odds API error: ${error.message}`,
    }, { status: 500 });
  }
}
