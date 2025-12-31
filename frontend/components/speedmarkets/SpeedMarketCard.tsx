'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SpeedMarketDisplay, SPEED_MARKETS_CONFIG } from '@/lib/speedmarkets';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Zap,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface SpeedMarketCardProps {
  market: SpeedMarketDisplay;
  walletAddress?: string;
  onBetPlaced?: () => void;
}

export function SpeedMarketCard({ market, walletAddress, onBetPlaced }: SpeedMarketCardProps) {
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<'UP' | 'DOWN' | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(SPEED_MARKETS_CONFIG.TIME_FRAMES[0]);
  const [amount, setAmount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const priceChange = market.priceChange24h;
  const isPositive = priceChange >= 0;

  const handleSubmit = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedDirection) {
      setError('Please select UP or DOWN');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 5 || amountNum > 200) {
      setError('Amount must be between $5 and $200');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/speedmarkets/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          asset: market.asset,
          direction: selectedDirection,
          amount: amount,
          timeFrameSeconds: selectedTimeFrame.seconds,
          strikePrice: market.currentPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setSuccess(true);
      onBetPlaced?.();
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
      setSelectedDirection(null);
      setIsBetModalOpen(false);
    }
  };

  const formatPrice = (price: number) => {
    if (market.asset === 'BTC') {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const amountNum = parseFloat(amount) || 0;
  const potentialPayout = amountNum * market.estimatedPayout;

  const assetColors = {
    BTC: { bg: 'from-orange-500 to-amber-500', text: 'text-orange-400' },
    ETH: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-400' },
  };
  const colors = assetColors[market.asset];

  return (
    <>
      <Card className="group border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg text-2xl`}>
                {market.assetIcon}
              </div>
              <div>
                <p className="font-bold text-lg">{market.asset}/USD</p>
                <p className="text-xs text-muted-foreground">Speed Markets</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {market.estimatedPayout}x payout
            </Badge>
          </div>

          {/* Price Display */}
          <div className="px-4 py-4 text-center">
            <p className="text-3xl font-bold font-mono">{formatPrice(market.currentPrice)}</p>
            <div className={`flex items-center justify-center gap-1 mt-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">24h</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={() => {
                  setSelectedDirection('UP');
                  setIsBetModalOpen(true);
                }}
                className="h-12 bg-success hover:bg-success/90"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                UP
              </Button>
              <Button
                onClick={() => {
                  setSelectedDirection('DOWN');
                  setIsBetModalOpen(true);
                }}
                className="h-12 bg-destructive hover:bg-destructive/90"
              >
                <TrendingDown className="w-5 h-5 mr-2" />
                DOWN
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                5 min - 24 hours
              </span>
              <span>${market.minBuyIn} - ${market.maxBuyIn}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bet Modal */}
      <Dialog open={isBetModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center text-lg`}>
                {market.assetIcon}
              </div>
              {market.asset} Speed Market
            </DialogTitle>
            <DialogDescription>
              Predict if {market.asset} will go UP or DOWN
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-1">Bet placed!</h3>
                <p className="text-sm text-muted-foreground">
                  Your <span className={selectedDirection === 'UP' ? 'text-success' : 'text-destructive'}>{selectedDirection}</span> position on {market.asset} has been recorded
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border/50 text-left">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset:</span>
                    <span className="font-medium">{market.asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direction:</span>
                    <span className={selectedDirection === 'UP' ? 'text-success font-medium' : 'text-destructive font-medium'}>{selectedDirection}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">${amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time frame:</span>
                    <span>{selectedTimeFrame.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strike price:</span>
                    <span className="font-mono">{formatPrice(market.currentPrice)}</span>
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
              {/* Current Price */}
              <div className="p-3 rounded-lg bg-surface border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">Current {market.asset} price</p>
                <p className="text-2xl font-bold font-mono">{formatPrice(market.currentPrice)}</p>
              </div>

              {/* Direction Selection */}
              <div className="space-y-2">
                <Label>Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedDirection('UP')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDirection === 'UP'
                        ? 'border-success bg-success/10'
                        : 'border-border/50 hover:border-success/50'
                    }`}
                  >
                    <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${selectedDirection === 'UP' ? 'text-success' : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-success">UP</p>
                    <p className="text-xs text-muted-foreground">Price goes higher</p>
                  </button>
                  <button
                    onClick={() => setSelectedDirection('DOWN')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDirection === 'DOWN'
                        ? 'border-destructive bg-destructive/10'
                        : 'border-border/50 hover:border-destructive/50'
                    }`}
                  >
                    <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${selectedDirection === 'DOWN' ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-destructive">DOWN</p>
                    <p className="text-xs text-muted-foreground">Price goes lower</p>
                  </button>
                </div>
              </div>

              {/* Time Frame */}
              <div className="space-y-2">
                <Label>Time frame</Label>
                <div className="flex flex-wrap gap-2">
                  {SPEED_MARKETS_CONFIG.TIME_FRAMES.map((tf) => (
                    <Button
                      key={tf.seconds}
                      variant={selectedTimeFrame.seconds === tf.seconds ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeFrame(tf)}
                      className="flex-1 min-w-[70px]"
                    >
                      {tf.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="5"
                    max="200"
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {[10, 25, 50, 100, 200].map((preset) => (
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

              {/* Potential Payout */}
              {selectedDirection && amountNum >= 5 && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-success/5 to-primary/5 border border-success/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential payout:</span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">${potentialPayout.toFixed(2)}</p>
                      <p className="text-xs text-success/80">{market.estimatedPayout}x multiplier</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDirection || !walletAddress}
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
    </>
  );
}
