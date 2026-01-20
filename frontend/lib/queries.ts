/**
 * Centralized React Query Hooks
 *
 * This file contains all data fetching logic for the app.
 * Benefits:
 * - Automatic caching (no duplicate requests)
 * - Automatic deduplication (same query = same request)
 * - Background refetching
 * - Shared state across components
 * - Proper loading/error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  truthScore: number;
  winRate: number;
  totalBets?: number;
  totalPredictions?: number;
  totalVolume?: number;
  pnl?: number;
  tier: number;
  platforms: string[];
  platformBreakdown?: {
    platform: string;
    bets: number;
    winRate: number;
    score: number;
    volume?: number;
    pnl?: number;
  }[];
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  total: number;
  cached: boolean;
  cacheAge: number;
  isRefreshing: boolean;
  lastUpdate: number;
}

export interface MarketData {
  id: string;
  title: string;
  platform: string;
  probability?: number;
  volume?: number;
  endDate?: string;
  status?: string;
}

export interface PlatformStats {
  platform: string;
  totalVolume: number;
  totalBets: number;
  activeMarkets: number;
  topTraders: LeaderboardEntry[];
}

// ============================================
// Query Keys - Centralized for cache management
// ============================================

export const queryKeys = {
  // Leaderboard
  leaderboard: (limit?: number) => ['leaderboard', limit ?? 500] as const,
  leaderboardByPlatform: (platform: string, limit?: number) =>
    ['leaderboard', platform, limit ?? 100] as const,

  // Individual platforms
  platformLeaderboard: (platform: string, limit?: number) =>
    ['platform-leaderboard', platform, limit ?? 100] as const,

  // Markets
  markets: (platform: string) => ['markets', platform] as const,
  allMarkets: () => ['markets', 'all'] as const,

  // User profiles
  userProfile: (address: string) => ['user-profile', address] as const,

  // Stats
  platformStats: () => ['platform-stats'] as const,
  dashboardStats: () => ['dashboard-stats'] as const,
};

// ============================================
// Fetch Helpers
// ============================================

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// ============================================
// Leaderboard Hooks
// ============================================

/**
 * Main leaderboard hook - fetches unified leaderboard data
 * Cached for 60 seconds, shared across all components
 * Auto-retries when empty data is returned (server cache stale)
 */
export function useLeaderboard(limit = 500) {
  return useQuery({
    queryKey: queryKeys.leaderboard(limit),
    queryFn: async () => {
      const response = await fetchJson<LeaderboardResponse>(`/api/unified-leaderboard?limit=${limit}`);
      // If API returns empty data, force refresh and throw to trigger retry
      if (response.success && (!response.data || response.data.length === 0)) {
        // Try with refresh=true to force server-side cache refresh
        const refreshed = await fetchJson<LeaderboardResponse>(`/api/unified-leaderboard?limit=${limit}&refresh=true`);
        if (refreshed.data && refreshed.data.length > 0) {
          return refreshed;
        }
        // Still empty? Throw to trigger retry
        throw new Error('Leaderboard data is empty - server cache may be stale');
      }
      return response;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3, // Retry up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Leaderboard filtered by platform
 */
export function useLeaderboardByPlatform(platform: string, limit = 100) {
  return useQuery({
    queryKey: queryKeys.leaderboardByPlatform(platform, limit),
    queryFn: () =>
      fetchJson<LeaderboardResponse>(
        `/api/unified-leaderboard?limit=${limit}&platform=${encodeURIComponent(platform)}`
      ),
    staleTime: 60 * 1000,
    enabled: !!platform,
  });
}

/**
 * Hook to manually refresh leaderboard data
 */
export function useRefreshLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/unified-leaderboard?limit=500&refresh=true');
      return res.json();
    },
    onSuccess: (data) => {
      // Update all leaderboard queries with fresh data
      queryClient.setQueryData(queryKeys.leaderboard(500), data);
    },
  });
}

// ============================================
// Platform-Specific Leaderboard Hooks
// ============================================

