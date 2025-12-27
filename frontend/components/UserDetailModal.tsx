'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  TrendingUp,
  Target,
  ExternalLink,
  Copy,
  Check,
  DollarSign,
  Activity,
  Crown,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { formatEther } from 'viem';
import { TIER_NAMES, TIER_COLORS, TIER_THRESHOLDS, ReputationTier } from '@/lib/contracts';
import { CopyTradeButton } from './CopyTradeButton';

interface PlatformBreakdown {
  platform: string;
  bets: number;
  winRate: number;
  score: number;
  volume?: string;
}

interface UserBet {
  platform: string;
  marketId: string;
  amount: string;
  position: string;
  timestamp?: number;
  won?: boolean;
  claimedAmount?: string;
}

interface UserData {
  address: string;
  rank: number;
  truthScore: number;
  totalBets?: number;
  totalPredictions?: number;
  wins?: number;
  losses?: number;
  winRate: number;
  totalVolume: string;
  platforms?: string[];
  platformBreakdown?: PlatformBreakdown[];
  bets?: UserBet[];
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
}

const PLATFORM_ICONS: Record<string, string> = {
  'PancakeSwap Prediction': '🥞',
  'Polymarket': '🔮',
  'Azuro Protocol': '⚡',
  'Thales': '🎯',
};

const PLATFORM_CHAINS: Record<string, string> = {
  'PancakeSwap Prediction': 'BSC',
  'Polymarket': 'Polygon',
  'Azuro Protocol': 'Polygon',
  'Thales': 'Optimism',
};

function getTierFromScore(score: number): ReputationTier {
  if (score >= TIER_THRESHOLDS[ReputationTier.DIAMOND]) return ReputationTier.DIAMOND;
  if (score >= TIER_THRESHOLDS[ReputationTier.PLATINUM]) return ReputationTier.PLATINUM;
  if (score >= TIER_THRESHOLDS[ReputationTier.GOLD]) return ReputationTier.GOLD;
  if (score >= TIER_THRESHOLDS[ReputationTier.SILVER]) return ReputationTier.SILVER;
  return ReputationTier.BRONZE;
}

