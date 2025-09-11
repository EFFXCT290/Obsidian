import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const { torrentId } = request.params as any;
  const { isAnonymous, freeleech } = request.body as any;

  try {
    // Verify the torrent belongs to the user
    const torrent = await prisma.torrent.findFirst({
      where: {
        id: torrentId,
        uploaderId: user.id
      }
    });

    if (!torrent) {
      return reply.status(404).send({ error: 'Torrent not found or access denied' });
    }

    // Update the torrent
    const updatedTorrent = await prisma.torrent.update({
      where: { id: torrentId },
      data: {
        ...(isAnonymous !== undefined && { isAnonymous }),
        ...(freeleech !== undefined && { freeleech })
      },
      select: {
        id: true,
        name: true,
        isAnonymous: true,
        freeleech: true
      }
    });

    return reply.send({
      success: true,
      torrent: updatedTorrent
    });
  } catch (error) {
    console.error('Error updating torrent:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function deleteTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const { torrentId } = request.params as any;

  try {
    // Verify the torrent belongs to the user
    const torrent = await prisma.torrent.findFirst({
      where: {
        id: torrentId,
        uploaderId: user.id
      }
    });

    if (!torrent) {
      return reply.status(404).send({ error: 'Torrent not found or access denied' });
    }

    // Delete the torrent (this will cascade to related records)
    await prisma.torrent.delete({
      where: { id: torrentId }
    });

    return reply.send({
      success: true,
      message: 'Torrent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting torrent:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}
