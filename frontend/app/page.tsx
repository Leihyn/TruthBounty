'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@/components/ConnectWallet';
import { UnclaimedReputationBanner } from '@/components/UnclaimedReputationBanner';
import {
  Target,
  Trophy,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { isRegistered, registerUser, isRegistering, userProfile } = useTruthBounty();

  const handleGetStarted = () => {
    if (!isConnected) return;
    if (isRegistered) {
      router.push('/dashboard');
    } else {
      registerUser();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <UnclaimedReputationBanner />

      {/* Hero Section - Linear-inspired */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-cyan-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="container relative px-4 py-20 md:py-32 lg:py-40">
          <div className="max-w-5xl mx-auto">
            {/* Top Badge */}
            <div className="flex justify-center mb-12">
              <div className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-black tracking-widest text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  PREDICTION MARKETS
                </div>
                <div className="text-2xl md:text-3xl font-black tracking-widest text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                  ON-CHAIN PROOF
                </div>
                <div className="text-2xl md:text-3xl font-black tracking-widest text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  YOUR RECORD
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center space-y-6 mb-12">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider">
                <span className="block text-white uppercase italic transform -skew-y-2 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]" style={{textShadow: '4px 4px 0px rgba(0,0,0,0.5), -1px -1px 0px rgba(255,255,255,0.1)'}}>
                  TRACK YOUR
                </span>
                <span className="block bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 bg-clip-text text-transparent uppercase italic transform -skew-y-2 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]" style={{textShadow: '4px 4px 0px rgba(0,0,0,0.5)'}}>
                  PREDICTIONS
                </span>
              </h1>

              <p className="text-2xl md:text-3xl text-amber-400 max-w-3xl mx-auto font-black uppercase italic transform -skew-y-1 tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]" style={{textShadow: '3px 3px 0px rgba(0,0,0,0.5)'}}>
                GET AN NFT. PROVE YOUR RECORD.
              </p>
            </div>

            {/* Wallet Status Card - Charlie Sexton Style */}
            {isConnected && address && (
              <div className="mb-10 flex justify-center">
                <Card className="bg-slate-900/50 border-2 border-amber-400/50 backdrop-blur-sm transform -skew-y-1">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div className="text-left">
                        <p className="text-xs text-amber-400 uppercase font-black italic tracking-wider">BNB Smart Chain Testnet</p>
                        <p className="text-sm font-black text-white uppercase italic">
                          Connected: {address.slice(0, 6)}...{address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                    <div className="text-left">
                      <p className="text-xs text-amber-400 uppercase font-black italic tracking-wider">Balance</p>
                      <p className="text-sm font-black text-cyan-400 uppercase italic">0.009 tBNB</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CTA Section */}
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 bg-clip-text text-transparent uppercase italic transform -skew-y-2 tracking-wider drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]" style={{textShadow: '4px 4px 0px rgba(0,0,0,0.5)'}}>
                  GET YOUR NFT
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={isRegistering}
                      className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-black text-lg px-8 py-6 rounded-xl shadow-2xl shadow-red-500/50 uppercase italic tracking-wider transform -skew-y-1 border-2 border-amber-400/50"
                    >
                      {isRegistering ? (
                        <>MINTING...</>
                      ) : isRegistered ? (
                        <>
                          <Trophy className="w-5 h-5 mr-2" />
                          DASHBOARD
                        </>
                      ) : (
                        <>
                          <Target className="w-5 h-5 mr-2" />
                          GET NFT (0.0005 BNB)
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/markets')}
                      className="border-2 border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-black text-lg px-8 py-6 rounded-xl uppercase italic tracking-wider transform -skew-y-1"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      VIEW MARKETS
                    </Button>
                  </>
                )}
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border-2 border-red-500/50 backdrop-blur-sm transform -skew-y-1">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300 font-black uppercase italic tracking-wide">SOULBOUND NFT</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border-2 border-amber-500/50 backdrop-blur-sm transform -skew-y-1">
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300 font-black uppercase italic tracking-wide">ON-CHAIN</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border-2 border-cyan-500/50 backdrop-blur-sm transform -skew-y-1">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300 font-black uppercase italic tracking-wide">REAL-TIME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                HOW IT WORKS
              </h2>
              <p className="text-xl text-slate-400">
                THREE STEPS
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'CONNECT',
                  description: 'CONNECT YOUR WALLET',
                  icon: Shield,
                  gradient: 'from-purple-500 to-purple-600',
                  bgGradient: 'from-purple-500/10 to-purple-600/5',
                  borderColor: 'border-purple-500/30',
                },
                {
                  step: '02',
                  title: 'IMPORT',
                  description: 'IMPORT YOUR PREDICTION HISTORY',
                  icon: TrendingUp,
                  gradient: 'from-blue-500 to-blue-600',
                  bgGradient: 'from-blue-500/10 to-blue-600/5',
                  borderColor: 'border-blue-500/30',
                },
                {
                  step: '03',
                  title: 'MINT',
                  description: 'GET YOUR NFT',
                  icon: Trophy,
                  gradient: 'from-cyan-500 to-cyan-600',
                  bgGradient: 'from-cyan-500/10 to-cyan-600/5',
                  borderColor: 'border-cyan-500/30',
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className={`relative border-2 ${item.borderColor} bg-gradient-to-br ${item.bgGradient} backdrop-blur-sm group hover:scale-105 transition-all duration-300`}
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-slate-500 mb-2">{item.step}</div>
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                NFT TIERS
              </h2>
              <p className="text-xl text-slate-400">
                YOUR SCORE DETERMINES YOUR TIER
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Bronze', min: 0, max: 249, gradient: 'from-orange-500 to-orange-600', emoji: '🥉' },
                { name: 'Silver', min: 250, max: 499, gradient: 'from-slate-400 to-slate-500', emoji: '🥈' },
                { name: 'Gold', min: 500, max: 749, gradient: 'from-yellow-400 to-yellow-500', emoji: '🥇' },
                { name: 'Diamond', min: 750, max: 999, gradient: 'from-cyan-400 to-cyan-500', emoji: '💎' },
              ].map((tier, index) => (
                <Card
                  key={index}
                  className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm group hover:scale-105 transition-all hover:border-slate-700"
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {tier.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className={`text-sm font-semibold mb-3 bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                      Score: {tier.min}–{tier.max}+
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                PLATFORMS
              </h2>
              <p className="text-xl text-slate-400">
                POLYMARKET & PANCAKESWAP
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: 'POLYMARKET',
                  description: "POLYGON PREDICTION MARKETS",
                  volume: '$2.1B+',
                  gradient: 'from-purple-500 to-blue-500',
                  bgGradient: 'from-purple-500/10 to-blue-500/5',
                  borderColor: 'border-purple-500/30',
                },
                {
                  name: 'PANCAKESWAP',
                  description: 'BNB PRICE PREDICTIONS',
                  volume: '$340M+',
                  gradient: 'from-blue-500 to-cyan-500',
                  bgGradient: 'from-blue-500/10 to-cyan-500/5',
                  borderColor: 'border-blue-500/30',
                },
              ].map((platform, index) => (
                <Card
                  key={index}
                  className={`border-2 ${platform.borderColor} bg-gradient-to-br ${platform.bgGradient} backdrop-blur-sm hover:scale-105 transition-all group`}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center shadow-lg`}>
                        <LinkIcon className="w-7 h-7 text-white" />
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{platform.name}</h3>
                    <p className="text-slate-400 mb-6">{platform.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-sm text-slate-500">Total Volume</span>
                      <span className={`text-xl font-bold bg-gradient-to-r ${platform.gradient} bg-clip-text text-transparent`}>
                        {platform.volume}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-cyan-900/20 border-t border-slate-800">
        <div className="container px-4">
          <Card className="max-w-4xl mx-auto border-2 border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                GET STARTED
              </h2>
              <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                CONNECT. IMPORT. MINT.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={isRegistering}
                      className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-black text-xl px-10 py-7 rounded-xl shadow-2xl uppercase italic tracking-wider transform -skew-y-1 border-2 border-amber-400/50"
                    >
                      {isRegistering ? (
                        <>MINTING...</>
                      ) : isRegistered ? (
                        <>
                          <Trophy className="w-5 h-5 mr-2" />
                          DASHBOARD
                        </>
                      ) : (
                        <>
                          <Target className="w-5 h-5 mr-2" />
                          GET NFT (0.0005 BNB)
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push('/leaderboard')}
                      className="border-2 border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-black text-xl px-10 py-7 rounded-xl uppercase italic tracking-wider transform -skew-y-1"
                    >
                      LEADERBOARD
                    </Button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-slate-800">
                {[
                  { label: 'FREE', icon: CheckCircle },
                  { label: 'SOULBOUND', icon: Shield },
                  { label: 'ON-CHAIN', icon: Zap },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-400">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
