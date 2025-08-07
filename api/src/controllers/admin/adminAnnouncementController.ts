import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../services/notificationService.js';
import { getAnnouncementEmail } from '../../utils/emailTemplates/announcementEmail.js';
const prisma = new PrismaClient();

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER');
}

export async function createAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { title, body, pinned, visible } = request.body as any;
  if (!title || !body) return reply.status(400).send({ error: 'Title and body are required' });
  const announcement = await prisma.announcement.create({
    data: { title, body, pinned: !!pinned, visible: visible !== false, createdById: user.id }
  });
  // Notify all users (including admins and owner)
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, username: true, email: true } });
  await Promise.all(users.map(u => {
    const { text, html } = getAnnouncementEmail({ username: u.username, title, body });
    return createNotification({
      userId: u.id,
      type: 'announcement',
      message: `New announcement: "${title}"`,
      sendEmail: true,
      email: u.email,
      emailSubject: `New announcement: ${title}`,
      emailText: text,
      emailHtml: html
    });
  }));
  return reply.status(201).send(announcement);
}

export async function updateAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { title, body, pinned, visible } = request.body as any;
  const updated = await prisma.announcement.update({
    where: { id },
    data: { title, body, pinned, visible }
  });
  return reply.send(updated);
}

export async function deleteAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  await prisma.announcement.delete({ where: { id } });
  return reply.send({ success: true });
}

export async function pinAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.announcement.update({ where: { id }, data: { pinned: true } });
  return reply.send(updated);
}

export async function unpinAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.announcement.update({ where: { id }, data: { pinned: false } });
  return reply.send(updated);
}

export async function showAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.announcement.update({ where: { id }, data: { visible: true } });
  return reply.send(updated);
}

export async function hideAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.announcement.update({ where: { id }, data: { visible: false } });
  return reply.send(updated);
} 

export async function listAllAnnouncementsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { page = 1, limit = 100 } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      skip,
      take: Number(limit),
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { id: true, username: true, role: true } } }
    }),
    prisma.announcement.count()
  ]);
  return reply.send({ announcements, total, page: Number(page), limit: Number(limit) });
} 