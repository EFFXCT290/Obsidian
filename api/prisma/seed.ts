/*
 * Prisma seed for default Categories and their Sources
 * - Creates top-level categories if they don't exist
 * - Ensures sources exist (created if missing)
 * - Links sources to categories as own (non-inherited) with stable order
 */
import { PrismaClient } from '@prisma/client';

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


