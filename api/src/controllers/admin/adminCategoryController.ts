import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER');
}

export async function listCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { 
      children: {
        include: {
          _count: {
            select: {
              torrents: true,
              requests: true
            }
          }
        }
      },
      _count: {
        select: {
          torrents: true,
          requests: true
        }
      }
    }
  });
  return reply.send(categories);
}

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { name, description, icon, order, parentId } = request.body as any;
  if (!name) return reply.status(400).send({ error: 'Name is required' });
  const category = await prisma.category.create({
    data: { name, description, icon, order, parentId }
  });
  return reply.status(201).send(category);
}

export async function updateCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { name, description, icon, order, parentId } = request.body as any;
  const updated = await prisma.category.update({
    where: { id },
    data: { name, description, icon, order, parentId }
  });
  return reply.send(updated);
}

export async function deleteCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  await prisma.category.delete({ where: { id } });
  return reply.send({ success: true });
}

export async function reorderCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  
  const { categories } = request.body as any;
  if (!Array.isArray(categories)) {
    return reply.status(400).send({ error: 'Categories array is required' });
  }

  try {
    // Update each category's order in a transaction
    await prisma.$transaction(
      categories.map((category: any, index: number) =>
        prisma.category.update({
          where: { id: category.id },
          data: { order: index }
        })
      )
    );

    return reply.send({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return reply.status(500).send({ error: 'Failed to reorder categories' });
  }
} 