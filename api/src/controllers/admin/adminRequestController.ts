import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../services/notificationService.js';
import { getRequestClosedEmail, getRequestRejectedEmail } from '../../utils/emailTemplates/requestStatusEmail.js';
const prisma = new PrismaClient();

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FOUNDER');
}

export async function closeRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { reason } = request.body as any;
  
  const updated = await prisma.request.update({ where: { id }, data: { status: 'CLOSED' } });
  
  // Notify requestor
  if (updated.userId) {
    const requestUser = await prisma.user.findUnique({ where: { id: updated.userId } });
    if (requestUser) {
      const message = reason 
        ? `Your request "${updated.title}" has been closed by an admin. Reason: ${reason}`
        : `Your request "${updated.title}" has been closed by an admin.`;
      
      const { text, html } = getRequestClosedEmail({ username: requestUser.username, requestTitle: updated.title });
      await createNotification({
        userId: updated.userId,
        type: 'request_closed',
        message,
        sendEmail: true,
        email: requestUser.email,
        emailSubject: 'Your request has been closed',
        emailText: text,
        emailHtml: html
      });
    }
  }
  return reply.send(updated);
}

export async function rejectRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { reason } = request.body as any;
  
  const updated = await prisma.request.update({ where: { id }, data: { status: 'REJECTED' } });
  
  // Notify requestor
  if (updated.userId) {
    const requestUser = await prisma.user.findUnique({ where: { id: updated.userId } });
    if (requestUser) {
      const message = reason 
        ? `Your request "${updated.title}" has been rejected by an admin. Reason: ${reason}`
        : `Your request "${updated.title}" has been rejected by an admin.`;
      
      const { text, html } = getRequestRejectedEmail({ username: requestUser.username, requestTitle: updated.title });
      await createNotification({
        userId: updated.userId,
        type: 'request_rejected',
        message,
        sendEmail: true,
        email: requestUser.email,
        emailSubject: 'Your request has been rejected',
        emailText: text,
        emailHtml: html
      });
    }
  }
  return reply.send(updated);
} 