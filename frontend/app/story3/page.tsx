'use client'


import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
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
  Wallet,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PLATFORMS = [
  { id: 'polymarket', name: 'Polymarket', icon: '🔮', gradient: 'from-purple-500 to-indigo-600', volume: '$2.1B+' },
  { id: 'pancakeswap', name: 'PancakeSwap', icon: '🥞', gradient: 'from-amber-500 to-orange-500', volume: '$340M+' },
  { id: 'azuro', name: 'Azuro', icon: '🎯', gradient: 'from-cyan-500 to-teal-500', volume: '$180M+' },
  { id: 'overtime', name: 'Overtime', icon: '⏱️', gradient: 'from-red-500 to-pink-500', volume: '$75M+' },
  { id: 'limitless', name: 'Limitless', icon: '♾️', gradient: 'from-blue-500 to-cyan-500', volume: '$12M+' },
  { id: 'sxbet', name: 'SX Bet', icon: '🎰', gradient: 'from-green-500 to-emerald-500', volume: '$95M+' },
  { id: 'speedmarkets', name: 'Speed Markets', icon: '⚡', gradient: 'from-yellow-500 to-amber-500', volume: '$8M+' },
];

// ═══════════════════════════════════════════════════════════════
// Main Component - Option 3: Split-Screen Experience
// ═══════════════════════════════════════════════════════════════

