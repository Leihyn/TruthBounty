import { NextRequest, NextResponse } from 'next/server';
import { LIMITLESS_CONFIG, LimitlessPredictionMarket } from '@/lib/limitless';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 2;

/**
 * Try to fetch from Limitless API
 */
async function fetchLimitlessAPI(endpoint: string): Promise<any> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(`${LIMITLESS_CONFIG.API_URL}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('API requires authentication');
      }
    } catch (error) {
      console.warn(`Limitless API attempt ${i + 1} failed:`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return null;
}

/**
 * Transform Limitless market to our format
 * Real API response structure:
 * - title: "💎 $BTC above $87388.13 on Dec 30, 09:00 UTC?"
 * - prices: [0.825, 0.175] (yes, no)
 * - volumeFormatted: "817.960819"
 * - expirationTimestamp: 1767085200000 (ms)
 * - categories: ["Hourly"]
 */
function transformMarket(market: any, index: number): LimitlessPredictionMarket {
  const now = Math.floor(Date.now() / 1000);

  // expirationTimestamp is in milliseconds
  const expiresAt = market.expirationTimestamp
    ? Math.floor(market.expirationTimestamp / 1000)
    : now + 86400;
  const timeRemaining = Math.max(0, expiresAt - now);

  // prices array: [yesPrice, noPrice]
  const yesPrice = market.prices?.[0] || 0.5;
  const noPrice = market.prices?.[1] || 0.5;

  // Parse volume - can be in smallest units or formatted
  let volume = 0;
  if (market.volumeFormatted) {
    volume = parseFloat(market.volumeFormatted);
  } else if (market.volume) {
    // Volume in smallest units (6 decimals for USDC)
    volume = parseInt(market.volume) / 1_000_000;
  }

  // Category from categories array
  const category = market.categories?.[0] || 'General';

  // Clean title (remove emoji prefix if present)
  let question = market.title || 'Unknown market';
  // Keep emoji for visual interest but ensure it's readable

  return {
    id: market.id?.toString() || `limitless-${index}`,
    platform: 'limitless',
    slug: market.slug || `market-${index}`,
    question,
    description: market.description,
    category,
    outcomes: ['Yes', 'No'],
    probabilities: [yesPrice * 100, noPrice * 100],
    volume,
    liquidity: market.liquidity || 0,
    expiresAt,
    timeRemaining,
    status: market.expired ? 'resolved' : (market.status === 'FUNDED' ? 'active' : 'active'),
    yesPrice,
    noPrice,
  };
}


/**
 * GET /api/limitless
 * Fetch active markets from Limitless
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category');

  try {
    // Try to fetch from Limitless API
    // Response format: { data: [...], totalMarketsCount: 226 }
    // Valid sortBy values: trending, ending_soon, high_value, newest, lp_rewards
    const response = await fetchLimitlessAPI(`/markets/active?limit=${limit}&sortBy=high_value`);

    if (response && response.data && Array.isArray(response.data)) {
      let markets = response.data.map((m: any, i: number) => transformMarket(m, i));

      // Filter by category if specified
      if (category) {
        markets = markets.filter((m: LimitlessPredictionMarket) =>
          m.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Filter out expired markets
      markets = markets.filter((m: LimitlessPredictionMarket) => m.timeRemaining > 0);

      return NextResponse.json({
        success: true,
        markets: markets.slice(0, limit),
        count: markets.length,
        totalAvailable: response.totalMarketsCount || markets.length,
        isMock: false,
        source: 'limitless-api',
      });
    }

    throw new Error('Invalid API response');
  } catch (error: any) {
    console.error('Limitless API failed:', error);

    // Return error (no mock data)
    return NextResponse.json({
      success: false,
      markets: [],
      count: 0,
      isMock: false,
      source: 'none',
      error: `Limitless API error: ${error.message}`,
    }, { status: 500 });
  }
}
