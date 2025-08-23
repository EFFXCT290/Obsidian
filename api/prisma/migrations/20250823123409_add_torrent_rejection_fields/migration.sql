-- AlterTable
ALTER TABLE "Config" ALTER COLUMN "storageType" SET DEFAULT 'DB',
ALTER COLUMN "requireTorrentApproval" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Torrent" ADD COLUMN     "isRejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "TorrentVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "torrentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TorrentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TorrentVote_userId_torrentId_key" ON "TorrentVote"("userId", "torrentId");

-- AddForeignKey
ALTER TABLE "Torrent" ADD CONSTRAINT "Torrent_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TorrentVote" ADD CONSTRAINT "TorrentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TorrentVote" ADD CONSTRAINT "TorrentVote_torrentId_fkey" FOREIGN KEY ("torrentId") REFERENCES "Torrent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
