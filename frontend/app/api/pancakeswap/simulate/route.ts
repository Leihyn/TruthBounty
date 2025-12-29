import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';

/**
 * POST /api/pancakeswap/simulate
 * Place a simulated bet on a PancakeSwap prediction round
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      epoch,
      position, // 'Bull' or 'Bear'
      amount,   // Amount in BNB (as string)
      lockPrice,
      asset = 'BNB',
    } = body;

    if (!walletAddress || !epoch || !position || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, epoch, position, amount' },
        { status: 400 }
      );
    }

    if (!['Bull', 'Bear'].includes(position)) {
      return NextResponse.json(
        { error: 'Position must be "Bull" or "Bear"' },
        { status: 400 }
      );
    }

    // Convert amount to wei (18 decimals)
    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString();

    // Check if user already has a bet on this epoch
    const { data: existing } = await supabase
      .from('simulated_trades')
      .select('id')
      .eq('follower', walletAddress.toLowerCase())
      .eq('epoch', epoch)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a simulated bet on this round' },
        { status: 400 }
      );
    }

    // Insert simulated trade
    const { data: trade, error } = await supabase
      .from('simulated_trades')
      .insert({
        follower: walletAddress.toLowerCase(),
        leader: 'direct_simulation', // Mark as direct simulation, not copy trade
        epoch: epoch.toString(),
        amount: amountWei,
        is_bull: position === 'Bull',
        outcome: 'pending',
        simulated_at: new Date().toISOString(),
        asset: asset,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting simulated trade:', error);
      return NextResponse.json(
        { error: 'Failed to place simulated bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        epoch: trade.epoch,
        position: trade.is_bull ? 'Bull' : 'Bear',
        amount: amount,
        amountWei: amountWei,
        status: 'pending',
        simulatedAt: trade.simulated_at,
      },
      message: `Simulated ${position} bet of ${amount} BNB on Epoch ${epoch}`,
    });
  } catch (error: any) {
    console.error('PancakeSwap simulate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place simulated bet' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pancakeswap/simulate
 * Get simulated trades for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const follower = searchParams.get('follower')?.toLowerCase();
  const epoch = searchParams.get('epoch');
  const limit = parseInt(searchParams.get('limit') || '50');
  const stats = searchParams.get('stats') === 'true';

  try {
    if (stats && follower) {
      // Return aggregated stats for a user
      const { data: trades, error } = await supabase
        .from('simulated_trades')
        .select('outcome, pnl, amount')
        .eq('follower', follower);

      if (error) throw error;

      const wins = trades?.filter(t => t.outcome === 'win').length || 0;
      const losses = trades?.filter(t => t.outcome === 'loss').length || 0;
      const pending = trades?.filter(t => t.outcome === 'pending').length || 0;
      const totalTrades = trades?.length || 0;

      let totalPnlWei = BigInt(0);
      let totalVolumeWei = BigInt(0);

      for (const t of trades || []) {
        if (t.pnl) totalPnlWei += BigInt(t.pnl);
        if (t.amount) totalVolumeWei += BigInt(t.amount);
      }

      return NextResponse.json({
        follower,
        totalTrades,
        wins,
        losses,
        pending,
        winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0',
        totalPnlBNB: (Number(totalPnlWei) / 1e18).toFixed(6),
        totalVolumeBNB: (Number(totalVolumeWei) / 1e18).toFixed(6),
      });
    }

    // Return individual trades
    let query = supabase
      .from('simulated_trades')
      .select('*')
      .order('simulated_at', { ascending: false })
      .limit(limit);

    if (follower) {
      query = query.eq('follower', follower);
    }
    if (epoch) {
      query = query.eq('epoch', epoch);
    }

    const { data: trades, error } = await query;

    if (error) throw error;

    const formatted = (trades || []).map(t => ({
      id: t.id,
      follower: t.follower,
      epoch: t.epoch,
      position: t.is_bull ? 'Bull' : 'Bear',
      amountBNB: (Number(BigInt(t.amount || '0')) / 1e18).toFixed(6),
      outcome: t.outcome,
      pnlBNB: t.pnl ? (Number(BigInt(t.pnl)) / 1e18).toFixed(6) : null,
      simulatedAt: t.simulated_at,
      resolvedAt: t.resolved_at,
      isDirect: t.leader === 'direct_simulation',
    }));

    return NextResponse.json({
      trades: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error('PancakeSwap simulate GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
