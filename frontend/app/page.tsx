'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@/components/ConnectWallet';
import { AnimatedCounter } from '@/components/animations/AnimatedCounter';
import { useInView } from 'react-intersection-observer';

interface PlatformStats {
  totalTraders: number;
  totalPredictions: number;
  totalVolumeBNB: number;
  totalVolumeUSD: number;
  supportedChains: number;
}
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Trophy,
  Users,
  CheckCircle2,
  BarChart3,
  Copy,
  Loader2,
  Sparkles,
  ChevronDown,
  Award,
  Star,
  Globe,
  Activity,
  Zap,
  Lock,
  Target,
  ArrowUpRight,
  Medal,
  Crown,
  Gem,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isRegistered, registerUser, isRegistering } = useTruthBounty();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Platform stats from API
  const [stats, setStats] = useState<PlatformStats>({
    totalTraders: 0,
    totalPredictions: 0,
    totalVolumeBNB: 0,
    totalVolumeUSD: 0,
    supportedChains: 2,
  });

  // Fetch real stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Animated hero score
  const [heroScore, setHeroScore] = useState(0);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (heroInView) {
      const duration = 2000;
      const startTime = Date.now();
      const targetScore = 847; // More realistic score for demo
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setHeroScore(Math.round(targetScore * easeOut));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [heroInView]);

  const handleGetStarted = () => {
    if (!isConnected) return;
    if (isRegistered) {
      router.push('/dashboard');
    } else {
      registerUser();
    }
  };

  return (
    <div className="flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════
          HERO - Mobile-first, clean and focused
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="container relative px-5 md:px-6 py-12 md:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto">
            {/* Mobile: Stack | Desktop: Grid */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center">

              {/* Text Content */}
              <div className="text-center lg:text-left mb-10 lg:mb-0 order-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  On-Chain Reputation Protocol
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.15] mb-5">
                  Prove your
                  <span className="block mt-1 bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    prediction skills
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
                  Import your trading history from Polymarket and PancakeSwap.
                  Get a verifiable TruthScore. Build your on-chain reputation.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                  {!isConnected ? (
                    <ConnectWallet />
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        disabled={isRegistering}
                        className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      >
                        {isRegistering ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
                        ) : isRegistered ? (
                          <>Go to Dashboard<ArrowRight className="h-4 w-4 ml-2" /></>
                        ) : (
                          <>Get Started Free<ArrowRight className="h-4 w-4 ml-2" /></>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => router.push('/leaderboard')}
                        className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
                      >
                        View Leaderboard
                      </Button>
                    </>
                  )}
                </div>

                {/* Social Proof - Simplified for mobile */}
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-bold text-foreground/80"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{stats.totalTraders > 0 ? stats.totalTraders.toLocaleString() : '—'}</span> traders verified
                  </p>
                </div>
              </div>

              {/* Hero Visual - Score Card */}
              <div ref={heroRef} className="w-full max-w-sm mx-auto lg:max-w-none order-2">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/20 rounded-[2rem] blur-2xl opacity-60" />

                  {/* Card */}
                  <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-surface-raised to-surface p-5 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm">
                    {/* Trophy badge */}
                    <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary to-amber-600 flex items-center justify-center shadow-lg shadow-secondary/30 rotate-6">
                      <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>

                    {/* Profile header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-foreground">0x7a3f...8e2d</p>
                        <Badge className="mt-0.5 bg-tier-platinum/90 text-white text-[10px] sm:text-xs font-semibold px-2">
                          Platinum
                        </Badge>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center py-5 sm:py-6 mb-5 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5">
                      <div className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-secondary via-amber-400 to-secondary bg-clip-text text-transparent tabular-nums">
                        {heroScore.toLocaleString()}
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1">TruthScore</p>
                      <div className="flex items-center justify-center gap-1.5 text-success text-xs sm:text-sm font-medium mt-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +127 this week
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: 'Win Rate', value: '58.2%', color: 'text-success' },
                        { label: 'Predictions', value: '127', color: 'text-foreground' },
                        { label: 'Volume', value: '4.2 BNB', color: 'text-secondary' },
                      ].map((stat, i) => (
                        <div key={i} className="text-center p-2 sm:p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className={`text-base sm:text-lg font-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/60">
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST METRICS - Compact mobile grid
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-12 md:py-16 border-y border-border/50 bg-surface/30">
        <div className="container px-5 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, value: stats.totalTraders, suffix: '', label: 'Traders' },
              { icon: Target, value: stats.totalPredictions, suffix: '', label: 'Predictions' },
              { icon: BarChart3, value: stats.totalVolumeUSD >= 1000000 ? stats.totalVolumeUSD / 1000000 : stats.totalVolumeUSD >= 1000 ? stats.totalVolumeUSD / 1000 : stats.totalVolumeUSD, prefix: '$', suffix: stats.totalVolumeUSD >= 1000000 ? 'M' : stats.totalVolumeUSD >= 1000 ? 'K' : '', label: 'Volume', decimals: stats.totalVolumeUSD >= 1000 ? 1 : 0 },
              { icon: Globe, value: stats.supportedChains, suffix: '', label: 'Chains' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.value > 0 ? (
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                  ) : (
                    '—'
                  )}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION - Side by side comparison
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                The problem we solve
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your prediction skills deserve to be recognized and verified
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Problem */}
              <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl border border-destructive/20 bg-destructive/[0.03]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  The Problem
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Your skills are invisible</h3>
                <ul className="space-y-3">
                  {[
                    'No way to prove your prediction track record',
                    'Trading history scattered across platforms',
                    'Anyone can claim to be a good trader',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                      <span className="text-destructive mt-0.5 text-lg leading-none">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution */}
              <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl border border-success/20 bg-success/[0.03]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Our Solution
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Verifiable on-chain reputation</h3>
                <ul className="space-y-3">
                  {[
                    'TruthScore proves your prediction accuracy',
                    'Aggregate history from multiple platforms',
                    "Soulbound NFT that can't be faked",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS - Clean 3-step process
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background">
        <div className="container px-5 md:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">How it works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Three simple steps to build your verifiable on-chain reputation
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              {[
                {
                  step: '01',
                  title: 'Connect & Register',
                  description: 'Connect your wallet and mint your soulbound reputation NFT for just 0.0005 BNB.',
                  icon: Shield,
                },
                {
                  step: '02',
                  title: 'Import History',
                  description: 'We automatically fetch your trading history from Polymarket and PancakeSwap.',
                  icon: Activity,
                },
                {
                  step: '03',
                  title: 'Build Reputation',
                  description: 'Your TruthScore updates as you make predictions. Climb the ranks!',
                  icon: Trophy,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  {/* Mobile: horizontal card | Desktop: centered */}
                  <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center">
                    {/* Icon container */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl md:rounded-full bg-gradient-to-b from-surface-raised to-surface border border-border/50 flex items-center justify-center shadow-lg md:mb-5">
                        <item.icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${index === 2 ? 'text-secondary' : 'text-primary'}`} />
                      </div>
                      {/* Step number */}
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 md:flex-none">
                      <h3 className="text-base sm:text-lg font-semibold mb-1 md:mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">{item.description}</p>
                    </div>
                  </div>

                  {/* Desktop connector line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES - Mobile-optimized list, desktop bento
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 md:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Powerful features</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Everything you need to track, prove, and leverage your prediction skills
              </p>
            </div>

            {/* Feature cards - stack on mobile, bento on desktop */}
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-6 md:gap-4">
              {/* Main feature - TruthScore */}
              <div className="md:col-span-4 md:row-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6 md:p-8 group hover:border-primary/30 transition-colors">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-60" />
                <div className="relative">
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">Core Feature</Badge>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">TruthScore Algorithm</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-5 max-w-md">
                    Your algorithmic reputation score based on win rate, volume, and prediction accuracy.
                  </p>

                  {/* Visual */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="p-4 sm:p-5 rounded-xl bg-surface/80 border border-border/50">
                      <p className="text-3xl sm:text-4xl font-bold text-secondary mb-0.5">2,847</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Your Score</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20 h-1.5 sm:h-2 rounded-full bg-success/20">
                          <div className="w-[67%] h-full rounded-full bg-success" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">67% Win</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20 h-1.5 sm:h-2 rounded-full bg-primary/20">
                          <div className="w-[80%] h-full rounded-full bg-primary" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">243 Trades</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smaller features */}
              <div className="md:col-span-2 rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Tier System</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Progress from Bronze to Diamond as you improve.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Soulbound NFT</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Non-transferable NFT proving your identity.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Copy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Copy Trading</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Follow top performers and automatically copy their trades.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 rounded-xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Global Leaderboard</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Compete with traders worldwide and discover top predictors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TIERS - Horizontal scroll on mobile
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_100%,rgba(245,158,11,0.08),transparent)]" />

        <div className="container px-5 md:px-6 relative">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Reputation tiers</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your TruthScore determines your tier. Higher tiers unlock exclusive benefits.
              </p>
            </div>

            {/* Tiers - simple responsive grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              {[
                { name: 'Bronze', range: '0-199', gradient: 'from-amber-700 to-amber-900', text: 'text-amber-500', icon: Medal },
                { name: 'Silver', range: '200-399', gradient: 'from-gray-400 to-gray-600', text: 'text-gray-400', icon: Shield },
                { name: 'Gold', range: '400-649', gradient: 'from-yellow-500 to-amber-600', text: 'text-yellow-500', icon: Trophy },
                { name: 'Platinum', range: '650-899', gradient: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', icon: Crown },
                { name: 'Diamond', range: '900+', gradient: 'from-cyan-300 via-white to-cyan-300', text: 'text-cyan-300', icon: Gem },
              ].map((tier, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-surface-raised to-surface border border-border/50 text-center hover:border-primary/30 transition-all hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}>
                    <tier.icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className={`text-xs sm:text-base font-bold ${tier.text}`}>{tier.name}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{tier.range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PLATFORMS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Supported platforms</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Import your prediction history from leading markets
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  name: 'Polymarket',
                  description: 'The leading prediction market for real-world events.',
                  chain: 'Polygon',
                  volume: '$2.1B+',
                  gradient: 'from-purple-500/10 to-blue-500/10',
                  iconBg: 'from-purple-500 to-blue-600',
                  glow: 'rgba(139, 92, 246, 0.15)',
                },
                {
                  name: 'PancakeSwap Prediction',
                  description: 'BNB/USDT price predictions with 5-minute rounds.',
                  chain: 'BSC',
                  volume: '$340M+',
                  gradient: 'from-amber-500/10 to-yellow-500/10',
                  iconBg: 'from-amber-500 to-yellow-500',
                  glow: 'rgba(245, 158, 11, 0.15)',
                },
                {
                  name: 'Azuro',
                  description: 'Decentralized sports betting infrastructure.',
                  chain: 'Multi-chain',
                  volume: '$180M+',
                  gradient: 'from-blue-500/10 to-cyan-500/10',
                  iconBg: 'from-blue-500 to-cyan-500',
                  glow: 'rgba(59, 130, 246, 0.15)',
                },
                {
                  name: 'SX Bet',
                  description: 'Sports betting on the SX Network.',
                  chain: 'SX Network',
                  volume: '$95M+',
                  gradient: 'from-emerald-500/10 to-teal-500/10',
                  iconBg: 'from-emerald-500 to-teal-500',
                  glow: 'rgba(16, 185, 129, 0.15)',
                },
                {
                  name: 'Overtime',
                  description: 'Sports markets powered by Thales protocol.',
                  chain: 'Optimism',
                  volume: '$75M+',
                  gradient: 'from-red-500/10 to-orange-500/10',
                  iconBg: 'from-red-500 to-orange-500',
                  glow: 'rgba(239, 68, 68, 0.15)',
                },
                {
                  name: 'Limitless',
                  description: 'Prediction markets with no limits.',
                  chain: 'Base',
                  volume: '$12M+',
                  gradient: 'from-indigo-500/10 to-violet-500/10',
                  iconBg: 'from-indigo-500 to-violet-500',
                  glow: 'rgba(99, 102, 241, 0.15)',
                },
                {
                  name: 'Speed Markets',
                  description: 'Fast-paced crypto price predictions.',
                  chain: 'Optimism',
                  volume: '$8M+',
                  gradient: 'from-pink-500/10 to-rose-500/10',
                  iconBg: 'from-pink-500 to-rose-500',
                  glow: 'rgba(236, 72, 153, 0.15)',
                },
              ].map((platform, i) => (
                <div
                  key={i}
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div
                    className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ background: platform.glow }}
                  />
                  <div
                    className={`relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${platform.gradient} p-5 sm:p-6 hover:border-primary/30 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.iconBg} flex items-center justify-center shadow-lg`}>
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{platform.chain}</Badge>
                        <Badge className="bg-success/20 text-success border-success/30 text-[10px] sm:text-xs">Live</Badge>
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-1">{platform.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">{platform.description}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl sm:text-3xl font-bold text-secondary">{platform.volume}</p>
                      <span className="text-sm text-muted-foreground">volume</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background">
        <div className="container px-5 md:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Questions?</h2>
              <p className="text-muted-foreground">Everything you need to know about TruthBounty</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[
                {
                  q: 'What is TruthScore?',
                  a: 'TruthScore is an algorithmic reputation score calculated from your win rate, prediction volume, and accuracy across supported platforms. Max score is 1300, with tiers from Bronze (0-199) to Diamond (900+).',
                },
                {
                  q: 'What is a soulbound NFT?',
                  a: 'A soulbound NFT is a non-transferable token permanently tied to your wallet. It serves as your verifiable on-chain identity and updates dynamically as your TruthScore changes.',
                },
                {
                  q: 'How do you calculate reputation?',
                  a: 'We fetch your trading history directly from supported platforms. Your score is based on win rate (60%), volume (25%), and consistency (15%).',
                },
                {
                  q: 'Is this free to use?',
                  a: 'Minting your reputation NFT costs 0.0005 BNB (about $0.30). After that, all features are free. We take no fees from your trading.',
                },
                {
                  q: 'What platforms do you support?',
                  a: 'We support Polymarket, PancakeSwap Prediction, Azuro, SX Bet, Overtime, Limitless, and Speed Markets across Polygon, BSC, Optimism, Arbitrum, Base, and more.',
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-surface/50 transition-colors"
                  >
                    <span className="font-medium text-sm sm:text-base pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? 'max-h-48' : 'max-h-0'}`}>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />

        <div className="container px-5 md:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6 shadow-lg shadow-primary/25">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to prove your skills?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              {stats.totalTraders > 0
                ? `Join ${stats.totalTraders.toLocaleString()} traders building their on-chain reputation.`
                : 'Start building your on-chain reputation today.'
              } Your predictions have value.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isConnected ? (
                <ConnectWallet />
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    disabled={isRegistering}
                    className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25"
                  >
                    {isRegistering ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
                    ) : isRegistered ? (
                      <>Go to Dashboard<ArrowRight className="h-4 w-4 ml-2" /></>
                    ) : (
                      <>Get Started Free<ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/leaderboard')}
                    className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base"
                  >
                    Explore Leaderboard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
