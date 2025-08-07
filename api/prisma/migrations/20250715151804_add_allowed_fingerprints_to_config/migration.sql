-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "allowedFingerprints" TEXT[] DEFAULT ARRAY[]::TEXT[];
