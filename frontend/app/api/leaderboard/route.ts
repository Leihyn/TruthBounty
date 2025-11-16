import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, Address } from 'viem';
import { bscTestnet } from 'viem/chains';
import { CONTRACTS, TRUTH_BOUNTY_CORE_ABI, REPUTATION_NFT_ABI } from '@/lib/contracts';

// Cache configuration
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 0; // Disabled for development - set to 5 * 60 * 1000 for production

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

interface LeaderboardEntry {
  rank: number;
  address: Address;
  truthScore: number;
  tier: number;
  winRate: number;
  totalPredictions: number;
  correctPredictions: number;
  totalVolume: string;
  nftTokenId: number;
  lastUpdated: number;
  platforms?: string[];
  platformBreakdown?: PlatformBreakdown[];
  bets?: UserBet[];
  totalBets?: number;
  wins?: number;
  losses?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'score';
    const tierFilter = searchParams.get('tier') || 'all';
    const searchAddress = searchParams.get('search')?.toLowerCase() || '';

    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        data: filterAndSort(cachedData, sortBy, tierFilter, searchAddress),
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      });
    }

    // Create public client for BNB testnet
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    });

    const contracts = CONTRACTS.bscTestnet;

    // Fetch UserRegistered events
    const registeredEvents = await publicClient.getContractEvents({
      address: contracts.TruthBountyCore,
      abi: TRUTH_BOUNTY_CORE_ABI,
      eventName: 'UserRegistered',
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    console.log(`Found ${registeredEvents.length} registered users`);

    // Fetch user profiles in parallel (batch of 10 at a time to avoid rate limits)
    const batchSize = 10;
    const leaderboardEntries: LeaderboardEntry[] = [];

    for (let i = 0; i < registeredEvents.length; i += batchSize) {
      const batch = registeredEvents.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (event: any) => {
          const userAddress = event.args.user as Address;

          // Fetch user profile
          const profile = await publicClient.readContract({
            address: contracts.TruthBountyCore,
            abi: TRUTH_BOUNTY_CORE_ABI,
            functionName: 'getUserProfile',
            args: [userAddress],
          }) as any;

          // Fetch NFT metadata
          const metadata = await publicClient.readContract({
            address: contracts.ReputationNFT,
            abi: REPUTATION_NFT_ABI,
            functionName: 'getMetadata',
            args: [profile.nftTokenId],
          }) as any;

          const truthScore = Number(metadata.truthScore);
          const totalPredictions = Number(metadata.totalPredictions);
          const correctPredictions = Number(metadata.correctPredictions);
          const winRate = totalPredictions > 0
            ? (correctPredictions / totalPredictions) * 100
            : 0;

          return {
            rank: 0, // Will be set after sorting
            address: userAddress,
            truthScore,
            tier: Number(metadata.tier),
            winRate,
            totalPredictions,
            correctPredictions,
            totalVolume: (Number(metadata.totalVolume) / 10 ** 18).toFixed(4),
            nftTokenId: Number(profile.nftTokenId),
            lastUpdated: Number(metadata.lastUpdated),
          };
        })
      );

      // Add successful results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          leaderboardEntries.push(result.value);
        }
      });
    }

    // Sort by TruthScore descending
    leaderboardEntries.sort((a, b) => b.truthScore - a.truthScore);

    // Assign ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Update cache
    cachedData = leaderboardEntries;
    cacheTimestamp = now;

    return NextResponse.json({
      data: filterAndSort(leaderboardEntries, sortBy, tierFilter, searchAddress),
      cached: false,
      totalUsers: leaderboardEntries.length,
      timestamp: now,
    });
  } catch (error: any) {
    console.error('Leaderboard API error:', error);

    // Return mock data on error for development
    const mockData = generateMockLeaderboard();
    return NextResponse.json({
      data: mockData,
      error: 'Using mock data - contracts not deployed yet',
      message: error.message,
    });
  }
}

