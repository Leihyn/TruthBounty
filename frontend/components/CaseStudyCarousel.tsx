'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  Zap,
  Copy,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface TraderData {
  address: string;
  username: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
  wins: number;
  losses: number;
  totalVolume: string;
  pnl: number;
  platform: string;
  rank: number;
}

interface PlatformConfig {
  id: string;
  name: string;
  chain: string;
  endpoint: string;
  explorer: string;
  profileUrl: (address: string) => string;
  gradient: string;
  icon: string;
}

// ═══════════════════════════════════════════════════════════════
// Platform Configurations
// ═══════════════════════════════════════════════════════════════

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'polymarket',
    name: 'Polymarket',
    chain: 'Polygon',
    endpoint: '/api/polymarket-leaderboard?limit=3',
    explorer: 'https://polygonscan.com/address/',
    profileUrl: (addr) => `https://polymarket.com/profile/${addr}`,
    gradient: 'from-purple-500 to-blue-500',
    icon: '🔮',
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    chain: 'BSC',
    endpoint: '/api/pancakeswap-leaderboard?limit=3',
    explorer: 'https://bscscan.com/address/',
    profileUrl: (addr) => `https://pancakeswap.finance/prediction?address=${addr}`,
    gradient: 'from-amber-500 to-yellow-500',
    icon: '🥞',
  },
  {
    id: 'azuro',
    name: 'Azuro',
    chain: 'Polygon',
    endpoint: '/api/azuro-leaderboard?limit=3',
    explorer: 'https://polygonscan.com/address/',
    profileUrl: (addr) => `https://azuro.org/profile/${addr}`,
    gradient: 'from-cyan-500 to-teal-500',
    icon: '🎯',
  },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toLocaleString() || '0';
};

