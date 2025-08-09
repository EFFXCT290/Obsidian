import { FastifyInstance } from 'fastify';
import { getConfig } from '../services/configService.js';

export async function registerConfigRoutes(app: FastifyInstance) {
  app.get('/config/branding', async (_request, reply) => {
    try {
      const cfg = await getConfig();
      return reply.send({ brandingName: (cfg as any).brandingName || 'Obsidian Tracker' });
    } catch (err) {
      app.log.error({ err }, 'Failed to load branding config');
      return reply.send({ brandingName: 'Obsidian Tracker' });
    }
  });
}


