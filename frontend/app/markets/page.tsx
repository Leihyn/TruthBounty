'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MarketList } from '@/components/polymarket/MarketList';
import { MarketDetailModal } from '@/components/polymarket/MarketDetailModal';
import { SimulateBetModal } from '@/components/polymarket/SimulateBetModal';
import { PancakeMarketCard } from '@/components/pancakeswap/PancakeMarketCard';
import { OvertimeMarketCard } from '@/components/overtime/OvertimeMarketCard';
import { SpeedMarketCard } from '@/components/speedmarkets/SpeedMarketCard';
import { LimitlessMarketCard } from '@/components/limitless/LimitlessMarketCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PolymarketMarket } from '@/lib/polymarket';
import { PancakePredictionMarket, fetchPancakeMarkets } from '@/lib/pancakeswap';
import { OvertimePredictionMarket, fetchOvertimeMarkets } from '@/lib/overtime';
import { SpeedMarketDisplay, fetchSpeedMarkets } from '@/lib/speedmarkets';
import { LimitlessPredictionMarket, fetchLimitlessMarkets } from '@/lib/limitless';
import { AlertTriangle, Timer, BarChart3, RefreshCw, TrendingUp, Clock, Zap, Activity, Trophy, Gauge, Infinity } from 'lucide-react';
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
  const [overtimeMarkets, setOvertimeMarkets] = useState<OvertimePredictionMarket[]>([]);
  const [overtimeLoading, setOvertimeLoading] = useState(true);
  const [isOvertimeMock, setIsOvertimeMock] = useState(false);
  const [speedMarkets, setSpeedMarkets] = useState<SpeedMarketDisplay[]>([]);
  const [speedLoading, setSpeedLoading] = useState(true);
  const [isSpeedMock, setIsSpeedMock] = useState(false);
  const [limitlessMarkets, setLimitlessMarkets] = useState<LimitlessPredictionMarket[]>([]);
  const [limitlessLoading, setLimitlessLoading] = useState(true);
  const [isLimitlessMock, setIsLimitlessMock] = useState(false);
  const [activeTab, setActiveTab] = useState('pancake');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPancakeMarkets();
    loadOvertimeMarkets();
    loadSpeedMarkets();
    loadLimitlessMarkets();
    const interval = setInterval(() => {
      loadPancakeMarkets();
      loadOvertimeMarkets();
      loadSpeedMarkets();
      loadLimitlessMarkets();
    }, 30000);
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

  async function loadOvertimeMarkets() {
    try {
      const { markets, isMock } = await fetchOvertimeMarkets();
      setOvertimeMarkets(markets);
      setIsOvertimeMock(isMock);
    } catch (error) {
      console.error('Error loading Overtime markets:', error);
    } finally {
      setOvertimeLoading(false);
    }
  }

  async function loadSpeedMarkets() {
    try {
      const { markets, isMock } = await fetchSpeedMarkets();
      setSpeedMarkets(markets);
      setIsSpeedMock(isMock);
    } catch (error) {
      console.error('Error loading Speed Markets:', error);
    } finally {
      setSpeedLoading(false);
    }
  }

  async function loadLimitlessMarkets() {
    try {
      const { markets, isMock } = await fetchLimitlessMarkets();
      setLimitlessMarkets(markets);
      setIsLimitlessMock(isMock);
    } catch (error) {
      console.error('Error loading Limitless markets:', error);
    } finally {
      setLimitlessLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadPancakeMarkets(),
      loadOvertimeMarkets(),
      loadSpeedMarkets(),
      loadLimitlessMarkets(),
    ]);
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
  const overtimeLiveCount = overtimeMarkets.filter(m => m.isLive).length;
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
        <TabsList className="w-full h-auto min-h-[48px] p-1 bg-surface/50 border border-border/50 flex flex-wrap gap-1">
          <TabsTrigger
            value="pancake"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/10 data-[state=active]:to-yellow-500/10 data-[state=active]:border-amber-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Timer className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm hidden sm:inline">PancakeSwap</span>
            <span className="font-medium text-xs sm:hidden">Pancake</span>
          </TabsTrigger>
          <TabsTrigger
            value="speed"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-red-500/10 data-[state=active]:border-orange-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Gauge className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Speed</span>
          </TabsTrigger>
          <TabsTrigger
            value="overtime"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-indigo-500/10 data-[state=active]:border-blue-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Sports</span>
          </TabsTrigger>
          <TabsTrigger
            value="limitless"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/10 data-[state=active]:to-emerald-500/10 data-[state=active]:border-green-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Infinity className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Limitless</span>
          </TabsTrigger>
          <TabsTrigger
            value="polymarket"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:border-purple-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm hidden sm:inline">Polymarket</span>
            <span className="font-medium text-xs sm:hidden">Poly</span>
          </TabsTrigger>
        </TabsList>

        {/* PancakeSwap Tab */}
        <TabsContent value="pancake" className="mt-4">
          {/* Live data info banner */}
          <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
            <Zap className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Live BSC data:</span> Pool sizes and odds update in real-time as users bet on PancakeSwap. Simulate bets risk-free.
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

        {/* Speed Markets Tab */}
        <TabsContent value="speed" className="mt-4">
          {/* Mock data warning */}
          {isSpeedMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Using simulated price data.
              </AlertDescription>
            </Alert>
          )}
          {/* Info banner */}
          <Alert className="mb-4 border-orange-500/30 bg-orange-500/5">
            <Gauge className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Thales Speed Markets:</span> Predict if BTC/ETH will go UP or DOWN. Choose your time frame (5 min to 24 hours) on Optimism.
            </AlertDescription>
          </Alert>
          {speedLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : speedMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Gauge className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No Speed Markets available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {speedMarkets.map((market) => (
                <SpeedMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={loadSpeedMarkets}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="mt-4">
          {/* Mock data warning */}
          {isOvertimeMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Live Overtime API unavailable.
              </AlertDescription>
            </Alert>
          )}
          {/* Info banner */}
          <Alert className="mb-4 border-blue-500/30 bg-blue-500/5">
            <Trophy className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Sports betting simulation:</span> Bet on live sports from NFL, NBA, soccer, MMA and more. Powered by Overtime Markets on Optimism.
            </AlertDescription>
          </Alert>
          {overtimeLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : overtimeMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active sports markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overtimeMarkets.map((market) => (
                <OvertimeMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={loadOvertimeMarkets}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Limitless Tab */}
        <TabsContent value="limitless" className="mt-4">
          {/* Mock data warning */}
          {isLimitlessMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Limitless API unavailable.
              </AlertDescription>
            </Alert>
          )}
          {/* Info banner */}
          <Alert className="mb-4 border-green-500/30 bg-green-500/5">
            <Infinity className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Limitless Exchange:</span> Prediction markets on Base chain. Trade on crypto, politics, economics and more.
            </AlertDescription>
          </Alert>
          {limitlessLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : limitlessMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Infinity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Limitless markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {limitlessMarkets.map((market) => (
                <LimitlessMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={loadLimitlessMarkets}
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
