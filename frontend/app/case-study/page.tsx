'use client'


import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  CheckCircle2,
  BarChart3,
  Zap,
  Copy,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Database,
  Eye,
  TrendingUp,
  Users,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface TraderData {
  address: string;
  username?: string;
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
  gradient: string;
  bgGradient: string;
  icon: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// Platform Configurations
// ═══════════════════════════════════════════════════════════════

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'polymarket',
    name: 'Polymarket',
    chain: 'Polygon',
    endpoint: '/api/polymarket-leaderboard?limit=5',
    gradient: 'from-purple-500 to-indigo-600',
    bgGradient: 'from-purple-500/20 to-indigo-600/20',
    icon: '🔮',
    color: 'text-purple-400',
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    chain: 'BSC',
    endpoint: '/api/pancakeswap-leaderboard?limit=5',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-500/20 to-orange-500/20',
    icon: '🥞',
    color: 'text-amber-400',
  },
  {
    id: 'azuro',
    name: 'Azuro',
    chain: 'Polygon',
    endpoint: '/api/azuro-leaderboard?limit=5',
    gradient: 'from-cyan-500 to-teal-500',
    bgGradient: 'from-cyan-500/20 to-teal-500/20',
    icon: '🎯',
    color: 'text-cyan-400',
  },
  {
    id: 'overtime',
    name: 'Overtime',
    chain: 'Optimism',
    endpoint: '/api/overtime-leaderboard?limit=5',
    gradient: 'from-red-500 to-pink-500',
    bgGradient: 'from-red-500/20 to-pink-500/20',
    icon: '⏱️',
    color: 'text-red-400',
  },
  {
    id: 'limitless',
    name: 'Limitless',
    chain: 'Base',
    endpoint: '/api/limitless-leaderboard?limit=5',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    icon: '♾️',
    color: 'text-blue-400',
  },
  {
    id: 'sxbet',
    name: 'SX Bet',
    chain: 'SX Network',
    endpoint: '/api/sxbet-leaderboard?limit=5',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
    icon: '🎰',
    color: 'text-green-400',
  },
  {
    id: 'speedmarkets',
    name: 'Speed Markets',
    chain: 'Optimism',
    endpoint: '/api/speedmarkets-leaderboard?limit=5',
    gradient: 'from-yellow-500 to-amber-500',
    bgGradient: 'from-yellow-500/20 to-amber-500/20',
    icon: '⚡',
    color: 'text-yellow-400',
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

const formatUSD = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num || isNaN(num)) return '$0';
  // Sanity check for crazy values (bug from decimal handling)
  const sanitized = num > 10000000 ? num / 1e12 : num;
  if (sanitized >= 1000000) return `$${(sanitized / 1000000).toFixed(1)}M`;
  if (sanitized >= 1000) return `$${(sanitized / 1000).toFixed(1)}K`;
  return `$${sanitized.toFixed(0)}`;
};

