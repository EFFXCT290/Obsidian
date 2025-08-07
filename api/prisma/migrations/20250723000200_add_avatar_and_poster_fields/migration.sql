/*
  Warnings:

  - A unique constraint covering the columns `[posterFileId]` on the table `Torrent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarFileId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Torrent" ADD COLUMN     "posterFileId" TEXT,
ADD COLUMN     "posterUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarFileId" TEXT,
ADD COLUMN     "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Torrent_posterFileId_key" ON "Torrent"("posterFileId");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarFileId_key" ON "User"("avatarFileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Torrent" ADD CONSTRAINT "Torrent_posterFileId_fkey" FOREIGN KEY ("posterFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
