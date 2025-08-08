import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Configuration
 * 
 * This file configures the Prisma client for database access.
 * It provides a singleton instance to be used throughout the application.
 */

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

