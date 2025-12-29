import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Score Recalculation API
 *
 * This endpoint recalculates all TruthScores using the Wilson Score algorithm.
 * It should be run:
 * - Daily via Vercel cron to catch any drift
 * - After any scoring formula changes
 * - If score anomalies are detected
 *
 * SCORING FORMULA (must match services/indexer/scoring.js):
 *
 * TruthScore = (Skill + Activity + Volume) × SampleMultiplier
 *
 * Where:
 * - Skill (0-500): Based on Wilson Score adjusted win rate
 * - Activity (0-500): log10(wins) × 166
 * - Volume (0-200): log10(volumeBNB) × 100
 * - SampleMultiplier: min(1, totalBets / 50)
 * - Max Score: 1300
 */

// Lazy-initialized Supabase client (avoids build-time errors when env vars aren't set)
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Scoring config - MUST match services/indexer/scoring.js
const SCORING_CONFIG = {
  MAX_SCORE: 1300,
  MIN_BETS_FOR_LEADERBOARD: 10,
  MIN_BETS_FOR_FULL_SCORE: 50,
  SKILL_MAX: 500,
  ACTIVITY_MAX: 500,
  VOLUME_MAX: 200,
  WILSON_Z: 1.96,
};

/**
 * Wilson Score Lower Bound
 * Provides conservative win rate estimate accounting for sample size
 */
function wilsonScoreLower(wins: number, total: number): number {
  if (total === 0) return 0;
  const z = SCORING_CONFIG.WILSON_Z;
  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (center - spread) / denominator);
}

function calculateScore(wins: number, totalBets: number, volume: string): number {
  if (totalBets < SCORING_CONFIG.MIN_BETS_FOR_LEADERBOARD) {
    return 0;
  }

  // Wilson Score adjusted win rate
  const adjustedWinRate = wilsonScoreLower(wins, totalBets);

  // Skill Score (0-500)
  const skillScore = Math.min(
    SCORING_CONFIG.SKILL_MAX,
    Math.max(0, Math.floor((adjustedWinRate - 0.5) * 1000))
  );

  // Activity Score (0-500)
  const activityScore = wins > 0
    ? Math.min(SCORING_CONFIG.ACTIVITY_MAX, Math.floor(Math.log10(wins) * 166))
    : 0;

  // Volume Bonus (0-200)
  const volumeBNB = Number(volume) / 1e18;
  const volumeBonus = volumeBNB >= 1
    ? Math.min(SCORING_CONFIG.VOLUME_MAX, Math.floor(Math.log10(volumeBNB) * 100))
    : 0;

  // Sample size multiplier (0-1)
  const sampleMultiplier = Math.min(1, totalBets / SCORING_CONFIG.MIN_BETS_FOR_FULL_SCORE);

  // Calculate and cap score
  const rawScore = skillScore + activityScore + volumeBonus;
  const adjustedScore = Math.floor(rawScore * sampleMultiplier);

  return Math.min(SCORING_CONFIG.MAX_SCORE, adjustedScore);
}

export async function GET() {
  const startTime = Date.now();
  console.log('[recalc-scores] Starting score recalculation at', new Date().toISOString());

  try {
    // Get all user platform stats
    const { data: stats, error: fetchError } = await getSupabase()
      .from('user_platform_stats')
      .select('id, user_id, platform_id, total_bets, wins, volume, score');

    if (fetchError) {
      throw fetchError;
    }

    if (!stats || stats.length === 0) {
      return NextResponse.json({
        recalculated: 0,
        message: 'No stats found',
        duration: Date.now() - startTime,
      });
    }

    let updated = 0;
    let anomalies = 0;
    const anomalyDetails: any[] = [];

    for (const stat of stats) {
      // Calculate correct score
      const correctScore = calculateScore(stat.wins, stat.total_bets, stat.volume || '0');

      // Check for anomaly (score differs by more than 10%)
      const scoreDiff = Math.abs(stat.score - correctScore);
      const isAnomaly = stat.score > 0 && scoreDiff > stat.score * 0.1;

      if (isAnomaly) {
        anomalies++;
        if (anomalyDetails.length < 10) {
          anomalyDetails.push({
            id: stat.id,
            oldScore: stat.score,
            newScore: correctScore,
            diff: scoreDiff,
          });
        }
      }

      // Update if score is different
      if (stat.score !== correctScore) {
        const { error: updateError } = await getSupabase()
          .from('user_platform_stats')
          .update({ score: correctScore })
          .eq('id', stat.id);

        if (!updateError) {
          updated++;
        }
      }

      // Timeout protection
      if (Date.now() - startTime > 55000) {
        console.log('[recalc-scores] Approaching timeout, stopping early');
        break;
      }
    }

    const result = {
      total: stats.length,
      recalculated: updated,
      anomalies,
      anomalyDetails: anomalies > 0 ? anomalyDetails : undefined,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    console.log('[recalc-scores] Complete:', JSON.stringify(result));

    // Log warning if anomalies detected
    if (anomalies > 0) {
      console.warn(`[recalc-scores] WARNING: ${anomalies} score anomalies detected and fixed!`);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[recalc-scores] Error:', error);
    return NextResponse.json({
      error: error.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
