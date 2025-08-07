import { FastifyInstance } from 'fastify';
import { rssFeedHandler } from '../controllers/user/rssController.js';

export async function registerRssRoutes(app: FastifyInstance) {
  app.get('/rss/:token', rssFeedHandler); //DONE
} 