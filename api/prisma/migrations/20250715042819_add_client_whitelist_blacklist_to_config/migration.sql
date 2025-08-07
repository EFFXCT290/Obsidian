-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "blacklistedClients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "whitelistedClients" TEXT[] DEFAULT ARRAY[]::TEXT[];
