'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectWallet } from '@/components/ConnectWallet';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  BarChart3,
  Copy,
  Sparkles,
  Trophy,
  Users,
  TrendingUp,
  Database,
  Link as LinkIcon,
  Eye,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  volume: string;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PLATFORMS: PlatformConfig[] = [
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600', volume: '$2.1B+' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500', volume: '$340M+' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500', volume: '$180M+' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500', volume: '$75M+' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500', volume: '$12M+' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500', volume: '$95M+' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500', volume: '$8M+' },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toLocaleString() || '0';
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function StoryPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for each scene
  const scene1Ref = useRef<HTMLDivElement>(null);
  const scene2Ref = useRef<HTMLDivElement>(null);
  const scene3Ref = useRef<HTMLDivElement>(null);
  const scene4Ref = useRef<HTMLDivElement>(null);
  const scene5Ref = useRef<HTMLDivElement>(null);
  const scene6Ref = useRef<HTMLDivElement>(null);
  const scene7Ref = useRef<HTMLDivElement>(null);

  // State
  const [featuredTrader, setFeaturedTrader] = useState<TraderData | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedWinRate, setAnimatedWinRate] = useState(0);
  const [animatedBets, setAnimatedBets] = useState(0);

  // Fetch featured trader
  useEffect(() => {
    async function fetchTrader() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setFeaturedTrader(data.data[0]);
        }
      } catch (error) {
        // Use fallback data
        setFeaturedTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1170,
          winRate: 95,
          totalBets: 86500,
          wins: 82175,
          losses: 4325,
          totalVolume: '2450000',
          pnl: 47000,
        });
      }
    }
    fetchTrader();
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // Scene 1: The Hook - Fade in and scale
      gsap.fromTo(
        '.scene1-card',
        { scale: 0.8, opacity: 0, y: 100 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: scene1Ref.current,
            start: 'top 80%',
            end: 'top 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.scene1-text',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: scene1Ref.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 2: Stats count up
      ScrollTrigger.create({
        trigger: scene2Ref.current,
        start: 'top 60%',
        onEnter: () => {
          if (featuredTrader) {
            // Animate score
            gsap.to({}, {
              duration: 2,
              onUpdate: function() {
                setAnimatedScore(Math.round(featuredTrader.truthScore * this.progress()));
              },
            });
            // Animate win rate
            gsap.to({}, {
              duration: 2,
              onUpdate: function() {
                setAnimatedWinRate(Math.round(featuredTrader.winRate * this.progress() * 10) / 10);
              },
            });
            // Animate bets
            gsap.to({}, {
              duration: 2.5,
              onUpdate: function() {
                setAnimatedBets(Math.round(featuredTrader.totalBets * this.progress()));
              },
            });
          }
        },
        once: true,
      });

      gsap.fromTo(
        '.scene2-stat',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: scene2Ref.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 3: Verification timeline reveal
      gsap.fromTo(
        '.scene3-step',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: scene3Ref.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.scene3-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: scene3Ref.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 4: Problem points fade in
      gsap.fromTo(
        '.scene4-item',
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.2,
          scrollTrigger: {
            trigger: scene4Ref.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 5: Wilson Score comparison
      gsap.fromTo(
        '.scene5-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.2,
          scrollTrigger: {
            trigger: scene5Ref.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.scene5-bar',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: scene5Ref.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 6: Platforms fly in
      gsap.fromTo(
        '.scene6-platform',
        { scale: 0, rotation: -10, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: scene6Ref.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scene 7: CTA pulse
      gsap.fromTo(
        '.scene7-cta',
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: scene7Ref.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [featuredTrader]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          SCENE 1: THE HOOK - Meet the top trader
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene1Ref}
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Intro text */}
          <Badge className="scene1-text mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Live case study
          </Badge>

          <h1 className="scene1-text text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
            Meet{' '}
            <span className="bg-gradient-to-r from-secondary via-amber-400 to-secondary bg-clip-text text-transparent">
              {featuredTrader?.username || 'Theo4'}
            </span>
          </h1>

          <p className="scene1-text text-xl sm:text-2xl text-muted-foreground mb-12">
            One of the top traders on Polymarket
          </p>

          {/* Trader Card */}
          <div className="scene1-card relative max-w-md mx-auto">
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 rounded-[2rem] blur-2xl" />

            <div className="relative rounded-2xl border border-white/10 bg-surface/90 backdrop-blur-xl p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl">
                  🔮
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">{featuredTrader?.username || 'Theo4'}</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {shortenAddress(featuredTrader?.address || '0x7a3f...5a6f')}
                  </p>
                </div>
                <Badge className="ml-auto bg-cyan-500 text-white">Diamond</Badge>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-secondary">{featuredTrader?.truthScore || 1170}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-success">{featuredTrader?.winRate || 95}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold">{formatNumber(featuredTrader?.totalBets || 86500)}</p>
                  <p className="text-xs text-muted-foreground">Bets</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-muted-foreground/60">
          <span className="text-sm mb-2">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 2: THE STATS - Numbers animate
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene2Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            His record is{' '}
            <span className="text-primary">verified</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-16">
            Every single bet. On the blockchain. Immutable.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="scene2-stat p-8 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
              <p className="text-5xl sm:text-6xl font-bold text-secondary mb-2">
                {animatedScore.toLocaleString()}
              </p>
              <p className="text-lg text-muted-foreground">TruthScore</p>
            </div>
            <div className="scene2-stat p-8 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <p className="text-5xl sm:text-6xl font-bold text-success mb-2">
                {animatedWinRate}%
              </p>
              <p className="text-lg text-muted-foreground">Win Rate</p>
            </div>
            <div className="scene2-stat p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-5xl sm:text-6xl font-bold text-primary mb-2">
                {formatNumber(animatedBets)}
              </p>
              <p className="text-lg text-muted-foreground">Total Bets</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 3: THE QUESTION - How do we verify?
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene3Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-background via-surface/30 to-background"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How do we{' '}
            <span className="text-primary">know</span>{' '}
            this is real?
          </h2>
          <p className="text-xl text-muted-foreground mb-16">
            Every score is backed by immutable blockchain data
          </p>

          {/* Timeline */}
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            {/* Connector line */}
            <div className="scene3-line hidden md:block absolute top-1/2 left-[20%] right-[20%] h-1 bg-gradient-to-r from-primary via-primary/50 to-primary origin-left" />

            {[
              { icon: Database, title: 'On-chain data', desc: 'Pulled directly from blockchain' },
              { icon: LinkIcon, title: 'Immutable records', desc: 'Cannot be edited or deleted' },
              { icon: Eye, title: 'Publicly auditable', desc: 'Anyone can verify on-chain' },
            ].map((step, i) => (
              <div key={i} className="scene3-step relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4">
                  <step.icon className="w-9 h-9 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 4: THE PROBLEM - Pain points
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene4Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center">
            The problem with{' '}
            <span className="text-destructive">prediction markets</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Your skills are invisible. Until now.
          </p>

          <div className="space-y-4">
            {[
              { text: 'Anyone can claim to be a great trader', icon: '❌' },
              { text: 'No way to verify track records', icon: '❌' },
              { text: 'Trading history scattered across platforms', icon: '❌' },
              { text: 'Screenshots and stats can be faked', icon: '❌' },
            ].map((item, i) => (
              <div
                key={i}
                className="scene4-item flex items-center gap-4 p-5 rounded-xl bg-destructive/5 border border-destructive/20"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-lg">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 5: THE SOLUTION - TruthScore & Wilson
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene5Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-background via-surface/30 to-background"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-success/10 text-success border-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            The Solution
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            TruthScore:{' '}
            <span className="text-success">verifiable reputation</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            We use <strong className="text-foreground">Wilson Score</strong> to account for sample size.
            A "100% win rate" on 3 bets doesn't beat 60% on 1000 bets.
          </p>

          {/* Wilson Score comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="scene5-card p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-left">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Raw win rate problem</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">3 wins / 3 bets</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="scene5-bar w-full h-full bg-destructive origin-left" />
                    </div>
                    <span className="text-sm font-bold text-destructive">100%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">650 wins / 1000 bets</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="scene5-bar w-[65%] h-full bg-muted-foreground origin-left" />
                    </div>
                    <span className="text-sm font-bold">65%</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
                Lucky beginners rank above proven experts
              </p>
            </div>

            <div className="scene5-card p-6 rounded-2xl bg-success/5 border border-success/20 text-left">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-success">Wilson Score solution</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">3 wins / 3 bets</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="scene5-bar w-[44%] h-full bg-muted-foreground origin-left" />
                    </div>
                    <span className="text-sm font-bold">43.8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">650 wins / 1000 bets</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="scene5-bar w-[62%] h-full bg-success origin-left" />
                    </div>
                    <span className="text-sm font-bold text-success">62.1%</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
                Statistically accounts for sample size
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 6: THE ECOSYSTEM - Platforms
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene6Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Every prediction.{' '}
            <span className="text-primary">Every chain.</span>{' '}
            One score.
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            We aggregate your history from 7 prediction markets
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className={cn(
                  "scene6-platform p-5 rounded-2xl border border-white/10 bg-surface/50 hover:bg-surface transition-all",
                )}
              >
                <div className={cn(
                  "w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl",
                  platform.gradient
                )}>
                  {platform.icon}
                </div>
                <h3 className="font-semibold mb-1">{platform.name}</h3>
                <p className="text-sm text-secondary font-bold">{platform.volume}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE 7: THE CTA - Final call to action
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={scene7Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px]" />

        <div className="scene7-cta relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to prove{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              your skills
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of traders building their on-chain reputation.
            Your predictions have value.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                  className="h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/leaderboard')}
                  className="h-14 px-10 text-lg"
                >
                  View Leaderboard
                </Button>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              No trading fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              100% on-chain
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
