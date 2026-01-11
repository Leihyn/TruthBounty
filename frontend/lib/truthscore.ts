/**
 * TruthScore - Unified Scoring System for Prediction Market Traders
 *
 * A statistically-grounded scoring system that measures trader skill
 * while accounting for sample size uncertainty.
 *
 * Core Formula: TruthScore = Edge × Confidence
 *
 * References:
 * - Wilson, E.B. (1927). "Probable Inference, the Law of Succession, and Statistical Inference"
 * - Agresti, A. & Coull, B.A. (1998). "Approximate is Better than 'Exact' for Interval Estimation"
 * - Brown, L.D., Cai, T.T., & DasGupta, A. (2001). "Interval Estimation for a Binomial Proportion"
 *
 * @module truthscore
 * @version 2.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const TRUTHSCORE_CONFIG = {
  // Minimum requirements for eligibility
  MIN_BETS_BINARY: 30,        // Binary markets (50/50)
  MIN_BETS_ODDS: 20,          // Odds-based markets
  MIN_VOLUME_ODDS: 1000,      // Minimum $1000 volume for odds markets

  // Wilson Score z-value (1.96 = 95% confidence interval)
  WILSON_Z: 1.96,

  // Score scaling
  MAX_EDGE_POINTS: 500,       // Maximum points from edge
  MAX_SCORE: 1000,            // Maximum total score

  // Confidence curve parameters
  CONFIDENCE_MIN: 0.5,        // Minimum confidence multiplier
  CONFIDENCE_SCALE: 200,      // Bets needed for ~87% confidence

  // ROI confidence for odds markets
  ROI_VARIANCE_ESTIMATE: 0.25, // Conservative variance assumption
  ROI_Z_SCORE: 1.5,           // 93% confidence level
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type MarketType = 'binary' | 'odds';

export interface TruthScoreInput {
  // For binary markets
  wins?: number;
  losses?: number;
  totalBets?: number;

  // For odds-based markets
  pnl?: number;
  volume?: number;
  trades?: number;

  // Platform identification
  platform: string;
}

export interface TruthScoreResult {
  score: number;
  eligible: boolean;

  // Breakdown components
  edge: number;              // Percentage edge (0-50)
  edgePoints: number;        // Points from edge (0-500)
  confidence: number;        // Confidence level (50-100%)

  // Raw metrics
  rawWinRate?: number;       // Actual win rate
  provenWinRate?: number;    // Wilson-adjusted win rate
  rawROI?: number;           // Actual ROI
  provenROI?: number;        // Confidence-bounded ROI

  // Meta
  marketType: MarketType;
  sampleSize: number;
  reason?: string;
}

export interface ScoreBreakdown {
  skill: string;
  confidence: string;
  explanation: string;
}

// ============================================================================
// PLATFORM CLASSIFICATION
// ============================================================================

/**
 * Binary markets have fixed 50/50 odds (up/down, yes/no at even money)
 * Win rate is the correct metric for these markets.
 */
const BINARY_PLATFORMS = [
  'pancakeswap',
  'speedmarkets',
  'speed markets',
  'thales',
] as const;

/**
 * Odds-based markets have variable odds/probabilities
 * ROI is the correct metric because win rate is meaningless
 * (betting on -500 favorites wins 80%+ but loses money)
 */
const ODDS_PLATFORMS = [
  'polymarket',
  'overtime',
  'azuro',
  'sxbet',
  'sx bet',
  'limitless',
  'drift',
  'manifold',
  'kalshi',
  'metaculus',
  'gnosis',
  'omen',
] as const;

/**
 * Determine market type from platform name
 */
export function getMarketType(platform: string): MarketType {
  const normalized = platform.toLowerCase().replace(/[^a-z]/g, '');

  for (const binary of BINARY_PLATFORMS) {
    if (normalized.includes(binary.replace(/[^a-z]/g, ''))) {
      return 'binary';
    }
  }

  return 'odds';
}

// ============================================================================
// WILSON SCORE IMPLEMENTATION
// ============================================================================

