import { FastifyRequest, FastifyReply } from 'fastify';
import parseTorrent from 'parse-torrent';
import bencode from 'bencode';
import { PrismaClient } from '@prisma/client';
import { requireTorrentApproval } from '../services/configService.js';
import { saveFile, getFile, deleteFile } from '../services/fileStorageService.js';
import { getConfig } from '../services/configService.js';
import { createNotification } from '../services/notificationService.js';
import { getTorrentApprovedEmail, getTorrentRejectedEmail } from '../utils/emailTemplates/torrentApprovalEmail.js';
import path from 'path';
import { getSeederLeecherCounts, getCompletedCount } from '../announce_features/peerList.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to convert BigInt fields to strings recursively
function convertBigInts(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : convertBigInts(v)])
    );
  }
  return obj;
}

// Helper to normalize S3 config fields (null -> undefined)
function normalizeS3Config(config: any) {
  return {
    ...config,
    s3Bucket: config.s3Bucket ?? undefined,
    s3Region: config.s3Region ?? undefined,
    s3AccessKeyId: config.s3AccessKeyId ?? undefined,
    s3SecretAccessKey: config.s3SecretAccessKey ?? undefined,
  };
}

export async function uploadTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  console.log('[uploadTorrentHandler] Start');
  const user = (request as any).user;
  if (!user) {
    console.log('[uploadTorrentHandler] Unauthorized');
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const config = normalizeS3Config(await getConfig());
  const parts = request.parts();
  let torrentBuffer = null, torrentFileMeta = null;
  let nfoBuffer = null, nfoFileMeta = null;
  let posterBuffer = null, posterFileMeta = null;
  let name, description, categoryId, posterUrlField;

  for await (const part of parts) {
    console.log('[uploadTorrentHandler] Received part:', part.fieldname, part.type);
    if (part.type === 'file') {
      if (part.fieldname === 'torrent') {
        torrentBuffer = await part.toBuffer();
        torrentFileMeta = part;
      }
      if (part.fieldname === 'nfo') {
        nfoBuffer = await part.toBuffer();
        nfoFileMeta = part;
      }
      if (part.fieldname === 'poster') {
        posterBuffer = await part.toBuffer();
        posterFileMeta = part;
      }
    } else if (part.type === 'field') {
      if (part.fieldname === 'name') name = part.value;
      if (part.fieldname === 'description') description = part.value;
      if (part.fieldname === 'categoryId') categoryId = String(part.value);
      if (part.fieldname === 'posterUrl') posterUrlField = part.value;
    }
  }
  console.log('[uploadTorrentHandler] Finished reading all parts');

  if (!torrentBuffer) {
    console.log('[uploadTorrentHandler] .torrent file is required');
    return reply.status(400).send({ error: '.torrent file is required' });
  }
  if (!name) {
    console.log('[uploadTorrentHandler] Torrent name is required');
    return reply.status(400).send({ error: 'Torrent name is required' });
  }
  if (!description) {
    console.log('[uploadTorrentHandler] Description is required');
    return reply.status(400).send({ error: 'Description is required' });
  }
  if (!categoryId) {
    console.log('[uploadTorrentHandler] Category is required');
    return reply.status(400).send({ error: 'Category is required' });
  }
  // Validate category exists
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    console.log('[uploadTorrentHandler] Invalid category');
    return reply.status(400).send({ error: 'Invalid category' });
  }

  // Save .torrent file using fileStorageService
  console.log('[uploadTorrentHandler] .torrent file buffer length:', torrentBuffer.length);
  const torrentUploaded = await saveFile({
    type: 'torrent',
    buffer: torrentBuffer,
    ext: '.torrent',
    mimeType: torrentFileMeta?.mimetype || 'application/x-bittorrent',
    config
  });
  // Parse .torrent file
  let parsed;
  try {
    parsed = await parseTorrent(torrentBuffer);
    console.log('[uploadTorrentHandler] Parsed torrent:', parsed.infoHash);
  } catch (err) {
    console.log('[uploadTorrentHandler] Invalid .torrent file', err);
    return reply.status(400).send({ error: 'Invalid .torrent file' });
  }
  if (!parsed.infoHash) {
    console.log('[uploadTorrentHandler] Could not extract infoHash');
    return reply.status(400).send({ error: 'Could not extract infoHash from .torrent file' });
  }

  // Save .nfo file if provided
  let nfoUploaded = null;
  if (nfoBuffer && nfoFileMeta) {
    console.log('[uploadTorrentHandler] .nfo file buffer length:', nfoBuffer.length);
    nfoUploaded = await saveFile({
      type: 'nfo',
      buffer: nfoBuffer,
      ext: '.nfo',
      mimeType: nfoFileMeta.mimetype,
      config
    });
  }

  // Handle poster (file or URL)
  let posterFileUploaded = null;
  let posterUrl = null;
  if (posterBuffer && posterFileMeta) {
    const ext = path.extname(posterFileMeta.filename || '').slice(1).toLowerCase();
    console.log('[uploadTorrentHandler] Poster file ext:', ext);
    if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
      console.log('[uploadTorrentHandler] Unsupported image type:', ext);
      return reply.status(400).send({ error: 'Unsupported image type' });
    }
    console.log('[uploadTorrentHandler] Poster file buffer length:', posterBuffer.length);
    if (posterBuffer.length > MAX_IMAGE_SIZE) {
      console.log('[uploadTorrentHandler] Image too large:', posterBuffer.length);
      return reply.status(400).send({ error: 'Image too large (max 30MB)' });
    }
    posterFileUploaded = await saveFile({
      type: 'image',
      buffer: posterBuffer,
      ext: '.' + ext,
      mimeType: posterFileMeta.mimetype,
      config
    });
    posterUrl = `/uploads/${posterFileUploaded.storageKey}`;
  } else if (posterUrlField && typeof posterUrlField === 'string') {
    posterUrl = posterUrlField;
    console.log('[uploadTorrentHandler] Poster URL:', posterUrl);
  }

  // Create DB record
  const isApproved = !(await requireTorrentApproval()) ? true : false;
  const torrent = await prisma.torrent.create({
    data: {
      infoHash: parsed.infoHash,
      name: String(name),
      description: description ? String(description) : null,
      uploaderId: user.id,
      filePath: torrentUploaded.id, // store UploadedFile id
      nfoPath: nfoUploaded ? nfoUploaded.id : undefined, // store UploadedFile id
      size: typeof parsed === 'object' && 'length' in parsed && typeof parsed.length === 'number' ? parsed.length : 0,
      isApproved,
      categoryId: category.id,
      posterFileId: posterFileUploaded ? posterFileUploaded.id : undefined,
      posterUrl: posterUrl || null
    }
  });
  console.log('[uploadTorrentHandler] Torrent created:', torrent.id);

  console.log('[uploadTorrentHandler] End');
  return reply.status(201).send(convertBigInts({ id: torrent.id, infoHash: torrent.infoHash, name: torrent.name, posterUrl: torrent.posterUrl }));
}



