import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Rank {
  id: string;
  name: string;
  description: string | null;
  order: number;
  minUpload: bigint;
  minDownload: bigint;
  minRatio: number;
  color: string | null;
}

export interface RankResponse {
  id: string;
  name: string;
  description: string | null;
  order: number;
  minUpload: string;
  minDownload: string;
  minRatio: number;
  color: string | null;
}

export interface UserRank {
  rank: RankResponse | null;
  nextRank: RankResponse | null;
  progress: {
    upload: number;
    download: number;
    ratio: number;
  };
}

/**
 * Calculate the user's current rank based on their stats
 */
export async function calculateUserRank(userId: string): Promise<UserRank> {
  // Check if ranks are enabled
  const config = await prisma.config.findFirst();
  if (!config?.ranksEnabled) {
    return {
      rank: null,
      nextRank: null,
      progress: { upload: 0, download: 0, ratio: 0 }
    };
  }

  // Get user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      upload: true,
      download: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate ratio
  const ratio = user.download > 0 ? Number(user.upload) / Number(user.download) : 0;
  
  // Handle special case: if user has no download, ratio should be considered as 0 for comparison
  const effectiveRatio = user.download === BigInt(0) ? 0 : ratio;

  // Get all ranks ordered by requirement (highest first)
  const ranks = await prisma.rank.findMany({
    orderBy: { order: 'asc' }
  });

  // Sort ranks by requirements (highest to lowest) for proper checking
  // We want to check the most demanding ranks first
  ranks.sort((a, b) => {
    // Compare by upload requirements first (highest first)
    if (a.minUpload !== b.minUpload) {
      return Number(b.minUpload) - Number(a.minUpload);
    }
    // Then by download requirements
    if (a.minDownload !== b.minDownload) {
      return Number(b.minDownload) - Number(a.minDownload);
    }
    // Then by ratio requirements
    if (a.minRatio !== b.minRatio) {
      return b.minRatio - a.minRatio;
    }
    // Finally by order (lower order = higher rank)
    return a.order - b.order;
  });

  // Also sort by order for proper hierarchy (lower order = higher rank)
  // This ensures ranks are in proper ascending order for next rank calculation
  const ranksByOrder = [...ranks].sort((a, b) => a.order - b.order);

  if (ranks.length === 0) {
    return {
      rank: null,
      nextRank: null,
      progress: { upload: 0, download: 0, ratio: 0 }
    };
  }

  // Find the highest rank the user qualifies for
  let currentRank: Rank | null = null;
  let nextRank: Rank | null = null;

  console.log('[calculateUserRank] User stats:', {
    upload: user.upload.toString(),
    download: user.download.toString(),
    ratio: ratio,
    effectiveRatio: effectiveRatio
  });

  console.log('[calculateUserRank] Ranks by order:', ranksByOrder.map(r => ({ name: r.name, order: r.order })));

  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i];
    const qualifies = user.upload >= rank.minUpload && 
                     user.download >= rank.minDownload && 
                     effectiveRatio >= rank.minRatio;
    
    console.log('[calculateUserRank] Checking rank:', rank.name, {
      minUpload: rank.minUpload.toString(),
      minDownload: rank.minDownload.toString(),
      minRatio: rank.minRatio,
      qualifies: qualifies,
      uploadCheck: user.upload >= rank.minUpload,
      downloadCheck: user.download >= rank.minDownload,
      ratioCheck: effectiveRatio >= rank.minRatio
    });
    
    if (qualifies) {
      currentRank = rank;
      // Find the next rank in the proper hierarchy
      const currentRankIndex = ranksByOrder.findIndex(r => r.id === rank.id);
      if (currentRankIndex > 0) {
        nextRank = ranksByOrder[currentRankIndex - 1]; // Get the rank with lower order (higher rank)
      }
      
      console.log('[calculateUserRank] Found current rank:', currentRank.name, 'order:', currentRank.order);
      console.log('[calculateUserRank] Next rank:', nextRank?.name, 'order:', nextRank?.order);
      break;
    }
  }

  // Calculate progress towards next rank
  let progress = { upload: 0, download: 0, ratio: 0 };
  
  if (nextRank) {
    const uploadDiff = Number(nextRank.minUpload) - Number(currentRank?.minUpload || 0);
    const downloadDiff = Number(nextRank.minDownload) - Number(currentRank?.minDownload || 0);
    const ratioDiff = nextRank.minRatio - (currentRank?.minRatio || 0);

    // Calculate upload progress: how much of the next rank's total requirement you've achieved
    if (Number(nextRank.minUpload) > 0) {
      // Show progress as percentage of next rank's total requirement
      progress.upload = Math.min(100, Math.max(0, (Number(user.upload) / Number(nextRank.minUpload)) * 100));
    } else {
      // If next rank has no upload requirement, show 100%
      progress.upload = 100;
    }

    // Calculate download progress: how much of the next rank's total requirement you've achieved
    if (Number(nextRank.minDownload) > 0) {
      // Show progress as percentage of next rank's total requirement
      progress.download = Math.min(100, Math.max(0, (Number(user.download) / Number(nextRank.minDownload)) * 100));
    } else {
      // If next rank has no download requirement, show 100%
      progress.download = 100;
    }

    // Calculate ratio progress: how much of the next rank's total requirement you've achieved
    if (nextRank.minRatio > 0) {
      // Show progress as percentage of next rank's total requirement
      progress.ratio = Math.min(100, Math.max(0, (effectiveRatio / nextRank.minRatio) * 100));
    } else {
      // If next rank has no ratio requirement, show 100%
      progress.ratio = 100;
    }
  }

  console.log('[calculateUserRank] Progress calculation:', {
    currentRank: currentRank?.name,
    nextRank: nextRank?.name,
    uploadDiff: nextRank ? Number(nextRank.minUpload) - Number(currentRank?.minUpload || 0) : 0,
    downloadDiff: nextRank ? Number(nextRank.minDownload) - Number(currentRank?.minDownload || 0) : 0,
    ratioDiff: nextRank ? nextRank.minRatio - (currentRank?.minRatio || 0) : 0,
    progress
  });

  // Convert Rank objects to RankResponse objects for JSON serialization
  const convertRankToResponse = (rank: Rank | null): RankResponse | null => {
    if (!rank) return null;
    return {
      ...rank,
      minUpload: rank.minUpload.toString(),
      minDownload: rank.minDownload.toString()
    };
  };

  return {
    rank: convertRankToResponse(currentRank),
    nextRank: convertRankToResponse(nextRank),
    progress
  };
}

