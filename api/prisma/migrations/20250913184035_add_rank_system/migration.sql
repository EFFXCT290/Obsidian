-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "ranksEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "minUpload" BIGINT NOT NULL DEFAULT 0,
    "minDownload" BIGINT NOT NULL DEFAULT 0,
    "minRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_order_key" ON "Rank"("order");
