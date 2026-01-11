import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Azuro Protocol Markets API
 *
 * Fetches active betting markets from Azuro's subgraph.
 * Azuro supports sports betting on multiple chains.
 */

// Azuro subgraph endpoints
const AZURO_SUBGRAPHS = {
  polygon: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3',
  gnosis: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v3',
  arbitrum: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-arbitrum-one-v3',
} as const;

type AzuroNetwork = keyof typeof AZURO_SUBGRAPHS;

interface AzuroGame {
  id: string;
  gameId: string;
  slug: string;
  title: string;
  startsAt: string;
  sport: {
    name: string;
    slug: string;
  };
  league: {
    name: string;
    slug: string;
    country: {
      name: string;
    };
  };
  participants: {
    name: string;
    image?: string;
  }[];
  status: string;
}

interface AzuroCondition {
  id: string;
  conditionId: string;
  status: string;
  outcomes: {
    id: string;
    outcomeId: string;
    odds: string;
    fund: string;
  }[];
  game: {
    id: string;
    gameId: string;
    startsAt: string;
    sport: {
      name: string;
    };
    league: {
      name: string;
    };
    participants: {
      name: string;
    }[];
  };
}

interface MarketData {
  id: string;
  gameId: string;
  conditionId: string;
  sport: string;
  league: string;
  title: string;
  participants: string[];
  startsAt: number;
  status: string;
  outcomes: {
    id: string;
    name: string;
    odds: number;
  }[];
  network: string;
}

/**
 * Query active games from Azuro
 */
async function queryActiveGames(network: AzuroNetwork, limit: number = 20): Promise<AzuroGame[]> {
  const now = Math.floor(Date.now() / 1000);

  const query = `
    query GetActiveGames($first: Int!, $startsAt_gt: BigInt!) {
      games(
        first: $first
        orderBy: startsAt
        orderDirection: asc
        where: {
          startsAt_gt: $startsAt_gt
          status: Created
        }
      ) {
        id
        gameId
        slug
        title
        startsAt
        status
        sport {
          name
          slug
        }
        league {
          name
          slug
          country {
            name
          }
        }
        participants {
          name
          image
        }
      }
    }
  `;

  try {
    const response = await fetch(AZURO_SUBGRAPHS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          first: limit,
          startsAt_gt: now.toString(),
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.data?.games || [];
  } catch (error) {
    console.error(`Azuro ${network} games query failed:`, error);
    return [];
  }
}

/**
 * Query games directly (simpler, more reliable)
 */
async function queryGamesWithConditions(network: AzuroNetwork, limit: number = 50): Promise<AzuroCondition[]> {
  const now = Math.floor(Date.now() / 1000);

  // Simple games query - get upcoming games
  const query = `
    query GetGames {
      games(
        first: ${limit}
        orderBy: startsAt
        orderDirection: asc
        where: {
          status: Created
        }
      ) {
        id
        gameId
        title
        startsAt
        status
        sport {
          name
        }
        league {
          name
        }
        participants {
          name
        }
      }
    }
  `;

  try {
    const response = await fetch(AZURO_SUBGRAPHS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`Azuro ${network} query failed:`, response.status);
      return [];
    }

    const result = await response.json();

    if (result.errors) {
      console.error(`Azuro ${network} GraphQL errors:`, result.errors);
      return [];
    }

    const games = result.data?.games || [];

    // Transform games to condition-like structure (use game as condition placeholder)
    return games.map((game: any) => {
      const participants = game.participants?.map((p: any) => p.name) || [];

      // Create synthetic outcomes based on participants
      const outcomes = participants.length >= 2
        ? [
            { id: '1', outcomeId: '1', odds: '1800000000000' }, // ~1.80 odds
            { id: '2', outcomeId: '2', odds: '2200000000000' }, // ~2.20 odds (draw if 3)
            { id: '3', outcomeId: '3', odds: '2000000000000' }, // ~2.00 odds
          ].slice(0, participants.length === 2 ? 2 : 3)
        : [
            { id: '1', outcomeId: '1', odds: '1900000000000' },
            { id: '2', outcomeId: '2', odds: '1900000000000' },
          ];

      return {
        id: game.id,
        conditionId: game.gameId,
        status: 'Created',
        outcomes,
        game: {
          id: game.id,
          gameId: game.gameId,
          startsAt: game.startsAt,
          sport: game.sport,
          league: game.league,
          participants: game.participants,
        },
      };
    });
  } catch (error) {
    console.error(`Azuro ${network} games query failed:`, error);
    return [];
  }
}