/**
 * Wilson Score Lower Bound
 *
 * Calculates a conservative estimate of the true win rate given observed data.
 * This is the lower bound of the confidence interval, which means:
 * - Small samples get heavily penalized (3/3 wins → ~44%, not 100%)
 * - Large samples converge to the true rate (600/1000 wins → ~57%)
 *
 * Mathematical Foundation:
 * The Wilson score interval is derived from inverting the z-test for proportions.
 * Unlike the normal approximation (Wald interval), it:
 * - Never produces intervals outside [0,1]
 * - Has better coverage probability for small n
 * - Is recommended by statisticians for binary proportion estimation
 *
 * Formula:
 * Lower bound = (p + z²/2n - z√(p(1-p)/n + z²/4n²)) / (1 + z²/n)
 *
 * Where:
 * - p = observed proportion (wins/total)
 * - n = sample size (total bets)
 * - z = z-score for desired confidence (1.96 for 95%)
 *
 * @param wins - Number of successful predictions
 * @param total - Total number of predictions
 * @param z - Z-score for confidence level (default 1.96 = 95%)
 * @returns Lower bound of Wilson confidence interval
 *
 * @example
 * wilsonScoreLower(3, 3)      // → 0.438 (not 1.0!)
 * wilsonScoreLower(60, 100)   // → 0.502
 * wilsonScoreLower(600, 1000) // → 0.569
 */
export function wilsonScoreLower(
  wins: number,
  total: number,
  z: number = TRUTHSCORE_CONFIG.WILSON_Z
): number {
  if (total === 0) return 0;
  if (wins < 0 || wins > total) return 0;

  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);

  return Math.max(0, (center - spread) / denominator);
}

/**
 * Wilson Score Upper Bound (for reference)
 */
export function wilsonScoreUpper(
  wins: number,
  total: number,
  z: number = TRUTHSCORE_CONFIG.WILSON_Z
): number {
  if (total === 0) return 0;

  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);

  return Math.min(1, (center + spread) / denominator);
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

/**
 * Calculate confidence multiplier based on sample size
 *
 * Uses an exponential decay function that:
 * - Starts at 50% for minimum sample sizes
 * - Approaches 100% as sample size increases
 * - Has diminishing returns (100 → 200 bets matters more than 1000 → 1100)
 *
 * Formula: confidence = 0.5 + 0.5 × (1 - e^(-n/scale))
 *
 * Examples (with scale=200):
 * - 30 bets  → 57% confidence
 * - 100 bets → 70% confidence
 * - 200 bets → 82% confidence
 * - 500 bets → 96% confidence
 * - 1000 bets → 99% confidence
 *
 * @param sampleSize - Number of bets/trades
 * @returns Confidence multiplier between 0.5 and 1.0
 */
export function calculateConfidence(sampleSize: number): number {
  const { CONFIDENCE_MIN, CONFIDENCE_SCALE } = TRUTHSCORE_CONFIG;

  if (sampleSize <= 0) return CONFIDENCE_MIN;

  const confidenceGain = 1 - Math.exp(-sampleSize / CONFIDENCE_SCALE);
  return CONFIDENCE_MIN + (1 - CONFIDENCE_MIN) * confidenceGain;
}

// ============================================================================
// ROI CONFIDENCE BOUNDS
// ============================================================================

/**
 * Calculate conservative ROI with confidence bounds
 *
 * For odds-based markets where we can't use win rate directly,
 * we use ROI (Return on Investment) as the skill metric.
 *
 * To account for variance in returns, we calculate:
 * Conservative ROI = Observed ROI - z × Standard Error
 *
 * This gives us a lower bound estimate that accounts for:
 * - Lucky streaks that inflate observed ROI
 * - Small sample sizes with high variance
 *
 * Standard Error approximation:
 * SE = √(variance / n) ≈ 0.5 / √n (assuming binary-ish outcomes)
 *
 * @param pnl - Profit and loss
 * @param volume - Total volume traded
 * @param trades - Number of trades
 * @returns Conservative ROI estimate
 */
export function calculateConservativeROI(
  pnl: number,
  volume: number,
  trades: number
): number {
  if (volume <= 0 || trades <= 0) return 0;

  const roi = pnl / volume;

  // Estimate standard error of ROI
  const { ROI_VARIANCE_ESTIMATE, ROI_Z_SCORE } = TRUTHSCORE_CONFIG;
  const stdError = Math.sqrt(ROI_VARIANCE_ESTIMATE / trades);

  // Conservative ROI (lower bound)
  const conservativeROI = roi - (ROI_Z_SCORE * stdError);

  return conservativeROI;
}

// ============================================================================
// MAIN SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate TruthScore for Binary Markets
 *
 * Binary markets have 50/50 base odds (like coin flips).
 * Skill is measured as edge above 50%.
 *
 * Formula:
 * 1. provenWinRate = wilsonScoreLower(wins, total)
 * 2. edge = max(0, provenWinRate - 0.5)
 * 3. edgePoints = edge × 5000 (capped at 500)
 * 4. confidence = calculateConfidence(total)
 * 5. score = edgePoints × confidence × 2
 *
 * @param wins - Number of winning bets
 * @param total - Total number of bets
 * @param platform - Platform name
 */
