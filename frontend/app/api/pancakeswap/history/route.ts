import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Fetch real PancakeSwap Prediction bet history for a wallet
 *
 * This queries BSC to get actual bet history from PancakeSwap Prediction V2
 */

const PANCAKE_PREDICTION = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';

const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
];

// The Graph subgraph for PancakeSwap Prediction
const PANCAKE_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/pancakeswap/prediction-v2';

// Event signatures for PancakeSwap Prediction
const EVENT_SIGNATURES = {
  BetBull: '0x438bc0d4a0c8b87b0db1cce0dead5b5a0e993810958b3bc0d080b4d5aa39ae64',
  BetBear: '0xd67b0ce7a2d16b0f3c26b0a1aa68a85a5d7ac5a6e75fdc5e0e3b6a1e3df99e5b',
  Claim: '0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7',
};

interface BetRecord {
  epoch: string;
  amount: string;
  position: 'Bull' | 'Bear';
  claimed: boolean;
  won: boolean;
  timestamp: number;
  txHash: string;
}

interface BetSummary {
  totalBets: number;
  correctBets: number;
  totalVolumeBNB: number;
  winRate: number;
  bets: BetRecord[];
}

/**
 * Query The Graph for user's bet history
 */
async function querySubgraph(walletAddress: string): Promise<BetSummary | null> {
  const query = `
    query GetUserBets($user: String!) {
      user(id: $user) {
        id
        totalBets
        totalBetsBull
        totalBetsBear
        totalBNB
        totalBNBBull
        totalBNBBear
        winRate
        averageBNB
        netBNB
        bets(first: 1000, orderBy: createdAt, orderDirection: desc) {
          id
          position
          amount
          claimed
          claimedAmount
          claimedNetBNB
          createdAt
          updatedAt
          round {
            id
            epoch
            position
            failed
            startAt
            lockAt
            lockPrice
            closePrice
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(PANCAKE_SUBGRAPH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { user: walletAddress.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('Subgraph errors:', result.errors);
      return null;
    }

    const user = result.data?.user;
    if (!user) {
      return {
        totalBets: 0,
        correctBets: 0,
        totalVolumeBNB: 0,
        winRate: 0,
        bets: [],
      };
    }

    // Process bets to determine wins
    const bets: BetRecord[] = user.bets.map((bet: any) => {
      const round = bet.round;
      let won = false;

      if (round && !round.failed && round.closePrice && round.lockPrice) {
        const priceUp = parseFloat(round.closePrice) > parseFloat(round.lockPrice);
        const betBull = bet.position === 'Bull';
        won = (priceUp && betBull) || (!priceUp && !betBull);
      }

      return {
        epoch: round?.epoch || '0',
        amount: bet.amount,
        position: bet.position,
        claimed: bet.claimed,
        won,
        timestamp: parseInt(bet.createdAt),
        txHash: bet.id,
      };
    });

    const correctBets = bets.filter(b => b.won).length;
    const totalVolume = parseFloat(user.totalBNB || '0');

    return {
      totalBets: parseInt(user.totalBets || '0'),
      correctBets,
      totalVolumeBNB: totalVolume,
      winRate: bets.length > 0 ? (correctBets / bets.length) * 100 : 0,
      bets,
    };
  } catch (error) {
    console.error('Subgraph query failed:', error);
    return null;
  }
}

/**
 * Fallback: Query BSC RPC for bet events
 */
async function queryRPC(walletAddress: string): Promise<BetSummary | null> {
  try {
    // Get current block
    const blockResponse = await fetch(BSC_RPC_URLS[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
    });
    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);

    // Query last 100,000 blocks (~3.5 days on BSC)
    const fromBlock = Math.max(0, currentBlock - 100000);

    // Pad address to 32 bytes for topic filter
    const paddedAddress = '0x000000000000000000000000' + walletAddress.slice(2).toLowerCase();

    // Query BetBull events
    const bullResponse = await fetch(BSC_RPC_URLS[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getLogs',
        params: [{
          address: PANCAKE_PREDICTION,
          topics: [EVENT_SIGNATURES.BetBull, paddedAddress],
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: 'latest',
        }],
      }),
    });

    // Query BetBear events
    const bearResponse = await fetch(BSC_RPC_URLS[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_getLogs',
        params: [{
          address: PANCAKE_PREDICTION,
          topics: [EVENT_SIGNATURES.BetBear, paddedAddress],
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: 'latest',
        }],
      }),
    });

    const bullData = await bullResponse.json();
    const bearData = await bearResponse.json();

    const bullLogs = bullData.result || [];
    const bearLogs = bearData.result || [];

    // Parse logs
    const bets: BetRecord[] = [];
    let totalVolume = BigInt(0);

    for (const log of bullLogs) {
      const epoch = parseInt(log.topics[2], 16).toString();
      const amount = BigInt(log.data);
      totalVolume += amount;

      bets.push({
        epoch,
        amount: amount.toString(),
        position: 'Bull',
        claimed: false,
        won: false, // Would need to check round result
        timestamp: 0,
        txHash: log.transactionHash,
      });
    }

    for (const log of bearLogs) {
      const epoch = parseInt(log.topics[2], 16).toString();
      const amount = BigInt(log.data);
      totalVolume += amount;

      bets.push({
        epoch,
        amount: amount.toString(),
        position: 'Bear',
        claimed: false,
        won: false,
        timestamp: 0,
        txHash: log.transactionHash,
      });
    }

    // For RPC fallback, we can't easily determine wins without querying each round
    // Return the data we have
    return {
      totalBets: bets.length,
      correctBets: 0, // Would need additional queries
      totalVolumeBNB: Number(totalVolume) / 1e18,
      winRate: 0,
      bets,
    };
  } catch (error) {
    console.error('RPC query failed:', error);
    return null;
  }
}

/**
 * GET /api/pancakeswap/history?address=0x...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Address parameter required' },
      { status: 400 }
    );
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { success: false, error: 'Invalid address format' },
      { status: 400 }
    );
  }

  console.log(`[PancakeSwap History] Fetching for ${address}`);

  try {
    // Try The Graph first (more complete data)
    let result = await querySubgraph(address);

    // Fallback to RPC if subgraph fails
    if (!result) {
      console.log('[PancakeSwap History] Subgraph failed, trying RPC...');
      result = await queryRPC(address);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bet history' },
        { status: 500 }
      );
    }

    console.log(`[PancakeSwap History] Found ${result.totalBets} bets, ${result.correctBets} wins`);

    return NextResponse.json({
      success: true,
      address,
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[PancakeSwap History] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
