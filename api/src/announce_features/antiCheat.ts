import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkGhostLeeching(config: any, params: any): Promise<string | null> {
  if (!config.enableGhostLeechingCheck) return null;
  const { userId, torrentId } = params;
  if (!userId || !torrentId) return null;
  // Find all announces for this user/torrent
  const prisma = new PrismaClient();
  const announces = await prisma.announce.findMany({ where: { userId, torrentId } });
  if (announces.length === 0) return null;
  const hasDownloaded = announces.some(a => a.downloaded > BigInt(0));
  const hasUploaded = announces.some(a => a.uploaded > BigInt(0));
  if (hasDownloaded && !hasUploaded) {
    return 'Ghost leeching detected: you must seed after downloading.';
  }
  return null;
}

export async function checkCheatingClient(config: any, params: any): Promise<string | null> {
  if (!config.enableCheatingClientCheck) return null;
  // Detect cheating clients by peer_id prefix or fingerprint
  const peerId = params.peer_id || '';
  const fingerprint = params.fingerprint || '';
  // Configurable list of known cheating client peer_id prefixes or fingerprints
  const cheatingPeerIdPrefixes: string[] = config.cheatingClientPeerIdPrefixes || [];
  const cheatingFingerprints: string[] = config.cheatingClientFingerprints || [];
  // Check peer_id prefix
  if (cheatingPeerIdPrefixes.some(prefix => peerId.startsWith(prefix))) {
    return 'Cheating client detected: your torrent client is not allowed.';
  }
  // Check fingerprint
  if (cheatingFingerprints.some(fp => fingerprint.startsWith(fp))) {
    return 'Cheating client detected: your torrent client version is not allowed.';
  }
  return null;
}

export async function checkIpAbuse(config: any, params: any): Promise<string | null> {
  if (!config.enableIpAbuseCheck) return null;
  const userId = params.userId;
  const ip = params.ip;
  if (!userId || !ip) return null;
  // Configurable thresholds
  const maxIpsPerUser = config.maxIpsPerUser ?? 3;
  const maxUsersPerIp = config.maxUsersPerIp ?? 3;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
  // Count unique IPs used by this user in last 24h
  const userIps = await prisma.announce.findMany({
    where: { userId, lastAnnounceAt: { gte: since } },
    select: { ip: true },
    distinct: ['ip']
  });
  if (userIps.length > maxIpsPerUser) {
    return `IP abuse detected: Too many different IPs used by your account in the last 24h (max ${maxIpsPerUser}).`;
  }
  // Count unique users using this IP in last 24h
  const ipUsers = await prisma.announce.findMany({
    where: { ip, lastAnnounceAt: { gte: since } },
    select: { userId: true },
    distinct: ['userId']
  });
  // Filter out null userIds (system/anonymous announces)
  const uniqueUserIds = ipUsers.map(u => u.userId).filter(Boolean);
  const uniqueUserCount = new Set(uniqueUserIds).size;
  if (uniqueUserCount > maxUsersPerIp) {
    return `IP abuse detected: Too many different users from this IP in the last 24h (max ${maxUsersPerIp}).`;
  }
  return null;
}

export async function checkAnnounceRate(config: any, params: any): Promise<string | null> {
  if (!config.enableAnnounceRateCheck) return null;
  const userId = params.userId;
  const torrentId = params.torrentId;
  const peerId = params.peerId;
  if (!userId || !torrentId || !peerId) return null;
  const minInterval = config.minAnnounceInterval ?? 300; // seconds
  // Find the last announce for this user/torrent/peer
  const lastAnnounce = await prisma.announce.findFirst({
    where: { userId, torrentId, peerId },
    orderBy: { lastAnnounceAt: 'desc' }
  });
  if (lastAnnounce) {
    const now = Date.now();
    const last = new Date(lastAnnounce.lastAnnounceAt).getTime();
    const diffSeconds = (now - last) / 1000;
    if (diffSeconds < minInterval) {
      return `Announce rate limit: You must wait at least ${minInterval} seconds between announces.`;
    }
  }
  return null;
}

