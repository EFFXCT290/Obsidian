/*
  Warnings:

  - A unique constraint covering the columns `[passkey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passkey` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passkey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_passkey_key" ON "User"("passkey");
