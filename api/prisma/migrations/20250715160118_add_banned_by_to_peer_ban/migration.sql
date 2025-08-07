/*
  Warnings:

  - Added the required column `bannedById` to the `PeerBan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PeerBan" ADD COLUMN     "bannedById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PeerBan_bannedById_idx" ON "PeerBan"("bannedById");

-- AddForeignKey
ALTER TABLE "PeerBan" ADD CONSTRAINT "PeerBan_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
