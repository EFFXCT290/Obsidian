import { PrismaClient } from '@prisma/client';
import { getConfig } from '../services/configService.js';

const prisma = new PrismaClient();

// Check for hit and runs based on grace period (users who haven't announced recently)
export async function checkHitAndRunGracePeriod() {
  const config = await getConfig();
  const REQUIRED_SEEDING_MINUTES = config.requiredSeedingMinutes;
  const GRACE_PERIOD_MINUTES = Math.floor(config.defaultAnnounceInterval / 60); // Use existing 30-minute grace period
  
  console.log(`[checkHitAndRunGracePeriod] Checking for hit and runs with grace period of ${GRACE_PERIOD_MINUTES} minutes`);
  
  const gracePeriodAgo = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);
  
  // Find all hit and run records where users haven't announced recently
  const records = await prisma.hitAndRun.findMany({
    where: {
      isHitAndRun: false, // Only check records that aren't already marked as hit and run
      lastSeededAt: {
        lt: gracePeriodAgo // Last seeded before grace period
      }
    },
    include: {
      user: true,
      torrent: true
    }
  });
  
  console.log(`[checkHitAndRunGracePeriod] Found ${records.length} records to check for grace period violations`);
  
  for (const record of records) {
    console.log(`[checkHitAndRunGracePeriod] Checking user ${record.user.username} on torrent ${record.torrent.name}`);
    console.log(`[checkHitAndRunGracePeriod] Total seeding time: ${record.totalSeedingTime} minutes, Required: ${REQUIRED_SEEDING_MINUTES} minutes`);
    
    if (record.totalSeedingTime < REQUIRED_SEEDING_MINUTES) {
      console.log(`[checkHitAndRunGracePeriod] HIT AND RUN DETECTED via grace period! User ${record.user.username} seeded for ${record.totalSeedingTime} minutes, required: ${REQUIRED_SEEDING_MINUTES} minutes`);
      
      await prisma.hitAndRun.update({
        where: { id: record.id },
        data: { isHitAndRun: true }
      });
    } else {
      console.log(`[checkHitAndRunGracePeriod] User ${record.user.username} completed required seeding: ${record.totalSeedingTime} >= ${REQUIRED_SEEDING_MINUTES} minutes`);
    }
  }
}

export async function updateHitAndRun(userId: string, torrentId: string, left: number, event: string | null) {
  const config = await getConfig();
  const REQUIRED_SEEDING_MINUTES = config.requiredSeedingMinutes;
  
  console.log(`[updateHitAndRun] Processing user ${userId} on torrent ${torrentId}`);
  console.log(`[updateHitAndRun] Event: ${event}, Left: ${left}, Required seeding: ${REQUIRED_SEEDING_MINUTES} minutes`);
  
  // Find existing HitAndRun record
  let record = await prisma.hitAndRun.findFirst({ where: { userId, torrentId } });
  const now = new Date();
  
  // Only create a hit and run record when user completes downloading (event === 'completed')
  // This ensures we only track users who actually downloaded the torrent, not seeders
  if (!record && event === 'completed') {
    console.log(`[updateHitAndRun] Creating new hit and run record for user ${userId} - download completed`);
    record = await prisma.hitAndRun.create({
                  data: {
              userId,
              torrentId,
              downloadedAt: now,
              lastSeededAt: left === 0 ? now : null,
              totalSeedingTime: 0,
              isHitAndRun: false
            }
    });
    console.log(`[updateHitAndRun] Record created with ID: ${record.id}`);
  } else if (!record) {
    console.log(`[updateHitAndRun] No record exists and event is not 'completed' - skipping user ${userId}`);
    return; // Don't track this user if they haven't completed a download
  } else {
    console.log(`[updateHitAndRun] Found existing record ID: ${record.id}`);
    console.log(`[updateHitAndRun] Current totalSeedingTime: ${record.totalSeedingTime} minutes`);
    console.log(`[updateHitAndRun] Current lastSeededAt: ${record.lastSeededAt}`);
    console.log(`[updateHitAndRun] Current isHitAndRun: ${record.isHitAndRun}`);
  }
  
  // Update seeding time when user is seeding (left == 0)
  let totalSeedingTime = record.totalSeedingTime;
  let lastSeededAt = record.lastSeededAt;
  const wasSeedingBefore = lastSeededAt !== null;
  
  if (left === 0) {
    console.log(`[updateHitAndRun] User is currently seeding (left = 0)`);
    if (lastSeededAt) {
      // Calculate minutes since last announce while seeding
      const minutes = Math.floor((now.getTime() - new Date(lastSeededAt).getTime()) / 60000);
      if (minutes > 0) {
        totalSeedingTime += minutes;
        console.log(`[updateHitAndRun] Added ${minutes} minutes of seeding time`);
        console.log(`[updateHitAndRun] Total seeding time now: ${totalSeedingTime} minutes`);
      } else {
        console.log(`[updateHitAndRun] No time elapsed since last announce (${minutes} minutes)`);
      }
    } else {
      console.log(`[updateHitAndRun] No previous lastSeededAt, starting fresh`);
    }
    lastSeededAt = now;
    console.log(`[updateHitAndRun] Updated lastSeededAt to: ${now}`);
  } else {
    console.log(`[updateHitAndRun] User is not seeding (left = ${left})`);
    // If user was seeding before but now has left > 0, calculate final seeding time
    if (lastSeededAt) {
      const minutes = Math.floor((now.getTime() - new Date(lastSeededAt).getTime()) / 60000);
      if (minutes > 0) {
        totalSeedingTime += minutes;
        console.log(`[updateHitAndRun] User stopped seeding, added final ${minutes} minutes`);
        console.log(`[updateHitAndRun] Total seeding time now: ${totalSeedingTime} minutes`);
      }
      lastSeededAt = null; // Reset since they're not seeding anymore
    }
  }
  
  // Check for hit and run conditions
  let isHitAndRun = record.isHitAndRun;
  
  // Check for hit and run in these scenarios:
  // 1. User explicitly stopped (event === 'stopped')
  // 2. User was seeding before but now has left > 0 (stopped seeding without event)
  const shouldCheckHitAndRun = event === 'stopped' || (wasSeedingBefore && left > 0);
  
  if (shouldCheckHitAndRun) {
    const reason = event === 'stopped' ? 'explicitly stopped' : 'stopped seeding (left > 0)';
    console.log(`[updateHitAndRun] User ${reason}`);
    console.log(`[updateHitAndRun] Checking hit and run: ${totalSeedingTime} < ${REQUIRED_SEEDING_MINUTES}?`);
    
    if (totalSeedingTime < REQUIRED_SEEDING_MINUTES) {
      isHitAndRun = true;
      console.log(`[updateHitAndRun] HIT AND RUN DETECTED! User seeded for ${totalSeedingTime} minutes, required: ${REQUIRED_SEEDING_MINUTES} minutes`);
    } else {
      console.log(`[updateHitAndRun] User completed required seeding: ${totalSeedingTime} >= ${REQUIRED_SEEDING_MINUTES} minutes`);
    }
  } else if (event === 'completed') {
    console.log(`[updateHitAndRun] User completed download`);
  } else {
    console.log(`[updateHitAndRun] Other event: ${event}`);
  }
  
  console.log(`[updateHitAndRun] Final values - totalSeedingTime: ${totalSeedingTime}, isHitAndRun: ${isHitAndRun}`);
  
  await prisma.hitAndRun.update({
    where: { id: record.id },
    data: {
      lastSeededAt,
      totalSeedingTime,
      isHitAndRun
    }
  });
  
  console.log(`[updateHitAndRun] Record updated successfully`);
} 