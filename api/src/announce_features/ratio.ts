import { PrismaClient } from '@prisma/client';
import { getConfig } from '../services/configService.js';

const prisma = new PrismaClient();

export async function updateUserRatio(userId: string, uploaded: bigint, downloaded: bigint, peerId: string, _torrentId: string) {
  // Find last announce for this user/peer combination (not including torrentId)
  const lastAnnounce = await prisma.announce.findFirst({
    where: { userId, peerId },
    orderBy: { lastAnnounceAt: 'desc' }
  });
  
  let uploadDelta = uploaded;
  let downloadDelta = downloaded;
  
  if (lastAnnounce) {
    uploadDelta = uploaded - lastAnnounce.uploaded;
    downloadDelta = downloaded - lastAnnounce.downloaded;
    if (uploadDelta < BigInt(0)) uploadDelta = BigInt(0);
    if (downloadDelta < BigInt(0)) downloadDelta = BigInt(0);
  }
  
  console.log(`[updateUserRatio] User: ${userId}, Peer: ${peerId}, Upload Delta: ${uploadDelta}, Download Delta: ${downloadDelta}`);
  
  // Update user totals
  await prisma.user.update({
    where: { id: userId },
    data: {
      upload: { increment: uploadDelta },
      download: { increment: downloadDelta }
    }
  });
}

export async function isUserBelowMinRatio(userId: string): Promise<boolean> {
  const config = await getConfig();
  const minRatio = config.minRatio;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.download === BigInt(0)) return false;
  const ratio = Number(user.upload) / Number(user.download);
  return ratio < minRatio;
} 