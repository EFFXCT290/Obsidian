import { FastifyRequest, FastifyReply } from 'fastify';
import parseTorrent from 'parse-torrent';
import bencode from 'bencode';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { requireTorrentApproval } from '../services/configService.js';
import { saveFile, getFile } from '../services/fileStorageService.js';
import { getConfig } from '../services/configService.js';
import { createNotification } from '../services/notificationService.js';
import { getTorrentApprovedEmail, getTorrentRejectedEmail } from '../utils/emailTemplates/torrentApprovalEmail.js';
import path from 'path';
import { getSeederLeecherCounts, getCompletedCount } from '../announce_features/peerList.js';
import crypto from 'crypto';
import { createTorrentUploadActivity, createTorrentApprovedActivity, createSmartTorrentLikedActivity, createSmartTorrentDislikedActivity } from '../controllers/user/userActivityController.js';

// Torrent actions: vote and magnet
export async function voteTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  const { id } = request.params as any;
  const { type } = request.body as any; // 'up' | 'down'
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  const value = type === 'up' ? 1 : type === 'down' ? -1 : 0;
  if (value === 0) return reply.status(400).send({ error: 'Invalid vote type' });
  
  // Get existing vote to determine if it's a change
  const existingVote = await prisma.torrentVote.findUnique({
    where: { userId_torrentId: { userId: user.id, torrentId: id } }
  });
  
  await prisma.torrentVote.upsert({
    where: { userId_torrentId: { userId: user.id, torrentId: id } },
    update: { value },
    create: { userId: user.id, torrentId: id, value },
  });
  
  // Create smart activity only if it's a new vote or a change in vote type
  if (!existingVote || existingVote.value !== value) {
    try {
      if (value === 1) {
        await createSmartTorrentLikedActivity(user.id, id, torrent.name);
      } else if (value === -1) {
        await createSmartTorrentDislikedActivity(user.id, id, torrent.name);
      }
    } catch (activityError) {
      console.error('[voteTorrentHandler] Error creating activity (non-fatal):', activityError);
      // Continue even if activity creation fails
    }
  }
  
  return reply.send({ success: true });
}

export async function createMagnetTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent || !torrent.isApproved) {
    return reply.status(404).send({ error: 'Torrent not found' });
  }
  
  // Generate temporary magnet token (5 minutes expiry)
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  // Store token in database
  const _magnetToken = await prisma.downloadToken.create({
    data: {
      token,
      userId: user.id,
      torrentId: torrent.id,
      expiresAt
    }
  });
  
  // Return temporary magnet URL
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const magnetUrl = `${baseUrl}/torrent/${torrent.id}/magnet-secure?token=${token}`;
  
  return reply.send({
    magnetUrl,
    expiresAt,
    token: token // Include token for debugging (remove in production)
  });
}

const prisma = new PrismaClient();