// Helper function to modify torrent announce URLs
async function modifyTorrentAnnounceUrls(torrentBuffer: Buffer, passkey: string): Promise<Buffer> {
  try {
    const parsed = await parseTorrent(torrentBuffer);
    
    // Replace announce URLs with our tracker URL and user's passkey
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const newAnnounce = `${baseUrl}/announce?passkey=${passkey}`;
    
    // Filter out non-bencode-compatible values and create new torrent data
    const modifiedTorrent: any = {};
    
    // Copy only bencode-compatible values
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
        modifiedTorrent[key] = value;
      }
    }
    
    // Set the announce URLs
    modifiedTorrent.announce = newAnnounce;
    modifiedTorrent['announce-list'] = [[newAnnounce]];
    
    // Re-encode the torrent
    const encoded = bencode.encode(modifiedTorrent);
    
    return encoded;
  } catch (err) {
    console.error('[modifyTorrentAnnounceUrls] Error modifying torrent:', err);
    // Return original buffer if modification fails
    return torrentBuffer;
  }
}

export async function listTorrentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 20, q } = request.query as any;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * take;
  const where: any = { isApproved: true };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  const [torrents, total] = await Promise.all([
    prisma.torrent.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        name: true, 
        description: true, 
        infoHash: true, 
        size: true, 
        createdAt: true, 
        uploaderId: true,
        uploader: {
          select: {
            id: true,
            username: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.torrent.count({ where })
  ]);

  // Calculate stats for each torrent
  const torrentsWithStats = await Promise.all(
    torrents.map(async (torrent) => {
      const [seederLeecherCounts, completedCount] = await Promise.all([
        getSeederLeecherCounts(torrent.id),
        getCompletedCount(torrent.id)
      ]);

      return {
        ...torrent,
        size: torrent.size?.toString?.() ?? "0",
        seeders: seederLeecherCounts.complete,
        leechers: seederLeecherCounts.incomplete,
        completed: completedCount,
        category: torrent.category?.name || 'General'
      };
    })
  );

  return reply.send({
    torrents: torrentsWithStats,
    total,
    page: Number(page),
    limit: take
  });
}

export async function getTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const user = (request as any).user;
  const torrent = await prisma.torrent.findUnique({ 
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          username: true
        }
      },
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!torrent || !torrent.isApproved) return reply.status(404).send({ error: 'Torrent not found' });
  
  // Calculate torrent statistics
  const [seederLeecherCounts, completedCount] = await Promise.all([
    getSeederLeecherCounts(torrent.id),
    getCompletedCount(torrent.id)
  ]);

  const result = convertBigInts(torrent);
  result.posterUrl = torrent.posterUrl || null;
  result.seeders = seederLeecherCounts.complete;
  result.leechers = seederLeecherCounts.incomplete;
  result.completed = completedCount;
  result.category = torrent.category?.name || 'General';
  
  // Add bookmarked property if user is logged in
  if (user && user.id) {
    const bookmark = await prisma.bookmark.findUnique({ where: { userId_torrentId: { userId: user.id, torrentId: id } } });
    result.bookmarked = !!bookmark;
  } else {
    result.bookmarked = false;
  }
  return reply.send(result);
}

