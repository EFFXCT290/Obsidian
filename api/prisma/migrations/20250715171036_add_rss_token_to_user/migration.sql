/*
  Warnings:

  - A unique constraint covering the columns `[rssToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rssEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rssToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_rssToken_key" ON "User"("rssToken");

-- CreateIndex
CREATE INDEX "User_rssToken_idx" ON "User"("rssToken");
