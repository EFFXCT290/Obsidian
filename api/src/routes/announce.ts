import { FastifyInstance } from 'fastify';
import { announceHandler } from '../controllers/announceController.js';
import { scrapeHandler } from '../controllers/announceController.js';

export async function registerAnnounceRoutes(app: FastifyInstance) {
  app.get('/announce', announceHandler);
  app.post('/announce', announceHandler);
  app.get('/scrape', scrapeHandler);
  app.post('/scrape', scrapeHandler);
} 