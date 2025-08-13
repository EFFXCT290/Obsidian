import { FastifyRequest, FastifyReply } from 'fastify';
import { getConfig } from '../services/configService.js';
import { requireAuth } from './authMiddleware.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';

export async function requireAuthIfNotOpen(request: FastifyRequest, reply: FastifyReply) {
  const config = await getConfig();
  if (config.registrationMode === 'OPEN') {
    // In OPEN mode, attach user if Authorization is present (optional auth)
    const auth = request.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        (request as any).user = payload;
      } catch {
        // ignore invalid token in OPEN mode
      }
    }
    return;
  }
  return requireAuth(request, reply);
} 

// Standalone helper to attach user if Authorization header exists (safe in any mode)
export async function attachUserIfPresent(request: FastifyRequest) {
  const auth = request.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return;
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (request as any).user = payload;
  } catch {
    // ignore
  }
}