export default function Story3Page() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPath, setSelectedPath] = useState<'trader' | 'investor' | null>(null);
  const [hoveredPath, setHoveredPath] = useState<'trader' | 'investor' | null>(null);

  // GSAP Animations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // Initial animation
      gsap.fromTo('.split-left', { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.split-right', { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.split-divider', { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.8, delay: 0.5, ease: 'power2.out' });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Path-specific content
  const renderPathContent = () => {
    if (!selectedPath) return null;

    if (selectedPath === 'trader') {
      return (
        <div className="animate-fadeIn">
          {/* Trader Journey */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">For Traders</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Build your verifiable reputation</h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
                Your predictions create value. TruthBounty turns your track record into an immutable, on-chain credential.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Target, title: 'Aggregate your history', desc: 'We pull your bets from 7 prediction markets automatically', step: '1' },
                  { icon: BarChart3, title: 'Calculate your TruthScore', desc: 'Wilson Score algorithm accounts for sample size and consistency', step: '2' },
                  { icon: Award, title: 'Mint your credential', desc: 'Soulbound NFT proves your verified track record forever', step: '3' },
                ].map((item, i) => (
                  <Card key={i} className="border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                      {item.step}
                    </div>
                    <CardContent className="p-6 pt-16">
                      <item.icon className="w-10 h-10 text-primary mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg">
                    Start Building <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="animate-fadeIn">
        {/* Investor Journey */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">For Investors</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Find proven traders to follow</h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
              Stop guessing who to trust. Our leaderboard shows verified, on-chain track records you can actually believe.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Eye, title: 'Browse the leaderboard', desc: 'See real-time stats from top performers across all platforms', step: '1' },
                { icon: CheckCircle2, title: 'Verify their record', desc: 'Every stat is backed by immutable blockchain data', step: '2' },
                { icon: Copy, title: 'Copy their trades', desc: 'Automatically follow their positions with our copy trading', step: '3' },
              ].map((item, i) => (
                <Card key={i} className="border-secondary/20 bg-secondary/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-12 h-12 bg-secondary/20 flex items-center justify-center text-xl font-bold text-secondary">
                    {item.step}
                  </div>
                  <CardContent className="p-6 pt-16">
                    <item.icon className="w-10 h-10 text-secondary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg" onClick={() => router.push('/leaderboard')} className="h-14 px-10 text-lg bg-secondary hover:bg-secondary/90 text-black">
                View Leaderboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          SPLIT HERO - Two Paths
          ═══════════════════════════════════════════════════════════════ */}
      {!selectedPath && (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[200px]" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[200px]" />

          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Choose your path
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                What brings you here?
              </h1>
              <p className="text-xl text-muted-foreground">
                Select your journey to see relevant content
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative">
              {/* Divider */}
              <div className="split-divider hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-border to-transparent items-center justify-center">
                <span className="bg-background px-4 py-2 text-sm text-muted-foreground font-medium">OR</span>
              </div>

              {/* Left: Trader */}
              <div
                className={cn(
                  "split-left group cursor-pointer transition-all duration-500",
                  hoveredPath === 'investor' && "opacity-50 scale-95"
                )}
                onMouseEnter={() => setHoveredPath('trader')}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={() => setSelectedPath('trader')}
              >
                <Card className={cn(
                  "border-2 transition-all duration-300 h-full",
                  hoveredPath === 'trader' ? "border-primary bg-primary/5 shadow-2xl shadow-primary/20" : "border-border/50"
                )}>
                  <CardContent className="p-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                      <Wallet className="w-12 h-12 text-white" />
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">I'm a</p>
                    <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                      TRADER
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Build your verifiable<br />on-chain reputation
                    </p>

                    <div className="space-y-3 text-left mb-8">
                      {['Aggregate bets from 7 platforms', 'Get a TruthScore', 'Mint soulbound NFT credential'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>

                    <Button className="w-full h-12 text-lg group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                      Get Started <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Investor */}
              <div
                className={cn(
                  "split-right group cursor-pointer transition-all duration-500",
                  hoveredPath === 'trader' && "opacity-50 scale-95"
                )}
                onMouseEnter={() => setHoveredPath('investor')}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={() => setSelectedPath('investor')}
              >
                <Card className={cn(
                  "border-2 transition-all duration-300 h-full",
                  hoveredPath === 'investor' ? "border-secondary bg-secondary/5 shadow-2xl shadow-secondary/20" : "border-border/50"
                )}>
                  <CardContent className="p-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-secondary to-amber-600 flex items-center justify-center shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
                      <LineChart className="w-12 h-12 text-white" />
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">I'm an</p>
                    <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-secondary to-amber-400 bg-clip-text text-transparent">
                      INVESTOR
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Find proven traders<br />to copy trade
                    </p>

                    <div className="space-y-3 text-left mb-8">
                      {['Browse verified leaderboards', 'See real on-chain stats', 'Copy winning strategies'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>

                    <Button className="w-full h-12 text-lg bg-secondary hover:bg-secondary/90 text-black group-hover:shadow-lg group-hover:shadow-secondary/30 transition-shadow">
                      See Leaderboard <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PATH-SPECIFIC CONTENT
          ═══════════════════════════════════════════════════════════════ */}
      {selectedPath && (
        <>
          {/* Back button */}
          <div className="container mx-auto px-4 pt-8">
            <Button variant="ghost" onClick={() => setSelectedPath(null)} className="text-muted-foreground">
              ← Choose different path
            </Button>
          </div>

          {renderPathContent()}

          {/* ═══════════════════════════════════════════════════════════════
              SHARED CONTENT - Both paths converge here
              ═══════════════════════════════════════════════════════════════ */}
          <section className="py-20 bg-gradient-to-b from-surface/30 to-background border-t border-border/50">
            <div className="container mx-auto px-4 text-center">
              <Badge className="mb-4 bg-white/10 text-foreground border-white/20">How It Works</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trustless verification through blockchain</h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                No matter which path you chose, everything is built on immutable on-chain data.
              </p>

              <div className="max-w-4xl mx-auto mb-16">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

                  {[
                    { icon: Database, title: 'On-chain data', desc: 'Pulled from blockchain' },
                    { icon: Lock, title: 'Immutable records', desc: 'Cannot be changed' },
                    { icon: Eye, title: 'Publicly auditable', desc: 'Anyone can verify' },
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

          {/* Supported Platforms */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supported platforms</h2>
                <p className="text-lg text-muted-foreground">We aggregate data from 7 prediction markets</p>
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

          {/* Final CTA */}
          <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
            <div className="container relative z-10 mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl text-muted-foreground mb-10">
                {selectedPath === 'trader'
                  ? "Start building your on-chain reputation today."
                  : "Find verified traders to follow and copy."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {selectedPath === 'trader' ? (
                  !isConnected ? (
                    <ConnectWallet />
                  ) : (
                    <Button size="lg" onClick={() => router.push('/dashboard')} className="h-14 px-10 text-lg">
                      Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )
                ) : (
                  <Button size="lg" onClick={() => router.push('/leaderboard')} className="h-14 px-10 text-lg bg-secondary hover:bg-secondary/90 text-black">
                    View Leaderboard <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
