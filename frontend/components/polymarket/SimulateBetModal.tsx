'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PolymarketMarket } from '@/lib/polymarket';
import { TrendingUp, TrendingDown, Activity, Zap, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SimulateBetModalProps {
  market: PolymarketMarket | null;
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  onSuccess?: () => void;
}

export function SimulateBetModal({
  market,
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}: SimulateBetModalProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [betOutcome, setBetOutcome] = useState<'Yes' | 'No'>('Yes');
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!market) return null;

  // Parse prices
  const prices = typeof market.outcomePrices === 'string'
    ? JSON.parse(market.outcomePrices).map((p: string) => parseFloat(p))
    : market.outcomePrices?.map((p: any) => parseFloat(p)) || [0.5, 0.5];

  const yesPrice = prices[0] || 0.5;
  const noPrice = prices[1] || 0.5;
  const selectedPrice = betOutcome === 'Yes' ? yesPrice : noPrice;

  // Calculate potential payout
  const amount = parseFloat(betAmount) || 0;
  const potentialPayout = amount / selectedPrice;
  const potentialProfit = potentialPayout - amount;

  const handlePlaceBet = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (amount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setIsPlacing(true);
    setError(null);

    try {
      const res = await fetch('/api/polymarket/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower: walletAddress,
          marketId: market.conditionId || market.id,
          marketQuestion: market.question,
          outcomeSelected: betOutcome,
          amountUsd: amount,
          priceAtEntry: selectedPrice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        onSuccess?.();
        // Don't auto-close - let user see confirmation and click Dashboard link
      } else {
        setError(data.message || 'Failed to place simulated bet');
      }
    } catch (err) {
      console.error('Error placing bet:', err);
      setError('Failed to place bet. Try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Simulate trade
          </DialogTitle>
          <DialogDescription>
            Place a simulated bet on this market. No real money involved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Market Info */}
          <div className="p-3 rounded-lg bg-surface border border-border/50">
            <p className="font-medium text-sm leading-tight">{market.question}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {formatVolume(market.volumeNum)} vol
              </Badge>
              {market.endDate && (
                <Badge variant="outline" className="text-xs">
                  Ends {new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Badge>
              )}
            </div>
          </div>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label>Select outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={betOutcome === 'Yes' ? 'default' : 'outline'}
                className={`h-16 flex-col ${betOutcome === 'Yes' ? 'bg-success hover:bg-success/90 border-success' : 'hover:border-success/50'}`}
                onClick={() => setBetOutcome('Yes')}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="font-bold">Yes</span>
                <span className="text-xs opacity-80">{(yesPrice * 100).toFixed(0)}¢</span>
              </Button>
              <Button
                type="button"
                variant={betOutcome === 'No' ? 'default' : 'outline'}
                className={`h-16 flex-col ${betOutcome === 'No' ? 'bg-destructive hover:bg-destructive/90 border-destructive' : 'hover:border-destructive/50'}`}
                onClick={() => setBetOutcome('No')}
              >
                <TrendingDown className="h-5 w-5 mb-1" />
                <span className="font-bold">No</span>
                <span className="text-xs opacity-80">{(noPrice * 100).toFixed(0)}¢</span>
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (virtual USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                max="1000"
                step="1"
                className="pl-9"
                placeholder="10"
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 25, 50, 100].map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setBetAmount(amt.toString())}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Potential Payout */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-success/5 to-primary/5 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">If {betOutcome} wins:</span>
              <div className="text-right">
                <p className="text-lg font-bold text-success">${potentialPayout.toFixed(2)}</p>
                <p className="text-xs text-success/80">+${potentialProfit.toFixed(2)} profit</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Success */}
          {success && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                <h3 className="font-semibold">Bet placed!</h3>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border/50 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className={betOutcome === 'Yes' ? 'text-success font-medium' : 'text-destructive font-medium'}>{betOutcome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry price:</span>
                  <span className="font-mono">{(selectedPrice * 100).toFixed(0)}¢</span>
                </div>
              </div>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  View in Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handlePlaceBet}
            disabled={isPlacing || !walletAddress || success}
            className="w-full h-12"
          >
            {isPlacing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Placing bet...
              </>
            ) : !walletAddress ? (
              'Connect wallet to simulate'
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Simulate ${betAmount} on {betOutcome}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
