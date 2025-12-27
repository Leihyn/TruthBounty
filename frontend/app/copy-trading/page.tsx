'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Activity,
  Wallet,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Plus,
  Minus,
  Eye,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Zap,
  ChevronRight,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { COPY_TRADING_VAULT_ABI, COPY_VAULT_ADDRESS } from '@/lib/contracts';

// ============================================
// NEW INFORMATION ARCHITECTURE
// ============================================
// User States:
// 1. Not connected → Connect prompt
// 2. Connected, no balance → Onboarding to deposit
// 3. Has balance, no leaders → Guide to follow
// 4. Active (balance + leaders) → Dashboard
// ============================================

export default function CopyTradingPage() {
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [simStats, setSimStats] = useState<any>(null);

  useEffect(() => setMounted(true), []);

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

  // Contract reads
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  const { data: userFollowsData, refetch: refetchLeaders } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getUserFollows',
    args: address ? [address] : undefined,
  });

  const { data: vaultStats } = useReadContract({
    address: COPY_VAULT_ADDRESS,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  // Contract writes
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: requestWithdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (depositSuccess || withdrawSuccess) {
      refetchBalance();
      refetchLeaders();
      setDepositOpen(false);
      setWithdrawOpen(false);
    }
  }, [depositSuccess, withdrawSuccess]);

  // Derived state
  const balance = userBalance ? formatEther(userBalance) : '0';
  const hasBalance = Number(balance) > 0;
  const followedLeaders = userFollowsData?.map((f: any) => f.leader) || [];
  const leadersCount = followedLeaders.length;
  const hasLeaders = leadersCount > 0;
  const tvl = vaultStats ? formatEther(vaultStats[0]) : '0';
  const virtualPnL = parseFloat(simStats?.overall?.totalPnlBNB || '0');
  const winRate = simStats?.overall?.overallWinRate || '0%';
  const totalTrades = simStats?.overall?.totalTrades || 0;

  // Handlers
  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    deposit({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'deposit',
      value: parseEther(depositAmount),
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    requestWithdraw({
      address: COPY_VAULT_ADDRESS,
      abi: COPY_TRADING_VAULT_ABI,
      functionName: 'requestWithdrawal',
      args: [parseEther(withdrawAmount)],
    });
  };

  if (!mounted) return null;

  // Check if vault is deployed
  const vaultNotDeployed = COPY_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';
  if (vaultNotDeployed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-warning/30 bg-warning/5">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground">Copy trading vault is not yet deployed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 1: Not connected
  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Copy className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Copy Trading</h2>
            <p className="text-muted-foreground mb-6">
              Automatically copy trades from top performers. Connect your wallet to get started.
            </p>
            <div className="flex flex-col gap-3 text-sm text-left mb-6">
              {[
                'Deposit BNB to your vault balance',
                'Follow top-performing traders',
                'Trades are copied automatically',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" size="lg" disabled>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet to Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 2: Connected but no balance
  if (!hasBalance && !hasLeaders) {
    return (
      <div className="container max-w-2xl py-8 px-4">
        {/* Welcome Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Get Started with Copy Trading</h1>
                <p className="text-sm text-muted-foreground">
                  Deposit BNB to start copying trades from top performers automatically.
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Deposit Amount (BNB)</Label>
                <div className="flex gap-2 mt-2">
                  {['0.05', '0.1', '0.5'].map((amt) => (
                    <Button
                      key={amt}
                      variant={depositAmount === amt ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDepositAmount(amt)}
                      className="flex-1"
                    >
                      {amt}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-2"
                  placeholder="Custom amount"
                />
              </div>
              <Button
                onClick={handleDeposit}
                disabled={isDepositing || isDepositConfirming || !depositAmount}
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-blue-600"
                size="lg"
              >
                {isDepositing || isDepositConfirming ? (
                  <Activity className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Plus className="h-5 w-5 mr-2" />
                )}
                {isDepositing ? 'Confirm in wallet...' : isDepositConfirming ? 'Processing...' : 'Deposit & Start'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-sm">Secure Vault</p>
                <p className="text-xs text-muted-foreground">1-hour withdrawal lock protects your funds</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <FlaskConical className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Simulation Mode</p>
                <p className="text-xs text-muted-foreground">Test with virtual trades, no risk</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // STATE 3 & 4: Has balance - Show Dashboard
  return (
    <div className="container max-w-6xl py-6 px-4">
      {/* DESKTOP: Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT: Status Panel (sticky on desktop) */}
        <div className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Balance Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5">
                <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                <p className="text-3xl font-bold">{Number(balance).toFixed(4)} <span className="text-lg text-muted-foreground">BNB</span></p>
                <p className={`text-sm mt-1 font-medium ${virtualPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {virtualPnL >= 0 ? '+' : ''}{virtualPnL.toFixed(4)} BNB virtual PnL
                </p>
              </div>
              <CardContent className="p-4 space-y-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold">{leadersCount}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-success">{winRate}</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deposit BNB</DialogTitle>
                        <DialogDescription>Add funds to your copy trading balance</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="flex gap-2">
                          {['0.05', '0.1', '0.5'].map((amt) => (
                            <Button
                              key={amt}
                              variant={depositAmount === amt ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDepositAmount(amt)}
                              className="flex-1"
                            >
                              {amt} BNB
                            </Button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Custom amount"
                        />
                        <Button
                          onClick={handleDeposit}
                          disabled={isDepositing || isDepositConfirming}
                          className="w-full"
                        >
                          {isDepositing || isDepositConfirming ? (
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Deposit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1" size="sm">
                        <Minus className="h-4 w-4 mr-1" /> Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Withdraw BNB</DialogTitle>
                        <DialogDescription>1-hour time lock for security</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label className="text-sm">Amount (BNB)</Label>
                          <Input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0.1"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Available: {balance} BNB</p>
                        </div>
                        <Button
                          onClick={handleWithdraw}
                          disabled={isWithdrawing || isWithdrawConfirming || !withdrawAmount}
                          className="w-full"
                          variant="secondary"
                        >
                          {isWithdrawing || isWithdrawConfirming ? (
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          Request Withdrawal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Vault Info - Desktop only */}
            <Card className="hidden lg:block border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Vault Info</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total TVL</span>
                    <span className="font-medium">{Number(tvl).toFixed(2)} BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your trades</span>
                    <span className="font-medium">{totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security</span>
                    <span className="font-medium text-success">1h lock</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT: Main Content */}
        <div className="flex-1 space-y-6">
          {/* Guide to follow leaders if none */}
          {!hasLeaders && (
            <Card className="border-warning/30 bg-gradient-to-r from-warning/10 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Follow traders to start</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Browse the leaderboard and follow top performers to automatically copy their trades.
                    </p>
                    <Link href="/leaderboard">
                      <Button size="sm">
                        Browse Leaderboard <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Following List */}
          {hasLeaders && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Following</CardTitle>
                  <Link href="/leaderboard">
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add more
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {followedLeaders.slice(0, 5).map((leader: string) => (
                    <div key={leader} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <code className="text-sm">{leader.slice(0, 8)}...{leader.slice(-6)}</code>
                      </div>
                      <Badge variant="outline" className="text-success border-success/30">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalTrades > 0 ? (
                <div className="space-y-2">
                  <Alert className="border-purple-500/30 bg-purple-500/5">
                    <FlaskConical className="h-4 w-4 text-purple-500" />
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{totalTrades}</span> simulated trades • <span className="text-success">{winRate}</span> win rate
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No trades yet</p>
                  <p className="text-xs mt-1">Follow leaders and wait for them to place bets</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it works - collapsed on mobile */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Plus, title: 'Deposit', desc: 'Add BNB to your vault balance' },
                  { icon: Users, title: 'Follow', desc: 'Select top traders from leaderboard' },
                  { icon: Zap, title: 'Auto-copy', desc: 'Trades are copied automatically' },
                  { icon: TrendingUp, title: 'Earn', desc: 'Track your virtual PnL' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
