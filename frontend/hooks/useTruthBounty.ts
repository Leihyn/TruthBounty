'use client';

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useState } from 'react';
import {
  CONTRACTS,
  TRUTH_BOUNTY_CORE_ABI,
  REPUTATION_NFT_ABI,
  PLATFORM_REGISTRY_ABI,
  UserProfile,
  NFTMetadata,
  Platform,
  ReputationTier,
  MINT_FEE,
} from '@/lib/contracts';
import { Address } from 'viem';

export function useTruthBounty() {
  const { address, chainId } = useAccount();
  
  // Get contract addresses based on chain
  const contracts = chainId === 97 ? CONTRACTS.bscTestnet : CONTRACTS.bsc;

  // Check if user is registered
  const { data: hasRegistered, refetch: refetchRegistration } = useReadContract({
    address: contracts.TruthBountyCore,
    abi: TRUTH_BOUNTY_CORE_ABI,
    functionName: 'hasRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user profile
  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: contracts.TruthBountyCore,
    abi: TRUTH_BOUNTY_CORE_ABI,
    functionName: 'getUserProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!hasRegistered,
    },
  }) as { data: UserProfile | undefined; refetch: () => void };

  // Get NFT token URI and metadata
  const { data: tokenURI, refetch: refetchTokenURI } = useReadContract({
    address: contracts.ReputationNFT,
    abi: REPUTATION_NFT_ABI,
    functionName: 'tokenURI',
    args: userProfile ? [userProfile.reputationNFTId] : undefined,
    query: {
      enabled: !!userProfile,
    },
  });

  const { data: nftMetadata, refetch: refetchNFTMetadata } = useReadContract({
    address: contracts.ReputationNFT,
    abi: REPUTATION_NFT_ABI,
    functionName: 'getMetadata',
    args: userProfile ? [userProfile.reputationNFTId] : undefined,
    query: {
      enabled: !!userProfile,
    },
  }) as { data: NFTMetadata | undefined; refetch: () => void };

  // Get platform count
  const { data: platformCount } = useReadContract({
    address: contracts.PlatformRegistry,
    abi: PLATFORM_REGISTRY_ABI,
    functionName: 'getPlatformCount',
  });

  // Get all platforms
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformError, setPlatformError] = useState<string | null>(null);

  useEffect(() => {
    if (!platformCount || Number(platformCount) === 0) return;

    const fetchPlatforms = async () => {
      try {
        setPlatformError(null);
        const platformPromises = [];
        for (let i = 1; i <= Number(platformCount); i++) {
          platformPromises.push(
            fetch(`/api/platform/${i}`).then(res => {
              if (!res.ok) throw new Error('Platform fetch failed');
              return res.json();
            })
          );
        }
        const results = await Promise.all(platformPromises);
        setPlatforms(results.filter(Boolean));
      } catch (error) {
        console.error('Failed to fetch platforms:', error);
        setPlatformError('Failed to load platforms. Please refresh the page.');
      }
    };

    fetchPlatforms();
  }, [platformCount]);

  // Write functions
  const { writeContract: writeRegister, data: registerHash, isPending: isRegistering } = useWriteContract();
  const { writeContract: writeConnect, data: connectHash, isPending: isConnecting } = useWriteContract();
  const { writeContract: writeImport, data: importHash, isPending: isImporting } = useWriteContract();
  const { writeContract: writeUpdate, data: updateHash, isPending: isUpdating } = useWriteContract();

  // Wait for transactions
  const { isLoading: isRegisterConfirming } = useWaitForTransactionReceipt({ hash: registerHash });
  const { isLoading: isConnectConfirming } = useWaitForTransactionReceipt({ hash: connectHash });
  const { isLoading: isImportConfirming } = useWaitForTransactionReceipt({ hash: importHash });
  const { isLoading: isUpdateConfirming } = useWaitForTransactionReceipt({ hash: updateHash });

  // Actions
  const registerUser = async () => {
    return writeRegister({
      address: contracts.TruthBountyCore,
      abi: TRUTH_BOUNTY_CORE_ABI,
      functionName: 'registerUser',
      value: MINT_FEE,
    });
  };

  const connectPlatform = async (platformId: bigint) => {
    return writeConnect({
      address: contracts.TruthBountyCore,
      abi: TRUTH_BOUNTY_CORE_ABI,
      functionName: 'connectPlatform',
      args: [platformId],
    });
  };

  const importPredictions = async (
    platformId: bigint,
    totalPredictions: bigint,
    correctPredictions: bigint,
    totalVolume: bigint,
    proof: `0x${string}`
  ) => {
    return writeImport({
      address: contracts.TruthBountyCore,
      abi: TRUTH_BOUNTY_CORE_ABI,
      functionName: 'importPredictions',
      args: [platformId, totalPredictions, correctPredictions, totalVolume, proof],
    });
  };

  const updateTruthScore = async (userAddress?: `0x${string}`) => {
    return writeUpdate({
      address: contracts.TruthBountyCore,
      abi: TRUTH_BOUNTY_CORE_ABI,
      functionName: 'updateTruthScore',
      args: [userAddress || address!],
    });
  };

  // Refetch data after transactions
  useEffect(() => {
    if (registerHash && !isRegisterConfirming) {
      refetchRegistration();
      refetchProfile();
    }
  }, [registerHash, isRegisterConfirming]);

  useEffect(() => {
    if ((connectHash && !isConnectConfirming) || (importHash && !isImportConfirming)) {
      refetchProfile();
      refetchNFTMetadata();
      refetchTokenURI();
    }
  }, [connectHash, isConnectConfirming, importHash, isImportConfirming]);

  useEffect(() => {
    if (updateHash && !isUpdateConfirming) {
      refetchProfile();
      refetchNFTMetadata();
      refetchTokenURI();
    }
  }, [updateHash, isUpdateConfirming]);

  return {
    // State
    address,
    chainId,
    isRegistered: !!hasRegistered,
    userProfile,
    nftMetadata,
    tokenURI,
    platforms,
    platformError,

    // Actions
    registerUser,
    connectPlatform,
    importPredictions,
    updateTruthScore,

    // Loading states
    isRegistering: isRegistering || isRegisterConfirming,
    isConnecting: isConnecting || isConnectConfirming,
    isImporting: isImporting || isImportConfirming,
    isUpdating: isUpdating || isUpdateConfirming,

    // Refetch functions
    refetchProfile,
    refetchNFTMetadata,
    refetchTokenURI,
  };
}

