import { FastifyRequest, FastifyReply } from 'fastify';
import { getConfig, updateConfig } from '../services/configService.js';
import { sendEmailNotification } from '../services/notificationService.js';

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER');
}

export async function getConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const config = await getConfig();
  return reply.send(config);
}

export async function updateConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  // Assume admin check is done in middleware
  const data = request.body as any;
  const updated = await updateConfig(data);
  return reply.send(updated);
}

export async function getSmtpConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const config = await getConfig();
  return reply.send({
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    smtpFrom: config.smtpFrom
  });
}

export async function updateSmtpConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = request.body as any;
  const updated = await updateConfig({ smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom });
  return reply.send({ smtpHost: updated.smtpHost, smtpPort: updated.smtpPort, smtpUser: updated.smtpUser, smtpFrom: updated.smtpFrom });
}

export async function testSmtpHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { to } = request.body as any;
  if (!to) return reply.status(400).send({ error: 'Missing recipient email' });
  try {
    await sendEmailNotification({ to, subject: 'SMTP Test Email', text: 'This is a test email from LA-REVO.' });
    return reply.send({ success: true });
  } catch (err) {
    return reply.status(500).send({ error: 'Failed to send test email', details: (err as Error).message });
  }
} 