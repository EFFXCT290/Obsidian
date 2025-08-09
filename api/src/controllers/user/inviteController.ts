import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getConfig } from '../../services/configService.js';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function listUserInvitesHandler(request: FastifyRequest, reply: FastifyReply) {
  const authUser = (request as any).user;
  if (!authUser) return reply.status(401).send({ error: 'Unauthorized' });
  const config = await getConfig() as any;
  // If server is not in INVITE mode, immediately cancel active invites and refund
  if (config.registrationMode !== 'INVITE') {
    const now = new Date();
    await prisma.invite.deleteMany({
      where: {
        createdById: authUser.id,
        usedById: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      }
    });
  }
  const invites = await prisma.invite.findMany({
    where: { createdById: authUser.id },
    orderBy: { createdAt: 'desc' },
  });
  const isStaff = authUser.role === 'ADMIN' || authUser.role === 'OWNER';
  const maxInvitesPerUser = isStaff ? Number.POSITIVE_INFINITY : (config.maxInvitesPerUser ?? 5);
  const activeCount = invites.filter(i => !i.usedById && (!i.expiresAt || i.expiresAt > new Date())).length;
  const availableInvites = isStaff ? 999999 : Math.max(0, (maxInvitesPerUser as number) - activeCount);
  return reply.send({ invites, availableInvites, maxInvitesPerUser: isStaff ? '∞' : maxInvitesPerUser, registrationMode: config.registrationMode });
}

export async function createInviteHandler(request: FastifyRequest, reply: FastifyReply) {
  const authUser = (request as any).user;
  if (!authUser) return reply.status(401).send({ error: 'Unauthorized' });
  const config = await getConfig() as any;
  if (config.registrationMode !== 'INVITE') {
    return reply.status(403).send({ error: 'Invitations are disabled by registration mode.' });
  }
  const isStaff = authUser.role === 'ADMIN' || authUser.role === 'OWNER';
  const maxInvitesPerUser = isStaff ? Number.POSITIVE_INFINITY : (config.maxInvitesPerUser ?? 5);
  const expiryHours = config.inviteExpiryHours ?? 6;
  const now = new Date();
  const activeCount = await prisma.invite.count({ where: { createdById: authUser.id, usedById: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } });
  if (!isStaff && activeCount >= (maxInvitesPerUser as number)) {
    return reply.status(400).send({ error: 'Maximum active invites reached' });
  }
  const code = randomUUID().replace(/-/g, '').slice(0, 16);
  const invite = await prisma.invite.create({
    data: {
      code,
      createdById: authUser.id,
      // Todos los enlaces usan la expiración del sistema, incluso para STAFF
      expiresAt: new Date(now.getTime() + expiryHours * 60 * 60 * 1000),
    },
  });
  return reply.send({ invite, inviteLink: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/auth/signup/${code}` });
}

export async function cancelInviteHandler(request: FastifyRequest, reply: FastifyReply) {
  const authUser = (request as any).user;
  if (!authUser) return reply.status(401).send({ error: 'Unauthorized' });
  const id = (request.query as any).id || (request.params as any).id;
  if (!id) return reply.status(400).send({ error: 'Missing invite id' });
  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite || invite.createdById !== authUser.id) {
    return reply.status(404).send({ error: 'Invite not found' });
  }
  await prisma.invite.delete({ where: { id } });
  return reply.send({ success: true });
}


// Public endpoint: get invite details by code (no auth)
export async function getInviteByCodePublicHandler(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.params as any;
  if (!code) return reply.status(400).send({ error: 'Missing invite code' });
  const invite = await prisma.invite.findUnique({
    where: { code },
    include: { createdBy: { select: { id: true, username: true } } },
  });
  if (!invite) return reply.status(404).send({ valid: false, error: 'Invite not found' });
  const now = new Date();
  const isExpired = !!invite.expiresAt && invite.expiresAt <= now;
  const isUsed = !!invite.usedById;
  const valid = !isExpired && !isUsed;
  return reply.send({
    valid,
    code: invite.code,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    createdBy: invite.createdBy,
    usedById: invite.usedById,
  });
}


