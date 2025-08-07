import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER');
}

export async function getAdminNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });

  const { page = 1, limit = 50, unread } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);

  // Show notifications for this admin, or system/mod/report/ban/unban types
  const where: any = {
    OR: [
      { adminId: user.id },
      { type: { in: ['system', 'report', 'mod', 'ban', 'unban'] } }
    ]
  };
  if (unread === 'true') where.read = false;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.notification.count({ where })
  ]);

  return reply.send({ notifications, total, page: Number(page), limit: Number(limit) });
} 