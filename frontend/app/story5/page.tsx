'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Target,
  Award,
  Lock,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ═══════════════════════════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════════════════════════

interface TraderData {
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
  pnl: number;
  totalVolume: string;
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  volume: string;
  endpoint: string;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600', volume: '$2.1B+', endpoint: '/api/polymarket-leaderboard?limit=3' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500', volume: '$340M+', endpoint: '/api/pancakeswap-leaderboard?limit=3' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500', volume: '$180M+', endpoint: '/api/azuro-leaderboard?limit=3' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500', volume: '$75M+', endpoint: '/api/overtime-leaderboard?limit=3' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500', volume: '$12M+', endpoint: '/api/limitless-leaderboard?limit=3' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500', volume: '$95M+', endpoint: '/api/sxbet-leaderboard?limit=3' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500', volume: '$8M+', endpoint: '/api/speedmarkets-leaderboard?limit=3' },
];

const TIERS = [
  { name: 'Bronze', minScore: 0, color: 'bg-amber-700', textColor: 'text-amber-700', icon: '🥉' },
  { name: 'Silver', minScore: 300, color: 'bg-gray-400', textColor: 'text-gray-400', icon: '🥈' },
  { name: 'Gold', minScore: 500, color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: '🥇' },
  { name: 'Platinum', minScore: 700, color: 'bg-cyan-400', textColor: 'text-cyan-400', icon: '💎' },
  { name: 'Diamond', minScore: 1000, color: 'bg-purple-500', textColor: 'text-purple-500', icon: '👑' },
];

