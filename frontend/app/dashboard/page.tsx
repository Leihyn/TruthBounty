'use client';

import { useTruthBounty, useUpdateScore } from '@/hooks/useTruthBounty';
import { NFTDisplay } from '@/components/NFTDisplay';
import { ImportPredictions } from '@/components/ImportPredictions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { TIER_NAMES, TIER_COLORS, ReputationTier } from '@/lib/contracts';
import { useEffect, useState } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Users,
  Target,
  Wallet,
  BarChart3,
  Copy,
  ArrowRight,
  Loader2,
  Trophy,
  ExternalLink,
} from 'lucide-react';

const TIER_THRESHOLDS: Record<ReputationTier, number> = {
  [ReputationTier.BRONZE]: 0,
  [ReputationTier.SILVER]: 200,
  [ReputationTier.GOLD]: 400,
  [ReputationTier.PLATINUM]: 650,
  [ReputationTier.DIAMOND]: 900,
};

export default function DashboardPage() {
  const router = useRouter();
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [showNFT, setShowNFT] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

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

  const handleRegister = async () => {
    setRegisterError(null);
    setRegisterSuccess(false);
    try {
      await registerUser?.();
      setRegisterSuccess(true);
      // Refresh after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setRegisterError(err?.message || err?.shortMessage || 'Transaction failed. Please try again.');
    }
  };

  const { updateState, startUpdate, isUpdating } = useUpdateScore();

  const hasWallet = mounted && !!account.address;
  const address = account.address;

  if (!mounted) return null;

  // Not connected
  if (!hasWallet) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Connect Your Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Not registered
  if (!isRegistered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Get Started</h1>
            <p className="text-muted-foreground">Create your on-chain reputation</p>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              {['Mint your soulbound NFT', 'Build your TruthScore', 'Import from platforms', 'Join the leaderboard'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}

              {registerError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}

              {registerSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 shadow-2xl shadow-success/20 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-3xl font-bold text-success">MINT SUCCESSFUL!</h2>
                    <p className="text-muted-foreground">Your Reputation NFT has been minted</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Refreshing...</span>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleRegister} disabled={isRegistering} className="w-full h-12 mt-2">
                {isRegistering ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting NFT...</> : <>Register for 0.0005 BNB<ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Make sure you're on BSC Testnet (Chain ID: 97)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading
  if (!userProfile || !nftMetadata) {
    return (
      <div className="container px-4 md:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const tier = nftMetadata.tier;
  const score = Number(userProfile.truthScore);
  const winRate = userProfile.totalPredictions > 0n
    ? Number((userProfile.correctPredictions * 10000n) / userProfile.totalPredictions) / 100
    : 0;
  const totalPredictions = Number(userProfile.totalPredictions);
  const correctPredictions = Number(userProfile.correctPredictions);
  const volumeBNB = Number(userProfile.totalVolume || 0n) / 1e18;

  // Progress calculation
  const currentThreshold = TIER_THRESHOLDS[tier];
  const nextTier = tier < ReputationTier.DIAMOND ? (tier + 1) as ReputationTier : tier;
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const progress = tier === ReputationTier.DIAMOND ? 100 : ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const pointsToNext = nextThreshold - score;

  return (
    <div className="container px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-muted-foreground font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
            <Badge className={`${TIER_COLORS[tier]} text-white text-[10px]`}>{TIER_NAMES[tier]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => startUpdate()} disabled={isUpdating} className="h-9 w-9">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => router.push(`/profile/${address}`)} className="h-9 w-9">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {updateState.status === 'error' && (
        <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertDescription>{updateState.error}</AlertDescription></Alert>
      )}
      {updateState.status === 'success' && (
        <Alert className="border-success/50 bg-success/10 text-success"><CheckCircle2 className="h-4 w-4" /><AlertDescription>Score updated!</AlertDescription></Alert>
      )}

      {/* Score Card - Simplified */}
      <Card className="border-border/50 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Score */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">TruthScore</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold">{score.toLocaleString()}</span>
                <Badge className={`${TIER_COLORS[tier]} text-white`}>{TIER_NAMES[tier]}</Badge>
              </div>
              {tier < ReputationTier.DIAMOND && (
                <p className="text-xs text-muted-foreground mt-2">{pointsToNext} points to {TIER_NAMES[nextTier]}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-success">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{totalPredictions}</p>
                <p className="text-xs text-muted-foreground">Predictions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-secondary">{volumeBNB.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">BNB Volume</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {tier < ReputationTier.DIAMOND && (
            <div className="mt-5">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Markets', icon: Target, href: '/markets' },
          { label: 'Leaderboard', icon: BarChart3, href: '/leaderboard' },
          { label: 'Copy Trade', icon: Copy, href: '/copy-trading' },
          { label: 'Traders', icon: Users, href: '/traders' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-border/50 bg-card hover:bg-surface-raised hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Two Column: NFT + Platforms/Achievements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* NFT Preview */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Reputation NFT</p>
              <Badge variant="outline" className="text-xs">#{userProfile?.reputationNFTId?.toString() || '1'}</Badge>
            </div>
            <button
              onClick={() => setShowNFT(!showNFT)}
              className="w-full aspect-[3/2] rounded-lg bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-border/50 flex flex-col items-center justify-center hover:border-primary/30 transition-colors"
            >
              <p className="text-3xl font-bold mb-1">{score}</p>
              <Badge className={`${TIER_COLORS[tier]} text-white text-xs`}>{TIER_NAMES[tier]}</Badge>
              <p className="text-xs text-muted-foreground mt-3">Tap to {showNFT ? 'hide' : 'view'} details</p>
            </button>
            {showNFT && (
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-surface/50">
                  <p className="text-xs text-muted-foreground">Won</p>
                  <p className="font-bold text-success">{correctPredictions}</p>
                </div>
                <div className="p-2 rounded bg-surface/50">
                  <p className="text-xs text-muted-foreground">Lost</p>
                  <p className="font-bold text-destructive">{totalPredictions - correctPredictions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platforms & Achievements */}
        <div className="space-y-4">
          {/* Platforms */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Connected Platforms</p>
              <div className="space-y-2">
                {['Polymarket', 'PancakeSwap'].map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm">{p}</span>
                    </div>
                    <span className="text-xs text-success">Active</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Achievements</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-medium">Early Adopter</span>
                </div>
                {tier > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${TIER_COLORS[tier]}/10 border border-current/20`}>
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs font-medium">{TIER_NAMES[tier]}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Section */}
      <ImportPredictions />
    </div>
  );
}
