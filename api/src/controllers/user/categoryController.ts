import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getSeederLeecherCounts, getCompletedCount } from '../../announce_features/peerList.js';

const prisma = new PrismaClient();

export async function listAllCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true }
  });
  return reply.send(categories);
}

export async function listTorrentsByCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const torrents = await prisma.torrent.findMany({
    where: { categoryId: id, isApproved: true },
    skip,
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });
  const total = await prisma.torrent.count({ where: { categoryId: id, isApproved: true } });
  return reply.send({ torrents, total, page: Number(page), limit: Number(limit) });
}

export async function listTorrentsByCategoryTitleHandler(request: FastifyRequest, reply: FastifyReply) {
  const { title } = request.params as any;
  const { page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);

  // Find the category by name
  const category = await prisma.category.findUnique({ where: { name: title } });
  if (!category) return reply.status(404).send({ error: 'Category not found' });

  const torrents = await prisma.torrent.findMany({
    where: { categoryId: category.id, isApproved: true },
    skip,
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: {
        select: {
          id: true,
          username: true
        }
      },
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  const total = await prisma.torrent.count({ where: { categoryId: category.id, isApproved: true } });

  // Calculate stats for each torrent
  const torrentsWithStats = await Promise.all(
    torrents.map(async (torrent) => {
      const [seederLeecherCounts, completedCount] = await Promise.all([
        getSeederLeecherCounts(torrent.id),
        getCompletedCount(torrent.id)
      ]);

      return {
        ...torrent,
        size: torrent.size?.toString?.() ?? "0",
        seeders: seederLeecherCounts.complete,
        leechers: seederLeecherCounts.incomplete,
        completed: completedCount,
        category: torrent.category?.name || 'General'
      };
    })
  );

  return reply.send({
    torrents: torrentsWithStats,
    total,
    page: Number(page),
    limit: Number(limit)
  });
} 

// Public: Get category sources (own + inherited computed) for user-facing features
export async function getCategorySourcesPublicHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  if (!id) return reply.status(400).send({ error: 'Category ID is required' });

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return reply.status(404).send({ error: 'Category not found' });

    const ownLinks = await prisma.categorySource.findMany({
      where: { categoryId: id },
      include: { source: true },
      orderBy: { order: 'asc' },
    });

    let inherited: { id: string; name: string; isActive: boolean; order: number }[] = [];
    if (category.parentId) {
      const ownIds = new Set(ownLinks.map((l) => l.sourceId));
      let currentParentId: string | null = category.parentId;
      const seen = new Set<string>();
      while (currentParentId) {
        const parent = await prisma.category.findUnique({ where: { id: currentParentId } });
        if (!parent) break;
        const parentLinks = await prisma.categorySource.findMany({
          where: { categoryId: currentParentId },
          include: { source: true },
          orderBy: { order: 'asc' },
        });
        for (const link of parentLinks) {
          if (seen.has(link.sourceId) || ownIds.has(link.sourceId)) continue;
          seen.add(link.sourceId);
          inherited.push({ id: link.source.id, name: link.source.name, isActive: link.source.isActive, order: link.order });
        }
        currentParentId = parent.parentId;
      }
    }

    const own = ownLinks.map((l) => ({ id: l.source.id, name: l.source.name, isActive: l.source.isActive, order: l.order }));
    return reply.send({ own, inherited });
  } catch (error) {
    console.error('Error fetching category sources (public):', error);
    return reply.status(500).send({ error: 'Failed to fetch category sources' });
  }
}