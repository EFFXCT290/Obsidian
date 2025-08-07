-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "s3AccessKeyId" TEXT,
ADD COLUMN     "s3Bucket" TEXT,
ADD COLUMN     "s3Region" TEXT,
ADD COLUMN     "s3SecretAccessKey" TEXT;
