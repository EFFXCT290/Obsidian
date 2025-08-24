import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../services/notificationService.js';
import crypto from 'crypto';
import { sendEmail, getFrontendBaseUrl } from '../../utils/sendEmail.js';
import { getVerificationEmail } from '../../utils/emailTemplates/verificationEmail.js';
import { getResetPasswordEmail } from '../../utils/emailTemplates/resetPasswordEmail.js';
import { randomUUID } from 'crypto';
import { getPeerBanEmail } from '../../utils/emailTemplates/peerBanEmail.js';
import { getUserBanEmail, getUserUnbanEmail } from '../../utils/emailTemplates/userBanEmail.js';
import { getPromotionEmail, getDemotionEmail } from '../../utils/emailTemplates/promotionEmail.js';
import { getRssBannedEmail, getRssUnbannedEmail } from '../../utils/emailTemplates/rssBanEmail.js';
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

function isAdminOrOwner(user: any) {
  return user && (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FOUNDER');
}

function isOwnerOrFounder(user: any) {
  return user && (user.role === 'OWNER' || user.role === 'FOUNDER');
}

function isFounder(user: any) {
  return user && user.role === 'FOUNDER';
}

export async function banUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.user.update({ where: { id }, data: { status: 'BANNED' } });
  const bannedUser = await prisma.user.findUnique({ where: { id } });
  if (bannedUser) {
    const { text, html } = getUserBanEmail({ username: bannedUser.username });
    await createNotification({
      userId: bannedUser.id,
      type: 'ban',
      message: 'Your account has been banned by an administrator.',
      sendEmail: true,
      email: bannedUser.email,
      emailSubject: 'Your account has been banned',
      emailText: text,
      emailHtml: html
    });
  }
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function unbanUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const updated = await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  const unbannedUser = await prisma.user.findUnique({ where: { id } });
  if (unbannedUser) {
    const { text, html } = getUserUnbanEmail({ username: unbannedUser.username });
    await createNotification({
      userId: unbannedUser.id,
      type: 'unban',
      message: 'Your account has been unbanned by an administrator.',
      sendEmail: true,
      email: unbannedUser.email,
      emailSubject: 'Your account has been unbanned',
      emailText: text,
      emailHtml: html
    });
  }
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function promoteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { role } = request.body as any;
  
  // Validate role
  if (!role || !['MOD', 'ADMIN', 'OWNER'].includes(role)) {
    return reply.status(400).send({ error: 'Invalid role. Can only promote to MOD, ADMIN, or OWNER' });
  }
  
  // Get target user
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return reply.status(404).send({ error: 'User not found' });
  
  // Check if target is already OWNER or FOUNDER
  if (targetUser.role === 'OWNER' || targetUser.role === 'FOUNDER') {
    return reply.status(400).send({ error: 'Cannot promote OWNER or FOUNDER' });
  }
  
  // Only OWNER or FOUNDER can promote to ADMIN
  if (role === 'ADMIN' && !isOwnerOrFounder(user)) {
    return reply.status(403).send({ error: 'Only owners or founders can promote users to ADMIN' });
  }
  
  // Only FOUNDER can promote to OWNER
  if (role === 'OWNER' && !isFounder(user)) {
    return reply.status(403).send({ error: 'Only founders can promote users to OWNER' });
  }
  
  // NO ONE can be promoted to FOUNDER - only role transfer allowed
  if (role === 'FOUNDER') {
    return reply.status(400).send({ error: 'Cannot promote to FOUNDER. Use role transfer instead.' });
  }
  
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  // Notify promoted user
  const promotedUser = await prisma.user.findUnique({ where: { id } });
  if (promotedUser) {
    const { text, html } = getPromotionEmail({ username: promotedUser.username, newRole: role });
    await createNotification({
      userId: promotedUser.id,
      type: 'promotion',
      message: `You have been promoted to ${role}.`,
      sendEmail: true,
      email: promotedUser.email,
      emailSubject: `You have been promoted to ${role}`,
      emailText: text,
      emailHtml: html
    });
  }
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function demoteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { role } = request.body as any;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return reply.status(404).send({ error: 'User not found' });
  
  // Validate target role
  if (!role || !['USER', 'MOD', 'ADMIN'].includes(role)) {
    return reply.status(400).send({ error: 'Invalid target role. Can only demote to USER, MOD, or ADMIN' });
  }
  
  // Cannot demote FOUNDER
  if (target.role === 'FOUNDER') {
    return reply.status(400).send({ error: 'Cannot demote FOUNDER' });
  }
  
  // Only FOUNDER can demote OWNER
  if (target.role === 'OWNER' && !isFounder(user)) {
    return reply.status(403).send({ error: 'Only founders can demote OWNER users' });
  }
  
  // Only OWNER or FOUNDER can demote ADMIN
  if (target.role === 'ADMIN' && !isOwnerOrFounder(user)) {
    return reply.status(403).send({ error: 'Only owners or founders can demote ADMIN users' });
  }
  
  // Validate demotion target role
  if (target.role === 'OWNER' && role !== 'ADMIN') {
    return reply.status(400).send({ error: 'Owners can only be demoted to ADMIN' });
  }
  
  if (target.role === 'ADMIN' && role !== 'MOD') {
    return reply.status(400).send({ error: 'Admins can only be demoted to MOD' });
  }
  
  if (target.role === 'MOD' && role !== 'USER') {
    return reply.status(400).send({ error: 'Moderators can only be demoted to USER' });
  }
  
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  // Notify demoted user
  if (target) {
    const { text, html } = getDemotionEmail({ username: target.username, oldRole: target.role });
    await createNotification({
      userId: target.id,
      type: 'demotion',
      message: `You have been demoted from ${target.role}.`,
      sendEmail: true,
      email: target.email,
      emailSubject: `You have been demoted from ${target.role}`,
      emailText: text,
      emailHtml: html
    });
  }
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function transferFounderRoleHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isFounder(user)) return reply.status(403).send({ error: 'Only founders can transfer founder role' });
  
  const { targetUserId } = request.body as any;
  if (!targetUserId) return reply.status(400).send({ error: 'Target user ID is required' });
  
  // Get target user
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) return reply.status(404).send({ error: 'Target user not found' });
  
  // Cannot transfer to yourself
  if (targetUserId === user.id) {
    return reply.status(400).send({ error: 'Cannot transfer founder role to yourself' });
  }
  
  // Check if there are other founders (should only be one)
  const founderCount = await prisma.user.count({ where: { role: 'FOUNDER' } });
  if (founderCount > 1) {
    return reply.status(400).send({ error: 'Multiple founders detected. Please resolve this before transferring.' });
  }
  
  // Transfer founder role
  const [newFounder, oldFounder] = await Promise.all([
    prisma.user.update({ where: { id: targetUserId }, data: { role: 'FOUNDER' } }),
    prisma.user.update({ where: { id: user.id }, data: { role: 'OWNER' } })
  ]);
  
  // Notify both users
  await Promise.all([
    createNotification({
      userId: newFounder.id,
      type: 'promotion',
      message: 'You have been promoted to FOUNDER.',
      sendEmail: true,
      email: newFounder.email,
      emailSubject: 'You are now the Founder',
      emailText: `Congratulations! You are now the Founder of the system.`,
      emailHtml: `<div>Congratulations! You are now the Founder of the system.</div>`
    }),
    createNotification({
      userId: oldFounder.id,
      type: 'demotion',
      message: 'You have transferred your founder role to another user.',
      sendEmail: true,
      email: oldFounder.email,
      emailSubject: 'Founder Role Transferred',
      emailText: `You have transferred your founder role to ${newFounder.username}.`,
      emailHtml: `<div>You have transferred your founder role to ${newFounder.username}.</div>`
    })
  ]);
  
  return reply.send({ 
    success: true, 
    message: 'Founder role transferred successfully',
    newFounder: convertBigInts(newFounder),
    oldFounder: convertBigInts(oldFounder)
  });
}

export async function listPeerBans(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { active, type, value } = (request.query as any) || {};
  const where: any = {};
  if (active === 'true') where['OR'] = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  if (active === 'false') where['expiresAt'] = { lte: new Date() };
  if (type && ['userId', 'passkey', 'peerId', 'ip'].includes(type as string) && value) {
    where[type as string] = value;
  }
  const bans = await prisma.peerBan.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { bannedBy: { select: { id: true, username: true, role: true } } }
  });
  return reply.send(bans);
}

export async function getPeerBan(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const ban = await prisma.peerBan.findUnique({
    where: { id },
    include: { bannedBy: { select: { id: true, username: true, role: true } } }
  });
  if (!ban) return reply.status(404).send({ error: 'Ban not found' });
  return reply.send(ban);
}

export async function addPeerBan(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { userId, passkey, peerId, ip, reason, expiresAt } = (request.body as any) || {};
  if (!reason || (!userId && !passkey && !peerId && !ip)) {
    return reply.status(400).send({ error: 'Must provide reason and at least one of userId, passkey, peerId, or ip' });
  }
  const ban = await prisma.peerBan.create({
    data: {
      userId,
      passkey,
      peerId,
      ip,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      bannedById: user.id
    }
  });
  // Notify affected user (if userId is present)
  if (userId) {
    const bannedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (bannedUser) {
      const { text, html } = getPeerBanEmail({
        username: bannedUser.username,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });
      await createNotification({
        userId: bannedUser.id,
        type: 'ban',
        message: `You have been banned: ${reason}${expiresAt ? ", expires at " + new Date(expiresAt).toLocaleString() : ''}`,
        adminId: user.id,
        relatedBanId: ban.id,
        sendEmail: true,
        email: bannedUser.email,
        emailSubject: 'You have been banned from the tracker',
        emailText: text,
        emailHtml: html
      });
      // Notify all admins/owners/founders
      const admins = await prisma.user.findMany({ where: { OR: [{ role: 'ADMIN' }, { role: 'OWNER' }, { role: 'FOUNDER' }] } });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'ban',
          message: `User ${bannedUser.username || bannedUser.email || bannedUser.id} was banned by ${user.username}: ${reason}${expiresAt ? ", expires at " + new Date(expiresAt).toLocaleString() : ''}`,
          adminId: user.id,
          relatedBanId: ban.id,
          sendEmail: false
        });
      }
    }
  }
  return reply.status(201).send(ban);
}

export async function removePeerBan(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const ban = await prisma.peerBan.findUnique({ where: { id } });
  if (!ban) return reply.status(404).send({ error: 'Ban not found' });
  await prisma.peerBan.delete({ where: { id } });
  // Notify affected user (if userId is present)
  if (ban.userId) {
    const bannedUser = await prisma.user.findUnique({ where: { id: ban.userId } });
    if (bannedUser) {
      // Unban email (simple text for now)
      await createNotification({
        userId: bannedUser.id,
        type: 'unban',
        message: `You have been unbanned by admin ${user.username}.`,
        adminId: user.id,
        relatedBanId: ban.id,
        sendEmail: true,
        email: bannedUser.email,
        emailSubject: 'You have been unbanned',
        emailText: `Dear ${bannedUser.username},\n\nYou have been unbanned by admin ${user.username}. You may now use the tracker again.`,
        emailHtml: `<div style='font-family:sans-serif;color:#222;'><h2>You have been unbanned</h2><p>Dear <b>${bannedUser.username}</b>,</p><p>You have been unbanned by admin <b>${user.username}</b>. You may now use the tracker again.</p></div>`
      });
      // Notify all admins/owners/founders
      const admins = await prisma.user.findMany({ where: { OR: [{ role: 'ADMIN' }, { role: 'OWNER' }, { role: 'FOUNDER' }] } });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'unban',
          message: `User ${bannedUser.username || bannedUser.email || bannedUser.id} was unbanned by ${user.username}.`,
          adminId: user.id,
          relatedBanId: ban.id,
          sendEmail: false
        });
      }
    }
  }
  return reply.send({ success: true });
}

export async function adminSetRssEnabledHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = (request as any).user;
  if (!isAdminOrOwner(admin)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { enabled } = request.body as any;
  if (typeof enabled !== 'boolean') return reply.status(400).send({ error: 'enabled must be boolean' });
  const updated = await prisma.user.update({ where: { id }, data: { rssEnabled: enabled } });
  // Notify user
  const user = await prisma.user.findUnique({ where: { id } });
  if (user) {
    if (!enabled) {
      const { text, html } = getRssBannedEmail({ username: user.username });
      await createNotification({
        userId: user.id,
        type: 'rss_banned',
        message: 'Your RSS access has been disabled by an administrator.',
        sendEmail: true,
        email: user.email,
        emailSubject: 'Your RSS access has been disabled',
        emailText: text,
        emailHtml: html
      });
    } else {
      const { text, html } = getRssUnbannedEmail({ username: user.username });
      await createNotification({
        userId: user.id,
        type: 'rss_unbanned',
        message: 'Your RSS access has been re-enabled by an administrator.',
        sendEmail: true,
        email: user.email,
        emailSubject: 'Your RSS access has been enabled',
        emailText: text,
        emailHtml: html
      });
    }
  }
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function adminResetRssTokenHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = (request as any).user;
  if (!isAdminOrOwner(admin)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const newToken = crypto.randomUUID().replace(/-/g, '');
  const updated = await prisma.user.update({ where: { id }, data: { rssToken: newToken } });
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function listAllUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { page = 1, limit = 20, q } = (request.query as any) || {};
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        emailVerified: true,
        rssEnabled: true,
        rssToken: true
      }
    }),
    prisma.user.count({ where })
  ]);
  return reply.send({ users, total, page: Number(page), limit: Number(limit) });
}

export async function updateUserEmailHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!isAdminOrOwner(user)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { email } = request.body as any;
  if (!email || typeof email !== 'string') return reply.status(400).send({ error: 'Invalid email' });
  const existing = await prisma.user.findFirst({ where: { email, id: { not: id } } });
  if (existing) return reply.status(400).send({ error: 'Email already in use' });
  const oldUser = await prisma.user.findUnique({ where: { id } });
  if (!oldUser) return reply.status(404).send({ error: 'User not found' });
  // Set email and emailVerified false
  const updated = await prisma.user.update({ where: { id }, data: { email, emailVerified: false } });
  // Invalidate previous tokens
  await prisma.emailVerificationToken.updateMany({ where: { userId: id, used: false, expiresAt: { gt: new Date() } }, data: { used: true } });
  await prisma.passwordResetToken.updateMany({ where: { userId: id, used: false, expiresAt: { gt: new Date() } }, data: { used: true } });
  // Generate new verification token
  const verifyToken = randomUUID();
  const verifyExpires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({ data: { userId: id, token: verifyToken, expiresAt: verifyExpires } });
  // Generate new password reset token
  const resetToken = randomUUID();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId: id, token: resetToken, expiresAt: resetExpires } });
  // Build links
  const baseUrl = getFrontendBaseUrl();
  const verifyLink = `${baseUrl}/verify?token=${verifyToken}`;
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  // Send security email to old email
  if (oldUser.email) {
    const { text, html } = getResetPasswordEmail({ username: oldUser.username, link: resetLink });
    const securityText = `Your email was changed from ${oldUser.email} to ${email} by an admin.\nIf you did not request this, you can reset your password here: ${resetLink}`;
    const securityHtml = `<div style='font-family:sans-serif;color:#222;'><h2>Security Alert</h2><p>Your email was changed from <b>${oldUser.email}</b> to <b>${email}</b> by an admin.</p><p>If you did not request this, you can reset your password here:</p><p style='margin:32px 0;'><a href='${resetLink}' style='background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;'>Reset Password</a></p></div>`;
    await sendEmail({ to: oldUser.email, subject: 'Security Alert: Your email was changed', text: securityText, html: securityHtml });
  }
  // Send verification email to new email
  const { text: vText, html: vHtml } = getVerificationEmail({ username: oldUser.username, link: verifyLink });
  await sendEmail({ to: email, subject: 'Verify your new email address', text: vText, html: vHtml });
  return reply.send({ success: true, user: convertBigInts(updated) });
}

