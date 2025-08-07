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
    include: { children: true }
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