'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Copy,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';

interface TraderStats {
  winRate: number;
  totalBets: number;
  totalVolume: string;
  platforms?: string[];
  truthScore: number;
}

interface CopyTradeButtonProps {
  traderAddress: string;
  traderStats: TraderStats;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function CopyTradeButton({
  traderAddress,
  traderStats,
  size = 'sm',
  variant = 'default',
}: CopyTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allocation, setAllocation] = useState('10');
  const [maxBet, setMaxBet] = useState('0.5');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    traderStats.platforms || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const handleCopyTrade = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to copy trade',
        variant: 'destructive',
      });
      return;
    }

    if (address?.toLowerCase() === traderAddress.toLowerCase()) {
      toast({
        title: 'Cannot Copy Yourself',
        description: "You can't copy your own trades",
        variant: 'destructive',
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Select Platforms',
        description: 'Please select at least one platform to copy',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/copy-trade/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerAddress: address,
          traderAddress,
          allocationPercentage: parseInt(allocation),
          maxBetAmount: maxBet,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Copy Trading Activated! 🎉',
          description: `You're now copying ${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`,
        });
        setIsOpen(false);
      } else {
        throw new Error(data.error || 'Failed to activate copy trading');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate copy trading',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedCopyAmount = (parseFloat(maxBet) * parseInt(allocation)) / 100;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size={size}
        variant={variant}
        className="gap-2"
      >
        <Copy className="w-4 h-4" />
        Copy Trade
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Copy className="w-6 h-6 text-purple-500" />
              Copy This Trader
            </DialogTitle>
            <DialogDescription>
              Automatically copy predictions from{' '}
              <code className="font-mono text-sm bg-purple-500/10 px-2 py-1 rounded">
                {traderAddress.slice(0, 10)}...{traderAddress.slice(-8)}
              </code>
            </DialogDescription>
          </DialogHeader>

          {/* Trader Stats */}
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Trader Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Win Rate
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {traderStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <Target className="w-3 h-3" />
                    Total Bets
                  </div>
                  <p className="text-xl font-bold">{traderStats.totalBets}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <DollarSign className="w-3 h-3" />
                    Volume
                  </div>
                  <p className="text-xl font-bold text-yellow-400">
                    {parseFloat(traderStats.totalVolume).toFixed(2)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Score
                  </div>
                  <p className="text-xl font-bold text-purple-400">
                    {traderStats.truthScore}
                  </p>
                </div>
              </div>

              {/* Platforms */}
              {traderStats.platforms && traderStats.platforms.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Active on:</p>
                  <div className="flex gap-2 flex-wrap">
                    {traderStats.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="text-xs bg-purple-500/10 text-purple-400"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <div className="space-y-6 mt-6">
            {/* Allocation */}
            <div className="space-y-2">
              <Label htmlFor="allocation" className="text-base font-semibold">
                Allocation Percentage
              </Label>
              <p className="text-sm text-muted-foreground">
                What percentage of your balance to allocate for copying this trader
              </p>
              <div className="flex gap-4 items-center">
                <Input
                  id="allocation"
                  type="number"
                  min="1"
                  max="100"
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value)}
                  className="text-lg"
                />
                <span className="text-2xl font-bold text-purple-400">{allocation}%</span>
              </div>
            </div>

            {/* Max Bet */}
            <div className="space-y-2">
              <Label htmlFor="maxBet" className="text-base font-semibold">
                Maximum Bet Amount
              </Label>
              <p className="text-sm text-muted-foreground">
                Maximum amount to copy per single prediction
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  id="maxBet"
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxBet}
                  onChange={(e) => setMaxBet(e.target.value)}
                  className="text-lg"
                  placeholder="0.5"
                />
                <span className="text-sm font-medium whitespace-nowrap">BNB</span>
              </div>
              <p className="text-xs text-purple-400">
                Estimated copy amount per bet: ~{estimatedCopyAmount.toFixed(4)} BNB
              </p>
            </div>

            {/* Platform Selection */}
            {traderStats.platforms && traderStats.platforms.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Select Platforms</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which platforms to copy trades from
                </p>
                <div className="space-y-2 mt-3">
                  {traderStats.platforms.map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={platform}
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform]);
                          } else {
                            setSelectedPlatforms(
                              selectedPlatforms.filter((p) => p !== platform)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={platform}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-yellow-500">Important Notice</p>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Copy trading involves risk. Past performance doesn't guarantee future results.</li>
                      <li>• Your wallet will need to approve each copied transaction.</li>
                      <li>• You can stop copy trading at any time from your dashboard.</li>
                      <li>• Platform fees may apply to each copied trade.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCopyTrade}
              disabled={isLoading || !isConnected}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Activating...
                </>
              ) : !isConnected ? (
                'Connect Wallet First'
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Start Copy Trading
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="lg"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
