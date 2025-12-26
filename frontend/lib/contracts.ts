import { Address } from 'viem';

/**
 * Contract Addresses
 *
 * UPDATE AFTER DEPLOYMENT:
 * After running the deployment script (contracts/script/DeployAll.s.sol),
 * copy the addresses from the output or from deployments/bnb-testnet.json
 * and update the addresses below.
 *
 * Example:
 *   TruthBountyCore: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1' as Address,
 */
export const CONTRACTS = {
  bscTestnet: {
    TruthBountyCore: process.env.NEXT_PUBLIC_CORE_ADDRESS_TESTNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    ReputationNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS_TESTNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    ScoreCalculator: process.env.NEXT_PUBLIC_CALCULATOR_ADDRESS_TESTNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    PlatformRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_TESTNET as Address || '0x0000000000000000000000000000000000000000' as Address,
  },
  bsc: {
    TruthBountyCore: process.env.NEXT_PUBLIC_CORE_ADDRESS_MAINNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    ReputationNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS_MAINNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    ScoreCalculator: process.env.NEXT_PUBLIC_CALCULATOR_ADDRESS_MAINNET as Address || '0x0000000000000000000000000000000000000000' as Address,
    PlatformRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_MAINNET as Address || '0x0000000000000000000000000000000000000000' as Address,
  },
} as const;

// Contract constants
export const MINT_FEE = BigInt('500000000000000'); // 0.0005 BNB in wei

// Copy Trading Vault address (set via env or after deployment)
export const COPY_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_COPY_VAULT_ADDRESS || process.env.NEXT_PUBLIC_COPY_TRADING_VAULT || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Copy Trading Vault ABI
export const COPY_TRADING_VAULT_ABI = [
  // View functions
  {
    inputs: [],
    name: 'getVaultStats',
    outputs: [
      { name: 'totalValueLocked', type: 'uint256' },
      { name: 'totalCopyTrades', type: 'uint256' },
      { name: 'totalVolumeExecuted', type: 'uint256' },
      { name: 'totalFeesCollected', type: 'uint256' },
      { name: 'executor', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_VAULT_SIZE',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_DEPOSIT',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WITHDRAWAL_DELAY',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'balances',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getPendingWithdrawal',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserFollows',
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'leader', type: 'address' },
          { name: 'allocationBps', type: 'uint256' },
          { name: 'maxBetSize', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'leader', type: 'address' }],
    name: 'getLeaderFollowers',
    outputs: [{ type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'leader', type: 'address' }],
    name: 'getFollowerCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'follower', type: 'address' },
      { name: 'leader', type: 'address' },
    ],
    name: 'getFollowSettings',
    outputs: [
      { name: 'allocationBps', type: 'uint256' },
      { name: 'maxBetAmount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'requestWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'executeWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancelWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'leader', type: 'address' },
      { name: 'allocationBps', type: 'uint256' },
      { name: 'maxBetSize', type: 'uint256' },
    ],
    name: 'follow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'leader', type: 'address' }],
    name: 'unfollow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'leader', type: 'address' },
      { name: 'allocationBps', type: 'uint256' },
      { name: 'maxBetAmount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    name: 'updateFollowSettings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'unlockTime', type: 'uint256' },
    ],
    name: 'WithdrawalRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'WithdrawalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'follower', type: 'address' },
      { indexed: true, name: 'leader', type: 'address' },
      { indexed: false, name: 'allocationBps', type: 'uint256' },
    ],
    name: 'FollowedLeader',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'follower', type: 'address' },
      { indexed: true, name: 'leader', type: 'address' },
    ],
    name: 'UnfollowedLeader',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'follower', type: 'address' },
      { indexed: true, name: 'leader', type: 'address' },
      { indexed: false, name: 'epoch', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'isBull', type: 'bool' },
    ],
    name: 'CopyTradeExecuted',
    type: 'event',
  },
] as const;