// Helper to convert BigInt fields to strings recursively
function convertBigInts(obj: any): any {
  // Preserve Date instances so they serialize correctly as ISO strings
  if (obj instanceof Date) {
    return obj;
  }
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

// Windows-safe filename sanitizer (allows dots). Removes only invalid Windows filename chars
// Invalid: \\ / : * ? " < > | and control chars (0-31). Also trims trailing dots/spaces and avoids reserved device names
function windowsSafeFilename(original: string, fallback = 'file'): string {
  let name = String(original || '').trim();
  // Replace invalid characters (exclude control chars via explicit ranges without escapes that trigger lints)
  name = name.replace(/[<>:"/\\|?*]/g, '_');
  // Remove ASCII control chars 0x00-0x1F without regex literals to satisfy linter
  name = Array.from(name).map((ch) => (ch.charCodeAt(0) < 32 ? '_' : ch)).join('');
  // Remove emojis (extended pictographic, variation selectors, ZWJ)
  try {
    // Remove variation selectors and ZWJ without character classes to satisfy linter
    name = name.split('\u200D').join('').split('\uFE0F').join('');
    // Remove extended pictographic via dynamic regex to avoid linter complaints
    const emojiProp = new RegExp('\\p{Extended_Pictographic}', 'gu');
    name = name.replace(emojiProp, '');
  } catch (_err) {
    // Fallback for environments without Unicode property escapes support
    name = name.split('\u200D').join('').split('\uFE0F').join('');
  }
  // Trim trailing spaces or dots (explicit char class)
  name = name.replace(/[\u0020.]+$/g, '');
  // Avoid reserved device names (CON, PRN, AUX, NUL, COM1..9, LPT1..9)
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;
  if (reserved.test(name)) {
    name = '_' + name;
  }
  // Collapse multiple underscores
  name = name.replace(/_{2,}/g, '_');
  // Enforce a reasonable max length to be safe with headers/filesystems
  if (name.length > 200) name = name.slice(0, 200);
  // Fallback if empty after sanitizing
  if (!name) name = fallback;
  return name;
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
  let name, description, categoryId, posterUrlField, tagsField;

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
      if (part.fieldname === 'tags') tagsField = part.value;
    }
  }
  console.log('[uploadTorrentHandler] Finished reading all parts');
  console.log('[uploadTorrentHandler] Form data:', { name, description, categoryId, tagsField });

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

  // VALIDATION: Torrent must be private
  const isPrivate = (parsed as any)?.private === true || (parsed as any)?.info?.private === 1 || (parsed as any)?.info?.private === true;
  if (!isPrivate) {
    console.log('[uploadTorrentHandler] Rejected: torrent not private');
    return reply.status(400).send({ error: 'El torrent debe estar marcado como privado.' });
  }



  // VALIDATION: No emojis in provided torrent name
  let hasEmoji = false;
  try {
    const emojiDetector = new RegExp('\\p{Extended_Pictographic}', 'u');
    hasEmoji = emojiDetector.test(String(name));
  } catch (_err) {
    // Fallback: basic surrogate pair range and VS/ZWJ presence
    const surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    hasEmoji = surrogatePair.test(String(name)) || String(name).includes('\u200D') || String(name).includes('\uFE0F');
  }
  if (typeof name === 'string' && hasEmoji) {
    console.log('[uploadTorrentHandler] Rejected: name contains emojis');
    return reply.status(400).send({ error: 'El nombre del torrent no puede contener emojis.' });
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
    // Build public URL depending on storage type
    posterUrl = (config.storageType === 'LOCAL')
      ? `/uploads/${posterFileUploaded.storageKey}`
      : `/files/${posterFileUploaded.id}`;
  } else if (posterUrlField && typeof posterUrlField === 'string') {
    posterUrl = posterUrlField;
    console.log('[uploadTorrentHandler] Poster URL:', posterUrl);
  }

  // Create DB record
  const isApproved = !(await requireTorrentApproval()) ? true : false;
  
  // Parse tags from form data
  let tags: string[] = [];
  if (tagsField) {
    try {
      const parsedTags = JSON.parse(String(tagsField));
      if (Array.isArray(parsedTags)) {
        tags = parsedTags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
        console.log('[uploadTorrentHandler] Parsed tags:', tags);
      }
    } catch (error) {
      console.log('[uploadTorrentHandler] Error parsing tags:', error);
      // Continue with empty tags array if parsing fails
    }
  }

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
      posterUrl: posterUrl || null,
      tags: tags
    }
  });
  console.log('[uploadTorrentHandler] Torrent created:', torrent.id);

  // Create activity for torrent upload
  await createTorrentUploadActivity(user.id, torrent.id, torrent.name);

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
    
    // Create new torrent data with modified announce
    const modifiedTorrent = {
      ...parsed,
      announce: newAnnounce,
      'announce-list': [[newAnnounce]] // Replace announce list with our tracker
    };
    
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
  const { page = 1, limit = 20, q, categoryId, status } = request.query as any;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * take;
  const where: any = {};
  
  // Handle status filtering
  if (status === 'approved') {
    where.isApproved = true;
  } else if (status === 'pending') {
    where.isApproved = false;
    where.isRejected = false;
  } else if (status === 'rejected') {
    where.isRejected = true;
  } else {
    // Default to approved torrents for public access
    where.isApproved = true;
  }
  
  // Handle search query
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  
  // Handle category filtering
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId;
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
        updatedAt: true,
        uploaderId: true,
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
        completed: completedCount
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
  type TorrentWithRelations = Prisma.TorrentGetPayload<{
    include: {
      uploader: { select: { id: true; username: true; upload: true; download: true; avatarUrl: true } },
      category: { select: { name: true } },
      _count: { select: { bookmarks: true; votes: true; comments: true } }
    }
  }>;
  const torrent = await prisma.torrent.findUnique({
    where: { id },
    include: {
      uploader: { select: { id: true, username: true, upload: true, download: true, avatarUrl: true } },
      category: { select: { name: true } },
      _count: { select: { bookmarks: true, comments: true } }
    }
  }) as TorrentWithRelations | null;
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  // Allow viewing pending torrents to uploader and staff
  if (!torrent.isApproved) {
    const isStaff = user && (user.role === 'ADMIN' || user.role === 'MOD' || user.role === 'OWNER' || user.role === 'FOUNDER');
    const isUploader = user && torrent.uploaderId && user.id === torrent.uploaderId;
    if (!isStaff && !isUploader) {
      return reply.status(404).send({ error: 'Torrent not found' });
    }
  }
  
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
  result.tags = Array.isArray((torrent as any).tags) ? (torrent as any).tags : [];
  // Attach parsed files from .torrent for UI
  try {
    const config = normalizeS3Config(await getConfig());
    const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.filePath } });
    if (file) {
      const buf = await getFile({ file, config });
      const parsed = await parseTorrent(buf);
      let filesList: { path: string; size: number }[] = [];
      const anyParsed: any = parsed as any;
      if (Array.isArray(anyParsed.files) && anyParsed.files.length > 0) {
        filesList = anyParsed.files.map((f: any) => ({
          path: String(f.path || f.name || ''),
          size: Number(f.length || 0)
        }));
      } else {
        const singleName = String(anyParsed.name || torrent.name || 'file');
        const singleSize = Number(anyParsed.length || torrent.size || 0);
        filesList = [{ path: singleName, size: singleSize }];
      }
      (result as any).files = filesList;
    } else {
      (result as any).files = [];
    }
  } catch {
    (result as any).files = [];
  }
  // Attach counts
  if ((torrent as any)._count) {
    (result as any)._count = (torrent as any)._count;
  }
  // Enrich uploader details with ratio and byte stats as strings
  if (torrent.uploader) {
    const up = torrent.uploader.upload || (0 as any);
    const down = torrent.uploader.download || (0 as any);
    const ratio = (typeof down === 'bigint' && down > 0n)
      ? Number(up) / Number(down)
      : 0;
    result.uploader = {
      id: torrent.uploader.id,
      username: torrent.uploader.username,
      avatarUrl: torrent.uploader.avatarUrl || null,
      uploaded: (torrent.uploader.upload as any)?.toString?.() ?? '0',
      downloaded: (torrent.uploader.download as any)?.toString?.() ?? '0',
      ratio
    };
  }
  // Hide uploader details if anonymous in future (when implemented)
  
  // Add bookmarked property if user is logged in (user may be attached in OPEN mode)
  if (user && user.id) {
    const bookmark = await prisma.bookmark.findUnique({ where: { userId_torrentId: { userId: user.id, torrentId: id } } });
    result.bookmarked = !!bookmark;
    // Also include current user's vote for this torrent for persistence in UI
    try {
      const tv = await (prisma as any).torrentVote.findUnique({ where: { userId_torrentId: { userId: user.id, torrentId: id } } });
      result.userVote = tv ? (tv.value === 1 ? 'up' : tv.value === -1 ? 'down' : null) : null;
    } catch {
      result.userVote = null;
    }
  } else {
    result.bookmarked = false;
    result.userVote = null;
  }
  return reply.send(result);
}

