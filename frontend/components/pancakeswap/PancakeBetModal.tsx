'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PancakeBetModalProps {
  market: PancakePredictionMarket;
  isOpen: boolean;
  onClose: () => void;
}

// PancakeSwap Prediction V2 Contract Address (BSC Mainnet)
const PANCAKE_PREDICTION_ADDRESS = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA' as `0x${string}`;

// Simplified ABI for betting functions
const PREDICTION_ABI = [
  {
    inputs: [{ name: 'epoch', type: 'uint256' }],
    name: 'betBull',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'epoch', type: 'uint256' }],
    name: 'betBear',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export function PancakeBetModal({ market, isOpen, onClose }: PancakeBetModalProps) {
  const { isConnected, address } = useAccount();
  const [betAmount, setBetAmount] = useState('0.1');
  const [selectedPosition, setSelectedPosition] = useState<'bull' | 'bear'>('bull');
  const { toast } = useToast();

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Send notification when bet is successful
  useEffect(() => {
    if (isSuccess && address) {
      // Send notification
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bet_placed',
          data: {
            platform: 'PancakeSwap',
            position: selectedPosition.toUpperCase(),
            amount: `${betAmount} BNB`,
            address,
          },
        }),
      }).catch(err => console.error('Failed to send notification:', err));
    }
  }, [isSuccess, address, selectedPosition, betAmount]);

  const handlePlaceBet = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to place a bet',
        variant: 'destructive',
      });
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: 'Invalid Bet Amount',
        description: 'Please enter a valid bet amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      const value = parseEther(betAmount);

      if (selectedPosition === 'bull') {
        writeContract({
          address: PANCAKE_PREDICTION_ADDRESS,
          abi: PREDICTION_ABI,
          functionName: 'betBull',
          args: [BigInt(market.currentEpoch)],
          value,
        });
      } else {
        writeContract({
          address: PANCAKE_PREDICTION_ADDRESS,
          abi: PREDICTION_ABI,
          functionName: 'betBear',
          args: [BigInt(market.currentEpoch)],
          value,
        });
      }
    } catch (err) {
      console.error('Error placing bet:', err);
    }
  };

  const calculatePotentialPayout = () => {
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return 0;

    const poolRatio = selectedPosition === 'bull'
      ? market.bullProbability / 100
      : market.bearProbability / 100;

    // Simplified payout calculation: bet amount / pool ratio
    // PancakeSwap takes 3% fee
    const payout = (amount / poolRatio) * 0.97;
    return payout.toFixed(4);
  };

  const handleClose = () => {
    if (!isPending && !isConfirming) {
      onClose();
      // Reset state
      setBetAmount('0.1');
      setSelectedPosition('bull');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bebas text-sm">P</span>
            </div>
            Place Bet: {market.asset}
          </DialogTitle>
          <DialogDescription>
            Round #{market.currentEpoch} • {market.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Status */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {market.status === 'live'
                ? 'Round is live and accepting bets'
                : market.status === 'locked'
                ? 'Round is locked - no more bets accepted'
                : 'Round is closed'}
            </AlertDescription>
          </Alert>

          {/* Position Selection */}
          <div className="space-y-2">
            <Label>Select Position</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPosition === 'bull' ? 'default' : 'outline'}
                onClick={() => setSelectedPosition('bull')}
                className={`h-20 ${
                  selectedPosition === 'bull'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'border-green-500/50 hover:bg-green-500/10'
                }`}
              >
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-bebas text-lg">BULL (UP)</div>
                  <div className="text-xs">{market.bullProbability.toFixed(1)}%</div>
                </div>
              </Button>
              <Button
                variant={selectedPosition === 'bear' ? 'default' : 'outline'}
                onClick={() => setSelectedPosition('bear')}
                className={`h-20 ${
                  selectedPosition === 'bear'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'border-red-500/50 hover:bg-red-500/10'
                }`}
              >
                <div className="text-center">
                  <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-bebas text-lg">BEAR (DOWN)</div>
                  <div className="text-xs">{market.bearProbability.toFixed(1)}%</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="space-y-2">
            <Label htmlFor="betAmount">Bet Amount (BNB)</Label>
            <Input
              id="betAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.1"
              disabled={isPending || isConfirming}
            />
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0', '5.0'].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setBetAmount(amount)}
                  disabled={isPending || isConfirming}
                  className="text-xs"
                >
                  {amount} BNB
                </Button>
              ))}
            </div>
          </div>

          {/* Potential Payout */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-amber-500/20">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Potential Payout:</span>
              <span className="font-bold font-teko text-amber-400">
                {calculatePotentialPayout()} BNB
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Platform Fee:</span>
              <span>3%</span>
            </div>
          </div>

          {/* Transaction Status */}
          {isPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Waiting for wallet confirmation...</AlertDescription>
            </Alert>
          )}

          {isConfirming && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Transaction confirming on blockchain...</AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Bet placed successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message.includes('user rejected')
                  ? 'Transaction rejected'
                  : 'Error placing bet. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending || isConfirming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBet}
              disabled={
                !isConnected ||
                isPending ||
                isConfirming ||
                isSuccess ||
                market.status !== 'live' ||
                !betAmount ||
                parseFloat(betAmount) <= 0
              }
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isSuccess ? (
                'Bet Placed!'
              ) : (
                'Place Bet'
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            Make sure you're on BNB Smart Chain. Bets cannot be cancelled once placed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
