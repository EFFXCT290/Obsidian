-- AlterTable
ALTER TABLE "public"."Torrent" ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false;
