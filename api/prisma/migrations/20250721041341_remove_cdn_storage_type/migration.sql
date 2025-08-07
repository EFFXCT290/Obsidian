/*
  Warnings:

  - The values [CDN] on the enum `StorageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StorageType_new" AS ENUM ('LOCAL', 'S3', 'DB');
ALTER TABLE "Config" ALTER COLUMN "storageType" DROP DEFAULT;
ALTER TABLE "Config" ALTER COLUMN "storageType" TYPE "StorageType_new" USING ("storageType"::text::"StorageType_new");
ALTER TYPE "StorageType" RENAME TO "StorageType_old";
ALTER TYPE "StorageType_new" RENAME TO "StorageType";
DROP TYPE "StorageType_old";
ALTER TABLE "Config" ALTER COLUMN "storageType" SET DEFAULT 'LOCAL';
COMMIT;