export async function checkInvalidStats(config: any, params: any): Promise<string | null> {
  if (!config.enableInvalidStatsCheck) return null;
  const { userId, torrentId, peerId, uploaded, downloaded, left, event, torrentSize } = params;
  if (!userId || !torrentId || !peerId) return null;
  // 1. No negative values
  if (uploaded < 0n || downloaded < 0n || left < 0n) {
    return 'Invalid stats: Negative values are not allowed.';
  }
  // 2. No rewinding
  const lastAnnounce = await prisma.announce.findFirst({
    where: { userId, torrentId, peerId },
    orderBy: { lastAnnounceAt: 'desc' }
  });
  if (lastAnnounce) {
    if (BigInt(uploaded) < lastAnnounce.uploaded) {
      return 'Invalid stats: Uploaded value decreased.';
    }
    if (BigInt(downloaded) < lastAnnounce.downloaded) {
      return 'Invalid stats: Downloaded value decreased.';
    }
  }
  // 3. No impossible values
  const maxJump = (config.maxStatsJumpMultiplier ?? 10) * (Number(torrentSize) || 0);
  if (Number(uploaded) > maxJump || Number(downloaded) > maxJump || Number(left) > Number(torrentSize) * (config.maxStatsJumpMultiplier ?? 10)) {
    return 'Invalid stats: Value exceeds allowed maximum.';
  }
  // 4. No huge jumps
  if (lastAnnounce) {
    const uploadDelta = BigInt(uploaded) - lastAnnounce.uploaded;
    const downloadDelta = BigInt(downloaded) - lastAnnounce.downloaded;
    if (Number(uploadDelta) > maxJump || Number(downloadDelta) > maxJump) {
      return 'Invalid stats: Unreasonably large upload/download jump.';
    }
  }
  // 5. Event consistency
  if (event === 'completed' && BigInt(left) !== 0n) {
    return 'Invalid stats: Completed event must have left = 0.';
  }
  // (Optional) Protocol compliance checks can be added here
  return null;
}

export async function isPeerBanned(config: any, params: any): Promise<string | null> {
  if (!config.enablePeerBanCheck) return null;
  const { userId, passkey, peerId, ip } = params;
  const now = new Date();
  // Build OR array only with defined ban types
  const orClauses = [];
  if (userId) {
    orClauses.push({ userId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
  }
  if (passkey) {
    orClauses.push({ passkey, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
  }
  if (peerId) {
    orClauses.push({ peerId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
  }
  if (ip) {
    orClauses.push({ ip, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
  }
  if (orClauses.length === 0) return null;
  const ban = await prisma.peerBan.findFirst({
    where: {
      OR: orClauses
    }
  });
  if (ban) {
    return `You are banned from the tracker: ${ban.reason}`;
  }
  return null;
}

export async function checkClientWhitelistBlacklist(config: any, params: any): Promise<string | null> {
  const client = params.client || '';
  if (config.whitelistedClients && config.whitelistedClients.length > 0) {
    if (!config.whitelistedClients.includes(client)) {
      return 'Your torrent client is not allowed on this tracker.';
    }
  }
  if (config.blacklistedClients && config.blacklistedClients.length > 0) {
    if (config.blacklistedClients.includes(client)) {
      return 'Your torrent client is banned from this tracker.';
    }
  }
  return null;
}

export async function checkClientFingerprint(config: any, params: any): Promise<string | null> {
  const fingerprint = params.fingerprint || '';
  if (config.allowedFingerprints && config.allowedFingerprints.length > 0) {
    if (!config.allowedFingerprints.includes(fingerprint)) {
      return 'Your torrent client version is not allowed (fingerprint check).';
    }
  }
  return null;
}

export async function checkAnnounceRateLimit(config: any, params: any): Promise<string | null> {
  const userId = params.userId;
  if (!userId) return null;
  const rateLimit = config.announceRateLimit ?? 60;
  const rateWindow = config.announceRateWindow ?? 3600; // seconds
  const cooldown = config.announceCooldown ?? 1800; // seconds
  const now = new Date();
  // Find or create AnnounceRateLimit record for this user
  let record = await prisma.announceRateLimit.findFirst({ where: { userId } });
  if (!record) {
    record = await prisma.announceRateLimit.create({
      data: { userId, lastCheckedAt: now, announceCount: 1 }
    });
    return null;
  }
  // Check if in cooldown
  if (record.cooldownUntil && new Date(record.cooldownUntil) > now) {
    const secondsLeft = Math.ceil((new Date(record.cooldownUntil).getTime() - now.getTime()) / 1000);
    return `Announce rate limit exceeded: You are in cooldown for ${secondsLeft} more seconds.`;
  }
  // If lastCheckedAt is outside the window, reset
  if ((now.getTime() - new Date(record.lastCheckedAt).getTime()) / 1000 > rateWindow) {
    await prisma.announceRateLimit.update({
      where: { id: record.id },
      data: { lastCheckedAt: now, announceCount: 1, cooldownUntil: null, reason: null }
    });
    return null;
  }
  // Otherwise, increment count
  if (record.announceCount + 1 > rateLimit) {
    const cooldownUntil = new Date(now.getTime() + cooldown * 1000);
    await prisma.announceRateLimit.update({
      where: { id: record.id },
      data: { cooldownUntil, reason: 'Too many announces' }
    });
    return `Announce rate limit exceeded: You are in cooldown for ${cooldown} seconds.`;
  } else {
    await prisma.announceRateLimit.update({
      where: { id: record.id },
      data: { announceCount: { increment: 1 } }
    });
    return null;
  }
} 