function filterAndSort(
  data: LeaderboardEntry[],
  sortBy: string,
  tierFilter: string,
  searchAddress: string
): LeaderboardEntry[] {
  let filtered = [...data];

  // Filter by tier
  if (tierFilter !== 'all') {
    const tierMap: { [key: string]: number } = {
      bronze: 0,
      silver: 1,
      gold: 2,
      platinum: 3,
      diamond: 4,
    };
    const tierValue = tierMap[tierFilter.toLowerCase()];
    if (tierValue !== undefined) {
      filtered = filtered.filter((entry) => entry.tier === tierValue);
    }
  }

  // Filter by address search
  if (searchAddress) {
    filtered = filtered.filter((entry) =>
      entry.address.toLowerCase().includes(searchAddress)
    );
  }

  // Sort
  switch (sortBy) {
    case 'winRate':
      filtered.sort((a, b) => b.winRate - a.winRate);
      break;
    case 'predictions':
      filtered.sort((a, b) => b.totalPredictions - a.totalPredictions);
      break;
    case 'volume':
      filtered.sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume));
      break;
    case 'score':
    default:
      filtered.sort((a, b) => b.truthScore - a.truthScore);
      break;
  }

  // Re-assign ranks after filtering/sorting
  filtered.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return filtered;
}

// Mock data for development
function generateMockLeaderboard(): LeaderboardEntry[] {
  const mockAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
    '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
    '0x17F6AD8Ef982297579C203069C1DbfFE4348c372',
    '0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678',
    '0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7',
    '0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C',
    '0x0A098Eda01Ce92ff4A4CCb7A4fFFb5A43EBC70DC',
    '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
  ];

  const tiers = [4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0]; // Diamond to Bronze

  const allPlatforms = ['PancakeSwap Prediction', 'Polymarket', 'Azuro Protocol', 'Thales'];

  return mockAddresses.map((address, index) => {
    const tier = tiers[index];
    const baseScore = 5500 - index * 300;
    const totalPredictions = 500 - index * 20;
    const correctPredictions = Math.floor(totalPredictions * (0.6 + index * 0.01));
    const winRate = (correctPredictions / totalPredictions) * 100;

    // Multi-platform data
    const platformCount = index < 3 ? 2 : index < 6 ? 3 : 1;
    const platforms = allPlatforms.slice(0, platformCount);

    const platformBreakdown: PlatformBreakdown[] = platforms.map((platform, pIdx) => {
      const platformBets = Math.floor(totalPredictions / platformCount);
      const platformWinRate = winRate + (pIdx * 2) - 1;
      const platformScore = Math.floor(baseScore / platformCount);

      return {
        platform,
        bets: platformBets,
        winRate: platformWinRate,
        score: platformScore,
        volume: (platformBets * 0.1 * Math.pow(10, 18)).toString(),
      };
    });

    // Generate some sample bets for top 3 users
    const bets: UserBet[] = index < 3 ? [
      {
        platform: platforms[0],
        marketId: `${12345 + index}`,
        amount: (0.15 * Math.pow(10, 18)).toString(),
        position: 'Bull',
        won: true,
        claimedAmount: (0.28 * Math.pow(10, 18)).toString(),
        timestamp: Math.floor(Date.now() / 1000) - 86400 * index,
      },
      {
        platform: platforms[0],
        marketId: `${12346 + index}`,
        amount: (0.2 * Math.pow(10, 18)).toString(),
        position: 'Bear',
        won: false,
        timestamp: Math.floor(Date.now() / 1000) - 86400 * (index + 1),
      },
    ] : [];

    if (platforms.length > 1 && index < 3) {
      bets.push({
        platform: platforms[1],
        marketId: `0xabcd${index}`,
        amount: (5 * Math.pow(10, 18)).toString(),
        position: 'Yes',
        won: true,
        claimedAmount: (9.5 * Math.pow(10, 18)).toString(),
        timestamp: Math.floor(Date.now() / 1000) - 86400 * (index + 2),
      });
    }

    return {
      rank: index + 1,
      address: address as Address,
      truthScore: baseScore,
      tier,
      winRate,
      totalPredictions,
      correctPredictions,
      totalVolume: (150 - index * 5).toFixed(4),
      nftTokenId: index + 1,
      lastUpdated: Date.now() / 1000 - index * 86400,
      platforms,
      platformBreakdown,
      bets,
      totalBets: totalPredictions,
      wins: correctPredictions,
      losses: totalPredictions - correctPredictions,
    };
  });
}
