import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  console.log('[requireAuth] Checking authentication for:', request.url);
  console.log('[requireAuth] Headers:', request.headers);
  
  const auth = request.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[requireAuth] Missing or invalid Authorization header');
    return reply.status(401).send({ error: 'Missing or invalid Authorization header.' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('[requireAuth] Token verified successfully, user:', payload);
    // Attach user info to request for downstream handlers
    (request as any).user = payload;
  } catch (err) {
    console.log('[requireAuth] Token verification failed:', err);
    return reply.status(401).send({ error: 'Invalid or expired token.' });
  }
} 