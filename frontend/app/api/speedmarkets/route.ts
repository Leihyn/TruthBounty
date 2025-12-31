import { NextRequest, NextResponse } from 'next/server';
import { SPEED_MARKETS_CONFIG, SpeedMarketDisplay } from '@/lib/speedmarkets';

export const dynamic = 'force-dynamic';

/**
 * Try to fetch live crypto prices
 */
async function fetchCryptoPrices(): Promise<{ btc: number; eth: number; btcChange: number; ethChange: number } | null> {
  try {
    // Try CoinGecko API (free tier)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        btc: data.bitcoin?.usd || 95000,
        eth: data.ethereum?.usd || 3400,
        btcChange: data.bitcoin?.usd_24h_change || 0,
        ethChange: data.ethereum?.usd_24h_change || 0,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch crypto prices:', error);
  }
  return null;
}

/**
 * Generate Speed Markets data with live prices
 */
function generateMarkets(prices: { btc: number; eth: number; btcChange: number; ethChange: number }): SpeedMarketDisplay[] {
  return SPEED_MARKETS_CONFIG.ASSETS.map((asset) => ({
    id: `speed-${asset.toLowerCase()}`,
    platform: 'speed-markets' as const,
    asset,
    assetIcon: asset === 'BTC' ? '₿' : 'Ξ',
    question: `Will ${asset} go UP or DOWN?`,
    currentPrice: asset === 'BTC' ? prices.btc : prices.eth,
    priceChange24h: asset === 'BTC' ? prices.btcChange : prices.ethChange,
    availableTimeFrames: SPEED_MARKETS_CONFIG.TIME_FRAMES,
    minBuyIn: SPEED_MARKETS_CONFIG.MIN_BUYIN,
    maxBuyIn: SPEED_MARKETS_CONFIG.MAX_BUYIN,
    estimatedPayout: 1.9, // Typical payout multiplier
  }));
}

/**
 * GET /api/speedmarkets
 * Get available Speed Markets with current prices
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get live prices
    const prices = await fetchCryptoPrices();

    if (!prices) {
      return NextResponse.json({
        success: false,
        markets: [],
        isMock: false,
        priceSource: 'none',
        error: 'Failed to fetch live crypto prices from CoinGecko',
      }, { status: 503 });
    }

    const markets = generateMarkets(prices);

    return NextResponse.json({
      success: true,
      markets,
      isMock: false,
      priceSource: 'coingecko',
    });
  } catch (error: any) {
    console.error('Speed Markets API error:', error);

    // Return error (no mock data)
    return NextResponse.json({
      success: false,
      markets: [],
      isMock: false,
      priceSource: 'none',
      error: `Speed Markets error: ${error.message}`,
    }, { status: 500 });
  }
}