export async function updateUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const admin = (request as any).user;
  if (!isAdminOrOwner(admin)) return reply.status(403).send({ error: 'Forbidden' });
  const { id } = request.params as any;
  const { username, role, status, emailVerified } = request.body as any;
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) return reply.status(404).send({ error: 'User not found' });
  
  // Validate role permissions
  if (role && !['USER', 'MOD', 'ADMIN', 'OWNER', 'FOUNDER'].includes(role)) {
    return reply.status(400).send({ error: 'Invalid role' });
  }
  
  // Role change restrictions
  if (role && role !== existingUser.role) {
    // Only FOUNDER can assign FOUNDER role
    if (role === 'FOUNDER' && !isFounder(admin)) {
      return reply.status(403).send({ error: 'Only founders can assign FOUNDER role' });
    }
    
    // Only FOUNDER can assign OWNER role
    if (role === 'OWNER' && !isFounder(admin)) {
      return reply.status(403).send({ error: 'Only founders can assign OWNER role' });
    }
    
    // Only OWNER or FOUNDER can promote to ADMIN
    if (role === 'ADMIN' && !isOwnerOrFounder(admin)) {
      return reply.status(403).send({ error: 'Only owners or founders can promote users to ADMIN' });
    }
    
    // Only OWNER or FOUNDER can demote ADMIN
    if (existingUser.role === 'ADMIN' && !isOwnerOrFounder(admin)) {
      return reply.status(403).send({ error: 'Only owners or founders can demote ADMIN users' });
    }
    
    // Cannot demote FOUNDER
    if (existingUser.role === 'FOUNDER') {
      return reply.status(400).send({ error: 'Cannot demote FOUNDER' });
    }
    
    // Only FOUNDER can demote OWNER
    if (existingUser.role === 'OWNER' && !isFounder(admin)) {
      return reply.status(403).send({ error: 'Only founders can demote OWNER users' });
    }
  }
  
  // Only OWNER or FOUNDER can change usernames
  if (username && username !== existingUser.username) {
    if (!isOwnerOrFounder(admin)) {
      return reply.status(403).send({ error: 'Only owners or founders can change usernames' });
    }
  }
  
  // Check for username conflicts
  if (username && username !== existingUser.username) {
    const usernameExists = await prisma.user.findFirst({ where: { username, id: { not: id } } });
    if (usernameExists) return reply.status(400).send({ error: 'Username already in use' });
  }
  
  // Build update data
  const updateData: any = {};
  if (username && username !== existingUser.username) updateData.username = username;
  if (role && role !== existingUser.role) updateData.role = role;
  if (status && status !== existingUser.status) updateData.status = status;
  if (emailVerified !== undefined && emailVerified !== existingUser.emailVerified) {
    updateData.emailVerified = emailVerified;
  }
  
  // If no changes, return early
  if (Object.keys(updateData).length === 0) {
    return reply.send({ success: true, user: convertBigInts(existingUser), message: 'No changes to save' });
  }
  
  // Update user
  const updated = await prisma.user.update({ where: { id }, data: updateData });
  return reply.send({ success: true, user: convertBigInts(updated) });
} 