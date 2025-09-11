import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPreferencesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const dbUser = await prisma.user.findUnique({ 
    where: { id: user.id }, 
    select: { 
      preferredLanguage: true, 
      allowEmailNotifications: true,
      publicProfile: true 
    } 
  });
  return reply.send(dbUser || { preferredLanguage: 'es', allowEmailNotifications: true, publicProfile: false });
}

export async function updatePreferencesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { preferredLanguage, allowEmailNotifications, publicProfile } = request.body as any;
  const updated = await prisma.user.update({ 
    where: { id: user.id }, 
    data: { preferredLanguage, allowEmailNotifications, publicProfile } 
  });
  return reply.send({ 
    preferredLanguage: updated.preferredLanguage, 
    allowEmailNotifications: updated.allowEmailNotifications,
    publicProfile: updated.publicProfile 
  });
}

export async function getPublicProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { username } = request.params as any;
  
  // Find user by username and check if profile is public
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      role: true,
      upload: true,
      download: true,
      createdAt: true,
      avatarUrl: true,
      publicProfile: true,
      torrents: {
        where: {
          isApproved: true,
          isAnonymous: false, // Only show non-anonymous torrents
          isRejected: false
        },
        select: {
          id: true,
          name: true,
          size: true,
          createdAt: true,
          category: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limit to 10 most recent torrents
      }
    }
  });

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  if (!user.publicProfile) {
    return reply.status(403).send({ error: 'Profile is private' });
  }

  // Calculate ratio
  const ratio = user.download > 0 ? Number(user.upload) / Number(user.download) : 0;

  return reply.send({
    id: user.id,
    username: user.username,
    role: user.role,
    upload: user.upload.toString(),
    download: user.download.toString(),
    ratio: ratio.toFixed(2),
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl,
    publicTorrents: (user as any).torrents.map((torrent: any) => ({
      id: torrent.id,
      name: torrent.name,
      size: torrent.size.toString(),
      createdAt: torrent.createdAt,
      category: torrent.category?.name || 'General',
      seeders: 0, // We'll get this from a separate query if needed
      leechers: 0 // We'll get this from a separate query if needed
    }))
  });
}