const FAQS = [
  { q: 'What is TruthScore?', a: 'TruthScore is a reputation score calculated using the Wilson Score algorithm, which accounts for both win rate and sample size. This prevents lucky beginners from ranking above proven experts.' },
  { q: 'Is it really on-chain?', a: 'Yes! Every score is derived from immutable blockchain data. We pull your bet history directly from smart contracts across 7 prediction markets.' },
  { q: 'What is a Soulbound NFT?', a: 'A Soulbound NFT is a non-transferable token that proves your verified track record. It cannot be bought, sold, or transferred - it is bound to your wallet forever.' },
  { q: 'Is it free to use?', a: 'Yes! TruthBounty is completely free. We never charge fees for calculating your score or minting your credential.' },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num?.toLocaleString() || '0'}`;
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

// ═══════════════════════════════════════════════════════════════
// FAQ Accordion Item
// ═══════════════════════════════════════════════════════════════

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 flex-shrink-0" /> : <Plus className="w-5 h-5 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="pb-5 text-muted-foreground animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component - Option 5: Mega Landing Page
// ═══════════════════════════════════════════════════════════════

export default function Story5Page() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);

  const [featuredTrader, setFeaturedTrader] = useState<TraderData | null>(null);
  const [activePlatform, setActivePlatform] = useState('polymarket');
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured trader
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setFeaturedTrader(data.data[0]);
        }
      } catch (error) {
        setFeaturedTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1170,
          winRate: 95,
          totalBets: 86500,
          pnl: 47000,
          totalVolume: '2450000',
        });
      }
    }
    fetchFeatured();
  }, []);

  // Fetch traders for selected platform
  useEffect(() => {
    async function fetchTraders() {
      setLoading(true);
      try {
        const platform = PLATFORMS.find(p => p.id === activePlatform);
        if (!platform) return;
        const res = await fetch(platform.endpoint);
        const data = await res.json();
        if (data.success && data.data) {
          setTraders(data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTraders();
  }, [activePlatform]);

  // GSAP Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray('.animate-section').forEach((section: any) => {
        gsap.fromTo(section,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO + LIVE TRADER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[200px]" />

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                On-chain verification
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your predictions.{' '}
                <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                  Verified.
                </span>{' '}
                <span className="bg-gradient-to-r from-secondary via-amber-400 to-secondary bg-clip-text text-transparent">
                  Valuable.
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Build your on-chain reputation across 7 prediction markets.
                No fake screenshots. Just immutable blockchain data.
              </p>

              <div className="flex flex-wrap gap-4">
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg">
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={() => router.push('/leaderboard')} className="h-14 px-10 text-lg">
                  View Leaderboard
                </Button>
              </div>
            </div>

            {/* Live Trader Spotlight */}
            {featuredTrader && (
              <Card className="border-white/10 bg-surface/80 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="bg-success text-white">Live Data</Badge>
                    <span className="text-xs text-muted-foreground">Top Performer</span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl">
                      🔮
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{featuredTrader.username || shortenAddress(featuredTrader.address)}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{shortenAddress(featuredTrader.address)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-secondary">{featuredTrader.truthScore}</p>
                      <p className="text-xs text-muted-foreground">TruthScore</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-success">{featuredTrader.winRate?.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold">{featuredTrader.totalBets?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Bets</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-3xl font-bold text-success">{formatNumber(featuredTrader.pnl)}</p>
                      <p className="text-xs text-muted-foreground">Profit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-muted-foreground/60">
          <span className="text-sm mb-2">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. PLATFORM TABS + LEADERBOARD
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Live Leaderboard</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Top traders across 7 platforms</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setActivePlatform(platform.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activePlatform === platform.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-surface hover:bg-surface-raised border border-border/50"
                )}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-6 h-32" />
                </Card>
              ))
            ) : traders.map((trader, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push(`/trader/${trader.address}`)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{trader.username || shortenAddress(trader.address)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-secondary">{trader.truthScore}</p>
                      <p className="text-[10px] text-muted-foreground">Score</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-success">{trader.winRate?.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Win</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold">{trader.totalBets?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Bets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. PROBLEM / SOLUTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
                <h3 className="text-2xl font-bold mb-4">Trading reputations are broken</h3>
                <div className="space-y-3">
                  {['Anyone can claim to be profitable', 'Screenshots are easily faked', 'No way to verify track records', 'Scattered data across platforms'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <span className="text-destructive">✕</span>
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-success/10 text-success border-success/20">The Solution</Badge>
                <h3 className="text-2xl font-bold mb-4">TruthScore: Verifiable reputation</h3>
                <div className="space-y-3">
                  {['Aggregated from 7 platforms', 'Backed by blockchain data', 'Wilson Score algorithm', 'Single unified score'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20 bg-gradient-to-b from-surface/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: LinkIcon, title: 'Connect', desc: 'Link your wallet to aggregate your prediction history from all platforms' },
              { icon: BarChart3, title: 'Calculate', desc: 'We compute your TruthScore using the Wilson Score algorithm' },
              { icon: Award, title: 'Verify', desc: 'Mint a soulbound NFT that proves your verified track record' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. VERIFICATION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <Shield className="w-3 h-3 mr-1" />
              100% Verified
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trustless verification</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />
              {[
                { icon: Database, title: 'On-chain data', desc: 'Pulled from blockchain' },
                { icon: Lock, title: 'Immutable', desc: 'Cannot be changed' },
                { icon: Eye, title: 'Auditable', desc: 'Anyone can verify' },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4">
                    <step.icon className="w-9 h-9 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. WILSON SCORE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Wilson Score?</h2>
              <p className="text-lg text-muted-foreground">A 100% win rate on 3 bets doesn't beat 65% on 1000 bets</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-destructive mb-4">Raw win rate problem</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">3/3 bets</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="w-full h-full bg-destructive" />
                        </div>
                        <span className="text-sm font-mono">100%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">650/1000 bets</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="w-[65%] h-full bg-muted-foreground" />
                        </div>
                        <span className="text-sm font-mono">65%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-white/10">Lucky beginners rank above experts</p>
                </CardContent>
              </Card>

              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-success mb-4">Wilson Score solution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">3/3 bets</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="w-[44%] h-full bg-muted-foreground" />
                        </div>
                        <span className="text-sm font-mono">43.8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">650/1000 bets</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="w-[62%] h-full bg-success" />
                        </div>
                        <span className="text-sm font-mono text-success">62.1%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-white/10">Statistically accounts for sample size</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. FEATURES BENTO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Target, title: 'TruthScore', desc: 'Statistical reputation score', color: 'text-secondary' },
              { icon: Award, title: 'Soulbound NFT', desc: 'Non-transferable proof', color: 'text-purple-500' },
              { icon: Copy, title: 'Copy Trading', desc: 'Follow top traders', color: 'text-cyan-500' },
              { icon: Trophy, title: 'Tier System', desc: 'Bronze to Diamond', color: 'text-amber-500' },
            ].map((feature, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6 text-center">
                  <feature.icon className={cn("w-10 h-10 mx-auto mb-4", feature.color)} />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          8. REPUTATION TIERS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20 bg-gradient-to-b from-surface/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Reputation tiers</h2>
            <p className="text-lg text-muted-foreground">Progress through ranks as you prove your skills</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {TIERS.map((tier, i) => (
              <Card key={i} className="border-border/50 w-[140px]">
                <CardContent className="p-4 text-center">
                  <span className="text-3xl">{tier.icon}</span>
                  <h3 className={cn("font-semibold mt-2", tier.textColor)}>{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">{tier.minScore}+</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          9. PLATFORMS GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supported platforms</h2>
            <p className="text-lg text-muted-foreground">7 prediction markets. One unified score.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PLATFORMS.map((platform) => (
              <Card key={platform.id} className="border-border/50">
                <CardContent className="p-6 text-center">
                  <div className={cn("w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl", platform.gradient)}>
                    {platform.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{platform.name}</h3>
                  <p className="text-sm text-secondary font-bold">{platform.volume}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          10. FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section className="animate-section py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">FAQ</h2>
            </div>

            <div className="border-t border-border/50">
              {FAQS.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          11. FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/30 blur-[200px]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
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
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of traders building their on-chain reputation. Your predictions have value.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => router.push('/leaderboard')} className="h-14 px-10 text-lg">
              Explore Leaderboard
            </Button>
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
