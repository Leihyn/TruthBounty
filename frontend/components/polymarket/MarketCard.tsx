'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PolymarketMarket } from '@/lib/polymarket';
import { TrendingUp, Clock, DollarSign, ExternalLink } from 'lucide-react';

interface MarketCardProps {
  market: PolymarketMarket;
  onSelect?: (market: PolymarketMarket) => void;
  showActions?: boolean;
}

// Helper function to get Polymarket URL
function getPolymarketUrl(market: PolymarketMarket): string | null {
  // Try event slug first (most reliable)
  if (market.events && market.events.length > 0 && market.events[0].slug) {
    return `https://polymarket.com/event/${market.events[0].slug}`;
  }

  // Try market slug
  if (market.marketSlug) {
    return `https://polymarket.com/event/${market.marketSlug}`;
  }

  // Try question ID
  if (market.questionID) {
    return `https://polymarket.com/event/${market.questionID}`;
  }

  // Fallback to just Polymarket homepage
  return 'https://polymarket.com';
}

export function MarketCard({ market, onSelect, showActions = true }: MarketCardProps) {
  // Parse outcomes and prices (API returns them as JSON strings)
  const outcomes = typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
  const prices = typeof market.outcomePrices === 'string' ? JSON.parse(market.outcomePrices) : market.outcomePrices;

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-blue-400';
    if (probability >= 50) return 'text-amber-400';
    if (probability >= 30) return 'text-amber-500';
    return 'text-red-400';
  };

  const getStatusBadge = () => {
    if (market.archived) {
      return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 font-teko">ARCHIVED</Badge>;
    }
    if (market.closed) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 font-teko">CLOSED</Badge>;
    }
    if (market.active) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-400 font-teko">LIVE</Badge>;
    }
    return null;
  };

  const probabilities = Array.isArray(prices) ? prices.map(price => parseFloat(price) * 100) : [];

  const openPolymarket = () => {
    const url = getPolymarketUrl(market);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card
      className="border-2 border-blue-500/20 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 cursor-pointer"
      onClick={openPolymarket}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bebas tracking-wide uppercase line-clamp-2">
            {market.question}
          </CardTitle>
          {getStatusBadge()}
        </div>
        {market.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {market.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcomes */}
        <div className="space-y-3">
          {(Array.isArray(outcomes) ? outcomes : []).map((outcome, index) => {
            const probability = probabilities[index];
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{outcome}</span>
                  <span className={`font-teko text-lg font-bold ${getProbabilityColor(probability)}`}>
                    {probability.toFixed(1)}%
                  </span>
                </div>
                <Progress value={probability} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-semibold">{formatVolume(market.volumeNum)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Liquidity</p>
              <p className="font-semibold">{formatVolume(market.liquidityNum)}</p>
            </div>
          </div>
        </div>

        {market.endDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Clock className="w-4 h-4" />
            <span>
              Ends: {new Date(market.endDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Tags */}
        {market.tags && market.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {market.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onSelect && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market);
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 font-bebas tracking-wider"
              >
                VIEW DETAILS
              </Button>
            )}
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                const url = getPolymarketUrl(market);
                if (url) {
                  window.open(url, '_blank');
                }
              }}
              className="border-blue-500/50 hover:bg-blue-500/10 font-bebas tracking-wider px-4"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              BET NOW
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
