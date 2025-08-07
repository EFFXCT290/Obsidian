-- CreateTable
CREATE TABLE "AnnounceRateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announceCount" INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "AnnounceRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnounceRateLimit_userId_idx" ON "AnnounceRateLimit"("userId");

-- AddForeignKey
ALTER TABLE "AnnounceRateLimit" ADD CONSTRAINT "AnnounceRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
