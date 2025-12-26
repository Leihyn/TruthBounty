import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bscTestnet, bsc } from 'wagmi/chains';
import { http } from 'wagmi';

// Custom RPC endpoints for better reliability
const transports = {
  [bscTestnet.id]: http('https://bsc-testnet.publicnode.com'),
  [bsc.id]: http('https://bsc.publicnode.com'),
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
