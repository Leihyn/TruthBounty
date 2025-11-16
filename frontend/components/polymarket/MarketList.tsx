'use client';

import { useState, useEffect } from 'react';
import { MarketCard } from './MarketCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SimpleEmptyState } from '@/components/SimpleEmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PolymarketMarket,
  fetchTrendingMarkets,
  fetchActiveMarkets,
  searchPolymarkets,
} from '@/lib/polymarket';
import { Search, TrendingUp, Activity, RefreshCw } from 'lucide-react';

interface MarketListProps {
  onSelectMarket?: (market: PolymarketMarket) => void;
  limit?: number;
  showSearch?: boolean;
  defaultView?: 'trending' | 'active';
}

export function MarketList({
  onSelectMarket,
  limit = 10,
  showSearch = true,
  defaultView = 'trending',
}: MarketListProps) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'active'>(defaultView);
  const [refreshing, setRefreshing] = useState(false);

  const loadMarkets = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let data: PolymarketMarket[];

      if (searchQuery.trim()) {
        data = await searchPolymarkets(searchQuery, limit);
      } else if (activeTab === 'trending') {
        data = await fetchTrendingMarkets(limit);
      } else {
        data = await fetchActiveMarkets(limit);
      }

      setMarkets(data);
    } catch (err) {
      console.error('Error loading markets:', err);
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, [activeTab, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarkets();
  };

  const handleRefresh = () => {
    loadMarkets(true);
  };

  if (loading && !refreshing) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <SimpleEmptyState
        title="Failed to load markets"
        description={error}
        action={
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
        )}
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </Button>
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'trending' | 'active')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Market Cards */}
      {markets.length === 0 ? (
        <SimpleEmptyState
          title="No markets found"
          description={
            searchQuery
              ? 'Try a different search term'
              : 'No markets available at the moment'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onSelect={onSelectMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
