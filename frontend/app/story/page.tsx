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
  CheckCircle2,
  BarChart3,
  Trophy,
  Globe,
  Target,
  Timer,
  Infinity,
  Dice5,
  Gauge,
  Layers,
  Wallet,
  Database,
  Sparkles,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Platform data with colors and icons
const PLATFORMS = [
  { id: 'polymarket', name: 'Polymarket', Icon: Globe, predictions: '50,000', color: 'from-purple-500 to-indigo-600', bgColor: 'bg-purple-500' },
  { id: 'pancakeswap', name: 'PancakeSwap', Icon: BarChart3, predictions: '20,000', color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500' },
  { id: 'azuro', name: 'Azuro', Icon: Target, predictions: '10,000', color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-500' },
  { id: 'overtime', name: 'Overtime', Icon: Timer, predictions: '5,000', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-500' },
  { id: 'limitless', name: 'Limitless', Icon: Infinity, predictions: '800', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500' },
  { id: 'sxbet', name: 'SX Bet', Icon: Dice5, predictions: '500', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500' },
  { id: 'speedmarkets', name: 'Speed Markets', Icon: Gauge, predictions: '200', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-500' },
];

// Scatter positions - contained within viewport (max ~35% from center)
const SCATTER_POSITIONS = [
  { x: 0, y: -28, rotate: 0 },       // Top center (Polymarket - prominent)
  { x: -30, y: -12, rotate: -8 },    // Upper left
  { x: 30, y: -12, rotate: 8 },      // Upper right
  { x: -35, y: 12, rotate: -6 },     // Middle left
  { x: 35, y: 12, rotate: 6 },       // Middle right
  { x: -22, y: 28, rotate: -4 },     // Lower left
  { x: 22, y: 28, rotate: 4 },       // Lower right
];

interface TraderData {
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
}

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

export default function StoryPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);
  const cinematicRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [featuredTrader, setFeaturedTrader] = useState<TraderData | null>(null);
  const [animatedTotalBets, setAnimatedTotalBets] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPlatforms, setAnimatedPlatforms] = useState(0);

  useEffect(() => {
    async function fetchTrader() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setFeaturedTrader(data.data[0]);
        }
      } catch {
        setFeaturedTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1170,
          winRate: 94,
          totalBets: 86500,
        });
      }
    }
    fetchTrader();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !featuredTrader || !cinematicRef.current) return;

    const ctx = gsap.context(() => {
      // Kill any existing ScrollTriggers to prevent duplicates
      ScrollTrigger.getAll().forEach(st => st.kill());

      // ═══════════════════════════════════════════════════════════════
      // INTRO SECTION (animate immediately on load - no scroll trigger)
      // ═══════════════════════════════════════════════════════════════
      gsap.fromTo('.intro-content',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          delay: 0.3, // Small delay for page to settle
        }
      );

      // ═══════════════════════════════════════════════════════════════
      // CINEMATIC SCROLL-DRIVEN ANIMATION
      // ═══════════════════════════════════════════════════════════════

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.cinematic-section',
          start: 'top top',
          end: '+=300%', // 3x viewport height of scroll
          scrub: 1, // Smooth scrubbing
          pin: true,
          anticipatePin: 1,
        },
      });

      timelineRef.current = tl;

      // Starting state: All cards stacked at center, hidden
      gsap.set('.platform-card', {
        x: 0,
        y: '10vh', // Position where cards will appear
        rotation: 0,
        scale: 1,
        opacity: 0,
      });
      gsap.set('.text-phase-1', { opacity: 0, y: 20 });
      gsap.set('.unified-card', { opacity: 0, scale: 0.8 });
      gsap.set('.text-phase-2', { opacity: 0, scale: 0.9 });
      gsap.set('.text-phase-3', { opacity: 0, scale: 0.9 }); // Use scale for centered flex
      gsap.set('.text-phase-4', { opacity: 0, scale: 0.9 });
      gsap.set('.text-phase-5', { opacity: 0, y: -20 });

      // ═══════════════════════════════════════════════════════════════
      // TIMELINE DESIGN (total scroll: 300vh)
      // ═══════════════════════════════════════════════════════════════
      //
      // PHASE 1 (0-20%):  60vh  - "50,000+ on Polymarket alone"
      // PHASE 2 (20-40%): 60vh  - "Plus 36,500+ more across 6 platforms"
      // PHASE 3 (40-60%): 60vh  - "His reputation is scattered" (KEY)
      // PHASE 4 (60-77%): 51vh  - "What if you could prove..."
      // PHASE 5 (77-100%): 69vh - Cards merge + Unified solution
      //
      // Each phase: ENTER (fast) → HOLD (readable) → EXIT (quick)
      // ═══════════════════════════════════════════════════════════════

      // ─────────────────────────────────────────────────────────────
      // PHASE 1 (0% - 20%): "50,000+ on Polymarket alone"
      // Enter: 0-5%, Hold: 5-17%, Exit: 17-20%
      // ─────────────────────────────────────────────────────────────
      tl.to('.text-phase-1', {
        opacity: 1,
        y: 0,
        duration: 0.05,
        ease: 'power3.out',
      }, 0);

      tl.to('.platform-card-0', {
        opacity: 1,
        duration: 0.05,
        ease: 'power3.out',
      }, 0.01);

      // EXIT Phase 1
      tl.to('.text-phase-1', {
        opacity: 0,
        y: -20,
        duration: 0.03,
        ease: 'power2.in',
      }, 0.17);

      // ─────────────────────────────────────────────────────────────
      // PHASE 2 (20% - 40%): "Plus 36,500+ more across 6 platforms"
      // Cards scatter: 20-25%, Text enter: 25-28%, Hold: 28-37%, Exit: 37-40%
      // ─────────────────────────────────────────────────────────────

      // Cards emerge from behind Polymarket and scatter
      SCATTER_POSITIONS.forEach((pos, i) => {
        // Other cards fade in at stacked position
        if (i > 0) {
          tl.to(`.platform-card-${i}`, {
            opacity: 1,
            duration: 0.03,
          }, 0.20);
        }
        // All cards scatter outward
        tl.to(`.platform-card-${i}`, {
          x: `${pos.x}vw`,
          y: `${pos.y}vh`,
          rotation: pos.rotate,
          duration: 0.05,
          ease: 'power2.out',
        }, 0.20);
      });

      // Text enters after cards have scattered
      tl.to('.text-phase-2', {
        opacity: 1,
        scale: 1,
        duration: 0.03,
        ease: 'power3.out',
      }, 0.25);

      // EXIT Phase 2
      tl.to('.text-phase-2', {
        opacity: 0,
        scale: 0.95,
        duration: 0.03,
        ease: 'power2.in',
      }, 0.37);

      // ─────────────────────────────────────────────────────────────
      // PHASE 3 (40% - 60%): "His reputation is scattered" - KEY MESSAGE
      // Enter: 40-43%, Hold: 43-57%, Exit: 57-60%
      // ─────────────────────────────────────────────────────────────
      tl.to('.text-phase-3', {
        opacity: 1,
        scale: 1,
        duration: 0.03,
        ease: 'power3.out',
      }, 0.40);

      // Cards drift further apart (emphasizing fragmentation)
      SCATTER_POSITIONS.forEach((pos, i) => {
        tl.to(`.platform-card-${i}`, {
          x: `${pos.x * 1.15}vw`,
          y: `${pos.y * 1.1}vh`,
          rotation: pos.rotate * 1.3,
          duration: 0.08,
          ease: 'power2.out',
        }, 0.40);
      });

      // EXIT Phase 3
      tl.to('.text-phase-3', {
        opacity: 0,
        scale: 0.95,
        duration: 0.03,
        ease: 'power2.in',
      }, 0.57);

      // ─────────────────────────────────────────────────────────────
      // PHASE 4 (60% - 77%): "What if you could prove your total track record?"
      // Enter: 60-63%, Hold: 63-74%, Exit: 74-77%
      // ─────────────────────────────────────────────────────────────
      tl.to('.text-phase-4', {
        opacity: 1,
        scale: 1,
        duration: 0.03,
        ease: 'power3.out',
      }, 0.60);

      // EXIT Phase 4
      tl.to('.text-phase-4', {
        opacity: 0,
        scale: 0.95,
        duration: 0.03,
        ease: 'power2.in',
      }, 0.74);

      // ─────────────────────────────────────────────────────────────
      // PHASE 5 (77% - 100%): Cards merge + Unified solution
      // Cards merge: 77-85%, Cards fade: 85-87%, Solution enters: 87-92%
      // ─────────────────────────────────────────────────────────────

      // Cards converge to center and shrink
      tl.to('.platform-card', {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.3,
        opacity: 0.8,
        duration: 0.08,
        ease: 'power2.inOut',
      }, 0.77);

      // Cards continue shrinking and fade out completely
      // (scale below 0.93 is OK for EXIT animations - rule applies to entrances)
      tl.to('.platform-card', {
        scale: 0.1,
        opacity: 0,
        duration: 0.03,
        ease: 'power2.in',
      }, 0.85);

      // Intro text appears
      tl.to('.text-phase-5', {
        opacity: 1,
        y: 0,
        duration: 0.03,
        ease: 'power3.out',
      }, 0.87);

      // Unified card appears
      tl.to('.unified-card', {
        opacity: 1,
        scale: 1,
        duration: 0.05,
        ease: 'power2.out', // Changed from back.out - more professional per CLAUDE.md
        onStart: () => {
          // Trigger counter animations
          gsap.to({ val: 0 }, {
            val: 7,
            duration: 1,
            ease: 'power2.out',
            onUpdate: function() {
              setAnimatedPlatforms(Math.round(this.targets()[0].val));
            },
          });
          gsap.to({ val: 0 }, {
            val: 86500,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function() {
              setAnimatedTotalBets(Math.round(this.targets()[0].val));
            },
          });
          gsap.to({ val: 0 }, {
            val: featuredTrader.truthScore || 1170,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: function() {
              setAnimatedScore(Math.round(this.targets()[0].val));
            },
          });
        },
      }, 0.88);

      // ═══════════════════════════════════════════════════════════════
      // POST-CINEMATIC SECTIONS
      // ═══════════════════════════════════════════════════════════════

      gsap.fromTo('.how-it-works-step',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.how-it-works-section',
            start: 'top 65%',
            once: true,
          },
        }
      );

      gsap.fromTo('.platform-grid-item',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.platforms-section',
            start: 'top 70%',
            once: true,
          },
        }
      );

      gsap.fromTo('.cta-content',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 70%',
            once: true,
          },
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [featuredTrader]);

  return (
    <div ref={containerRef} className="bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          INTRO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="intro-section min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-dot-grid opacity-20" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="intro-content text-sm text-muted-foreground mb-4 tracking-wider uppercase">Case Study</p>

          <h1 className="intro-content text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Meet <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">{featuredTrader?.username || 'Theo4'}</span>
          </h1>

          <p className="intro-content text-xl sm:text-2xl text-muted-foreground mb-8">
            One of the top performers on Polymarket with a{' '}
            <span className="text-success font-semibold">94% win rate</span>
          </p>

          <div className="intro-content inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card/50 border border-border backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
              {featuredTrader?.username?.[0] || 'T'}
            </div>
            <div className="text-left">
              <p className="font-medium">{featuredTrader?.username || 'Theo4'}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {shortenAddress(featuredTrader?.address || '0x7a3f...5a6f')}
              </p>
            </div>
          </div>

          <p className="intro-content text-muted-foreground mt-12 animate-bounce">
            Scroll to discover the problem
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CINEMATIC SCROLL-DRIVEN SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={cinematicRef}
        className="cinematic-section relative h-screen w-full overflow-hidden bg-background"
      >
        {/* Subtle background */}
        <div className="absolute inset-0 bg-dot-grid opacity-10" />

        {/* Platform Cards - absolutely positioned for animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          {PLATFORMS.map((platform, index) => (
            <div
              key={platform.id}
              className={`platform-card platform-card-${index} absolute w-24 sm:w-28 md:w-32 opacity-0`}
              style={{ zIndex: 10 - index }}
            >
              <div className={`p-3 sm:p-4 rounded-xl border border-border bg-card shadow-lg shadow-black/20`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-md`}>
                  <platform.Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-center truncate">{platform.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">{platform.predictions}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Text Overlays - different phases */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Phase 1: Introduction - text positioned above the cards */}
          <div className="text-phase-1 absolute top-[15%] left-0 right-0 text-center px-5 opacity-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {featuredTrader?.username || 'Theo4'} made <span className="text-purple-500">50,000+</span> predictions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground/80">on Polymarket alone...</p>
          </div>

          {/* Phase 2: Scattered - centered in the viewport */}
          <div className="text-phase-2 absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-5 py-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Plus <span className="text-success">36,500+</span> more
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                across <span className="text-primary font-semibold">6 other platforms</span>
              </p>
            </div>
          </div>

          {/* Phase 3: The Problem - centered with scattered cards */}
          <div className="text-phase-3 absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-5 py-4 rounded-2xl bg-destructive/5 border border-destructive/20 backdrop-blur-sm max-w-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                His reputation is <span className="text-destructive">scattered</span>
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                Every platform is a fresh start.
              </p>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Your track record doesn't travel with you.
              </p>
            </div>
          </div>

          {/* Phase 4: The Question */}
          <div className="text-phase-4 absolute inset-0 flex items-center justify-center opacity-0">
            <div className="text-center px-5">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                What if you could prove your
              </h2>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                total track record?
              </h2>
            </div>
          </div>

          {/* Phase 5: Unified card intro text - positioned closer to card */}
          <div className="text-phase-5 absolute top-[18%] sm:top-[20%] left-0 right-0 text-center px-5 opacity-0">
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-2">Introducing</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-success to-cyan-400 bg-clip-text text-transparent">
              Your complete track record
            </h2>
          </div>
        </div>

        {/* Unified Card - appears at the end, positioned below the header */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-8">
          <div className="unified-card w-full max-w-sm sm:max-w-md mx-5 opacity-0">
            <div className="rounded-2xl border-2 border-success/50 bg-card p-5 sm:p-6 shadow-2xl shadow-success/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg">
                    {featuredTrader?.username?.[0] || 'T'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">{featuredTrader?.username || 'Theo4'}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(featuredTrader?.address || '0x7a3f...5a6f')}
                    </p>
                  </div>
                </div>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  Diamond
                </Badge>
              </div>

              {/* Aggregated Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                <div className="text-center p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Platforms</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{animatedPlatforms}</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Predictions</p>
                  <p className="text-xl sm:text-2xl font-bold text-success tabular-nums">
                    {animatedTotalBets >= 1000 ? `${(animatedTotalBets / 1000).toFixed(1)}K` : animatedTotalBets}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">TruthScore</p>
                  <p className="text-xl sm:text-2xl font-bold text-secondary tabular-nums">{animatedScore}</p>
                </div>
              </div>

              {/* Platform icons row - all 7 platforms */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-4 flex-wrap">
                {PLATFORMS.map((platform) => (
                  <div
                    key={`icon-${platform.id}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center shrink-0`}
                  >
                    <platform.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-success mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Unified from 7 platforms</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  One wallet. One score. Verified on-chain.
                </p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="how-it-works-section py-20 md:py-28 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Layers className="w-3 h-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Unify your reputation in <span className="text-primary">3 steps</span>
            </h2>
          </div>

          <div className="space-y-5">
            {[
              {
                step: 1,
                title: 'Connect your wallets',
                description: 'Link the wallets you use across prediction platforms',
                icon: Wallet,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                step: 2,
                title: 'We fetch your history',
                description: 'Directly from all 7 blockchains. No APIs. No intermediaries.',
                icon: Database,
                color: 'text-success',
                bg: 'bg-success/10',
              },
              {
                step: 3,
                title: 'Get your TruthScore',
                description: 'Verified on-chain. Portable forever. Yours to prove.',
                icon: Sparkles,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
              },
            ].map((item) => (
              <div key={item.step} className="how-it-works-step flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground ml-9">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SUPPORTED PLATFORMS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="platforms-section py-20 md:py-28 px-5 bg-surface/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="platform-grid-item text-3xl sm:text-4xl font-bold mb-4">
            Your reputation. <span className="text-primary">Unified.</span>
          </h2>
          <p className="platform-grid-item text-xl text-muted-foreground mb-12">
            Across the entire prediction market ecosystem
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="platform-grid-item p-5 rounded-xl border border-border bg-card shadow-sm text-center hover:border-primary/30 transition-colors"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                  <platform.Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{platform.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="cta-section min-h-[80vh] flex flex-col items-center justify-center px-5 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-dot-grid opacity-20" />

        <div className="cta-content relative z-10 max-w-xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Your predictions have value
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            <span className="text-primary font-semibold">Across every platform.</span>
          </p>
          <p className="text-lg text-muted-foreground mb-10">
            Stop starting from zero.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <Button
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="h-14 px-10 text-lg shadow-lg shadow-primary/20"
              >
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/leaderboard')}
              className="h-14 px-10 text-lg"
            >
              View Leaderboard
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              7 platforms
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              1 unified score
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              On-chain verified
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