const getTierInfo = (score: number) => {
  if (score >= 900) return { name: 'Diamond', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' };
  if (score >= 650) return { name: 'Platinum', bg: 'bg-slate-300', text: 'text-slate-300', border: 'border-slate-300/30' };
  if (score >= 400) return { name: 'Gold', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (score >= 200) return { name: 'Silver', bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400/30' };
  return { name: 'Bronze', bg: 'bg-orange-700', text: 'text-orange-400', border: 'border-orange-700/30' };
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

// ═══════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════

function TraderCard({ trader, platform, featured = false }: { trader: TraderData; platform: PlatformConfig; featured?: boolean }) {
  const tier = getTierInfo(trader.truthScore);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-surface/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border hover:bg-surface",
        featured ? "p-6 sm:p-8" : "p-4 sm:p-5"
      )}
    >
      {/* Gradient accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", platform.gradient)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br text-2xl",
            platform.gradient,
            featured ? "w-14 h-14" : "w-10 h-10"
          )}>
            {platform.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("font-semibold", featured ? "text-lg" : "text-sm")}>
                {trader.username || 'Anonymous'}
              </span>
              {featured && (
                <Badge variant="outline" className={cn("text-xs", tier.border, tier.text)}>
                  {tier.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {shortenAddress(trader.address)}
            </p>
          </div>
        </div>
        {!featured && (
          <Badge className={cn("text-xs", tier.bg, "text-white")}>
            #{trader.rank}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className={cn("grid gap-3", featured ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        <div className={cn("rounded-xl bg-white/5 text-center", featured ? "p-4" : "p-3")}>
          <p className={cn("font-bold text-secondary", featured ? "text-2xl" : "text-lg")}>{trader.truthScore}</p>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
        <div className={cn("rounded-xl bg-white/5 text-center", featured ? "p-4" : "p-3")}>
          <p className={cn("font-bold text-success", featured ? "text-2xl" : "text-lg")}>{typeof trader.winRate === 'number' ? trader.winRate.toFixed(1) : trader.winRate}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
        {featured && (
          <>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold">{formatNumber(trader.totalBets)}</p>
              <p className="text-xs text-muted-foreground">Bets</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className={cn("text-2xl font-bold", trader.pnl >= 0 ? "text-success" : "text-destructive")}>
                {formatUSD(trader.pnl)}
              </p>
              <p className="text-xs text-muted-foreground">Profit</p>
            </div>
          </>
        )}
      </div>

      {featured && (
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{trader.wins} wins</span>
          <span className="text-border">•</span>
          <span>{trader.losses} losses</span>
          <span className="text-border">•</span>
          <span>{formatUSD(trader.totalVolume)} volume</span>
        </div>
      )}
    </div>
  );
}

function VerificationStep({ step, title, description, icon: Icon, isLast = false }: {
  step: number;
  title: string;
  description: string;
  icon: any;
  isLast?: boolean;
}) {
  return (
    <div className="flex-1 relative">
      <div className="flex flex-col items-center text-center">
        {/* Step circle */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            {step}
          </div>
        </div>

        {/* Content */}
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground max-w-[200px]">{description}</p>
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10" />
      )}
    </div>
  );
}

function WilsonScoreDemo() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Raw Win Rate - Problem */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-destructive" />
          </div>
          <h4 className="font-semibold text-destructive">Raw win rate problem</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
            <span className="text-sm">3 wins / 3 bets</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="w-full h-full bg-destructive" />
              </div>
              <span className="text-sm font-bold text-destructive">100%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
            <span className="text-sm">650 wins / 1000 bets</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="w-[65%] h-full bg-muted-foreground" />
              </div>
              <span className="text-sm font-bold text-muted-foreground">65%</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
          Lucky beginners rank above proven experts
        </p>
      </div>

      {/* Wilson Score - Solution */}
      <div className="rounded-2xl border border-success/20 bg-success/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <h4 className="font-semibold text-success">Wilson Score solution</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
            <span className="text-sm">3 wins / 3 bets</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="w-[44%] h-full bg-muted-foreground" />
              </div>
              <span className="text-sm font-bold text-muted-foreground">43.8%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
            <span className="text-sm">650 wins / 1000 bets</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="w-[62%] h-full bg-success" />
              </div>
              <span className="text-sm font-bold text-success">62.1%</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
          Statistically accounts for sample size uncertainty
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════

