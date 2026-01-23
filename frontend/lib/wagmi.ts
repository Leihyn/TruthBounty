import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';

// Custom RPC endpoints for better reliability
const transports = {
  [bscTestnet.id]: http('https://bsc-testnet.publicnode.com'),
  [bsc.id]: http('https://bsc.publicnode.com'),
};

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Configure wallet connectors with extended support
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        trustWallet,
        injectedWallet, // This will detect Backpack and other injected wallets
      ],
    },
  ],
  {
    appName: 'TruthBounty',
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [bscTestnet, bsc],
  transports,
  ssr: true,
});

// Export chain info for easy access
export { bscTestnet, bsc };
