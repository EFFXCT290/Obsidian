-- CreateTable
CREATE TABLE "PeerBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "passkey" TEXT,
    "peerId" TEXT,
    "ip" TEXT,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeerBan_userId_idx" ON "PeerBan"("userId");

-- CreateIndex
CREATE INDEX "PeerBan_passkey_idx" ON "PeerBan"("passkey");

-- CreateIndex
CREATE INDEX "PeerBan_peerId_idx" ON "PeerBan"("peerId");

-- CreateIndex
CREATE INDEX "PeerBan_ip_idx" ON "PeerBan"("ip");
