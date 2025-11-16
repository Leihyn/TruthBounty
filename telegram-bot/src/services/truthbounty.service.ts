// @ts-nocheck
import { ethers } from 'ethers';
import { config } from '../config';
import { TruthScoreData } from '../types';

const TRUTH_BOUNTY_CORE_ABI = [
  'function hasRegistered(address user) view returns (bool)',
  'function getUserProfile(address user) view returns (tuple(uint256 nftTokenId, uint256 truthScore, uint256 totalPredictions, uint256 correctPredictions, uint256 totalVolume, uint256[] connectedPlatforms, uint256 lastUpdate, bool isActive))',
  'function getWinRate(address user) view returns (uint256)',
];

const REPUTATION_NFT_ABI = [
  'function getMetadata(uint256 tokenId) view returns (tuple(uint256 truthScore, uint8 tier, uint256 totalPredictions, uint256 correctPredictions, uint256 winRate, uint256 totalVolume, string[] platformNames, uint256 lastUpdated))',
  'function getTier(uint256 tokenId) view returns (uint8)',
  'function tokenOfOwner(address owner) view returns (uint256)',
];

const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const TIER_EMOJIS = ['🥉', '🥈', '🥇', '💎', '👑'];

export class TruthBountyService {
  private provider: ethers.JsonRpcProvider;
  private coreContract: ethers.Contract;
  private nftContract: ethers.Contract;

  constructor() {
    const rpcUrl = config.blockchain.network === 'mainnet'
      ? config.blockchain.bscRpcUrl
      : config.blockchain.bscTestnetRpcUrl;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    this.coreContract = new ethers.Contract(
      config.contracts.truthBountyCore,
      TRUTH_BOUNTY_CORE_ABI,
      this.provider
    );

    this.nftContract = new ethers.Contract(
      config.contracts.reputationNFT,
      REPUTATION_NFT_ABI,
      this.provider
    );
  }

  async isRegistered(address: string): Promise<boolean> {
    try {
      return await this.coreContract.hasRegistered(address);
    } catch (error) {
      console.error(`Error checking registration for ${address}:`, error);
      return false;
    }
  }

  async getUserProfile(address: string): Promise<any> {
    try {
      const profile = await this.coreContract.getUserProfile(address);
      return {
        nftTokenId: Number(profile.nftTokenId),
        truthScore: Number(profile.truthScore),
        totalPredictions: Number(profile.totalPredictions),
        correctPredictions: Number(profile.correctPredictions),
        totalVolume: profile.totalVolume,
        connectedPlatforms: profile.connectedPlatforms.map((p: bigint) => Number(p)),
        lastUpdate: Number(profile.lastUpdate),
        isActive: profile.isActive,
      };
    } catch (error) {
      console.error(`Error fetching profile for ${address}:`, error);
      return null;
    }
  }

  async getTruthScore(address: string): Promise<TruthScoreData | null> {
    try {
      const isReg = await this.isRegistered(address);
      if (!isReg) return null;

      const profile = await this.getUserProfile(address);
      if (!profile) return null;

      const tokenId = await this.nftContract.tokenOfOwner(address);
      const metadata = await this.nftContract.getMetadata(tokenId);

      const winRate = profile.totalPredictions > 0
        ? (profile.correctPredictions / profile.totalPredictions) * 100
        : 0;

      return {
        address,
        score: Number(metadata.truthScore),
        tier: Number(metadata.tier),
        totalPredictions: Number(metadata.totalPredictions),
        correctPredictions: Number(metadata.correctPredictions),
        winRate,
        totalVolume: ethers.formatEther(metadata.totalVolume),
        platforms: metadata.platformNames,
      };
    } catch (error) {
      console.error(`Error fetching TruthScore for ${address}:`, error);
      return null;
    }
  }

  formatTruthScoreMessage(data: TruthScoreData): string {
    const tierEmoji = TIER_EMOJIS[data.tier] || '🎖️';
    const tierName = TIER_NAMES[data.tier] || 'Unknown';

    let message = `${tierEmoji} **TruthScore Profile**\n\n`;
    message += `📊 TruthScore: **${data.score}**\n`;
    message += `🏅 Tier: **${tierName}**\n\n`;
    message += `📈 Statistics:\n`;
    message += `• Total Predictions: ${data.totalPredictions}\n`;
    message += `• Correct: ${data.correctPredictions}\n`;
    message += `• Win Rate: ${data.winRate.toFixed(1)}%\n`;
    message += `• Total Volume: ${parseFloat(data.totalVolume).toFixed(4)} BNB\n\n`;

    if (data.platforms.length > 0) {
      message += `🔗 Connected Platforms:\n`;
      data.platforms.forEach(platform => {
        message += `• ${platform}\n`;
      });
    }

    message += `\n👤 Address: \`${data.address.slice(0, 6)}...${data.address.slice(-4)}\``;

    return message;
  }

  async getLeaderboard(limit: number = 10): Promise<TruthScoreData[]> {
    // This would require either:
    // 1. Indexing service to track all users
    // 2. Subgraph query
    // 3. Database of registered users
    // For now, return empty array - implement with indexer
    return [];
  }

  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}

export const truthBountyService = new TruthBountyService();
