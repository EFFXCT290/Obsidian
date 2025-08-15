import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

/**
 * Register statistics routes
 * 
 * Provides endpoints for getting site statistics including:
 * - Total users count
 * - Total torrents count
 * - Total downloads
 * - Total upload volume
 * 
 * @param app - Fastify instance to register routes on
 */
export async function registerStatsRoutes(app: FastifyInstance) {
  // Get site statistics from database
  app.get('/stats', async (request, reply) => {
    try {
      const [usersCount, torrentsCount, completedDownloads, announcesAgg] = await Promise.all([
        prisma.user.count(),
        prisma.torrent.count(),
        prisma.announce.count({ where: { event: 'completed' } }),
        prisma.announce.aggregate({
          _sum: { uploaded: true },
        }),
      ]);

      const totalUploaded = Number(announcesAgg._sum.uploaded || 0);

      // Format bytes to human readable string; return "0 megabytes" if zero
      const formatBytes = (bytes: number): string => {
        if (!bytes || bytes <= 0) return '0 mb';
        const k = 1024;
        const units = ['b', 'kb', 'mb', 'gb', 'tb', 'pb'];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
        const value = bytes / Math.pow(k, i);
        return `${parseFloat(value.toFixed(1))} ${units[i]}`;
      };

      return {
        totalUsers: usersCount,
        totalTorrents: torrentsCount,
        totalDownloads: completedDownloads,
        totalUploadBytes: totalUploaded,
        totalUploadFormatted: formatBytes(totalUploaded),
      };
    } catch (error) {
      app.log.error('Error fetching stats:', error);
      return reply.status(500).send({
        error: true,
        message: 'Failed to fetch site statistics',
      });
    }
  });
}
