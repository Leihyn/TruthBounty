import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// Price APIs (using multiple for redundancy)
const PRICE_APIS = {
  coingecko: {
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
    parse: (data: any) => ({
      BTC: data.bitcoin?.usd || 0,
      ETH: data.ethereum?.usd || 0,
    }),
  },
  binance: {
    url: 'https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]',
    parse: (data: any) => ({
      BTC: parseFloat(data.find((t: any) => t.symbol === 'BTCUSDT')?.price || '0'),
      ETH: parseFloat(data.find((t: any) => t.symbol === 'ETHUSDT')?.price || '0'),
    }),
  },
};

interface Prices {
  BTC: number;
  ETH: number;
}

/**
 * Fetch current prices from price APIs
 */
async function fetchPrices(): Promise<Prices> {
  // Try CoinGecko first
  try {
    const response = await fetch(PRICE_APIS.coingecko.url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const prices = PRICE_APIS.coingecko.parse(data);
      if (prices.BTC > 0 && prices.ETH > 0) {
        return prices;
      }
    }
  } catch (error) {
    console.warn('CoinGecko price fetch failed:', error);
  }

  // Fallback to Binance
  try {
    const response = await fetch(PRICE_APIS.binance.url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const prices = PRICE_APIS.binance.parse(data);
      if (prices.BTC > 0 && prices.ETH > 0) {
        return prices;
      }
    }
  } catch (error) {
    console.warn('Binance price fetch failed:', error);
  }

  throw new Error('Unable to fetch prices from any API');
}

/**
 * GET /api/speedmarkets/resolve
 * Resolve pending Speed Markets simulated trades
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Fetch current prices
    const prices = await fetchPrices();

    // Get all pending trades where maturity has passed
    const now = new Date().toISOString();
    const { data: pendingTrades, error: fetchError } = await supabase
      .from('speed_simulated_trades')
      .select('id, asset, direction, amount_usd, strike_price, maturity, time_frame_seconds')
      .eq('outcome', 'pending')
      .lt('maturity', now); // Only get trades past maturity

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingTrades || pendingTrades.length === 0) {
      return NextResponse.json({
        resolved: 0,
        pending: 0,
        message: 'No matured trades to resolve',
        currentPrices: prices,
        duration: Date.now() - startTime,
      });
    }

    let resolved = 0;
    let skipped = 0;

    for (const trade of pendingTrades) {
      if (Date.now() - startTime > 8000) break;

      const asset = trade.asset as 'BTC' | 'ETH';
      const finalPrice = prices[asset];
      const strikePrice = Number(trade.strike_price);

      if (!finalPrice || !strikePrice) {
        skipped++;
        continue;
      }

      // Determine winner: UP wins if finalPrice > strikePrice
      const priceWentUp = finalPrice > strikePrice;
      const won = (trade.direction === 'UP' && priceWentUp) ||
                  (trade.direction === 'DOWN' && !priceWentUp);

      const amount = Number(trade.amount_usd);

      // Calculate PnL (Speed Markets typically pay 1.9x)
      let pnl: number;
      if (won) {
        pnl = amount * 0.9; // Win = 1.9x return - 1.0x stake = 0.9x profit
      } else {
        pnl = -amount;
      }

      const { error: updateError } = await supabase
        .from('speed_simulated_trades')
        .update({
          outcome: won ? 'win' : 'loss',
          pnl_usd: pnl.toFixed(2),
          final_price: finalPrice,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', trade.id);

      if (!updateError) {
        resolved++;
      } else {
        console.error(`Error updating trade ${trade.id}:`, updateError);
        skipped++;
      }
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('speed_simulated_trades')
      .select('outcome');

    const wins = stats?.filter(t => t.outcome === 'win').length || 0;
    const losses = stats?.filter(t => t.outcome === 'loss').length || 0;
    const pending = stats?.filter(t => t.outcome === 'pending').length || 0;

    return NextResponse.json({
      resolved,
      skipped,
      pending,
      wins,
      losses,
      winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + '%' : 'N/A',
      currentPrices: prices,
      tradesChecked: pendingTrades.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Speed Markets resolve error:', error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
