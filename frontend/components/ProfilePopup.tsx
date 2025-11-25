'use client';

import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { TIER_NAMES, TIER_COLORS } from '@/lib/contracts';
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { toast } = useToast();
  const { isRegistered, nftMetadata, userProfile } = useTruthBounty();

  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: 'Address copied!',
        description: 'Wallet address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const handleViewProfile = () => {
    if (address) {
      router.push(`/profile/${address}`);
      onClose();
    }
  };

  const handleShareProfile = () => {
    if (address) {
      const profileUrl = `${window.location.origin}/profile/${address}`;
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Profile link copied!',
        description: 'Share your reputation with others',
      });
    }
  };

  if (!address) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle className="flex items-center gap-2 font-bebas tracking-wider uppercase text-2xl">
            <User className="w-5 h-5" />
            Your Profile
          </DialogTitle>
          <DialogDescription>
            Manage your wallet and reputation NFT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {/* Wallet Info */}
          <Card className="bg-gradient-to-br from-red-500/10 to-blue-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Wallet Address</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-8"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="font-mono text-sm break-all">{address}</p>
            </CardContent>
          </Card>

          {/* NFT Display */}
          {isRegistered && nftMetadata ? (
            <Card className="border-2 border-red-500/30">
              <CardContent className="p-0">
                {/* NFT Image - Compact Version */}
                <div className="relative h-48 w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Dynamic NFT Preview */}
                    <div className="text-center space-y-2 p-4">
                      <div className={`w-16 h-16 rounded-full mx-auto bg-gradient-to-br ${TIER_COLORS[nftMetadata.tier]} flex items-center justify-center`}>
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bebas tracking-wider uppercase text-white">TruthBounty</h3>
                        <Badge className={`${TIER_COLORS[nftMetadata.tier]} text-white mt-1 text-xs`}>
                          {TIER_NAMES[nftMetadata.tier]} Tier
                        </Badge>
                      </div>
                      <div className="text-white">
                        <p className="text-xs text-slate-400">TruthScore</p>
                        <p className="text-3xl font-teko">{Number(nftMetadata.truthScore)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>

                {/* NFT Stats */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Win Rate
                      </p>
                      <p className="font-teko text-xl">{(Number(nftMetadata.winRate) / 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Predictions
                      </p>
                      <p className="font-teko text-xl">{Number(nftMetadata.totalPredictions)}</p>
                    </div>
                  </div>

                  {/* Connected Platforms */}
                  {nftMetadata.platformNames && nftMetadata.platformNames.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Connected Platforms</p>
                      <div className="flex flex-wrap gap-1">
                        {nftMetadata.platformNames.map((platform, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-red-500/30">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <h4 className="font-bebas tracking-wider uppercase text-lg mb-2">No Reputation NFT</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Claim your reputation NFT to start tracking your predictions
                </p>
                <Button
                  onClick={() => {
                    router.push('/dashboard');
                    onClose();
                  }}
                  className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700"
                >
                  Claim NFT
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleViewProfile}
              className="justify-start"
            >
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleShareProfile}
              className="justify-start"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push('/dashboard');
                onClose();
              }}
              className="justify-start"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Settings page (to be implemented)
                toast({
                  title: 'Coming soon',
                  description: 'Settings page is under development',
                });
              }}
              className="justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>

          <Separator />

          {/* Disconnect Button */}
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            size="lg"
            className="w-full font-bold"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Disconnect Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
