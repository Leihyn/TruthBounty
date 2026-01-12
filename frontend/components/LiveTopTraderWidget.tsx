'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TraderData {
  address: string;
  username?: string;
  truthScore: number;
  winRate: number;
  totalBets: number;
}

interface LiveTopTraderWidgetProps {
  className?: string;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toLocaleString() || '0';
};

const shortenAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

export function LiveTopTraderWidget({ className }: LiveTopTraderWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed widget before
  useEffect(() => {
    const wasDismissed = localStorage.getItem('liveTraderWidgetDismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // Fetch top trader data
  useEffect(() => {
    async function fetchTopTrader() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setTrader(data.data[0]);
        }
      } catch (error) {
        // Use fallback data
        setTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1000,
          winRate: 95,
          totalBets: 86500,
        });
      }
      setLoading(false);
    }
    fetchTopTrader();
  }, []);

  // Auto-expand logic: expand once when user scrolls past hero
  const { ref: triggerRef, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !hasAutoExpanded && !dismissed) {
      // Delay the auto-expand slightly
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
        setHasAutoExpanded(true);

        // Auto-collapse after 5 seconds
        setTimeout(() => {
          setIsExpanded(false);
        }, 5000);
      }, 1000);

      return () => clearTimeout(expandTimer);
    }
  }, [inView, hasAutoExpanded, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('liveTraderWidgetDismissed', 'true');
  };

  if (loading || !trader || dismissed) {
    return (
      <>
        {/* Invisible trigger element placed after hero */}
        <div ref={triggerRef} className="absolute top-[100vh]" />
      </>
    );
  }

  return (
    <>
      {/* Invisible trigger element placed after hero */}
      <div ref={triggerRef} className="absolute top-[100vh]" />

      {/* Floating Widget - Desktop only */}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 hidden md:block transition-all duration-300 ease-out",
          className
        )}
      >
        {/* Collapsed State */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface/95 backdrop-blur-xl border border-border/50 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm">
              {trader.username?.[0] || '?'}
            </div>
            <span className="font-medium text-sm">{trader.username || shortenAddress(trader.address)}</span>
            <Badge className="bg-success/20 text-success border-success/30 text-xs font-bold">
              {trader.winRate}%
            </Badge>
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className="w-80 rounded-2xl bg-surface/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Live Top Trader
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Trader Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                  {trader.username?.[0] || '?'}
                </div>
                <div>
                  <h4 className="font-semibold">{trader.username || 'Anonymous'}</h4>
                  <p className="text-xs text-muted-foreground">
                    Just hit {trader.winRate}% win rate
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-secondary">{trader.truthScore}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold text-success">{trader.winRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Win</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-lg font-bold">{formatNumber(trader.totalBets)}</p>
                  <p className="text-[10px] text-muted-foreground">Bets</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/leaderboard"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                View All Top Traders
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Mobile version - inline card instead of floating
export function LiveTopTraderCard({ className }: LiveTopTraderWidgetProps) {
  const [trader, setTrader] = useState<TraderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopTrader() {
      try {
        const res = await fetch('/api/polymarket-leaderboard?limit=1');
        const data = await res.json();
        if (data.success && data.data?.[0]) {
          setTrader(data.data[0]);
        }
      } catch (error) {
        setTrader({
          address: '0x7a3f8e2d9c4b5a6f7e8d9c4b5a6f7e8d9c4b5a6f',
          username: 'Theo4',
          truthScore: 1000,
          winRate: 95,
          totalBets: 86500,
        });
      }
      setLoading(false);
    }
    fetchTopTrader();
  }, []);

  if (loading || !trader) {
    return null;
  }

  return (
    <div className={cn("md:hidden", className)}>
      <div className="rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          Live Top Trader
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
            {trader.username?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{trader.username || 'Anonymous'}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-secondary font-bold">{trader.truthScore} Score</span>
              <span className="text-border">|</span>
              <span className="text-success font-bold">{trader.winRate}% Win</span>
              <span className="text-border">|</span>
              <span>{formatNumber(trader.totalBets)} Bets</span>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
