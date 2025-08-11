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
        },
        orderBy: {
          order: 'asc'
        }
      },
      _count: {
        select: {
          torrents: true,
          requests: true
        }
      }
    },
    orderBy: {
      order: 'asc'
    }
  });
  return reply.send(categories);
}

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { name, description, icon, order, parentId } = request.body as any;
  if (!name) return reply.status(400).send({ error: 'Name is required' });
  
  // If no order is provided, assign the next available order
  let finalOrder = order;
  if (finalOrder === undefined || finalOrder === null) {
    const maxOrder = await prisma.category.aggregate({
      where: { parentId: parentId || null },
      _max: { order: true }
    });
    finalOrder = (maxOrder._max.order ?? -1) + 1;
  }
  
  const category = await prisma.category.create({
    data: { name, description, icon, order: finalOrder, parentId }
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

export async function moveCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  
  const { categoryId, newParentId, newOrder, forceReorder } = request.body as any;
  
  if (!categoryId) {
    return reply.status(400).send({ error: 'Category ID is required' });
  }

  try {
    // Get the category to move
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: true
      }
    });

    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }

    // VALIDATION 1: If category has children, it cannot become a subcategory
    if (category.children && category.children.length > 0 && newParentId !== null) {
      return reply.status(400).send({ 
        error: 'Cannot move a category with subcategories into another category. Please move the subcategories first.' 
      });
    }

    // VALIDATION 2: If newParentId is provided, check if it's a root category (not a subcategory)
    if (newParentId) {
      const newParent = await prisma.category.findUnique({
        where: { id: newParentId }
      });

      if (!newParent) {
        return reply.status(404).send({ error: 'Target parent category not found' });
      }

      // Check if the new parent is a subcategory (has a parent itself)
      if (newParent.parentId !== null) {
        return reply.status(400).send({ 
          error: 'Cannot move a category into a subcategory. Only root categories can have subcategories.' 
        });
      }
    }

    // VALIDATION 3: Prevent circular references
    if (newParentId === categoryId) {
      return reply.status(400).send({ error: 'A category cannot be its own parent' });
    }

    // Check if moving would create a circular reference (category becoming parent of its own parent)
    if (newParentId) {
      let currentParent = await prisma.category.findUnique({
        where: { id: newParentId }
      });
      
      while (currentParent && currentParent.parentId) {
        if (currentParent.parentId === categoryId) {
          return reply.status(400).send({ 
            error: 'Cannot move category: would create circular reference' 
          });
        }
        currentParent = await prisma.category.findUnique({
          where: { id: currentParent.parentId }
        });
      }
    }

    const oldParentId = category.parentId;
    
    // Update the category with new parent and order
    await prisma.category.update({
      where: { id: categoryId },
      data: { 
        parentId: newParentId || null,
        order: newOrder !== undefined ? newOrder : 0
      }
    });

    // If we moved from one parent to another, or if forceReorder is true, we need to reorder both groups
    if (oldParentId !== newParentId || forceReorder) {
      // Reorder the old parent's children
      if (oldParentId) {
        const oldSiblings = await prisma.category.findMany({
          where: { parentId: oldParentId },
          orderBy: { order: 'asc' }
        });
        
        await prisma.$transaction(
          oldSiblings.map((sibling, index) =>
            prisma.category.update({
              where: { id: sibling.id },
              data: { order: index }
            })
          )
        );
      }

      // Reorder the new parent's children
      if (newParentId) {
        const newSiblings = await prisma.category.findMany({
          where: { parentId: newParentId },
          orderBy: { order: 'asc' }
        });
        
        await prisma.$transaction(
          newSiblings.map((sibling, index) =>
            prisma.category.update({
              where: { id: sibling.id },
              data: { order: index }
            })
          )
        );
      } else {
        // Moving to root level, reorder all root categories
        const rootCategories = await prisma.category.findMany({
          where: { parentId: null },
          orderBy: { order: 'asc' }
        });
        
        await prisma.$transaction(
          rootCategories.map((rootCat, index) =>
            prisma.category.update({
              where: { id: rootCat.id },
              data: { order: index }
            })
          )
        );
      }
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error('Error moving category:', error);
    return reply.status(500).send({ error: 'Failed to move category' });
  }
} 