// Helper hook: Fetch specific user profile (for viewing other users)
export function useUserProfile(userAddress?: Address) {
  const { chainId } = useAccount();
  const contracts = chainId === 97 ? CONTRACTS.bscTestnet : CONTRACTS.bsc;

  // Check if user is registered
  const { data: hasRegistered } = useReadContract({
    address: contracts.TruthBountyCore,
    abi: TRUTH_BOUNTY_CORE_ABI,
    functionName: 'hasRegistered',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useReadContract({
    address: contracts.TruthBountyCore,
    abi: TRUTH_BOUNTY_CORE_ABI,
    functionName: 'getUserProfile',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!hasRegistered,
    },
  }) as { data: UserProfile | undefined; isLoading: boolean };

  // Get NFT metadata
  const { data: nftMetadata, isLoading: isLoadingMetadata } = useReadContract({
    address: contracts.ReputationNFT,
    abi: REPUTATION_NFT_ABI,
    functionName: 'getMetadata',
    args: userProfile ? [userProfile.reputationNFTId] : undefined,
    query: {
      enabled: !!userProfile,
    },
  }) as { data: NFTMetadata | undefined; isLoading: boolean };

  // Get token URI
  const { data: tokenURI } = useReadContract({
    address: contracts.ReputationNFT,
    abi: REPUTATION_NFT_ABI,
    functionName: 'tokenURI',
    args: userProfile ? [userProfile.reputationNFTId] : undefined,
    query: {
      enabled: !!userProfile,
    },
  });

  return {
    isRegistered: !!hasRegistered,
    userProfile,
    nftMetadata,
    tokenURI,
    isLoading: isLoadingProfile || isLoadingMetadata,
  };
}

// Helper hook: Import predictions with enhanced state
export function useImportPredictions() {
  const { importPredictions, isImporting } = useTruthBounty();
  const [importState, setImportState] = useState<{
    status: 'idle' | 'scanning' | 'found' | 'importing' | 'success' | 'error';
    data?: {
      foundCount: number;
      correctCount: number;
      volume: string;
      calculatedScore?: number;
    };
    error?: string;
  }>({ status: 'idle' });

  const startImport = async (
    platformId: bigint,
    totalPredictions: bigint,
    correctPredictions: bigint,
    totalVolume: bigint,
    proof: `0x${string}`
  ) => {
    try {
      setImportState({ status: 'importing' });
      await importPredictions(platformId, totalPredictions, correctPredictions, totalVolume, proof);

      // Calculate expected score (simplified formula)
      const winRate = (Number(correctPredictions) / Number(totalPredictions)) * 100;
      const volumeNum = Number(totalVolume) / 10 ** 18;
      const calculatedScore = Math.floor((winRate * 100) * Math.sqrt(volumeNum) / 100);

      setImportState({
        status: 'success',
        data: {
          foundCount: Number(totalPredictions),
          correctCount: Number(correctPredictions),
          volume: volumeNum.toFixed(2),
          calculatedScore,
        },
      });
    } catch (error: any) {
      setImportState({
        status: 'error',
        error: error?.message || 'Failed to import predictions',
      });
    }
  };

  const resetImport = () => {
    setImportState({ status: 'idle' });
  };

  return {
    importState,
    startImport,
    resetImport,
    isImporting,
  };
}

// Helper hook: Update score with feedback
export function useUpdateScore() {
  const { updateTruthScore, isUpdating, refetchProfile, refetchNFTMetadata } = useTruthBounty();
  const [updateState, setUpdateState] = useState<{
    status: 'idle' | 'updating' | 'success' | 'error';
    error?: string;
  }>({ status: 'idle' });

  const startUpdate = async (userAddress?: `0x${string}`) => {
    try {
      setUpdateState({ status: 'updating' });
      await updateTruthScore(userAddress);
      await refetchProfile();
      await refetchNFTMetadata();
      setUpdateState({ status: 'success' });

      // Reset to idle after 3 seconds
      setTimeout(() => setUpdateState({ status: 'idle' }), 3000);
    } catch (error: any) {
      setUpdateState({
        status: 'error',
        error: error?.message || 'Failed to update score',
      });
    }
  };

  const resetUpdate = () => {
    setUpdateState({ status: 'idle' });
  };

  return {
    updateState,
    startUpdate,
    resetUpdate,
    isUpdating,
  };
}
