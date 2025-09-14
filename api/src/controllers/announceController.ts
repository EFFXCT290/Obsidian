import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bencode from 'bencode';
import { getActivePeers, getSeederLeecherCounts, getCompletedCount } from '../announce_features/peerList.js';
import { updateUserRatio, isUserBelowMinRatio } from '../announce_features/ratio.js';
import { awardBonusPoints } from '../announce_features/bonusPoints.js';
import { updateHitAndRun } from '../announce_features/hitAndRun.js';
import { getConfig } from '../services/configService.js';
import { checkClientWhitelistBlacklist, checkClientFingerprint, checkGhostLeeching, checkCheatingClient, checkIpAbuse, checkAnnounceRate, checkAnnounceRateLimit, checkInvalidStats, isPeerBanned } from '../announce_features/antiCheat.js';
import { extractRealClientIP, isCloudflareRequest, getCloudflareCountry } from '../utils/ipExtraction.js';

const prisma = new PrismaClient();

type Peer = { ip: string; port: number; peerId: string };

export async function announceHandler(request: FastifyRequest, reply: FastifyReply) {
  const { passkey, info_hash, peer_id, port, uploaded, downloaded, left, event, compact } = request.query as any;
  
  // Debug logging
  console.log('[announceHandler] info_hash type:', typeof info_hash);
  console.log('[announceHandler] info_hash isBuffer:', Buffer.isBuffer(info_hash));
  if (typeof info_hash === 'string') {
    console.log('[announceHandler] info_hash length:', info_hash.length);
    console.log('[announceHandler] info_hash value:', info_hash);
  }
  
  if (!passkey || !info_hash || !peer_id || !port) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': 'Missing required parameters' }));
  }
  
  // Validate user
  const user = await prisma.user.findUnique({ where: { passkey } });
  if (!user || user.status !== 'ACTIVE') {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': 'Invalid or banned user' }));
  }
  // Validate torrent
  // Handle info_hash conversion - it can come as binary buffer, hex string, or URL-encoded
  let infoHashHex: string;
  if (Buffer.isBuffer(info_hash)) {
    infoHashHex = info_hash.toString('hex');
  } else if (typeof info_hash === 'string') {
    // If it's already a hex string (40 chars), use it directly
    if (info_hash.length === 40 && /^[0-9a-fA-F]+$/.test(info_hash)) {
      infoHashHex = info_hash.toLowerCase();
    } else if (info_hash.includes('%')) {
      // Handle URL-encoded info hash
      try {
        // First try proper URL decoding
        const decoded = decodeURIComponent(info_hash);
        infoHashHex = Buffer.from(decoded, 'binary').toString('hex');
        console.log('[announceHandler] URL decoded info_hash:', decoded);
        console.log('[announceHandler] Converted to hex:', infoHashHex);
      } catch (_error) {
        console.log('[announceHandler] URL decode failed, trying manual decode...');
        // Manual decode for malformed URLs - replace %xx with actual bytes
        let decoded = info_hash;
        const percentMatches = info_hash.match(/%[0-9a-fA-F]{2}/g) || [];
        
        for (const match of percentMatches) {
          const hexByte = match.substring(1); // Remove %
          const byte = parseInt(hexByte, 16);
          decoded = decoded.replace(match, String.fromCharCode(byte));
        }
        
        console.log('[announceHandler] Manually decoded:', decoded);
        infoHashHex = Buffer.from(decoded, 'binary').toString('hex');
        console.log('[announceHandler] Manual decode result:', infoHashHex);
      }
    } else if (info_hash.length === 20) {
      // Handle raw binary info hash (20 bytes)
      infoHashHex = Buffer.from(info_hash, 'binary').toString('hex');
      console.log('[announceHandler] Binary info_hash converted to hex:', infoHashHex);
    } else {
      // Otherwise treat as binary and convert to hex
      infoHashHex = Buffer.from(info_hash, 'binary').toString('hex');
    }
  } else {
    infoHashHex = Buffer.from(info_hash, 'binary').toString('hex');
  }
  
  console.log('[announceHandler] Final infoHashHex:', infoHashHex);
  
  // Debug: Let's see what torrents exist in the database
  const allTorrents = await prisma.torrent.findMany({ where: { isApproved: true }, select: { infoHash: true, name: true } });
  console.log('[announceHandler] Available torrents in DB:', allTorrents.map(t => ({ infoHash: t.infoHash, name: t.name })));
  
  // Check if our specific torrent exists and is approved
  const specificTorrent = await prisma.torrent.findFirst({ 
    where: { 
      OR: [
        { infoHash: infoHashHex },
        { infoHash: infoHashHex.toLowerCase() },
        { infoHash: infoHashHex.toUpperCase() }
      ],
      isApproved: true 
    },
    select: { infoHash: true, name: true, isApproved: true }
  });
  console.log('[announceHandler] Found torrent with any case:', specificTorrent);
  
  const torrent = await prisma.torrent.findFirst({ 
    where: { 
      OR: [
        { infoHash: infoHashHex },
        { infoHash: infoHashHex.toLowerCase() },
        { infoHash: infoHashHex.toUpperCase() }
      ],
      isApproved: true 
    }
  });
  if (!torrent) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': 'Torrent not found or not approved' }));
  }
  // ENFORCEMENT: Block if user below min ratio or too many hit and runs
  const belowRatio = await isUserBelowMinRatio(user.id);
  if (belowRatio) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': 'Your ratio is below the minimum required.' }));
  }
  // Retrieve config early for anti-cheat and enforcement
  const config = await getConfig();
  // Extract client from peer_id prefix (first 2-4 chars, e.g., -UT, -TR, -QB)
  const client = typeof peer_id === 'string' ? peer_id.substring(0, 4) : '';
  const clientBlockMsg = await checkClientWhitelistBlacklist(config, { client });
  if (clientBlockMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': clientBlockMsg }));
  }
  // Extract fingerprint from peer_id (first 8 chars)
  const fingerprint = typeof peer_id === 'string' ? peer_id.substring(0, 8) : '';
  console.log('[announceHandler] Client fingerprint:', fingerprint);
  const fingerprintBlockMsg = await checkClientFingerprint(config, { fingerprint });
  if (fingerprintBlockMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': fingerprintBlockMsg }));
  }
  // Cheating client check
  const cheatingClientMsg = await checkCheatingClient(config, { peer_id, fingerprint });
  if (cheatingClientMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': cheatingClientMsg }));
  }
  // IP abuse check
  const ipAbuseMsg = await checkIpAbuse(config, { userId: user.id, ip: request.ip });
  if (ipAbuseMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': ipAbuseMsg }));
  }
  // Announce rate limiting
  const announceRateMsg = await checkAnnounceRate(config, { userId: user.id, torrentId: torrent.id, peerId: peer_id });
  if (announceRateMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': announceRateMsg }));
  }
  // Announce rate limit (per user, cooldown)
  const announceRateLimitMsg = await checkAnnounceRateLimit(config, { userId: user.id });
  if (announceRateLimitMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': announceRateLimitMsg }));
  }
  // Invalid stats check
  const invalidStatsMsg = await checkInvalidStats(config, {
    userId: user.id,
    torrentId: torrent.id,
    peerId: peer_id,
    uploaded: BigInt(uploaded || 0),
    downloaded: BigInt(downloaded || 0),
    left: BigInt(left || 0),
    event,
    torrentSize: torrent.size
  });
  if (invalidStatsMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': invalidStatsMsg }));
  }
  // Peer ban check
  const peerBanMsg = await isPeerBanned(config, {
    userId: user.id,
    passkey: user.passkey,
    peerId: peer_id,
    ip: request.ip
  });
  if (peerBanMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': peerBanMsg }));
  }
  // Ghost leeching check
  const ghostLeechMsg = await checkGhostLeeching(config, { userId: user.id, torrentId: torrent.id });
  if (ghostLeechMsg) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': ghostLeechMsg }));
  }
  
  // Extract real client IP using our utility
  const normalizedIp = extractRealClientIP(request);
  
  // Log additional Cloudflare info if available
  if (isCloudflareRequest(request)) {
    const country = getCloudflareCountry(request);
    console.log('[announceHandler] Cloudflare request detected, country:', country);
  }
  
  // Update announce stats (upsert to avoid duplicate records)
  await prisma.announce.upsert({
    where: {
      torrentId_peerId: {
        torrentId: torrent.id,
        peerId: peer_id
      }
    },
    update: {
      ip: normalizedIp,
      port: Number(port),
      uploaded: BigInt(uploaded || 0),
      downloaded: BigInt(downloaded || 0),
      left: BigInt(left || 0),
      event,
      lastAnnounceAt: new Date()
    },
    create: {
      torrentId: torrent.id,
      userId: user.id,
      peerId: peer_id,
      ip: normalizedIp,
      port: Number(port),
      uploaded: BigInt(uploaded || 0),
      downloaded: BigInt(downloaded || 0),
      left: BigInt(left || 0),
      event,
    }
  });

  console.log(`[announceHandler] Raw values - uploaded: ${uploaded}, downloaded: ${downloaded}, left: ${left}, event: ${event}`);
  console.log(`[announceHandler] User: ${user.username} (${user.id}), Peer: ${peer_id}, Torrent: ${torrent.name}`);

  // Update user ratio
  await updateUserRatio(user.id, BigInt(uploaded || 0), BigInt(downloaded || 0), peer_id, torrent.id);

  // Award bonus points for seeding (if left == 0)
  if (BigInt(left || 0) === BigInt(0)) {
    // For simplicity, award points for 30 minutes per announce if seeding
    await awardBonusPoints(user.id, 30);
  }

  // Update hit and run status
          await updateHitAndRun(user.id, torrent.id, Number(left || 0), event);

  // ENFORCEMENT: Block if user has too many hit and runs (VIP users are exempt)
  if (!user.isVip) {
    const hitAndRunCount = await prisma.hitAndRun.count({ where: { userId: user.id, isHitAndRun: true } });
    if (hitAndRunCount > config.hitAndRunThreshold) {
      reply.header('Content-Type', 'text/plain');
      return reply.send(bencode.encode({ 'failure reason': 'Too many hit and runs. Please seed your torrents.' }));
    }
  }
  // Get peer list for this torrent
  const peers: Peer[] = await getActivePeers(torrent.id, peer_id as string, 50);
  console.log('[announceHandler] Found peers for torrent:', peers.length);
  peers.forEach((peer, index) => {
    console.log(`[announceHandler] Peer ${index + 1}: IP=${peer.ip}, Port=${peer.port}, PeerID=${peer.peerId}`);
  });
  
  // Separate IPv4 and IPv6 peers
  const ipv4Peers = peers.filter((p: Peer) => p.ip.includes('.'));
  const ipv6Peers = peers.filter((p: Peer) => p.ip.includes(':'));
  console.log('[announceHandler] IPv4 peers:', ipv4Peers.length, 'IPv6 peers:', ipv6Peers.length);
  let peerList, peerList6;
  if (compact === '1' || compact === 1) {
    // Compact: binary model
    const bufArray = ipv4Peers.map((p: Peer) => {
      const ipParts = p.ip.split('.').map(Number);
      const port = Number(p.port);
      const buf = Buffer.alloc(6);
      buf[0] = ipParts[0];
      buf[1] = ipParts[1];
      buf[2] = ipParts[2];
      buf[3] = ipParts[3];
      buf.writeUInt16BE(port, 4);
      return buf;
    });
    peerList = Buffer.concat(bufArray);
    // IPv6 peers: 16 bytes IP + 2 bytes port
    const bufArray6 = ipv6Peers.map((p: Peer) => {
      const ipBuf = Buffer.alloc(16);
      // Best-effort write; ignore return value to satisfy linter
      ipBuf.write(p.ip, 0, 16, 'utf8');
      const port = Number(p.port);
      const buf = Buffer.alloc(18);
      ipBuf.copy(buf, 0, 0, 16);
      buf.writeUInt16BE(port, 16);
      return buf;
    });
    peerList6 = Buffer.concat(bufArray6);
  } else {
    // Non-compact: dictionary model
    peerList = ipv4Peers.map((p: Peer) => ({
      'peer id': p.peerId,
      'ip': p.ip,
      'port': p.port
    }));
    peerList6 = ipv6Peers.map((p: Peer) => ({
      'peer id': p.peerId,
      'ip': p.ip,
      'port': p.port
    }));
  }
  // Get seeder/leecher counts
  const { complete, incomplete } = await getSeederLeecherCounts(torrent.id);
  // Minimal tracker response with peer list and counts
  const response = {
    'interval': 1800,
    'complete': complete,
    'incomplete': incomplete,
    'peers': peerList,
    'peers6': peerList6
  };
  reply.header('Content-Type', 'text/plain');
  return reply.send(bencode.encode(response));
}

