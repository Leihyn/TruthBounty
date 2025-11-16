'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIER_NAMES, TIER_COLORS } from '@/lib/contracts';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserDetailModal } from '@/components/UserDetailModal';
import { CopyTradeButton } from '@/components/CopyTradeButton';
import { formatEther } from 'viem';

interface PlatformBreakdown {
  platform: string;
  bets: number;
  winRate: number;
  score: number;
  volume?: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  truthScore: number;
  tier: number;
  winRate: number;
  totalPredictions: number;
  totalBets?: number;  // Multi-platform support
  wins?: number;
  losses?: number;
  correctPredictions: number;
  totalVolume: string;
  nftTokenId: number;
  lastUpdated: number;
  platforms?: string[];  // Multi-platform support
  platformBreakdown?: PlatformBreakdown[];  // Multi-platform support
  bets?: any[];  // Detailed bet history
}

const ITEMS_PER_PAGE = 20;

export default function LeaderboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [sortBy, setSortBy] = useState('score');
  const [tierFilter, setTierFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ cached: boolean; age?: number } | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortBy,
        tier: tierFilter,
        search: searchQuery,
      });

      const response = await fetch(`/api/leaderboard-db?${params}`);
      const result = await response.json();

      if (result.error) {
        setError(result.error);
      }

      setLeaderboardData(result.data || []);
      setCacheInfo({
        cached: result.cached,
        age: result.cacheAge,
      });
      setDataSource(result.source || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, tierFilter, platformFilter, searchQuery]);

  // Get available platforms from data
  const availablePlatforms = Array.from(
    new Set(
      leaderboardData.flatMap((entry) => entry.platforms || [])
    )
  ).sort();

  // Filter data by platform
  const platformFilteredData = platformFilter === 'all'
    ? leaderboardData
    : leaderboardData.filter((entry) =>
        entry.platforms?.includes(platformFilter)
      );

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: 'Address copied!',
      description: 'Address copied to clipboard',
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  // Get platform-specific data for an entry
  const getPlatformData = (entry: LeaderboardEntry) => {
    if (platformFilter === 'all' || !entry.platformBreakdown) {
      return null;
    }
    return entry.platformBreakdown.find((p) => p.platform === platformFilter);
  };

  // Platform chain mapping
  const PLATFORM_CHAINS: Record<string, string> = {
    'PancakeSwap Prediction': 'BSC (BNB)',
    'Polymarket': 'Polygon (USDC)',
    'Azuro Protocol': 'Polygon (USDC)',
    'Thales': 'Optimism (sUSD)',
  };

  // Pagination (use filtered data)
  const totalPages = Math.ceil(platformFilteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = platformFilteredData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="container px-4 py-6 md:py-12 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 shadow-2xl flex items-center justify-center shadow-yellow-500/50">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black">Global Leaderboard</h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Top predictors ranked by TruthScore and performance
        </p>
        {cacheInfo?.cached && (
          <Badge variant="outline" className="text-xs">
            Cached data ({cacheInfo.age}s old) • Auto-refresh every 5min
          </Badge>
        )}
        {dataSource === 'local-file-fallback' && (
          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
            Using demo data • Database connection unavailable
          </Badge>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-2">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl font-black">{leaderboardData.length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black">
              {leaderboardData[0]?.truthScore || 0}
            </div>
            <p className="text-sm text-muted-foreground">Top Score</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black">
              {leaderboardData.filter((u) => u.tier === 4).length}
            </div>
            <p className="text-sm text-muted-foreground">Diamond Tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black">
            <Search className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter and search for specific users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">TruthScore</SelectItem>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                  <SelectItem value="predictions">Total Predictions</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Platform */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platformFilter} onValueChange={(value) => {
                setPlatformFilter(value);
                setCurrentPage(1); // Reset to page 1 when filtering
              }}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {availablePlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Tier */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier</label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search by Address */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Search Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-h-[44px]"
                />
                <Button
                  variant="outline"
                  onClick={fetchLeaderboard}
                  disabled={isLoading}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Platform Filter Info */}
          {platformFilter !== 'all' && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm">
                Showing <span className="font-bold">{platformFilteredData.length}</span> users on{' '}
                <Badge className="bg-yellow-500">{platformFilter}</Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{Math.min(endIndex, leaderboardData.length)} of{' '}
            {leaderboardData.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : currentPageData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No users found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sticky left-0 bg-background z-10">Rank</TableHead>
                      <TableHead className="sticky left-16 bg-background z-10">Address</TableHead>
                      <TableHead className="text-right">
                        {platformFilter === 'all' ? 'TruthScore' : 'Platform Score'}
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {platformFilter === 'all' ? 'Platforms' : 'Chain/Token'}
                      </TableHead>
                      <TableHead className="text-right hidden md:table-cell">Win Rate</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Bets</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Volume</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {currentPageData.map((entry) => (
                    <TableRow
                      key={entry.address}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(entry);
                        setIsModalOpen(true);
                      }}
                    >
                      {/* Rank */}
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-1 md:gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="font-bold text-sm md:text-base">{entry.rank}</span>
                        </div>
                      </TableCell>

                      {/* Address */}
                      <TableCell className="sticky left-16 bg-background z-10">
                        <div className="flex items-center gap-1 md:gap-2">
                          <code className="text-xs md:text-sm font-mono whitespace-nowrap">
                            {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(entry.address);
                            }}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            {copiedAddress === entry.address ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>

                      {/* TruthScore / Platform Score */}
                      <TableCell className="text-right whitespace-nowrap">
                        {(() => {
                          const platformData = getPlatformData(entry);
                          const score = platformData ? platformData.score : entry.truthScore;
                          return (
                            <span className="font-black text-base md:text-lg bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                              {score.toLocaleString()}
                            </span>
                          );
                        })()}
                      </TableCell>

                      {/* Platforms / Chain */}
                      <TableCell className="hidden sm:table-cell">
                        {platformFilter === 'all' ? (
                          // Show platforms
                          entry.platforms && entry.platforms.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {entry.platforms.slice(0, 2).map((platform) => (
                                <Badge
                                  key={platform}
                                  variant="outline"
                                  className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                >
                                  {platform.split(' ')[0]}
                                </Badge>
                              ))}
                              {entry.platforms.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{entry.platforms.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge className={`${TIER_COLORS[entry.tier]} text-white text-xs`}>
                              {TIER_NAMES[entry.tier]}
                            </Badge>
                          )
                        ) : (
                          // Show chain/token for platform
                          <Badge variant="outline" className="text-xs">
                            {PLATFORM_CHAINS[platformFilter] || platformFilter}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Win Rate */}
                      <TableCell className="text-right hidden md:table-cell whitespace-nowrap">
                        {(() => {
                          const platformData = getPlatformData(entry);
                          const winRate = platformData ? platformData.winRate : entry.winRate;
                          return (
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              <span className="font-black text-sm">{winRate.toFixed(1)}%</span>
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* Bets */}
                      <TableCell className="text-right hidden lg:table-cell whitespace-nowrap">
                        {(() => {
                          const platformData = getPlatformData(entry);
                          const bets = platformData ? platformData.bets : (entry.totalBets || entry.totalPredictions);
                          const wins = platformData
                            ? Math.round(platformData.bets * (platformData.winRate / 100))
                            : (entry.wins || entry.correctPredictions);
                          return (
                            <div className="text-sm">
                              <span className="font-semibold">{bets}</span>
                              <div className="text-xs text-muted-foreground">{wins} wins</div>
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* Volume */}
                      <TableCell className="text-right hidden lg:table-cell whitespace-nowrap">
                        {(() => {
                          const platformData = getPlatformData(entry);
                          const volume = platformData?.volume || entry.totalVolume;
                          try {
                            const volumeNum = Number(formatEther(BigInt(volume)));
                            return (
                              <div className="text-sm">
                                <span className="font-semibold">
                                  {volumeNum > 1000 ? `${(volumeNum / 1000).toFixed(2)}K` : volumeNum.toFixed(2)}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {platformFilter === 'all'
                                    ? (entry.platforms && entry.platforms.length > 1 ? 'Multi-chain' : 'Total')
                                    : PLATFORM_CHAINS[platformFilter]?.split('(')[1]?.replace(')', '') || 'Token'}
                                </div>
                              </div>
                            );
                          } catch {
                            return volume;
                          }
                        })()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-center items-center">
                          <CopyTradeButton
                            traderAddress={entry.address}
                            traderStats={{
                              winRate: entry.winRate,
                              totalBets: entry.totalBets || entry.totalPredictions,
                              totalVolume: entry.totalVolume,
                              platforms: entry.platforms,
                              truthScore: entry.truthScore,
                            }}
                            size="sm"
                            variant="outline"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(entry);
                              setIsModalOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                {/* Page Numbers */}
                <div className="hidden md:flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : ''
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="min-h-[44px]"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Spotlight */}
      {leaderboardData.length >= 3 && (
        <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-950/10 to-orange-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top 3 Predictors
            </CardTitle>
            <CardDescription>The elite performers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {leaderboardData.slice(0, 3).map((entry, index) => (
                <Card
                  key={entry.address}
                  className="border-2 hover:border-yellow-500/50 transition-all cursor-pointer shadow-2xl shadow-yellow-500/20"
                  onClick={() => router.push(`/profile/${entry.address}`)}
                >
                  <CardContent className="p-4 md:p-6 text-center space-y-4">
                    <div className="flex justify-center">
                      {index === 0 && (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 shadow-2xl flex shadow-yellow-500/50">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-300 flex items-center justify-center">
                          <Medal className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center">
                          <Medal className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {entry.truthScore.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">TruthScore</p>
                    </div>
                    <Badge className={`${TIER_COLORS[entry.tier]} text-white`}>
                      {TIER_NAMES[entry.tier]}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-mono">
                      {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                      <div>
                        <div className="font-bold">{entry.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div>
                        <div className="font-bold">{entry.totalPredictions}</div>
                        <div className="text-xs text-muted-foreground">Predictions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={selectedUser}
      />
    </div>
  );
}
