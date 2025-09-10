import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';
import { 
  uploadTorrentHandler, 
  listTorrentsHandler, 
  getTorrentHandler, 
  getNfoHandler, 
  approveTorrentHandler, 
  rejectTorrentHandler, 
  listAllTorrentsHandler, 
  getTorrentStatsHandler, 
  recalculateUserStatsHandler,
  createDownloadTokenHandler,
  downloadTorrentWithTokenHandler,
  createMagnetTokenHandler,
  generateMagnetWithTokenHandler,
  voteTorrentHandler,
  editTorrentHandler,
  deleteTorrentHandler
} from '../controllers/torrentController.js';
import { requireAuthIfNotOpen } from '../middleware/authOrOpenMiddleware.js';
import {
  listCommentsForTorrentHandler,
  createCommentForTorrentHandler,
  editCommentHandler,
  deleteCommentHandler,
  voteCommentHandler
} from '../controllers/commentController.js';

const prisma = new PrismaClient();

export async function registerTorrentRoutes(app: FastifyInstance) {
  app.post('/torrent/upload', { preHandler: requireAuth }, uploadTorrentHandler); //DONE
  app.post('/torrent/:id/download-token', { preHandler: requireAuth }, createDownloadTokenHandler);
  app.get('/torrent/:id/download-secure', downloadTorrentWithTokenHandler);
  app.post('/torrent/:id/magnet-token', { preHandler: requireAuth }, createMagnetTokenHandler);
  app.get('/torrent/:id/magnet-secure', generateMagnetWithTokenHandler);
  // Debug endpoint to test magnet generation (remove in production)
  app.get('/torrent/:id/magnet-debug', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const torrent = await prisma.torrent.findUnique({ where: { id } });
    if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
    
    // Use auto-detected protocol
    const protocol = request.headers['x-forwarded-proto'] || 
                     (request.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http');
    const host = request.headers.host || 'localhost:3001';
    const baseUrl = `${protocol}://${host}`;
    
    const tracker = `${baseUrl}/announce?passkey=${user.passkey}`;
    const nameParam = encodeURIComponent(torrent.name || 'torrent');
    const magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}&dn=${nameParam}&tr=${encodeURIComponent(tracker)}`;
    
    return reply.send({ 
      magnetLink,
      infoHash: torrent.infoHash,
      name: torrent.name,
      tracker,
      userPasskey: user.passkey,
      detectedProtocol: protocol,
      baseUrl
    });
  });
  app.get('/torrent/list', { preHandler: requireAuthIfNotOpen }, listTorrentsHandler); //DONE
  app.get('/torrent/:id', { preHandler: requireAuthIfNotOpen }, getTorrentHandler); //DONE
  app.get('/torrent/:id/nfo', { preHandler: requireAuthIfNotOpen }, getNfoHandler); //DONE
  // Torrent actions
  app.post('/torrent/:id/vote', { preHandler: requireAuth }, voteTorrentHandler);
  app.post('/admin/torrent/:id/approve', { preHandler: requireAuth }, approveTorrentHandler); //DONE
  app.post('/admin/torrent/:id/reject', { preHandler: requireAuth }, rejectTorrentHandler); //DONE
  app.put('/admin/torrent/:id', { preHandler: requireAuth }, editTorrentHandler); //DONE
  app.delete('/admin/torrent/:id', { preHandler: requireAuth }, deleteTorrentHandler); //DONE
  app.get('/admin/torrents', { preHandler: requireAuth }, listAllTorrentsHandler); //DONE
  app.get('/admin/torrents/stats', { preHandler: requireAuth }, getTorrentStatsHandler); //DONE
  app.post('/admin/recalculate-user-stats', { preHandler: requireAuth }, recalculateUserStatsHandler); //DONE
  app.get('/torrent/:id/comments', listCommentsForTorrentHandler);
  app.post('/torrent/:id/comments', { preHandler: requireAuth }, createCommentForTorrentHandler);
  app.put('/comments/:commentId', { preHandler: requireAuth }, editCommentHandler);
  app.delete('/comments/:commentId', { preHandler: requireAuth }, deleteCommentHandler);
  app.post('/comments/:commentId/vote', { preHandler: requireAuth }, voteCommentHandler);
} 