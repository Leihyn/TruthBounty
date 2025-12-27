import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cache the stats for 5 minutes to avoid hammering the database
let cachedStats: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache
    if (cachedStats && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json({ ...cachedStats, cached: true });
    }

    // Fetch stats from Supabase
    const [usersResult, betsResult, statsResult] = await Promise.all([
      // Count unique users
      supabase.from('users').select('id', { count: 'exact', head: true }),
      // Count total bets
      supabase.from('bets').select('id', { count: 'exact', head: true }),
      // Get aggregated stats
      supabase.from('user_platform_stats').select('total_bets, volume'),
    ]);

    // Calculate totals
    const totalTraders = usersResult.count || 0;
    const totalBets = betsResult.count || 0;

    // Sum up volume from all user_platform_stats
    let totalVolumeWei = BigInt(0);
    let totalPredictions = 0;

    if (statsResult.data) {
      statsResult.data.forEach((stat: any) => {
        totalPredictions += stat.total_bets || 0;
        if (stat.volume) {
          try {
            totalVolumeWei += BigInt(stat.volume);
          } catch (e) {
            // Skip invalid volume values
          }
        }
      });
    }

    // Convert volume from wei to BNB, then estimate USD value (~$700/BNB)
    const volumeBNB = Number(totalVolumeWei) / 1e18;
    const volumeUSD = volumeBNB * 700; // Approximate BNB price

    // Use the larger of bets count or predictions from stats
    const predictions = Math.max(totalBets, totalPredictions);

    const stats = {
      totalTraders,
      totalPredictions: predictions,
      totalVolumeBNB: volumeBNB,
      totalVolumeUSD: volumeUSD,
      supportedChains: 2, // BSC + Polygon
      timestamp: Date.now(),
      cached: false,
    };

    // Update cache
    cachedStats = stats;
    cacheTime = Date.now();

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Stats API error:', error);

    // Return zeros if database is unavailable
    return NextResponse.json({
      totalTraders: 0,
      totalPredictions: 0,
      totalVolumeBNB: 0,
      totalVolumeUSD: 0,
      supportedChains: 2,
      timestamp: Date.now(),
      error: error.message,
    });
  }
}
