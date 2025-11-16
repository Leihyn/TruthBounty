'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import { PancakeBetModal } from './PancakeBetModal';
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, Wallet } from 'lucide-react';

interface PancakeMarketCardProps {
  market: PancakePredictionMarket;
}

export function PancakeMarketCard({ market }: PancakeMarketCardProps) {
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K BNB`;
    }
    return `${volume.toFixed(2)} BNB`;
  };

  const getStatusBadge = () => {
    switch (market.status) {
      case 'live':
        return <Badge className="bg-green-500/20 text-green-400 font-teko border-green-500/30">LIVE</Badge>;
      case 'locked':
        return <Badge className="bg-amber-500/20 text-amber-400 font-teko border-amber-500/30">LOCKING</Badge>;
      case 'calculating':
        return <Badge className="bg-blue-500/20 text-blue-400 font-teko border-blue-500/30">CALCULATING</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/20 text-slate-400 font-teko border-slate-500/30">CLOSED</Badge>;
      default:
        return null;
    }
  };

  const formatTimeRemaining = () => {
    if (market.timeRemaining <= 0) {
      return 'Calculating result...';
    }
    const minutes = Math.floor(market.timeRemaining / 60);
    const seconds = market.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  const bullWinning = market.bullProbability > market.bearProbability;
  const bearWinning = market.bearProbability > market.bullProbability;

  return (
    <Card className="border-2 border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 bg-gradient-to-br from-amber-950/20 to-orange-950/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* PancakeSwap Logo Indicator */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bebas text-xs">P</span>
            </div>
            <div>
              <CardTitle className="text-lg font-bebas tracking-wide uppercase">
                {market.asset}
              </CardTitle>
              <p className="text-xs text-muted-foreground">PancakeSwap Prediction</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {market.question}
        </p>
        <p className="text-xs text-amber-400 font-teko">
          Round #{market.currentEpoch}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Remaining */}
        {market.timeRemaining > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-teko text-amber-400">
              {formatTimeRemaining()}
            </span>
          </div>
        )}

        {/* UP (Bull) Outcome */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${bullWinning ? 'text-green-400' : 'text-slate-400'}`} />
              <span className="font-medium">UP (Bull)</span>
            </div>
            <span className={`font-teko text-lg font-bold ${bullWinning ? 'text-green-400' : 'text-slate-400'}`}>
              {market.bullProbability.toFixed(1)}%
            </span>
          </div>
          <Progress value={market.bullProbability} className="h-2 bg-slate-800" />
          <p className="text-xs text-muted-foreground">
            Pool: {formatVolume(market.bullAmount)} ({market.bullProbability.toFixed(1)}%)
          </p>
        </div>

        {/* DOWN (Bear) Outcome */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className={`w-4 h-4 ${bearWinning ? 'text-red-400' : 'text-slate-400'}`} />
              <span className="font-medium">DOWN (Bear)</span>
            </div>
            <span className={`font-teko text-lg font-bold ${bearWinning ? 'text-red-400' : 'text-slate-400'}`}>
              {market.bearProbability.toFixed(1)}%
            </span>
          </div>
          <Progress value={market.bearProbability} className="h-2 bg-slate-800" />
          <p className="text-xs text-muted-foreground">
            Pool: {formatVolume(market.bearAmount)} ({market.bearProbability.toFixed(1)}%)
          </p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Pool</p>
              <p className="font-semibold font-teko">{formatVolume(market.totalVolume)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Bets</p>
              <p className="font-semibold font-teko">{market.totalBets}</p>
            </div>
          </div>
        </div>

        {/* Lock Price */}
        {market.lockPrice && (
          <div className="text-xs text-muted-foreground border-t border-amber-500/20 pt-2">
            <span>Lock Price: </span>
            <span className="font-teko text-amber-400">${market.lockPrice.toFixed(2)}</span>
          </div>
        )}

        {/* Bet Button */}
        <div className="pt-2 space-y-2">
          <Button
            onClick={() => setIsBetModalOpen(true)}
            disabled={market.status !== 'live'}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-800"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {market.status === 'live' ? 'Place Bet' : 'Betting Closed'}
          </Button>

          <a
            href="https://pancakeswap.finance/prediction"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 underline flex items-center justify-center gap-1"
          >
            View on PancakeSwap
            <span>↗</span>
          </a>
        </div>
      </CardContent>

      {/* Bet Modal */}
      <PancakeBetModal
        market={market}
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
      />
    </Card>
  );
}
