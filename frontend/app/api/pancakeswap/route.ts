import { NextResponse } from 'next/server';

// PancakeSwap Prediction V2 contract on BSC Mainnet
const PANCAKE_PREDICTION_BNB = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';

// BSC Mainnet RPC endpoints
const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/',
  'https://bsc-dataseed4.binance.org/',
];

// Contract function selectors
const SELECTORS = {
  currentEpoch: '0x76671808',
  rounds: '0x8c65c81f',
  paused: '0x5c975abb',
};

interface RpcResponse {
  jsonrpc: string;
  id: number;
  result?: string;
  error?: { code: number; message: string };
}

interface RoundData {
  epoch: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  closeTimestamp: bigint;
  lockPrice: bigint;
  closePrice: bigint;
  lockOracleId: bigint;
  closeOracleId: bigint;
  totalAmount: bigint;
  bullAmount: bigint;
  bearAmount: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  oracleCalled: boolean;
}

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

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  const data: RpcResponse = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result || '0x';
}

async function callContract(contractAddress: string, data: string): Promise<string> {
  let lastError: Error | null = null;

  for (const rpcUrl of BSC_RPC_URLS) {
    try {
      return await rpcCall('eth_call', [{ to: contractAddress, data }, 'latest'], rpcUrl);
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}

function encodeUint256(value: bigint | number): string {
  return BigInt(value).toString(16).padStart(64, '0');
}

function decodeRoundData(hex: string): RoundData {
  if (!hex || hex === '0x' || hex.length < 66) {
    throw new Error('Invalid round data');
  }

  const data = hex.slice(2);
  const getSlot = (index: number) => BigInt('0x' + data.slice(index * 64, (index + 1) * 64));

  return {
    epoch: getSlot(0),
    startTimestamp: getSlot(1),
    lockTimestamp: getSlot(2),
    closeTimestamp: getSlot(3),
    lockPrice: getSlot(4),
    closePrice: getSlot(5),
    lockOracleId: getSlot(6),
    closeOracleId: getSlot(7),
    totalAmount: getSlot(8),
    bullAmount: getSlot(9),
    bearAmount: getSlot(10),
    rewardBaseCalAmount: getSlot(11),
    rewardAmount: getSlot(12),
    oracleCalled: getSlot(13) !== BigInt(0),
  };
}

export async function GET() {
  try {
    // Get current epoch
    const epochResult = await callContract(PANCAKE_PREDICTION_BNB, SELECTORS.currentEpoch);
    const currentEpoch = BigInt(epochResult);

    console.log('[PancakeSwap API] Current epoch:', currentEpoch.toString());

    // Fetch last 20 rounds (includes live, next, and recent history)
    const epochs: bigint[] = [];
    for (let i = 0; i < 20; i++) {
      const epoch = currentEpoch - BigInt(i);
      if (epoch > BigInt(0)) {
        epochs.push(epoch);
      }
    }

    // Fetch all rounds in parallel
    const roundPromises = epochs.map(async (epoch) => {
      const data = SELECTORS.rounds + encodeUint256(epoch);
      const result = await callContract(PANCAKE_PREDICTION_BNB, data);
      return { epoch, data: decodeRoundData(result) };
    });

    const roundsData = await Promise.all(roundPromises);

    // Transform to JSON-serializable format
    const rounds = roundsData.map(({ epoch, data }) => ({
      id: `round-${epoch.toString()}`,
      epoch: epoch.toString(),
      startTimestamp: data.startTimestamp.toString(),
      lockTimestamp: data.lockTimestamp.toString(),
      closeTimestamp: data.closeTimestamp.toString(),
      lockPrice: data.lockPrice.toString(),
      closePrice: data.closePrice.toString(),
      totalAmount: data.totalAmount.toString(),
      bullAmount: data.bullAmount.toString(),
      bearAmount: data.bearAmount.toString(),
      oracleCalled: data.oracleCalled,
    }));

    console.log('[PancakeSwap API] Successfully fetched', rounds.length, 'rounds');

    return NextResponse.json({
      success: true,
      currentEpoch: currentEpoch.toString(),
      rounds,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[PancakeSwap API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