export function UserDetailModal({ isOpen, onClose, userData }: UserDetailModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  if (!userData) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userData.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatVolume = (volume: string) => {
    try {
      const volumeNum = Number(formatEther(BigInt(volume)));
      if (volumeNum > 1000) return `${(volumeNum / 1000).toFixed(1)}K`;
      return volumeNum.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const tier = getTierFromScore(userData.truthScore);
  const totalBets = userData.totalBets || userData.totalPredictions || 0;
  const wins = userData.wins || Math.round(totalBets * (userData.winRate / 100));
  const losses = userData.losses || totalBets - wins;

  const filteredBets = selectedPlatform === 'all'
    ? userData.bets || []
    : (userData.bets || []).filter(bet => bet.platform === selectedPlatform);

  const isTopRank = userData.rank <= 3;
  const rankColor = userData.rank === 1 ? 'text-secondary' : userData.rank === 2 ? 'text-muted-foreground' : userData.rank === 3 ? 'text-warning' : 'text-muted-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with gradient based on tier */}
        <div className={`relative p-4 pb-12 ${TIER_COLORS[tier]} bg-opacity-10`} style={{ background: `linear-gradient(135deg, hsl(var(--${tier === ReputationTier.DIAMOND ? 'primary' : tier === ReputationTier.GOLD ? 'secondary' : 'muted'})) 0%, transparent 100%)` }}>
          {/* Rank badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-sm ${rankColor}`}>
              {isTopRank ? <Crown className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
              <span className="font-bold">#{userData.rank}</span>
            </div>
            <Badge className={`${TIER_COLORS[tier]} text-white`}>
              {TIER_NAMES[tier]}
            </Badge>
          </div>

          {/* Avatar and address row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg font-bold">
                {userData.address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-semibold">{formatAddress(userData.address)}</code>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 rounded-md hover:bg-surface/50 transition-colors"
                >
                  {copiedAddress ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
                <a
                  href={`https://bscscan.com/address/${userData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-surface/50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
              {userData.platforms && userData.platforms.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Active on {userData.platforms.length} platform{userData.platforms.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar - overlapping header */}
        <div className="relative -mt-8 mx-4">
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-0">
              <div className="grid grid-cols-4 divide-x divide-border/50">
                <div className="p-3 text-center">
                  <p className="text-xl font-bold text-secondary">{userData.truthScore}</p>
                  <p className="text-[10px] text-muted-foreground">TruthScore</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xl font-bold text-success">{userData.winRate.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">Win Rate</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xl font-bold">{totalBets}</p>
                  <p className="text-[10px] text-muted-foreground">Bets</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xl font-bold text-secondary">{formatVolume(userData.totalVolume)}</p>
                  <p className="text-[10px] text-muted-foreground">Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content area */}
        <div className="p-4 pt-3">
          {/* Platforms horizontal scroll */}
          {userData.platforms && userData.platforms.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Platforms</p>
              <div className="flex gap-2 flex-wrap">
                {userData.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-border/50"
                  >
                    <span className="text-sm">{PLATFORM_ICONS[platform] || '📊'}</span>
                    <span className="text-xs font-medium">{platform.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-surface/50 p-1 h-auto">
              <TabsTrigger value="overview" className="flex-1 py-2 text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="bets" className="flex-1 py-2 text-sm">
                Bets ({filteredBets.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-3 space-y-3">
              {/* Win/Loss Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-surface/50 text-center">
                  <p className="text-lg font-bold">{totalBets}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10 text-center">
                  <p className="text-lg font-bold text-success">{wins}</p>
                  <p className="text-[10px] text-muted-foreground">Won</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10 text-center">
                  <p className="text-lg font-bold text-destructive">{losses}</p>
                  <p className="text-[10px] text-muted-foreground">Lost</p>
                </div>
              </div>

              {/* Platform breakdown */}
              {userData.platformBreakdown && userData.platformBreakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Platform Breakdown</p>
                  {userData.platformBreakdown.map((platform) => (
                    <div
                      key={platform.platform}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-border/30 hover:border-border/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{PLATFORM_ICONS[platform.platform] || '📊'}</span>
                        <div>
                          <p className="font-medium text-sm">{platform.platform}</p>
                          <p className="text-xs text-muted-foreground">{platform.bets} bets</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-sm font-semibold text-success">{platform.winRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">win rate</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-secondary">{platform.score}</p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!userData.platformBreakdown?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No platform breakdown available</p>
                </div>
              )}
            </TabsContent>

            {/* Bets Tab */}
            <TabsContent value="bets" className="mt-4 space-y-3">
              {/* Platform Filter */}
              {userData.platforms && userData.platforms.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedPlatform === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatform('all')}
                    className="h-8"
                  >
                    All ({userData.bets?.length || 0})
                  </Button>
                  {userData.platforms.map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedPlatform === platform ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPlatform(platform)}
                      className="h-8"
                    >
                      {PLATFORM_ICONS[platform]} {platform.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              )}

              {/* Bets List */}
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {filteredBets.length > 0 ? (
                    filteredBets.map((bet, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${bet.won === true ? 'bg-success' : bet.won === false ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{bet.position}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {bet.platform.split(' ')[0]}
                              </Badge>
                            </div>
                            {bet.timestamp && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(bet.timestamp * 1000).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-secondary">{formatVolume(bet.amount)}</p>
                          {bet.won === true && bet.claimedAmount && (
                            <p className="text-xs text-success">+{formatVolume(bet.claimedAmount)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {selectedPlatform === 'all' ? 'No bets recorded' : `No bets on ${selectedPlatform}`}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
            <CopyTradeButton
              traderAddress={userData.address}
              traderStats={{
                winRate: userData.winRate,
                totalBets: totalBets,
                totalVolume: userData.totalVolume,
                platforms: userData.platforms,
                truthScore: userData.truthScore,
              }}
              size="sm"
              variant="default"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`/profile/${userData.address}`, '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Full Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
