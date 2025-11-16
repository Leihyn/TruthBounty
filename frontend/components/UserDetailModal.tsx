'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  TrendingUp,
  Target,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { formatEther } from 'viem';

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
  totalBets: number;
  wins: number;
  losses: number;
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

const PLATFORM_COLORS: Record<string, string> = {
  'PancakeSwap Prediction': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Polymarket': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Azuro Protocol': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Thales': 'bg-green-500/10 text-green-400 border-green-500/30',
};

const PLATFORM_CHAINS: Record<string, string> = {
  'PancakeSwap Prediction': 'BSC',
  'Polymarket': 'Polygon',
  'Azuro Protocol': 'Polygon',
  'Thales': 'Optimism',
};

export function UserDetailModal({ isOpen, onClose, userData }: UserDetailModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  if (!userData) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userData.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatVolume = (volume: string) => {
    try {
      const volumeNum = Number(formatEther(BigInt(volume)));
      if (volumeNum > 1000) {
        return `${(volumeNum / 1000).toFixed(2)}K`;
      }
      return volumeNum.toFixed(4);
    } catch {
      return '0.00';
    }
  };

  const filteredBets = selectedPlatform === 'all'
    ? userData.bets || []
    : (userData.bets || []).filter(bet => bet.platform === selectedPlatform);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span>Rank #{userData.rank}</span>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Score: {userData.truthScore.toLocaleString()}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono">{formatAddress(userData.address)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-6 w-6 p-0"
            >
              {copiedAddress ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-6 w-6 p-0"
            >
              <a
                href={`https://bscscan.com/address/${userData.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </DialogDescription>
        </DialogHeader>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <Card className="border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {userData.winRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Total Bets</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {userData.totalBets}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Total Volume</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {formatVolume(userData.totalVolume)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">Platforms</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {userData.platforms?.length || 1}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Badges */}
        {userData.platforms && userData.platforms.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Active on platforms:</p>
            <div className="flex flex-wrap gap-2">
              {userData.platforms.map((platform) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className={PLATFORM_COLORS[platform] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}
                >
                  {platform}
                  <span className="ml-1 text-xs opacity-70">
                    ({PLATFORM_CHAINS[platform]})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Platform Breakdown</TabsTrigger>
            <TabsTrigger value="bets">
              All Bets ({filteredBets.length})
            </TabsTrigger>
          </TabsList>

          {/* Platform Breakdown Tab */}
          <TabsContent value="overview" className="space-y-4">
            {userData.platformBreakdown && userData.platformBreakdown.length > 0 ? (
              userData.platformBreakdown.map((platform) => (
                <Card key={platform.platform} className="border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {platform.platform}
                          <Badge variant="outline" className="text-xs">
                            {PLATFORM_CHAINS[platform.platform]}
                          </Badge>
                        </h3>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                        Score: {platform.score}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Bets</p>
                        <p className="text-xl font-bold">{platform.bets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Win Rate</p>
                        <p className="text-xl font-bold text-green-400">
                          {platform.winRate.toFixed(1)}%
                        </p>
                      </div>
                      {platform.volume && (
                        <div>
                          <p className="text-xs text-gray-400">Volume</p>
                          <p className="text-xl font-bold text-yellow-400">
                            {formatVolume(platform.volume)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-purple-500/20">
                <CardContent className="p-6 text-center text-gray-400">
                  No platform breakdown available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Bets Tab */}
          <TabsContent value="bets" className="space-y-4">
            {/* Platform Filter */}
            {userData.platforms && userData.platforms.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedPlatform === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform('all')}
                >
                  All ({userData.bets?.length || 0})
                </Button>
                {userData.platforms.map((platform) => (
                  <Button
                    key={platform}
                    variant={selectedPlatform === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    {platform.split(' ')[0]}
                    ({(userData.bets || []).filter(b => b.platform === platform).length})
                  </Button>
                ))}
              </div>
            )}

            {/* Bets List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBets.length > 0 ? (
                filteredBets.map((bet, index) => (
                  <Card key={index} className="border-purple-500/20 hover:border-purple-500/50 transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* Platform and Status Badges */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={PLATFORM_COLORS[bet.platform] || ''}
                            >
                              {bet.platform}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                bet.won === true
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                  : bet.won === false
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                              }
                            >
                              {bet.won === true ? 'Won' : bet.won === false ? 'Lost' : 'Pending'}
                            </Badge>
                            {bet.timestamp && (
                              <span className="text-xs text-gray-500">
                                {new Date(bet.timestamp * 1000).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Prediction Details */}
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-400">Position:</span>{' '}
                              <span className="font-medium text-white">{bet.position}</span>
                            </div>
                            {bet.marketId && (
                              <div className="text-xs text-gray-500">
                                Market ID: <span className="font-mono">{bet.marketId.slice(0, 12)}...</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Volume Details */}
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-yellow-400">
                            {formatVolume(bet.amount)}
                          </p>
                          {bet.claimedAmount && (
                            <p className="text-xs text-green-400 font-semibold">
                              Claimed: +{formatVolume(bet.claimedAmount)}
                            </p>
                          )}
                          {bet.won === true && bet.claimedAmount && (
                            <p className="text-xs text-green-500 mt-1">
                              +{(((Number(formatEther(BigInt(bet.claimedAmount))) / Number(formatEther(BigInt(bet.amount)))) - 1) * 100).toFixed(1)}% profit
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-purple-500/20">
                  <CardContent className="p-6 text-center text-gray-400">
                    {selectedPlatform === 'all'
                      ? 'No bets recorded yet'
                      : `No bets on ${selectedPlatform}`}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
