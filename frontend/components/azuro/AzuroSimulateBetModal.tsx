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
import { AzuroPredictionMarket } from '@/lib/azuro';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  DollarSign,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

interface AzuroSimulateBetModalProps {
  market: AzuroPredictionMarket | null;
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  onSuccess?: () => void;
}

export function AzuroSimulateBetModal({
  market,
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}: AzuroSimulateBetModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [amount, setAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!market) return null;

  const handleSubmit = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (selectedOutcome === null) {
      setError('Please select an outcome');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < 1) {
      setError('Minimum bet is $1');
      return;
    }

    if (amountNum > 1000) {
      setError('Maximum simulated bet is $1000');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const outcome = market.outcomes[selectedOutcome];
      const response = await fetch('/api/azuro/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          conditionId: market.conditionId,
          gameId: market.gameId,
          sport: market.sport,
          league: market.league,
          title: market.title,
          outcomeId: outcome.id,
          outcomeLabel: outcome.name,
          amount: amount,
          odds: outcome.odds,
          startsAt: market.startsAt,
          network: market.network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setSuccess(true);
      onSuccess?.();
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
      setSelectedOutcome(null);
      onClose();
    }
  };

  // Calculate potential returns
  const amountNum = parseFloat(amount) || 0;
  const selectedOdds = selectedOutcome !== null ? market.outcomes[selectedOutcome].odds : 0;
  const potentialPayout = amountNum * selectedOdds;
  const potentialProfit = potentialPayout - amountNum;

  const canBet = market.status === 'active' || market.status === 'upcoming';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Simulate Azuro bet
          </DialogTitle>
          <DialogDescription>
            Practice trading on {market.sport} with no real money at risk
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Bet placed!</h3>
              <p className="text-sm text-muted-foreground">
                Your simulated bet on{' '}
                <span className="font-medium text-foreground">
                  {market.outcomes[selectedOutcome!].name}
                </span>{' '}
                has been recorded
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border/50 text-left">
              <p className="text-xs text-muted-foreground mb-2">Your bet details:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium truncate ml-2">{market.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selection:</span>
                  <span className="text-success font-medium">{market.outcomes[selectedOutcome!].name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odds:</span>
                  <span className="font-mono">{selectedOdds.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential payout:</span>
                  <span className="font-mono text-success">${potentialPayout.toFixed(2)}</span>
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
            {/* Match Info */}
            <div className="p-3 rounded-lg bg-surface border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">{market.league}</Badge>
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">{market.network}</Badge>
              </div>
              <p className="font-semibold text-center">
                {market.title}
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {new Date(market.startsAt * 1000).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Outcome Selection */}
            <div className="space-y-2">
              <Label>Select outcome</Label>
              <div className={`grid gap-2 ${market.outcomes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {market.outcomes.map((outcome, index) => (
                  <button
                    key={outcome.id}
                    onClick={() => setSelectedOutcome(index)}
                    disabled={!canBet}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedOutcome === index
                        ? index === 0
                          ? 'border-success bg-success/10'
                          : index === market.outcomes.length - 1
                          ? 'border-destructive bg-destructive/10'
                          : 'border-cyan-500 bg-cyan-500/10'
                        : 'border-border/50 hover:border-cyan-500/50'
                    } ${!canBet ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className={`font-semibold text-sm truncate ${
                      selectedOutcome === index
                        ? index === 0
                          ? 'text-success'
                          : index === market.outcomes.length - 1
                          ? 'text-destructive'
                          : 'text-cyan-400'
                        : ''
                    }`}>
                      {outcome.name}
                    </p>
                    <p className="text-lg font-bold font-mono mt-1">
                      {outcome.odds.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {((1 / outcome.odds) * 100).toFixed(0)}% implied
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="1000"
                  step="1"
                  className="pl-9"
                  placeholder="10"
                />
              </div>
              <div className="flex gap-2">
                {[5, 10, 25, 50, 100].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1 h-7 text-xs"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Potential Return */}
            {selectedOutcome !== null && amountNum > 0 && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-success/5 to-cyan-500/5 border border-success/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm">If {market.outcomes[selectedOutcome].name} wins:</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">${potentialPayout.toFixed(2)}</p>
                    <p className="text-xs text-success/80">+${potentialProfit.toFixed(2)} profit</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Warning for non-bettable */}
            {!canBet && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This event has {market.status}. You can only bet on active events.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedOutcome === null || !walletAddress || !canBet}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
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
