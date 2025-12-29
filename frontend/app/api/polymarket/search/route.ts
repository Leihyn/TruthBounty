import { NextRequest, NextResponse } from 'next/server';

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

export const dynamic = 'force-dynamic';

// In-memory cache for all markets (refreshed every 5 minutes)
let marketCache: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchAllMarkets(): Promise<any[]> {
  // Return cached if fresh
  if (marketCache.length > 0 && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return marketCache;
  }

  console.log('[Polymarket] Fetching all markets...');
  const allMarkets: any[] = [];
  let offset = 0;
  const batchSize = 500;

  while (offset < 10000) { // Safety limit
    try {
      const res = await fetch(
        `${POLYMARKET_API}/events?closed=false&limit=${batchSize}&offset=${offset}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!res.ok) break;

      const events = await res.json();
      if (!events || events.length === 0) break;

      for (const event of events) {
        if (event.markets && Array.isArray(event.markets)) {
          for (const market of event.markets) {
            if (market.closed || !market.active) continue;

            // Parse prices
            let prices = [0.5, 0.5];
            try {
              if (typeof market.outcomePrices === 'string') {
                prices = JSON.parse(market.outcomePrices).map((p: string) => parseFloat(p));
              }
            } catch (e) {}

            allMarkets.push({
              id: market.conditionId || market.id,
              question: market.question,
              eventTitle: event.title,
              eventSlug: event.slug,
              outcomes: ['Yes', 'No'],
              prices,
              volume: market.volumeNum || 0,
              volume24hr: market.volume24hr || event.volume24hr || 0,
              liquidity: market.liquidityNum || 0,
              endDate: market.endDateIso || market.endDate,
              image: market.image || event.image,
              slug: market.slug,
              description: market.description,
            });
          }
        }
      }

      offset += batchSize;

      // If we got less than batch size, we're done
      if (events.length < batchSize) break;
    } catch (err) {
      console.error('[Polymarket] Fetch error at offset', offset, err);
      break;
    }
  }

  // Sort by 24h volume
  allMarkets.sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0));

  // Update cache
  marketCache = allMarkets;
  cacheTimestamp = Date.now();

  console.log(`[Polymarket] Cached ${allMarkets.length} markets`);
  return allMarkets;
}

/**
 * GET /api/polymarket/search
 * Search all Polymarket events and markets (34,000+)
 *
 * Query params:
 * - q: Search query
 * - limit: Max results (default 50)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    // Get all markets (cached)
    const allMarkets = await fetchAllMarkets();

    // Filter by search query
    let results = allMarkets;
    if (query) {
      results = allMarkets.filter(market =>
        market.question?.toLowerCase().includes(query) ||
        market.eventTitle?.toLowerCase().includes(query) ||
        market.description?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      query,
      total: results.length,
      cached: marketCache.length,
      markets: results.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Polymarket search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
// Cache bust: 1766980928
