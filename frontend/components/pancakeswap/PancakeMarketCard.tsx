'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import { PancakeBetModal } from './PancakeBetModal';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface PancakeMarketCardProps {
  market: PancakePredictionMarket;
}

export function PancakeMarketCard({ market }: PancakeMarketCardProps) {
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(market.timeRemaining);

  // Live countdown timer
  useEffect(() => {
    if (market.status !== 'live' || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [market.status, timeRemaining]);

  useEffect(() => {
    setTimeRemaining(market.timeRemaining);
  }, [market.timeRemaining]);

  const formatVolume = (volume: number) => {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(2);
  };

  const formatTime = () => {
    if (timeRemaining <= 0) return '0:00';
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLive = market.status === 'live';
  const bullPercent = market.bullProbability;
  const bearPercent = market.bearProbability;

  const statusStyles: Record<string, string> = {
    live: 'bg-success text-success-foreground',
    locked: 'bg-warning text-warning-foreground',
    calculating: 'bg-info text-white',
    closed: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className={`border-border/50 transition-all ${isLive ? 'hover:border-success/50' : ''}`}>
      <CardContent className="p-0">
        {/* Header with Timer */}
        <div className={`px-4 py-3 flex items-center justify-between ${isLive ? 'bg-success/10' : 'bg-muted/30'}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-bold text-xs">P</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{market.asset}</p>
              <p className="text-[10px] text-muted-foreground">#{market.currentEpoch}</p>
            </div>
          </div>

          {isLive && timeRemaining > 0 ? (
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-success">{formatTime()}</p>
              <p className="text-[10px] text-muted-foreground uppercase">remaining</p>
            </div>
          ) : (
            <Badge className={`${statusStyles[market.status]} text-[10px]`}>
              {market.status.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Combined UP/DOWN Bar */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-success font-medium">UP {bullPercent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-destructive font-medium">{bearPercent.toFixed(0)}% DOWN</span>
              <TrendingDown className="w-3 h-3 text-destructive" />
            </div>
          </div>

          {/* Visual Split Bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-muted/30">
            <div
              className="bg-success transition-all duration-300"
              style={{ width: `${bullPercent}%` }}
            />
            <div
              className="bg-destructive transition-all duration-300"
              style={{ width: `${bearPercent}%` }}
            />
          </div>

          {/* Volume under bars */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
            <span>{formatVolume(market.bullAmount)} BNB</span>
            <span>{formatVolume(market.bearAmount)} BNB</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>Pool: {formatVolume(market.totalVolume)} BNB</span>
          <span>{market.totalBets} bets</span>
          {market.lockPrice && <span>Lock: ${market.lockPrice.toFixed(0)}</span>}
        </div>

        {/* Action */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <Button
            onClick={() => setIsBetModalOpen(true)}
            disabled={!isLive}
            className="flex-1 h-9"
            size="sm"
          >
            {isLive ? 'Place Bet' : 'Closed'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => window.open('https://pancakeswap.finance/prediction', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <PancakeBetModal
        market={market}
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
      />
    </Card>
  );
}
