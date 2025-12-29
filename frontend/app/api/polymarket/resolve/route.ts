import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel hobby limit

/**
 * GET /api/polymarket/resolve
 * Vercel Cron job to resolve pending Polymarket simulated trades
 * Runs every 5 minutes (or as configured in vercel.json)
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Get all pending trades
    const { data: pendingTrades, error: fetchError } = await supabase
      .from('polymarket_simulated_trades')
      .select('id, market_id, outcome_selected, amount_usd, price_at_entry')
      .eq('outcome', 'pending');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingTrades || pendingTrades.length === 0) {
      return NextResponse.json({
        resolved: 0,
        pending: 0,
        message: 'No pending trades',
        duration: Date.now() - startTime,
      });
    }

    // Get unique market IDs
    const uniqueMarkets = [...new Set(pendingTrades.map(t => t.market_id))];

    let resolved = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process markets in batches to avoid timeout
    for (const marketId of uniqueMarkets) {
      // Check time to avoid Vercel timeout
      if (Date.now() - startTime > 8000) {
        console.log('Approaching timeout, stopping early');
        break;
      }

      try {
        // Fetch market data from Polymarket
        const marketRes = await fetch(`${POLYMARKET_API}/markets/${marketId}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (!marketRes.ok) {
          skipped++;
          continue;
        }

        const market = await marketRes.json();

        // Check if market is resolved
        // Polymarket markets have 'closed' field and outcome tokens have 'winner' field
        const isResolved = market.closed === true || market.resolvedAt != null;

        if (!isResolved) {
          skipped++;
          continue;
        }

        // Determine winning outcome
        // For binary markets, check outcome tokens
        let winningOutcome: 'Yes' | 'No' | null = null;

        if (market.outcomes && Array.isArray(market.outcomes)) {
          // Find the winning outcome
          const yesToken = market.outcomes.find((o: any) =>
            o.value === 'Yes' || o.outcome === 'Yes'
          );
          const noToken = market.outcomes.find((o: any) =>
            o.value === 'No' || o.outcome === 'No'
          );

          // Check winner flag or price = 1.00
          if (yesToken?.winner === true || yesToken?.price === 1) {
            winningOutcome = 'Yes';
          } else if (noToken?.winner === true || noToken?.price === 1) {
            winningOutcome = 'No';
          }
        }

        // Alternative: Check resolution source if available
        if (!winningOutcome && market.resolutionSource) {
          // Parse from resolution
          if (market.resolutionSource.toLowerCase().includes('yes')) {
            winningOutcome = 'Yes';
          } else if (market.resolutionSource.toLowerCase().includes('no')) {
            winningOutcome = 'No';
          }
        }

        // If still no winner, check if it's a refund
        if (!winningOutcome && market.voided) {
          // Market was voided - refund all trades
          const marketTrades = pendingTrades.filter(t => t.market_id === marketId);
          for (const trade of marketTrades) {
            const { error: updateError } = await supabase
              .from('polymarket_simulated_trades')
              .update({
                outcome: 'refund',
                pnl_usd: 0,
                resolved_at: new Date().toISOString(),
                market_resolved_at: market.resolvedAt || new Date().toISOString(),
              })
              .eq('id', trade.id);

            if (!updateError) resolved++;
          }
          continue;
        }

        if (!winningOutcome) {
          // Can't determine winner yet
          skipped++;
          continue;
        }

        // Resolve trades for this market
        const marketTrades = pendingTrades.filter(t => t.market_id === marketId);

        for (const trade of marketTrades) {
          const won = trade.outcome_selected === winningOutcome;
          const amount = Number(trade.amount_usd);
          const entryPrice = trade.price_at_entry ? Number(trade.price_at_entry) : 0.5;

          // Calculate PnL
          // If won: profit = amount * (1 - entryPrice) / entryPrice (simplified)
          // If lost: loss = -amount
          let pnl: number;
          if (won) {
            // Winner gets full payout minus entry cost
            // Simplified: if bought at 0.60, and won, profit = (1.00 - 0.60) * shares
            // shares = amount / entryPrice
            const shares = amount / entryPrice;
            pnl = shares * (1 - entryPrice);
          } else {
            pnl = -amount;
          }

          const { error: updateError } = await supabase
            .from('polymarket_simulated_trades')
            .update({
              outcome: won ? 'win' : 'loss',
              pnl_usd: pnl.toFixed(2),
              resolved_at: new Date().toISOString(),
              market_resolved_at: market.resolvedAt || new Date().toISOString(),
            })
            .eq('id', trade.id);

          if (!updateError) {
            resolved++;
          }
        }
      } catch (err: any) {
        console.error(`Error resolving market ${marketId}:`, err);
        errors.push(marketId);
      }
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('polymarket_simulated_trades')
      .select('outcome');

    const wins = stats?.filter(t => t.outcome === 'win').length || 0;
    const losses = stats?.filter(t => t.outcome === 'loss').length || 0;
    const pending = stats?.filter(t => t.outcome === 'pending').length || 0;
    const refunds = stats?.filter(t => t.outcome === 'refund').length || 0;

    return NextResponse.json({
      resolved,
      skipped,
      pending,
      wins,
      losses,
      refunds,
      winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) + '%' : 'N/A',
      marketsChecked: uniqueMarkets.length,
      errors: errors.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Polymarket resolve error:', error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
