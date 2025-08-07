-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "defaultAnnounceInterval" INTEGER NOT NULL DEFAULT 1800,
ADD COLUMN     "minAnnounceInterval" INTEGER NOT NULL DEFAULT 300;