/**
 * Get all ranks for admin management
 */
export async function getAllRanks(): Promise<RankResponse[]> {
  const ranks = await prisma.rank.findMany({
    orderBy: { order: 'asc' }
  });
  
  // Convert BigInt to string for JSON serialization
  return ranks.map(rank => ({
    ...rank,
    minUpload: rank.minUpload.toString(),
    minDownload: rank.minDownload.toString()
  }));
}

/**
 * Create a new rank
 */
export async function createRank(rankData: Omit<Rank, 'id' | 'createdAt' | 'updatedAt'>): Promise<RankResponse> {
  const rank = await prisma.rank.create({
    data: rankData
  });
  
  return {
    ...rank,
    minUpload: rank.minUpload.toString(),
    minDownload: rank.minDownload.toString()
  };
}

/**
 * Update an existing rank
 */
export async function updateRank(id: string, rankData: Partial<Omit<Rank, 'id' | 'createdAt' | 'updatedAt'>>): Promise<RankResponse> {
  const rank = await prisma.rank.update({
    where: { id },
    data: rankData
  });
  
  return {
    ...rank,
    minUpload: rank.minUpload.toString(),
    minDownload: rank.minDownload.toString()
  };
}

/**
 * Delete a rank
 */
export async function deleteRank(id: string): Promise<void> {
  await prisma.rank.delete({
    where: { id }
  });
}

/**
 * Get rank by ID
 */
export async function getRankById(id: string): Promise<RankResponse | null> {
  const rank = await prisma.rank.findUnique({
    where: { id }
  });
  
  if (!rank) return null;
  
  return {
    ...rank,
    minUpload: rank.minUpload.toString(),
    minDownload: rank.minDownload.toString()
  };
}

/**
 * Check if ranks are enabled
 */
export async function areRanksEnabled(): Promise<boolean> {
  const config = await prisma.config.findFirst();
  return config?.ranksEnabled ?? false;
}

/**
 * Enable or disable the rank system
 */
export async function setRanksEnabled(enabled: boolean): Promise<void> {
  await prisma.config.updateMany({
    data: { ranksEnabled: enabled }
  });
} 