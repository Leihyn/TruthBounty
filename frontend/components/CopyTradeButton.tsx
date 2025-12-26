'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { COPY_TRADING_VAULT_ABI, COPY_VAULT_ADDRESS } from '@/lib/contracts';
import Link from 'next/link';

interface TraderStats {
  winRate: number;
  totalBets: number;
  totalVolume: string;
  platforms?: string[];
  truthScore: number;
}

interface CopyTradeButtonProps {
  traderAddress: string;
  traderStats: TraderStats;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function CopyTradeButton({
  traderAddress,
  traderStats,
  size = 'sm',
  variant = 'default',
}: CopyTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allocation, setAllocation] = useState('20');
  const [maxBet, setMaxBet] = useState('0.5');

  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Check if vault is deployed
  const vaultNotDeployed = COPY_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';

  // Read user's vault balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  // Check if already following this leader (getUserFollows returns Follow[] structs)
  const { data: userFollowsData, refetch: refetchFollowed } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getUserFollows',
    args: address ? [address] : undefined,
  });

  // Extract leader addresses from the Follow structs
  const followedLeaders = userFollowsData?.map((f: any) => f.leader) || [];

  // Write function to follow leader
  const { writeContract: followLeader, data: followHash, isPending: isFollowing } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: followHash });

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchFollowed();
      toast({
        title: 'Copy Trading Activated!',
        description: `You're now following ${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`,
      });
      setIsOpen(false);
    }
  }, [isSuccess, traderAddress, toast, refetchBalance, refetchFollowed]);

  const balance = userBalance ? formatEther(userBalance) : '0';
  const isAlreadyFollowing = followedLeaders?.some(
    (leader: string) => leader.toLowerCase() === traderAddress.toLowerCase()
  );

  const handleFollow = () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to copy trade',
        variant: 'destructive',
      });
      return;
    }

    if (address?.toLowerCase() === traderAddress.toLowerCase()) {
      toast({
        title: 'Cannot Copy Yourself',
        description: "You can't copy your own trades",
        variant: 'destructive',
      });
      return;
    }

    if (Number(balance) < 0.01) {
      toast({
        title: 'Insufficient Balance',
        description: 'Please deposit at least 0.01 BNB to the vault first',
        variant: 'destructive',
      });
      return;
    }

    // Allocation in basis points (100 = 1%)
    const allocationBps = Math.min(parseInt(allocation) * 100, 5000); // Max 50%
    const maxBetWei = parseEther(maxBet);

    followLeader({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'follow',
      args: [traderAddress as `0x${string}`, BigInt(allocationBps), maxBetWei],
    });
  };

  const estimatedCopyAmount = (parseFloat(balance) * parseInt(allocation)) / 100;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size={size}
        variant={variant}
        className="gap-2"
        disabled={vaultNotDeployed}
      >
        <Copy className="w-4 h-4" />
        {isAlreadyFollowing ? 'Following' : 'Copy Trade'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Copy className="w-6 h-6 text-blue-500" />
              Copy This Trader
            </DialogTitle>
            <DialogDescription>
              Automatically copy predictions from{' '}
              <code className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded">
                {traderAddress.slice(0, 10)}...{traderAddress.slice(-8)}
              </code>
            </DialogDescription>
          </DialogHeader>

          {/* Already Following Alert */}
          {isAlreadyFollowing && (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-200">
                You are already following this trader. Changes will update your settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Vault Balance Check */}
          {Number(balance) < 0.01 && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Wallet className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                <span className="font-semibold">No vault balance.</span> You need to deposit BNB to the Copy Trading Vault first.
                <Link href="/copy-trading" className="ml-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300">
                  Go to Vault <ExternalLink className="h-3 w-3" />
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Trader Stats */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Trader Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Win Rate
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {traderStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <Target className="w-3 h-3" />
                    Total Bets
                  </div>
                  <p className="text-xl font-bold">{traderStats.totalBets}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <DollarSign className="w-3 h-3" />
                    Volume
                  </div>
                  <p className="text-xl font-bold text-amber-400">
                    {parseFloat(traderStats.totalVolume).toFixed(2)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Score
                  </div>
                  <p className="text-xl font-bold text-blue-400">
                    {traderStats.truthScore}
                  </p>
                </div>
              </div>

              {/* Platforms */}
              {traderStats.platforms && traderStats.platforms.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Active on:</p>
                  <div className="flex gap-2 flex-wrap">
                    {traderStats.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="text-xs bg-blue-500/10 text-blue-400"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Vault Balance */}
          <Card className="border-slate-500/30 bg-slate-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Your Vault Balance</p>
                  <p className="text-2xl font-bold text-blue-400">{Number(balance).toFixed(4)} BNB</p>
                </div>
                <Link href="/copy-trading">
                  <Button variant="outline" size="sm">
                    <Wallet className="w-4 h-4 mr-2" />
                    Manage Vault
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <div className="space-y-6 mt-4">
            {/* Allocation */}
            <div className="space-y-2">
              <Label htmlFor="allocation" className="text-base font-semibold">
                Allocation Percentage
              </Label>
              <p className="text-sm text-muted-foreground">
                What percentage of your vault balance to use per copy trade (max 50%)
              </p>
              <div className="flex gap-4 items-center">
                <Input
                  id="allocation"
                  type="number"
                  min="1"
                  max="50"
                  value={allocation}
                  onChange={(e) => setAllocation(Math.min(50, parseInt(e.target.value) || 1).toString())}
                  className="text-lg"
                />
                <span className="text-2xl font-bold text-blue-400">{Math.min(50, parseInt(allocation) || 0)}%</span>
              </div>
              <p className="text-xs text-blue-400">
                Estimated per trade: ~{estimatedCopyAmount.toFixed(4)} BNB
              </p>
            </div>

            {/* Max Bet */}
            <div className="space-y-2">
              <Label htmlFor="maxBet" className="text-base font-semibold">
                Maximum Bet Amount
              </Label>
              <p className="text-sm text-muted-foreground">
                Maximum amount to copy per single prediction
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  id="maxBet"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={maxBet}
                  onChange={(e) => setMaxBet(e.target.value)}
                  className="text-lg"
                  placeholder="0.5"
                />
                <span className="text-sm font-medium whitespace-nowrap">BNB</span>
              </div>
            </div>

            {/* Security Info */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-blue-400">On-Chain Copy Trading</p>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Your funds stay in the vault contract until copy trades execute</li>
                      <li>• Withdrawals have a 1-hour time lock for security</li>
                      <li>• All trades are executed on-chain with full transparency</li>
                      <li>• You can unfollow any leader at any time</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-amber-500">Risk Warning</p>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Copy trading involves risk. Past performance doesn't guarantee future results.</li>
                      <li>• Only deposit what you can afford to lose.</li>
                      <li>• Platform fees (3%) apply to each copied trade.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleFollow}
              disabled={isFollowing || isConfirming || !isConnected || Number(balance) < 0.01}
              className="flex-1 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              size="lg"
            >
              {isFollowing || isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {isFollowing ? 'Confirming...' : 'Processing...'}
                </>
              ) : !isConnected ? (
                'Connect Wallet First'
              ) : Number(balance) < 0.01 ? (
                'Deposit to Vault First'
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {isAlreadyFollowing ? 'Update Settings' : 'Start Copy Trading'}
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="lg"
              disabled={isFollowing || isConfirming}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
