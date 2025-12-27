'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import { PancakeBetModal } from './PancakeBetModal';
import { TrendingUp, TrendingDown, ExternalLink, Zap, Clock } from 'lucide-react';

interface PancakeMarketCardProps {
  market: PancakePredictionMarket;
}

// Asset icon colors
const assetColors: Record<string, { bg: string; text: string; glow: string }> = {
  BNBUSD: { bg: 'from-amber-500 to-yellow-500', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  BTCUSD: { bg: 'from-orange-500 to-amber-500', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  ETHUSD: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  CAKEUSD: { bg: 'from-cyan-500 to-teal-500', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
};

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
  const colors = assetColors[market.asset] || assetColors.BNBUSD;
  const isUrgent = isLive && timeRemaining <= 60;

  const statusStyles: Record<string, string> = {
    live: 'bg-success/20 text-success border-success/30',
    locked: 'bg-warning/20 text-warning border-warning/30',
    calculating: 'bg-primary/20 text-primary border-primary/30',
    closed: 'bg-muted/50 text-muted-foreground border-muted',
  };

  return (
    <Card className={`group relative border-border/50 transition-all duration-300 overflow-hidden ${
      isLive
        ? 'hover:border-success/50 hover:shadow-lg hover:shadow-success/10'
        : 'hover:border-border'
    }`}>
      {/* Live indicator glow */}
      {isLive && (
        <div className="absolute inset-0 bg-gradient-to-b from-success/5 to-transparent pointer-events-none" />
      )}

      <CardContent className="p-0 relative">
        {/* Header with Timer */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg ${colors.glow}`}>
              <span className="text-white font-bold text-sm">{market.asset.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold">{market.asset}</p>
              <p className="text-xs text-muted-foreground font-mono">#{market.currentEpoch}</p>
            </div>
          </div>

          {isLive && timeRemaining > 0 ? (
            <div className="text-right">
              <div className={`flex items-center gap-1.5 ${isUrgent ? 'animate-pulse' : ''}`}>
                <Clock className={`w-4 h-4 ${isUrgent ? 'text-warning' : 'text-success'}`} />
                <p className={`text-2xl font-mono font-bold ${isUrgent ? 'text-warning' : 'text-success'}`}>
                  {formatTime()}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">remaining</p>
            </div>
          ) : (
            <Badge variant="outline" className={`${statusStyles[market.status]} text-xs font-medium`}>
              {market.status === 'calculating' ? 'Calculating...' : market.status.charAt(0).toUpperCase() + market.status.slice(1)}
            </Badge>
          )}
        </div>

        {/* Combined UP/DOWN Bar */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-semibold">UP {bullPercent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-destructive font-semibold">{bearPercent.toFixed(0)}% DOWN</span>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
          </div>

          {/* Visual Split Bar - Improved */}
          <div className="h-4 rounded-full overflow-hidden flex bg-muted/20 shadow-inner">
            <div
              className="bg-gradient-to-r from-success to-emerald-400 transition-all duration-500 relative"
              style={{ width: `${bullPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
            <div
              className="bg-gradient-to-r from-rose-500 to-destructive transition-all duration-500 relative"
              style={{ width: `${bearPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>

          {/* Volume under bars */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span className="font-mono">{formatVolume(market.bullAmount)} BNB</span>
            <span className="font-mono">{formatVolume(market.bearAmount)} BNB</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between text-xs bg-muted/10">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Pool:</span>
            <span className="font-semibold">{formatVolume(market.totalVolume)} BNB</span>
          </div>
          <span className="text-muted-foreground">{market.totalBets} bets</span>
          {market.lockPrice && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Lock:</span>
              <span className="font-semibold">${market.lockPrice.toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="px-4 pb-4 pt-3 flex gap-2">
          <Button
            onClick={() => setIsBetModalOpen(true)}
            disabled={!isLive}
            className={`flex-1 h-10 font-semibold transition-all ${
              isLive
                ? 'bg-gradient-to-r from-success to-emerald-500 hover:from-success hover:to-emerald-400 shadow-lg shadow-success/25'
                : ''
            }`}
            size="sm"
          >
            {isLive ? (
              <>
                <Zap className="w-4 h-4 mr-1.5" />
                Place Bet
              </>
            ) : (
              'Closed'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
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
