/**
 * Polymarket Gamma API Integration
 *
 * This service provides access to Polymarket's Gamma API for fetching
 * market data, events, and predictions.
 */

// Base configuration
export const POLYMARKET_CONFIG = {
  GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  ENDPOINTS: {
    MARKETS: '/markets',
    EVENTS: '/events',
  },
  CACHE_DURATION: 60 * 1000, // 1 minute
} as const;

// TypeScript Types
export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  marketSlug: string;
  endDate: string | null;
  gameStartTime: string | null;
  questionID: string;
  clobTokenIds: string[];
  conditionId: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  volumeNum: number;
  liquidityNum: number;
  acceptingOrders: boolean;
  negRisk: boolean;
  tags?: string[];
  events?: PolymarketEventRef[];
}

export interface PolymarketEventRef {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  startDate: string | null;
  creationDate: string;
  endDate: string | null;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: string;
  volume: string;
  createdAt: string;
  updatedAt: string;
  enableOrderBook: boolean;
  markets?: PolymarketMarket[];
}

export interface PolymarketEvent extends PolymarketEventRef {
  markets: PolymarketMarket[];
}

export interface MarketQueryParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  enableOrderBook?: boolean;
  tag?: string;
}

export interface EventQueryParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  tag?: string;
}

export interface PolymarketPosition {
  marketId: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface PolymarketPrediction {
  marketId: string;
  marketQuestion: string;
  outcome: string;
  shares: number;
  entryPrice: number;
  exitPrice?: number;
  timestamp: number;
  isCorrect?: boolean;
  profit?: number;
  status: 'open' | 'won' | 'lost' | 'pending';
}

// Cache implementation
class MarketCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > POLYMARKET_CONFIG.CACHE_DURATION;
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

const marketCache = new MarketCache();

/**
 * Polymarket API Service
 */
export class PolymarketService {
  private baseUrl: string;

  constructor(baseUrl: string = POLYMARKET_CONFIG.GAMMA_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  /**
   * Fetch markets from Polymarket
   */
  async getMarkets(params: MarketQueryParams = {}): Promise<PolymarketMarket[]> {
    const cacheKey = `markets:${JSON.stringify(params)}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    const queryString = this.buildQueryString(params);

    try {
      const response = await fetch(`/api/polymarket?endpoint=markets&${queryString.slice(1)}`);

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      marketCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching Polymarket markets:', error);
      throw error;
    }
  }

  /**
   * Get a specific market by ID
   */
  async getMarket(marketId: string): Promise<PolymarketMarket | null> {
    const cacheKey = `market:${marketId}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}${POLYMARKET_CONFIG.ENDPOINTS.MARKETS}/${marketId}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      marketCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch events from Polymarket
   */
  async getEvents(params: EventQueryParams = {}): Promise<PolymarketEvent[]> {
    const cacheKey = `events:${JSON.stringify(params)}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}${POLYMARKET_CONFIG.ENDPOINTS.EVENTS}${queryString}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      marketCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching Polymarket events:', error);
      throw error;
    }
  }

  /**
   * Get a specific event by slug
   */
  async getEvent(slug: string): Promise<PolymarketEvent | null> {
    const cacheKey = `event:${slug}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}${POLYMARKET_CONFIG.ENDPOINTS.EVENTS}/${slug}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      marketCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching event ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get trending markets (active markets with high volume)
   */
  async getTrendingMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
    const markets = await this.getMarkets({
      active: true,
      closed: false,
      archived: false,
      limit: 100,
      enableOrderBook: true,
    });

    // Filter out old markets (older than 6 months) and sort by volume
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return markets
      .filter(market => {
        // Keep markets without endDate or with recent endDate
        if (!market.endDate) return true;
        const endDate = new Date(market.endDate);
        return endDate > sixMonthsAgo;
      })
      .sort((a, b) => b.volumeNum - a.volumeNum)
      .slice(0, limit);
  }

  /**
   * Get active markets
   */
  async getActiveMarkets(limit: number = 20): Promise<PolymarketMarket[]> {
    const markets = await this.getMarkets({
      active: true,
      closed: false,
      archived: false,
      limit: 100,
    });

    // Filter out old markets and sort by volume
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return markets
      .filter(market => {
        if (!market.endDate) return true;
        const endDate = new Date(market.endDate);
        return endDate > sixMonthsAgo;
      })
      .sort((a, b) => b.volumeNum - a.volumeNum)
      .slice(0, limit);
  }

  /**
   * Search markets by keyword
   */
  async searchMarkets(query: string, limit: number = 10): Promise<PolymarketMarket[]> {
    const markets = await this.getActiveMarkets(100);

    const lowerQuery = query.toLowerCase();
    return markets
      .filter(market =>
        market.question.toLowerCase().includes(lowerQuery) ||
        market.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    marketCache.clear();
  }

  /**
   * Calculate potential profit
   */
  calculatePotentialProfit(shares: number, buyPrice: number, currentPrice: number): number {
    return shares * (currentPrice - buyPrice);
  }

  /**
   * Calculate probability from price
   */
  getProbability(price: string): number {
    return parseFloat(price) * 100;
  }

  /**
   * Format market for display
   */
  formatMarket(market: PolymarketMarket): {
    question: string;
    outcomes: string[];
    probabilities: number[];
    volume: number;
    status: 'active' | 'closed' | 'archived';
  } {
    return {
      question: market.question,
      outcomes: market.outcomes,
      probabilities: market.outcomePrices.map(price => this.getProbability(price)),
      volume: market.volumeNum,
      status: market.archived ? 'archived' : market.closed ? 'closed' : 'active',
    };
  }
}

// Singleton instance
export const polymarketService = new PolymarketService();

// Helper functions for React components
export async function fetchTrendingMarkets(limit?: number) {
  return polymarketService.getTrendingMarkets(limit);
}

export async function fetchActiveMarkets(limit?: number) {
  return polymarketService.getActiveMarkets(limit);
}

export async function searchPolymarkets(query: string, limit?: number) {
  return polymarketService.searchMarkets(query, limit);
}

export async function fetchMarketById(id: string) {
  return polymarketService.getMarket(id);
}

export async function fetchEventBySlug(slug: string) {
  return polymarketService.getEvent(slug);
}
