import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { 
  getAllRanks, 
  createRank, 
  updateRank, 
  deleteRank, 
  getRankById,
  areRanksEnabled,
  setRanksEnabled
} from '../../services/rankService.js';

const prisma = new PrismaClient();

// Get all ranks
export async function listRanksHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  try {
    const ranks = await getAllRanks();
    return reply.send({ ranks });
  } catch (error) {
    console.error('[listRanksHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to fetch ranks' });
  }
}

// Create a new rank
export async function createRankHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  const { name, description, order, minUpload, minDownload, minRatio, color } = request.body as any;

  if (!name || order === undefined || minUpload === undefined || minDownload === undefined || minRatio === undefined) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  try {
    // Check if order is already taken
    const existingRank = await prisma.rank.findUnique({ where: { order: Number(order) } });
    if (existingRank) {
      return reply.status(400).send({ error: 'Rank order already exists' });
    }

    const rank = await createRank({
      name,
      description: description || null,
      order: Number(order),
      minUpload: BigInt(minUpload),
      minDownload: BigInt(minDownload),
      minRatio: Number(minRatio),
      color: color || null
    });

    return reply.status(201).send({ rank });
  } catch (error) {
    console.error('[createRankHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to create rank' });
  }
}

// Update a rank
export async function updateRankHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  const { id } = request.params as any;
  const { name, description, order, minUpload, minDownload, minRatio, color } = request.body as any;

  if (!id) {
    return reply.status(400).send({ error: 'Rank ID required' });
  }

  try {
    // Check if rank exists
    const existingRank = await prisma.rank.findUnique({ where: { id } });
    if (!existingRank) {
      return reply.status(404).send({ error: 'Rank not found' });
    }

    // If order is being changed, check if new order is already taken
    if (order !== undefined && order !== existingRank.order) {
      const orderConflict = await prisma.rank.findUnique({ where: { order: Number(order) } });
      if (orderConflict && orderConflict.id !== id) {
        return reply.status(400).send({ error: 'Rank order already exists' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = Number(order);
    if (minUpload !== undefined) updateData.minUpload = BigInt(minUpload);
    if (minDownload !== undefined) updateData.minDownload = BigInt(minDownload);
    if (minRatio !== undefined) updateData.minRatio = Number(minRatio);
    if (color !== undefined) updateData.color = color;

    const rank = await updateRank(id, updateData);
    return reply.send({ rank });
  } catch (error) {
    console.error('[updateRankHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to update rank' });
  }
}

// Delete a rank
export async function deleteRankHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  const { id } = request.params as any;

  if (!id) {
    return reply.status(400).send({ error: 'Rank ID required' });
  }

  try {
    // Check if rank exists
    const existingRank = await getRankById(id);
    if (!existingRank) {
      return reply.status(404).send({ error: 'Rank not found' });
    }

    await deleteRank(id);
    return reply.send({ success: true });
  } catch (error) {
    console.error('[deleteRankHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to delete rank' });
  }
}

// Get rank by ID
export async function getRankHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  const { id } = request.params as any;

  if (!id) {
    return reply.status(400).send({ error: 'Rank ID required' });
  }

  try {
    const rank = await getRankById(id);
    if (!rank) {
      return reply.status(404).send({ error: 'Rank not found' });
    }

    return reply.send({ rank });
  } catch (error) {
    console.error('[getRankHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to fetch rank' });
  }
}

// Get rank system status
export async function getRankSystemStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  try {
    const enabled = await areRanksEnabled();
    return reply.send({ enabled });
  } catch (error) {
    console.error('[getRankSystemStatusHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to fetch rank system status' });
  }
}

// Toggle rank system
export async function toggleRankSystemHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Admin access required' });
  }

  const { enabled } = request.body as any;

  if (typeof enabled !== 'boolean') {
    return reply.status(400).send({ error: 'Enabled field must be a boolean' });
  }

  try {
    await setRanksEnabled(enabled);
    return reply.send({ enabled });
  } catch (error) {
    console.error('[toggleRankSystemHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to toggle rank system' });
  }
} 