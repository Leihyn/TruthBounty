'use client';

import { useTruthBounty, useUpdateScore } from '@/hooks/useTruthBounty';
import { NFTDisplay } from '@/components/NFTDisplay';
import { ImportPredictions } from '@/components/ImportPredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import { TIER_NAMES, TIER_COLORS, ReputationTier } from '@/lib/contracts';
import { useEffect, useState, useCallback } from 'react';

// Demo mode mock data for all tiers
const DEMO_DATA = {
  bronze: {
    tier: ReputationTier.BRONZE,
    truthScore: 85,
    totalPredictions: 12,
    correctPredictions: 6,
    totalVolume: 180000000000000000n, // 0.18 BNB in wei
    nextTier: ReputationTier.SILVER,
    nextTierThreshold: 200,
    pancakeStats: {
      totalTrades: 8,
      wins: 4,
      losses: 3,
      pending: 1,
      winRate: 57.1,
      totalPnl: 0.0124,
      totalVolume: 0.12,
    },
    polymarketStats: {
      totalTrades: 4,
      wins: 2,
      losses: 2,
      pending: 0,
      winRate: 50.0,
      totalPnl: -8.50,
      totalVolume: 45,
    },
    pendingBets: [
      { id: 1, platform: 'pancakeswap' as const, market: 'Epoch 48291', position: 'Bull', amount: 0.02, timestamp: new Date().toISOString() },
    ],
    recentTrades: [
      { _platform: 'pancakeswap', epoch: 48289, isBull: true, outcome: 'win', pnlBNB: '0.0180' },
      { _platform: 'pancakeswap', epoch: 48288, isBull: false, outcome: 'loss', pnlBNB: '-0.0150' },
      { _platform: 'polymarket', marketQuestion: 'Will ETH hit $5k in Q1?', outcomeSelected: 'Yes', outcome: 'loss', pnlUsd: '-12.00' },
    ],
  },
  silver: {
    tier: ReputationTier.SILVER,
    truthScore: 285,
    totalPredictions: 38,
    correctPredictions: 22,
    totalVolume: 850000000000000000n, // 0.85 BNB in wei
    nextTier: ReputationTier.GOLD,
    nextTierThreshold: 400,
    pancakeStats: {
      totalTrades: 22,
      wins: 13,
      losses: 8,
      pending: 1,
      winRate: 61.9,
      totalPnl: 0.0892,
      totalVolume: 0.65,
    },
    polymarketStats: {
      totalTrades: 16,
      wins: 9,
      losses: 6,
      pending: 1,
      winRate: 60.0,
      totalPnl: 42.30,
      totalVolume: 285,
    },
    pendingBets: [
      { id: 1, platform: 'pancakeswap' as const, market: 'Epoch 48291', position: 'Bear', amount: 0.03, timestamp: new Date().toISOString() },
      { id: 2, platform: 'polymarket' as const, market: 'Will Apple launch AR glasses in 2025?', position: 'Yes', amount: 15, entryPrice: 0.35, timestamp: new Date().toISOString() },
    ],
    recentTrades: [
      { _platform: 'pancakeswap', epoch: 48289, isBull: false, outcome: 'win', pnlBNB: '0.0320' },
      { _platform: 'polymarket', marketQuestion: 'Fed rate cut in March?', outcomeSelected: 'No', outcome: 'win', pnlUsd: '18.50' },
      { _platform: 'pancakeswap', epoch: 48288, isBull: true, outcome: 'loss', pnlBNB: '-0.0250' },
      { _platform: 'pancakeswap', epoch: 48287, isBull: true, outcome: 'win', pnlBNB: '0.0410' },
    ],
  },
  gold: {
    tier: ReputationTier.GOLD,
    truthScore: 520,
    totalPredictions: 72,
    correctPredictions: 45,
    totalVolume: 2450000000000000000n, // 2.45 BNB in wei
    nextTier: ReputationTier.PLATINUM,
    nextTierThreshold: 650,
    pancakeStats: {
      totalTrades: 38,
      wins: 25,
      losses: 11,
      pending: 2,
      winRate: 69.4,
      totalPnl: 0.2841,
      totalVolume: 1.85,
    },
    polymarketStats: {
      totalTrades: 34,
      wins: 20,
      losses: 12,
      pending: 2,
      winRate: 62.5,
      totalPnl: 127.50,
      totalVolume: 892,
    },
    pendingBets: [
      { id: 1, platform: 'pancakeswap' as const, market: 'Epoch 48291', position: 'Bull', amount: 0.05, timestamp: new Date().toISOString() },
      { id: 2, platform: 'polymarket' as const, market: 'Will BTC reach $100k by Feb 2025?', position: 'Yes', amount: 25, entryPrice: 0.62, timestamp: new Date().toISOString() },
      { id: 3, platform: 'pancakeswap' as const, market: 'Epoch 48290', position: 'Bear', amount: 0.03, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 4, platform: 'polymarket' as const, market: 'ETH to flip BTC market cap in 2025?', position: 'No', amount: 50, entryPrice: 0.15, timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
    recentTrades: [
      { _platform: 'pancakeswap', epoch: 48289, isBull: true, outcome: 'win', pnlBNB: '0.0480' },
      { _platform: 'polymarket', marketQuestion: 'Will the Fed cut rates in January?', outcomeSelected: 'Yes', outcome: 'loss', pnlUsd: '-15.00' },
      { _platform: 'pancakeswap', epoch: 48288, isBull: false, outcome: 'win', pnlBNB: '0.0512' },
      { _platform: 'polymarket', marketQuestion: 'Trump wins 2024 election?', outcomeSelected: 'Yes', outcome: 'win', pnlUsd: '42.30' },
      { _platform: 'pancakeswap', epoch: 48287, isBull: true, outcome: 'loss', pnlBNB: '-0.0300' },
    ],
  },
  platinum: {
    tier: ReputationTier.PLATINUM,
    truthScore: 780,
    totalPredictions: 156,
    correctPredictions: 112,
    totalVolume: 8920000000000000000n, // 8.92 BNB in wei
    nextTier: ReputationTier.DIAMOND,
    nextTierThreshold: 900,
    pancakeStats: {
      totalTrades: 89,
      wins: 65,
      losses: 22,
      pending: 2,
      winRate: 74.7,
      totalPnl: 1.2450,
      totalVolume: 6.85,
    },
    polymarketStats: {
      totalTrades: 67,
      wins: 47,
      losses: 18,
      pending: 2,
      winRate: 72.3,
      totalPnl: 892.40,
      totalVolume: 3420,
    },
    pendingBets: [
      { id: 1, platform: 'pancakeswap' as const, market: 'Epoch 48291', position: 'Bull', amount: 0.15, timestamp: new Date().toISOString() },
      { id: 2, platform: 'polymarket' as const, market: 'Will GPT-5 be released in 2025?', position: 'Yes', amount: 150, entryPrice: 0.72, timestamp: new Date().toISOString() },
      { id: 3, platform: 'pancakeswap' as const, market: 'Epoch 48290', position: 'Bull', amount: 0.12, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 4, platform: 'polymarket' as const, market: 'Bitcoin ETF AUM > $100B by EOY?', position: 'Yes', amount: 200, entryPrice: 0.58, timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
    recentTrades: [
      { _platform: 'pancakeswap', epoch: 48289, isBull: true, outcome: 'win', pnlBNB: '0.1250' },
      { _platform: 'polymarket', marketQuestion: 'Will Nvidia hit $200/share?', outcomeSelected: 'Yes', outcome: 'win', pnlUsd: '185.00' },
      { _platform: 'pancakeswap', epoch: 48288, isBull: true, outcome: 'win', pnlBNB: '0.0980' },
      { _platform: 'polymarket', marketQuestion: 'SpaceX Starship orbital success?', outcomeSelected: 'Yes', outcome: 'win', pnlUsd: '142.30' },
      { _platform: 'pancakeswap', epoch: 48287, isBull: false, outcome: 'loss', pnlBNB: '-0.0650' },
    ],
  },
  diamond: {
    tier: ReputationTier.DIAMOND,
    truthScore: 1250,
    totalPredictions: 342,
    correctPredictions: 267,
    totalVolume: 28500000000000000000n, // 28.5 BNB in wei
    nextTier: ReputationTier.DIAMOND, // Max tier
    nextTierThreshold: 900,
    pancakeStats: {
      totalTrades: 198,
      wins: 156,
      losses: 38,
      pending: 4,
      winRate: 80.4,
      totalPnl: 4.8920,
      totalVolume: 22.5,
    },
    polymarketStats: {
      totalTrades: 144,
      wins: 111,
      losses: 29,
      pending: 4,
      winRate: 79.3,
      totalPnl: 4250.80,
      totalVolume: 12800,
    },
    pendingBets: [
      { id: 1, platform: 'pancakeswap' as const, market: 'Epoch 48291', position: 'Bull', amount: 0.35, timestamp: new Date().toISOString() },
      { id: 2, platform: 'polymarket' as const, market: 'Will AGI be achieved by 2030?', position: 'No', amount: 500, entryPrice: 0.85, timestamp: new Date().toISOString() },
      { id: 3, platform: 'pancakeswap' as const, market: 'Epoch 48290', position: 'Bull', amount: 0.28, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 4, platform: 'polymarket' as const, market: 'US recession in 2025?', position: 'No', amount: 350, entryPrice: 0.32, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 5, platform: 'pancakeswap' as const, market: 'Epoch 48289', position: 'Bear', amount: 0.22, timestamp: new Date(Date.now() - 10800000).toISOString() },
      { id: 6, platform: 'polymarket' as const, market: 'Ethereum ETF approval?', position: 'Yes', amount: 420, entryPrice: 0.91, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ],
    recentTrades: [
      { _platform: 'pancakeswap', epoch: 48288, isBull: true, outcome: 'win', pnlBNB: '0.2850' },
      { _platform: 'polymarket', marketQuestion: 'BTC > $150k in 2025?', outcomeSelected: 'Yes', outcome: 'win', pnlUsd: '520.00' },
      { _platform: 'pancakeswap', epoch: 48287, isBull: true, outcome: 'win', pnlBNB: '0.1920' },
      { _platform: 'polymarket', marketQuestion: 'Tesla FSD Level 5 approval?', outcomeSelected: 'No', outcome: 'win', pnlUsd: '385.50' },
      { _platform: 'pancakeswap', epoch: 48286, isBull: false, outcome: 'win', pnlBNB: '0.1650' },
    ],
  },
};
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
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
  Timer,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';

const TIER_THRESHOLDS: Record<ReputationTier, number> = {
  [ReputationTier.BRONZE]: 0,
  [ReputationTier.SILVER]: 200,
  [ReputationTier.GOLD]: 400,
  [ReputationTier.PLATINUM]: 650,
  [ReputationTier.DIAMOND]: 900,
};

interface SimulationStats {
  totalTrades: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  totalPnl: number;
  totalVolume: number;
}

interface PendingBet {
  id: number;
  platform: 'pancakeswap' | 'polymarket';
  market: string;
  position: string;
  amount: number;
  entryPrice?: number;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [showNFT, setShowNFT] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Demo mode
  const demoMode = searchParams.get('demo') as keyof typeof DEMO_DATA | null;
  const isDemo = demoMode === 'bronze' || demoMode === 'silver' || demoMode === 'gold' || demoMode === 'platinum' || demoMode === 'diamond';
  const demoData = isDemo && demoMode ? DEMO_DATA[demoMode] : null;

  // Simulation stats
  const [pancakeStats, setPancakeStats] = useState<SimulationStats | null>(null);
  const [polymarketStats, setPolymarketStats] = useState<SimulationStats | null>(null);
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setMounted(true);
    // If demo mode, load demo data
    if (demoData) {
      setPancakeStats(demoData.pancakeStats);
      setPolymarketStats(demoData.polymarketStats);
      setPendingBets(demoData.pendingBets);
      setRecentTrades(demoData.recentTrades);
      setLoadingStats(false);
    }
  }, [demoData]);

  const {
    isRegistered,
    userProfile,
    nftMetadata,
    tokenURI,
    registerUser,
    isRegistering,
  } = useTruthBounty();

  const fetchSimulationData = useCallback(async () => {
    if (!account.address) return;

    setLoadingStats(true);
    try {
      // Fetch PancakeSwap stats
      const pancakeRes = await fetch(`/api/copy-trading/simulation?stats=true&follower=${account.address}`);
      if (pancakeRes.ok) {
        const data = await pancakeRes.json();
        const followerStats = data.followers?.find((f: any) =>
          f.follower.toLowerCase() === account.address?.toLowerCase()
        );
        if (followerStats) {
          // Parse winRate - API returns "50.0%" string
          let winRateNum = 0;
          if (typeof followerStats.winRate === 'string') {
            winRateNum = parseFloat(followerStats.winRate.replace('%', '')) || 0;
          } else if (typeof followerStats.winRate === 'number') {
            winRateNum = followerStats.winRate;
          }
          setPancakeStats({
            totalTrades: followerStats.totalTrades || 0,
            wins: followerStats.wins || 0,
            losses: followerStats.losses || 0,
            pending: followerStats.pending || 0,
            winRate: winRateNum,
            totalPnl: parseFloat(followerStats.totalPnlBNB || followerStats.totalPnlBnb) || 0,
            totalVolume: parseFloat(followerStats.totalVolumeBNB || followerStats.totalVolumeBnb) || 0,
          });
        }
      }

      // Fetch Polymarket stats
      const polyRes = await fetch(`/api/polymarket/simulate?stats=true&follower=${account.address}`);
      if (polyRes.ok) {
        const data = await polyRes.json();
        const followerStats = data.followers?.find((f: any) =>
          f.follower.toLowerCase() === account.address?.toLowerCase()
        );
        if (followerStats) {
          // Parse winRate - API may return "50.0%" string or number
          let winRateNum = 0;
          if (typeof followerStats.winRate === 'string') {
            winRateNum = parseFloat(followerStats.winRate.replace('%', '')) || 0;
          } else if (typeof followerStats.winRate === 'number') {
            winRateNum = followerStats.winRate;
          }
          setPolymarketStats({
            totalTrades: followerStats.totalTrades || 0,
            wins: followerStats.wins || 0,
            losses: followerStats.losses || 0,
            pending: followerStats.pending || 0,
            winRate: winRateNum,
            totalPnl: parseFloat(followerStats.totalPnlUsd || followerStats.totalPnlUSD) || 0,
            totalVolume: parseFloat(followerStats.totalVolumeUsd || followerStats.totalVolumeUSD) || 0,
          });
        }
      }

      // Fetch pending PancakeSwap bets
      const pancakeBetsRes = await fetch(`/api/copy-trading/simulation?follower=${account.address}&limit=50`);
      if (pancakeBetsRes.ok) {
        const data = await pancakeBetsRes.json();
        const pending = (data.trades || [])
          .filter((t: any) => t.outcome === 'pending')
          .map((t: any) => ({
            id: t.id,
            platform: 'pancakeswap' as const,
            market: `Epoch ${t.epoch}`,
            position: t.isBull ? 'Bull' : 'Bear',
            amount: parseFloat(t.amountBNB || t.simulated_amount || '0'),
            timestamp: t.simulatedAt || t.simulated_at,
          }));

        // Fetch pending Polymarket bets
        const polyBetsRes = await fetch(`/api/polymarket/simulate?follower=${account.address}&limit=50`);
        let polyPending: PendingBet[] = [];
        let polyTrades: any[] = [];

        if (polyBetsRes.ok) {
          const polyData = await polyBetsRes.json();
          polyTrades = polyData.trades || [];
          polyPending = polyTrades
            .filter((t: any) => t.outcome === 'pending')
            .map((t: any) => ({
              id: t.id,
              platform: 'polymarket' as const,
              market: t.marketQuestion || t.market_question || `Market ${(t.marketId || t.market_id)?.slice(0, 8)}...`,
              position: t.outcomeSelected || t.outcome_selected || 'Unknown',
              amount: parseFloat(t.amountUsd || t.amount_usd || '0'),
              entryPrice: t.priceAtEntry || t.price_at_entry ? parseFloat(t.priceAtEntry || t.price_at_entry) : undefined,
              timestamp: t.simulatedAt || t.simulated_at,
            }));
        }

        setPendingBets([...pending, ...polyPending].sort((a, b) =>
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        ));

        // Get recent resolved trades
        const recentResolved = [
          ...(data.trades || []).filter((t: any) => t.outcome !== 'pending').slice(0, 5).map((t: any) => ({ ...t, _platform: 'pancakeswap' })),
          ...polyTrades.filter((t: any) => t.outcome !== 'pending').slice(0, 5).map((t: any) => ({ ...t, _platform: 'polymarket' })),
        ].sort((a, b) => new Date(b.resolvedAt || b.resolved_at || b.simulatedAt || b.simulated_at || 0).getTime() - new Date(a.resolvedAt || a.resolved_at || a.simulatedAt || a.simulated_at || 0).getTime());
        setRecentTrades(recentResolved.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching simulation data:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [account.address]);

  useEffect(() => {
    if (mounted && account.address) {
      fetchSimulationData();
      const interval = setInterval(fetchSimulationData, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted, account.address, fetchSimulationData]);

  const handleRegister = async () => {
    setRegisterError(null);
    setRegisterSuccess(false);
    try {
      await registerUser?.();
      setRegisterSuccess(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setRegisterError(err?.message || err?.shortMessage || 'Transaction failed. Please try again.');
    }
  };

  const { updateState, startUpdate, isUpdating } = useUpdateScore();

  const hasWallet = mounted && (!!account.address || isDemo);
  const address = account.address || (isDemo ? '0x7a3f...8c2d' : undefined);
  const demoAddress = '0x7a3f1234567890abcdef1234567890abcdef8c2d';

  // Combined stats
  const totalPending = (pancakeStats?.pending || 0) + (polymarketStats?.pending || 0);
  const totalWins = (pancakeStats?.wins || 0) + (polymarketStats?.wins || 0);
  const totalLosses = (pancakeStats?.losses || 0) + (polymarketStats?.losses || 0);
  const combinedWinRate = totalWins + totalLosses > 0
    ? (totalWins / (totalWins + totalLosses)) * 100
    : 0;

  if (!mounted) return null;

  // Not connected (skip this in demo mode)
  if (!hasWallet && !isDemo) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Connect your wallet</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your dashboard and track simulated bets.
          </p>
        </div>
      </div>
    );
  }

  // Not registered - show simulation dashboard anyway
  const showSimulationDashboard = true; // Always show for connected wallets

  return (
    <div className="container px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Dashboard</h1>
            {isDemo && (
              <Badge variant="outline" className="text-[10px] border-warning text-warning">DEMO</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-muted-foreground font-mono">{isDemo ? '0x7a3f...8c2d' : `${address?.slice(0, 6)}...${address?.slice(-4)}`}</code>
            {(isRegistered && nftMetadata) || (isDemo && demoData) ? (
              <Badge className={`${TIER_COLORS[isDemo && demoData ? demoData.tier : nftMetadata!.tier]} text-white text-[10px]`}>
                {TIER_NAMES[isDemo && demoData ? demoData.tier : nftMetadata!.tier]}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSimulationData} disabled={loadingStats} className="h-9 w-9">
            {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Simulation Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold">{totalPending}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Win rate</span>
            </div>
            <p className="text-2xl font-bold text-success">{combinedWinRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Wins</span>
            </div>
            <p className="text-2xl font-bold text-success">{totalWins}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Losses</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{totalLosses}</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PancakeSwap Stats */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              PancakeSwap Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <Skeleton className="h-20" />
            ) : pancakeStats ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className="text-lg font-bold">{pancakeStats.totalTrades}</p>
                    <p className="text-[10px] text-muted-foreground">Trades</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className="text-lg font-bold text-success">{pancakeStats.winRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className={`text-lg font-bold ${pancakeStats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {pancakeStats.totalPnl >= 0 ? '+' : ''}{pancakeStats.totalPnl.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">PnL (BNB)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>{pancakeStats.pending} pending</span>
                  <span>{pancakeStats.totalVolume.toFixed(2)} BNB volume</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No PancakeSwap trades yet</p>
                <Button variant="link" size="sm" onClick={() => router.push('/copy-trading')}>
                  Start simulating →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Polymarket Stats */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-white" />
              </div>
              Polymarket Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStats ? (
              <Skeleton className="h-20" />
            ) : polymarketStats ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className="text-lg font-bold">{polymarketStats.totalTrades}</p>
                    <p className="text-[10px] text-muted-foreground">Positions</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className="text-lg font-bold text-success">{polymarketStats.winRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/50">
                    <p className={`text-lg font-bold ${polymarketStats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {polymarketStats.totalPnl >= 0 ? '+' : ''}${polymarketStats.totalPnl.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">PnL (USD)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>{polymarketStats.pending} pending</span>
                  <span>${polymarketStats.totalVolume.toFixed(2)} volume</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No Polymarket trades yet</p>
                <Button variant="link" size="sm" onClick={() => router.push('/markets')}>
                  Browse markets →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Bets Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4 text-warning" />
              Pending bets
              {totalPending > 0 && (
                <Badge variant="secondary" className="text-xs">{totalPending}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchSimulationData} disabled={loadingStats}>
              <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : pendingBets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No pending bets</p>
              <p className="text-xs mt-1">Place simulated bets on Markets or Copy Trading</p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/markets')}>
                  <Target className="h-4 w-4 mr-2" />
                  Markets
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/copy-trading')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Trading
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBets.map((bet) => (
                <div
                  key={`${bet.platform}-${bet.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      bet.platform === 'pancakeswap'
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-br from-purple-500 to-blue-600'
                    }`}>
                      {bet.platform === 'pancakeswap' ? (
                        <Zap className="h-4 w-4 text-white" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{bet.market}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`text-[10px] ${
                          bet.position === 'Bull' || bet.position === 'Yes'
                            ? 'border-success/30 text-success'
                            : 'border-destructive/30 text-destructive'
                        }`}>
                          {bet.position}
                        </Badge>
                        {bet.entryPrice && (
                          <span>@ {(bet.entryPrice * 100).toFixed(0)}¢</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {bet.platform === 'pancakeswap' ? `${bet.amount.toFixed(4)} BNB` : `$${bet.amount.toFixed(2)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(bet.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentTrades.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTrades.slice(0, 5).map((trade, i) => {
                const isPancake = trade._platform === 'pancakeswap' || trade.epoch !== undefined;
                const isWin = trade.outcome === 'win';
                const pnl = isPancake
                  ? parseFloat(trade.pnlBNB || trade.pnl_bnb || '0')
                  : parseFloat(trade.pnlUsd || trade.pnl_usd || '0');

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isWin ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {isWin ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">
                          {isPancake ? `Epoch ${trade.epoch}` : (trade.marketQuestion || trade.market_question || 'Unknown market')?.slice(0, 40)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPancake ? 'PancakeSwap' : 'Polymarket'} • {isPancake ? (trade.isBull ? 'Bull' : 'Bear') : (trade.outcomeSelected || trade.outcome_selected || 'Unknown')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono ${isWin ? 'text-success' : 'text-destructive'}`}>
                        {pnl >= 0 ? '+' : ''}{isPancake ? `${pnl.toFixed(4)} BNB` : `$${pnl.toFixed(2)}`}
                      </p>
                      <Badge variant={isWin ? 'default' : 'destructive'} className="text-[10px]">
                        {isWin ? 'WON' : 'LOST'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* On-chain Profile (if registered or demo mode) */}
      {((isRegistered && userProfile && nftMetadata) || (isDemo && demoData)) && (
        <Card className="border-border/50 overflow-hidden">
          {/* Tier gradient header for demo */}
          {isDemo && demoData && (
            <div className={`h-2 w-full ${
              demoData.tier === ReputationTier.BRONZE
                ? 'bg-gradient-to-r from-amber-700 to-amber-500'
                : demoData.tier === ReputationTier.SILVER
                  ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                  : demoData.tier === ReputationTier.GOLD
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-300'
                    : demoData.tier === ReputationTier.PLATINUM
                      ? 'bg-gradient-to-r from-gray-300 to-gray-100'
                      : demoData.tier === ReputationTier.DIAMOND
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
                        : 'bg-gradient-to-r from-primary to-primary/70'
            }`} />
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              On-chain reputation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-secondary">
                  {isDemo && demoData ? demoData.truthScore : Number(userProfile!.truthScore).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">TruthScore</p>
              </div>
              <Badge className={`${TIER_COLORS[isDemo && demoData ? demoData.tier : nftMetadata!.tier]} text-white`}>
                {TIER_NAMES[isDemo && demoData ? demoData.tier : nftMetadata!.tier]}
              </Badge>
            </div>
            {/* Progress to next tier */}
            {isDemo && demoData && demoData.tier !== ReputationTier.DIAMOND && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress to {TIER_NAMES[demoData.nextTier]}</span>
                  <span>{Math.round(((demoData.truthScore - TIER_THRESHOLDS[demoData.tier]) / (demoData.nextTierThreshold - TIER_THRESHOLDS[demoData.tier])) * 100)}%</span>
                </div>
                <Progress value={((demoData.truthScore - TIER_THRESHOLDS[demoData.tier]) / (demoData.nextTierThreshold - TIER_THRESHOLDS[demoData.tier])) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">{demoData.nextTierThreshold - demoData.truthScore} points to go</p>
              </div>
            )}
            {isDemo && demoData && demoData.tier === ReputationTier.DIAMOND && (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-secondary">Maximum tier achieved</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="p-2 rounded-lg bg-surface/50">
                <p className="text-lg font-bold">
                  {isDemo && demoData ? demoData.totalPredictions : Number(userProfile!.totalPredictions)}
                </p>
                <p className="text-[10px] text-muted-foreground">On-chain</p>
              </div>
              <div className="p-2 rounded-lg bg-surface/50">
                <p className="text-lg font-bold text-success">
                  {isDemo && demoData
                    ? Math.round((demoData.correctPredictions / demoData.totalPredictions) * 100)
                    : userProfile!.totalPredictions > 0n
                      ? (Number((userProfile!.correctPredictions * 100n) / userProfile!.totalPredictions)).toFixed(0)
                      : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">Accuracy</p>
              </div>
              <div className="p-2 rounded-lg bg-surface/50">
                <p className="text-lg font-bold text-secondary">
                  {isDemo && demoData
                    ? (Number(demoData.totalVolume) / 1e18).toFixed(2)
                    : (Number(userProfile!.totalVolume || 0n) / 1e18).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">BNB Vol</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => router.push(`/profile/${isDemo ? demoAddress : address}${isDemo && demoMode ? `?demo=${demoMode}` : ''}`)}
            >
              View full profile
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Register CTA (if not registered and not demo mode) */}
      {!isRegistered && !isDemo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Mint your reputation NFT</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your on-chain identity to track predictions permanently and climb the leaderboard.
                </p>
                <Button onClick={handleRegister} disabled={isRegistering}>
                  {isRegistering ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
                  ) : (
                    <>Register for 0.0005 BNB<ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
            {registerError && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{registerError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