export function scoreBinaryTrader(
  wins: number,
  total: number,
  platform: string
): TruthScoreResult {
  const { MIN_BETS_BINARY, MAX_EDGE_POINTS, MAX_SCORE } = TRUTHSCORE_CONFIG;

  // Eligibility check
  if (total < MIN_BETS_BINARY) {
    return {
      score: 0,
      eligible: false,
      edge: 0,
      edgePoints: 0,
      confidence: 0,
      rawWinRate: total > 0 ? wins / total : 0,
      provenWinRate: 0,
      marketType: 'binary',
      sampleSize: total,
      reason: `Need ${MIN_BETS_BINARY}+ bets (have ${total})`,
    };
  }

  // Calculate proven win rate using Wilson Score
  const rawWinRate = wins / total;
  const provenWinRate = wilsonScoreLower(wins, total);

  // Edge = how much above 50% (coin flip baseline)
  const edge = Math.max(0, provenWinRate - 0.5);
  const edgePercent = edge * 100;

  // Convert edge to points (10% edge = 500 points max)
  const edgePoints = Math.min(MAX_EDGE_POINTS, Math.round(edge * 5000));

  // Confidence based on sample size
  const confidence = calculateConfidence(total);
  const confidencePercent = Math.round(confidence * 100);

  // Final score
  const score = Math.min(MAX_SCORE, Math.round(edgePoints * confidence * 2));

  return {
    score,
    eligible: true,
    edge: Math.round(edgePercent * 10) / 10,
    edgePoints,
    confidence: confidencePercent,
    rawWinRate: Math.round(rawWinRate * 1000) / 10,
    provenWinRate: Math.round(provenWinRate * 1000) / 10,
    marketType: 'binary',
    sampleSize: total,
  };
}

/**
 * Calculate TruthScore for Odds-Based Markets
 *
 * Odds markets have variable probabilities, so win rate is meaningless.
 * A trader betting only on heavy favorites (-500) will "win" 80%+
 * but likely lose money overall.
 *
 * Instead, we use ROI (Return on Investment) as the skill metric.
 *
 * Formula:
 * 1. rawROI = pnl / volume
 * 2. provenROI = rawROI - z × stdError
 * 3. edge = max(0, provenROI)
 * 4. edgePoints = edge × 5000 (capped at 500)
 * 5. confidence = calculateConfidence(trades)
 * 6. score = edgePoints × confidence × 2
 *
 * @param pnl - Profit and loss
 * @param volume - Total volume traded
 * @param trades - Number of trades
 * @param platform - Platform name
 */
export function scoreOddsTrader(
  pnl: number,
  volume: number,
  trades: number,
  platform: string
): TruthScoreResult {
  const { MIN_BETS_ODDS, MIN_VOLUME_ODDS, MAX_EDGE_POINTS, MAX_SCORE } = TRUTHSCORE_CONFIG;

  // Eligibility checks
  if (trades < MIN_BETS_ODDS) {
    return {
      score: 0,
      eligible: false,
      edge: 0,
      edgePoints: 0,
      confidence: 0,
      rawROI: volume > 0 ? (pnl / volume) * 100 : 0,
      provenROI: 0,
      marketType: 'odds',
      sampleSize: trades,
      reason: `Need ${MIN_BETS_ODDS}+ trades (have ${trades})`,
    };
  }

  if (volume < MIN_VOLUME_ODDS) {
    return {
      score: 0,
      eligible: false,
      edge: 0,
      edgePoints: 0,
      confidence: 0,
      rawROI: volume > 0 ? (pnl / volume) * 100 : 0,
      provenROI: 0,
      marketType: 'odds',
      sampleSize: trades,
      reason: `Need $${MIN_VOLUME_ODDS}+ volume (have $${Math.round(volume)})`,
    };
  }

  // Calculate ROI
  const rawROI = pnl / volume;
  const provenROI = calculateConservativeROI(pnl, volume, trades);

  // Edge = positive proven ROI (negative = no edge)
  const edge = Math.max(0, provenROI);
  const edgePercent = edge * 100;

  // Convert edge to points (10% ROI edge = 500 points max)
  const edgePoints = Math.min(MAX_EDGE_POINTS, Math.round(edge * 5000));

  // Confidence based on sample size
  const confidence = calculateConfidence(trades);
  const confidencePercent = Math.round(confidence * 100);

  // Final score
  const score = Math.min(MAX_SCORE, Math.round(edgePoints * confidence * 2));

  return {
    score,
    eligible: true,
    edge: Math.round(edgePercent * 10) / 10,
    edgePoints,
    confidence: confidencePercent,
    rawROI: Math.round(rawROI * 1000) / 10,
    provenROI: Math.round(provenROI * 1000) / 10,
    marketType: 'odds',
    sampleSize: trades,
  };
}

