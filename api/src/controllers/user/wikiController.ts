import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listWikiPagesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { q, page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { visible: true };
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { content: { contains: q, mode: 'insensitive' } }
  ];
  const [pages, total] = await Promise.all([
    prisma.wikiPage.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, username: true } }, updatedBy: { select: { id: true, username: true } }, parent: { select: { id: true, slug: true, title: true } }, children: { select: { id: true, slug: true, title: true } } }
    }),
    prisma.wikiPage.count({ where })
  ]);
  return reply.send({ pages, total, page: Number(page), limit: Number(limit) });
}

export async function getWikiPageHandler(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as any;
  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: { createdBy: { select: { id: true, username: true } }, updatedBy: { select: { id: true, username: true } }, parent: { select: { id: true, slug: true, title: true } }, children: { select: { id: true, slug: true, title: true } } }
  });
  if (!page || !page.visible) return reply.status(404).send({ error: 'Wiki page not found' });
  return reply.send(page);
} 