export default function CaseStudyPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('polymarket');
  const [traders, setTraders] = useState<Record<string, TraderData[]>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTraders: 0, totalBets: 0, platforms: 7 });

  useEffect(() => {
    async function fetchAllTraders() {
      const allTraders: Record<string, TraderData[]> = {};
      let totalTraders = 0;
      let totalBets = 0;

      for (const platform of PLATFORMS) {
        try {
          const res = await fetch(platform.endpoint);
          const data = await res.json();

          if (data.success && data.data?.length > 0) {
            const platformTraders = data.data.slice(0, 5).map((t: any, idx: number) => ({
              ...t,
              platform: platform.id,
              rank: idx + 1,
            }));
            allTraders[platform.id] = platformTraders;
            totalTraders += platformTraders.length;
            totalBets += platformTraders.reduce((sum: number, t: any) => sum + (t.totalBets || 0), 0);
          }
        } catch (error) {
          console.error(`Failed to fetch ${platform.name} traders:`, error);
        }
      }

      setTraders(allTraders);
      setStats({ totalTraders, totalBets, platforms: PLATFORMS.length });
      setLoading(false);
    }

    fetchAllTraders();
  }, []);

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0];
  const currentTraders = traders[selectedPlatform] || [];
  const featuredTrader = currentTraders[0];

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION - Split Layout */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className={cn("absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-gradient-to-br", currentPlatform.gradient)} />

        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Content */}
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5">
                <Sparkles className="w-3 h-3" />
                Live case studies
              </Badge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Verified track records from{' '}
                <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", currentPlatform.gradient)}>
                  top traders
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Every stat pulled directly from the blockchain. No self-reporting, no manipulation.
                Just pure on-chain truth.
              </p>

              {/* Live Stats */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/80 border border-border/50">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm"><strong>{formatNumber(stats.totalTraders)}</strong> tracked traders</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/80 border border-border/50">
                  <BarChart3 className="w-4 h-4 text-success" />
                  <span className="text-sm"><strong>{formatNumber(stats.totalBets)}</strong> verified bets</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/80 border border-border/50">
                  <LinkIcon className="w-4 h-4 text-secondary" />
                  <span className="text-sm"><strong>{stats.platforms}</strong> platforms</span>
                </div>
              </div>
            </div>

            {/* Right - Featured Trader Preview */}
            <div className="relative">
              {loading ? (
                <Skeleton className="h-[320px] rounded-2xl" />
              ) : featuredTrader ? (
                <TraderCard trader={featuredTrader} platform={currentPlatform} featured />
              ) : (
                <div className="h-[320px] rounded-2xl border border-border/50 bg-surface/50 flex items-center justify-center">
                  <p className="text-muted-foreground">No traders found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PLATFORM SHOWCASE - Tabbed Bento Grid */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          {/* Platform Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200",
                  selectedPlatform === platform.id
                    ? cn("bg-gradient-to-r text-white shadow-lg", platform.gradient)
                    : "bg-surface/50 border border-border/50 hover:bg-surface hover:border-border"
                )}
              >
                <span className="text-lg">{platform.icon}</span>
                <span>{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Traders Grid - Bento Style */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className={cn("rounded-2xl", i === 1 ? "h-[280px] md:col-span-2 lg:col-span-1 lg:row-span-2" : "h-[140px]")} />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTraders.slice(0, 5).map((trader, idx) => (
                <div key={trader.address} className={cn(idx === 0 && "md:col-span-2 lg:col-span-1 lg:row-span-2")}>
                  <TraderCard trader={trader} platform={currentPlatform} featured={idx === 0} />
                </div>
              ))}
            </div>
          )}

          {/* View All CTA */}
          <div className="text-center mt-8">
            <Link href="/leaderboard">
              <Button variant="outline" className="gap-2">
                View full {currentPlatform.name} leaderboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VERIFICATION SECTION - Timeline */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-transparent via-surface/30 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Verification process
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              How we verify track records
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every score is backed by immutable blockchain data. No exceptions.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-4 max-w-4xl mx-auto">
            <VerificationStep
              step={1}
              title="On-chain data"
              description="All trades pulled directly from blockchain transactions"
              icon={Database}
            />
            <VerificationStep
              step={2}
              title="Immutable records"
              description="Every trade is permanently recorded. Cannot be edited or deleted"
              icon={LinkIcon}
            />
            <VerificationStep
              step={3}
              title="Publicly auditable"
              description="Anyone can verify by checking the wallet on block explorers"
              icon={Eye}
              isLast
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* WILSON SCORE SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="w-3 h-3 mr-1" />
              Statistical rigor
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Why TruthScore beats raw win rate
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              TruthScore uses <strong className="text-foreground">Wilson Score</strong> to account for sample size.
              A "100% win rate" on 3 bets doesn't beat a proven 60% on 1000 bets.
            </p>
          </div>

          <WilsonScoreDemo />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[100px] bg-primary/20" />

            <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to find your edge?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Explore verified traders across all supported prediction markets and start copy trading the best.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/leaderboard">
                  <Button size="lg" className="gap-2 h-12 px-8 shadow-lg shadow-primary/25">
                    View full leaderboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/copy-trading">
                  <Button size="lg" variant="outline" className="gap-2 h-12 px-8">
                    <Copy className="w-4 h-4" />
                    Try copy trading
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
