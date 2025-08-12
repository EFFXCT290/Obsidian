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
  const { cascade } = (request.body as any) || {};

  // Load category and immediate children
  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: { select: { id: true } } }
  });
  if (!category) return reply.status(404).send({ error: 'Category not found' });

  // If it has children and cascade not confirmed, block and inform client
  if (category.children.length > 0 && !cascade) {
    return reply.status(400).send({ error: 'Category has subcategories. Confirmation required to delete cascade.', requiresCascade: true });
  }

  // Collect all descendant category IDs (including self)
  const idsToDelete: string[] = [category.id];
  let queue: string[] = category.children.map((c) => c.id);
  while (queue.length > 0) {
    const batch = await prisma.category.findMany({
      where: { id: { in: queue } },
      select: { id: true, children: { select: { id: true } } }
    });
    const nextQueue: string[] = [];
    for (const item of batch) {
      idsToDelete.push(item.id);
      for (const ch of item.children) nextQueue.push(ch.id);
    }
    queue = nextQueue;
  }

  // Delete from leaves up using deleteMany (CategorySource rows will be removed due to FK ON DELETE CASCADE)
  await prisma.$transaction([
    prisma.categorySource.deleteMany({ where: { categoryId: { in: idsToDelete } } }),
    prisma.category.deleteMany({ where: { id: { in: idsToDelete } } })
  ]);

  return reply.send({ success: true, deletedCount: idsToDelete.length });
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
  
  const { categoryId, newParentId, newOrder, forceReorder, sourcesOption } = request.body as any;
  
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
    const updatedCategory = await prisma.category.update({
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

    // Handle sources inheritance strategy when parent actually changes
    if (oldParentId !== newParentId && sourcesOption) {
      // sourcesOption: 'keep_and_inherit' | 'inherit_only' | 'keep_only'
      if (sourcesOption === 'inherit_only') {
        // Remove all own sources for the moved category and enable inheritance
        await prisma.categorySource.deleteMany({ where: { categoryId } });
        await prisma.category.update({ where: { id: categoryId }, data: { inheritSources: true } });
      } else if (sourcesOption === 'keep_only') {
        // Keep own sources only, disable inheritance
        await prisma.category.update({ where: { id: categoryId }, data: { inheritSources: false } });
      } else if (sourcesOption === 'keep_and_inherit') {
        // Keep own sources and ensure inheritance enabled
        await prisma.category.update({ where: { id: categoryId }, data: { inheritSources: true } });
      }
    }

    return reply.send({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Error moving category:', error);
    return reply.status(500).send({ error: 'Failed to move category' });
  }
} 

/**
 * Get category sources split by own and inherited.
 * Inherited sources are computed from ancestor chain when inheritSources is true.
 */
export async function getCategorySourcesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params as any;
  if (!id) return reply.status(400).send({ error: 'Category ID is required' });

  try {
    // Load category and its own sources
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return reply.status(404).send({ error: 'Category not found' });

    const ownLinks = await prisma.categorySource.findMany({
      where: { categoryId: id },
      include: { source: true },
      orderBy: { order: 'asc' },
    });

    // Compute inherited only if inheritSources is true and the category has a parent
    let inherited: { id: string; name: string; isActive: boolean; order: number }[] = [];
    if (category.inheritSources && category.parentId) {
      const ownIds = new Set(ownLinks.map((l) => l.sourceId));
      // Traverse ancestor chain
      let currentParentId: string | null = category.parentId;
      const seen = new Set<string>();
      while (currentParentId) {
        const parent = await prisma.category.findUnique({ where: { id: currentParentId } });
        if (!parent) break;
        // Parent own sources in order
        const parentLinks = await prisma.categorySource.findMany({
          where: { categoryId: currentParentId },
          include: { source: true },
          orderBy: { order: 'asc' },
        });
        for (const link of parentLinks) {
          if (seen.has(link.sourceId) || ownIds.has(link.sourceId)) continue;
          seen.add(link.sourceId);
          inherited.push({ id: link.source.id, name: link.source.name, isActive: link.source.isActive, order: link.order });
        }
        currentParentId = parent.parentId;
      }
    }

    const own = ownLinks.map((l) => ({ id: l.source.id, name: l.source.name, isActive: l.source.isActive, order: l.order }));

    return reply.send({ own, inherited });
  } catch (error) {
    console.error('Error fetching category sources:', error);
    return reply.status(500).send({ error: 'Failed to fetch category sources' });
  }
}

/**
 * Add an own source to a category. If source doesn't exist, create it.
 * Prevent duplicates against own and inherited.
 */
export async function addCategorySourceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params as any; // category id
  const { name } = request.body as any;

  if (!id || !name || typeof name !== 'string' || !name.trim()) {
    return reply.status(400).send({ error: 'Category id and source name are required' });
  }

  const sourceName = name.trim();

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return reply.status(404).send({ error: 'Category not found' });

    // Does any own link already exist?
    const existingOwn = await prisma.categorySource.findFirst({
      where: { categoryId: id, source: { name: sourceName } },
      include: { source: true },
    });
    if (existingOwn) return reply.status(400).send({ error: 'Source already exists in this category' });

    // Check inherited duplication
    if (category.inheritSources && category.parentId) {
      let currentParentId: string | null = category.parentId;
      while (currentParentId) {
        const parent = await prisma.category.findUnique({ where: { id: currentParentId } });
        if (!parent) break;
        const parentLink = await prisma.categorySource.findFirst({
          where: { categoryId: currentParentId, source: { name: sourceName } },
        });
        if (parentLink) {
          return reply.status(400).send({ error: 'Source already inherited from parent' });
        }
        currentParentId = parent.parentId;
      }
    }

    // Ensure Source exists (case-sensitive unique by schema). Try find by name ignoring case relaxedly
    let source = await prisma.source.findUnique({ where: { name: sourceName } });
    if (!source) {
      source = await prisma.source.create({ data: { name: sourceName } });
    }

    // Determine next order
    const maxOrder = await prisma.categorySource.aggregate({
      where: { categoryId: id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    await prisma.categorySource.create({
      data: { categoryId: id, sourceId: source.id, isInherited: false, order: nextOrder },
    });

    return reply.status(201).send({ success: true });
  } catch (error) {
    console.error('Error adding category source:', error);
    return reply.status(500).send({ error: 'Failed to add source' });
  }
}

/**
 * Remove an own source from a category. Inherited entries cannot be removed here.
 */
export async function deleteCategorySourceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });

  const { id, sourceId } = request.params as any; // category id and source id
  if (!id || !sourceId) return reply.status(400).send({ error: 'Category id and source id are required' });

  try {
    const link = await prisma.categorySource.findUnique({
      where: { categoryId_sourceId: { categoryId: id, sourceId } } as any,
    });

    if (!link) return reply.status(404).send({ error: 'Source not found in this category' });
    if (link.isInherited) return reply.status(400).send({ error: 'Inherited sources cannot be removed here' });

    await prisma.categorySource.delete({
      where: { categoryId_sourceId: { categoryId: id, sourceId } } as any,
    });
    return reply.send({ success: true });
  } catch (error) {
    console.error('Error deleting category source:', error);
    return reply.status(500).send({ error: 'Failed to delete source' });
  }
}

