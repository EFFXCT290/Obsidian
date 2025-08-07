-- CreateTable
CREATE TABLE "HitAndRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "torrentId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeededAt" TIMESTAMP(3),
    "totalSeedingTime" INTEGER NOT NULL DEFAULT 0,
    "isHitAndRun" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HitAndRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HitAndRun" ADD CONSTRAINT "HitAndRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HitAndRun" ADD CONSTRAINT "HitAndRun_torrentId_fkey" FOREIGN KEY ("torrentId") REFERENCES "Torrent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
