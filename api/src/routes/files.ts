import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getConfig } from '../services/configService.js';
import { getFile } from '../services/fileStorageService.js';

const prisma = new PrismaClient();

export async function registerFileRoutes(app: FastifyInstance) {
  // Servir archivos subidos independientemente del storage (DB, S3, LOCAL)
  app.get('/files/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const file = await prisma.uploadedFile.findUnique({ where: { id } });
      if (!file) return reply.status(404).send({ error: 'File not found' });

      const config = await getConfig();
      const buffer = await getFile({ file, config: config as any });
      reply.header('Content-Type', file.mimeType);
      return reply.send(buffer);
    } catch (err) {
      return reply.status(500).send({ error: 'Failed to fetch file' });
    }
  });
}