// ============================================================================
// UNIFIED INTERFACE
// ============================================================================

/**
 * Calculate TruthScore - Unified Entry Point
 *
 * Automatically detects market type and routes to appropriate scorer.
 *
 * @param input - Scoring input with platform and relevant metrics
 * @returns TruthScore result with breakdown
 */
export function calculateTruthScore(input: TruthScoreInput): TruthScoreResult {
  const marketType = getMarketType(input.platform);

  if (marketType === 'binary') {
    const wins = input.wins ?? 0;
    const total = input.totalBets ?? (wins + (input.losses ?? 0));
    return scoreBinaryTrader(wins, total, input.platform);
  }

  // Odds-based market
  const pnl = input.pnl ?? 0;
  const volume = input.volume ?? 0;
  const trades = input.trades ?? input.totalBets ?? 0;

  return scoreOddsTrader(pnl, volume, trades, input.platform);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get human-readable breakdown of score
 */
export function getScoreBreakdown(result: TruthScoreResult): ScoreBreakdown {
  if (!result.eligible) {
    return {
      skill: 'Not eligible',
      confidence: 'N/A',
      explanation: result.reason || 'Insufficient data',
    };
  }

  const edgeDescription = result.marketType === 'binary'
    ? `${result.edge}% above coin flip`
    : `${result.edge}% ROI`;

  let skillLevel: string;
  if (result.edge >= 10) skillLevel = 'Elite';
  else if (result.edge >= 7) skillLevel = 'Excellent';
  else if (result.edge >= 5) skillLevel = 'Strong';
  else if (result.edge >= 3) skillLevel = 'Good';
  else if (result.edge >= 1) skillLevel = 'Slight edge';
  else skillLevel = 'No proven edge';

  let confidenceLevel: string;
  if (result.confidence >= 95) confidenceLevel = 'Very high';
  else if (result.confidence >= 85) confidenceLevel = 'High';
  else if (result.confidence >= 70) confidenceLevel = 'Moderate';
  else if (result.confidence >= 55) confidenceLevel = 'Low';
  else confidenceLevel = 'Very low';

  return {
    skill: `${skillLevel} (${edgeDescription})`,
    confidence: `${confidenceLevel} (${result.confidence}%, ${result.sampleSize} ${result.marketType === 'binary' ? 'bets' : 'trades'})`,
    explanation: `${skillLevel} performer with ${confidenceLevel.toLowerCase()} confidence based on ${result.sampleSize} ${result.marketType === 'binary' ? 'bets' : 'trades'}.`,
  };
}

/**
 * Get tier name from score
 */
export function getScoreTier(score: number): string {
  if (score >= 900) return 'Legendary';
  if (score >= 750) return 'Elite';
  if (score >= 600) return 'Expert';
  if (score >= 450) return 'Skilled';
  if (score >= 300) return 'Competent';
  if (score >= 150) return 'Beginner';
  return 'Unranked';
}

/**
 * Get tier color class
 */
export function getScoreTierColor(score: number): string {
  if (score >= 900) return 'text-yellow-400'; // Legendary - Gold
  if (score >= 750) return 'text-purple-400'; // Elite - Purple
  if (score >= 600) return 'text-blue-400';   // Expert - Blue
  if (score >= 450) return 'text-green-400';  // Skilled - Green
  if (score >= 300) return 'text-gray-400';   // Competent - Gray
  return 'text-gray-500';                      // Unranked
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy scoring function for backwards compatibility
 * Maps old format to new TruthScore system
 *
 * @deprecated Use calculateTruthScore instead
 */
export function legacyCalculateScore(
  wins: number,
  total: number,
  volume: number,
  pnl: number = 0,
  platform: string = 'pancakeswap'
): number {
  const marketType = getMarketType(platform);

  if (marketType === 'binary') {
    return scoreBinaryTrader(wins, total, platform).score;
  }

  return scoreOddsTrader(pnl, volume, total, platform).score;
}
