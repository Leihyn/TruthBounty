/**
 * Thales Speed Markets Fetcher
 *
 * Speed Markets allow UP/DOWN predictions on BTC/ETH within set timeframes
 * on Optimism, Arbitrum, and Base
 */

import {
  BasePlatformFetcher,
  PaginatedResult,
  UnifiedMarket,
  registerPlatformFetcher,
  normalizeMarketId,
} from '../market-fetcher';

const SPEED_MARKETS_API = 'https://overtimemarketsv2.xyz';

const TIME_FRAMES = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
];

export class SpeedMarketsFetcher extends BasePlatformFetcher {
  platform = 'speedmarkets';

  async fetchPage(cursor?: string, limit?: number): Promise<PaginatedResult<UnifiedMarket>> {
    try {
      // Speed Markets are dynamic - generate markets for available assets and timeframes
      const assets = ['BTC', 'ETH'];
      const markets: UnifiedMarket[] = [];
      const now = Date.now();

      // Fetch current prices for reference
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', {
        signal: AbortSignal.timeout(10000),
      });

      let prices = { bitcoin: { usd: 95000 }, ethereum: { usd: 3500 } };
      if (priceResponse.ok) {
        prices = await priceResponse.json();
      }

      const priceMap: Record<string, number> = {
        BTC: prices.bitcoin?.usd || 95000,
        ETH: prices.ethereum?.usd || 3500,
      };

      // Create markets for each asset and timeframe
      for (const asset of assets) {
        for (const timeframe of TIME_FRAMES) {
          const price = priceMap[asset];
          const marketId = `${asset}-${timeframe.seconds}-${Math.floor(now / 60000)}`;

          markets.push({
            id: normalizeMarketId(this.platform, marketId),
            platform: this.platform,
            externalId: marketId,
            title: `${asset}/USD ${timeframe.label} Prediction`,
            question: `Will ${asset} go UP or DOWN in ${timeframe.label}?`,
            category: 'Crypto',
            outcomes: [
              { id: 'up', name: 'UP', probability: 50, odds: 1.9 },
              { id: 'down', name: 'DOWN', probability: 50, odds: 1.9 },
            ],
            status: 'open',
            yesPrice: 0.5,
            noPrice: 0.5,
            volume: 0,
            expiresAt: now + (timeframe.seconds * 1000),
            metadata: {
              asset,
              currentPrice: price,
              timeframe: timeframe.label,
              timeframeSec: timeframe.seconds,
              estimatedPayout: 1.9,
            },
            chain: 'Optimism',
            currency: 'sUSD',
            fetchedAt: now,
          });
        }
      }

      return {
        data: markets,
        hasMore: false,
        nextCursor: undefined,
      };
    } catch (error: any) {
      console.error('[SpeedMarkets] Fetch error:', error.message);
      return { data: [], hasMore: false };
    }
  }
}

registerPlatformFetcher(new SpeedMarketsFetcher());
export const speedmarketsFetcher = new SpeedMarketsFetcher();
