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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface PancakeSimulateBetModalProps {
  market: PancakePredictionMarket | null;
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  onSuccess?: () => void;
}

export function PancakeSimulateBetModal({
  market,
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}: PancakeSimulateBetModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<'Bull' | 'Bear' | null>(null);
  const [amount, setAmount] = useState('0.01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!market) return null;

  const handleSubmit = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedPosition) {
      setError('Please select Bull or Bear');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < 0.001) {
      setError('Minimum bet is 0.001 BNB');
      return;
    }

    if (amountNum > 10) {
      setError('Maximum simulated bet is 10 BNB');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/pancakeswap/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          epoch: market.epoch,
          position: selectedPosition,
          amount: amount,
          lockPrice: market.lockPrice,
          asset: 'BNB',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setSuccess(true);
      onSuccess?.();
      // Don't auto-close - let user click "View in Dashboard" or close manually
    } catch (err: any) {
      setError(err.message || 'Failed to place simulated bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setSuccess(false);
      setSelectedPosition(null);
      onClose();
    }
  };

  // Calculate potential returns
  const amountNum = parseFloat(amount) || 0;
  const bullMultiplier = market.bullAmount > 0
    ? (market.bullAmount + market.bearAmount) / market.bullAmount
    : 2;
  const bearMultiplier = market.bearAmount > 0
    ? (market.bullAmount + market.bearAmount) / market.bearAmount
    : 2;

  const potentialWinBull = amountNum * (bullMultiplier - 1) * 0.97; // 3% fee
  const potentialWinBear = amountNum * (bearMultiplier - 1) * 0.97;

  const timeLeft = market.lockTimestamp
    ? Math.max(0, market.lockTimestamp - Math.floor(Date.now() / 1000))
    : 0;
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Simulate bet on Epoch {market.epoch}
          </DialogTitle>
          <DialogDescription>
            Practice trading with no real money at risk
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Bet placed!</h3>
              <p className="text-sm text-muted-foreground">
                Your simulated <span className={selectedPosition === 'Bull' ? 'text-success' : 'text-destructive'}>{selectedPosition}</span> bet of {amount} BNB on Epoch #{market.epoch} has been recorded
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border/50 text-left">
              <p className="text-xs text-muted-foreground mb-2">Your bet details:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className={selectedPosition === 'Bull' ? 'text-success font-medium' : 'text-destructive font-medium'}>{selectedPosition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">{amount} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Epoch:</span>
                  <span className="font-mono">#{market.epoch}</span>
                </div>
              </div>
            </div>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                View in Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Market Info */}
            <div className="p-3 rounded-lg bg-surface border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Round</span>
                <Badge variant="outline" className="font-mono">#{market.epoch}</Badge>
              </div>
              {market.lockPrice && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Lock price</span>
                  <span className="font-mono text-sm">${market.lockPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prize pool</span>
                <span className="font-mono text-sm">{market.totalVolume.toFixed(2)} BNB</span>
              </div>
              {market.status === 'live' && timeLeft > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Time left
                  </span>
                  <span className="font-mono text-sm text-warning">
                    {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Position Selection */}
            <div className="space-y-2">
              <Label>Select position</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPosition('Bull')}
                  disabled={market.status !== 'live'}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPosition === 'Bull'
                      ? 'border-success bg-success/10'
                      : 'border-border/50 hover:border-success/50'
                  } ${market.status !== 'live' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${
                    selectedPosition === 'Bull' ? 'text-success' : 'text-muted-foreground'
                  }`} />
                  <p className="font-semibold text-success">BULL</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bullMultiplier.toFixed(2)}x payout
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {market.bullAmount.toFixed(2)} BNB
                  </p>
                </button>

                <button
                  onClick={() => setSelectedPosition('Bear')}
                  disabled={market.status !== 'live'}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPosition === 'Bear'
                      ? 'border-destructive bg-destructive/10'
                      : 'border-border/50 hover:border-destructive/50'
                  } ${market.status !== 'live' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${
                    selectedPosition === 'Bear' ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                  <p className="font-semibold text-destructive">BEAR</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bearMultiplier.toFixed(2)}x payout
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {market.bearAmount.toFixed(2)} BNB
                  </p>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Simulated amount (BNB)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.001"
                  max="10"
                  step="0.01"
                  placeholder="0.01"
                />
                <div className="flex gap-1">
                  {['0.01', '0.05', '0.1'].map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(preset)}
                      className="px-2 text-xs"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Potential Return */}
            {selectedPosition && amountNum > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Potential win</span>
                  <span className={`font-mono font-bold ${
                    selectedPosition === 'Bull' ? 'text-success' : 'text-destructive'
                  }`}>
                    +{(selectedPosition === 'Bull' ? potentialWinBull : potentialWinBear).toFixed(4)} BNB
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  If {selectedPosition === 'Bull' ? 'price goes UP' : 'price goes DOWN'} (after 3% fee)
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Warning for non-live */}
            {market.status !== 'live' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This round is {market.status}. You can only bet on live rounds.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPosition || !walletAddress || market.status !== 'live'}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing bet...
                </>
              ) : !walletAddress ? (
                'Connect wallet first'
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Place simulated bet
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              This is a simulation. No real funds are used.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
