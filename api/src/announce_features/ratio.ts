import { PrismaClient } from '@prisma/client';
import { getConfig } from '../services/configService.js';

const prisma = new PrismaClient();

export async function updateUserRatio(userId: string, uploaded: bigint, downloaded: bigint, peerId: string, torrentId: string) {
  // Find last announce for this user/peer combination (not including torrentId)
  const lastAnnounce = await prisma.announce.findFirst({
    where: { userId, peerId },
    orderBy: { lastAnnounceAt: 'desc' }
  });
  
  // Check if torrent is freeleech and get user VIP status
  const [torrent, user] = await Promise.all([
    prisma.torrent.findUnique({
      where: { id: torrentId },
      select: { freeleech: true }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isVip: true }
    })
  ]);
  
  const isFreeleech = torrent?.freeleech || false;
  const isVip = user?.isVip || false;
  
  let uploadDelta = uploaded;
  let downloadDelta = downloaded;
  
  if (lastAnnounce) {
    uploadDelta = uploaded - lastAnnounce.uploaded;
    downloadDelta = downloaded - lastAnnounce.downloaded;
    if (uploadDelta < BigInt(0)) uploadDelta = BigInt(0);
    if (downloadDelta < BigInt(0)) downloadDelta = BigInt(0);
  }
  
  // If torrent is freeleech or user is VIP, don't count download traffic
  if (isFreeleech || isVip) {
    downloadDelta = BigInt(0);
  }
  
  console.log(`[updateUserRatio] User: ${userId}, Peer: ${peerId}, Upload Delta: ${uploadDelta}, Download Delta: ${downloadDelta}, Freeleech: ${isFreeleech}, VIP: ${isVip}`);
  
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
  
  // VIP users are never below minimum ratio
  if (user.isVip) return false;
  
  if (user.download === BigInt(0)) return false;
  const ratio = Number(user.upload) / Number(user.download);
  return ratio < minRatio;
} 