import { FastifyInstance } from 'fastify';

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
  // Get site statistics (mock data for now)
  app.get('/stats', async (request, reply) => {
    try {
      // Return mock statistics for now
      // TODO: Connect to database when it's properly configured
      return {
        totalUsers: 1250,
        totalTorrents: 3450,
        totalDownloads: 156789,
        totalUpload: "2.5 TB",
      };
    } catch (error) {
      app.log.error('Error fetching stats:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to fetch site statistics',
      });
    }
  });
}
