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
  Wallet,
  Download,
  Award,
  TrendingUp,
  Users,
  Target,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Send,
  Bell,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isRegistered, registerUser, isRegistering } = useTruthBounty();

  const handleGetStarted = () => {
    if (!isConnected) {
      return;
    }
    if (isRegistered) {
      router.push('/dashboard');
    } else {
      registerUser();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Unclaimed Reputation Banner */}
      <UnclaimedReputationBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-950/20 via-blue-950/10 to-background">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="container relative px-4 py-12 md:py-24 lg:py-32 space-y-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge
              variant="outline"
              className="border-purple-500/50 bg-purple-500/10 text-purple-300 mb-4 animate-pulse text-xs md:text-sm"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Universal Reputation for Prediction Markets</span>
              <span className="sm:hidden">Prediction Market Reputation</span>
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight px-4">
              Universal Reputation for{' '}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Prediction Markets
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Track predictions from Polymarket & PancakeSwap, calculate your TruthScore, and mint a soulbound NFT
              that proves your expertise across all platforms.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/markets')}
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse Markets
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/leaderboard')}
                className="border-blue-500/50 hover:bg-blue-500/10"
              >
                <Users className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://t.me/your_bot_username', '_blank')}
                className="border-cyan-500/50 hover:bg-cyan-500/10"
              >
                <Send className="w-4 h-4 mr-2" />
                Telegram Bot
              </Button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {!isConnected ? (
                <div className="flex flex-col items-center gap-4">
                  <ConnectWallet />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to get started
                  </p>
                </div>
              ) : (
                <>
                  {isRegistered ? (
                    <Button
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-base md:text-lg px-6 md:px-8 min-h-[44px] w-full sm:w-auto"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-4 w-full px-4">
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/50 text-xs md:text-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Wallet Connected - Ready to claim your reputation!</span>
                        <span className="sm:hidden">Ready to start!</span>
                      </Badge>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        disabled={isRegistering}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-base md:text-lg px-6 md:px-8 min-h-[44px] w-full sm:w-auto"
                      >
                        {isRegistering ? 'Registering...' : 'Claim Your Reputation'}
                        <Award className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/leaderboard')}
                    className="text-base md:text-lg px-6 md:px-8 min-h-[44px] w-full sm:w-auto"
                  >
                    View Leaderboard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Platform Features Showcase */}
      <section className="container px-4 py-12 md:py-24">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Multi-Platform Support</h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            One reputation system across all major prediction markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Polymarket Card */}
          <Card
            className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-blue-950/30 hover:border-purple-500 transition-all duration-300 cursor-pointer group"
            onClick={() => router.push('/markets')}
          >
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Polymarket Integration</h3>
                <p className="text-muted-foreground mb-4">
                  Browse real-time prediction markets, track probabilities, and import your trading history
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time market data from Gamma API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search and filter trending markets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Import predictions to boost TruthScore</span>
                  </li>
                </ul>
              </div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700"
                onClick={(e) => { e.stopPropagation(); router.push('/markets'); }}
              >
                Browse Markets
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Telegram Bot Card */}
          <Card
            className="border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-blue-950/30 hover:border-cyan-500 transition-all duration-300 cursor-pointer group"
            onClick={() => window.open('https://t.me/your_bot_username', '_blank')}
          >
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Send className="w-6 h-6 text-cyan-400" />
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Telegram Bot</h3>
                <p className="text-muted-foreground mb-4">
                  Get real-time alerts, monitor markets, and check TruthScores directly from Telegram
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <span>Price change & volume alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <span>PancakeSwap round monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <span>TruthScore lookup on the go</span>
                  </li>
                </ul>
              </div>
              <Button
                className="w-full bg-cyan-600 hover:bg-cyan-700 group-hover:bg-cyan-700"
                onClick={(e) => { e.stopPropagation(); window.open('https://t.me/your_bot_username', '_blank'); }}
              >
                Open Telegram Bot
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container px-4 py-12 md:py-24 lg:py-32">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">How It Works</h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Three simple steps to build your on-chain reputation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <Card className="relative border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base md:text-lg px-3 md:px-4 py-1">
                  Step 1
                </Badge>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mt-4">
                <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">Connect Wallet</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Connect your wallet using MetaMask, WalletConnect, or any supported provider
              </p>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="relative border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base md:text-lg px-3 md:px-4 py-1">
                  Step 2
                </Badge>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mt-4">
                <Download className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">Import Predictions</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Import your prediction history from Polymarket, PancakeSwap and other platforms
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="relative border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base md:text-lg px-3 md:px-4 py-1">
                  Step 3
                </Badge>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mt-4">
                <Award className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">Mint Reputation NFT</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Receive a soulbound NFT that represents your TruthScore and reputation tier
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-purple-950/10 to-background py-12 md:py-24 lg:py-32">
        <div className="container px-4">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Platform Statistics</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4">
              Join the growing community of verified predictors
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <Card className="border-2 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  1,234
                </div>
                <p className="text-muted-foreground font-semibold">NFTs Minted</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  847
                </div>
                <p className="text-muted-foreground font-semibold">Average TruthScore</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  89
                </div>
                <p className="text-muted-foreground font-semibold">Diamond Tier Holders</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reputation Tiers Section */}
      <section className="container px-4 py-12 md:py-24 lg:py-32">
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Reputation Tiers</h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Progress through five tiers as your TruthScore increases
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
          <Card className="border-2 border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 mx-auto shadow-lg shadow-orange-500/50" />
              <div>
                <p className="font-bold text-xl">Bronze</p>
                <p className="text-sm text-muted-foreground mt-1">0 - 499</p>
              </div>
              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Starting tier</p>
                <p>• Build foundation</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-400/30 hover:border-gray-400 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-300 mx-auto shadow-lg shadow-gray-400/50" />
              <div>
                <p className="font-bold text-xl">Silver</p>
                <p className="text-sm text-muted-foreground mt-1">500 - 999</p>
              </div>
              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Proven track</p>
                <p>• Growing skill</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-300 mx-auto shadow-lg shadow-yellow-500/50" />
              <div>
                <p className="font-bold text-xl">Gold</p>
                <p className="text-sm text-muted-foreground mt-1">1,000 - 1,999</p>
              </div>
              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Expert level</p>
                <p>• High accuracy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-400/30 hover:border-cyan-400 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-300 mx-auto shadow-lg shadow-cyan-400/50" />
              <div>
                <p className="font-bold text-xl">Platinum</p>
                <p className="text-sm text-muted-foreground mt-1">2,000 - 4,999</p>
              </div>
              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Elite predictor</p>
                <p>• Top performer</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto shadow-lg shadow-blue-500/50" />
              <div>
                <p className="font-bold text-xl">Diamond</p>
                <p className="text-sm text-muted-foreground mt-1">5,000+</p>
              </div>
              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>• Master tier</p>
                <p>• Legendary</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gradient-to-b from-background to-purple-950/10 py-12 md:py-24 lg:py-32">
        <div className="container px-4">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Why TruthBounty?</h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              The future of reputation in prediction markets
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Soulbound NFTs</h3>
                <p className="text-muted-foreground">
                  Non-transferable tokens that truly represent YOUR achievements
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Transparent Scoring</h3>
                <p className="text-muted-foreground">
                  Fair, on-chain algorithm based on win rate and trading volume
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold">Easy Import</h3>
                <p className="text-muted-foreground">
                  Seamlessly import your history from multiple platforms
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Dynamic Metadata</h3>
                <p className="text-muted-foreground">
                  NFT updates automatically as your reputation grows
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Verified History</h3>
                <p className="text-muted-foreground">
                  Cryptographic proofs ensure authenticity of your predictions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold">Global Leaderboard</h3>
                <p className="text-muted-foreground">
                  Compete with the best predictors worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container px-4 py-12 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/30 to-blue-950/30 overflow-hidden">
            <CardContent className="p-8 md:p-12 lg:p-16 text-center space-y-6 md:space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Start Building Your Reputation
                </h2>
                <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Join thousands of predictors proving their expertise on-chain
                </p>
              </div>

              {!isConnected ? (
                <div className="flex flex-col items-center gap-4">
                  <ConnectWallet />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to get started
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    disabled={isRegistering}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-base md:text-lg px-6 md:px-8 min-h-[44px] w-full sm:w-auto"
                  >
                    {isRegistered ? 'Go to Dashboard' : isRegistering ? 'Registering...' : 'Get Started Now'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/leaderboard')}
                    className="text-base md:text-lg px-6 md:px-8 min-h-[44px] w-full sm:w-auto"
                  >
                    View Leaderboard
                  </Button>
                </div>
              )}

              {isConnected && !isRegistered && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Wallet Connected - Ready to claim your reputation!
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
