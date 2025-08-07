import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { XMLBuilder } from 'fast-xml-parser';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function rssFeedHandler(request: FastifyRequest, reply: FastifyReply) {
  const { token } = request.params as { token: string };
  const { q, category, count, bookmarks } = request.query as { q?: string; category?: string; count?: string; bookmarks?: string };

  // Authenticate user by RSS token
  const user = await prisma.user.findUnique({ where: { rssToken: token, rssEnabled: true } });
  if (!user || user.status !== 'ACTIVE') return reply.status(401).send('Invalid or disabled RSS token');

  // Get config for default count
  const config = await prisma.config.findFirst({});
  const maxCount = config?.rssDefaultCount || 20;
  const take = Math.min(Number(count) || maxCount, maxCount);

  let torrents;
  if (bookmarks === 'true') {
    // Fetch only torrents bookmarked by the user
    const bookmarked = await prisma.bookmark.findMany({
      where: { userId: user.id },
      select: { torrentId: true }
    });
    const torrentIds = bookmarked.map((b: { torrentId: string }) => b.torrentId);
    const where: any = { isApproved: true, id: { in: torrentIds } };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.categoryId = category;
    }
    torrents = await prisma.torrent.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, infoHash: true, createdAt: true }
    });
  } else {
    // Normal filter (not bookmarks)
    const where: any = { isApproved: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.categoryId = category;
    }
    torrents = await prisma.torrent.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, infoHash: true, createdAt: true }
    });
  }

  // Build RSS feed with direct torrent download links
  type Torrent = { id: string; name: string; description?: string | null; infoHash: string; createdAt: Date };
  const items = (torrents as Torrent[]).map((torrent: Torrent) => ({
    title: torrent.name,
    link: `${process.env.API_BASE_URL || 'http://localhost:3001'}/torrent/${torrent.id}/download?token=${token}`,
    description: torrent.description || '',
    pubDate: torrent.createdAt.toUTCString(),
    infoHash: torrent.infoHash,
    enclosure: {
      '@_url': `${process.env.API_BASE_URL || 'http://localhost:3001'}/torrent/${torrent.id}/download?token=${token}`,
      '@_type': 'application/x-bittorrent',
      '@_length': '0'
    }
  }));

  const feed = {
    rss: {
      '@_version': '2.0',
      channel: {
        title: 'Latest Torrents',
        link: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Latest torrents from the tracker',
        pubDate: new Date().toUTCString(),
        item: items
      }
    }
  };

  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  const xml = builder.build(feed);
  reply.header('Content-Type', 'application/rss+xml; charset=utf-8');
  return reply.send(xml);
}

export async function getRssTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  let updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!updatedUser?.rssToken) {
    const rssToken = crypto.randomUUID().replace(/-/g, '');
    updatedUser = await prisma.user.update({ where: { id: user.id }, data: { rssToken } });
  }
  return reply.send({ rssToken: updatedUser.rssToken, rssEnabled: updatedUser.rssEnabled });
}

export async function regenerateRssTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const rssToken = crypto.randomUUID().replace(/-/g, '');
  await prisma.user.update({ where: { id: user.id }, data: { rssToken } });
  return reply.send({ rssToken });
} 