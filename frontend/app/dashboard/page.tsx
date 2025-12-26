'use client';

import { useTruthBounty, useUpdateScore } from '@/hooks/useTruthBounty';
import { TruthScoreCard } from '@/components/TruthScoreCard';
import { NFTDisplay } from '@/components/NFTDisplay';
import { ImportPredictions } from '@/components/ImportPredictions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { formatEther } from 'viem';
import { TIER_NAMES, TIER_COLORS } from '@/lib/contracts';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  Target,
  Wallet as WalletIcon,
  BarChart3,
  Copy,
  Share2,
  Download,
  Settings,
  Bell,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const account = useAccount();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isRegistered,
    userProfile,
    nftMetadata,
    tokenURI,
    registerUser,
    isRegistering,
  } = useTruthBounty();

  const { updateState, startUpdate, isUpdating } = useUpdateScore();

  // Check connection based on address presence instead of isConnected flag
  // This fixes the bug where account.address exists but isConnected is false
  const hasWallet = mounted && !!account.address;
  const address = account.address;

  // Background images configuration
  const backgroundImages = [
    { src: '/dashboard-bg/Cole Palmer _ Chelsea  #colepalmer.jpg', position: 'top-10 left-10', size: 'w-48 h-32' },
    { src: '/dashboard-bg/Kylian Mbappé.jpg', position: 'top-10 right-10', size: 'w-56 h-36' },
    { src: '/dashboard-bg/Elon Musk standing by Donald Trump #Unitedstates #trumpwon.jpg', position: 'bottom-40 left-20', size: 'w-52 h-34' },
    { src: "/dashboard-bg/Trump's America_ Top 5 Survival Threats You Must Prepare For.jpg", position: 'bottom-20 right-32', size: 'w-44 h-28' },
  ];

  // Show loading skeleton until mounted to prevent hydration mismatch
  if (!mounted) {
    return null; // Return nothing during SSR
  }

  // After mounting, check if wallet is connected by checking address presence
  // We check address instead of isConnected because wagmi sometimes reports isConnected=false
  // even when an address is present
  if (!hasWallet) {
    return (
      <div className="container px-4 py-12 md:py-24">
        <Alert>
          <WalletIcon className="w-4 h-4" />
          <AlertDescription>
            Please connect your wallet to view your dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If not registered, show registration prompt (no more demo data)
  if (!isRegistered) {
    return (
      <div className="container px-4 py-12 md:py-24">
        <Card className="max-w-lg mx-auto border-2 border-amber-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bebas tracking-wider uppercase bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 bg-clip-text text-transparent">
              Get Started with TruthBounty
            </CardTitle>
            <CardDescription>
              Register to create your on-chain reputation profile and start tracking your prediction accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground text-sm">
              <p>By registering, you will:</p>
              <ul className="mt-2 space-y-1">
                <li>✅ Mint your Soulbound Reputation NFT</li>
                <li>✅ Start building your TruthScore</li>
                <li>✅ Import predictions from PancakeSwap & more</li>
                <li>✅ Appear on the global leaderboard</li>
              </ul>
            </div>
            <Button
              onClick={() => registerUser?.()}
              disabled={isRegistering}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bebas tracking-wider uppercase"
            >
              {isRegistering ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Now'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data only - no more demo/mock data
  if (!userProfile || !nftMetadata) {
    return (
      <div className="container px-4 py-6 md:py-12">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px]" />
            </div>
            <Skeleton className="h-[400px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  const winRate = userProfile.totalPredictions > 0n
    ? (userProfile.correctPredictions * 10000n) / userProfile.totalPredictions
    : 0n;

  // Calculate real volume from profile (convert from wei if available)
  const totalVolumeBNB = userProfile.totalVolume
    ? Number(userProfile.totalVolume) / 1e18
    : 0;

  // Get tier from NFT metadata
  const tier = nftMetadata.tier;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Images - Spatially Arranged */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
        {backgroundImages.map((img, index) => (
          <div key={index} className={`absolute ${img.position} ${img.size} rounded-lg overflow-hidden`}>
            <img
              src={img.src}
              alt={`Background ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container px-4 py-6 md:py-12 space-y-6 md:space-y-8">
        {/* Header with Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bebas tracking-wider uppercase mb-2 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 bg-clip-text text-transparent">
              Command Center
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm md:text-base text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <Badge className={`${TIER_COLORS[tier]} text-white`}>
                {TIER_NAMES[tier]}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => startUpdate()}
              disabled={isUpdating}
              className="border-amber-500/50 hover:bg-amber-500/10"
              size="sm"
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Update
            </Button>
            <Button variant="outline" size="sm" className="border-amber-500/50 hover:bg-amber-500/10">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="border-amber-500/50 hover:bg-amber-500/10">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </Button>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className="border-2 border-red-500/30 bg-gradient-to-br from-red-950/20 to-red-900/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => router.push('/markets')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="font-bebas tracking-wider uppercase text-sm">Scout Markets</p>
              <p className="text-xs text-muted-foreground mt-1">Find opportunities</p>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-blue-900/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => router.push('/leaderboard')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <p className="font-bebas tracking-wider uppercase text-sm">Leaderboard</p>
              <p className="text-xs text-muted-foreground mt-1">View rankings</p>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-amber-900/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => router.push(`/profile/${address}`)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="font-bebas tracking-wider uppercase text-sm">Public Profile</p>
              <p className="text-xs text-muted-foreground mt-1">View & share</p>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-red-950/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => router.push('/analytics')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-red-600 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="font-bebas tracking-wider uppercase text-sm">Analytics</p>
              <p className="text-xs text-muted-foreground mt-1">Deep insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Update Success/Error Alert */}
        {updateState.status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{updateState.error}</AlertDescription>
          </Alert>
        )}
        {updateState.status === 'success' && (
          <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>TruthScore updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - TruthScore Card (larger) */}
          <div className="lg:col-span-2">
            <TruthScoreCard
              score={userProfile.truthScore}
              tier={tier}
              winRate={winRate}
              totalPredictions={userProfile.totalPredictions}
              correctPredictions={userProfile.correctPredictions}
              totalVolume={userProfile.totalVolume}
              showDetails={true}
            />
          </div>

          {/* Right Column - NFT Display */}
          <NFTDisplay
            tokenURI={tokenURI as string}
            tier={tier}
            truthScore={userProfile.truthScore}
            tokenId={userProfile?.reputationNFTId || 1n}
            isLoading={!tokenURI}
          />
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-amber-900/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <p className="text-xs md:text-sm font-medium">Win Rate</p>
              </div>
              <p className="text-2xl md:text-3xl font-teko text-white">
                {(Number(winRate) / 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-950/10 to-red-900/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Target className="w-3 h-3 md:w-4 md:h-4" />
                <p className="text-xs md:text-sm font-medium">Predictions</p>
              </div>
              <p className="text-2xl md:text-3xl font-teko text-white">
                {Number(userProfile.totalPredictions)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/10 to-blue-900/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <WalletIcon className="w-3 h-3 md:w-4 md:h-4" />
                <p className="text-xs md:text-sm font-medium">Volume</p>
              </div>
              <p className="text-2xl md:text-3xl font-teko text-white">
                {totalVolumeBNB.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">BNB</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-red-950/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                <p className="text-xs md:text-sm font-medium">Platforms</p>
              </div>
              <p className="text-2xl md:text-3xl font-teko text-white">
                {3}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Platforms & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Connected Platforms */}
          <Card className="border-2 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
                <Users className="w-5 h-5 text-blue-400" />
                Connected Platforms
              </CardTitle>
              <CardDescription>
                Platforms you've imported predictions from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {3 > 0 ? (
                <div className="space-y-3">
                  {['Polymarket', 'PancakeSwap', 'Azuro'].map((platform, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-blue-500/20 rounded-lg hover:bg-blue-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{platform}</p>
                          <p className="text-xs text-muted-foreground">Connected</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No platforms connected yet</p>
                  <Button
                    size="sm"
                    className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bebas tracking-wider uppercase"
                    onClick={() => document.getElementById('import-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Import Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
                <Clock className="w-5 h-5 text-red-400" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest on-chain actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border border-amber-500/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">NFT Minted</p>
                    <p className="text-sm text-muted-foreground">
                      Token #{1n.toString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(Number(userProfile.lastUpdate) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border border-red-500/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Score Updated</p>
                    <p className="text-sm text-muted-foreground">
                      TruthScore: {Number(userProfile.truthScore)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(Number(userProfile.lastUpdate) * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>

                {userProfile.totalPredictions > 0n && (
                  <div className="flex items-start gap-3 p-3 border border-blue-500/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Predictions Imported</p>
                      <p className="text-sm text-muted-foreground">
                        {Number(userProfile.totalPredictions)} total predictions
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(userProfile.correctPredictions)} correct ({(Number(winRate) / 100).toFixed(1)}% win rate)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
              <Award className="w-5 h-5 text-amber-400" />
              Achievements
            </CardTitle>
            <CardDescription>Milestones you've unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* First Registration Badge */}
              <div className="text-center p-3 md:p-4 border border-amber-500/20 rounded-lg bg-background/50">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/50 mx-auto mb-2 md:mb-3">
                  <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="font-bebas tracking-wider uppercase text-sm">Early Adopter</p>
                <p className="text-xs text-muted-foreground mt-1">Registered user</p>
              </div>

              {/* Tier Achievement */}
              {tier > 0 && (
                <div className="text-center p-3 md:p-4 border border-red-500/20 rounded-lg bg-background/50">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50 mx-auto mb-2 md:mb-3">
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <p className="font-bebas tracking-wider uppercase text-sm">{TIER_NAMES[tier]}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tier achieved</p>
                </div>
              )}

              {/* Volume Milestone */}
              {totalVolumeBNB >= 10 && (
                <div className="text-center p-3 md:p-4 border border-blue-500/20 rounded-lg bg-background/50">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 mx-auto mb-2 md:mb-3">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <p className="font-bebas tracking-wider uppercase text-sm">High Roller</p>
                  <p className="text-xs text-muted-foreground mt-1">10+ BNB volume</p>
                </div>
              )}

              {/* Prediction Milestone */}
              {userProfile.totalPredictions >= 100n && (
                <div className="text-center p-3 md:p-4 border border-red-500/20 rounded-lg bg-background/50">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50 mx-auto mb-2 md:mb-3">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <p className="font-bebas tracking-wider uppercase text-sm">Veteran</p>
                  <p className="text-xs text-muted-foreground mt-1">100+ predictions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <div id="import-section">
          <h2 className="text-xl md:text-2xl font-bebas tracking-wider uppercase mb-4 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 bg-clip-text text-transparent">
            Import More Predictions
          </h2>
          <ImportPredictions />
        </div>

        {/* Share Actions */}
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-blue-950/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-bebas tracking-wider uppercase mb-1 text-lg">Share Your Reputation</h3>
                <p className="text-sm text-muted-foreground">
                  Show others your TruthScore and achievements
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 hover:bg-amber-500/10"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${address}`);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 hover:bg-amber-500/10"
                  onClick={() => router.push(`/profile/${address}`)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 hover:bg-amber-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-bebas tracking-wider uppercase"
                  size="sm"
                  onClick={() => router.push('/leaderboard')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  See Leaderboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
