import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Build threaded comments up to 4 levels, but at the limit, do not fetch further replies
async function buildThreadedComments(comments: any[], opUserId: string, level = 0): Promise<any[]> {
  if (level > 4) return [];
  return await Promise.all(
    comments.map(async (comment: any) => {
      let replies: any[] = [];
      let hasMoreReplies = false;
      if (level < 4) {
        replies = await prisma.comment.findMany({
          where: { parentId: comment.id, deleted: false },
          orderBy: { createdAt: 'asc' },
          include: { user: true, votes: true },
        });
      } else if (level === 4) {
        const count = await prisma.comment.count({ where: { parentId: comment.id, deleted: false } });
        hasMoreReplies = count > 0;
      }
      return {
        id: comment.id,
        content: comment.deleted ? '[deleted]' : comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        deleted: comment.deleted,
        user: comment.user ? {
          id: comment.user.id,
          username: comment.user.username,
          avatarUrl: comment.user.avatarUrl,
          role: comment.user.role,
        } : null,
        isOP: comment.userId === opUserId,
        upvotes: comment.votes.filter((v: any) => v.value === 1).length,
        downvotes: comment.votes.filter((v: any) => v.value === -1).length,
        score: comment.votes.reduce((acc: number, v: any) => acc + v.value, 0),
        parentId: comment.parentId,
        replies: level < 4 ? await buildThreadedComments(replies, opUserId, level + 1) : [],
        hasMoreReplies,
      };
    })
  );
}

// Helper to convert BigInt fields to strings recursively
export function convertBigInts(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (typeof v === 'bigint') return [k, v.toString()];
        if (v instanceof Date) return [k, v.toISOString()];
        return [k, convertBigInts(v)];
      })
    );
  }
  return obj;
}

// GET /torrent/:id/comments
export async function listCommentsForTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  // OP is uploader
  const opUserId = torrent.uploaderId;
  const rootComments = await prisma.comment.findMany({
    where: { torrentId: id, parentId: null, deleted: false },
    orderBy: { createdAt: 'asc' },
    include: { user: true, votes: true },
  });
  const threaded = await buildThreadedComments(rootComments, opUserId);
  return reply.send(convertBigInts(threaded));
}

// POST /torrent/:id/comments
export async function createCommentForTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { id } = request.params as any;
  const { content, parentId } = request.body as any;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return reply.status(400).send({ error: 'Content required' });
  }
  // Check parent (if replying)
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.torrentId !== id) {
      return reply.status(400).send({ error: 'Invalid parent comment' });
    }
  }
  const comment = await prisma.comment.create({
    data: {
      content,
      userId: user.id,
      torrentId: id,
      parentId: parentId || null,
    },
    include: { user: true, votes: true },
  });
  return reply.status(201).send(convertBigInts(comment));
}

// PUT /comments/:commentId
export async function editCommentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { commentId } = request.params as any;
  const { content } = request.body as any;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return reply.status(404).send({ error: 'Comment not found' });
  if (comment.userId !== user.id) return reply.status(403).send({ error: 'Forbidden' });
  if (!content || typeof content !== 'string' || !content.trim()) {
    return reply.status(400).send({ error: 'Content required' });
  }
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { user: true, votes: true },
  });
  return reply.send(convertBigInts(updated));
}

// DELETE /comments/:commentId (soft delete)
export async function deleteCommentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { commentId } = request.params as any;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return reply.status(404).send({ error: 'Comment not found' });
  if (comment.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'OWNER') {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  await prisma.comment.update({ where: { id: commentId }, data: { deleted: true } });
  return reply.send({ success: true });
}

// POST /comments/:commentId/vote
export async function voteCommentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { commentId } = request.params as any;
  const { value } = request.body as any;
  if (![1, -1].includes(value)) return reply.status(400).send({ error: 'Invalid vote value' });
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return reply.status(404).send({ error: 'Comment not found' });
  // Upsert vote
  await prisma.commentVote.upsert({
    where: { userId_commentId: { userId: user.id, commentId } },
    update: { value },
    create: { userId: user.id, commentId, value },
  });
  return reply.send({ success: true });
}

// GET /comments/:commentId/thread - fetch full sub-thread for a comment (unlimited depth)
export async function getCommentThreadHandler(request: FastifyRequest, reply: FastifyReply) {
  const { commentId } = request.params as any;
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { user: true, votes: true },
  });
  if (!comment) return reply.status(404).send({ error: 'Comment not found' });
  // Find OP (walk up to root)
  let opUserId = comment.userId;
  let parent = comment;
  while (parent.parentId) {
    parent = await prisma.comment.findUnique({ where: { id: parent.parentId } }) as any;
    if (parent) opUserId = parent.userId;
  }
  // Recursively fetch all descendants
  async function buildFullThread(c: any): Promise<any> {
    const replies = await prisma.comment.findMany({
      where: { parentId: c.id, deleted: false },
      orderBy: { createdAt: 'asc' },
      include: { user: true, votes: true },
    });
    return {
      id: c.id,
      content: c.deleted ? '[deleted]' : c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      deleted: c.deleted,
      user: c.user ? {
        id: c.user.id,
        username: c.user.username,
        avatarUrl: c.user.avatarUrl,
        role: c.user.role,
      } : null,
      isOP: c.userId === opUserId,
      upvotes: c.votes.filter((v: any) => v.value === 1).length,
      downvotes: c.votes.filter((v: any) => v.value === -1).length,
      score: c.votes.reduce((acc: number, v: any) => acc + v.value, 0),
      parentId: c.parentId,
      replies: await Promise.all(replies.map(buildFullThread)),
    };
  }
  const thread = await buildFullThread(comment);
  return reply.send(convertBigInts(thread));
} 