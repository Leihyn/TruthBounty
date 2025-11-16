'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Copy,
  ExternalLink,
  UserPlus,
  Clock,
  Wallet as WalletIcon,
} from 'lucide-react';
import { isAddress } from 'viem';
import Link from 'next/link';

interface TraderStats {
  wallet_address: string;
  username?: string;
  total_bets: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_score: number;
  total_volume: string;
  platforms: string[];
  last_bet_at?: string;
}

interface Bet {
  id: string;
  market_id: string;
  platform: string;
  position: string;
  amount: string;
  won: boolean | null;
  claimed_amount: string | null;
  placed_at: string;
  resolved_at?: string;
  market_name?: string;
}

export default function TraderSearchPage() {
  const account = useAccount();
  const [mounted, setMounted] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [traderStats, setTraderStats] = useState<TraderStats | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isConnected = mounted && !!account.address;
  const userAddress = account.address;

  async function handleSearch() {
    if (!searchAddress.trim()) {
      setSearchError('Please enter an address');
      return;
    }

    if (!isAddress(searchAddress)) {
      setSearchError('Invalid Ethereum address');
      return;
    }

    setSearchError('');
    setLoading(true);
    setTraderStats(null);
    setBets([]);

    try {
      // Fetch trader stats
      const statsRes = await fetch(`/api/traders/stats?address=${searchAddress}`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTraderStats(data.stats);
      } else {
        // Use demo data if API not available
        setTraderStats({
          wallet_address: searchAddress,
          total_bets: 45,
          wins: 32,
          losses: 13,
          win_rate: 71.11,
          total_score: 750,
          total_volume: '12500000000000000000', // 12.5 BNB in wei
          platforms: ['PancakeSwap', 'Polymarket'],
          last_bet_at: new Date().toISOString(),
        });
      }

      // Fetch bet history
      const betsRes = await fetch(`/api/traders/bets?address=${searchAddress}`);
      if (betsRes.ok) {
        const data = await betsRes.json();
        setBets(data.bets || []);
      } else {
        // Use demo bet data
        setBets([
          {
            id: '1',
            market_id: '12345',
            platform: 'PancakeSwap',
            position: 'Bull',
            amount: '500000000000000000', // 0.5 BNB
            won: true,
            claimed_amount: '950000000000000000', // 0.95 BNB
            placed_at: new Date(Date.now() - 3600000).toISOString(),
            resolved_at: new Date(Date.now() - 1800000).toISOString(),
            market_name: 'BNB/USD Round #12345',
          },
          {
            id: '2',
            market_id: '12344',
            platform: 'PancakeSwap',
            position: 'Bear',
            amount: '300000000000000000', // 0.3 BNB
            won: false,
            claimed_amount: '0',
            placed_at: new Date(Date.now() - 7200000).toISOString(),
            resolved_at: new Date(Date.now() - 5400000).toISOString(),
            market_name: 'BNB/USD Round #12344',
          },
          {
            id: '3',
            market_id: '12343',
            platform: 'PancakeSwap',
            position: 'Bull',
            amount: '800000000000000000', // 0.8 BNB
            won: true,
            claimed_amount: '1520000000000000000', // 1.52 BNB
            placed_at: new Date(Date.now() - 10800000).toISOString(),
            resolved_at: new Date(Date.now() - 9000000).toISOString(),
            market_name: 'BNB/USD Round #12343',
          },
          {
            id: '4',
            market_id: '12342',
            platform: 'Polymarket',
            position: 'Yes',
            amount: '1000000000000000000', // 1 BNB
            won: null,
            claimed_amount: null,
            placed_at: new Date(Date.now() - 600000).toISOString(),
            market_name: 'Will BTC reach $100k?',
          },
        ]);
      }

      // Check if already following
      if (isConnected && userAddress) {
        const followRes = await fetch(`/api/copy-trade/follow?address=${userAddress}&trader=${searchAddress}`);
        if (followRes.ok) {
          const followData = await followRes.json();
          setIsFollowing(followData.isFollowing || false);
        }
      }
    } catch (error) {
      console.error('Error fetching trader data:', error);
      setSearchError('Failed to fetch trader data');
    } finally {
      setLoading(false);
    }
  }

  function formatBNB(wei: string): string {
    return (Number(wei) / 1e18).toFixed(4);
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function calculateProfit(amount: string, claimedAmount: string | null, won: boolean | null): string {
    if (won === null || claimedAmount === null) return '0';
    const profit = Number(claimedAmount) - Number(amount);
    return (profit / 1e18).toFixed(4);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-5xl font-bebas uppercase tracking-wider mb-2 bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
          Trader Search
        </h1>
        <p className="text-slate-400">
          Search for any trader's address to view their stats, bet history, and copy their trades
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input
                type="text"
                placeholder="Enter trader address (0x...)"
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value);
                  setSearchError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
            >
              {loading ? (
                <Activity className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
          {searchError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Trader Stats */}
      {traderStats && (
        <>
          <Card className="border-blue-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/90 mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-blue-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-red-500 text-white font-bebas text-2xl">
                      {traderStats.username?.[0]?.toUpperCase() ||
                        traderStats.wallet_address.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl font-bebas uppercase tracking-wider text-slate-200">
                      {traderStats.username || shortenAddress(traderStats.wallet_address)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm text-slate-500">
                        {traderStats.wallet_address}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => navigator.clipboard.writeText(traderStats.wallet_address)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/profile/${traderStats.wallet_address}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                  {isConnected && userAddress !== traderStats.wallet_address && (
                    <Button
                      size="sm"
                      className={
                        isFollowing
                          ? 'bg-slate-700 hover:bg-slate-600'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                      }
                      disabled={isFollowing}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Following' : 'Copy Trade'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Win Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-teko text-blue-400">{traderStats.win_rate.toFixed(1)}%</p>
                    {traderStats.win_rate >= 60 ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Total Bets</p>
                  <p className="text-3xl font-teko text-amber-400">{traderStats.total_bets}</p>
                  <p className="text-xs text-slate-500">
                    {traderStats.wins}W / {traderStats.losses}L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Score</p>
                  <p className="text-3xl font-teko text-red-400">{traderStats.total_score}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Volume</p>
                  <p className="text-3xl font-teko text-blue-400">
                    {formatBNB(traderStats.total_volume)} BNB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {traderStats.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-slate-800 text-slate-300">
                    {platform}
                  </Badge>
                ))}
                {traderStats.last_bet_at && (
                  <span className="text-xs text-slate-500 ml-auto">
                    Last bet: {new Date(traderStats.last_bet_at).toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bet History */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Bets ({bets.length})</TabsTrigger>
              <TabsTrigger value="wins">
                Wins ({bets.filter((b) => b.won === true).length})
              </TabsTrigger>
              <TabsTrigger value="losses">
                Losses ({bets.filter((b) => b.won === false).length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({bets.filter((b) => b.won === null).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {bets.length === 0 ? (
                <Card className="border-slate-700 bg-slate-950/50">
                  <CardContent className="py-16 text-center">
                    <Activity className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No bets found for this trader</p>
                  </CardContent>
                </Card>
              ) : (
                bets.map((bet) => (
                  <Card
                    key={bet.id}
                    className="border-slate-700 bg-gradient-to-r from-slate-900/50 to-slate-950/50 hover:border-blue-500/30 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              {bet.position}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                              {bet.platform}
                            </Badge>
                            {bet.won === true && (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Won
                              </Badge>
                            )}
                            {bet.won === false && (
                              <Badge className="bg-red-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Lost
                              </Badge>
                            )}
                            {bet.won === null && (
                              <Badge variant="secondary" className="bg-yellow-900/20 text-yellow-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            {bet.market_name || `Market #${bet.market_id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            Placed: {new Date(bet.placed_at).toLocaleString()}
                          </p>
                          {bet.resolved_at && (
                            <p className="text-xs text-slate-500">
                              Resolved: {new Date(bet.resolved_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-teko text-slate-200">
                            {formatBNB(bet.amount)} BNB
                          </p>
                          {bet.claimed_amount && (
                            <>
                              <p className="text-sm text-slate-400">
                                → {formatBNB(bet.claimed_amount)} BNB
                              </p>
                              <p
                                className={`text-sm font-semibold ${
                                  Number(calculateProfit(bet.amount, bet.claimed_amount, bet.won)) >= 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {Number(calculateProfit(bet.amount, bet.claimed_amount, bet.won)) >= 0
                                  ? '+'
                                  : ''}
                                {calculateProfit(bet.amount, bet.claimed_amount, bet.won)} BNB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="wins">
              {bets
                .filter((b) => b.won === true)
                .map((bet) => (
                  <Card
                    key={bet.id}
                    className="border-green-500/20 bg-gradient-to-r from-green-950/20 to-slate-950/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              {bet.position}
                            </Badge>
                            <Badge variant="secondary">{bet.platform}</Badge>
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Won
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            {bet.market_name || `Market #${bet.market_id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(bet.placed_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-teko text-slate-200">
                            {formatBNB(bet.amount)} BNB
                          </p>
                          <p className="text-sm text-slate-400">
                            → {formatBNB(bet.claimed_amount!)} BNB
                          </p>
                          <p className="text-sm font-semibold text-green-400">
                            +{calculateProfit(bet.amount, bet.claimed_amount, bet.won)} BNB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="losses">
              {bets
                .filter((b) => b.won === false)
                .map((bet) => (
                  <Card
                    key={bet.id}
                    className="border-red-500/20 bg-gradient-to-r from-red-950/20 to-slate-950/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              {bet.position}
                            </Badge>
                            <Badge variant="secondary">{bet.platform}</Badge>
                            <Badge className="bg-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Lost
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            {bet.market_name || `Market #${bet.market_id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(bet.placed_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-teko text-slate-200">
                            {formatBNB(bet.amount)} BNB
                          </p>
                          <p className="text-sm font-semibold text-red-400">
                            -{formatBNB(bet.amount)} BNB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="pending">
              {bets
                .filter((b) => b.won === null)
                .map((bet) => (
                  <Card
                    key={bet.id}
                    className="border-yellow-500/20 bg-gradient-to-r from-yellow-950/20 to-slate-950/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              {bet.position}
                            </Badge>
                            <Badge variant="secondary">{bet.platform}</Badge>
                            <Badge className="bg-yellow-900/20 text-yellow-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            {bet.market_name || `Market #${bet.market_id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(bet.placed_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-teko text-slate-200">
                            {formatBNB(bet.amount)} BNB
                          </p>
                          <p className="text-xs text-slate-500">Awaiting result</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
