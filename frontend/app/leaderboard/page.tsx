'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIER_NAMES, TIER_COLORS, ReputationTier, TIER_THRESHOLDS } from '@/lib/contracts';
import {
  Trophy,
  Medal,
  Search,
  Copy,
  Check,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserDetailModal } from '@/components/UserDetailModal';
import { CopyTradeButton } from '@/components/CopyTradeButton';
import { formatEther } from 'viem';

interface LeaderboardEntry {
  rank: number;
  address: string;
  truthScore: number;
  rawScore: number;  // Original platform score
  normalizedScore: number;  // Percentile-normalized score (0-1300)
  percentileRank: number;  // Percentile within platform (0-100)
  tier: number;
  winRate: number;
  totalPredictions: number;
  totalBets?: number;
  wins?: number;
  correctPredictions: number;
  totalVolume: string;
  nftTokenId: number;
  platforms?: string[];
  username?: string;
}

const ITEMS_PER_PAGE = 20;

function getTierFromScore(score: number): ReputationTier {
  if (score >= TIER_THRESHOLDS[ReputationTier.DIAMOND]) return ReputationTier.DIAMOND;
  if (score >= TIER_THRESHOLDS[ReputationTier.PLATINUM]) return ReputationTier.PLATINUM;
  if (score >= TIER_THRESHOLDS[ReputationTier.GOLD]) return ReputationTier.GOLD;
  if (score >= TIER_THRESHOLDS[ReputationTier.SILVER]) return ReputationTier.SILVER;
  return ReputationTier.BRONZE;
}

