'use client'


import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatformMarketsWithFetcher } from '@/lib/queries';
import { MarketList } from '@/components/polymarket/MarketList';
import { MarketDetailModal } from '@/components/polymarket/MarketDetailModal';
import { SimulateBetModal } from '@/components/polymarket/SimulateBetModal';
import { PancakeMarketCard } from '@/components/pancakeswap/PancakeMarketCard';
import { OvertimeMarketCard } from '@/components/overtime/OvertimeMarketCard';
import { SpeedMarketCard } from '@/components/speedmarkets/SpeedMarketCard';
import { LimitlessMarketCard } from '@/components/limitless/LimitlessMarketCard';
import { AzuroMarketCard } from '@/components/azuro/AzuroMarketCard';
import { SXBetMarketCard } from '@/components/sxbet/SXBetMarketCard';
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
import { AzuroPredictionMarket, fetchAzuroMarkets } from '@/lib/azuro';
import { SXBetMarket, fetchSXBetMarkets } from '@/lib/sxbet';
import { GnosisPredictionMarket, fetchGnosisMarkets } from '@/lib/gnosis';
import { DriftPredictionMarket, fetchDriftMarkets } from '@/lib/drift';
import { KalshiPredictionMarket, fetchKalshiMarkets } from '@/lib/kalshi';
import { ManifoldPredictionMarket, fetchManifoldMarkets } from '@/lib/manifold';
import { MetaculusPredictionMarket, fetchMetaculusMarkets } from '@/lib/metaculus';
import { Compass, Waves, Building2, TrendingUp as TrendingIcon, Microscope } from 'lucide-react';
import { GenericMarketCard, GenericMarket } from '@/components/shared/GenericMarketCard';
import { AlertTriangle, Timer, BarChart3, RefreshCw, TrendingUp, Clock, Zap, Activity, Trophy, Gauge, Infinity, Gamepad2, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MarketsPage() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // UI state only - reduced from 55+ useState to 5
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulateMarket, setSimulateMarket] = useState<PolymarketMarket | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pancake');

  // React Query hooks for each platform - only active tab polls, others use cache
  const pancakeQuery = usePlatformMarketsWithFetcher<PancakePredictionMarket>(
    'pancakeswap', fetchPancakeMarkets, activeTab === 'pancake'
  );
  const overtimeQuery = usePlatformMarketsWithFetcher<OvertimePredictionMarket>(
    'overtime', fetchOvertimeMarkets, activeTab === 'overtime'
  );
  const speedQuery = usePlatformMarketsWithFetcher<SpeedMarketDisplay>(
    'speedmarkets', fetchSpeedMarkets, activeTab === 'speed'
  );
  const limitlessQuery = usePlatformMarketsWithFetcher<LimitlessPredictionMarket>(
    'limitless', fetchLimitlessMarkets, activeTab === 'limitless'
  );
  const azuroQuery = usePlatformMarketsWithFetcher<AzuroPredictionMarket>(
    'azuro', fetchAzuroMarkets, activeTab === 'azuro'
  );
  const sxbetQuery = usePlatformMarketsWithFetcher<SXBetMarket>(
    'sxbet', fetchSXBetMarkets, activeTab === 'sxbet'
  );
  const gnosisQuery = usePlatformMarketsWithFetcher<GnosisPredictionMarket>(
    'gnosis', fetchGnosisMarkets, activeTab === 'gnosis'
  );
  const driftQuery = usePlatformMarketsWithFetcher<DriftPredictionMarket>(
    'drift', fetchDriftMarkets, activeTab === 'drift'
  );
  const kalshiQuery = usePlatformMarketsWithFetcher<KalshiPredictionMarket>(
    'kalshi', fetchKalshiMarkets, activeTab === 'kalshi'
  );
  const manifoldQuery = usePlatformMarketsWithFetcher<ManifoldPredictionMarket>(
    'manifold', fetchManifoldMarkets, activeTab === 'manifold'
  );
  const metaculusQuery = usePlatformMarketsWithFetcher<MetaculusPredictionMarket>(
    'metaculus', fetchMetaculusMarkets, activeTab === 'metaculus'
  );

  // Extract data from queries
  const pancakeMarkets = pancakeQuery.data?.markets || [];
  const pancakeLoading = pancakeQuery.isLoading;
  const isMockData = pancakeQuery.data?.isMock || false;
  const pancakeError = pancakeQuery.data?.error || null;

  const overtimeMarkets = overtimeQuery.data?.markets || [];
  const overtimeLoading = overtimeQuery.isLoading;
  const isOvertimeMock = overtimeQuery.data?.isMock || false;
  const overtimeError = overtimeQuery.data?.error || null;

  const speedMarkets = speedQuery.data?.markets || [];
  const speedLoading = speedQuery.isLoading;
  const isSpeedMock = speedQuery.data?.isMock || false;
  const speedError = speedQuery.data?.error || null;

  const limitlessMarkets = limitlessQuery.data?.markets || [];
  const limitlessLoading = limitlessQuery.isLoading;
  const isLimitlessMock = limitlessQuery.data?.isMock || false;
  const limitlessError = limitlessQuery.data?.error || null;

  const azuroMarkets = azuroQuery.data?.markets || [];
  const azuroLoading = azuroQuery.isLoading;
  const isAzuroMock = azuroQuery.data?.isMock || false;
  const azuroError = azuroQuery.data?.error || null;

  const sxbetMarkets = sxbetQuery.data?.markets || [];
  const sxbetLoading = sxbetQuery.isLoading;
  const isSXBetMock = sxbetQuery.data?.isMock || false;
  const sxbetError = sxbetQuery.data?.error || null;

  const gnosisMarkets = gnosisQuery.data?.markets || [];
  const gnosisLoading = gnosisQuery.isLoading;
  const isGnosisMock = gnosisQuery.data?.isMock || false;
  const gnosisError = gnosisQuery.data?.error || null;

  const driftMarkets = driftQuery.data?.markets || [];
  const driftLoading = driftQuery.isLoading;
  const isDriftMock = driftQuery.data?.isMock || false;
  const driftError = driftQuery.data?.error || null;

  const kalshiMarkets = kalshiQuery.data?.markets || [];
  const kalshiLoading = kalshiQuery.isLoading;
  const isKalshiMock = kalshiQuery.data?.isMock || false;
  const kalshiError = kalshiQuery.data?.error || null;

  const manifoldMarkets = manifoldQuery.data?.markets || [];
  const manifoldLoading = manifoldQuery.isLoading;
  const isManifoldMock = manifoldQuery.data?.isMock || false;
  const manifoldError = manifoldQuery.data?.error || null;

  const metaculusMarkets = metaculusQuery.data?.markets || [];
  const metaculusLoading = metaculusQuery.isLoading;
  const isMetaculusMock = metaculusQuery.data?.isMock || false;
  const metaculusError = metaculusQuery.data?.error || null;

  // Check if any query is fetching (for refresh button state)
  const refreshing = pancakeQuery.isFetching || overtimeQuery.isFetching ||
    speedQuery.isFetching || limitlessQuery.isFetching || azuroQuery.isFetching ||
    sxbetQuery.isFetching || gnosisQuery.isFetching || driftQuery.isFetching ||
    kalshiQuery.isFetching || manifoldQuery.isFetching || metaculusQuery.isFetching;

  // Manual refresh handler using React Query's refetch
  const handleRefresh = useCallback(async () => {
    // Invalidate all platform market queries to force refetch
    await queryClient.invalidateQueries({ queryKey: ['platform-markets'] });
  }, [queryClient]);

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
          <TabsTrigger
            value="azuro"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:border-cyan-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Azuro</span>
          </TabsTrigger>
          <TabsTrigger
            value="sxbet"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/10 data-[state=active]:to-teal-500/10 data-[state=active]:border-emerald-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm hidden sm:inline">SX Bet</span>
            <span className="font-medium text-xs sm:hidden">SX</span>
          </TabsTrigger>
          <TabsTrigger
            value="gnosis"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/10 data-[state=active]:to-green-500/10 data-[state=active]:border-emerald-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Compass className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Omen</span>
          </TabsTrigger>
          <TabsTrigger
            value="drift"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-cyan-500/10 data-[state=active]:border-blue-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Waves className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Drift</span>
          </TabsTrigger>
          <TabsTrigger
            value="kalshi"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-indigo-500/10 data-[state=active]:border-purple-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Kalshi</span>
          </TabsTrigger>
          <TabsTrigger
            value="manifold"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/10 data-[state=active]:to-orange-500/10 data-[state=active]:border-amber-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <TrendingIcon className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Manifold</span>
          </TabsTrigger>
          <TabsTrigger
            value="metaculus"
            className="flex-1 min-w-[80px] gap-1.5 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500/10 data-[state=active]:to-pink-500/10 data-[state=active]:border-rose-500/30"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Microscope className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs sm:text-sm">Metaculus</span>
          </TabsTrigger>
        </TabsList>

        {/* PancakeSwap Tab */}
        <TabsContent value="pancake" className="mt-4">
          {/* Error alert */}
          {pancakeError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {pancakeError}
              </AlertDescription>
            </Alert>
          )}
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
                  onBetPlaced={() => pancakeQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Speed Markets Tab */}
        <TabsContent value="speed" className="mt-4">
          {/* Error alert */}
          {speedError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {speedError}
              </AlertDescription>
            </Alert>
          )}
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
                  onBetPlaced={() => speedQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="mt-4">
          {/* Error alert */}
          {overtimeError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {overtimeError}
              </AlertDescription>
            </Alert>
          )}
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
                  onBetPlaced={() => overtimeQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Limitless Tab */}
        <TabsContent value="limitless" className="mt-4">
          {/* Error alert */}
          {limitlessError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {limitlessError}
              </AlertDescription>
            </Alert>
          )}
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
                  onBetPlaced={() => limitlessQuery.refetch()}
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

        {/* Azuro Tab */}
        <TabsContent value="azuro" className="mt-4">
          {/* Error alert */}
          {azuroError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {azuroError}
              </AlertDescription>
            </Alert>
          )}
          {/* Mock data warning */}
          {isAzuroMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Azuro API unavailable.
              </AlertDescription>
            </Alert>
          )}
          {/* Info banner */}
          <Alert className="mb-4 border-cyan-500/30 bg-cyan-500/5">
            <Zap className="h-4 w-4 text-cyan-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Azuro Protocol:</span> Decentralized sports betting across Polygon, Gnosis, Arbitrum and more. Bet on real on-chain markets.
            </AlertDescription>
          </Alert>
          {azuroLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : azuroMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Azuro markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {azuroMarkets.map((market) => (
                <AzuroMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={() => azuroQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* SX Bet Tab */}
        <TabsContent value="sxbet" className="mt-4">
          {/* Error alert */}
          {sxbetError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {sxbetError}
              </AlertDescription>
            </Alert>
          )}
          {/* Mock data warning */}
          {isSXBetMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. SX Bet API unavailable.
              </AlertDescription>
            </Alert>
          )}
          {/* Info banner */}
          <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">SX Bet:</span> High-liquidity sports betting on the SX Network. Moneyline, spread, and total bets on major sports leagues.
            </AlertDescription>
          </Alert>
          {sxbetLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : sxbetMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active SX Bet markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sxbetMarkets.map((market) => (
                <SXBetMarketCard
                  key={market.id}
                  market={market}
                  walletAddress={address}
                  onBetPlaced={() => sxbetQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gnosis/Omen Tab */}
        <TabsContent value="gnosis" className="mt-4">
          {/* Error alert */}
          {gnosisError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {gnosisError}
              </AlertDescription>
            </Alert>
          )}
          {isGnosisMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Omen API unavailable.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
            <Compass className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Omen (Gnosis):</span> Decentralized prediction markets on Gnosis Chain with deep liquidity pools.
            </AlertDescription>
          </Alert>
          {gnosisLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : gnosisMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Compass className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Omen markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gnosisMarkets.map((market) => (
                <GenericMarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    title: market.title,
                    category: market.category,
                    outcomes: market.outcomes,
                    status: market.status,
                    volume: market.volume,
                    liquidity: market.liquidity,
                    resolvesAt: market.resolvesAt,
                  }}
                  platformId="gnosis"
                  walletAddress={address}
                  onBetPlaced={() => gnosisQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Drift Tab */}
        <TabsContent value="drift" className="mt-4">
          {/* Error alert */}
          {driftError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {driftError}
              </AlertDescription>
            </Alert>
          )}
          {isDriftMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Drift API unavailable.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-4 border-blue-500/30 bg-blue-500/5">
            <Waves className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Drift BET:</span> Prediction markets on Solana with perpetual-style betting mechanics.
            </AlertDescription>
          </Alert>
          {driftLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : driftMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Waves className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Drift markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {driftMarkets.map((market) => (
                <GenericMarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    title: market.title,
                    category: market.category,
                    outcomes: market.outcomes,
                    status: market.status,
                    volume: market.volume,
                    liquidity: market.liquidity,
                    resolvesAt: market.resolvesAt,
                  }}
                  platformId="drift"
                  walletAddress={address}
                  onBetPlaced={() => driftQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Kalshi Tab */}
        <TabsContent value="kalshi" className="mt-4">
          {/* Error alert */}
          {kalshiError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {kalshiError}
              </AlertDescription>
            </Alert>
          )}
          {isKalshiMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Kalshi API unavailable.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-4 border-purple-500/30 bg-purple-500/5">
            <Building2 className="h-4 w-4 text-purple-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Kalshi:</span> CFTC-regulated prediction exchange for US events - politics, economics, weather and more.
            </AlertDescription>
          </Alert>
          {kalshiLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : kalshiMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Kalshi markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kalshiMarkets.map((market) => (
                <GenericMarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    title: market.title,
                    category: market.category,
                    outcomes: market.outcomes,
                    status: market.status,
                    volume: market.volume,
                    resolvesAt: market.resolvesAt,
                  }}
                  platformId="kalshi"
                  walletAddress={address}
                  onBetPlaced={() => kalshiQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manifold Tab */}
        <TabsContent value="manifold" className="mt-4">
          {/* Error alert */}
          {manifoldError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {manifoldError}
              </AlertDescription>
            </Alert>
          )}
          {isManifoldMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Manifold API unavailable.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
            <TrendingIcon className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Manifold Markets:</span> Play-money prediction markets on anything. Great for practicing with no risk.
            </AlertDescription>
          </Alert>
          {manifoldLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : manifoldMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <TrendingIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Manifold markets</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {manifoldMarkets.map((market) => (
                <GenericMarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    title: market.title,
                    category: market.category,
                    outcomes: market.outcomes,
                    status: market.status,
                    volume: market.volume,
                    resolvesAt: market.resolvesAt,
                  }}
                  platformId="manifold"
                  walletAddress={address}
                  onBetPlaced={() => manifoldQuery.refetch()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Metaculus Tab */}
        <TabsContent value="metaculus" className="mt-4">
          {/* Error alert */}
          {metaculusError && (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {metaculusError}
              </AlertDescription>
            </Alert>
          )}
          {isMetaculusMock && (
            <Alert className="mb-4 border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-sm">
                Showing demonstration data. Metaculus API unavailable.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-4 border-rose-500/30 bg-rose-500/5">
            <Microscope className="h-4 w-4 text-rose-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Metaculus:</span> Science and technology forecasting platform with expert-calibrated predictions.
            </AlertDescription>
          </Alert>
          {metaculusLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : metaculusMarkets.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Microscope className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No active Metaculus questions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metaculusMarkets.map((market) => (
                <GenericMarketCard
                  key={market.id}
                  market={{
                    id: market.id,
                    title: market.title,
                    category: market.category,
                    outcomes: market.outcomes,
                    status: market.status,
                    resolvesAt: market.resolvesAt,
                  }}
                  platformId="metaculus"
                  walletAddress={address}
                  onBetPlaced={() => metaculusQuery.refetch()}
                />
              ))}
            </div>
          )}
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
