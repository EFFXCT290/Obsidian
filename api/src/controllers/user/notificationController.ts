import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notificationService.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getUserNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { unread, page = 1, limit = 20 } = (request.query as any) || {};
  const unreadOnly = unread === 'true';
  const skip = (Number(page) - 1) * Number(limit);
  const notifications = await getUserNotifications(user.id, unreadOnly);
  // Simple pagination (can be optimized later)
  return reply.send({ notifications: notifications.slice(skip, skip + Number(limit)), total: notifications.length, page: Number(page), limit: Number(limit) });
}

export async function markNotificationReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { id } = request.params as any;
  await markNotificationRead(id, user.id);
  return reply.send({ success: true });
}

export async function markAllNotificationsReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  await markAllNotificationsRead(user.id);
  return reply.send({ success: true });
}

export async function clearNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  return reply.send({ success: true });
} 