const TIER_FILTER_MAP: Record<string, ReputationTier | null> = {
  all: null,
  diamond: ReputationTier.DIAMOND,
  platinum: ReputationTier.PLATINUM,
  gold: ReputationTier.GOLD,
  silver: ReputationTier.SILVER,
  bronze: ReputationTier.BRONZE,
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score');
  const [tierFilter, setTierFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Fetch both PancakeSwap and Polymarket data in parallel
      const [pancakeRes, polyRes] = await Promise.all([
        fetch(`/api/leaderboard-db?sortBy=${sortBy}&search=${searchQuery}&limit=100`),
        fetch(`/api/leaderboard-db?platform=Polymarket&limit=100`),
      ]);

      const [pancakeResult, polyResult] = await Promise.all([
        pancakeRes.json(),
        polyRes.json(),
      ]);

      // Process PancakeSwap data - USE SCORES DIRECTLY (already calculated by API)
      const pancakeData = (pancakeResult.data || [])
        .map((entry: any) => ({
          ...entry,
          totalPredictions: entry.totalBets || entry.totalPredictions || 0,
          rawScore: entry.truthScore,
          normalizedScore: entry.truthScore, // Use API score directly
          platforms: entry.platforms || ['PancakeSwap'],
        }));

      // Process Polymarket data - USE SCORES DIRECTLY (already calculated by API)
      const polyData = (polyResult.data || [])
        .map((entry: any) => ({
          ...entry,
          totalPredictions: entry.totalBets || entry.totalPredictions || 0,
          rawScore: entry.truthScore,
          normalizedScore: entry.truthScore, // Use API score directly
          platforms: entry.platforms || ['Polymarket'],
        }));

      // Combine both datasets
      const allData = [...pancakeData, ...polyData];

      // Sort by score for global ranking
      allData.sort((a, b) => b.truthScore - a.truthScore);

      // Add global rank and tier based on score
      const dataWithTiers = allData.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        tier: getTierFromScore(entry.truthScore),
      }));

      setLeaderboardData(dataWithTiers);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, searchQuery]);

  // When filtering by platform, use raw scores and re-rank within platform
  const filteredData = (() => {
    let data = leaderboardData;

    // Platform filter
    if (platformFilter !== 'all') {
      data = data.filter(entry => {
        const platforms = entry.platforms || [];
        if (platformFilter === 'polymarket') return platforms.includes('Polymarket');
        if (platformFilter === 'pancakeswap') return platforms.includes('PancakeSwap Prediction');
        return true;
      });

      // When filtering by platform, use raw scores and re-rank
      data = data
        .map(entry => ({
          ...entry,
          truthScore: entry.rawScore, // Show raw platform score
          tier: getTierFromScore(entry.rawScore),
        }))
        .sort((a, b) => b.truthScore - a.truthScore)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    }

    // Tier filter (applied after platform filter)
    if (tierFilter !== 'all') {
      data = data.filter(entry => entry.tier === TIER_FILTER_MAP[tierFilter]);
    }

    return data;
  })();

  useEffect(() => {
    setCurrentPage(1);
  }, [tierFilter, platformFilter]);

  const handleCopyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({ title: 'Copied', description: 'Address copied to clipboard' });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatVolume = (vol: string) => {
    try {
      const v = Number(formatEther(BigInt(vol)));
      return v > 1000 ? `${(v/1000).toFixed(1)}K` : v.toFixed(1);
    } catch { return '0'; }
  };

  // Separate top 3 and rest
  const top3 = filteredData.slice(0, 3);
  const restData = filteredData.slice(3);

  const totalPages = Math.ceil(restData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageData = restData.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  return (
    <div className="container px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {platformFilter === 'all' ? 'Global Leaderboard' :
             platformFilter === 'polymarket' ? 'Polymarket Leaderboard' : 'PancakeSwap Leaderboard'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {platformFilter === 'all'
              ? 'Cross-platform ranking by percentile-normalized TruthScore'
              : `Platform ranking by raw TruthScore`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{filteredData.length}</span>
            <span className="text-muted-foreground hidden sm:inline">traders</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-secondary">{filteredData[0]?.truthScore || 0}</span>
            <span className="text-muted-foreground hidden sm:inline">top score</span>
          </div>
        </div>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">TruthScore</SelectItem>
              <SelectItem value="winRate">Win Rate</SelectItem>
              <SelectItem value="predictions">Predictions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="polymarket">Polymarket</SelectItem>
              <SelectItem value="pancakeswap">PancakeSwap</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue placeholder="Tier" />
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

          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Button variant="outline" size="icon" onClick={fetchLeaderboard} disabled={isLoading} className="h-9 w-9 shrink-0">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No traders found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length > 0 && currentPage === 1 && tierFilter === 'all' && !searchQuery && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {/* 2nd Place */}
              {top3[1] && (() => {
                const entry = top3[1];
                const tier = getTierFromScore(entry.truthScore);
                return (
                  <button
                    key={entry.address}
                    onClick={() => { setSelectedUser(entry); setIsModalOpen(true); }}
                    className="flex flex-col p-3 sm:p-4 rounded-xl border bg-gradient-to-br from-gray-400/10 to-surface border-gray-400/30 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-400/20">
                        <span className="text-base sm:text-lg font-bold text-gray-400">2</span>
                      </div>
                      <Badge className={`${TIER_COLORS[tier]} text-white text-[10px]`}>{TIER_NAMES[tier]}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-gray-400/50">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs sm:text-sm font-bold">
                          {entry.address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0">
                        {entry.username ? (
                          <span className="text-xs sm:text-sm font-medium truncate block">{entry.username}</span>
                        ) : (
                          <code className="font-mono text-xs sm:text-sm truncate block">{shortenAddress(entry.address)}</code>
                        )}
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-muted-foreground">{entry.totalPredictions.toLocaleString()} bets</p>
                          {entry.platforms?.includes('Polymarket') && (
                            <span className="px-1 py-0 rounded bg-purple-500/20 text-purple-400 text-[8px]">Poly</span>
                          )}
                          {entry.platforms?.includes('PancakeSwap Prediction') && (
                            <span className="px-1 py-0 rounded bg-amber-500/20 text-amber-400 text-[8px]">Cake</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <div className="p-1.5 rounded-lg bg-surface/50 text-center">
                        <p className="text-base sm:text-lg font-bold">{entry.truthScore}</p>
                        <p className="text-[9px] text-muted-foreground">Score</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-surface/50 text-center">
                        <p className="text-base sm:text-lg font-bold text-success">{entry.winRate.toFixed(0)}%</p>
                        <p className="text-[9px] text-muted-foreground">Win</p>
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* 1st Place - Elevated */}
              {top3[0] && (() => {
                const entry = top3[0];
                const tier = getTierFromScore(entry.truthScore);
                return (
                  <button
                    key={entry.address}
                    onClick={() => { setSelectedUser(entry); setIsModalOpen(true); }}
                    className="flex flex-col p-3 sm:p-5 rounded-xl border-2 bg-gradient-to-br from-secondary/20 to-surface border-secondary/50 transition-all hover:scale-[1.02] -mt-4 shadow-lg shadow-secondary/10"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-secondary/20">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                      </div>
                      <Badge className={`${TIER_COLORS[tier]} text-white`}>{TIER_NAMES[tier]}</Badge>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-secondary/50">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm sm:text-base font-bold">
                          {entry.address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0">
                        {entry.username ? (
                          <span className="text-sm sm:text-base font-semibold truncate block">{entry.username}</span>
                        ) : (
                          <code className="font-mono text-sm sm:text-base truncate block">{shortenAddress(entry.address)}</code>
                        )}
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground">{entry.totalPredictions.toLocaleString()} bets</p>
                          {entry.platforms?.includes('Polymarket') && (
                            <span className="px-1 py-0 rounded bg-purple-500/20 text-purple-400 text-[9px]">Poly</span>
                          )}
                          {entry.platforms?.includes('PancakeSwap Prediction') && (
                            <span className="px-1 py-0 rounded bg-amber-500/20 text-amber-400 text-[9px]">Cake</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="p-2 rounded-lg bg-surface/50 text-center">
                        <p className="text-lg sm:text-2xl font-bold text-secondary">{entry.truthScore}</p>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface/50 text-center">
                        <p className="text-lg sm:text-2xl font-bold text-success">{entry.winRate.toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">Win</p>
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* 3rd Place */}
              {top3[2] && (() => {
                const entry = top3[2];
                const tier = getTierFromScore(entry.truthScore);
                return (
                  <button
                    key={entry.address}
                    onClick={() => { setSelectedUser(entry); setIsModalOpen(true); }}
                    className="flex flex-col p-3 sm:p-4 rounded-xl border bg-gradient-to-br from-amber-600/10 to-surface border-amber-600/30 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-amber-600/20">
                        <span className="text-base sm:text-lg font-bold text-amber-600">3</span>
                      </div>
                      <Badge className={`${TIER_COLORS[tier]} text-white text-[10px]`}>{TIER_NAMES[tier]}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-amber-600/50">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs sm:text-sm font-bold">
                          {entry.address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0">
                        {entry.username ? (
                          <span className="text-xs sm:text-sm font-medium truncate block">{entry.username}</span>
                        ) : (
                          <code className="font-mono text-xs sm:text-sm truncate block">{shortenAddress(entry.address)}</code>
                        )}
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-muted-foreground">{entry.totalPredictions.toLocaleString()} bets</p>
                          {entry.platforms?.includes('Polymarket') && (
                            <span className="px-1 py-0 rounded bg-purple-500/20 text-purple-400 text-[8px]">Poly</span>
                          )}
                          {entry.platforms?.includes('PancakeSwap Prediction') && (
                            <span className="px-1 py-0 rounded bg-amber-500/20 text-amber-400 text-[8px]">Cake</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <div className="p-1.5 rounded-lg bg-surface/50 text-center">
                        <p className="text-base sm:text-lg font-bold">{entry.truthScore}</p>
                        <p className="text-[9px] text-muted-foreground">Score</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-surface/50 text-center">
                        <p className="text-base sm:text-lg font-bold text-success">{entry.winRate.toFixed(0)}%</p>
                        <p className="text-[9px] text-muted-foreground">Win</p>
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          )}

          {/* Rest of Leaderboard */}
          {(currentPageData.length > 0 || currentPage > 1 || tierFilter !== 'all' || searchQuery) && (
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {(tierFilter === 'all' && !searchQuery && currentPage === 1 ? currentPageData : filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE)).map((entry) => {
                    const tier = getTierFromScore(entry.truthScore);
                    const isTop3 = entry.rank <= 3;

                    return (
                      <div
                        key={entry.address}
                        onClick={() => { setSelectedUser(entry); setIsModalOpen(true); }}
                        className="flex items-center gap-3 p-3 sm:p-4 hover:bg-surface/50 cursor-pointer transition-colors group"
                      >
                        {/* Rank */}
                        <div className="w-8 text-center shrink-0">
                          {isTop3 ? (
                            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${
                              entry.rank === 1 ? 'bg-secondary/20 text-secondary' :
                              entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                              'bg-amber-600/20 text-amber-600'
                            }`}>
                              {entry.rank === 1 ? <Trophy className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">{entry.rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 hidden sm:flex">
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-secondary/80 text-white text-xs">
                            {entry.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {entry.username ? (
                              <span className="text-sm font-medium truncate">{entry.username}</span>
                            ) : (
                              <code className="text-sm font-mono truncate">{shortenAddress(entry.address)}</code>
                            )}
                            <button onClick={(e) => handleCopyAddress(entry.address, e)} className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {copiedAddress === entry.address ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                            <Badge className={`${TIER_COLORS[tier]} text-white text-[10px] px-1.5 py-0`}>
                              {TIER_NAMES[tier]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-success" />
                              {entry.winRate.toFixed(1)}%
                            </span>
                            <span>{entry.totalPredictions.toLocaleString()} bets</span>
                            <span className="hidden sm:inline">{formatVolume(entry.totalVolume)} vol</span>
                            {entry.platforms?.includes('Polymarket') && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">Poly</span>
                            )}
                            {entry.platforms?.includes('PancakeSwap Prediction') && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">Cake</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-secondary">{entry.truthScore}</p>
                          {platformFilter === 'all' && entry.percentileRank !== undefined && (
                            <p className="text-[10px] text-muted-foreground hidden sm:block">
                              Top {(100 - entry.percentileRank).toFixed(0)}%
                            </p>
                          )}
                          {platformFilter !== 'all' && (
                            <p className="text-[10px] text-muted-foreground hidden sm:block">Raw Score</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                            size="icon"
                            onClick={() => router.push(`/profile/${entry.address}`)}
                            className="h-8 w-8"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      {startIndex + 1 + (tierFilter === 'all' && !searchQuery ? 3 : 0)}-{Math.min(startIndex + ITEMS_PER_PAGE + (tierFilter === 'all' && !searchQuery ? 3 : 0), filteredData.length)} of {filteredData.length}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
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
