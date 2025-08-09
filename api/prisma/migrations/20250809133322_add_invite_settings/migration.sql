-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "inviteExpiryHours" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "maxInvitesPerUser" INTEGER NOT NULL DEFAULT 5;
