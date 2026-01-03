'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const PLATFORMS = [
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600', volume: '$2.1B+' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500', volume: '$340M+' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500', volume: '$180M+' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500', volume: '$75M+' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500', volume: '$12M+' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500', volume: '$95M+' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500', volume: '$8M+' },
];

const TIERS = [
  { name: 'Bronze', minScore: 0, color: 'bg-amber-700', icon: '🥉' },
  { name: 'Silver', minScore: 300, color: 'bg-gray-400', icon: '🥈' },
  { name: 'Gold', minScore: 500, color: 'bg-yellow-500', icon: '🥇' },
  { name: 'Platinum', minScore: 700, color: 'bg-cyan-400', icon: '💎' },
  { name: 'Diamond', minScore: 1000, color: 'bg-purple-500', icon: '👑' },
];

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

// ═══════════════════════════════════════════════════════════════
// Floating Widget Component
// ═══════════════════════════════════════════════════════════════

function FloatingWidget({ onExpand }: { onExpand: () => void }) {
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrader() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setTrader(data.data[0]);
        }
      } catch (error) {
        setTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1170,
          winRate: 95,
          totalBets: 86500,
          pnl: 47000,
        });
      }
    }
    fetchTrader();
  }, []);

  useEffect(() => {
    if (widgetRef.current) {
      gsap.fromTo(widgetRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 1.5, ease: 'power3.out' }
      );
    }
  }, []);

  if (!trader) return null;

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isMinimized ? "w-auto" : "w-80"
      )}
    >
      {isMinimized ? (
        // Minimized state
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-3 bg-surface border border-primary/50 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm">
            🔮
          </div>
          <span className="font-semibold">{trader.username || 'Top Trader'}</span>
          <Badge className="bg-success text-white text-xs">{trader.winRate?.toFixed(0)}%</Badge>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
      ) : (
        // Expanded widget
        <Card className="border-primary/30 bg-surface/95 backdrop-blur-xl shadow-2xl shadow-primary/20">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Live Top Trader</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Trader Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl">
                  🔮
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{trader.username || shortenAddress(trader.address)}</p>
                  <p className="text-xs text-muted-foreground">Just hit {trader.winRate?.toFixed(0)}% win rate</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 p-2 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-secondary">{trader.truthScore}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="flex-1 p-2 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold text-success">{trader.winRate?.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Win</p>
                </div>
                <div className="flex-1 p-2 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-bold">{(trader.totalBets / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-muted-foreground">Bets</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={onExpand}
                className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
              >
                View All Top Traders <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Expanded Modal (Case Study Content)
// ═══════════════════════════════════════════════════════════════

function ExpandedModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [traders, setTraders] = useState<TraderData[]>([]);
  const [activePlatform, setActivePlatform] = useState('polymarket');
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    async function fetchTraders() {
      try {
        const platform = PLATFORMS.find(p => p.id === activePlatform);
        const res = await fetch(platform?.id === 'polymarket' ? '/api/polymarket-leaderboard?limit=6' : `/api/${activePlatform}-leaderboard?limit=6`);
        const data = await res.json();
        if (data.success && data.data) {
          setTraders(data.data);
        }
      } catch (error) {
        console.error('Error fetching traders:', error);
      }
    }
    fetchTraders();
  }, [isOpen, activePlatform]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-background border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-background/95 backdrop-blur border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Top Traders</h2>
            <p className="text-sm text-muted-foreground">Live verified leaderboard across all platforms</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="p-6 pb-0">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setActivePlatform(platform.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activePlatform === platform.id
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface-raised border border-border/50"
                )}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Traders Grid */}
        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {traders.map((trader, i) => (
            <Card key={i} className="border-border/50 hover:border-primary/50 transition-all cursor-pointer" onClick={() => router.push(`/trader/${trader.address}`)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{trader.username || shortenAddress(trader.address)}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{shortenAddress(trader.address)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-sm font-bold text-secondary">{trader.truthScore}</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-sm font-bold text-success">{trader.winRate?.toFixed(1)}%</p>
                    <p className="text-[10px] text-muted-foreground">Win</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-sm font-bold">{trader.totalBets?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Bets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verification Info */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-center gap-8">
            {[
              { icon: Database, label: 'On-chain data' },
              { icon: Lock, label: 'Immutable' },
              { icon: Eye, label: 'Auditable' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 bg-surface/50 text-center">
          <Button size="lg" onClick={() => { onClose(); router.push('/leaderboard'); }}>
            View Full Leaderboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component - Option 4: Floating Proof Widget
// ═══════════════════════════════════════════════════════════════

export default function Story4Page() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          HERO (Current Home Style)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Shield className="w-3 h-3 mr-1" />
            On-chain verification
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
            Your predictions.{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              Verified.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Build your on-chain reputation across 7 prediction markets.
            No fake screenshots. Just immutable blockchain data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
                <h3 className="text-2xl font-bold mb-4">Trading reputations are broken</h3>
                <div className="space-y-3">
                  {['Anyone can claim to be profitable', 'Screenshots are easily faked', 'No way to verify track records'].map((item, i) => (
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
                  {['Aggregated from 7 platforms', 'Backed by blockchain data', 'Wilson Score algorithm'].map((item, i) => (
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
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to verifiable reputation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: LinkIcon, title: 'Connect', desc: 'Link your wallet to aggregate your prediction history' },
              { icon: BarChart3, title: 'Calculate', desc: 'We compute your TruthScore using Wilson Score algorithm' },
              { icon: Award, title: 'Verify', desc: 'Mint a soulbound NFT proving your track record' },
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
          FEATURES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-surface/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Target, title: 'TruthScore', desc: 'Statistical reputation' },
              { icon: Award, title: 'Soulbound NFT', desc: 'Non-transferable proof' },
              { icon: Copy, title: 'Copy Trading', desc: 'Follow top traders' },
              { icon: Trophy, title: 'Tier System', desc: 'Bronze to Diamond' },
            ].map((feature, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REPUTATION TIERS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Reputation tiers</h2>
            <p className="text-lg text-muted-foreground">Progress through ranks as you prove your skills</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {TIERS.map((tier, i) => (
              <Card key={i} className="border-border/50 w-[160px]">
                <CardContent className="p-4 text-center">
                  <span className="text-3xl">{tier.icon}</span>
                  <h3 className="font-semibold mt-2">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">{tier.minScore}+ score</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PLATFORMS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supported platforms</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PLATFORMS.map((platform) => (
              <Card key={platform.id} className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className={cn("w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", platform.gradient)}>
                    {platform.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{platform.name}</h3>
                  <p className="text-xs text-secondary font-bold">{platform.volume}</p>
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
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to prove your skills?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join traders building their on-chain reputation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectWallet />
            ) : (
              <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FLOATING WIDGET (The key feature of this option!)
          ═══════════════════════════════════════════════════════════════ */}
      <FloatingWidget onExpand={() => setIsModalOpen(true)} />

      {/* Expanded Modal */}
      <ExpandedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