/**
 * Reorder own sources for a category using an ordered array of source IDs.
 */
export async function reorderCategorySourcesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });

  const { id } = request.params as any; // category id
  const { orderedSourceIds } = request.body as any;
  if (!id || !Array.isArray(orderedSourceIds)) {
    return reply.status(400).send({ error: 'Category id and orderedSourceIds are required' });
  }

  try {
    // Validate that all ids correspond to own links
    const ownLinks = await prisma.categorySource.findMany({ where: { categoryId: id, sourceId: { in: orderedSourceIds } } });
    const ownIds = new Set(ownLinks.filter((l) => !l.isInherited).map((l) => l.sourceId));
    const notOwn = orderedSourceIds.filter((sid: string) => !ownIds.has(sid));
    if (notOwn.length > 0) {
      return reply.status(400).send({ error: 'One or more sources are not own sources of this category' });
    }

    await prisma.$transaction(
      orderedSourceIds.map((sourceId: string, index: number) =>
        prisma.categorySource.update({
          where: { categoryId_sourceId: { categoryId: id, sourceId } } as any,
          data: { order: index },
        })
      )
    );

    return reply.send({ success: true });
  } catch (error) {
    console.error('Error reordering category sources:', error);
    return reply.status(500).send({ error: 'Failed to reorder sources' });
  }
}