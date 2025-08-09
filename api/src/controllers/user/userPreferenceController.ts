import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPreferencesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { preferredLanguage: true, allowEmailNotifications: true } });
  return reply.send(dbUser || { preferredLanguage: 'es', allowEmailNotifications: true });
}

export async function updatePreferencesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { preferredLanguage, allowEmailNotifications } = request.body as any;
  const updated = await prisma.user.update({ where: { id: user.id }, data: { preferredLanguage, allowEmailNotifications } });
  return reply.send({ preferredLanguage: updated.preferredLanguage, allowEmailNotifications: updated.allowEmailNotifications });
}


