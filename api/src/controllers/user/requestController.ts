import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../services/notificationService.js';
import { getRequestFilledEmail } from '../../utils/emailTemplates/requestFilledEmail.js';
import { getCommentThreadHandler, convertBigInts } from '../commentController.js';

const prisma = new PrismaClient();

// Helper: Build threaded comments for requests (up to 4 levels, with hasMoreReplies)
async function buildThreadedCommentsForRequest(comments: any[], opUserId: string, level = 0): Promise<any[]> {
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
        replies: level < 4 ? await buildThreadedCommentsForRequest(replies, opUserId, level + 1) : [],
        hasMoreReplies,
      };
    })
  );
}

export async function listRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { status, categoryId, q, page = 1, limit = 20 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } }, filledBy: { select: { id: true, username: true } }, filledTorrent: { select: { id: true, name: true } }, category: true }
    }),
    prisma.request.count({ where })
  ]);
  return reply.send({ requests, total, page: Number(page), limit: Number(limit) });
}

export async function createRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { title, description, categoryId } = request.body as any;
  if (!title) return reply.status(400).send({ error: 'Title is required' });
  const req = await prisma.request.create({
    data: { userId: user.id, title, description, categoryId }
  });
  return reply.status(201).send(req);
}

export async function getRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const req = await prisma.request.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true } }, filledBy: { select: { id: true, username: true } }, filledTorrent: { select: { id: true, name: true } }, category: true }
  });
  if (!req) return reply.status(404).send({ error: 'Request not found' });
  return reply.send(req);
}

export async function fillRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { id } = request.params as any;
  const { torrentId } = request.body as any;
  const req = await prisma.request.findUnique({ where: { id } });
  if (!req) return reply.status(404).send({ error: 'Request not found' });
  if (req.status !== 'OPEN') return reply.status(400).send({ error: 'Request is not open' });
  // Optionally: check if torrent exists and is approved
  const torrent = await prisma.torrent.findUnique({ where: { id: torrentId, isApproved: true } });
  if (!torrent) return reply.status(400).send({ error: 'Invalid or unapproved torrent' });
  const updated = await prisma.request.update({
    where: { id },
    data: { status: 'FILLED', filledById: user.id, filledTorrentId: torrent.id }
  });
  // Notify requestor
  if (req.userId) {
    const requestUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (requestUser) {
      const { text, html } = getRequestFilledEmail({ username: requestUser.username, requestTitle: req.title, torrentName: torrent.name });
      await createNotification({
        userId: req.userId,
        type: 'request_filled',
        message: `Your request "${req.title}" has been filled with torrent: ${torrent.name}`,
        sendEmail: true,
        email: requestUser.email,
        emailSubject: 'Your request has been filled',
        emailText: text,
        emailHtml: html
      });
    }
  }
  return reply.send(updated);
}

// GET /requests/:id/comments
export async function listCommentsForRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const req = await prisma.request.findUnique({ where: { id } });
  if (!req) return reply.status(404).send({ error: 'Request not found' });
  // OP is request creator
  const opUserId = req.userId;
  const rootComments = await prisma.comment.findMany({
    where: { requestId: id, parentId: null, deleted: false },
    orderBy: { createdAt: 'asc' },
    include: { user: true, votes: true },
  });
  const threaded = await buildThreadedCommentsForRequest(rootComments, opUserId);
  return reply.send(convertBigInts(threaded));
}

// POST /requests/:id/comments
export async function createCommentForRequestHandler(request: FastifyRequest, reply: FastifyReply) {
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
    if (!parent || parent.requestId !== id) {
      return reply.status(400).send({ error: 'Invalid parent comment' });
    }
  }
  const comment = await prisma.comment.create({
    data: {
      content,
      userId: user.id,
      requestId: id,
      parentId: parentId || null,
    },
    include: { user: true, votes: true },
  });
  return reply.status(201).send(convertBigInts(comment));
} 