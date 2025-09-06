import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listBookmarksHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: user.id },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { torrent: { select: { id: true, name: true, description: true, size: true, createdAt: true, posterUrl: true } } }
    }),
    prisma.bookmark.count({ where: { userId: user.id } })
  ]);
  // Flatten and serialize BigInt
  const torrents = bookmarks.map(b => ({
    ...b.torrent,
    size: b.torrent.size?.toString?.() ?? "0",
    createdAt: b.torrent.createdAt,
    note: b.note || "", // <-- include the note!
  }));
  return reply.send({ bookmarks: torrents, total, page: Number(page), limit: Number(limit) });
}

export async function addBookmarkHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const contentType = (request.headers['content-type'] || '').toString();
  let torrentId: string | undefined;
  let note: string | undefined;
  if (contentType.includes('application/json')) {
    const body = request.body as any;
    torrentId = body?.torrentId;
    note = body?.note;
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const body = request.body as any;
    torrentId = body?.torrentId;
    note = body?.note;
  } else {
    const body = request.body as any;
    torrentId = body?.torrentId;
    note = body?.note;
  }
  if (!torrentId) return reply.status(400).send({ error: 'torrentId is required' });
  // Check if torrent exists
  const torrent = await prisma.torrent.findUnique({ where: { id: torrentId } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  // If not approved, allow only uploader and staff to bookmark
  if (!torrent.isApproved) {
    const isStaff = user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FOUNDER';
    const isUploader = torrent.uploaderId === user.id;
    if (!isStaff && !isUploader) return reply.status(403).send({ error: 'Forbidden' });
  }
  // Upsert bookmark
  const bookmark = await prisma.bookmark.upsert({
    where: { userId_torrentId: { userId: user.id, torrentId } },
    update: { note },
    create: { userId: user.id, torrentId, note }
  });
  return reply.status(201).send(bookmark);
}

export async function removeBookmarkHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { torrentId } = request.params as any;
  await prisma.bookmark.deleteMany({ where: { userId: user.id, torrentId } });
  return reply.send({ success: true });
}

export async function updateBookmarkNoteHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { torrentId } = request.params as any;
  const { note } = request.body as any;
  const bookmark = await prisma.bookmark.updateMany({ where: { userId: user.id, torrentId }, data: { note } });
  return reply.send({ success: true });
} 