import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bscTestnet, bsc } from 'wagmi/chains';
import { http } from 'wagmi';

// Custom RPC endpoints for better reliability
const transports = {
  [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  [bsc.id]: http('https://bsc-dataseed1.binance.org'),
};

export const config = getDefaultConfig({
  appName: 'TruthBounty',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [bscTestnet, bsc],
  transports,
  ssr: true,
});

// Export chain info for easy access
export { bscTestnet, bsc };
