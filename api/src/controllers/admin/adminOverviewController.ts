import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER');
}

export async function getOverviewStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const [users, torrents, requests, downloads, peers] = await Promise.all([
    prisma.user.count(),
    prisma.torrent.count(),
    prisma.request.count(),
    prisma.announce.count({ where: { event: 'completed' } }),
    prisma.announce.findMany({
      where: { lastAnnounceAt: { gte: thirtyMinutesAgo }, event: { not: 'stopped' } },
      select: { left: true }
    })
  ]);
  const seeding = peers.filter(p => p.left === BigInt(0)).length;
  const leeching = peers.length - seeding;
  return reply.send({
    users,
    torrents,
    requests,
    downloads,
    peers: peers.length,
    seeding,
    leeching
  });
} 