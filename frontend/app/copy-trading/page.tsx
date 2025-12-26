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
} from 'lucide-react';
import Link from 'next/link';
import { COPY_TRADING_VAULT_ABI, COPY_VAULT_ADDRESS } from '@/lib/contracts';

// Simulation Tab Component
function SimulationTab({ followerAddress }: { followerAddress?: string }) {
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch(`/api/copy-trading/simulation?stats=true${followerAddress ? `&follower=${followerAddress}` : ''}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch recent trades
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [followerAddress]);

  if (loading) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
        <CardContent className="flex items-center justify-center py-16">
          <Activity className="h-8 w-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Mode Banner */}
      <Alert className="border-purple-500/50 bg-purple-500/10">
        <FlaskConical className="h-4 w-4 text-purple-500" />
        <AlertDescription className="text-purple-200">
          <span className="font-semibold">Testnet Simulation Mode:</span> Using real mainnet leader data with simulated trade execution. No real funds at risk.
        </AlertDescription>
      </Alert>

      {/* Overall Stats */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
        <CardHeader>
          <CardTitle className="text-2xl font-bebas uppercase tracking-wider bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-purple-500" />
            Simulation Results
          </CardTitle>
          <CardDescription className="text-slate-400">
            Virtual performance based on real mainnet predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.overall ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-3xl font-teko text-purple-400">{stats.overall.totalTrades}</p>
                <p className="text-xs text-slate-500">Simulated Trades</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-3xl font-teko text-green-400">{stats.overall.overallWinRate}</p>
                <p className="text-xs text-slate-500">Win Rate</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                <p className={`text-3xl font-teko ${parseFloat(stats.overall.totalPnlBNB) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(stats.overall.totalPnlBNB) >= 0 ? '+' : ''}{parseFloat(stats.overall.totalPnlBNB).toFixed(4)}
                </p>
                <p className="text-xs text-slate-500">Virtual PnL (BNB)</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-3xl font-teko text-amber-400">{stats.overall.totalPending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No simulation data yet</p>
              <p className="text-sm mt-2">Follow a leader and wait for them to place bets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="border-slate-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
        <CardHeader>
          <CardTitle className="text-xl font-bebas uppercase tracking-wider text-slate-200">
            Recent Simulated Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <div className="space-y-3">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    {trade.outcome === 'win' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : trade.outcome === 'loss' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Timer className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Epoch #{trade.epoch} - {trade.isBull ? '🐂 BULL' : '🐻 BEAR'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Leader: {trade.leader?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">{parseFloat(trade.amountBNB).toFixed(4)} BNB</p>
                    {trade.pnlBNB && (
                      <p className={`text-xs ${parseFloat(trade.pnlBNB) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(trade.pnlBNB) >= 0 ? '+' : ''}{parseFloat(trade.pnlBNB).toFixed(4)} BNB
                      </p>
                    )}
                    {trade.outcome === 'pending' && (
                      <p className="text-xs text-amber-400">Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>No simulated trades yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-slate-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
        <CardHeader>
          <CardTitle className="text-lg font-bebas uppercase tracking-wider text-slate-200">
            How Simulation Mode Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-400">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
            <p>You deposit testnet BNB and follow leaders from the real mainnet leaderboard</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
            <p>The simulator monitors REAL mainnet bets from your followed leaders</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
            <p>When a leader bets, we calculate and LOG what your copy trade would be (no execution)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
            <p>After rounds resolve on mainnet, we calculate your virtual PnL</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
            <p className="text-green-300">This lets you test copy-trading strategies with zero risk before going live!</p>
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

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch simulation stats
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

  // Read vault stats
  const { data: vaultStats, refetch: refetchStats } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  // Read max vault size
  const { data: maxVaultSize } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'MAX_VAULT_SIZE',
  });

  // Read withdrawal delay
  const { data: withdrawalDelay } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'WITHDRAWAL_DELAY',
  });

  // Read user balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  // Read pending withdrawal
  const { data: pendingWithdrawal, refetch: refetchPending } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getPendingWithdrawal',
    args: address ? [address] : undefined,
  });

  // Read followed leaders (getUserFollows returns Follow[] structs)
  const { data: userFollowsData, refetch: refetchLeaders } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getUserFollows',
    args: address ? [address] : undefined,
  });

  // Extract leader addresses from the Follow structs
  const followedLeaders = userFollowsData?.map((f: any) => f.leader) || [];

  // Write functions
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: requestWithdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: executeWithdraw, data: executeHash, isPending: isExecuting } = useWriteContract();
  const { writeContract: cancelWithdraw, data: cancelHash, isPending: isCancelling } = useWriteContract();

  // Wait for transactions
  const { isLoading: isDepositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });
  const { isLoading: isExecuteConfirming, isSuccess: executeSuccess } = useWaitForTransactionReceipt({ hash: executeHash });
  const { isLoading: isCancelConfirming, isSuccess: cancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  // Refetch on success
  useEffect(() => {
    if (depositSuccess || withdrawSuccess || executeSuccess || cancelSuccess) {
      refetchBalance();
      refetchStats();
      refetchPending();
      refetchLeaders();
    }
  }, [depositSuccess, withdrawSuccess, executeSuccess, cancelSuccess]);

  // Parse vault data
  const tvl = vaultStats ? formatEther(vaultStats[0]) : '0';
  const totalCopyTrades = vaultStats ? Number(vaultStats[1]) : 0;
  const totalVolume = vaultStats ? formatEther(vaultStats[2]) : '0';
  const executorAddress = vaultStats ? vaultStats[4] : null;
  const maxSize = maxVaultSize ? formatEther(maxVaultSize) : '100';
  const utilizationPercent = maxVaultSize && vaultStats ? (Number(formatEther(vaultStats[0])) / Number(formatEther(maxVaultSize))) * 100 : 0;
  const delayHours = withdrawalDelay ? Number(withdrawalDelay) / 3600 : 1;

  // User data
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

  // Show nothing during SSR
  if (!mounted) {
    return null;
  }

  // Check if vault is deployed
  const vaultNotDeployed = COPY_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';

  if (vaultNotDeployed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
            <h2 className="text-3xl font-bebas uppercase tracking-wider mb-2 text-amber-400">
              Copy Trading Coming Soon
            </h2>
            <p className="text-slate-400 text-center max-w-md">
              The Copy Trading Vault contract has not been deployed yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="border-red-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-gold-500/20 blur-xl" />
              <Wallet className="h-16 w-16 text-blue-500 relative" />
            </div>
            <h2 className="text-3xl font-bebas uppercase tracking-wider mb-2 bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-slate-400 text-center">
              Connect your wallet to access copy trading
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bebas uppercase tracking-wider mb-2 bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
          Copy Trading Vault
        </h1>
        <p className="text-slate-400">
          Deposit BNB and automatically copy trades from top prediction traders
        </p>
      </div>

      {/* Transparency Banner */}
      <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
        <Shield className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-200">
          <span className="font-semibold">Transparent & Secure:</span> All trades are executed by a public executor address. Withdrawals have a {delayHours}-hour time lock for security.
          {executorAddress && (
            <a
              href={`https://bscscan.com/address/${executorAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              View Executor <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </AlertDescription>
      </Alert>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total Value Locked
              </CardTitle>
              <Lock className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-blue-400">{Number(tvl).toFixed(2)} BNB</div>
            <Progress value={utilizationPercent} className="h-1.5 mt-2 bg-slate-800 [&>div]:bg-blue-500" />
            <p className="text-xs text-slate-500 mt-1">{utilizationPercent.toFixed(1)}% of {maxSize} BNB cap</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Simulated Trades
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-amber-400">{simStats?.overall?.totalTrades || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {simStats?.overall?.overallWinRate || 'N/A'} win rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Virtual PnL
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-teko ${parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(simStats?.overall?.totalPnlBNB || '0') >= 0 ? '+' : ''}{parseFloat(simStats?.overall?.totalPnlBNB || '0').toFixed(4)} BNB
            </div>
            <p className="text-xs text-slate-500 mt-1">Balance: {Number(balance).toFixed(4)} BNB</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Following
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-teko text-blue-400">{leadersCount}</div>
            <p className="text-xs text-slate-500 mt-1">Leaders</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deposit">Deposit & Withdraw</TabsTrigger>
          <TabsTrigger value="leaders">Follow Leaders</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="transparency">Transparency</TabsTrigger>
        </TabsList>

        {/* Deposit/Withdraw Tab */}
        <TabsContent value="deposit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deposit Card */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
              <CardHeader>
                <CardTitle className="text-xl font-bebas uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  Deposit BNB
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add funds to your copy trading balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deposit" className="text-slate-400">Amount (BNB)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-200"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum: 0.01 BNB</p>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || isDepositConfirming || !depositAmount}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
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
            <Card className="border-amber-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
              <CardHeader>
                <CardTitle className="text-xl font-bebas uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Minus className="h-5 w-5 text-amber-500" />
                  Withdraw BNB
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {delayHours}-hour time lock for security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPendingWithdrawal ? (
                  <div className="space-y-4">
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-200">
                        <div className="font-semibold">{pendingAmount} BNB pending</div>
                        <div className="text-sm">{formatTimeRemaining(unlockTime)}</div>
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExecuteWithdraw}
                        disabled={!canExecuteWithdrawal || isExecuting || isExecuteConfirming}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
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
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        {isCancelling || isCancelConfirming ? (
                          <Activity className="h-4 w-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="withdraw" className="text-slate-400">Amount (BNB)</Label>
                      <Input
                        id="withdraw"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        placeholder="0.1"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Available: {balance} BNB</p>
                    </div>
                    <Button
                      onClick={handleRequestWithdraw}
                      disabled={isWithdrawing || isWithdrawConfirming || !withdrawAmount || Number(withdrawAmount) > Number(balance)}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600"
                    >
                      {isWithdrawing || isWithdrawConfirming ? (
                        <Activity className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      {isWithdrawing ? 'Confirming...' : isWithdrawConfirming ? 'Processing...' : 'Request Withdrawal'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Follow Leaders Tab */}
        <TabsContent value="leaders" className="space-y-4">
          <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
            <CardHeader>
              <CardTitle className="text-2xl font-bebas uppercase tracking-wider bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                Follow Top Traders
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select traders from the leaderboard to automatically copy their bets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {leadersCount === 0 ? (
                <div className="text-center py-8">
                  <div className="relative mb-6 inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-amber-500/20 blur-xl" />
                    <Users className="h-16 w-16 text-blue-500 relative" />
                  </div>
                  <h3 className="text-2xl font-bebas uppercase tracking-wider mb-2 text-slate-200">
                    No Leaders Followed
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Browse the leaderboard to find top traders to copy
                  </p>
                  <Link href="/leaderboard">
                    <Button className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500">
                      <Eye className="h-4 w-4 mr-2" />
                      Browse Leaderboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    You are following {leadersCount} trader{leadersCount !== 1 ? 's' : ''}
                  </p>
                  {followedLeaders?.map((leader: string) => (
                    <div
                      key={leader}
                      className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-gradient-to-r from-slate-900/50 to-slate-950/50"
                    >
                      <div>
                        <p className="font-mono text-slate-200">{shortenAddress(leader)}</p>
                        <a
                          href={`https://bscscan.com/address/${leader}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          View on BSCScan <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                        Following
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <SimulationTab followerAddress={address} />
        </TabsContent>

        {/* Transparency Tab */}
        <TabsContent value="transparency" className="space-y-4">
          <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90">
            <CardHeader>
              <CardTitle className="text-2xl font-bebas uppercase tracking-wider bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                Vault Transparency
              </CardTitle>
              <CardDescription className="text-slate-400">
                Full visibility into the copy trading system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bebas uppercase tracking-wider text-slate-200">
                    Security Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-200">Time-Locked Withdrawals</p>
                        <p className="text-sm text-slate-400">{delayHours}-hour delay prevents flash loan attacks</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <Lock className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-200">Vault Size Cap</p>
                        <p className="text-sm text-slate-400">Maximum {maxSize} BNB to limit risk</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <Users className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-200">Max 50% Allocation</p>
                        <p className="text-sm text-slate-400">Per-leader allocation capped at 50%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bebas uppercase tracking-wider text-slate-200">
                    Contract Addresses
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <p className="text-sm text-slate-400 mb-1">Vault Contract</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-300 font-mono">{shortenAddress(COPY_VAULT_ADDRESS)}</code>
                        <a
                          href={`https://bscscan.com/address/${COPY_VAULT_ADDRESS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    {executorAddress && (
                      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Executor Address</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-slate-300 font-mono">{shortenAddress(executorAddress)}</code>
                          <a
                            href={`https://bscscan.com/address/${executorAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">This address executes copy trades on your behalf</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              <div>
                <h3 className="text-lg font-bebas uppercase tracking-wider text-slate-200 mb-4">
                  Vault Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <p className="text-2xl font-teko text-blue-400">{Number(tvl).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">TVL (BNB)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <p className="text-2xl font-teko text-amber-400">{totalCopyTrades}</p>
                    <p className="text-xs text-slate-500">Copy Trades</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <p className="text-2xl font-teko text-red-400">{Number(totalVolume).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Volume (BNB)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <p className="text-2xl font-teko text-blue-400">{utilizationPercent.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Utilization</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
