'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { TIER_NAMES, TIER_COLORS, TIER_THRESHOLDS, ReputationTier } from '@/lib/contracts';
import {
  Award,
  TrendingUp,
  Target,
  Zap,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Activity,
  Users,
  BarChart3,
  Clock,
  Share2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const [profileAddress, setProfileAddress] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting and params loading
  useEffect(() => {
    setMounted(true);
    if (params?.address) {
      setProfileAddress(params.address as string);
    }
  }, [params]);

  // Show loading state until mounted and address is loaded
  if (!mounted || !profileAddress) {
    return (
      <div className="container px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Component content - only renders after address is confirmed
  return <ProfileContent address={profileAddress} copied={copied} setCopied={setCopied} />;
}

// Separate component for the actual profile content
function ProfileContent({ address, copied, setCopied }: { address: string; copied: boolean; setCopied: (v: boolean) => void }) {
  // For now, use demo data - in production you'd fetch user's on-chain data
  const demoProfile = {
    truthScore: 750n,
    totalPredictions: 45n,
    correctPredictions: 32n,
    streak: 5n,
    tier: 2, // Silver tier
    lastUpdate: BigInt(Math.floor(Date.now() / 1000)),
  };

  const winRate = demoProfile.totalPredictions > 0n
    ? (demoProfile.correctPredictions * 10000n) / demoProfile.totalPredictions
    : 0n;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TruthBounty Profile',
        text: `Check out this TruthBounty profile!`,
        url: window.location.href,
      });
    }
  };

  // Calculate next tier progress
  const currentTierThreshold = TIER_THRESHOLDS[demoProfile.tier];
  const nextTier = demoProfile.tier < ReputationTier.DIAMOND ? (demoProfile.tier + 1) as ReputationTier : demoProfile.tier;
  const nextTierThreshold = TIER_THRESHOLDS[nextTier];
  const progressToNextTier = demoProfile.tier < ReputationTier.DIAMOND
    ? Number(((demoProfile.truthScore - BigInt(currentTierThreshold)) * 100n) / BigInt(nextTierThreshold - currentTierThreshold))
    : 100;

  return (
    <div className="container px-4 py-6 md:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bebas tracking-wider uppercase mb-2 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 bg-clip-text text-transparent">
              Public Profile
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-mono">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 px-2"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${TIER_COLORS[demoProfile.tier]} text-white text-sm px-3 py-1`}>
              <Award className="w-3 h-3 mr-1" />
              {TIER_NAMES[demoProfile.tier]}
            </Badge>
            <Badge variant="outline" className="font-teko text-sm">
              TruthScore: {demoProfile.truthScore.toString()}
            </Badge>
            <Badge variant="outline" className="font-teko text-sm">
              {Number(winRate) / 100}% Win Rate
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-blue-500/50 hover:bg-blue-500/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-amber-500/50 hover:bg-amber-500/10"
          >
            <a
              href={`https://testnet.bscscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              BSCScan
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">TruthScore</p>
            </div>
            <p className="text-2xl font-bebas tracking-wider">{demoProfile.truthScore.toString()}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-950/20 to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <p className="text-2xl font-bebas tracking-wider">{demoProfile.correctPredictions.toString()}</p>
            <p className="text-xs text-green-400 font-teko">
              {Number(winRate) / 100}% Win Rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">Total Predictions</p>
            </div>
            <p className="text-2xl font-bebas tracking-wider">{demoProfile.totalPredictions.toString()}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-950/20 to-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
            <p className="text-2xl font-bebas tracking-wider">{demoProfile.streak.toString()}</p>
            <p className="text-xs text-amber-400 font-teko">Predictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card className="border-2 border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Reputation Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${TIER_COLORS[demoProfile.tier]} text-white`}>
                {TIER_NAMES[demoProfile.tier]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {demoProfile.truthScore.toString()} / {nextTierThreshold} points
              </span>
            </div>
            {demoProfile.tier < ReputationTier.DIAMOND && (
              <Badge variant="outline" className="font-teko">
                Next: {TIER_NAMES[nextTier]}
              </Badge>
            )}
          </div>

          {demoProfile.tier < ReputationTier.DIAMOND ? (
            <>
              <Progress value={progressToNextTier} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {nextTierThreshold - Number(demoProfile.truthScore)} points to {TIER_NAMES[nextTier]}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-lg font-bebas tracking-wider text-amber-400">
                Maximum Tier Achieved!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-2 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
            <Activity className="w-5 h-5 text-blue-500" />
            Recent Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent predictions - replace with real data */}
            {[
              { market: 'BTC/USD Price Movement', outcome: 'UP', result: 'Won', time: '2 hours ago', correct: true },
              { market: 'ETH/USD Price Movement', outcome: 'DOWN', result: 'Won', time: '5 hours ago', correct: true },
              { market: 'BNB/USD Price Movement', outcome: 'UP', result: 'Lost', time: '1 day ago', correct: false },
              { market: 'CAKE/USD Price Movement', outcome: 'DOWN', result: 'Won', time: '1 day ago', correct: true },
            ].map((prediction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{prediction.market}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {prediction.outcome}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{prediction.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {prediction.correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">{prediction.result}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">{prediction.result}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase text-green-400">
              <TrendingUp className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Short-term Predictions</span>
                <span className="font-semibold text-green-400">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Crypto Markets</span>
                <span className="font-semibold text-green-400">71%</span>
              </div>
              <Progress value={71} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>High Volume Markets</span>
                <span className="font-semibold text-green-400">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase text-red-400">
              <BarChart3 className="w-5 h-5" />
              Platform Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Member Since</span>
              </div>
              <span className="font-semibold font-teko">Nov 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Rank</span>
              </div>
              <span className="font-semibold font-teko">#42 / 1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Markets Traded</span>
              </div>
              <span className="font-semibold font-teko">12</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
