/*
 * Prisma seed for default Categories, Sources, and Ranks
 * - Creates top-level categories if they don't exist
 * - Ensures sources exist (created if missing)
 * - Links sources to categories as own (non-inherited) with stable order
 * - Creates default ranks for the rank system
 */
import { PrismaClient } from '@prisma/client';

// Declare process for Node.js environment
declare const process: {
  exit: (code: number) => never;
};

const prisma = new PrismaClient();

const categoriesWithSources: Record<string, string[]> = {
  Movies: ['BluRay', 'WebDL', 'HDRip', 'DVDRip', 'BRRip', 'BDRip'],
  Music: ['FLAC', 'MP3', 'AAC', 'OGG', 'WAV'],
  Books: ['PDF', 'EPUB', 'MOBI', 'AZW3', 'TXT'],
  Games: ['ISO', 'RAR', 'ZIP', 'EXE'],
  Software: ['ISO', 'RAR', 'ZIP', 'EXE', 'MSI'],
};

// Subcategories per root category. Each subcategory can optionally define extra own sources.
const subcategoriesByRoot: Record<string, { name: string; sources?: string[] }[]> = {
  Movies: [
    { name: 'Action', sources: ['Remux'] },
    { name: 'Drama' },
    { name: 'Comedy' },
    { name: 'Documentary' },
  ],
  Music: [
    { name: 'Rock' },
    { name: 'Pop' },
    { name: 'Classical', sources: ['DSD'] },
  ],
  Books: [
    { name: 'Fiction' },
    { name: 'Non-Fiction' },
    { name: 'Comics' },
  ],
  Games: [
    { name: 'PC', sources: ['Patch'] },
    { name: 'Console' },
  ],
  Software: [
    { name: 'Windows', sources: ['MSIX'] },
    { name: 'Linux', sources: ['AppImage'] },
    { name: 'Mac' },
  ],
};

async function getOrCreateSourceIdByName(name: string): Promise<string> {
  // Find by unique name or create if not exists
  const existing = await prisma.source.findUnique({ where: { name } });
  if (existing) return existing.id;
  const created = await prisma.source.create({ data: { name } });
  return created.id;
}

async function seedRanks() {
  console.log('Seeding default ranks...');

  const defaultRanks = [
    {
      name: 'Newbie',
      description: 'New to the tracker',
      order: 1,
      minUpload: 0,
      minDownload: 0,
      minRatio: 0.0,
      color: '#6B7280' // Gray
    },
    {
      name: 'Member',
      description: 'Active tracker member',
      order: 2,
      minUpload: 10737418240, // 10 GB
      minDownload: 5368709120, // 5 GB
      minRatio: 0.5,
      color: '#3B82F6' // Blue
    },
    {
      name: 'Power User',
      description: 'User with excellent ratio and activity',
      order: 3,
      minUpload: 107374182400, // 100 GB
      minDownload: 53687091200, // 50 GB
      minRatio: 1.0,
      color: '#10B981' // Green
    },
    {
      name: 'Elite',
      description: 'Elite member with exceptional contributions',
      order: 4,
      minUpload: 536870912000, // 500 GB
      minDownload: 268435456000, // 250 GB
      minRatio: 1.5,
      color: '#F59E0B' // Yellow/Orange
    },
    {
      name: 'Torrent Master',
      description: 'Torrent master with massive contributions',
      order: 5,
      minUpload: 1073741824000, // 1 TB
      minDownload: 536870912000, // 500 GB
      minRatio: 2.0,
      color: '#EF4444' // Red
    },
    {
      name: 'Legend',
      description: 'Tracker legend with epic contributions',
      order: 6,
      minUpload: 5368709120000, // 5 TB
      minDownload: 2684354560000, // 2.5 TB
      minRatio: 2.5,
      color: '#8B5CF6' // Purple
    }
  ];

  for (const rankData of defaultRanks) {
    await (prisma as any).rank.upsert({
      where: { name: rankData.name },
      update: {
        description: rankData.description,
        order: rankData.order,
        minUpload: rankData.minUpload,
        minDownload: rankData.minDownload,
        minRatio: rankData.minRatio,
        color: rankData.color,
      },
      create: rankData,
    });
  }

  console.log('Ranks seeding completed.');
}

async function main() {
  console.log('Seeding default categories and sources...');

  // Determine starting order for root categories
  const maxOrder = await prisma.category.aggregate({ where: { parentId: null }, _max: { order: true } });
  let baseOrder = (maxOrder._max.order ?? -1) + 1;

  for (const [categoryName, sources] of Object.entries(categoriesWithSources)) {
    // Ensure category exists (root level)
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: null,
        icon: null,
        order: baseOrder++,
        parentId: null,
      },
    });

    // Ensure each source exists and is linked as own
    for (let i = 0; i < sources.length; i++) {
      const sourceName = sources[i];
      const sourceId = await getOrCreateSourceIdByName(sourceName);

      // Link as own (non-inherited), keep order stable by i
      await prisma.categorySource.upsert({
        where: {
          categoryId_sourceId: {
            categoryId: category.id,
            sourceId,
          },
        },
        update: {
          isInherited: false,
          order: i,
        },
        create: {
          categoryId: category.id,
          sourceId,
          isInherited: false,
          order: i,
        },
      } as any);
    }

    // Create subcategories for this root category
    const subcats = subcategoriesByRoot[categoryName] || [];
    // Determine starting order for this parent's children
    const childMaxOrder = await prisma.category.aggregate({ where: { parentId: category.id }, _max: { order: true } });
    let childOrder = (childMaxOrder._max.order ?? -1) + 1;

    for (const sub of subcats) {
      const subcategory = await prisma.category.upsert({
        where: { name: sub.name },
        update: {
          parentId: category.id,
        },
        create: {
          name: sub.name,
          description: null,
          icon: null,
          order: childOrder++,
          parentId: category.id,
        },
      });

      if (sub.sources && sub.sources.length > 0) {
        // Ensure extra own sources and link to subcategory
        for (let i = 0; i < sub.sources.length; i++) {
          const sourceName = sub.sources[i];
          const sourceId = await getOrCreateSourceIdByName(sourceName);
          await prisma.categorySource.upsert({
            where: {
              categoryId_sourceId: {
                categoryId: subcategory.id,
                sourceId,
              },
            },
            update: {
              isInherited: false,
              order: i,
            },
            create: {
              categoryId: subcategory.id,
              sourceId,
              isInherited: false,
              order: i,
            },
          } as any);
        }
      }
    }
  }

  // Seed ranks after categories
  await seedRanks();

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });