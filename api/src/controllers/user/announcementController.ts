import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listAnnouncementsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { pinned, visible, page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (pinned !== undefined) where.pinned = pinned === 'true';
  if (visible !== undefined) where.visible = visible === 'true';
  else where.visible = true;
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { id: true, username: true, role: true } } }
    }),
    prisma.announcement.count({ where })
  ]);
  return reply.send({ announcements, total, page: Number(page), limit: Number(limit) });
}

export async function getAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const ann = await prisma.announcement.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, username: true, role: true } } }
  });
  if (!ann || !ann.visible) return reply.status(404).send({ error: 'Announcement not found' });
  return reply.send(ann);
} 