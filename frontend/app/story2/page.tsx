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
  ChevronRight,
  Award,
  Target,
  Lock,
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
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600', volume: '$2.1B+', endpoint: '/api/polymarket-leaderboard?limit=5' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500', volume: '$340M+', endpoint: '/api/pancakeswap-leaderboard?limit=5' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500', volume: '$180M+', endpoint: '/api/azuro-leaderboard?limit=5' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500', volume: '$75M+', endpoint: '/api/overtime-leaderboard?limit=5' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500', volume: '$12M+', endpoint: '/api/limitless-leaderboard?limit=5' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500', volume: '$95M+', endpoint: '/api/sxbet-leaderboard?limit=5' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500', volume: '$8M+', endpoint: '/api/speedmarkets-leaderboard?limit=5' },
];

const STATS = [
  { label: 'Traders', value: '2,847', icon: Users },
  { label: 'Verified Bets', value: '156K', icon: CheckCircle2 },
  { label: 'Total Volume', value: '$4.2M', icon: TrendingUp },
  { label: 'Chains', value: '7', icon: LinkIcon },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num?.toLocaleString() || '0'}`;
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

// ═══════════════════════════════════════════════════════════════
// Main Component - Option 1: Proof-First Landing
// ═══════════════════════════════════════════════════════════════

export default function Story2Page() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);

  const [activePlatform, setActivePlatform] = useState('polymarket');
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [featuredTrader, setFeaturedTrader] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(true);

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
          setTraders(data.data.slice(0, 5));
          setFeaturedTrader(data.data[0]);
        }
      } catch (error) {
        console.error('Error fetching traders:', error);
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
      gsap.fromTo('.hero-content', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.hero-card', { opacity: 0, scale: 0.9, x: 50 }, { opacity: 1, scale: 1, x: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
      gsap.fromTo('.stat-item', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' });

      gsap.fromTo('.section-animate', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: '.section-animate', start: 'top 80%', toggleActions: 'play none none reverse' },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          HERO - Lead with real trader data
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[200px]" />

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="hero-content">
              <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                This trader made{' '}
                <span className="bg-gradient-to-r from-success via-emerald-400 to-success bg-clip-text text-transparent">
                  {formatNumber(featuredTrader?.pnl || 47000)}
                </span>{' '}
                last month.
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Real results from verified on-chain predictions. No fake screenshots. No inflated numbers.
                Just immutable blockchain data.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => router.push('/leaderboard')} className="h-14 px-8 text-lg">
                  See How <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')} className="h-14 px-8 text-lg">
                    Build Your Reputation
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Featured Trader Card */}
            <div className="hero-card relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-[2rem] blur-2xl" />
              <Card className="relative border-white/10 bg-surface/90 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="bg-cyan-500 text-white">Live Data</Badge>
                    <span className="text-xs text-muted-foreground">Updated just now</span>
                  </div>

                  {featuredTrader && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl">
                          🔮
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{featuredTrader.username || shortenAddress(featuredTrader.address)}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{shortenAddress(featuredTrader.address)}</p>
                        </div>
                        <Badge className="ml-auto bg-secondary text-black font-bold">Diamond</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-3xl font-bold text-secondary">{featuredTrader.truthScore}</p>
                          <p className="text-xs text-muted-foreground">TruthScore</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-3xl font-bold text-success">{featuredTrader.winRate?.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-3xl font-bold">{featuredTrader.totalBets?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Bets</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-3xl font-bold text-success">{formatNumber(featuredTrader.pnl)}</p>
                          <p className="text-xs text-muted-foreground">Profit</p>
                        </div>
                      </div>

                      <Button className="w-full" variant="outline" onClick={() => router.push(`/trader/${featuredTrader.address}`)}>
                        View Full Profile <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SOCIAL PROOF BAR
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-border/50 bg-surface/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PLATFORM TABS + LIVE LEADERBOARD
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-animate py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Live Leaderboard</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Top traders across 7 platforms</h2>
            <p className="text-lg text-muted-foreground">Real-time data from the biggest prediction markets</p>
          </div>

          {/* Platform Tabs */}
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

          {/* Traders Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-white/5 rounded-xl mb-4" />
                    <div className="h-8 bg-white/5 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : traders.map((trader, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group" onClick={() => router.push(`/trader/${trader.address}`)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{trader.username || shortenAddress(trader.address)}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{shortenAddress(trader.address)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => router.push('/leaderboard')}>
              View Full Leaderboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VERIFICATION TIMELINE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-animate py-20 bg-gradient-to-b from-surface/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <Shield className="w-3 h-3 mr-1" />
              100% Verified
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How we verify every score</h2>
            <p className="text-lg text-muted-foreground">Trustless verification through blockchain data</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Connector */}
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

              {[
                { icon: Database, title: 'On-chain data', desc: 'Pulled directly from blockchain smart contracts' },
                { icon: Lock, title: 'Immutable records', desc: 'Cannot be edited, deleted, or manipulated' },
                { icon: Eye, title: 'Publicly auditable', desc: 'Anyone can verify scores on-chain' },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4">
                    <step.icon className="w-9 h-9 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-[200px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION + WILSON SCORE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-animate py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Problem */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
                <h3 className="text-2xl font-bold mb-6">Why raw win rates are misleading</h3>
                <div className="space-y-4">
                  {[
                    '3 wins out of 3 bets = 100% win rate',
                    'But is that better than 650/1000?',
                    'Lucky beginners rank above proven experts',
                    'Small samples create false confidence',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <span className="text-destructive">✕</span>
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-success/10 text-success border-success/20">Wilson Score Solution</Badge>
                <h3 className="text-2xl font-bold mb-6">Statistical confidence matters</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">3/3 bets (100%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="w-[44%] h-full bg-muted-foreground" />
                      </div>
                      <span className="text-sm font-mono">43.8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">650/1000 bets (65%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="w-[62%] h-full bg-success" />
                      </div>
                      <span className="text-sm font-mono text-success">62.1%</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Wilson Score accounts for sample size, giving more weight to consistent performers with large track records.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES BENTO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-animate py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for serious traders</h2>
            <p className="text-lg text-muted-foreground">Everything you need to build and prove your reputation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: 'TruthScore Algorithm', desc: 'Wilson Score-based reputation that accounts for sample size', color: 'text-secondary' },
              { icon: Award, title: 'Soulbound NFT', desc: 'Non-transferable badge proving your verified track record', color: 'text-purple-500' },
              { icon: Copy, title: 'Copy Trading', desc: 'Follow top traders and replicate their winning strategies', color: 'text-cyan-500' },
              { icon: Trophy, title: 'Tier System', desc: 'Bronze to Diamond tiers based on performance and volume', color: 'text-amber-500' },
            ].map((feature, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/50 transition-all group">
                <CardContent className="p-6">
                  <feature.icon className={cn("w-10 h-10 mb-4", feature.color)} />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SUPPORTED PLATFORMS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-animate py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">7 platforms. One unified score.</h2>
            <p className="text-lg text-muted-foreground">We aggregate your history from the biggest prediction markets</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PLATFORMS.map((platform) => (
              <Card key={platform.id} className="border-border/50 hover:border-primary/50 transition-all">
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
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Join <span className="text-secondary">2,847</span> traders
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Start building your verifiable on-chain reputation today. Your predictions have value.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg shadow-lg shadow-primary/30">
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
