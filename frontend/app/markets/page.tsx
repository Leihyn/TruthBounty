'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MarketList } from '@/components/polymarket/MarketList';
import { MarketDetailModal } from '@/components/polymarket/MarketDetailModal';
import { SimulateBetModal } from '@/components/polymarket/SimulateBetModal';
import { PancakeMarketCard } from '@/components/pancakeswap/PancakeMarketCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PolymarketMarket } from '@/lib/polymarket';
import { PancakePredictionMarket, fetchPancakeMarkets } from '@/lib/pancakeswap';
import { AlertTriangle, Timer, BarChart3, RefreshCw, TrendingUp, Clock, Zap, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MarketsPage() {
  const { address } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulateMarket, setSimulateMarket] = useState<PolymarketMarket | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [pancakeMarkets, setPancakeMarkets] = useState<PancakePredictionMarket[]>([]);
  const [pancakeLoading, setPancakeLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);
  const [activeTab, setActiveTab] = useState('pancake');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPancakeMarkets();
    const interval = setInterval(loadPancakeMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadPancakeMarkets() {
    try {
      const { markets, isMock } = await fetchPancakeMarkets();
      setPancakeMarkets(markets);
      setIsMockData(isMock);
    } catch (error) {
      console.error('Error loading PancakeSwap markets:', error);
    } finally {
      setPancakeLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPancakeMarkets();
    setRefreshing(false);
  };

  const handleSelectMarket = (market: PolymarketMarket) => {
    setSelectedMarket(market);
    setIsModalOpen(true);
  };

  const handleSimulateMarket = (market: PolymarketMarket) => {
    setSimulateMarket(market);
    setIsSimulateModalOpen(true);
  };

  // Stats
  const liveCount = pancakeMarkets.filter(m => m.status === 'live').length;
  const totalVolume = pancakeMarkets.reduce((sum, m) => sum + m.totalVolume, 0);

  return (
    <div className="container px-4 md:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Markets</h1>
          </div>
          <p className="text-sm text-muted-foreground">Live prediction markets across platforms - Simulate bets on real events</p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm font-semibold text-success">{liveCount} live</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>30s</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Mock Data Warning */}
      {isMockData && (
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning text-sm">
            Showing simulated data. Live feed unavailable.
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-12 p-1 bg-surface/50 border border-border/50">
          <TabsTrigger
            value="pancake"
            className="flex-1 gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/10 data-[state=active]:to-yellow-500/10 data-[state=active]:border-amber-500/30"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium">PancakeSwap</span>
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0 hidden sm:inline-flex">
              {pancakeMarkets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="polymarket"
            className="flex-1 gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:border-purple-500/30"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium">Polymarket</span>
          </TabsTrigger>
        </TabsList>

        {/* PancakeSwap Tab */}
        <TabsContent value="pancake" className="mt-4">
          {/* Simulation info banner */}
          <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
            <Zap className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Simulation mode:</span> Place virtual bets on live PancakeSwap prediction rounds. Track your performance risk-free.
            </AlertDescription>
          </Alert>
          {pancakeLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : pancakeMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Timer className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active prediction rounds</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pancakeMarkets.map((market) => (
                <PancakeMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={loadPancakeMarkets}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Polymarket Tab */}
        <TabsContent value="polymarket" className="mt-4">
          {/* Simulation info banner */}
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Simulation mode:</span> Place virtual bets on real Polymarket events. Track your performance with no real money at risk.
            </AlertDescription>
          </Alert>
          <MarketList
            onSelectMarket={handleSelectMarket}
            onSimulateMarket={handleSimulateMarket}
            limit={12}
          />
        </TabsContent>
      </Tabs>

      {/* Market Detail Modal */}
      <MarketDetailModal
        market={selectedMarket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Simulate Bet Modal */}
      <SimulateBetModal
        market={simulateMarket}
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        walletAddress={address}
        onSuccess={() => {
          // Could refresh stats here if needed
        }}
      />
    </div>
  );
}