export async function scrapeHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as any;
  let info_hashes = query['info_hash'];
  if (!info_hashes) {
    reply.header('Content-Type', 'text/plain');
    return reply.send(bencode.encode({ 'failure reason': 'Missing info_hash' }));
  }
  if (!Array.isArray(info_hashes)) info_hashes = [info_hashes];
  const files: any = {};
  for (const info_hash of info_hashes) {
    // Handle info_hash conversion - same logic as announce handler
    let hex: string;
    if (Buffer.isBuffer(info_hash)) {
      hex = info_hash.toString('hex');
    } else if (typeof info_hash === 'string') {
      // If it's already a hex string (40 chars), use it directly
      if (info_hash.length === 40 && /^[0-9a-fA-F]+$/.test(info_hash)) {
        hex = info_hash.toLowerCase();
      } else {
        // Check if it's URL-encoded (contains % characters)
        if (info_hash.includes('%')) {
          try {
            // Try URL decode first
            const decoded = decodeURIComponent(info_hash);
            hex = Buffer.from(decoded, 'binary').toString('hex');
          } catch (_error) {
            console.log('[scrapeHandler] URL decode failed, trying manual decode...');
            // Manual decode for malformed URLs - replace %xx with actual bytes
            let decoded = info_hash;
            const percentMatches = info_hash.match(/%[0-9a-fA-F]{2}/g) || [];
            
            for (const match of percentMatches) {
              const hexByte = match.substring(1); // Remove %
              const byte = parseInt(hexByte, 16);
              decoded = decoded.replace(match, String.fromCharCode(byte));
            }
            
            console.log('[scrapeHandler] Manually decoded:', decoded);
            hex = Buffer.from(decoded, 'binary').toString('hex');
            console.log('[scrapeHandler] Manual decode result:', hex);
          }
        } else {
          // Otherwise treat as binary and convert to hex
          hex = Buffer.from(info_hash, 'binary').toString('hex');
        }
      }
    } else {
      hex = Buffer.from(info_hash, 'binary').toString('hex');
    }
    
    const torrent = await prisma.torrent.findFirst({ where: { infoHash: hex, isApproved: true } });
    if (!torrent) continue;
    const { complete, incomplete } = await getSeederLeecherCounts(torrent.id);
    const downloaded = await getCompletedCount(torrent.id);
    files[hex] = {
      complete,
      downloaded,
      incomplete
    };
  }
  const response = { files };
  reply.header('Content-Type', 'text/plain');
  return reply.send(bencode.encode(response));
} 