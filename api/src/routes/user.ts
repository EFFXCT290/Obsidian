import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getUserNotificationsHandler, markNotificationReadHandler, markAllNotificationsReadHandler, clearNotificationsHandler } from '../controllers/user/notificationController.js';
import { listAllCategoriesHandler, listTorrentsByCategoryTitleHandler, getCategorySourcesPublicHandler } from '../controllers/user/categoryController.js';
import { listRequestsHandler, createRequestHandler, getRequestHandler, fillRequestHandler, listCommentsForRequestHandler, createCommentForRequestHandler } from '../controllers/user/requestController.js';
import { listAnnouncementsHandler, getAnnouncementHandler } from '../controllers/user/announcementController.js';
import { listWikiPagesHandler, getWikiPageHandler } from '../controllers/user/wikiController.js';
import { listBookmarksHandler, addBookmarkHandler, removeBookmarkHandler, updateBookmarkNoteHandler } from '../controllers/user/bookmarkController.js';
import { getRssTokenHandler, regenerateRssTokenHandler } from '../controllers/user/rssController.js';
import { getActiveTorrentsHandler } from '../controllers/user/userActiveTorrentController.js';
import { uploadAvatarHandler, deleteAvatarHandler, disableSelfHandler } from '../controllers/authController.js';
import { getCommentThreadHandler } from '../controllers/commentController.js';
import { listUserInvitesHandler, createInviteHandler, cancelInviteHandler, getInviteByCodePublicHandler } from '../controllers/user/inviteController.js';
import { getPreferencesHandler, updatePreferencesHandler } from '../controllers/user/userPreferenceController.js';
import { getPopularTagsHandler, searchTorrentsByTagHandler, searchTorrentsByTextHandler } from '../controllers/user/tagController.js';

export async function registerUserRoutes(app: FastifyInstance) {
  app.get('/notifications', { preHandler: requireAuth }, getUserNotificationsHandler); //DONE
  app.post('/notifications/:id/read', { preHandler: requireAuth }, markNotificationReadHandler); //DONE
  app.post('/notifications/read-all', { preHandler: requireAuth }, markAllNotificationsReadHandler); //DONE
  app.delete('/notifications/clear', { preHandler: requireAuth }, clearNotificationsHandler); //DONE
  app.get('/categories', listAllCategoriesHandler); //DONE
  app.get('/category/:id/sources', getCategorySourcesPublicHandler); // NEW: public category sources (for upload UI)
  app.get('/category/:title/torrents', listTorrentsByCategoryTitleHandler); //DONE
  app.get('/requests', listRequestsHandler); //DONE
  app.post('/requests', { preHandler: requireAuth }, createRequestHandler); //DONE
  app.get('/requests/:id', getRequestHandler); //DONE
  app.post('/requests/:id/fill', { preHandler: requireAuth }, fillRequestHandler); //DONE
  app.get('/requests/:id/comments', listCommentsForRequestHandler);
  app.post('/requests/:id/comments', { preHandler: requireAuth }, createCommentForRequestHandler);
  app.get('/comments/:commentId/thread', getCommentThreadHandler);
  app.get('/announcements', listAnnouncementsHandler); //DONE
  app.get('/announcements/:id', getAnnouncementHandler); //DONE
  app.get('/wiki', listWikiPagesHandler); //DONE
  app.get('/wiki/:slug', getWikiPageHandler); //DONE
  app.get('/bookmarks', { preHandler: requireAuth }, listBookmarksHandler); //DONE
  app.post('/bookmarks', { preHandler: requireAuth }, addBookmarkHandler); //DONE
  app.delete('/bookmarks/:torrentId', { preHandler: requireAuth }, removeBookmarkHandler); //DONE
  app.put('/bookmarks/:torrentId', { preHandler: requireAuth }, updateBookmarkNoteHandler); //DONE
  app.get('/user/rss-token', { preHandler: requireAuth }, getRssTokenHandler); //DONE
  app.post('/user/rss-token', { preHandler: requireAuth }, regenerateRssTokenHandler); //DONE
  app.get('/user/active-torrents', { preHandler: requireAuth }, getActiveTorrentsHandler);
  app.post('/user/avatar', { preHandler: requireAuth }, uploadAvatarHandler);
  app.delete('/user/avatar', { preHandler: requireAuth }, deleteAvatarHandler);
  app.post('/user/disable', { preHandler: requireAuth }, disableSelfHandler);
  app.get('/user/invites', { preHandler: requireAuth }, listUserInvitesHandler);
  app.post('/user/invites', { preHandler: requireAuth }, createInviteHandler);
  app.delete('/user/invites', { preHandler: requireAuth }, cancelInviteHandler);
  app.get('/invite/:code', getInviteByCodePublicHandler);
  app.get('/user/preferences', { preHandler: requireAuth }, getPreferencesHandler);
  app.put('/user/preferences', { preHandler: requireAuth }, updatePreferencesHandler);
  app.get('/tags/popular', getPopularTagsHandler); // Get popular tags with usage counts
  app.get('/tags/:tag/torrents', searchTorrentsByTagHandler); // Search torrents by tag
  app.get('/search', searchTorrentsByTextHandler); // Search torrents by text query
} 