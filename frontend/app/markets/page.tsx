'use client';

import { useState, useEffect } from 'react';
import { MarketList } from '@/components/polymarket/MarketList';
import { MarketDetailModal } from '@/components/polymarket/MarketDetailModal';
import { PancakeMarketCard } from '@/components/pancakeswap/PancakeMarketCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PolymarketMarket } from '@/lib/polymarket';
import { PancakePredictionMarket, fetchPancakeMarkets } from '@/lib/pancakeswap';
import { AlertTriangle, Timer, BarChart3, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MarketsPage() {
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Stats
  const liveCount = pancakeMarkets.filter(m => m.status === 'live').length;
  const totalVolume = pancakeMarkets.reduce((sum, m) => sum + m.totalVolume, 0);

  return (
    <div className="container px-4 md:px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Markets</h1>
          <p className="text-sm text-muted-foreground">Live prediction markets</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="font-semibold">{liveCount}</span>
            <span className="text-muted-foreground hidden sm:inline">live</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">30s refresh</span>
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
        <TabsList className="w-full h-11 p-1">
          <TabsTrigger value="pancake" className="flex-1 gap-2">
            <Timer className="w-4 h-4" />
            <span>PancakeSwap</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
              {pancakeMarkets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="polymarket" className="flex-1 gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Polymarket</span>
          </TabsTrigger>
        </TabsList>

        {/* PancakeSwap Tab */}
        <TabsContent value="pancake" className="mt-4">
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
                <PancakeMarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Polymarket Tab */}
        <TabsContent value="polymarket" className="mt-4">
          <MarketList onSelectMarket={handleSelectMarket} limit={12} />
        </TabsContent>
      </Tabs>

      {/* Market Detail Modal */}
      <MarketDetailModal
        market={selectedMarket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
