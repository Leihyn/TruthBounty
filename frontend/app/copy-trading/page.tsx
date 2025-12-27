'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { COPY_TRADING_VAULT_ABI, COPY_VAULT_ADDRESS } from '@/lib/contracts';

function SimulationTab({ followerAddress }: { followerAddress?: string }) {
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch(`/api/copy-trading/simulation?stats=true${followerAddress ? `&follower=${followerAddress}` : ''}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const tradesRes = await fetch(`/api/copy-trading/simulation?limit=20${followerAddress ? `&follower=${followerAddress}` : ''}`);
        const tradesData = await tradesRes.json();
        setTrades(tradesData.trades || []);
      } catch (error) {
        console.error('Error fetching simulation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [followerAddress]);

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
  const [simStats, setSimStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSimStats = async () => {
      try {
        const res = await fetch('/api/copy-trading/simulation?stats=true');
        const data = await res.json();
        setSimStats(data);
      } catch (e) {
        console.error('Error fetching sim stats:', e);
      }
    };
    fetchSimStats();
    const interval = setInterval(fetchSimStats, 30000);
    return () => clearInterval(interval);
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

  const { data: userFollowsData, refetch: refetchLeaders } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getUserFollows',
    args: address ? [address] : undefined,
  });

  const followedLeaders = userFollowsData?.map((f: any) => f.leader) || [];

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

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

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
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Copy trading</h1>
        <p className="text-sm text-muted-foreground">Deposit BNB and automatically copy trades from top performers</p>
      </div>

      {/* Info Banner */}
      <Alert className="mb-6 border-primary/30 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription>
          <span className="font-medium">Secure:</span> {delayHours}-hour withdrawal lock. All trades executed by verified executor.
          {executorAddress && (
            <a
              href={`https://bscscan.com/address/${executorAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </AlertDescription>
      </Alert>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">TVL</span>
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Lock className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{Number(tvl).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">BNB</span></p>
            <div className="mt-2">
              <Progress value={utilizationPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{utilizationPercent.toFixed(0)}% of {maxSize} cap</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-secondary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">Simulated</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{simStats?.overall?.totalTrades || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{simStats?.overall?.overallWinRate || 'N/A'} win rate</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-success/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">Your balance</span>
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{Number(balance).toFixed(4)} <span className="text-sm font-normal text-muted-foreground">BNB</span></p>
            <p className={`text-xs mt-1 font-medium ${parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? 'text-success' : 'text-destructive'}`}>
              {parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? '+' : ''}{parseFloat(simStats?.overall?.totalPnlBNB || '0').toFixed(4)} virtual PnL
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">Following</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{leadersCount}</p>
            <p className="text-xs text-muted-foreground mt-1">leaders</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="w-full justify-start bg-surface/50 h-11 p-1 border border-border/50">
          <TabsTrigger value="deposit" className="text-sm gap-2 data-[state=active]:bg-primary/10">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Deposit & withdraw</span>
            <span className="sm:hidden">Funds</span>
          </TabsTrigger>
          <TabsTrigger value="leaders" className="text-sm gap-2 data-[state=active]:bg-primary/10">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Follow leaders</span>
            <span className="sm:hidden">Leaders</span>
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-sm gap-2 data-[state=active]:bg-purple-500/10">
            <FlaskConical className="w-4 h-4" />
            <span>Simulation</span>
          </TabsTrigger>
          <TabsTrigger value="transparency" className="text-sm gap-2 data-[state=active]:bg-primary/10">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Deposit/Withdraw Tab */}
        <TabsContent value="deposit" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="deposit" className="text-sm">Amount (BNB)</Label>
                  <Input
                    id="deposit"
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
        </TabsContent>

        {/* Leaders Tab */}
        <TabsContent value="leaders" className="mt-4">
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
                  {followedLeaders?.map((leader: string) => (
                    <div
                      key={leader}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors"
                    >
                      <div>
                        <p className="font-mono text-sm">{shortenAddress(leader)}</p>
                        <a
                          href={`https://bscscan.com/address/${leader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          BSCScan <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Badge variant="outline" className="text-xs">Following</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="mt-4">
          <SimulationTab followerAddress={address} />
        </TabsContent>

        {/* Transparency Tab */}
        <TabsContent value="transparency" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-success" />
                  </div>
                  Security features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Clock, title: 'Time-locked withdrawals', desc: `${delayHours}-hour delay prevents attacks`, color: 'warning' },
                  { icon: Lock, title: 'Vault size cap', desc: `Maximum ${maxSize} BNB limit`, color: 'primary' },
                  { icon: Users, title: 'Allocation limits', desc: 'Max 50% per leader', color: 'purple-500' },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-surface to-surface-raised border border-border/30">
                    <div className={`w-9 h-9 rounded-lg bg-${color}/15 flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 text-${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contract addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted-foreground mb-1">Vault contract</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">{shortenAddress(COPY_VAULT_ADDRESS)}</code>
                    <a
                      href={`https://bscscan.com/address/${COPY_VAULT_ADDRESS}`}
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
                    <p className="text-xs text-muted-foreground mb-1">Executor address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">{shortenAddress(executorAddress)}</code>
                      <a
                        href={`https://bscscan.com/address/${executorAddress}`}
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
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vault statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'TVL (BNB)', value: Number(tvl).toFixed(2) },
                  { label: 'Copy trades', value: totalCopyTrades },
                  { label: 'Volume (BNB)', value: Number(totalVolume).toFixed(2) },
                  { label: 'Utilization', value: `${utilizationPercent.toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-surface text-center">
                    <p className="text-lg font-bold">{value}</p>
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
