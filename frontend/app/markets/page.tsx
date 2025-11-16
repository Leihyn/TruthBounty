'use client';

import { useState, useEffect } from 'react';
import { MarketList } from '@/components/polymarket/MarketList';
import { MarketDetailModal } from '@/components/polymarket/MarketDetailModal';
import { PancakeMarketCard } from '@/components/pancakeswap/PancakeMarketCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PolymarketMarket } from '@/lib/polymarket';
import { PancakePredictionMarket, fetchPancakeMarkets } from '@/lib/pancakeswap';
import { TrendingUp } from 'lucide-react';

export default function MarketsPage() {
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pancakeMarkets, setPancakeMarkets] = useState<PancakePredictionMarket[]>([]);
  const [pancakeLoading, setPancakeLoading] = useState(true);

  useEffect(() => {
    loadPancakeMarkets();
    // Refresh every 30 seconds
    const interval = setInterval(loadPancakeMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadPancakeMarkets() {
    try {
      const markets = await fetchPancakeMarkets();
      setPancakeMarkets(markets);
    } catch (error) {
      console.error('Error loading PancakeSwap markets:', error);
    } finally {
      setPancakeLoading(false);
    }
  }

  const handleSelectMarket = (market: PolymarketMarket) => {
    setSelectedMarket(market);
    setIsModalOpen(true);
  };

  return (
    <div className="container px-4 py-6 md:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-blue-600 shadow-2xl flex items-center justify-center shadow-red-500/50">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bebas tracking-wider uppercase bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 bg-clip-text text-transparent">Prediction Markets</h1>
            <p className="text-muted-foreground">
              Track live predictions from PancakeSwap and Polymarket
            </p>
          </div>
        </div>
      </div>

      {/* PancakeSwap Prediction Markets */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bebas text-lg">P</span>
          </div>
          <div>
            <h2 className="text-2xl font-bebas tracking-wider uppercase text-amber-400">
              PancakeSwap Predictions
            </h2>
            <p className="text-sm text-muted-foreground">5-minute price prediction rounds on BSC</p>
          </div>
        </div>

        {pancakeLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        ) : pancakeMarkets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pancakeMarkets.map((market) => (
              <PancakeMarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <Card className="border-amber-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No PancakeSwap predictions available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Polymarket Markets */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center shadow-red-500/50">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bebas tracking-wider uppercase text-blue-400">
              Polymarket Predictions
            </h2>
            <p className="text-sm text-muted-foreground">Event-based prediction markets</p>
          </div>
        </div>
        <MarketList onSelectMarket={handleSelectMarket} limit={12} />
      </div>

      {/* Market Detail Modal */}
      <MarketDetailModal
        market={selectedMarket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
