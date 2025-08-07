-- CreateIndex
CREATE UNIQUE INDEX "Announce_torrentId_peerId_key" ON "Announce"("torrentId", "peerId");
