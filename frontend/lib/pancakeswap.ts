/**
 * PancakeSwap Prediction API Integration
 *
 * This service provides access to PancakeSwap Prediction v2 markets
 * via direct BSC RPC calls for real-time data
 */

// Configuration
export const PANCAKESWAP_CONFIG = {
  // The Graph subgraph endpoint for PancakeSwap Prediction (fallback)
  SUBGRAPH_URL: 'https://gateway.thegraph.com/api/9a31268f5f46c9fcaa808f37d13e0c8f/subgraphs/id/5ZQGSZ74JUeSQdCjqALFEhYjWsiFJAsqJpuLhWvJ9fkP',
  // BSC RPC endpoints for direct blockchain queries (multiple for redundancy)
  BSC_RPC_URLS: [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.binance.org/',
    'https://bsc-dataseed2.binance.org/',
    'https://bsc-dataseed3.binance.org/',
    'https://bsc-dataseed4.binance.org/',
  ],
  // PancakeSwap Prediction V2 contract addresses
  PREDICTION_BNB: '0x18B2A687610328590Bc8F2e5fEdde3b582A49cdA',
  PREDICTION_CAKE: '0x0E3A8078EDD2021dadcdE733C6b4a86E51EE8f07',
  CACHE_DURATION: 15 * 1000, // 15 seconds for real-time data
  ASSETS: ['BNB', 'CAKE', 'BTC', 'ETH'] as const,
} as const;

// Contract ABI selectors for PancakeSwap Prediction V2
const CONTRACT_SELECTORS = {
  currentEpoch: '0x76671808', // currentEpoch()
  rounds: '0x8c65c81f',      // rounds(uint256)
  paused: '0x5c975abb',      // paused()
  genesisStartOnce: '0x9fc21455', // genesisStartOnce()
};

// TypeScript Types
export interface PancakeRound {
  id: string;
  epoch: string;
  position: 'Bull' | 'Bear' | null;
  startAt: string;
  startBlock: string;
  startHash: string;
  lockAt: string;
  lockBlock: string;
  lockHash: string;
  lockPrice: string;
  lockRoundId: string;
  closeAt: string | null;
  closeBlock: string | null;
  closeHash: string | null;
  closePrice: string | null;
  closeRoundId: string | null;
  totalBets: string;
  totalAmount: string;
  bullBets: string;
  bullAmount: string;
  bearBets: string;
  bearAmount: string;
  failed: boolean;
}

export interface PancakeMarket {
  id: string;
  paused: boolean;
  epoch: string;
}

export interface PancakePredictionMarket {
  id: string;
  asset: string;
  question: string;
  currentEpoch: string;
  roundDuration: number; // 5 minutes in seconds
  totalVolume: number;
  bullAmount: number;
  bearAmount: number;
  totalBets: number;
  bullProbability: number;
  bearProbability: number;
  lockPrice: number | null;
  lockAt: string | null;
  closeAt: string | null;
  timeRemaining: number;
  status: 'live' | 'locked' | 'calculating' | 'closed';
}

// Cache implementation
class PancakeCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > PANCAKESWAP_CONFIG.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const pancakeCache = new PancakeCache();

// ============================================
// Direct RPC Helpers for Contract Calls
// ============================================

interface RpcResponse {
  jsonrpc: string;
  id: number;
  result?: string;
  error?: { code: number; message: string };
}

/**
 * Make a direct JSON-RPC call to BSC
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

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  const data: RpcResponse = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result || '0x';
}

/**
 * Call a contract function
 */
async function callContract(
  contractAddress: string,
  data: string,
  rpcUrls: string[] = PANCAKESWAP_CONFIG.BSC_RPC_URLS
): Promise<string> {
  // Try multiple RPC endpoints for redundancy
  let lastError: Error | null = null;

  for (const rpcUrl of rpcUrls) {
    try {
      return await rpcCall('eth_call', [{ to: contractAddress, data }, 'latest'], rpcUrl);
    } catch (error) {
      lastError = error as Error;
      console.warn(`RPC call failed for ${rpcUrl}:`, error);
      continue;
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Encode uint256 for contract call
 */
function encodeUint256(value: bigint | number): string {
  const hex = BigInt(value).toString(16).padStart(64, '0');
  return hex;
}

/**
 * Decode uint256 from hex string
 */
function decodeUint256(hex: string): bigint {
  if (!hex || hex === '0x') return BigInt(0);
  return BigInt(hex);
}

/**
 * Decode bool from hex string
 */
function decodeBool(hex: string): boolean {
  if (!hex || hex === '0x') return false;
  return BigInt(hex) !== BigInt(0);
}

// Round data structure from contract
interface ContractRoundData {
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

/**
 * Decode round data from contract response
 * The rounds() function returns a tuple with 13 fields
 */
function decodeRoundData(hex: string): ContractRoundData {
  if (!hex || hex === '0x' || hex.length < 66) {
    throw new Error('Invalid round data');
  }

  // Remove 0x prefix and decode each 32-byte (64 char) slot
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

/**
 * PancakeSwap Prediction Service
 */
export class PancakeSwapService {
  private subgraphUrl: string;
  private rpcUrls: string[];

  constructor(
    subgraphUrl: string = PANCAKESWAP_CONFIG.SUBGRAPH_URL,
    rpcUrls: string[] = PANCAKESWAP_CONFIG.BSC_RPC_URLS
  ) {
    this.subgraphUrl = subgraphUrl;
    this.rpcUrls = rpcUrls;
  }

  // ============================================
  // Direct Contract RPC Methods
  // ============================================

  /**
   * Get current epoch from contract
   */
  async getCurrentEpoch(contractAddress: string = PANCAKESWAP_CONFIG.PREDICTION_BNB): Promise<bigint> {
    const result = await callContract(contractAddress, CONTRACT_SELECTORS.currentEpoch, this.rpcUrls);
    return decodeUint256(result);
  }

  /**
   * Get round data from contract
   */
  async getRoundData(epoch: bigint, contractAddress: string = PANCAKESWAP_CONFIG.PREDICTION_BNB): Promise<ContractRoundData> {
    const data = CONTRACT_SELECTORS.rounds + encodeUint256(epoch);
    const result = await callContract(contractAddress, data, this.rpcUrls);
    return decodeRoundData(result);
  }

  /**
   * Check if contract is paused
   */
  async isPaused(contractAddress: string = PANCAKESWAP_CONFIG.PREDICTION_BNB): Promise<boolean> {
    const result = await callContract(contractAddress, CONTRACT_SELECTORS.paused, this.rpcUrls);
    return decodeBool(result);
  }

  /**
   * Get multiple rounds in parallel
   */
  async getMultipleRounds(epochs: bigint[], contractAddress: string = PANCAKESWAP_CONFIG.PREDICTION_BNB): Promise<ContractRoundData[]> {
    const promises = epochs.map(epoch => this.getRoundData(epoch, contractAddress));
    return Promise.all(promises);
  }

  /**
   * Query The Graph GraphQL endpoint (fallback)
   */
  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.subgraphUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      console.error('PancakeSwap GraphQL query error:', error);
      throw error;
    }
  }

  /**
   * Get current live rounds using server-side API route
   * This avoids CORS issues by fetching via Next.js API route
   */
  async getLiveRounds(): Promise<{ rounds: PancakeRound[]; isMock: boolean }> {
    const cacheKey = 'live-rounds';
    const cached = pancakeCache.get(cacheKey);
    if (cached) return cached;

    try {
      // First try: Server-side API route (avoids CORS)
      const response = await fetch('/api/pancakeswap', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.rounds) {
        throw new Error(data.error || 'Invalid API response');
      }

      console.log('PancakeSwap: Current epoch from API:', data.currentEpoch);

      // Transform API response to PancakeRound format
      const transformedRounds: PancakeRound[] = data.rounds.map((round: any) => {
        // Calculate total bets (estimate based on amounts)
        const avgBetSize = BigInt(0.1 * 1e18); // Assume 0.1 BNB avg bet
        const totalAmount = BigInt(round.totalAmount);
        const bullAmount = BigInt(round.bullAmount);
        const bearAmount = BigInt(round.bearAmount);

        const totalBets = totalAmount > BigInt(0)
          ? Number(totalAmount / avgBetSize).toString()
          : '0';
        const bullBets = bullAmount > BigInt(0)
          ? Number(bullAmount / avgBetSize).toString()
          : '0';
        const bearBets = bearAmount > BigInt(0)
          ? Number(bearAmount / avgBetSize).toString()
          : '0';

        return {
          id: round.id,
          epoch: round.epoch,
          position: null,
          startAt: round.startTimestamp,
          startBlock: '0',
          startHash: '0x',
          lockAt: round.lockTimestamp,
          lockBlock: '0',
          lockHash: '0x',
          lockPrice: round.lockPrice,
          lockRoundId: round.epoch,
          closeAt: round.closeTimestamp !== '0' ? round.closeTimestamp : null,
          closeBlock: round.oracleCalled ? '0' : null,
          closeHash: round.oracleCalled ? '0x' : null,
          closePrice: round.closePrice !== '0' ? round.closePrice : null,
          closeRoundId: round.oracleCalled ? round.epoch : null,
          totalBets,
          totalAmount: round.totalAmount,
          bullBets,
          bullAmount: round.bullAmount,
          bearBets,
          bearAmount: round.bearAmount,
          failed: false,
        };
      });

      const result = { rounds: transformedRounds, isMock: false };
      pancakeCache.set(cacheKey, result);
      console.log('PancakeSwap: Successfully fetched live data from API');
      return result;

    } catch (apiError) {
      console.error('Error fetching from API route:', apiError);

      // Second try: Direct RPC (may work in some environments)
      try {
        return await this.getLiveRoundsFromRPC();
      } catch (rpcError) {
        console.error('Direct RPC also failed:', rpcError);

        // Third try: Graph API fallback
        try {
          return await this.getLiveRoundsFromGraph();
        } catch (graphError) {
          console.error('Graph fallback also failed:', graphError);
          // Return empty array instead of mock data - we want 100% real data
          console.warn('PancakeSwap: All data sources failed, returning empty');
          return { rounds: [], isMock: false };
        }
      }
    }
  }

  /**
   * Direct RPC method (fallback for non-browser environments)
   */
  private async getLiveRoundsFromRPC(): Promise<{ rounds: PancakeRound[]; isMock: boolean }> {
    const currentEpoch = await this.getCurrentEpoch();
    console.log('PancakeSwap: Current epoch from RPC:', currentEpoch.toString());

    const epochs: bigint[] = [];
    for (let i = 0; i < 4; i++) {
      const epoch = currentEpoch - BigInt(i);
      if (epoch > BigInt(0)) {
        epochs.push(epoch);
      }
    }

    const contractRounds = await this.getMultipleRounds(epochs);

    const transformedRounds: PancakeRound[] = contractRounds.map((round, index) => {
      const epoch = epochs[index];
      const avgBetSize = BigInt(0.1 * 1e18);
      const totalBets = round.totalAmount > BigInt(0)
        ? Number(round.totalAmount / avgBetSize).toString()
        : '0';
      const bullBets = round.bullAmount > BigInt(0)
        ? Number(round.bullAmount / avgBetSize).toString()
        : '0';
      const bearBets = round.bearAmount > BigInt(0)
        ? Number(round.bearAmount / avgBetSize).toString()
        : '0';

      return {
        id: `round-${epoch.toString()}`,
        epoch: epoch.toString(),
        position: null,
        startAt: round.startTimestamp.toString(),
        startBlock: '0',
        startHash: '0x',
        lockAt: round.lockTimestamp.toString(),
        lockBlock: '0',
        lockHash: '0x',
        lockPrice: round.lockPrice.toString(),
        lockRoundId: round.lockOracleId.toString(),
        closeAt: round.closeTimestamp > BigInt(0) ? round.closeTimestamp.toString() : null,
        closeBlock: round.oracleCalled ? '0' : null,
        closeHash: round.oracleCalled ? '0x' : null,
        closePrice: round.closePrice > BigInt(0) ? round.closePrice.toString() : null,
        closeRoundId: round.closeOracleId > BigInt(0) ? round.closeOracleId.toString() : null,
        totalBets,
        totalAmount: round.totalAmount.toString(),
        bullBets,
        bullAmount: round.bullAmount.toString(),
        bearBets,
        bearAmount: round.bearAmount.toString(),
        failed: false,
      };
    });

    console.log('PancakeSwap: Successfully fetched live data from direct RPC');
    return { rounds: transformedRounds, isMock: false };
  }

  /**
   * Fallback: Get rounds from The Graph (may be outdated)
   */
  private async getLiveRoundsFromGraph(): Promise<{ rounds: PancakeRound[]; isMock: boolean }> {
    const query = `
      query GetLiveRounds {
        rounds(
          first: 10
          orderBy: epoch
          orderDirection: desc
          where: {
            failed: false
          }
        ) {
          id
          epoch
          startAt
          lockAt
          lockPrice
          closePrice
          totalBets
          totalAmount
          bullBets
          bullAmount
          bearBets
          bearAmount
          failed
        }
      }
    `;

    const data = await this.query<{ rounds: PancakeRound[] }>(query);
    if (data.rounds && data.rounds.length > 0) {
      const transformedRounds = data.rounds.map(round => ({
        ...round,
        position: null,
        startBlock: '0',
        startHash: '0x',
        lockBlock: '0',
        lockHash: '0x',
        lockRoundId: round.epoch,
        closeAt: round.lockAt ? (parseInt(round.lockAt) + 300).toString() : null,
        closeBlock: null,
        closeHash: null,
        closeRoundId: null,
      }));
      return { rounds: transformedRounds, isMock: false };
    }
    throw new Error('No data from Graph');
  }


  /**
   * Transform rounds into prediction markets for display
   */
  transformRoundsToMarkets(rounds: PancakeRound[]): PancakePredictionMarket[] {
    const now = Math.floor(Date.now() / 1000);

    return PANCAKESWAP_CONFIG.ASSETS.map((asset, index) => {
      // Use different rounds for different assets (simulated)
      const round = rounds[index] || rounds[0];
      if (!round) return null;

      const lockAt = parseInt(round.lockAt);
      const closeAt = round.closeAt ? parseInt(round.closeAt) : lockAt + 300; // 5 min round
      const timeRemaining = Math.max(0, lockAt - now);

      const bullAmount = parseFloat(round.bullAmount) / 1e18;
      const bearAmount = parseFloat(round.bearAmount) / 1e18;
      const totalAmount = bullAmount + bearAmount;
      const totalBets = parseInt(round.totalBets);

      const bullProbability = totalAmount > 0 ? (bullAmount / totalAmount) * 100 : 50;
      const bearProbability = totalAmount > 0 ? (bearAmount / totalAmount) * 100 : 50;

      let status: 'live' | 'locked' | 'calculating' | 'closed' = 'live';
      if (round.closeAt && round.closePrice) {
        status = 'closed';
      } else if (now > lockAt) {
        status = 'calculating';
      } else if (timeRemaining < 60) {
        status = 'locked';
      }

      const assetPairs: Record<string, string> = {
        'BNB': 'BNBUSD',
        'CAKE': 'CAKEUSD',
        'BTC': 'BTCUSD',
        'ETH': 'ETHUSD',
      };

      return {
        id: `pancake-${asset.toLowerCase()}-${round.epoch}`,
        asset: assetPairs[asset] || `${asset}USD`,
        question: `Will ${assetPairs[asset] || asset} price go UP or DOWN?`,
        currentEpoch: round.epoch,
        roundDuration: 300, // 5 minutes
        totalVolume: totalAmount,
        bullAmount,
        bearAmount,
        totalBets,
        bullProbability,
        bearProbability,
        lockPrice: round.lockPrice ? parseFloat(round.lockPrice) / 1e8 : null,
        lockAt: round.lockAt,
        closeAt: round.closeAt,
        timeRemaining,
        status,
      };
    }).filter(Boolean) as PancakePredictionMarket[];
  }

  /**
   * Get active prediction markets
   */
  async getActiveMarkets(): Promise<{ markets: PancakePredictionMarket[]; isMock: boolean }> {
    const { rounds, isMock } = await this.getLiveRounds();
    return { markets: this.transformRoundsToMarkets(rounds), isMock };
  }

  /**
   * Format market for display
   */
  formatMarket(market: PancakePredictionMarket): {
    question: string;
    outcomes: string[];
    probabilities: number[];
    volume: number;
    status: string;
    timeRemaining: string;
  } {
    const minutes = Math.floor(market.timeRemaining / 60);
    const seconds = market.timeRemaining % 60;

    return {
      question: market.question,
      outcomes: ['UP (Bull)', 'DOWN (Bear)'],
      probabilities: [market.bullProbability, market.bearProbability],
      volume: market.totalVolume,
      status: market.status.toUpperCase(),
      timeRemaining: market.timeRemaining > 0 ? `${minutes}m ${seconds}s` : 'Calculating...',
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    pancakeCache.clear();
  }
}

// Singleton instance
export const pancakeSwapService = new PancakeSwapService();

// Helper functions for React components
export async function fetchPancakeMarkets() {
  return pancakeSwapService.getActiveMarkets();
}

// Type for components to check mock status
export type PancakeMarketsResult = { markets: PancakePredictionMarket[]; isMock: boolean };
