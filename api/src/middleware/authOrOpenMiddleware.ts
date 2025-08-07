import { FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '../services/configService.js';
import { requireAuth } from './authMiddleware.js';

export async function requireAuthIfNotOpen(request: FastifyRequest, reply: FastifyReply) {
  const config = await getConfig();
  if (config.registrationMode === 'OPEN') {
    return;
  }
  return requireAuth(request, reply);
} 