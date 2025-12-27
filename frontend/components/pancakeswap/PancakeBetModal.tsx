'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PancakePredictionMarket } from '@/lib/pancakeswap';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FlaskConical,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PancakeBetModalProps {
  market: PancakePredictionMarket;
  isOpen: boolean;
  onClose: () => void;
}

// PancakeSwap Prediction V2 Contract (BSC Mainnet only)
const PANCAKE_PREDICTION_MAINNET = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA' as `0x${string}`;

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

const BSC_MAINNET_CHAIN_ID = 56;
const BSC_TESTNET_CHAIN_ID = 97;

export function PancakeBetModal({ market, isOpen, onClose }: PancakeBetModalProps) {
  const { isConnected, address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [betAmount, setBetAmount] = useState('0.1');
  const [selectedPosition, setSelectedPosition] = useState<'bull' | 'bear'>('bull');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  const { toast } = useToast();

  const isOnMainnet = chainId === BSC_MAINNET_CHAIN_ID;
  const isOnTestnet = chainId === BSC_TESTNET_CHAIN_ID;

  // Default to simulation mode on testnet
  const [mode, setMode] = useState<'real' | 'simulation'>(isOnMainnet ? 'real' : 'simulation');

  // Update mode when chain changes
  useEffect(() => {
    if (isOnMainnet) {
      setMode('real');
    } else {
      setMode('simulation');
    }
  }, [isOnMainnet]);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Send notification when real bet is successful
  useEffect(() => {
    if (isSuccess && address) {
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

  const handlePlaceRealBet = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to place a bet',
        variant: 'destructive',
      });
      return;
    }

    if (!isOnMainnet) {
      toast({
        title: 'Wrong network',
        description: 'Switch to BSC Mainnet for real bets',
        variant: 'destructive',
      });
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid bet amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      const value = parseEther(betAmount);

      if (selectedPosition === 'bull') {
        writeContract({
          address: PANCAKE_PREDICTION_MAINNET,
          abi: PREDICTION_ABI,
          functionName: 'betBull',
          args: [BigInt(market.currentEpoch)],
          value,
        });
      } else {
        writeContract({
          address: PANCAKE_PREDICTION_MAINNET,
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

  const handlePlaceSimulatedBet = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid bet amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSimulating(true);
    setSimulationSuccess(false);

    try {
      const response = await fetch('/api/simulate-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          epoch: market.currentEpoch,
          amount: betAmount,
          position: selectedPosition,
          asset: market.asset,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate bet');
      }

      setSimulationSuccess(true);
      toast({
        title: 'Simulated bet placed!',
        description: `${betAmount} BNB on ${selectedPosition.toUpperCase()} for Round #${market.currentEpoch}`,
      });
    } catch (err: any) {
      toast({
        title: 'Simulation failed',
        description: err.message || 'Failed to place simulated bet',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePlaceBet = () => {
    if (mode === 'simulation') {
      handlePlaceSimulatedBet();
    } else {
      handlePlaceRealBet();
    }
  };

  const calculatePotentialPayout = () => {
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) return 0;

    const poolRatio = selectedPosition === 'bull'
      ? market.bullProbability / 100
      : market.bearProbability / 100;

    const payout = (amount / poolRatio) * 0.97;
    return payout.toFixed(4);
  };

  const handleClose = () => {
    if (!isPending && !isConfirming && !isSimulating) {
      onClose();
      setBetAmount('0.1');
      setSelectedPosition('bull');
      setSimulationSuccess(false);
    }
  };

  const isLoading = isPending || isConfirming || isSimulating;
  const isComplete = isSuccess || simulationSuccess;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {market.asset} Prediction
            {mode === 'simulation' && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-2">
                <FlaskConical className="w-3 h-3 mr-1" />
                Simulation
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Round #{market.currentEpoch} • {market.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle - Only show if on mainnet */}
          {isOnMainnet && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'real' | 'simulation')}>
              <TabsList className="w-full">
                <TabsTrigger value="real" className="flex-1 gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Real BNB
                </TabsTrigger>
                <TabsTrigger value="simulation" className="flex-1 gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Simulate
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Mode Info */}
          {mode === 'simulation' ? (
            <Alert className="border-purple-500/30 bg-purple-500/5">
              <FlaskConical className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-purple-300">
                <strong>Simulation mode:</strong> Practice betting without real BNB. Your bets are tracked and resolved based on real outcomes.
              </AlertDescription>
            </Alert>
          ) : !isOnMainnet ? (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                <strong>BSC Mainnet required</strong> for real bets.
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-2 text-warning underline"
                  onClick={() => switchChain?.({ chainId: BSC_MAINNET_CHAIN_ID })}
                >
                  Switch network
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {market.status === 'live'
                  ? 'Round is live - real BNB will be used'
                  : market.status === 'locked'
                  ? 'Round is locked - no more bets'
                  : 'Round is closed'}
              </AlertDescription>
            </Alert>
          )}

          {/* Position Selection */}
          <div className="space-y-2">
            <Label>Select position</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPosition === 'bull' ? 'default' : 'outline'}
                onClick={() => setSelectedPosition('bull')}
                className={`h-20 ${
                  selectedPosition === 'bull'
                    ? 'bg-success hover:bg-success/90'
                    : 'border-success/50 hover:bg-success/10'
                }`}
              >
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold">UP</div>
                  <div className="text-xs opacity-80">{market.bullProbability.toFixed(1)}%</div>
                </div>
              </Button>
              <Button
                variant={selectedPosition === 'bear' ? 'default' : 'outline'}
                onClick={() => setSelectedPosition('bear')}
                className={`h-20 ${
                  selectedPosition === 'bear'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'border-destructive/50 hover:bg-destructive/10'
                }`}
              >
                <div className="text-center">
                  <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold">DOWN</div>
                  <div className="text-xs opacity-80">{market.bearProbability.toFixed(1)}%</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="space-y-2">
            <Label htmlFor="betAmount">
              Bet amount {mode === 'simulation' ? '(virtual)' : '(BNB)'}
            </Label>
            <Input
              id="betAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.1"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              {['0.1', '0.5', '1.0', '5.0'].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setBetAmount(amount)}
                  disabled={isLoading}
                  className="text-xs flex-1"
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Potential Payout */}
          <div className="p-3 rounded-lg bg-surface border border-border/50">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Potential payout:</span>
              <span className="font-bold text-secondary">
                {calculatePotentialPayout()} {mode === 'simulation' ? 'virtual' : 'BNB'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Platform fee:</span>
              <span>3%</span>
            </div>
          </div>

          {/* Transaction Status */}
          {isLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {isSimulating
                  ? 'Placing simulated bet...'
                  : isPending
                  ? 'Confirm in your wallet...'
                  : 'Transaction confirming...'}
              </AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                {mode === 'simulation'
                  ? 'Simulated bet placed! Check your stats later.'
                  : 'Bet placed successfully!'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message.includes('user rejected')
                  ? 'Transaction rejected'
                  : 'Error placing bet'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {isComplete ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePlaceBet}
              disabled={
                !isConnected ||
                isLoading ||
                isComplete ||
                market.status !== 'live' ||
                !betAmount ||
                parseFloat(betAmount) <= 0 ||
                (mode === 'real' && !isOnMainnet)
              }
              className={`flex-1 ${
                mode === 'simulation'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isComplete ? (
                'Done!'
              ) : mode === 'simulation' ? (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Simulate Bet
                </>
              ) : (
                'Place Bet'
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            {mode === 'simulation'
              ? 'Simulation uses virtual funds. No real BNB required.'
              : 'Real BNB required. Bets cannot be cancelled.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
