import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isDemoMode } from '@/lib/data-config';

interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  truthScore: number;
  baseScore?: number;  // Lifetime score without recency bonus
  recencyBonus?: number;  // Bonus from recent 90-day activity
  winRate: number;
  totalBets: number;
  wins: number;
  losses: number;
  totalVolume: string;
  platforms?: string[];
  platformBreakdown?: any[];
  bets?: any[];
  followerCount?: number;
}

// Recency Bonus Configuration
const RECENCY_WINDOW_DAYS = 90;  // Look at last 90 days
const RECENCY_BONUS_MULTIPLIER = 0.5;  // Bonus = 50% of recent performance score

/**
 * Calculate recency bonus based on recent 90-day performance
 * Formula: RecencyBonus = (recent_score * RECENCY_BONUS_MULTIPLIER)
 *
 * This rewards active traders without penalizing inactive ones.
 * Final TruthScore = BaseScore + RecencyBonus
 */
async function calculateRecencyBonus(userId: string): Promise<{ baseScore: number; recencyBonus: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RECENCY_WINDOW_DAYS);

  try {
    // Get all-time stats (base score)
    const { data: allTimeStats } = await supabase
      .from('user_platform_stats')
      .select('score')
      .eq('user_id', userId);

    const baseScore = (allTimeStats || []).reduce((sum, stat) => sum + stat.score, 0);

    // Get recent bets (last 90 days)
    const { data: recentBets } = await supabase
      .from('bets')
      .select('won, amount, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', cutoffDate.toISOString());

    if (!recentBets || recentBets.length === 0) {
      return { baseScore, recencyBonus: 0 };
    }

    // Calculate recent performance score
    const recentWins = recentBets.filter(bet => bet.won).length;
    const recentTotal = recentBets.length;
    const recentWinRate = recentTotal > 0 ? recentWins / recentTotal : 0;

    // Simple recent score calculation (can be made more sophisticated)
    const recentScore = recentWins * 100 * recentWinRate;
    const recencyBonus = Math.floor(recentScore * RECENCY_BONUS_MULTIPLIER);

    return { baseScore, recencyBonus };
  } catch (error) {
    console.error('Error calculating recency bonus:', error);
    return { baseScore: 0, recencyBonus: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'score';
    const platformFilter = searchParams.get('platform') || 'all';
    const searchAddress = searchParams.get('search')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if we're in demo mode - if so, return sample data
    if (isDemoMode()) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'data', 'sample-users.json');

      const fileData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileData);

      const leaderboardData: LeaderboardEntry[] = (jsonData.users || []).map((user: any) => ({
        rank: user.rank,
        address: user.address,
        truthScore: user.truthScore,
        tier: user.truthScore >= 5000 ? 4 : user.truthScore >= 2000 ? 3 : user.truthScore >= 1000 ? 2 : user.truthScore >= 500 ? 1 : 0,
        winRate: user.winRate,
        totalBets: user.totalBets,
        wins: user.wins,
        losses: user.losses,
        totalVolume: user.totalVolume,
        platforms: user.platforms,
        platformBreakdown: user.platformBreakdown,
        bets: user.bets,
        totalPredictions: user.totalBets,
        correctPredictions: user.wins,
        nftTokenId: user.rank,
        lastUpdated: Date.now() / 1000,
      }));

      return NextResponse.json({
        data: leaderboardData,
        cached: false,
        totalUsers: leaderboardData.length,
        timestamp: Date.now(),
        source: 'demo-mode',
        mode: 'demo',
      });
    }

    // Build query based on platform filter (MAINNET MODE)
    let leaderboardData: LeaderboardEntry[] = [];

    if (platformFilter === 'all') {
      // Query user_platform_stats directly instead of materialized view
      // Only show users with at least 10 bets and score > 0
      const { data: statsData, error: statsError } = await supabase
        .from('user_platform_stats')
        .select(`
          *,
          user:user_id(wallet_address, username),
          platform:platform_id(name)
        `)
        .gt('total_bets', 9)   // At least 10 bets
        .gt('score', 0)        // Must have positive score (has wins)
        .order('score', { ascending: false })
        .limit(limit);

      if (statsError) {
        throw statsError;
      }

      // Aggregate by user
      const userMap = new Map<string, any>();

      (statsData || []).forEach((stat: any) => {
        const address = stat.user?.wallet_address;
        if (!address) return;

        if (!userMap.has(address)) {
          userMap.set(address, {
            address,
            username: stat.user?.username,
            totalBets: 0,
            wins: 0,
            losses: 0,
            truthScore: 0,
            totalVolume: '0',
            platforms: [],
          });
        }

        const user = userMap.get(address);
        user.totalBets += stat.total_bets;
        user.wins += stat.wins;
        user.losses += stat.losses;
        user.truthScore += stat.score;
        user.totalVolume = (BigInt(user.totalVolume) + BigInt(stat.volume || '0')).toString();
        if (stat.platform?.name && !user.platforms.includes(stat.platform.name)) {
          user.platforms.push(stat.platform.name);
        }
      });

      // Calculate recency bonus for top users
      const usersWithBonus = await Promise.all(
        Array.from(userMap.values()).map(async (user) => {
          // Get user ID for recency calculation
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', user.address.toLowerCase())
            .single();

          let baseScore = user.truthScore;
          let recencyBonus = 0;

          if (userData?.id) {
            const bonusData = await calculateRecencyBonus(userData.id);
            baseScore = bonusData.baseScore;
            recencyBonus = bonusData.recencyBonus;
          }

          return {
            ...user,
            baseScore,
            recencyBonus,
            truthScore: baseScore + recencyBonus,  // Final score = base + bonus
            winRate: user.totalBets > 0 ? (user.wins / user.totalBets) * 100 : 0,
          };
        })
      );

      leaderboardData = usersWithBonus
        .sort((a, b) => b.truthScore - a.truthScore)
        .map((user, index) => ({
          rank: index + 1,
          address: user.address,
          username: user.username,
          truthScore: user.truthScore,
          baseScore: user.baseScore,
          recencyBonus: user.recencyBonus,
          winRate: user.winRate,
          totalBets: user.totalBets,
          wins: user.wins,
          losses: user.losses,
          totalVolume: user.totalVolume,
          platforms: user.platforms,
          followerCount: 0,
        }));
    } else {
      // Filter by specific platform
      const { data: platformData, error: platformError } = await supabase
        .from('platforms')
        .select('id')
        .eq('name', platformFilter)
        .single();

      if (platformError || !platformData) {
        throw new Error('Platform not found');
      }

      const platformId = platformData.id;

      // Query user_platform_stats for specific platform
      const { data, error } = await supabase
        .from('user_platform_stats')
        .select(`
          *,
          user:user_id(wallet_address, username)
        `)
        .eq('platform_id', platformId)
        .order(sortBy === 'score' ? 'score' : sortBy === 'winRate' ? 'win_rate' : 'total_bets', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      leaderboardData = (data || []).map((row: any, index: number) => ({
        rank: index + 1,
        address: row.user?.wallet_address || 'Unknown',
        username: row.user?.username,
        truthScore: row.score,
        winRate: parseFloat(row.win_rate),
        totalBets: row.total_bets,
        wins: row.wins,
        losses: row.losses,
        totalVolume: row.volume,
        platforms: [platformFilter],
      }));
    }

    // Search filter
    if (searchAddress) {
      leaderboardData = leaderboardData.filter((entry) =>
        entry.address.toLowerCase().includes(searchAddress)
      );
    }

    // Get platform breakdown for top users
    const topUsers = leaderboardData.slice(0, 20);
    const enrichedUsers = await Promise.all(
      topUsers.map(async (user) => {
        // Get platform breakdown
        const { data: statsData } = await supabase
          .from('user_platform_stats')
          .select(`
            *,
            platform:platform_id(name)
          `)
          .eq('user_id', (await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', user.address.toLowerCase())
            .single()).data?.id || '');

        const platformBreakdown = (statsData || []).map((stat: any) => ({
          platform: stat.platform?.name || 'Unknown',
          bets: stat.total_bets,
          winRate: parseFloat(stat.win_rate),
          score: stat.score,
          volume: stat.volume,
        }));

        // Get recent bets
        const { data: betsData } = await supabase
          .from('bets')
          .select(`
            *,
            platform:platform_id(name)
          `)
          .eq('user_id', (await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', user.address.toLowerCase())
            .single()).data?.id || '')
          .order('timestamp', { ascending: false })
          .limit(10);

        const bets = (betsData || []).map((bet: any) => ({
          platform: bet.platform?.name || 'Unknown',
          marketId: bet.market_id,
          amount: bet.amount,
          position: bet.position,
          timestamp: new Date(bet.timestamp).getTime() / 1000,
          won: bet.won,
          claimedAmount: bet.claimed_amount,
        }));

        return {
          ...user,
          platformBreakdown,
          bets,
        };
      })
    );

    // Merge enriched data back
    const finalData = leaderboardData.map((user, index) => {
      const enriched = enrichedUsers.find((u) => u.address === user.address);
      return enriched || user;
    });

    return NextResponse.json({
      data: finalData,
      cached: false,
      totalUsers: finalData.length,
      timestamp: Date.now(),
      source: 'supabase',
      mode: 'mainnet',
    });
  } catch (error: any) {
    console.error('Leaderboard DB API error:', error);

    // Fallback to local JSON file for development
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', 'data', 'real-users.json');

      console.log('Attempting to load fallback data from:', filePath);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileData);

      // Map the JSON data to our leaderboard format
      const leaderboardData: LeaderboardEntry[] = (jsonData.users || []).map((user: any) => ({
        rank: user.rank,
        address: user.address,
        truthScore: user.truthScore,
        tier: user.truthScore >= 5000 ? 4 : user.truthScore >= 2000 ? 3 : user.truthScore >= 1000 ? 2 : user.truthScore >= 500 ? 1 : 0,
        winRate: user.winRate,
        totalBets: user.totalBets,
        wins: user.wins,
        losses: user.losses,
        totalVolume: user.totalVolume,
        platforms: user.platforms,
        platformBreakdown: user.platformBreakdown,
        bets: user.bets,
        totalPredictions: user.totalBets,
        correctPredictions: user.wins,
        nftTokenId: user.rank,
        lastUpdated: Date.now() / 1000,
      }));

      console.log(`Loaded ${leaderboardData.length} users from fallback file`);

      return NextResponse.json({
        data: leaderboardData,
        cached: false,
        totalUsers: leaderboardData.length,
        timestamp: Date.now(),
        source: 'local-file-fallback',
        warning: 'Using local file data - Supabase connection failed',
      });
    } catch (fileError: any) {
      console.error('Failed to load fallback data:', fileError);
      return NextResponse.json(
        {
          error: 'Failed to fetch leaderboard from database and fallback file',
          message: error.message,
          fallbackError: fileError.message,
        },
        { status: 500 }
      );
    }
  }
}
