'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Timer,
  DollarSign,
  Zap,
} from 'lucide-react';
import { SpeedMarketCard } from '@/components/speedmarkets/SpeedMarketCard';
import { SPEED_MARKETS } from '@/lib/speedmarkets';

interface SpeedTrade {
  id: number;
  asset: 'BTC' | 'ETH';
  direction: 'UP' | 'DOWN';
  amountUsd: number;
  strikePrice: number;
  finalPrice?: number;
  estimatedPayout: number;
  timeFrameSeconds: number;
  maturity: string;
  outcome: 'pending' | 'win' | 'loss';
  pnlUsd?: number;
  simulatedAt: string;
  resolvedAt?: string;
}

interface SpeedStats {
  totalTrades: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: string;
  totalPnlUsd: string;
  totalVolumeUsd: string;
}

export default function SpeedMarketsPage() {
  const { address } = useAccount();
  const { toast } = useToast();

  const [trades, setTrades] = useState<SpeedTrade[]>([]);
  const [stats, setStats] = useState<SpeedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/speedmarkets/simulate?follower=${address.toLowerCase()}&limit=50`);
      const data = await response.json();

      if (response.ok) {
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  }, [address]);

  const fetchStats = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/speedmarkets/simulate?follower=${address.toLowerCase()}&stats=true`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [address]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTrades(), fetchStats()]);
    setIsLoading(false);
  }, [fetchTrades, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Speed Markets data updated.",
    });
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const response = await fetch('/api/speedmarkets/resolve');
      const data = await response.json();

      if (response.ok) {
        const { resolved, wins, losses, pending } = data;
        toast({
          title: "Bets Resolved!",
          description: `Resolved ${resolved} bets. ${wins} wins, ${losses} losses. ${pending} still pending.`,
        });
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to resolve bets');
      }
    } catch (error: any) {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve bets.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const pendingTrades = trades.filter(t => t.outcome === 'pending');
  const completedTrades = trades.filter(t => t.outcome !== 'pending');

  const formatPrice = (price: number, asset: string) => {
    if (asset === 'BTC') {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTimeRemaining = (maturity: string) => {
    const now = new Date().getTime();
    const maturityTime = new Date(maturity).getTime();
    const diff = maturityTime - now;

    if (diff <= 0) return 'Matured';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Please connect your wallet to view Speed Markets bets and statistics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">⚡ Speed Markets</h1>
            <p className="text-muted-foreground">
              Fast-paced price predictions on BTC and ETH
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            {stats && stats.pending > 0 && (
              <Button
                onClick={handleResolve}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Resolve Bets ({stats.pending})
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Trades</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalTrades}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                </div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.wins}W / {stats.losses}L
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total PnL</span>
                </div>
                <p className={`text-2xl font-bold ${parseFloat(stats.totalPnlUsd) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.totalPnlUsd}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.totalVolumeUsd} volume
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Markets */}
        <div>
          <h2 className="text-xl font-bold mb-4">Available Markets</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SPEED_MARKETS.map((market) => (
              <SpeedMarketCard
                key={market.asset}
                market={market}
                walletAddress={address}
                onBetPlaced={loadData}
              />
            ))}
          </div>
        </div>

        {/* Trades Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingTrades.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTrades.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {isLoading ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading pending bets...</p>
                </CardContent>
              </Card>
            ) : pendingTrades.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Timer className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-1">No Pending Bets</h3>
                  <p className="text-sm text-muted-foreground">
                    Place a bet on BTC or ETH to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingTrades.map((trade) => (
                <Card key={trade.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg ${trade.asset === 'BTC' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} flex items-center justify-center text-xl`}>
                            {trade.asset === 'BTC' ? '₿' : 'Ξ'}
                          </div>
                          <div>
                            <p className="font-bold">{trade.asset}/USD</p>
                            <p className="text-xs text-muted-foreground">
                              Strike: {formatPrice(trade.strikePrice, trade.asset)}
                            </p>
                          </div>
                          <Badge variant={trade.direction === 'UP' ? 'default' : 'destructive'} className={trade.direction === 'UP' ? 'bg-success' : ''}>
                            {trade.direction === 'UP' ? (
                              <><TrendingUp className="w-3 h-3 mr-1" /> UP</>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1" /> DOWN</>
                            )}
                          </Badge>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            <Timer className="w-3 h-3 mr-1" />
                            {formatTimeRemaining(trade.maturity)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-mono">${trade.amountUsd}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Potential Win</p>
                            <p className="font-mono text-success">${trade.estimatedPayout.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Time Frame</p>
                            <p>{Math.floor(trade.timeFrameSeconds / 60)} min</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {isLoading ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading completed bets...</p>
                </CardContent>
              </Card>
            ) : completedTrades.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-1">No Completed Bets</h3>
                  <p className="text-sm text-muted-foreground">
                    Your resolved bets will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedTrades.map((trade) => (
                <Card key={trade.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg ${trade.asset === 'BTC' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} flex items-center justify-center text-xl`}>
                            {trade.asset === 'BTC' ? '₿' : 'Ξ'}
                          </div>
                          <div>
                            <p className="font-bold">{trade.asset}/USD</p>
                            <p className="text-xs text-muted-foreground">
                              Strike: {formatPrice(trade.strikePrice, trade.asset)} → Final: {trade.finalPrice ? formatPrice(trade.finalPrice, trade.asset) : 'N/A'}
                            </p>
                          </div>
                          <Badge variant={trade.direction === 'UP' ? 'default' : 'destructive'} className={trade.direction === 'UP' ? 'bg-success' : ''}>
                            {trade.direction === 'UP' ? (
                              <><TrendingUp className="w-3 h-3 mr-1" /> UP</>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1" /> DOWN</>
                            )}
                          </Badge>
                          <Badge variant={trade.outcome === 'win' ? 'default' : 'destructive'} className={trade.outcome === 'win' ? 'bg-success' : ''}>
                            {trade.outcome === 'win' ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1" /> WIN</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> LOSS</>
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-mono">${trade.amountUsd}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">PnL</p>
                            <p className={`font-mono font-bold ${trade.pnlUsd && trade.pnlUsd >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {trade.pnlUsd !== undefined ? `$${trade.pnlUsd.toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Resolved</p>
                            <p className="text-xs">
                              {trade.resolvedAt ? new Date(trade.resolvedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