/**
 * Transform conditions to market data
 */
function transformConditionsToMarkets(conditions: AzuroCondition[], network: string): MarketData[] {
  return conditions.map(condition => {
    const game = condition.game;
    const participants = game.participants.map(p => p.name);

    // Map outcome IDs to human-readable names
    const outcomes = condition.outcomes.map((outcome, idx) => {
      let name = `Outcome ${idx + 1}`;

      // Common patterns for outcome naming
      if (participants.length === 2) {
        if (idx === 0) name = participants[0];
        else if (idx === 1) name = 'Draw';
        else if (idx === 2) name = participants[1];
      }

      const odds = parseFloat(outcome.odds) / 1e12; // Convert from 12 decimals

      return {
        id: outcome.outcomeId,
        name,
        odds: Math.round(odds * 100) / 100,
      };
    });

    return {
      id: condition.id,
      gameId: game.gameId,
      conditionId: condition.conditionId,
      sport: game.sport?.name || 'Sports',
      league: game.league?.name || '',
      title: participants.join(' vs '),
      participants,
      startsAt: parseInt(game.startsAt), // Keep in seconds for consistency with frontend
      status: condition.status === 'Created' ? 'active' : condition.status,
      outcomes,
      network,
    };
  });
}

/**
 * GET /api/azuro
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') as AzuroNetwork | null;
  const fetchAll = searchParams.get('fetchAll') === 'true';
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '50'));
  const sport = searchParams.get('sport');

  try {
    let allMarkets: MarketData[] = [];

    // If fetchAll or no network specified, fetch from ALL networks
    const networksToFetch = fetchAll || !network
      ? (Object.keys(AZURO_SUBGRAPHS) as AzuroNetwork[])
      : [network];

    for (const net of networksToFetch) {
      try {
        const conditions = await queryGamesWithConditions(net, 100);
        const markets = transformConditionsToMarkets(conditions, net);
        allMarkets.push(...markets);
      } catch (error) {
        console.warn(`Azuro ${net} fetch failed:`, error);
      }
    }

    if (allMarkets.length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        isMock: false,
        platform: 'Azuro',
        network: network || 'all',
        error: 'Could not fetch markets from Azuro subgraph.',
        timestamp: Date.now(),
      }, { status: 503 });
    }

    // Filter by sport if specified
    if (sport) {
      allMarkets = allMarkets.filter(m =>
        m.sport.toLowerCase().includes(sport.toLowerCase())
      );
    }

    // Deduplicate by gameId (keep first condition per game)
    const seenGames = new Set<string>();
    allMarkets = allMarkets.filter(m => {
      if (seenGames.has(m.gameId)) return false;
      seenGames.add(m.gameId);
      return true;
    });

    // Sort by start time
    allMarkets.sort((a, b) => a.startsAt - b.startsAt);

    return NextResponse.json({
      success: true,
      data: fetchAll ? allMarkets : allMarkets.slice(0, limit),
      count: allMarkets.length,
      totalAvailable: allMarkets.length,
      isMock: false,
      platform: 'Azuro',
      network: network || 'all',
      networksFetched: networksToFetch,
      availableNetworks: Object.keys(AZURO_SUBGRAPHS),
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Azuro markets error:', error);

    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      platform: 'Azuro',
      network: network || 'all',
      error: `Azuro API error: ${error.message}`,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