// TruthBountyCore ABI
export const TRUTH_BOUNTY_CORE_ABI = [
  // View functions
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'hasRegistered',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserProfile',
    outputs: [
      {
        components: [
          { name: 'reputationNFTId', type: 'uint256' },
          { name: 'truthScore', type: 'uint256' },
          { name: 'totalPredictions', type: 'uint256' },
          { name: 'correctPredictions', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'connectedPlatforms', type: 'uint256[]' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'lastUpdate', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getWinRate',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'platformId', type: 'uint256' },
    ],
    name: 'isPlatformConnected',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getConnectedPlatformCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [],
    name: 'registerUser',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'platformId', type: 'uint256' }],
    name: 'connectPlatform',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'platformId', type: 'uint256' },
      { name: 'totalPredictions', type: 'uint256' },
      { name: 'correctPredictions', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
      { name: 'proof', type: 'bytes32' },
    ],
    name: 'importPredictions',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'updateTruthScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'nftTokenId', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'UserRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'platformId', type: 'uint256' },
      { indexed: false, name: 'platformName', type: 'string' },
    ],
    name: 'PlatformConnected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'oldScore', type: 'uint256' },
      { indexed: false, name: 'newScore', type: 'uint256' },
    ],
    name: 'TruthScoreUpdated',
    type: 'event',
  },
] as const;

// ReputationNFT ABI
export const REPUTATION_NFT_ABI = [
  // View functions
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'tokenOfOwner',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getMetadata',
    outputs: [
      {
        components: [
          { name: 'truthScore', type: 'uint256' },
          { name: 'tier', type: 'uint8' },
          { name: 'totalPredictions', type: 'uint256' },
          { name: 'correctPredictions', type: 'uint256' },
          { name: 'winRate', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'platformNames', type: 'string[]' },
          { name: 'lastUpdated', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getTier',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'oldScore', type: 'uint256' },
      { indexed: false, name: 'newScore', type: 'uint256' },
      { indexed: false, name: 'oldTier', type: 'uint8' },
      { indexed: false, name: 'newTier', type: 'uint8' },
    ],
    name: 'MetadataUpdated',
    type: 'event',
  },
] as const;

// PlatformRegistry ABI
export const PLATFORM_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'getPlatformCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'platformId', type: 'uint256' }],
    name: 'getPlatform',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'adapter', type: 'address' },
          { name: 'dataSource', type: 'string' },
          { name: 'platformType', type: 'uint8' },
          { name: 'isActive', type: 'bool' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'platformId', type: 'uint256' }],
    name: 'isPlatformActive',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ScoreCalculator ABI
export const SCORE_CALCULATOR_ABI = [
  {
    inputs: [
      { name: 'totalPredictions', type: 'uint256' },
      { name: 'correctPredictions', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
    ],
    name: 'calculateTruthScore',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const;

// Enums
export enum ReputationTier {
  BRONZE = 0,
  SILVER = 1,
  GOLD = 2,
  PLATINUM = 3,
  DIAMOND = 4,
}

export const TIER_NAMES = {
  [ReputationTier.BRONZE]: 'Bronze',
  [ReputationTier.SILVER]: 'Silver',
  [ReputationTier.GOLD]: 'Gold',
  [ReputationTier.PLATINUM]: 'Platinum',
  [ReputationTier.DIAMOND]: 'Diamond',
} as const;

export const TIER_COLORS = {
  [ReputationTier.BRONZE]: 'bg-orange-600',
  [ReputationTier.SILVER]: 'bg-gray-400',
  [ReputationTier.GOLD]: 'bg-yellow-500',
  [ReputationTier.PLATINUM]: 'bg-cyan-400',
  [ReputationTier.DIAMOND]: 'bg-blue-500',
} as const;

export const TIER_THRESHOLDS = {
  [ReputationTier.BRONZE]: 0,
  [ReputationTier.SILVER]: 500,
  [ReputationTier.GOLD]: 1000,
  [ReputationTier.PLATINUM]: 2000,
  [ReputationTier.DIAMOND]: 5000,
} as const;

// Types
export interface UserProfile {
  reputationNFTId: bigint;
  truthScore: bigint;
  totalPredictions: bigint;
  correctPredictions: bigint;
  totalVolume: bigint;
  connectedPlatforms: readonly bigint[];
  createdAt: bigint;
  lastUpdate: bigint;
}

export interface NFTMetadata {
  truthScore: bigint;
  tier: ReputationTier;
  totalPredictions: bigint;
  correctPredictions: bigint;
  winRate: bigint;
  totalVolume: bigint;
  platformNames: readonly string[];
  lastUpdated: bigint;
}

export interface Platform {
  id: bigint;
  name: string;
  adapter: Address;
  dataSource: string;
  platformType: number;
  isActive: boolean;
  registeredAt: bigint;
  updatedAt: bigint;
}
