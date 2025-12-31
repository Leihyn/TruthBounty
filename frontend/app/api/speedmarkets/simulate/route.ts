import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/speedmarkets/simulate
 * Place a simulated Speed Markets bet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      asset, // 'BTC' or 'ETH'
      direction, // 'UP' or 'DOWN'
      amount, // Amount in USD
      timeFrameSeconds, // Time to maturity in seconds
      strikePrice, // Current price at time of bet
    } = body;

    if (!walletAddress || !asset || !direction || !amount || !timeFrameSeconds) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, asset, direction, amount, timeFrameSeconds' },
        { status: 400 }
      );
    }

    if (!['BTC', 'ETH'].includes(asset)) {
      return NextResponse.json(
        { error: 'Asset must be BTC or ETH' },
        { status: 400 }
      );
    }

    if (!['UP', 'DOWN'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be UP or DOWN' },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 5 || amountNum > 200) {
      return NextResponse.json(
        { error: 'Amount must be between $5 and $200 USD' },
        { status: 400 }
      );
    }

    // Calculate maturity timestamp
    const now = Math.floor(Date.now() / 1000);
    const maturity = now + parseInt(timeFrameSeconds);

    // Estimate payout (1.9x typical)
    const estimatedPayout = amountNum * 1.9;

    // Insert simulated trade
    const { data: trade, error } = await supabase
      .from('speed_simulated_trades')
      .insert({
        follower: walletAddress.toLowerCase(),
        asset: asset,
        direction: direction,
        amount_usd: amountNum,
        strike_price: strikePrice || 0,
        estimated_payout: estimatedPayout,
        time_frame_seconds: parseInt(timeFrameSeconds),
        maturity: new Date(maturity * 1000).toISOString(),
        outcome: 'pending',
        simulated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting Speed Markets trade:', error);

      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Speed Markets simulation not yet configured. Please create the speed_simulated_trades table.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to place simulated bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        asset: trade.asset,
        direction: trade.direction,
        amount: trade.amount_usd,
        strikePrice: trade.strike_price,
        estimatedPayout: trade.estimated_payout,
        maturity: trade.maturity,
        status: 'pending',
        simulatedAt: trade.simulated_at,
      },
      message: `Simulated $${amountNum} ${direction} position on ${asset}`,
    });
  } catch (error: any) {
    console.error('Speed Markets simulate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place simulated bet' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/speedmarkets/simulate
 * Get simulated Speed Markets trades for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const follower = searchParams.get('follower')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '50');
  const stats = searchParams.get('stats') === 'true';

  try {
    if (stats && follower) {
      const { data: trades, error } = await supabase
        .from('speed_simulated_trades')
        .select('outcome, pnl_usd, amount_usd')
        .eq('follower', follower);

      if (error) throw error;

      const wins = trades?.filter(t => t.outcome === 'win').length || 0;
      const losses = trades?.filter(t => t.outcome === 'loss').length || 0;
      const pending = trades?.filter(t => t.outcome === 'pending').length || 0;
      const totalTrades = trades?.length || 0;

      let totalPnl = 0;
      let totalVolume = 0;

      for (const t of trades || []) {
        if (t.pnl_usd) totalPnl += t.pnl_usd;
        if (t.amount_usd) totalVolume += t.amount_usd;
      }

      return NextResponse.json({
        follower,
        totalTrades,
        wins,
        losses,
        pending,
        winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0',
        totalPnlUsd: totalPnl.toFixed(2),
        totalVolumeUsd: totalVolume.toFixed(2),
      });
    }

    let query = supabase
      .from('speed_simulated_trades')
      .select('*')
      .order('simulated_at', { ascending: false })
      .limit(limit);

    if (follower) {
      query = query.eq('follower', follower);
    }

    const { data: trades, error } = await query;

    if (error) throw error;

    const formatted = (trades || []).map(t => ({
      id: t.id,
      follower: t.follower,
      asset: t.asset,
      direction: t.direction,
      amountUsd: t.amount_usd,
      strikePrice: t.strike_price,
      finalPrice: t.final_price,
      estimatedPayout: t.estimated_payout,
      timeFrameSeconds: t.time_frame_seconds,
      maturity: t.maturity,
      outcome: t.outcome,
      pnlUsd: t.pnl_usd,
      simulatedAt: t.simulated_at,
      resolvedAt: t.resolved_at,
    }));

    return NextResponse.json({
      trades: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error('Speed Markets simulate GET error:', error);

    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        trades: [],
        count: 0,
        warning: 'Speed Markets simulation table not configured',
      });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
