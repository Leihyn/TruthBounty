'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Pause,
  Play,
  Trash2,
  Target,
  Trophy,
  BarChart3,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

interface CopyFollow {
  id: string;
  trader: {
    wallet_address: string;
    username?: string;
    stats: {
      total_bets: number;
      wins: number;
      win_rate: number;
      total_score: number;
      total_volume: string;
    };
  };
  allocation_percentage: number;
  max_bet_amount: string;
  is_active: boolean;
  created_at: string;
  platform: {
    name: string;
  } | null;
}

interface CopyTrade {
  id: string;
  original_bet: {
    amount: string;
    position: string;
    market_id: string;
  };
  copied_bet: {
    amount: string;
    won: boolean | null;
    claimed_amount: string | null;
  };
  executed_at: string;
  trader_address: string;
}

export default function CopyTradingDashboard() {
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [activeFollows, setActiveFollows] = useState<CopyFollow[]>([]);
  const [copyTrades, setCopyTrades] = useState<CopyTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFollowing: 0,
    totalCopied: 0,
    totalProfit: '0',
    successRate: 0,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check wallet connection based on address presence
  const isConnected = mounted && !!account.address;
  const address = account.address;

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData();
    }
  }, [isConnected, address]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Fetch active follows
      const followsRes = await fetch(`/api/copy-trade/follow?address=${address}`);
      if (followsRes.ok) {
        const followsData = await followsRes.json();
        setActiveFollows(followsData.follows || []);
      }

      // Fetch copy trade history
      const tradesRes = await fetch(`/api/copy-trade/history?address=${address}`);
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setCopyTrades(tradesData.trades || []);
        setStats(tradesData.stats || stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(followId: string, currentState: boolean) {
    try {
      const res = await fetch('/api/copy-trade/follow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId, isActive: !currentState }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }

  async function deleteFollow(followId: string) {
    try {
      const res = await fetch(`/api/copy-trade/follow?followId=${followId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error deleting follow:', error);
    }
  }

  function formatBNB(wei: string): string {
    return (Number(wei) / 1e18).toFixed(4);
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Show nothing during SSR
  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="border-red-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-gold-500/20 blur-xl" />
              <Wallet className="h-16 w-16 text-blue-500 relative" />
            </div>
            <h2 className="text-3xl font-bebas uppercase tracking-wider mb-2 bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-slate-400 text-center">
              Connect your wallet to view your copy trading dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bebas uppercase tracking-wider mb-2 bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
          Copy Trading Dashboard
        </h1>
        <p className="text-slate-400">
          Manage your copy trading follows and track performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Following
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-blue-400">{stats.totalFollowing}</div>
            <p className="text-xs text-slate-500 mt-1">Active traders</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total Copied
              </CardTitle>
              <Target className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-amber-400">{stats.totalCopied}</div>
            <p className="text-xs text-slate-500 mt-1">Bets executed</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Win Rate
              </CardTitle>
              <Trophy className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-red-400">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Success rate</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total P/L
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-teko flex items-center gap-2">
              {Number(stats.totalProfit) >= 0 ? (
                <TrendingUp className="h-6 w-6 text-blue-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
              <span className={Number(stats.totalProfit) >= 0 ? 'text-blue-400' : 'text-red-400'}>
                {formatBNB(stats.totalProfit)} BNB
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Follows ({activeFollows.length})</TabsTrigger>
          <TabsTrigger value="history">Trade History ({copyTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <CardContent className="py-16 text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-slate-400">Loading follows...</p>
              </CardContent>
            </Card>
          ) : activeFollows.length === 0 ? (
            <Card className="border-red-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <CardContent className="py-16 text-center">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-amber-500/20 blur-xl" />
                  <Users className="h-16 w-16 text-blue-500 relative" />
                </div>
                <h3 className="text-2xl font-bebas uppercase tracking-wider mb-2 text-slate-200">
                  No Active Follows
                </h3>
                <p className="text-slate-400 mb-6">
                  Start following top traders from the leaderboard
                </p>
                <Link href="/leaderboard">
                  <Button className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500">
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            activeFollows.map((follow) => (
              <Card key={follow.id} className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-blue-500/30">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-red-500 text-white font-bebas text-lg">
                          {follow.trader.username?.[0]?.toUpperCase() ||
                            follow.trader.wallet_address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-bebas uppercase tracking-wider text-slate-200">
                          {follow.trader.username || shortenAddress(follow.trader.wallet_address)}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs text-slate-500">
                          {shortenAddress(follow.trader.wallet_address)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={follow.is_active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleFollow(follow.id, follow.is_active)}
                        className={follow.is_active ? 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'}
                      >
                        {follow.is_active ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteFollow(follow.id)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Win Rate</p>
                      <p className="text-2xl font-teko text-blue-400">{(follow.trader?.stats?.win_rate || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Total Bets</p>
                      <p className="text-2xl font-teko text-amber-400">{follow.trader?.stats?.total_bets || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Score</p>
                      <p className="text-2xl font-teko text-red-400">{follow.trader?.stats?.total_score || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Volume</p>
                      <p className="text-2xl font-teko text-blue-400">{formatBNB(follow.trader?.stats?.total_volume || '0')} BNB</p>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider">Allocation</p>
                      <Progress value={follow.allocation_percentage} className="h-2 mb-1 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-amber-500" />
                      <p className="text-sm font-teko text-slate-300">{follow.allocation_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider">Max Bet</p>
                      <p className="text-sm font-teko text-slate-300">{formatBNB(follow.max_bet_amount)} BNB</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider">Platform</p>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                        {follow.platform?.name || 'All Platforms'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={follow.is_active ? 'default' : 'secondary'}
                      className={follow.is_active ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-slate-800 text-slate-400'}
                    >
                      {follow.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Following since {new Date(follow.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {copyTrades.length === 0 ? (
            <Card className="border-amber-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <CardContent className="py-16 text-center">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-amber-500/20 blur-xl" />
                  <Activity className="h-16 w-16 text-amber-500 relative" />
                </div>
                <h3 className="text-2xl font-bebas uppercase tracking-wider mb-2 text-slate-200">
                  No Copy Trades Yet
                </h3>
                <p className="text-slate-400">
                  Your copy trades will appear here once traders you follow place bets
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
              <CardHeader>
                <CardTitle className="text-2xl font-bebas uppercase tracking-wider bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                  Recent Copy Trades
                </CardTitle>
                <CardDescription className="text-slate-400">
                  History of automatically copied bets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {copyTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-gradient-to-r from-slate-900/50 to-slate-950/50 hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 bg-blue-500/10"
                          >
                            {trade.original_bet.position}
                          </Badge>
                          <span className="text-sm text-slate-500 font-mono">
                            Market #{trade.original_bet.market_id}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          From {shortenAddress(trade.trader_address)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(trade.executed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-teko text-slate-200">
                          {formatBNB(trade.copied_bet.amount)} BNB
                        </p>
                        {trade.copied_bet.won !== null && (
                          <Badge
                            variant={trade.copied_bet.won ? 'default' : 'destructive'}
                            className={
                              trade.copied_bet.won
                                ? 'mt-1 bg-gradient-to-r from-blue-600 to-blue-700'
                                : 'mt-1 bg-gradient-to-r from-red-600 to-red-700'
                            }
                          >
                            {trade.copied_bet.won ? 'Won' : 'Lost'}
                          </Badge>
                        )}
                        {trade.copied_bet.won === null && (
                          <Badge variant="secondary" className="mt-1 bg-slate-800 text-slate-400">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
