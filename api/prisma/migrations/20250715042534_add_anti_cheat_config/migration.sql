-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "enableAnnounceRateCheck" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableCheatingClientCheck" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableGhostLeechingCheck" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableInvalidStatsCheck" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableIpAbuseCheck" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enablePeerBanCheck" BOOLEAN NOT NULL DEFAULT true;
