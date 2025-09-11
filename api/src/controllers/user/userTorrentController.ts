import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getSeederLeecherCounts, getCompletedCount } from '../../announce_features/peerList.js';

const prisma = new PrismaClient();

/**
 * Get all torrents uploaded by the current user
 * Returns torrents in a format similar to The Pirate Bay listing
 */
export async function getUserTorrentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const { page = 1, limit = 20 } = (request.query as any) || {};
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * take;

  try {
    // Get user's torrents with basic info
    const [torrents, total] = await Promise.all([
      prisma.torrent.findMany({
        where: { uploaderId: user.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          size: true,
          createdAt: true,
          isApproved: true,
          isRejected: true,
          isAnonymous: true,
          rejectionReason: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.torrent.count({ where: { uploaderId: user.id } })
    ]);

    // Calculate stats for each torrent (seeders, leechers, downloads)
    const torrentsWithStats = await Promise.all(
      torrents.map(async (torrent) => {
        const [seederLeecherCounts, completedCount] = await Promise.all([
          getSeederLeecherCounts(torrent.id),
          getCompletedCount(torrent.id)
        ]);

        return {
          ...torrent,
          size: torrent.size?.toString?.() ?? "0",
          seeders: seederLeecherCounts.complete,
          leechers: seederLeecherCounts.incomplete,
          downloads: completedCount,
          status: torrent.isApproved ? 'approved' : torrent.isRejected ? 'rejected' : 'pending'
        };
      })
    );

    return reply.send({
      torrents: torrentsWithStats,
      total,
      page: Number(page),
      limit: take
    });
  } catch (error) {
    console.error('[getUserTorrentsHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to fetch user torrents' });
  }
}
