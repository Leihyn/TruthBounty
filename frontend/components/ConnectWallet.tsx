'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTruthBounty } from '@/hooks/useTruthBounty';
import { TIER_NAMES, TIER_COLORS } from '@/lib/contracts';
import { Wallet, AlertCircle } from 'lucide-react';
import { ProfilePopup } from './ProfilePopup';

export function ConnectWallet() {
  const { isRegistered, nftMetadata } = useTruthBounty();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-black uppercase italic tracking-widest shadow-2xl shadow-red-500/50 rounded-xl px-8 py-6 transform -skew-y-1 border-2 border-amber-400/50"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    CONNECT WALLET
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="destructive" size="lg" className="font-black uppercase italic tracking-widest transform -skew-y-1 border-2 border-amber-400/50">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    WRONG NETWORK
                  </Button>
                );
              }

              return (
                <>
                  <div className="flex gap-2 items-center">
                    {/* Chain Selector */}
                    <Button
                      onClick={openChainModal}
                      variant="outline"
                      size="sm"
                      className="hidden md:flex items-center gap-2 font-black uppercase italic tracking-wider transform -skew-y-1 border-2 border-amber-400/50"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    {/* User Tier Badge (if registered) */}
                    {isRegistered && nftMetadata && (
                      <Badge
                        className={`${TIER_COLORS[nftMetadata.tier]} text-white hidden md:inline-flex font-black uppercase italic tracking-wider transform -skew-y-1 border-2 border-amber-400/50`}
                      >
                        {TIER_NAMES[nftMetadata.tier]}
                      </Badge>
                    )}

                    {/* Account Button - Opens Profile Popup */}
                    <Button
                      onClick={() => setIsProfileOpen(true)}
                      size="sm"
                      className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-black uppercase italic tracking-wider rounded-lg transform -skew-y-1 border-2 border-amber-400/50"
                    >
                      <span className="hidden sm:inline">{account.displayName}</span>
                      <span className="sm:hidden">{account.displayName.slice(0, 6)}...</span>
                      {account.displayBalance && (
                        <span className="ml-2 opacity-75 hidden lg:inline">
                          {account.displayBalance}
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* Profile Popup Modal */}
                  <ProfilePopup
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                  />
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
