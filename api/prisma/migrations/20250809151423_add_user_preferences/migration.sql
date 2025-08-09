-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredLanguage" TEXT;
