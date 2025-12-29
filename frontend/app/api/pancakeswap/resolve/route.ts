import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// BSC RPC endpoints
const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
];

// PancakeSwap Prediction V2 contract
const PREDICTION_CONTRACT = '0x18B2A687610328590Bc8F2e5fEdde3b582A49cdA';
const ROUNDS_SELECTOR = '0x8c65c81f'; // rounds(uint256)

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * Make RPC call to BSC
 */
async function rpcCall(method: string, params: any[], rpcUrl: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) throw new Error(`RPC error: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`RPC error: ${data.error.message}`);
  return data.result || '0x';
}

/**
 * Call contract with fallback RPC endpoints
 */
async function callContract(data: string): Promise<string> {
  for (const rpcUrl of BSC_RPC_URLS) {
    try {
      return await rpcCall('eth_call', [{ to: PREDICTION_CONTRACT, data }, 'latest'], rpcUrl);
    } catch (error) {
      console.warn(`RPC failed for ${rpcUrl}:`, error);
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
}

/**
 * Get round data from contract
 */
async function getRoundData(epoch: string): Promise<{
  lockPrice: bigint;
  closePrice: bigint;
  totalAmount: bigint;
  bullAmount: bigint;
  bearAmount: bigint;
  oracleCalled: boolean;
}> {
  const epochHex = BigInt(epoch).toString(16).padStart(64, '0');
  const result = await callContract(ROUNDS_SELECTOR + epochHex);

  if (!result || result === '0x' || result.length < 66) {
    throw new Error('Invalid round data');
  }

  const data = result.slice(2);
  const getSlot = (index: number) => BigInt('0x' + data.slice(index * 64, (index + 1) * 64));

  return {
    lockPrice: getSlot(4),
    closePrice: getSlot(5),
    totalAmount: getSlot(8),
    bullAmount: getSlot(9),
    bearAmount: getSlot(10),
    oracleCalled: getSlot(13) !== BigInt(0),
  };
}

/**
 * GET /api/pancakeswap/resolve
 * Resolve pending PancakeSwap simulated trades
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Get all pending simulated trades
    const { data: pendingTrades, error: fetchError } = await supabase
      .from('simulated_trades')
      .select('id, epoch, is_bull, amount, follower')
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

    // Get unique epochs
    const uniqueEpochs = [...new Set(pendingTrades.map(t => t.epoch))];

    let resolved = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each epoch
    for (const epoch of uniqueEpochs) {
      // Check time to avoid Vercel timeout
      if (Date.now() - startTime > 8000) {
        console.log('Approaching timeout, stopping early');
        break;
      }

      try {
        const roundData = await getRoundData(epoch);

        // Check if round is resolved (oracle called and close price set)
        if (!roundData.oracleCalled || roundData.closePrice === BigInt(0)) {
          skipped++;
          continue;
        }

        // Determine winner: Bull wins if closePrice > lockPrice
        const bullWins = roundData.closePrice > roundData.lockPrice;

        // Get trades for this epoch
        const epochTrades = pendingTrades.filter(t => t.epoch === epoch);

        for (const trade of epochTrades) {
          const won = trade.is_bull === bullWins;
          const amountWei = BigInt(trade.amount);
          const amountBNB = Number(amountWei) / 1e18;

          // Calculate PnL based on pool odds
          let pnlBNB: number;
          if (won) {
            // Winner gets proportional share of losing pool (minus 3% house fee)
            const winningPool = trade.is_bull ? roundData.bullAmount : roundData.bearAmount;
            const losingPool = trade.is_bull ? roundData.bearAmount : roundData.bullAmount;

            if (winningPool > BigInt(0)) {
              const multiplier = Number(losingPool) / Number(winningPool);
              pnlBNB = amountBNB * multiplier * 0.97; // 3% fee
            } else {
              pnlBNB = 0;
            }
          } else {
            pnlBNB = -amountBNB;
          }

          // Convert PnL to wei string
          const pnlWei = BigInt(Math.floor(pnlBNB * 1e18)).toString();

          const { error: updateError } = await supabase
            .from('simulated_trades')
            .update({
              outcome: won ? 'win' : 'loss',
              pnl: pnlWei,
              resolved_at: new Date().toISOString(),
            })
            .eq('id', trade.id);

          if (!updateError) {
            resolved++;
          } else {
            console.error(`Error updating trade ${trade.id}:`, updateError);
          }
        }
      } catch (err: any) {
        console.error(`Error resolving epoch ${epoch}:`, err);
        errors.push(epoch);
      }
    }

    // Get updated stats
    const { data: stats } = await supabase
      .from('simulated_trades')
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
      epochsChecked: uniqueEpochs.length,
      errors: errors.length,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('PancakeSwap resolve error:', error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
