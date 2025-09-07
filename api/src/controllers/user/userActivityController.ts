import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const { page = 1, limit = 20, type } = request.query as { page?: string; limit?: string; type?: string };
  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = { userId: user.id };
  if (type) {
    where.type = type;
  }

  try {
    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userActivity.count({ where })
    ]);

    return reply.send({
      activities,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

export async function createUserActivityHandler(
  userId: string,
  type: string,
  entityType: string | undefined,
  entityId: string | undefined,
  title: string,
  subtitle: string | undefined,
  metadata?: any
) {
  try {
    const activity = await prisma.userActivity.create({
      data: {
        userId,
        type,
        entityType,
        entityId,
        title,
        subtitle,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });
    return activity;
  } catch (error) {
    console.error('Error creating user activity:', error);
    return null;
  }
}

// Helper function to create activity for torrent upload
export async function createTorrentUploadActivity(userId: string, torrentId: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'torrent_uploaded',
    'torrent',
    torrentId,
    'activities.torrent_uploaded.title',
    'activities.torrent_uploaded.subtitle',
    { torrentId, torrentName }
  );
}

// Helper function to create activity for torrent download
export async function createTorrentDownloadActivity(userId: string, torrentId: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'torrent_downloaded',
    'torrent',
    torrentId,
    'activities.torrent_downloaded.title',
    'activities.torrent_downloaded.subtitle',
    { torrentId, torrentName }
  );
}

// Helper function to create activity for bookmark added
export async function createBookmarkAddedActivity(userId: string, torrentId: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'bookmark_added',
    'torrent',
    torrentId,
    'activities.bookmark_added.title',
    'activities.bookmark_added.subtitle',
    { torrentId, torrentName }
  );
}

// Helper function to create activity for bookmark removed
export async function createBookmarkRemovedActivity(userId: string, torrentId: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'bookmark_removed',
    'torrent',
    torrentId,
    'activities.bookmark_removed.title',
    'activities.bookmark_removed.subtitle',
    { torrentId, torrentName }
  );
}

// Helper function to create activity for torrent vote
export async function createTorrentVoteActivity(userId: string, torrentId: string, torrentName: string, voteType: 'like' | 'dislike') {
  return createUserActivityHandler(
    userId,
    `torrent_${voteType}d`,
    'torrent',
    torrentId,
    `activities.torrent_${voteType}d.title`,
    `activities.torrent_${voteType}d.subtitle`,
    { torrentId, torrentName, voteType }
  );
}

// Helper function to create activity for request created
export async function createRequestCreatedActivity(userId: string, requestId: string, requestTitle: string) {
  return createUserActivityHandler(
    userId,
    'request_created',
    'request',
    requestId,
    'activities.request_created.title',
    'activities.request_created.subtitle',
    { requestId, requestTitle }
  );
}

// Helper function to create activity for request filled
export async function createRequestFilledActivity(userId: string, requestId: string, requestTitle: string, filledBy: string) {
  return createUserActivityHandler(
    userId,
    'request_filled',
    'request',
    requestId,
    'activities.request_filled.title',
    'activities.request_filled.subtitle',
    { requestId, requestTitle, filledBy }
  );
}

// Helper function to create activity for request filled by user
export async function createRequestFilledByUserActivity(userId: string, requestId: string, requestTitle: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'request_filled_by_you',
    'request',
    requestId,
    'activities.request_filled_by_you.title',
    'activities.request_filled_by_you.subtitle',
    { requestId, requestTitle, torrentName }
  );
}

// Helper function to create activity for comment added
export async function createCommentAddedActivity(userId: string, entityType: string, entityId: string, entityName: string) {
  return createUserActivityHandler(
    userId,
    'comment_added',
    entityType,
    entityId,
    'activities.comment_added.title',
    'activities.comment_added.subtitle',
    { entityType, entityId, entityName }
  );
}

// Smart bookmark activity functions
export async function createSmartBookmarkAddedActivity(userId: string, torrentId: string, torrentName: string) {
  return createSmartBookmarkActivity(userId, torrentId, torrentName, 'bookmark_added', 'activities.bookmark_added.title', 'activities.bookmark_added.subtitle');
}

export async function createSmartBookmarkRemovedActivity(userId: string, torrentId: string, torrentName: string) {
  return createSmartBookmarkActivity(userId, torrentId, torrentName, 'bookmark_removed', 'activities.bookmark_removed.title', 'activities.bookmark_removed.subtitle');
}

// Smart torrent vote activity functions
export async function createSmartTorrentLikedActivity(userId: string, torrentId: string, torrentName: string) {
  return createSmartTorrentVoteActivity(userId, torrentId, torrentName, 'torrent_liked', 'activities.torrent_liked.title', 'activities.torrent_liked.subtitle');
}

export async function createSmartTorrentDislikedActivity(userId: string, torrentId: string, torrentName: string) {
  return createSmartTorrentVoteActivity(userId, torrentId, torrentName, 'torrent_disliked', 'activities.torrent_disliked.title', 'activities.torrent_disliked.subtitle');
}

async function createSmartBookmarkActivity(userId: string, torrentId: string, torrentName: string, activityType: string, titleKey: string, subtitleKey: string) {
  try {
    // Check if there's a recent bookmark activity for this torrent (within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const recentActivity = await prisma.userActivity.findFirst({
      where: {
        userId,
        entityType: 'torrent',
        entityId: torrentId,
        type: { in: ['bookmark_added', 'bookmark_removed'] },
        createdAt: { gte: fifteenMinutesAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentActivity) {
      // If the last activity is the same type, update the existing record
      if (recentActivity.type === activityType) {
        await prisma.userActivity.update({
          where: { id: recentActivity.id },
          data: {
            createdAt: new Date(), // Update timestamp
            metadata: JSON.stringify({ torrentId, torrentName })
          }
        });
        console.log(`[createSmartBookmarkActivity] Updated existing ${activityType} activity for torrent ${torrentId}`);
        return;
      } else {
        // If it's a different type (add vs remove), update the existing record to the new type
        await prisma.userActivity.update({
          where: { id: recentActivity.id },
          data: {
            type: activityType,
            title: titleKey,
            subtitle: subtitleKey,
            createdAt: new Date(), // Update timestamp
            metadata: JSON.stringify({ torrentId, torrentName })
          }
        });
        console.log(`[createSmartBookmarkActivity] Updated existing activity from ${recentActivity.type} to ${activityType} for torrent ${torrentId}`);
        return;
      }
    }

    // No recent activity found, create a new one
    await createUserActivityHandler(
      userId,
      activityType,
      'torrent',
      torrentId,
      titleKey,
      subtitleKey,
      { torrentId, torrentName }
    );
    console.log(`[createSmartBookmarkActivity] Created new ${activityType} activity for torrent ${torrentId}`);
  } catch (error) {
    console.error(`[createSmartBookmarkActivity] Error creating smart bookmark activity:`, error);
    // Fallback to regular activity creation
    await createUserActivityHandler(
      userId,
      activityType,
      'torrent',
      torrentId,
      titleKey,
      subtitleKey,
      { torrentId, torrentName }
    );
  }
}

async function createSmartTorrentVoteActivity(userId: string, torrentId: string, torrentName: string, activityType: string, titleKey: string, subtitleKey: string) {
  try {
    // Check if there's a recent vote activity for this torrent (within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const recentActivity = await prisma.userActivity.findFirst({
      where: {
        userId,
        entityType: 'torrent',
        entityId: torrentId,
        type: { in: ['torrent_liked', 'torrent_disliked'] },
        createdAt: { gte: fifteenMinutesAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentActivity) {
      // If the last activity is the same type, update the existing record
      if (recentActivity.type === activityType) {
        await prisma.userActivity.update({
          where: { id: recentActivity.id },
          data: {
            createdAt: new Date(), // Update timestamp
            metadata: JSON.stringify({ torrentId, torrentName, voteType: activityType === 'torrent_liked' ? 'like' : 'dislike' })
          }
        });
        console.log(`[createSmartTorrentVoteActivity] Updated existing ${activityType} activity for torrent ${torrentId}`);
        return;
      } else {
        // If it's a different type (like vs dislike), update the existing record to the new type
        await prisma.userActivity.update({
          where: { id: recentActivity.id },
          data: {
            type: activityType,
            title: titleKey,
            subtitle: subtitleKey,
            createdAt: new Date(), // Update timestamp
            metadata: JSON.stringify({ torrentId, torrentName, voteType: activityType === 'torrent_liked' ? 'like' : 'dislike' })
          }
        });
        console.log(`[createSmartTorrentVoteActivity] Updated existing activity from ${recentActivity.type} to ${activityType} for torrent ${torrentId}`);
        return;
      }
    }

    // No recent activity found, create a new one
    await createUserActivityHandler(
      userId,
      activityType,
      'torrent',
      torrentId,
      titleKey,
      subtitleKey,
      { torrentId, torrentName, voteType: activityType === 'torrent_liked' ? 'like' : 'dislike' }
    );
    console.log(`[createSmartTorrentVoteActivity] Created new ${activityType} activity for torrent ${torrentId}`);
  } catch (error) {
    console.error(`[createSmartTorrentVoteActivity] Error creating smart torrent vote activity:`, error);
    // Fallback to regular activity creation
    await createUserActivityHandler(
      userId,
      activityType,
      'torrent',
      torrentId,
      titleKey,
      subtitleKey,
      { torrentId, torrentName, voteType: activityType === 'torrent_liked' ? 'like' : 'dislike' }
    );
  }
}

// Helper function to create activity for torrent approved
export async function createTorrentApprovedActivity(userId: string, torrentId: string, torrentName: string) {
  return createUserActivityHandler(
    userId,
    'torrent_approved',
    'torrent',
    torrentId,
    'activities.torrent_approved.title',
    'activities.torrent_approved.subtitle',
    { torrentId, torrentName }
  );
}
