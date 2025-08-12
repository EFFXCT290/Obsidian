-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "inheritSources" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySource" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "isInherited" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorySource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE INDEX "CategorySource_categoryId_idx" ON "CategorySource"("categoryId");

-- CreateIndex
CREATE INDEX "CategorySource_sourceId_idx" ON "CategorySource"("sourceId");

-- CreateIndex
CREATE INDEX "CategorySource_categoryId_order_idx" ON "CategorySource"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySource_categoryId_sourceId_key" ON "CategorySource"("categoryId", "sourceId");

-- AddForeignKey
ALTER TABLE "CategorySource" ADD CONSTRAINT "CategorySource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySource" ADD CONSTRAINT "CategorySource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default sources
INSERT INTO "Source" ("id", "name", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'BluRay', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'WebDL', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'HDRip', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'DVDRip', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRRip', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'BDRip', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'FLAC', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'MP3', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'AAC', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'OGG', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'WAV', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'PDF', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'EPUB', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'MOBI', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'AZW3', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'TXT', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'ISO', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'RAR', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'ZIP', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'EXE', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'MSI', TRUE, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