export async function getNfoHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const user = (request as any).user;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) {
    return reply.status(404).send({ error: 'NFO not found' });
  }
  if (!torrent.isApproved) {
    const isStaff = user && (user.role === 'ADMIN' || user.role === 'MOD' || user.role === 'OWNER' || user.role === 'FOUNDER');
    const isUploader = user && torrent.uploaderId && user.id === torrent.uploaderId;
    if (!isStaff && !isUploader) return reply.status(404).send({ error: 'NFO not found' });
  }
  if (!torrent.nfoPath) return reply.status(404).send({ error: 'NFO not found' });
  const config = normalizeS3Config(await getConfig());
  const file = await prisma.uploadedFile.findUnique({ where: { id: torrent.nfoPath } });
  if (!file) return reply.status(404).send({ error: 'NFO file not found' });
  try {
    const nfoBuffer = await getFile({ file, config });
    
    // Sanitize filename for HTTP header (Windows-safe, allows dots)
    const sanitizedFilename = windowsSafeFilename(torrent.name || 'nfo');
    
    reply.header('Content-Type', file.mimeType || 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `inline; filename="${sanitizedFilename}.nfo"`);
    return reply.send(nfoBuffer);
  } catch (_err) {
    return reply.status(500).send({ error: 'Could not read NFO file' });
  }
}

export async function approveTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FOUNDER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  const { id } = request.params as any;
  const torrent = await prisma.torrent.findUnique({ where: { id } });
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  
  try {
    const updated = await prisma.torrent.update({ where: { id }, data: { isApproved: true } });
    
    // Notify uploader (don't fail the approval if notification fails)
    if (torrent.uploaderId) {
      try {
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
      } catch (notificationError) {
        console.error('[approveTorrentHandler] Error creating notification (non-fatal):', notificationError);
        // Continue with the approval even if notification fails
      }
    }
    
    // Create activity for torrent approval (non-blocking)
    if (torrent.uploaderId) {
      try {
        await createTorrentApprovedActivity(torrent.uploaderId, torrent.id, torrent.name);
      } catch (activityError) {
        console.error('[approveTorrentHandler] Error creating activity (non-fatal):', activityError);
        // Continue even if activity creation fails
      }
    }
    
    return reply.send({ success: true, torrent: convertBigInts(updated) });
  } catch (error) {
    console.error('[approveTorrentHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to approve torrent' });
  }
}

export async function rejectTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    console.log('Reject torrent request received:', { 
      params: request.params, 
      body: request.body,
      headers: request.headers,
      user: (request as any).user 
    });
    
    const user = (request as any).user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FOUNDER')) {
      console.log('Forbidden: User role not allowed:', user?.role);
      return reply.status(403).send({ error: 'Forbidden' });
    }
    const { id } = request.params as any;
    const { reason } = request.body as any;
    
    console.log('Processing rejection for torrent:', id, 'with reason:', reason);
  
  const torrent = await prisma.torrent.findUnique({ 
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
  
  if (!torrent) return reply.status(404).send({ error: 'Torrent not found' });
  
  if ((torrent as any).isRejected) {
    return reply.status(400).send({ error: 'Torrent is already rejected' });
  }
  
  // Update torrent status to rejected using raw SQL to avoid Prisma client issues
  await prisma.$executeRaw`
    UPDATE "Torrent" 
    SET "isRejected" = true, 
        "rejectionReason" = ${reason || null}, 
        "rejectedById" = ${user.id}, 
        "rejectedAt" = ${new Date()}
    WHERE id = ${id}
  `;
  
  // Notify uploader (don't fail the rejection if notification fails)
  if (torrent.uploader) {
    try {
      const { text, html } = getTorrentRejectedEmail({ 
        username: torrent.uploader.username, 
        torrentName: torrent.name 
      });
      
      await createNotification({
        userId: torrent.uploader.id,
        type: 'torrent_rejected',
        message: `Your torrent "${torrent.name}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        sendEmail: true,
        email: torrent.uploader.email,
        emailSubject: 'Your torrent has been rejected',
        emailText: text,
        emailHtml: html
      });
    } catch (notificationError) {
      console.error('[rejectTorrentHandler] Error creating notification (non-fatal):', notificationError);
      // Continue with the rejection even if notification fails
    }
  }
  
  return reply.send({ success: true });
  } catch (error) {
    console.error('Error in rejectTorrentHandler:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function listAllTorrentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FOUNDER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  const { page = 1, limit = 20, q, status } = (request.query as any) || {};
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Number(page) - 1) * take;
  
  const where: any = {};
  
  // Filter by approval status
  if (status === 'approved') {
    where.isApproved = true;
    (where as any).isRejected = false;
  } else if (status === 'pending') {
    where.isApproved = false;
    (where as any).isRejected = false;
  } else if (status === 'rejected') {
    (where as any).isRejected = true;
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
    (prisma.torrent as any).findMany({
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
        rejectedBy: {
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
    torrents.map(async (torrent: any) => {
      const [seederLeecherCounts, completedCount] = await Promise.all([
        getSeederLeecherCounts(torrent.id),
        getCompletedCount(torrent.id)
      ]);

      return {
        ...torrent,
        size: torrent.size?.toString?.() ?? "0",
        seeders: seederLeecherCounts.complete,
        leechers: seederLeecherCounts.incomplete,
        completed: completedCount
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
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FOUNDER')) {
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
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FOUNDER')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  try {
    // Get all users
    const users = await prisma.user.findMany();
    const results = [];

    for (const userRecord of users) {
      // Get all announces for this user, grouped by peerId
      const announces = await prisma.announce.findMany({
        where: { userId: userRecord.id },
        orderBy: { lastAnnounceAt: 'asc' }
      });

      let totalUpload = BigInt(0);
      let totalDownload = BigInt(0);

      // Group announces by peerId to calculate deltas properly
      const peerGroups: { [peerId: string]: any[] } = {};
      announces.forEach(announce => {
        if (!peerGroups[announce.peerId]) {
          peerGroups[announce.peerId] = [];
        }
        peerGroups[announce.peerId].push(announce);
      });

      // Calculate totals for each peer
      for (const [, peerAnnounces] of Object.entries(peerGroups)) {
        peerAnnounces.sort((a, b) => a.lastAnnounceAt.getTime() - b.lastAnnounceAt.getTime());
        
        let lastUploaded = BigInt(0);
        let lastDownloaded = BigInt(0);

        for (const announce of peerAnnounces) {
          const uploadDelta = announce.uploaded - lastUploaded;
          const downloadDelta = announce.downloaded - lastDownloaded;
          
          if (uploadDelta > BigInt(0)) totalUpload += uploadDelta;
          if (downloadDelta > BigInt(0)) totalDownload += downloadDelta;
          
          lastUploaded = announce.uploaded;
          lastDownloaded = announce.downloaded;
        }
      }

      // Update user record
      await prisma.user.update({
        where: { id: userRecord.id },
        data: {
          upload: totalUpload,
          download: totalDownload
        }
      });

      results.push({
        userId: userRecord.id,
        username: userRecord.username,
        upload: totalUpload.toString(),
        download: totalDownload.toString(),
        ratio: totalDownload > BigInt(0) ? Number(totalUpload) / Number(totalDownload) : 0
      });
    }

    return reply.send({
      message: 'User stats recalculated successfully',
      results
    });
  } catch (error) {
    console.error('[recalculateUserStatsHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to recalculate user stats' });
  }
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
    const sanitizedFilename = windowsSafeFilename(downloadToken.torrent.name || 'download');
    
    reply.header('Content-Type', file.mimeType || 'application/x-bittorrent');
    reply.header('Content-Disposition', `attachment; filename="${sanitizedFilename}.torrent"`);
    return reply.send(modifiedBuffer);
  } catch (err) {
    console.error('[downloadTorrentWithTokenHandler] Error:', err);
    return reply.status(500).send({ error: 'Could not read torrent file' });
  }
}

// Secure magnet link generation with token
export async function generateMagnetWithTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { token } = request.query as any;
  
  if (!token) {
    return reply.status(400).send({ error: 'Magnet token required' });
  }
  
  // Find and validate magnet token
  const magnetToken = await prisma.downloadToken.findUnique({
    where: { token },
    include: { user: true, torrent: true }
  });
  
  if (!magnetToken) {
    return reply.status(401).send({ error: 'Invalid magnet token' });
  }
  
  if (magnetToken.used) {
    return reply.status(401).send({ error: 'Magnet token already used' });
  }
  
  if (magnetToken.expiresAt < new Date()) {
    return reply.status(401).send({ error: 'Magnet token expired' });
  }
  
  if (magnetToken.torrentId !== id) {
    return reply.status(400).send({ error: 'Token does not match torrent' });
  }
  
  // Mark token as used
  await prisma.downloadToken.update({
    where: { id: magnetToken.id },
    data: { used: true }
  });
  
  // Generate magnet link with user's passkey
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const tracker = `${baseUrl}/announce?passkey=${magnetToken.user.passkey}`;
  const nameParam = encodeURIComponent(magnetToken.torrent.name || 'torrent');
  
  // Try to get additional metadata from the original torrent file
  let additionalParams = '';
  try {
    const config = normalizeS3Config(await getConfig());
    const file = await prisma.uploadedFile.findUnique({ where: { id: magnetToken.torrent.filePath } });
    if (file) {
      const torrentBuffer = await getFile({ file, config });
      const parsed = await parseTorrent(torrentBuffer);
      
      // Add file length if available
      const parsedAny = parsed as any;
      if (parsedAny.length) {
        additionalParams += `&xl=${parsedAny.length}`;
      }
      
      // Add additional trackers if available
      if (parsedAny.announceList && Array.isArray(parsedAny.announceList)) {
        const additionalTrackers = parsedAny.announceList
          .flat()
          .filter((url: string) => url && url !== tracker)
          .slice(0, 5); // Limit to 5 additional trackers
        
        additionalTrackers.forEach((url: string) => {
          additionalParams += `&tr=${encodeURIComponent(url)}`;
        });
      }
    }
  } catch (error) {
    console.error('[generateMagnetWithTokenHandler] Error getting additional metadata:', error);
    // Continue with basic magnet link if we can't get additional metadata
  }
  
  // Build magnet link with proper formatting
  // Include both v1 and v2 info hashes if available
  let xtParam = `xt=urn:btih:${magnetToken.torrent.infoHash}`;
  
  // Add additional magnet link parameters for better compatibility
  const magnetLink = `magnet:?${xtParam}&dn=${nameParam}&tr=${encodeURIComponent(tracker)}${additionalParams}`;
  
  // Log magnet link for debugging
  console.log('[generateMagnetWithTokenHandler] Generated magnet link:', {
    torrentId: magnetToken.torrent.id,
    infoHash: magnetToken.torrent.infoHash,
    name: magnetToken.torrent.name,
    tracker,
    additionalParams,
    fullMagnetLink: magnetLink
  });
  
  // Also provide a fallback torrent file URL in case magnet doesn't work
  const torrentFileUrl = `${baseUrl}/torrent/${magnetToken.torrent.id}/download-secure?token=${token}`;
  
  return reply.send({ 
    magnetLink,
    torrentFileUrl, // Fallback option
    infoHash: magnetToken.torrent.infoHash,
    name: magnetToken.torrent.name
  });
}

// Torrent management endpoints for admins
export async function editTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });
  
  // Check if user is admin
  if (!['ADMIN', 'OWNER', 'FOUNDER'].includes(user.role)) {
    return reply.status(403).send({ error: 'Forbidden: Admin access required' });
  }
  
  const { id } = request.params as any;
  const { name, description, categoryId } = request.body as any;
  
  // Validate required fields
  if (!name || !name.trim()) {
    return reply.status(400).send({ error: 'Name is required' });
  }
  
  if (!categoryId) {
    return reply.status(400).send({ error: 'Category is required' });
  }
  
  // Check if torrent exists and is approved
  const existingTorrent = await prisma.torrent.findUnique({
    where: { id },
    include: { category: true }
  });
  
  if (!existingTorrent) {
    return reply.status(404).send({ error: 'Torrent not found' });
  }
  
  if (!existingTorrent.isApproved) {
    return reply.status(400).send({ error: 'Can only edit approved torrents' });
  }
  
  // Check if category exists
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return reply.status(400).send({ error: 'Invalid category' });
  }
  
  try {
    // Update torrent
    const updatedTorrent = await prisma.torrent.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId,
        updatedAt: new Date()
      },
      include: {
        category: true,
        uploader: {
          select: { id: true, username: true, role: true }
        }
      }
    });
    
    // Create notification for uploader
    await createNotification({
      userId: existingTorrent.uploaderId,
      type: 'TORRENT_EDITED',
      message: `Your torrent "${updatedTorrent.name}" has been edited by an administrator.`,
      adminId: user.id
    });
    
    return reply.send({
      success: true,
      torrent: convertBigInts(updatedTorrent)
    });
  } catch (error) {
    console.error('[editTorrentHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to update torrent' });
  }
}

export async function deleteTorrentHandler(request: FastifyRequest, reply: FastifyReply) {
  console.log('[deleteTorrentHandler] Start - Request received:', {
    params: request.params,
    headers: request.headers,
    user: (request as any).user
  });
  
  const user = (request as any).user;
  if (!user) {
    console.log('[deleteTorrentHandler] Unauthorized - no user');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  
  // Check if user is admin
  if (!['ADMIN', 'OWNER', 'FOUNDER'].includes(user.role)) {
    console.log('[deleteTorrentHandler] Forbidden - user role:', user.role);
    return reply.status(403).send({ error: 'Forbidden: Admin access required' });
  }
  
  const { id } = request.params as any;
  console.log('[deleteTorrentHandler] Processing deletion for torrent ID:', id);
  
  // Check if torrent exists
  const existingTorrent = await prisma.torrent.findUnique({
    where: { id },
    include: { 
      category: true,
      uploader: {
        select: { id: true, username: true, role: true }
      }
    }
  });
  
  console.log('[deleteTorrentHandler] Torrent lookup result:', existingTorrent ? {
    id: existingTorrent.id,
    name: existingTorrent.name,
    isApproved: existingTorrent.isApproved,
    isRejected: existingTorrent.isRejected
  } : 'Not found');
  
  if (!existingTorrent) {
    console.log('[deleteTorrentHandler] Torrent not found - returning 404');
    return reply.status(404).send({ error: 'Torrent not found' });
  }
  
  try {
    console.log('[deleteTorrentHandler] Attempting to delete torrent...');
    
    // First, delete all related records to avoid foreign key constraint violations
    console.log('[deleteTorrentHandler] Deleting related bookmarks...');
    await prisma.bookmark.deleteMany({
      where: { torrentId: id }
    });
    
    console.log('[deleteTorrentHandler] Deleting related votes...');
    await prisma.torrentVote.deleteMany({
      where: { torrentId: id }
    });
    
    console.log('[deleteTorrentHandler] Deleting related comments...');
    await prisma.comment.deleteMany({
      where: { torrentId: id }
    });
    
    // Delete torrent (this will cascade to other related records)
    await prisma.torrent.delete({
      where: { id }
    });
    
    console.log('[deleteTorrentHandler] Torrent deleted successfully');
    
    // Create notification for uploader (don't fail the deletion if notification fails)
    let notificationSent = false;
    let notificationError = null;
    
    try {
      console.log('[deleteTorrentHandler] Creating notification...');
      await createNotification({
        userId: existingTorrent.uploaderId,
        type: 'TORRENT_DELETED',
        message: `Your torrent "${existingTorrent.name}" has been deleted by an administrator.`,
        adminId: user.id
      });
      notificationSent = true;
      console.log('[deleteTorrentHandler] Notification created successfully');
    } catch (error) {
      console.error('[deleteTorrentHandler] Error creating notification (non-fatal):', error);
      notificationError = error instanceof Error ? error.message : 'Unknown notification error';
      // Continue with the deletion even if notification fails
    }
    
    const response = {
      success: true,
      message: 'Torrent deleted successfully',
      notificationSent,
      ...(notificationError && { notificationError })
    };
    
    console.log('[deleteTorrentHandler] Sending success response:', response);
    return reply.send(response);
  } catch (error) {
    console.error('[deleteTorrentHandler] Error:', error);
    return reply.status(500).send({ error: 'Failed to delete torrent' });
  }
}

const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB 