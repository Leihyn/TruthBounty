/**
 * PancakeSwap Prediction Fetcher
 *
 * Fetches prediction markets from PancakeSwap on BSC
 * Uses direct RPC calls for real-time round data
 */

import {
  BasePlatformFetcher,
  PaginatedResult,
  UnifiedMarket,
  registerPlatformFetcher,
  normalizeMarketId,
} from '../market-fetcher';

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const PREDICTION_CONTRACT = '0x18B2A687610328590Bc8F2e5fEdde3b582A49cdA';

export class PancakeSwapFetcher extends BasePlatformFetcher {
  platform = 'pancakeswap';

  async fetchPage(cursor?: string, limit?: number): Promise<PaginatedResult<UnifiedMarket>> {
    try {
      // Get current epoch
      const epochResult = await this.rpcCall('0x76671808'); // currentEpoch()
      const currentEpoch = BigInt(epochResult);

      // Fetch last 5 rounds
      const markets: UnifiedMarket[] = [];
      const assets = ['BNB', 'CAKE'];

      for (let i = 0; i < 5; i++) {
        const epoch = currentEpoch - BigInt(i);
        if (epoch <= 0n) continue;

        try {
          const roundData = await this.getRoundData(epoch);
          if (roundData.lockTimestamp > 0n) {
            for (const asset of assets) {
              markets.push(this.transformRound(roundData, epoch, asset));
            }
          }
        } catch (e) {
          // Round may not exist
        }
      }

      return {
        data: markets,
        hasMore: false,
        nextCursor: undefined,
      };
    } catch (error: any) {
      console.error('[PancakeSwap] Fetch error:', error.message);
      return { data: [], hasMore: false };
    }
  }

  private async rpcCall(data: string): Promise<string> {
    const response = await fetch(BSC_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_call',
        params: [{ to: PREDICTION_CONTRACT, data }, 'latest'],
      }),
    });

    const result = await response.json();
    return result.result || '0x';
  }

  private async getRoundData(epoch: bigint): Promise<any> {
    const data = '0x8c65c81f' + epoch.toString(16).padStart(64, '0');
    const result = await this.rpcCall(data);

    const hex = result.slice(2);
    const getSlot = (i: number) => BigInt('0x' + hex.slice(i * 64, (i + 1) * 64));

    return {
      epoch: getSlot(0),
      startTimestamp: getSlot(1),
      lockTimestamp: getSlot(2),
      closeTimestamp: getSlot(3),
      lockPrice: getSlot(4),
      closePrice: getSlot(5),
      totalAmount: getSlot(8),
      bullAmount: getSlot(9),
      bearAmount: getSlot(10),
    };
  }

  private transformRound(round: any, epoch: bigint, asset: string): UnifiedMarket {
    const now = Math.floor(Date.now() / 1000);
    const lockTime = Number(round.lockTimestamp);
    const closeTime = Number(round.closeTimestamp) || lockTime + 300;

    const bullAmount = Number(round.bullAmount) / 1e18;
    const bearAmount = Number(round.bearAmount) / 1e18;
    const totalAmount = bullAmount + bearAmount;

    const bullProb = totalAmount > 0 ? (bullAmount / totalAmount) * 100 : 50;
    const bearProb = totalAmount > 0 ? (bearAmount / totalAmount) * 100 : 50;

    return {
      id: normalizeMarketId(this.platform, `${asset}-${epoch}`),
      platform: this.platform,
      externalId: `${asset}-${epoch}`,
      title: `${asset}/USD - Round ${epoch}`,
      question: `Will ${asset} price go UP or DOWN?`,
      category: 'Crypto',
      outcomes: [
        { id: 'bull', name: 'UP (Bull)', probability: bullProb, odds: bullProb > 0 ? 100/bullProb : 2 },
        { id: 'bear', name: 'DOWN (Bear)', probability: bearProb, odds: bearProb > 0 ? 100/bearProb : 2 },
      ],
      status: now < lockTime ? 'open' : 'closed',
      yesPrice: bullProb / 100,
      noPrice: bearProb / 100,
      volume: totalAmount,
      expiresAt: closeTime * 1000,
      closesAt: lockTime * 1000,
      metadata: {
        epoch: epoch.toString(),
        asset,
        lockPrice: Number(round.lockPrice) / 1e8,
        roundDuration: 300,
      },
      chain: 'BNB Chain',
      currency: 'BNB',
      fetchedAt: Date.now(),
    };
  }
}

registerPlatformFetcher(new PancakeSwapFetcher());
export const pancakeswapFetcher = new PancakeSwapFetcher();