const formatUSD = (num: number) => {
  if (!num) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

const getTierFromScore = (score: number) => {
  if (score >= 900) return { name: 'Diamond', class: 'tier-diamond', bg: 'bg-tier-diamond' };
  if (score >= 650) return { name: 'Platinum', class: 'tier-platinum', bg: 'bg-tier-platinum' };
  if (score >= 400) return { name: 'Gold', class: 'tier-gold', bg: 'bg-tier-gold' };
  if (score >= 200) return { name: 'Silver', class: 'tier-silver', bg: 'bg-tier-silver' };
  return { name: 'Bronze', class: 'tier-bronze', bg: 'bg-tier-bronze' };
};

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function CaseStudyCarousel() {
  const [allTraders, setAllTraders] = useState<TraderData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch top traders from all platforms
  useEffect(() => {
    async function fetchAllTraders() {
      const traders: TraderData[] = [];

      for (const platform of PLATFORMS) {
        try {
          const res = await fetch(platform.endpoint);
          const data = await res.json();

          if (data.success && data.data?.length > 0) {
            const platformTraders = data.data.slice(0, 3).map((t: any, idx: number) => ({
              ...t,
              platform: platform.id,
              rank: idx + 1,
            }));
            traders.push(...platformTraders);
          }
        } catch (error) {
          console.error(`Failed to fetch ${platform.name} traders:`, error);
        }
      }

      // Shuffle for random display
      const shuffled = traders.sort(() => Math.random() - 0.5);
      setAllTraders(shuffled);
      setLoading(false);
    }

    fetchAllTraders();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (allTraders.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [allTraders.length, isPaused, currentIndex]);

  const handleNext = useCallback(() => {
    if (allTraders.length === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % allTraders.length);
      setIsTransitioning(false);
    }, 300);
  }, [allTraders.length]);

  const handlePrev = useCallback(() => {
    if (allTraders.length === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + allTraders.length) % allTraders.length);
      setIsTransitioning(false);
    }, 300);
  }, [allTraders.length]);

  const currentTrader = allTraders[currentIndex];
  const currentPlatform = PLATFORMS.find((p) => p.id === currentTrader?.platform);

  return (
    <div className="relative">
      {/* Animated background glow */}
      <div
        className={`
          absolute -inset-4 rounded-[2rem] blur-3xl opacity-30
          transition-all duration-700 ease-in-out
          bg-gradient-to-br ${currentPlatform?.gradient || 'from-primary to-secondary'}
        `}
      />

      {/* Glass card container */}
      <Card
        className={`
          relative overflow-hidden
          border border-white/10
          bg-gradient-to-br from-white/[0.08] to-white/[0.02]
          backdrop-blur-xl shadow-2xl
          transition-all duration-300 ease-out
          ${isTransitioning ? 'opacity-0 scale-[0.98] translate-y-2' : 'opacity-100 scale-100 translate-y-0'}
        `}
      >
        {/* Animated gradient border */}
        <div
          className={`
            absolute top-0 left-0 right-0 h-1
            bg-gradient-to-r ${currentPlatform?.gradient || 'from-primary to-secondary'}
            transition-all duration-500
          `}
        />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Trader info */}
            <div className="flex items-center gap-4">
              {loading ? (
                <Skeleton className="w-16 h-16 rounded-2xl" />
              ) : (
                <div className="relative group">
                  <div
                    className={`
                      w-16 h-16 rounded-2xl
                      bg-gradient-to-br ${currentPlatform?.gradient || 'from-primary to-secondary'}
                      flex items-center justify-center text-3xl
                      shadow-lg transition-transform duration-300
                      group-hover:scale-105
                    `}
                  >
                    {currentPlatform?.icon || '🏆'}
                  </div>
                  <div
                    className={`
                      absolute -bottom-2 -right-2
                      w-7 h-7 rounded-full
                      bg-gradient-to-br ${currentPlatform?.gradient || 'from-primary to-secondary'}
                      text-white text-xs font-bold
                      flex items-center justify-center
                      border-2 border-background shadow-lg
                    `}
                  >
                    #{currentTrader?.rank || 1}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-36 mb-2" />
                    <Skeleton className="h-4 w-52" />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3 flex-wrap">
                      <span className="transition-all duration-300">
                        {currentTrader?.username || 'Anonymous'}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal border-white/20">
                        {currentPlatform?.name}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      {currentTrader?.address?.slice(0, 10)}...{currentTrader?.address?.slice(-8)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Tier badge */}
            {!loading && currentTrader && (
              <div
                className={`
                  px-4 py-2 rounded-xl
                  ${getTierFromScore(currentTrader.truthScore).bg}
                  ${getTierFromScore(currentTrader.truthScore).class}
                  text-sm font-bold border border-white/10 shadow-lg
                `}
              >
                {getTierFromScore(currentTrader.truthScore).name}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : currentTrader ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: currentTrader.truthScore, label: 'TruthScore', color: 'text-primary', format: (v: number) => v.toString() },
                  { value: currentTrader.winRate, label: 'Win Rate', color: 'text-success', format: (v: number) => `${v}%` },
                  { value: currentTrader.totalBets, label: 'Total Bets', color: 'text-foreground', format: formatNumber },
                  { value: currentTrader.pnl, label: 'Profit', color: currentTrader.pnl >= 0 ? 'text-success' : 'text-destructive', format: formatUSD },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="text-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
                  >
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.format(stat.value)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="text-center sm:text-left">
                    <span className="text-muted-foreground">Wins:</span>
                    <span className="ml-2 text-success font-mono font-semibold">{formatNumber(currentTrader.wins)}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-muted-foreground">Losses:</span>
                    <span className="ml-2 text-destructive font-mono font-semibold">{formatNumber(currentTrader.losses)}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="ml-2 font-mono font-semibold">{formatUSD(parseFloat(currentTrader.totalVolume || '0'))}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href={`${currentPlatform?.explorer}${currentTrader.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  {currentPlatform?.chain} Explorer
                </a>
                <a
                  href={currentPlatform?.profileUrl(currentTrader.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  {currentPlatform?.name} Profile
                </a>
              </div>
            </>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={loading || allTraders.length === 0} className="gap-2 hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)} className="w-8 h-8 hover:bg-white/10">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>

              <div className="flex items-center gap-1.5">
                {allTraders.slice(0, Math.min(allTraders.length, 9)).map((trader, idx) => {
                  const platform = PLATFORMS.find((p) => p.id === trader.platform);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => { setCurrentIndex(idx); setIsTransitioning(false); }, 300);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? `w-8 bg-gradient-to-r ${platform?.gradient || 'from-primary to-secondary'}` : 'w-2 bg-white/20 hover:bg-white/40'}`}
                    />
                  );
                })}
                {allTraders.length > 9 && <span className="text-xs text-muted-foreground ml-1">+{allTraders.length - 9}</span>}
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleNext} disabled={loading || allTraders.length === 0} className="gap-2 hover:bg-white/10">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              {isPaused ? (
                <><span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />Paused - click play to resume</>
              ) : (
                <><RefreshCw className="w-3 h-3 animate-spin" />Auto-rotating every 5s</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CaseStudyCarousel;