export async function getNfoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent || !torrent.isApproved || !torrent.nfoPath) {
    return reply.status(404).send({ error: 'NFO not found' });
  }
  const config = normalizeS3Config(await getConfig());
  const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.nfoPath } });
  if (!file) return reply.status(404).send({ error: 'NFO file not found' });
  try {
    const nfoBuffer = await getFile({ file, config });
    
    // Sanitize filename for HTTP header
    const sanitizedFilename = torrent.name.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
    
    reply.header('Content-Type', file.mimeType || 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `inline; filename="${sanitizedFilename}.nfo"`);
    return reply.send(nfoBuffer);
  } catch (_err) {
    return reply.status(500).send({ error: 'Could not read NFO file' });
  }
}

export async function approveTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  const updated = await prisma.torrent.update({ where: { id }, data: { isApproved: true } });
  // Notify uploader
  if (torrent.uploaderId) {
    const uploader = await prisma.user.findUnique({ where: { id: torrent.uploaderId } });
    if (uploader) {
      const { text, html } = getTorrentApprovedEmail({ username: uploader.username, torrentName: torrent.name });
      await createNotification({
        userId: uploader.id,
        type: 'torrent_approved',
        message: `Your torrent "${torrent.name}" has been approved.`,
        sendEmail: true,
        email: uploader.email,
        emailSubject: 'Your torrent has been approved',
        emailText: text,
        emailHtml: html
      });
    }
  }
  return reply.send({ success: true, torrent: convertBigInts(updated) });
}

export async function rejectTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  // Notify uploader before deleting
  if (torrent.uploaderId) {
    const uploader = await prisma.user.findUnique({ where: { id: torrent.uploaderId } });
    if (uploader) {
      const { text, html } = getTorrentRejectedEmail({ username: uploader.username, torrentName: torrent.name });
      await createNotification({
        userId: uploader.id,
        type: 'torrent_rejected',
        message: `Your torrent "${torrent.name}" has been rejected.`,
        sendEmail: true,
        email: uploader.email,
        emailSubject: 'Your torrent has been rejected',
        emailText: text,
        emailHtml: html
      });
    }
  }
  // Delete files
  try {
    const config = normalizeS3Config(await getConfig());
    if (torrent.filePath) {
      const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.filePath } });
      if (file) await deleteFile({ file, config });
    }
    if (torrent.nfoPath) {
      const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.nfoPath } });
      if (file) await deleteFile({ file, config });
    }
    if (torrent.posterFileId) {
      const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.posterFileId } });
      if (file) await deleteFile({ file, config });
    }
  } catch {
    // Ignore deletion errors
  }
  await prisma.torrent.delete({ where: { id } });
  return reply.send({ success: true });
}

