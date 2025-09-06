import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get popular tags with their usage counts
 * Returns tags sorted by usage count (most popular first)
 */
export async function getPopularTagsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get all approved torrents with their tags
    const torrents = await prisma.torrent.findMany({
      where: { isApproved: true },
      select: { tags: true }
    });

    // Count tag usage
    const tagCounts: Record<string, number> = {};
    
    torrents.forEach(torrent => {
      if (torrent.tags && Array.isArray(torrent.tags)) {
        torrent.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count
    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 most popular tags

    return reply.send(popularTags);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return reply.status(500).send({ error: 'Failed to fetch popular tags' });
  }
}

/**
 * Search torrents by text query
 * Returns torrents that match the search query in name or description
 */
export async function searchTorrentsByTextHandler(request: FastifyRequest, reply: FastifyReply) {
  const { q } = request.query as any;
  const { page = 1, limit = 20, sort = 'newest' } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);

  if (!q || q.trim().length === 0) {
    return reply.status(400).send({ error: 'Search query is required' });
  }

  try {
    // Build sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'size':
        orderBy = { size: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Search torrents by name or description
    const [torrents, total] = await Promise.all([
      prisma.torrent.findMany({
        where: {
          isApproved: true,
          OR: [
            {
              name: {
                contains: q,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: q,
                mode: 'insensitive'
              }
            }
          ]
        },
        skip,
        take: Number(limit),
        orderBy,
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
      }),
      prisma.torrent.count({
        where: {
          isApproved: true,
          OR: [
            {
              name: {
                contains: q,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: q,
                mode: 'insensitive'
              }
            }
          ]
        }
      })
    ]);

    // Calculate stats for each torrent
    const { getSeederLeecherCounts, getCompletedCount } = await import('../../announce_features/peerList.js');
    
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
      limit: Number(limit),
      query: q
    });
  } catch (error) {
    console.error('Error searching torrents by text:', error);
    return reply.status(500).send({ error: 'Failed to search torrents by text' });
  }
}

/**
 * Search torrents by tag
 * Returns torrents that contain the specified tag
 */
export async function searchTorrentsByTagHandler(request: FastifyRequest, reply: FastifyReply) {
  const { tag } = request.params as any;
  const { page = 1, limit = 20, sort = 'newest' } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);

  if (!tag) {
    return reply.status(400).send({ error: 'Tag parameter is required' });
  }

  try {
    // Build sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'size':
        orderBy = { size: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Find torrents that contain the tag
    const [torrents, total] = await Promise.all([
      prisma.torrent.findMany({
        where: {
          isApproved: true,
          tags: {
            has: tag
          }
        },
        skip,
        take: Number(limit),
        orderBy,
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
      }),
      prisma.torrent.count({
        where: {
          isApproved: true,
          tags: {
            has: tag
          }
        }
      })
    ]);

    // Calculate stats for each torrent
    const { getSeederLeecherCounts, getCompletedCount } = await import('../../announce_features/peerList.js');
    
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
      limit: Number(limit),
      tag
    });
  } catch (error) {
    console.error('Error searching torrents by tag:', error);
    return reply.status(500).send({ error: 'Failed to search torrents by tag' });
  }
}
