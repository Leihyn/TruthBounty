'use client'


import { useState, useEffect, useCallback } from 'react';
import { useCopyTradingSimStats, usePancakeSimulationTab } from '@/lib/queries';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Activity,
  Wallet,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
  Plus,
  Minus,
  Eye,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { COPY_TRADING_VAULT_ABI, COPY_VAULT_ADDRESS } from '@/lib/contracts';
import { PolymarketSimulationTab } from '@/components/PolymarketSimulation';
import { PAGE_HEADER, TAB_STYLES, shortenAddress } from '@/components/ui/design-tokens';

function SimulationTab({ followerAddress }: { followerAddress?: string }) {
  // React Query hook with automatic 30s polling
  const { data, isLoading: loading } = usePancakeSimulationTab(followerAddress);
  const stats = data?.stats || null;
  const trades = data?.trades || [];

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-16">
          <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-purple-500/30 bg-purple-500/5">
        <FlaskConical className="h-4 w-4 text-purple-500" />
        <AlertDescription>
          <span className="font-medium">Simulation mode:</span> Using real mainnet leader data with virtual execution. No funds at risk.
        </AlertDescription>
      </Alert>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.overall?.totalTrades || 0}</p>
            <p className="text-xs text-muted-foreground">Simulated trades</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats?.overall?.overallWinRate || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Win rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${parseFloat(stats?.overall?.totalPnlBNB || '0') >= 0 ? 'text-success' : 'text-destructive'}`}>
              {parseFloat(stats?.overall?.totalPnlBNB || '0') >= 0 ? '+' : ''}{parseFloat(stats?.overall?.totalPnlBNB || '0').toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground">Virtual PnL (BNB)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats?.overall?.totalPending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent simulated trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <div className="space-y-2">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {trade.outcome === 'win' ? (
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      </div>
                    ) : trade.outcome === 'loss' ? (
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                        <Timer className="h-4 w-4 text-warning" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Epoch #{trade.epoch} - {trade.isBull ? 'Bull' : 'Bear'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {trade.leader?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{parseFloat(trade.amountBNB).toFixed(4)} BNB</p>
                    {trade.pnlBNB && (
                      <p className={`text-xs font-mono ${parseFloat(trade.pnlBNB) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {parseFloat(trade.pnlBNB) >= 0 ? '+' : ''}{parseFloat(trade.pnlBNB).toFixed(4)}
                      </p>
                    )}
                    {trade.outcome === 'pending' && (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No simulated trades yet</p>
              <p className="text-xs mt-1">Follow a leader and wait for them to place bets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How simulation works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { num: 1, text: 'Deposit testnet BNB and follow mainnet leaders' },
              { num: 2, text: 'Simulator monitors real mainnet bets from leaders' },
              { num: 3, text: 'When a leader bets, we log your virtual copy trade' },
              { num: 4, text: 'After rounds resolve, we calculate virtual PnL' },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                  {num}
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CopyTradingDashboard() {
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // React Query hook for simulation stats - automatic 30s polling
  const { data: simStats } = useCopyTradingSimStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isConnected = mounted && !!account.address;
  const address = account.address;

  const { data: vaultStats, refetch: refetchStats } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  const { data: maxVaultSize } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'MAX_VAULT_SIZE',
  });

  const { data: withdrawalDelay } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'WITHDRAWAL_DELAY',
  });

  const { data: minDeposit } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'MIN_DEPOSIT',
  });

  const { data: isPaused } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'paused',
  });

  const { data: maxAllocationBps } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'MAX_ALLOCATION_BPS',
  });

  const { data: protocolFeeBps } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'PROTOCOL_FEE_BPS',
  });

  const { data: pancakePrediction } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'PANCAKE_PREDICTION',
  });

  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  const { data: pendingWithdrawal, refetch: refetchPending } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getPendingWithdrawal',
    args: address ? [address] : undefined,
  });

  // Fetch follows from database OR extract from simulated trades
  const [dbFollows, setDbFollows] = useState<any[]>([]);
  const [simLeaders, setSimLeaders] = useState<any[]>([]);

  const fetchDbFollows = async () => {
    if (!address) return;
    try {
      // First try explicit follows
      const res = await fetch(`/api/copy-trade/follow?follower=${address}`);
      const data = await res.json();
      if (data.success && data.follows) {
        // Filter to only include follows where the follower matches our address
        const myFollows = data.follows.filter((f: any) =>
          f.is_active && f.follower?.wallet_address?.toLowerCase() === address.toLowerCase()
        );
        setDbFollows(myFollows);

        // If no explicit follows, get leaders from simulated trades
        if (myFollows.length === 0) {
          const simRes = await fetch(`/api/copy-trading/simulation?limit=100&follower=${address}`);
          const simData = await simRes.json();
          if (simData.trades && simData.trades.length > 0) {
            // Extract unique leaders
            const leaderMap = new Map();
            simData.trades.forEach((t: any) => {
              if (t.leader && !leaderMap.has(t.leader)) {
                leaderMap.set(t.leader, {
                  id: t.leader,
                  trader: { wallet_address: t.leader },
                  fromSimulation: true,
                  tradeCount: 0,
                });
              }
              if (t.leader) {
                leaderMap.get(t.leader).tradeCount++;
              }
            });
            setSimLeaders(Array.from(leaderMap.values()));
          }
        }
      }
    } catch (e) {
      console.error('Error fetching follows:', e);
    }
  };

  useEffect(() => {
    if (address) {
      fetchDbFollows();
    }
  }, [address]);

  const refetchLeaders = fetchDbFollows;
  // Use explicit follows if any, otherwise use leaders from simulation
  const followedLeaders = dbFollows.length > 0 ? dbFollows : simLeaders;

  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: requestWithdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: executeWithdraw, data: executeHash, isPending: isExecuting } = useWriteContract();
  const { writeContract: cancelWithdraw, data: cancelHash, isPending: isCancelling } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });
  const { isLoading: isExecuteConfirming, isSuccess: executeSuccess } = useWaitForTransactionReceipt({ hash: executeHash });
  const { isLoading: isCancelConfirming, isSuccess: cancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  useEffect(() => {
    if (depositSuccess || withdrawSuccess || executeSuccess || cancelSuccess) {
      refetchBalance();
      refetchStats();
      refetchPending();
      refetchLeaders();
    }
  }, [depositSuccess, withdrawSuccess, executeSuccess, cancelSuccess]);

  const tvl = vaultStats ? formatEther(vaultStats[0]) : '0';
  const totalCopyTrades = vaultStats ? Number(vaultStats[1]) : 0;
  const totalVolume = vaultStats ? formatEther(vaultStats[2]) : '0';
  const executorAddress = vaultStats ? vaultStats[4] : null;
  const maxSize = maxVaultSize ? formatEther(maxVaultSize) : '100';
  const utilizationPercent = maxVaultSize && vaultStats ? (Number(formatEther(vaultStats[0])) / Number(formatEther(maxVaultSize))) * 100 : 0;
  const delayHours = withdrawalDelay ? Number(withdrawalDelay) / 3600 : 1;
  const minDepositBNB = minDeposit ? formatEther(minDeposit) : '0.01';
  const maxAllocationPercent = maxAllocationBps ? Number(maxAllocationBps) / 100 : 50;
  const protocolFeePercent = protocolFeeBps ? Number(protocolFeeBps) / 100 : 10;
  const isContractPaused = isPaused ?? false;
  const pancakeAddress = pancakePrediction as `0x${string}` | undefined;

  const balance = userBalance ? formatEther(userBalance) : '0';
  const pendingAmount = pendingWithdrawal ? formatEther(pendingWithdrawal[0]) : '0';
  const unlockTime = pendingWithdrawal ? Number(pendingWithdrawal[1]) : 0;
  const hasPendingWithdrawal = Number(pendingAmount) > 0;
  const canExecuteWithdrawal = hasPendingWithdrawal && unlockTime > 0 && Date.now() / 1000 >= unlockTime;
  const leadersCount = followedLeaders?.length || 0;

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    deposit({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'deposit',
      value: parseEther(depositAmount),
    });
  };

  const handleRequestWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    requestWithdraw({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'requestWithdrawal',
      args: [parseEther(withdrawAmount)],
    });
  };

  const handleExecuteWithdraw = () => {
    executeWithdraw({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'executeWithdrawal',
    });
  };

  const handleCancelWithdraw = () => {
    cancelWithdraw({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'cancelWithdrawal',
    });
  };

  function formatTimeRemaining(unlockTimestamp: number): string {
    const now = Date.now() / 1000;
    const remaining = unlockTimestamp - now;
    if (remaining <= 0) return 'Ready to withdraw';
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }

  if (!mounted) return null;

  const vaultNotDeployed = COPY_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';

  if (vaultNotDeployed) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-warning/10 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Copy trading coming soon</h1>
        <p className="text-muted-foreground">The vault contract has not been deployed yet.</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect your wallet</h1>
        <p className="text-muted-foreground">Connect your wallet to access copy trading.</p>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-6 max-w-5xl">
      {/* Header - Better mobile spacing */}
      <div className="mb-5">
        <div className={PAGE_HEADER.container}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <h1 className={PAGE_HEADER.title}>Copy trading</h1>
            </div>
            <p className={PAGE_HEADER.subtitle}>Automatically copy trades from top performers</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
              <Shield className="h-3 w-3 mr-1" />
              {delayHours}h lock
            </Badge>
            {executorAddress && (
              <a
                href={`https://bscscan.com/address/${executorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Executor <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row - Better mobile horizontal scroll */}
      <div className="mb-5 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 snap-x scrollbar-hide">
          <Card className="border-border/50 bg-card min-w-[150px] md:min-w-0 snap-start shrink-0 md:shrink">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">TVL</span>
              </div>
              <p className="text-xl font-bold">{Number(tvl).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">BNB</span></p>
              <Progress value={utilizationPercent} className="h-1.5 mt-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{utilizationPercent.toFixed(0)}% of {maxSize}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card min-w-[140px] md:min-w-0 snap-start shrink-0 md:shrink">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Simulated</span>
              </div>
              <p className="text-xl font-bold">{simStats?.overall?.totalTrades || 0}</p>
              <p className="text-xs text-success font-medium mt-1">{simStats?.overall?.overallWinRate || 'N/A'} win rate</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card min-w-[150px] md:min-w-0 snap-start shrink-0 md:shrink">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Balance</span>
              </div>
              <p className="text-xl font-bold">{Number(balance).toFixed(4)} <span className="text-xs font-normal text-muted-foreground">BNB</span></p>
              <p className={`text-xs mt-1 font-medium ${parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? 'text-success' : 'text-destructive'}`}>
                {parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? '+' : ''}{parseFloat(simStats?.overall?.totalPnlBNB || '0').toFixed(4)} PnL
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card min-w-[130px] md:min-w-0 snap-start shrink-0 md:shrink">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Following</span>
              </div>
              <p className="text-xl font-bold">{leadersCount}</p>
              <p className="text-xs text-muted-foreground mt-1">leaders</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs - Improved styling */}
      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className={`${TAB_STYLES.list} rounded-xl grid grid-cols-5`}>
          <TabsTrigger value="deposit" className={TAB_STYLES.trigger}>
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Funds</span>
          </TabsTrigger>
          <TabsTrigger value="leaders" className={TAB_STYLES.trigger}>
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Leaders</span>
          </TabsTrigger>
          <TabsTrigger value="simulation" className={TAB_STYLES.trigger}>
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">PancakeSwap</span>
          </TabsTrigger>
          <TabsTrigger value="polymarket" className={TAB_STYLES.trigger}>
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Polymarket</span>
          </TabsTrigger>
          <TabsTrigger value="transparency" className={TAB_STYLES.trigger}>
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Deposit/Withdraw Tab */}
        <TabsContent value="deposit" className={TAB_STYLES.content}>
          {/* Desktop: Side by side */}
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            {/* Deposit */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Deposit
                </CardTitle>
                <CardDescription>Add funds to your copy trading balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deposit-desktop" className="text-sm">Amount (BNB)</Label>
                  <Input
                    id="deposit-desktop"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum: 0.01 BNB</p>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || isDepositConfirming || !depositAmount}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25"
                >
                  {isDepositing || isDepositConfirming ? (
                    <Activity className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isDepositing ? 'Confirming...' : isDepositConfirming ? 'Processing...' : 'Deposit'}
                </Button>
              </CardContent>
            </Card>

            {/* Withdraw */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Minus className="h-4 w-4 text-warning" />
                  Withdraw
                </CardTitle>
                <CardDescription>{delayHours}-hour time lock for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPendingWithdrawal ? (
                  <>
                    <Alert className="border-warning/30 bg-warning/5">
                      <Clock className="h-4 w-4 text-warning" />
                      <AlertDescription>
                        <span className="font-medium">{pendingAmount} BNB</span> pending
                        <br />
                        <span className="text-sm">{formatTimeRemaining(unlockTime)}</span>
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExecuteWithdraw}
                        disabled={!canExecuteWithdrawal || isExecuting || isExecuteConfirming}
                        className="flex-1"
                      >
                        {isExecuting || isExecuteConfirming ? (
                          <Activity className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        Execute
                      </Button>
                      <Button
                        onClick={handleCancelWithdraw}
                        disabled={isCancelling || isCancelConfirming}
                        variant="outline"
                      >
                        {isCancelling || isCancelConfirming ? (
                          <Activity className="h-4 w-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="withdraw" className="text-sm">Amount (BNB)</Label>
                      <Input
                        id="withdraw"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        placeholder="0.1"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Available: {balance} BNB</p>
                    </div>
                    <Button
                      onClick={handleRequestWithdraw}
                      disabled={isWithdrawing || isWithdrawConfirming || !withdrawAmount || Number(withdrawAmount) > Number(balance)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-lg shadow-amber-500/25"
                    >
                      {isWithdrawing || isWithdrawConfirming ? (
                        <Activity className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      {isWithdrawing ? 'Confirming...' : isWithdrawConfirming ? 'Processing...' : 'Request withdrawal'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Stacked cards */}
          <div className="md:hidden space-y-4">
            {/* Deposit Card */}
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Deposit BNB</p>
                    <p className="text-xs text-muted-foreground">Add funds to start copying</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="deposit-mobile" className="text-sm">Amount (BNB)</Label>
                  <Input
                    id="deposit-mobile"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum: 0.01 BNB</p>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || isDepositConfirming || !depositAmount}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20"
                >
                  {isDepositing || isDepositConfirming ? (
                    <Activity className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isDepositing ? 'Confirming...' : isDepositConfirming ? 'Processing...' : 'Deposit'}
                </Button>
              </CardContent>
            </Card>

            {/* Withdraw Card */}
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-amber-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Minus className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Withdraw BNB</p>
                    <p className="text-xs text-muted-foreground">{delayHours}-hour security lock</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                {hasPendingWithdrawal ? (
                  <>
                    <Alert className="border-warning/30 bg-warning/5">
                      <Clock className="h-4 w-4 text-warning" />
                      <AlertDescription>
                        <span className="font-medium">{pendingAmount} BNB</span> pending
                        <br />
                        <span className="text-sm">{formatTimeRemaining(unlockTime)}</span>
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExecuteWithdraw}
                        disabled={!canExecuteWithdrawal || isExecuting || isExecuteConfirming}
                        className="flex-1"
                      >
                        {isExecuting || isExecuteConfirming ? (
                          <Activity className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        Execute
                      </Button>
                      <Button
                        onClick={handleCancelWithdraw}
                        disabled={isCancelling || isCancelConfirming}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="withdraw-mobile" className="text-sm">Amount (BNB)</Label>
                      <Input
                        id="withdraw-mobile"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        placeholder="0.1"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Available: {balance} BNB</p>
                    </div>
                    <Button
                      onClick={handleRequestWithdraw}
                      disabled={isWithdrawing || isWithdrawConfirming || !withdrawAmount || Number(withdrawAmount) > Number(balance)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                    >
                      {isWithdrawing || isWithdrawConfirming ? (
                        <Activity className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      Request withdrawal
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaders Tab */}
        <TabsContent value="leaders" className={TAB_STYLES.content}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Follow top traders</CardTitle>
              <CardDescription>Select traders from the leaderboard to copy their bets</CardDescription>
            </CardHeader>
            <CardContent>
              {leadersCount === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium mb-1">No leaders followed</p>
                  <p className="text-sm text-muted-foreground mb-4">Browse the leaderboard to find top traders</p>
                  <Link href="/leaderboard">
                    <Button>
                      <Eye className="h-4 w-4 mr-2" />
                      Browse leaderboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">Following {leadersCount} trader{leadersCount !== 1 ? 's' : ''}</p>
                  {followedLeaders?.map((follow: any) => {
                    const traderAddr = follow.trader?.wallet_address || '';
                    const traderName = follow.trader?.username;
                    const isFromSim = follow.fromSimulation;
                    return (
                      <div
                        key={follow.id || traderAddr}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors"
                      >
                        <div>
                          <p className="font-mono text-sm">{traderName || shortenAddress(traderAddr)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isFromSim ? (
                              <span className="text-xs text-muted-foreground">{follow.tradeCount} simulated trades</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{follow.allocation_percentage}% allocation</span>
                            )}
                            <a
                              href={`https://bscscan.com/address/${traderAddr}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              BSCScan <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <Badge variant="outline" className={isFromSim ? "text-xs border-purple-500/30 text-purple-500" : "text-xs border-success/30 text-success"}>
                          {isFromSim ? 'Simulating' : 'Following'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className={TAB_STYLES.content}>
          <SimulationTab followerAddress={address} />
        </TabsContent>

        {/* Polymarket Tab */}
        <TabsContent value="polymarket" className={TAB_STYLES.content}>
          <PolymarketSimulationTab followerAddress={address} />
        </TabsContent>

        {/* Transparency Tab */}
        <TabsContent value="transparency" className={`${TAB_STYLES.content} space-y-4`}>
          {/* Contract Health Status */}
          <Card className="border-border/50 overflow-hidden">
            <div className={`p-4 ${isContractPaused ? 'bg-destructive/5' : 'bg-success/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isContractPaused ? 'bg-destructive/20' : 'bg-success/20'} flex items-center justify-center`}>
                    <Shield className={`h-6 w-6 ${isContractPaused ? 'text-destructive' : 'text-success'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Contract status</h3>
                    <p className="text-sm text-muted-foreground">Live on BSC Testnet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isContractPaused ? 'bg-destructive' : 'bg-success animate-pulse'}`} />
                  <span className={`text-sm font-medium ${isContractPaused ? 'text-destructive' : 'text-success'}`}>
                    {isContractPaused ? 'Paused' : 'Operational'}
                  </span>
                </div>
              </div>
            </div>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total value locked', value: `${Number(tvl).toFixed(2)} BNB` },
                  { label: 'Copy trades executed', value: totalCopyTrades.toLocaleString() },
                  { label: 'Volume processed', value: `${Number(totalVolume).toFixed(2)} BNB` },
                  { label: 'Capacity used', value: `${utilizationPercent.toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-surface text-center">
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Security Features */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-success" />
                  </div>
                  Security protections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/30">
                  <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Time-locked withdrawals</p>
                      <Badge variant="outline" className="text-xs border-warning/30 text-warning">{delayHours}h delay</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Prevents flash loan attacks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/30">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Vault size cap</p>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{maxSize} BNB max</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Limits exposure during beta</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/30">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Allocation limits</p>
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-500">{maxAllocationPercent}% max</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Max per leader prevents concentration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/30">
                  <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Reentrancy guard</p>
                      <Badge variant="outline" className="text-xs border-success/30 text-success">OpenZeppelin</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Industry-standard protection</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verified Contracts */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Verified contracts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-surface">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Copy Trading Vault</p>
                    <Badge className="text-[10px] bg-success/20 text-success border-0">Verified</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">{shortenAddress(COPY_VAULT_ADDRESS)}</code>
                    <a
                      href={`https://testnet.bscscan.com/address/${COPY_VAULT_ADDRESS}#code`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                {executorAddress && (
                  <div className="p-3 rounded-lg bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Trade Executor</p>
                      <Badge className="text-[10px] bg-warning/20 text-warning border-0">Hot wallet</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">{shortenAddress(executorAddress)}</code>
                      <a
                        href={`https://testnet.bscscan.com/address/${executorAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Executes copy trades on your behalf</p>
                  </div>
                )}
                {pancakeAddress && (
                  <div className="p-3 rounded-lg bg-surface">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">PancakeSwap Prediction</p>
                      <Badge className="text-[10px] bg-primary/20 text-primary border-0">External</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">{shortenAddress(pancakeAddress)}</code>
                      <a
                        href={`https://testnet.bscscan.com/address/${pancakeAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Protocol Parameters */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-secondary" />
                </div>
                Protocol parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Min deposit', value: `${minDepositBNB} BNB` },
                  { label: 'Max vault', value: `${maxSize} BNB` },
                  { label: 'Withdrawal delay', value: `${delayHours} hour${delayHours !== 1 ? 's' : ''}` },
                  { label: 'Max per leader', value: `${maxAllocationPercent}%` },
                  { label: 'Protocol fee', value: `${protocolFeePercent}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-surface text-center">
                    <p className="text-sm font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
