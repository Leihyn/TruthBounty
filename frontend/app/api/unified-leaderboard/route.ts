import { NextRequest, NextResponse } from 'next/server';
import { TIER_THRESHOLDS, ReputationTier } from '@/lib/contracts';

/**
 * Unified Leaderboard API - Cache-First Pattern
 *
 * Best practice approach:
 * 1. Always return cached data immediately (no waiting)
 * 2. Background refresh only when explicitly requested
 * 3. Let users control refresh via UI button
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Simple cache structure
interface LeaderboardCache {
  data: any[];
  lastUpdate: number;
  isRefreshing: boolean;
}

const cache: LeaderboardCache = {
  data: [],
  lastUpdate: 0,
  isRefreshing: false,
};

// Cache for 10 minutes - user can manually refresh anytime
const CACHE_TTL = 10 * 60 * 1000;

function getTierFromScore(score: number): ReputationTier {
  if (score >= TIER_THRESHOLDS[ReputationTier.DIAMOND]) return ReputationTier.DIAMOND;
  if (score >= TIER_THRESHOLDS[ReputationTier.PLATINUM]) return ReputationTier.PLATINUM;
  if (score >= TIER_THRESHOLDS[ReputationTier.GOLD]) return ReputationTier.GOLD;
  if (score >= TIER_THRESHOLDS[ReputationTier.SILVER]) return ReputationTier.SILVER;
  return ReputationTier.BRONZE;
}

// Platform configs - ordered by typical response speed
const PLATFORMS = [
  { name: 'Manifold Markets', endpoint: '/api/manifold-leaderboard' },
  { name: 'Metaculus', endpoint: '/api/metaculus-leaderboard' },
  { name: 'Kalshi', endpoint: '/api/kalshi-leaderboard' },
  { name: 'PancakeSwap Prediction', endpoint: '/api/pancakeswap-leaderboard' },
  { name: 'Azuro', endpoint: '/api/azuro-leaderboard' },
  { name: 'Gnosis/Omen', endpoint: '/api/gnosis-leaderboard' },
  { name: 'Drift BET', endpoint: '/api/drift-leaderboard' },
  { name: 'Overtime', endpoint: '/api/overtime-leaderboard' },
  { name: 'Speed Markets', endpoint: '/api/speedmarkets-leaderboard' },
  { name: 'Limitless', endpoint: '/api/limitless-leaderboard' },
  { name: 'Polymarket', endpoint: '/api/polymarket-leaderboard' },
  { name: 'SX Bet', endpoint: '/api/sxbet-leaderboard' },
];

// Fetch single platform with timeout
async function fetchPlatform(baseUrl: string, platform: typeof PLATFORMS[0]): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(`${baseUrl}${platform.endpoint}?limit=100`, {
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const result = await res.json();
    return (result.data || []).map((entry: any) => ({
      ...entry,
      totalPredictions: entry.totalBets || entry.totalPredictions || 0,
      rawScore: entry.truthScore,
      normalizedScore: entry.truthScore,
      platforms: [platform.name],
      platformBreakdown: entry.platformBreakdown || [{
        platform: platform.name,
        bets: entry.totalBets || 0,
        winRate: entry.winRate || 0,
        score: entry.truthScore || 0,
        volume: entry.totalVolume,
        pnl: entry.pnl || 0,
      }],
    }));
  } catch (err) {
    console.error(`[Leaderboard] ${platform.name} error:`, err);
    return [];
  }
}

// Full refresh - fetches all platforms in parallel
async function refreshCache(baseUrl: string): Promise<void> {
  if (cache.isRefreshing) return;

  cache.isRefreshing = true;
  console.log('[Leaderboard] Starting full refresh...');

  try {
    // Fetch all platforms in parallel
    const results = await Promise.all(
      PLATFORMS.map(p => fetchPlatform(baseUrl, p))
    );

    // Combine all data
    const allData = results.flat();

    // Sort by score
    allData.sort((a, b) => (b.truthScore || 0) - (a.truthScore || 0));

    // Add ranks and tiers
    cache.data = allData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      tier: getTierFromScore(entry.truthScore || 0),
    }));

    cache.lastUpdate = Date.now();
    console.log(`[Leaderboard] Refresh complete: ${cache.data.length} traders`);
  } catch (err) {
    console.error('[Leaderboard] Refresh error:', err);
  } finally {
    cache.isRefreshing = false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const platform = searchParams.get('platform');
  const forceRefresh = searchParams.get('refresh') === 'true';

  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const now = Date.now();
  const initialCacheAge = cache.lastUpdate > 0 ? now - cache.lastUpdate : Infinity;
  const isStale = initialCacheAge > CACHE_TTL;

  // If no data at all, we must wait for initial load
  if (cache.data.length === 0) {
    if (!cache.isRefreshing) {
      await refreshCache(baseUrl);
    } else {
      // Another request is already refreshing - wait for it (max 30s)
      const maxWait = 30000;
      const start = Date.now();
      while (cache.isRefreshing && (Date.now() - start) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  // If stale or force refresh, trigger background refresh (don't wait)
  else if ((isStale || forceRefresh) && !cache.isRefreshing) {
    // Fire and forget - don't await
    refreshCache(baseUrl);
  }

  // Calculate actual cache age after potential refresh
  const cacheAge = cache.lastUpdate > 0 ? Date.now() - cache.lastUpdate : 0;

  // Filter by platform if specified
  let data = cache.data;
  if (platform && platform !== 'all') {
    data = data.filter(entry => {
      const platforms = entry.platforms || [];
      return platforms.some((p: string) => p.toLowerCase().includes(platform.toLowerCase()));
    });
    data = data.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // Apply pagination
  const paginatedData = data.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    total: data.length,
    cached: cache.lastUpdate > 0,
    cacheAge: Math.round(cacheAge / 1000),
    isRefreshing: cache.isRefreshing,
    lastUpdate: cache.lastUpdate,
  });
}
