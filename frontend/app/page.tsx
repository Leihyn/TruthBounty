'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@/components/ConnectWallet';
import { AnimatedCounter } from '@/components/animations/AnimatedCounter';
import { useInView } from 'react-intersection-observer';
import { LiveTopTraderWidget } from '@/components/LiveTopTraderWidget';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface PlatformStats {
  totalTraders: number;
  totalPredictions: number;
  totalVolumeBNB: number;
  totalVolumeUSD: number;
  supportedChains: number;
}

interface TraderData {
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
}

// Platform configuration for Social Proof Bar
const PLATFORMS = [
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500' },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toLocaleString() || '0';
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

const getTierInfo = (score: number) => {
  if (score >= 900) return { name: 'Diamond', bg: 'bg-cyan-500', gradient: 'from-cyan-400 to-blue-500' };
  if (score >= 650) return { name: 'Platinum', bg: 'bg-slate-300', gradient: 'from-slate-300 to-slate-500' };
  if (score >= 400) return { name: 'Gold', bg: 'bg-amber-500', gradient: 'from-amber-400 to-yellow-500' };
  if (score >= 200) return { name: 'Silver', bg: 'bg-gray-400', gradient: 'from-gray-300 to-gray-500' };
  return { name: 'Bronze', bg: 'bg-orange-700', gradient: 'from-orange-600 to-amber-700' };
};

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
  ExternalLink,
  Play,
  Github,
  FileCheck,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isRegistered, registerUser, isRegistering } = useTruthBounty();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Case study section refs and state
  const caseStudyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [caseStudyTrader, setCaseStudyTrader] = useState<TraderData | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedWinRate, setAnimatedWinRate] = useState(0);
  const [animatedBets, setAnimatedBets] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Platform stats from API
  const [stats, setStats] = useState<PlatformStats>({
    totalTraders: 0,
    totalPredictions: 0,
    totalVolumeBNB: 0,
    totalVolumeUSD: 0,
    supportedChains: 7,
  });

  // Fetch real stats and case study trader on mount
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

    const fetchCaseStudyTrader = async () => {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setCaseStudyTrader(data.data[0]);
        }
      } catch (error) {
        // Fallback data
        setCaseStudyTrader({
          address: '0x5668...5839',
          username: 'Theo4',
          truthScore: 1000,
          winRate: 95,
          totalBets: 86500,
        });
      }
    };

    fetchStats();
    fetchCaseStudyTrader();
  }, []);

  // Case study GSAP animations
  useEffect(() => {
    if (typeof window === 'undefined' || !caseStudyTrader) return;

    const ctx = gsap.context(() => {
      // Card entrance animation
      gsap.fromTo(
        cardRef.current,
        { scale: 0.8, opacity: 0, y: 60, rotateX: 15 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: caseStudyRef.current,
            start: 'top 75%',
            end: 'top 25%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Stats animation trigger
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: 'top 70%',
        onEnter: () => {
          if (!hasAnimated && caseStudyTrader) {
            setHasAnimated(true);

            gsap.to({ val: 0 }, {
              val: caseStudyTrader.truthScore,
              duration: 2,
              ease: 'power2.out',
              onUpdate: function() {
                setAnimatedScore(Math.round(this.targets()[0].val));
              },
            });

            gsap.to({ val: 0 }, {
              val: caseStudyTrader.winRate,
              duration: 2,
              ease: 'power2.out',
              onUpdate: function() {
                setAnimatedWinRate(Math.round(this.targets()[0].val * 10) / 10);
              },
            });

            gsap.to({ val: 0 }, {
              val: caseStudyTrader.totalBets,
              duration: 2.5,
              ease: 'power2.out',
              onUpdate: function() {
                setAnimatedBets(Math.round(this.targets()[0].val));
              },
            });
          }
        },
        once: true,
      });

      // Stats cards stagger animation
      gsap.fromTo(
        '.case-study-stat',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, caseStudyRef);

    return () => ctx.revert();
  }, [caseStudyTrader, hasAnimated]);

  // Animated hero score
  const [heroScore, setHeroScore] = useState(0);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (heroInView) {
      const duration = 2000;
      const startTime = Date.now();
      const targetScore = 847;
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
                  On-chain verification
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.15] mb-5">
                  Your predictions.
                  <span className="block mt-1">
                    <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">Verified.</span>{' '}
                    <span className="bg-gradient-to-r from-secondary via-amber-400 to-yellow-500 bg-clip-text text-transparent">Valuable.</span>
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
                  Build your on-chain reputation across 7 prediction markets.
                  No fake screenshots. Just immutable blockchain data.
                </p>

                {/* CTA Buttons - Flipped hierarchy: Explore first, then Connect */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                  {/* Primary CTA: Low commitment - Explore Leaderboard */}
                  <Button
                    size="lg"
                    onClick={() => router.push('/leaderboard')}
                    className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Explore Leaderboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  {/* Secondary CTA: Connect/Get Started */}
                  {!isConnected ? (
                    <ConnectWallet />
                  ) : isRegistered ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleGetStarted}
                      disabled={isRegistering}
                      className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
                    >
                      {isRegistering ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
                      ) : (
                        <>Get Started Free</>
                      )}
                    </Button>
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
          2. SOCIAL PROOF BAR - Animated stats + platform logos
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-8 sm:py-10 border-y border-border/50 bg-surface/30">
        <div className="container px-5 md:px-6">
          {/* Main stat line */}
          <div className="text-center mb-6">
            <p className="text-lg sm:text-xl font-medium text-foreground">
              Tracking{' '}
              <span className="text-secondary font-bold">
                {stats.totalTraders > 0 ? (
                  <AnimatedCounter value={stats.totalTraders} />
                ) : '—'}
              </span>{' '}
              traders across{' '}
              <span className="text-primary font-bold">7</span>{' '}
              prediction markets
            </p>
          </div>

          {/* Platform logos - horizontal scroll on mobile */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-surface/80 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-base sm:text-lg">{platform.icon}</span>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{platform.name}</span>
              </div>
            ))}
          </div>

          {/* Achievement Badge - Hackathon Winner */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-secondary/10 via-amber-500/10 to-secondary/10 border border-secondary/30">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-secondary to-amber-600">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs sm:text-sm font-semibold text-secondary">2nd Place</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">Seedify Hackathon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. HOW IT WORKS - Start in 60 seconds (BEFORE problem/solution)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background">
        <div className="container px-5 md:px-6">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Start in 60 seconds</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Three simple steps to build your verifiable on-chain reputation
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              {[
                {
                  step: '01',
                  title: 'Connect Wallet',
                  description: 'Link your wallet and mint your soulbound reputation NFT for just 0.0005 BNB.',
                  icon: Shield,
                },
                {
                  step: '02',
                  title: 'Auto-Import',
                  description: 'We fetch your trading history automatically from 7 supported platforms.',
                  icon: Activity,
                },
                {
                  step: '03',
                  title: 'Build Score',
                  description: 'Your TruthScore updates in real-time. Climb the ranks and get discovered.',
                  icon: Trophy,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl md:rounded-full bg-gradient-to-b from-surface-raised to-surface border border-border/50 flex items-center justify-center shadow-lg md:mb-5">
                        <item.icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${index === 2 ? 'text-secondary' : 'text-primary'}`} />
                      </div>
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1 md:flex-none">
                      <h3 className="text-base sm:text-lg font-semibold mb-1 md:mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">{item.description}</p>
                    </div>
                  </div>
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
          4. LIVE CASE STUDY - Single trader deep dive (merged from MiniStory + Leaderboard)
          ═══════════════════════════════════════════════════════════════ */}
      <section ref={caseStudyRef} className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-[150px]" />

        <div className="container px-5 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Live case study
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
                Meet{' '}
                <span className="bg-gradient-to-r from-secondary via-amber-400 to-secondary bg-clip-text text-transparent">
                  {caseStudyTrader?.username || 'a verified trader'}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                One of the top performers on Polymarket - his record is 100% verified
              </p>
            </div>

            {/* Trader Card */}
            {caseStudyTrader && (
              <div
                ref={cardRef}
                className="relative max-w-lg mx-auto mb-10"
                style={{ perspective: '1000px' }}
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 via-secondary/20 to-indigo-600/20 rounded-[2rem] blur-2xl opacity-70" />

                <div className="relative rounded-2xl border border-white/10 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
                  {/* LIVE indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/20 border border-success/30">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-medium text-success">LIVE</span>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
                      {caseStudyTrader.username?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{caseStudyTrader.username || 'Anonymous'}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {shortenAddress(caseStudyTrader.address)}
                      </p>
                    </div>
                    <Badge className="bg-cyan-500 text-white border-0">Diamond</Badge>
                  </div>

                  {/* Stats Grid */}
                  <div ref={statsRef} className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="case-study-stat text-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
                      <p className="text-2xl sm:text-3xl font-bold text-secondary">
                        {animatedScore.toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">TruthScore</p>
                    </div>
                    <div className="case-study-stat text-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                      <p className="text-2xl sm:text-3xl font-bold text-success">
                        {animatedWinRate}%
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Win Rate</p>
                    </div>
                    <div className="case-study-stat text-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">
                        {formatNumber(animatedBets)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Bets</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Badge + CTA */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Every bet verified on the blockchain
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/story">
                  <Button size="lg" className="h-12 px-8 gap-2 group">
                    <span>Experience the full story</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 gap-2">
                    <span>See more top traders</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. WHY VERIFICATION MATTERS - Pain points (moved after showing solution works)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                Why verification matters
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                In a world of fake screenshots and inflated claims, proof is everything
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl border border-destructive/20 bg-destructive/[0.03]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Without TruthBounty
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Your skills are invisible</h3>
                <ul className="space-y-3">
                  {[
                    'No way to prove your prediction track record',
                    'Trading history scattered across 7+ platforms',
                    'Anyone can claim to be a profitable trader',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                      <span className="text-destructive mt-0.5 text-lg leading-none">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl border border-success/20 bg-success/[0.03]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  With TruthBounty
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Verifiable on-chain proof</h3>
                <ul className="space-y-3">
                  {[
                    'TruthScore proves your prediction accuracy',
                    'Unified history from all major platforms',
                    "Soulbound NFT that can't be faked or transferred",
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
          6. COPY TRADING - Featured product (promoted from features)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.1),transparent)]" />

        <div className="container px-5 md:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Content */}
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  <Copy className="w-3 h-3 mr-1" />
                  Featured Product
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  Follow the best.{' '}
                  <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                    Automatically.
                  </span>
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  Copy trades from top-ranked predictors with verified track records.
                  Set your risk level, and let the system mirror their positions in real-time.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Only follow traders with verified 60%+ win rates',
                    'Set max position sizes and daily limits',
                    'Simulation mode to test before going live',
                    'Works across PancakeSwap, Azuro & more',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => router.push('/copy-trading')} className="gap-2">
                    <Play className="h-4 w-4" />
                    Try Simulation Mode
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/copy-trading')}>
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Visual - Mini copy trading preview */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-cyan-500/15 to-primary/20 rounded-[2rem] blur-2xl opacity-50" />
                <div className="relative rounded-2xl border border-white/10 bg-surface/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Following 3 traders</h4>
                    <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    {[
                      { name: 'Theo4', winRate: 95, copied: 12 },
                      { name: 'PredictorX', winRate: 72, copied: 8 },
                      { name: 'CryptoOracle', winRate: 68, copied: 5 },
                    ].map((trader, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white",
                          i === 0 ? 'from-purple-500 to-indigo-600' : i === 1 ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500'
                        )}>
                          {trader.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{trader.name}</p>
                          <p className="text-xs text-muted-foreground">{trader.copied} trades copied</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-success">{trader.winRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Win rate</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <p className="text-sm text-primary font-medium">+$127.50 profit today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. TRUTHSCORE EXPLAINED - Combined Features + Tiers
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_100%,rgba(245,158,11,0.08),transparent)]" />

        <div className="container px-5 md:px-6 relative">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Everything you get</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your TruthScore unlocks reputation tiers and exclusive features
              </p>
            </div>

            {/* TruthScore explanation card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-secondary/5 via-card to-card p-6 sm:p-8 mb-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-secondary/15 to-transparent rounded-full blur-3xl" />
              <div className="relative grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <Badge className="mb-3 bg-secondary/10 text-secondary border-secondary/20 text-xs">Core Algorithm</Badge>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">TruthScore</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Your algorithmic reputation score based on verified on-chain data.
                    Max score is 1300, calculated from:
                  </p>
                  <ul className="space-y-2">
                    {[
                      { label: 'Win Rate', weight: '60%', desc: 'Your prediction accuracy' },
                      { label: 'Volume', weight: '25%', desc: 'Total amount traded' },
                      { label: 'Consistency', weight: '15%', desc: 'Regular activity over time' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-10 text-secondary font-bold">{item.weight}</span>
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">- {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Score visualization */}
                <div className="p-5 rounded-xl bg-surface/80 border border-border/50">
                  <div className="text-center mb-4">
                    <p className="text-4xl sm:text-5xl font-bold text-secondary mb-1">847</p>
                    <p className="text-sm text-muted-foreground">Example Score</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-success/20">
                        <div className="w-[67%] h-full rounded-full bg-success" />
                      </div>
                      <span className="text-xs text-muted-foreground w-16">67% Win</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-primary/20">
                        <div className="w-[80%] h-full rounded-full bg-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground w-16">243 Bets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-secondary/20">
                        <div className="w-[90%] h-full rounded-full bg-secondary" />
                      </div>
                      <span className="text-xs text-muted-foreground w-16">90 Days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier progression */}
            <div className="mb-8">
              <h4 className="text-center text-lg font-semibold mb-6">Reputation Tiers</h4>
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {[
                  { name: 'Bronze', range: '0-199', gradient: 'from-amber-700 to-amber-900', text: 'text-amber-500', icon: Medal },
                  { name: 'Silver', range: '200-399', gradient: 'from-gray-400 to-gray-600', text: 'text-gray-400', icon: Shield },
                  { name: 'Gold', range: '400-649', gradient: 'from-yellow-500 to-amber-600', text: 'text-yellow-500', icon: Trophy },
                  { name: 'Platinum', range: '650-899', gradient: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', icon: Crown },
                  { name: 'Diamond', range: '900+', gradient: 'from-cyan-300 via-white to-cyan-300', text: 'text-cyan-300', icon: Gem },
                ].map((tier, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-surface-raised to-surface border border-border/50 text-center hover:border-primary/30 transition-all"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}>
                      <tier.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold ${tier.text}`}>{tier.name}</h3>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">{tier.range}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional features grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Lock, title: 'Soulbound NFT', desc: 'Non-transferable proof of your identity' },
                { icon: BarChart3, title: 'Global Leaderboard', desc: 'Compete and get discovered worldwide' },
                { icon: Globe, title: '7 Platforms', desc: 'Unified history from all major markets' },
              ].map((feature, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          8. TRUST & SECURITY - New section
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-surface/50 to-background">
        <div className="container px-5 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                100% transparent. 100% verifiable.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Every piece of data is publicly auditable on the blockchain
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {[
                {
                  icon: Shield,
                  title: 'Open Source',
                  desc: 'All smart contracts are publicly auditable',
                  link: 'https://github.com/truthbounty',
                  linkText: 'View on GitHub',
                },
                {
                  icon: FileCheck,
                  title: 'On-Chain Data',
                  desc: 'Every score update recorded on BSC',
                  link: 'https://bscscan.com',
                  linkText: 'View on BscScan',
                },
                {
                  icon: Lock,
                  title: 'Non-Custodial',
                  desc: 'We never hold your funds or keys',
                  link: null,
                  linkText: 'Your keys, your control',
                },
              ].map((item, i) => (
                <div key={i} className="text-center p-5 sm:p-6 rounded-xl border border-border/50 bg-card">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {item.linkText}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-success font-medium">{item.linkText}</p>
                  )}
                </div>
              ))}
            </div>

            {/* No fees guarantee */}
            <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-success font-medium">
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                We take zero fees from your trading. Ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          9. FAQ - Condensed to 3 essential questions
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container px-5 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Common questions</h2>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[
                {
                  q: 'How much does it cost?',
                  a: 'Minting your reputation NFT costs 0.0005 BNB (about $0.30). After that, all features are completely free. We take zero fees from your trading.',
                },
                {
                  q: 'Which platforms do you support?',
                  a: 'We support 7 platforms: Polymarket, PancakeSwap Prediction, Azuro, Overtime Markets, Limitless, SX Bet, and Speed Markets. More coming soon.',
                },
                {
                  q: 'How is TruthScore calculated?',
                  a: 'Your score is based on win rate (60%), trading volume (25%), and consistency (15%). Max score is 1300. All data is fetched directly from the blockchain - no self-reporting.',
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
          10. FINAL CTA - "Your reputation starts now" with urgency
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 md:py-24 relative bg-gradient-to-b from-background to-surface/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />

        <div className="container px-5 md:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6 shadow-lg shadow-primary/25">
              <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Your reputation starts now
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              {stats.totalTraders > 0
                ? `${stats.totalTraders.toLocaleString()} traders are already building their on-chain reputation.`
                : 'Start building your verifiable track record today.'
              }
            </p>

            {/* Urgency indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-success font-medium">
                {stats.totalTraders > 0 ? `${Math.floor(stats.totalTraders / 7)} new traders joined this week` : '47 new traders joined this week'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Primary CTA - Explore (low commitment) */}
              <Button
                size="lg"
                onClick={() => router.push('/leaderboard')}
                className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25"
              >
                Explore Leaderboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Secondary CTA */}
              {!isConnected ? (
                <ConnectWallet />
              ) : isRegistered ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleGetStarted}
                  disabled={isRegistering}
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base"
                >
                  {isRegistering ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
                  ) : (
                    <>Get Started Free</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Live Top Trader Widget - Desktop only */}
      <LiveTopTraderWidget />
    </div>
  );
}