const PLATFORM_ENDPOINTS: Record<string, string> = {
  polymarket: '/api/polymarket-leaderboard',
  pancakeswap: '/api/pancakeswap-leaderboard',
  manifold: '/api/manifold-leaderboard',
  metaculus: '/api/metaculus-leaderboard',
  kalshi: '/api/kalshi-leaderboard',
  azuro: '/api/azuro-leaderboard',
  gnosis: '/api/gnosis-leaderboard',
  drift: '/api/drift-leaderboard',
  overtime: '/api/overtime-leaderboard',
  speedmarkets: '/api/speedmarkets-leaderboard',
  limitless: '/api/limitless-leaderboard',
  sxbet: '/api/sxbet-leaderboard',
};

/**
 * Fetch leaderboard for a specific platform
 */
export function usePlatformLeaderboard(platform: string, limit = 100) {
  const endpoint = PLATFORM_ENDPOINTS[platform.toLowerCase()];

  return useQuery({
    queryKey: queryKeys.platformLeaderboard(platform, limit),
    queryFn: () => fetchJson<{ data: LeaderboardEntry[] }>(`${endpoint}?limit=${limit}`),
    staleTime: 60 * 1000,
    enabled: !!endpoint,
  });
}

// ============================================
// Market Hooks
// ============================================

const MARKET_ENDPOINTS: Record<string, string> = {
  polymarket: '/api/polymarket',
  pancakeswap: '/api/pancakeswap',
  overtime: '/api/overtime',
  speedmarkets: '/api/speedmarkets',
  limitless: '/api/limitless',
  azuro: '/api/azuro',
  sxbet: '/api/sxbet',
  manifold: '/api/manifold',
  metaculus: '/api/metaculus',
  kalshi: '/api/kalshi',
  drift: '/api/drift',
};

/**
 * Fetch markets for a specific platform
 */
export function useMarkets(platform: string, limit = 50) {
  const endpoint = MARKET_ENDPOINTS[platform.toLowerCase()];

  return useQuery({
    queryKey: queryKeys.markets(platform),
    queryFn: () => fetchJson<{ data: MarketData[] }>(`${endpoint}?limit=${limit}`),
    staleTime: 2 * 60 * 1000, // Markets change less frequently
    enabled: !!endpoint,
  });
}

/**
 * Fetch all markets from all platforms (for Markets page)
 */
export function useAllMarkets() {
  return useQuery({
    queryKey: queryKeys.allMarkets(),
    queryFn: async () => {
      const platforms = Object.keys(MARKET_ENDPOINTS);
      const results = await Promise.allSettled(
        platforms.map(async (platform) => {
          const endpoint = MARKET_ENDPOINTS[platform];
          try {
            const res = await fetch(`${endpoint}?limit=20`);
            if (!res.ok) return { platform, data: [], error: true };
            const json = await res.json();
            return {
              platform,
              data: (json.data || json.markets || []).map((m: any) => ({ ...m, platform })),
              error: false,
            };
          } catch {
            return { platform, data: [], error: true };
          }
        })
      );

      return results
        .filter((r): r is PromiseFulfilledResult<{ platform: string; data: MarketData[]; error: boolean }> =>
          r.status === 'fulfilled'
        )
        .map(r => r.value);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// User Profile Hooks
// ============================================

/**
 * Get a user's profile from leaderboard data
 * This reuses the leaderboard cache instead of making separate API calls
 */
export function useUserProfile(address: string | undefined) {
  const { data: leaderboard, isLoading, error } = useLeaderboard(1000);

  const userData = address && leaderboard?.data
    ? leaderboard.data.find(
        (entry) => entry.address.toLowerCase() === address.toLowerCase()
      )
    : null;

  return {
    data: userData,
    isLoading,
    error,
    isFound: !!userData,
  };
}

// ============================================
// Dashboard Stats Hooks
// ============================================

/**
 * Dashboard statistics - aggregated from leaderboard
 */
export function useDashboardStats() {
  const { data: leaderboard, isLoading } = useLeaderboard(500);

  if (!leaderboard?.data) {
    return { data: null, isLoading };
  }

  const traders = leaderboard.data;
  const stats = {
    totalTraders: traders.length,
    totalVolume: traders.reduce((sum, t) => sum + (t.totalVolume || 0), 0),
    avgWinRate: traders.length > 0
      ? traders.reduce((sum, t) => sum + (t.winRate || 0), 0) / traders.length
      : 0,
    topPerformers: traders.slice(0, 10),
    platformDistribution: {} as Record<string, number>,
  };

  // Count traders per platform
  traders.forEach(t => {
    (t.platforms || []).forEach(p => {
      stats.platformDistribution[p] = (stats.platformDistribution[p] || 0) + 1;
    });
  });

  return { data: stats, isLoading };
}

// ============================================
// Home Page Hooks
// ============================================

export interface HomePlatformStats {
  totalTraders: number;
  totalPredictions: number;
  totalVolumeBNB: number;
  totalVolumeUSD: number;
  supportedChains: number;
}

/**
 * Platform stats for home page hero
 * Long cache since this data changes slowly
 */
export function useHomePlatformStats() {
  return useQuery({
    queryKey: queryKeys.platformStats(),
    queryFn: () => fetchJson<HomePlatformStats>('/api/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export interface CaseStudyTrader {
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
}

/**
 * Case study trader for home page
 * Fetches top Polymarket trader
 */
export function useCaseStudyTrader() {
  return useQuery({
    queryKey: ['case-study-trader'],
    queryFn: async () => {
      const res = await fetch('/api/polymarket-leaderboard?limit=1');
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        return data.data[0] as CaseStudyTrader;
      }
      // Fallback data
      return {
        address: '0x5668...5839',
        username: 'Theo4',
        truthScore: 1000,
        winRate: 95,
        totalBets: 86500,
      } as CaseStudyTrader;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================
// Simulation/Copy Trading Hooks
// ============================================

export function useSimulationStats() {
  return useQuery({
    queryKey: ['simulation-stats'],
    queryFn: () => fetchJson<any>('/api/copy-trading-stats'),
    staleTime: 30 * 1000, // Refresh more frequently for simulation
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// ============================================
// Dashboard Simulation Hooks
// ============================================

export interface SimulationStats {
  totalTrades: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  totalPnl: number;
  totalVolume: number;
}

export interface PendingBet {
  id: number;
  platform: 'pancakeswap' | 'polymarket';
  market: string;
  position: string;
  amount: number;
  entryPrice?: number;
  timestamp: string;
}

/**
 * Fetch PancakeSwap simulation stats for a user
 * With automatic 30-second polling
 */
export function usePancakeSimulationStats(address: string | undefined) {
  return useQuery({
    queryKey: ['simulation', 'pancakeswap', 'stats', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/copy-trading/simulation?stats=true&follower=${address}`);
      if (!res.ok) return null;
      const data = await res.json();
      const followerStats = data.followers?.find((f: any) =>
        f.follower.toLowerCase() === address.toLowerCase()
      );
      if (!followerStats) return null;

      let winRateNum = 0;
      if (typeof followerStats.winRate === 'string') {
        winRateNum = parseFloat(followerStats.winRate.replace('%', '')) || 0;
      } else if (typeof followerStats.winRate === 'number') {
        winRateNum = followerStats.winRate;
      }

      return {
        totalTrades: followerStats.totalTrades || 0,
        wins: followerStats.wins || 0,
        losses: followerStats.losses || 0,
        pending: followerStats.pending || 0,
        winRate: winRateNum,
        totalPnl: parseFloat(followerStats.totalPnlBNB || followerStats.totalPnlBnb) || 0,
        totalVolume: parseFloat(followerStats.totalVolumeBNB || followerStats.totalVolumeBnb) || 0,
      } as SimulationStats;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    enabled: !!address,
  });
}

/**
 * Fetch Polymarket simulation stats for a user
 * With automatic 30-second polling
 */
export function usePolymarketSimulationStats(address: string | undefined) {
  return useQuery({
    queryKey: ['simulation', 'polymarket', 'stats', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/polymarket/simulate?stats=true&follower=${address}`);
      if (!res.ok) return null;
      const data = await res.json();
      const followerStats = data.followers?.find((f: any) =>
        f.follower.toLowerCase() === address.toLowerCase()
      );
      if (!followerStats) return null;

      let winRateNum = 0;
      if (typeof followerStats.winRate === 'string') {
        winRateNum = parseFloat(followerStats.winRate.replace('%', '')) || 0;
      } else if (typeof followerStats.winRate === 'number') {
        winRateNum = followerStats.winRate;
      }

      return {
        totalTrades: followerStats.totalTrades || 0,
        wins: followerStats.wins || 0,
        losses: followerStats.losses || 0,
        pending: followerStats.pending || 0,
        winRate: winRateNum,
        totalPnl: parseFloat(followerStats.totalPnlUsd || followerStats.totalPnlUSD) || 0,
        totalVolume: parseFloat(followerStats.totalVolumeUsd || followerStats.totalVolumeUSD) || 0,
      } as SimulationStats;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    enabled: !!address,
  });
}

/**
 * Fetch pending bets and recent trades for a user
 * With automatic 30-second polling
 */
export function useDashboardTrades(address: string | undefined) {
  return useQuery({
    queryKey: ['simulation', 'trades', address],
    queryFn: async () => {
      if (!address) return { pendingBets: [], recentTrades: [] };

      // Fetch PancakeSwap trades
      const pancakeBetsRes = await fetch(`/api/copy-trading/simulation?follower=${address}&limit=50`);
      let pancakePending: PendingBet[] = [];
      let pancakeTrades: any[] = [];

      if (pancakeBetsRes.ok) {
        const data = await pancakeBetsRes.json();
        pancakeTrades = data.trades || [];
        pancakePending = pancakeTrades
          .filter((t: any) => t.outcome === 'pending')
          .map((t: any) => ({
            id: t.id,
            platform: 'pancakeswap' as const,
            market: `Epoch ${t.epoch}`,
            position: t.isBull ? 'Bull' : 'Bear',
            amount: parseFloat(t.amountBNB || t.simulated_amount || '0'),
            timestamp: t.simulatedAt || t.simulated_at,
          }));
      }

      // Fetch Polymarket trades
      const polyBetsRes = await fetch(`/api/polymarket/simulate?follower=${address}&limit=50`);
      let polyPending: PendingBet[] = [];
      let polyTrades: any[] = [];

      if (polyBetsRes.ok) {
        const polyData = await polyBetsRes.json();
        polyTrades = polyData.trades || [];
        polyPending = polyTrades
          .filter((t: any) => t.outcome === 'pending')
          .map((t: any) => ({
            id: t.id,
            platform: 'polymarket' as const,
            market: t.marketQuestion || t.market_question || `Market ${(t.marketId || t.market_id)?.slice(0, 8)}...`,
            position: t.outcomeSelected || t.outcome_selected || 'Unknown',
            amount: parseFloat(t.amountUsd || t.amount_usd || '0'),
            entryPrice: t.priceAtEntry || t.price_at_entry ? parseFloat(t.priceAtEntry || t.price_at_entry) : undefined,
            timestamp: t.simulatedAt || t.simulated_at,
          }));
      }

      const pendingBets = [...pancakePending, ...polyPending].sort((a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );

      const recentResolved = [
        ...pancakeTrades.filter((t: any) => t.outcome !== 'pending').slice(0, 5).map((t: any) => ({ ...t, _platform: 'pancakeswap' })),
        ...polyTrades.filter((t: any) => t.outcome !== 'pending').slice(0, 5).map((t: any) => ({ ...t, _platform: 'polymarket' })),
      ].sort((a, b) =>
        new Date(b.resolvedAt || b.resolved_at || b.simulatedAt || b.simulated_at || 0).getTime() -
        new Date(a.resolvedAt || a.resolved_at || a.simulatedAt || a.simulated_at || 0).getTime()
      ).slice(0, 10);

      return { pendingBets, recentTrades: recentResolved };
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    enabled: !!address,
  });
}

// ============================================
// Markets Page Hooks
// ============================================

export interface PlatformMarketsResult {
  markets: any[];
  isMock: boolean;
  error?: string;
}

/**
 * Hook for Monitor page - fetches copy trading monitor data
 * 10-second polling interval
 */
export function useMonitorData(enabled: boolean = true) {
  return useQuery({
    queryKey: ['copy-trading', 'monitor'],
    queryFn: async () => {
      const res = await fetch('/api/copy-trading/monitor');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: enabled ? 10 * 1000 : false,
    refetchIntervalInBackground: false,
  });
}

/**
 * Generic hook for fetching markets using a provided fetch function
 * Only active tab polls, other tabs use cached data
 */
export function usePlatformMarketsWithFetcher<T>(
  platform: string,
  fetcher: () => Promise<{ markets: T[]; isMock: boolean; error?: string }>,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['platform-markets', platform],
    queryFn: async (): Promise<{ markets: T[]; isMock: boolean; error?: string }> => {
      try {
        const result = await fetcher();
        if ('error' in result && result.error) {
          return { markets: [], isMock: false, error: result.error };
        }
        return result;
      } catch (error: any) {
        console.error(`Error fetching ${platform} markets:`, error);
        return { markets: [], isMock: false, error: error.message };
      }
    },
    enabled, // Only fetch when enabled (active tab) - prevents 11 parallel API calls
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: enabled ? 30 * 1000 : false, // Only poll if enabled (active tab)
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for Copy Trading page simulation stats overview
 */
export function useCopyTradingSimStats() {
  return useQuery({
    queryKey: ['copy-trading', 'sim-stats'],
    queryFn: async () => {
      const res = await fetch('/api/copy-trading/simulation?stats=true');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for SimulationTab component - fetches stats and trades
 */
export function usePancakeSimulationTab(followerAddress?: string) {
  return useQuery({
    queryKey: ['copy-trading', 'pancake-sim-tab', followerAddress],
    queryFn: async () => {
      const suffix = followerAddress ? `&follower=${followerAddress}` : '';

      const [statsRes, tradesRes] = await Promise.all([
        fetch(`/api/copy-trading/simulation?stats=true${suffix}`),
        fetch(`/api/copy-trading/simulation?limit=20${suffix}`),
      ]);

      const stats = statsRes.ok ? await statsRes.json() : null;
      const tradesData = tradesRes.ok ? await tradesRes.json() : { trades: [] };

      return {
        stats,
        trades: tradesData.trades || [],
      };
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}

// ============================================
// Traders Discovery Hooks
// ============================================

export interface DiscoveryTrader {
  wallet_address: string;
  username?: string;
  total_bets: number;
  wins: number;
  win_rate: number;
  truth_score: number;
  total_volume: string;
}

/**
 * Discovery traders for traders page
 * Reuses the main leaderboard cache to avoid duplicate fetches
 */
export function useDiscoveryTraders(limit = 8) {
  const { data: leaderboard, isLoading, error } = useLeaderboard(500);

  const traders: DiscoveryTrader[] = leaderboard?.data
    ? leaderboard.data.slice(0, limit).map(entry => ({
        wallet_address: entry.address,
        username: entry.displayName,
        total_bets: entry.totalBets || entry.totalPredictions || 0,
        wins: Math.round((entry.winRate / 100) * (entry.totalBets || entry.totalPredictions || 0)),
        win_rate: entry.winRate,
        truth_score: entry.truthScore,
        total_volume: String(entry.totalVolume || 0),
      }))
    : [];

  // Sort by activity (total bets) for "most active" section
  const recentlyActive = [...traders]
    .sort((a, b) => b.total_bets - a.total_bets)
    .slice(0, 4);

  return {
    topTraders: traders,
    recentlyActive,
    isLoading,
    error,
  };
}

// ============================================
// Prefetching Helpers
// ============================================

/**
 * Prefetch leaderboard data (call on app init or hover)
 */
export function usePrefetchLeaderboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.leaderboard(500),
      queryFn: () => fetchJson<LeaderboardResponse>('/api/unified-leaderboard?limit=500'),
      staleTime: 60 * 1000,
    });
  };
}

// ============================================
// Cache Invalidation Helpers
// ============================================

/**
 * Invalidate all leaderboard-related queries
 */
export function useInvalidateLeaderboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['platform-leaderboard'] });
  };
}