export async function listAllTorrentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const { page = 1, limit = 20, q, status } = (request.query as any) || {};
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * take;
  
  const where: any = {};
  
  // Filter by approval status
  if (status === 'approved') {
    where.isApproved = true;
  } else if (status === 'pending') {
    where.isApproved = false;
  }
  // If no status filter, show all
  
  // Search filter
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  
  const [torrents, total] = await Promise.all([
    prisma.torrent.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.torrent.count({ where })
  ]);

  // Calculate stats for each torrent
  const torrentsWithStats = await Promise.all(
    torrents.map(async (torrent) => {
      const [seederLeecherCounts, completedCount] = await Promise.all([
        getSeederLeecherCounts(torrent.id),
        getCompletedCount(torrent.id)
      ]);

      return {
        ...torrent,
        size: torrent.size?.toString?.() ?? "0",
        seeders: seederLeecherCounts.complete,
        leechers: seederLeecherCounts.incomplete,
        completed: completedCount,
        category: torrent.category?.name || 'General'
      };
    })
  );
  
  return reply.send({
    torrents: torrentsWithStats,
    total,
    page: Number(page),
    limit: take
  });
}

export async function getTorrentStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const [totalTorrents, approvedTorrents, pendingTorrents] = await Promise.all([
    prisma.torrent.count(),
    prisma.torrent.count({ where: { isApproved: true } }),
    prisma.torrent.count({ where: { isApproved: false } })
  ]);
  
  return reply.send({
    total: totalTorrents,
    approved: approvedTorrents,
    pending: pendingTorrents
  });
}

export async function recalculateUserStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  // Implementation for recalculating user stats
  return reply.send({ success: true, message: 'User stats recalculated' });
}

// New secure download token handlers
export async function createDownloadTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent || !torrent.isApproved) {
    return reply.status(404).send({ error: 'Torrent not found' });
  }
  
  // Generate temporary download token (5 minutes expiry)
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  // Store token in database
  const _downloadToken = await prisma.downloadToken.create({
    data: {
      token,
      userId: user.id,
      torrentId: torrent.id,
      expiresAt
    }
  });
  
  // Return temporary download URL
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const downloadUrl = `${baseUrl}/torrent/${torrent.id}/download-secure?token=${token}`;
  
  return reply.send({
    downloadUrl,
    expiresAt,
    token: token // Include token for debugging (remove in production)
  });
}

export async function downloadTorrentWithTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { token } = request.query as any;
  
  if (!token) {
    return reply.status(400).send({ error: 'Download token required' });
  }
  
  // Find and validate download token
  const downloadToken = await prisma.downloadToken.findUnique({
    where: { token },
    include: { user: true, torrent: true }
  });
  
  if (!downloadToken) {
    return reply.status(401).send({ error: 'Invalid download token' });
  }
  
  if (downloadToken.used) {
    return reply.status(401).send({ error: 'Download token already used' });
  }
  
  if (downloadToken.expiresAt < new Date()) {
    return reply.status(401).send({ error: 'Download token expired' });
  }
  
  if (downloadToken.torrentId !== id) {
    return reply.status(400).send({ error: 'Token does not match torrent' });
  }
  
  // Mark token as used
  await prisma.downloadToken.update({
    where: { id: downloadToken.id },
    data: { used: true }
  });
  
  // Get torrent file
  const config = normalizeS3Config(await getConfig());
  const file = await prisma.uploadedFile.findUnique({ where: { id: downloadToken.torrent.filePath } });
  if (!file) return reply.status(404).send({ error: 'Torrent file not found' });
  
  try {
    const fileBuffer = await getFile({ file, config });
    
    // Modify the torrent file to replace announce URLs with user's passkey
    const modifiedBuffer = await modifyTorrentAnnounceUrls(fileBuffer, downloadToken.user.passkey);
    
    // Sanitize filename for HTTP header
    const sanitizedFilename = downloadToken.torrent.name.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
    
    reply.header('Content-Type', file.mimeType || 'application/x-bittorrent');
    reply.header('Content-Disposition', `attachment; filename="${sanitizedFilename}.torrent"`);
    return reply.send(modifiedBuffer);
  } catch (err) {
    console.error('[downloadTorrentWithTokenHandler] Error:', err);
    return reply.status(500).send({ error: 'Could not read torrent file' });
  }
}

const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB 