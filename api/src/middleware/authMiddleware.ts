import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header.' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach user info to request for downstream handlers
    (request as any).user = payload;
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token.' });
  }
} 