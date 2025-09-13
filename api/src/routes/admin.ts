import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  banUserHandler, unbanUserHandler, promoteUserHandler, demoteUserHandler, transferFounderRoleHandler,
  listPeerBans, getPeerBan, addPeerBan, removePeerBan,
  adminSetRssEnabledHandler, adminResetRssTokenHandler, listAllUsersHandler, updateUserEmailHandler, updateUserHandler
} from '../controllers/admin/adminUserController.js';
import {
  listCategoriesHandler, createCategoryHandler, updateCategoryHandler, deleteCategoryHandler, reorderCategoriesHandler, moveCategoryHandler, getCategorySourcesHandler, addCategorySourceHandler, deleteCategorySourceHandler, reorderCategorySourcesHandler
} from '../controllers/admin/adminCategoryController.js';
import {
  createAnnouncementHandler, updateAnnouncementHandler, deleteAnnouncementHandler, pinAnnouncementHandler, unpinAnnouncementHandler, showAnnouncementHandler, hideAnnouncementHandler, listAllAnnouncementsHandler
} from '../controllers/admin/adminAnnouncementController.js';
import {
  createWikiPageHandler, updateWikiPageHandler, deleteWikiPageHandler, lockWikiPageHandler, unlockWikiPageHandler, showWikiPageHandler, hideWikiPageHandler, listAllWikiPagesHandler
} from '../controllers/admin/adminWikiController.js';
import {
  closeRequestHandler, rejectRequestHandler
} from '../controllers/admin/adminRequestController.js';
import { getSmtpConfigHandler, updateSmtpConfigHandler, testSmtpHandler, getConfigHandler, updateConfigHandler } from '../controllers/configController.js';
import { getOverviewStatsHandler } from '../controllers/admin/adminOverviewController.js';
import { getAdminNotificationsHandler } from '../controllers/admin/adminNotificationController.js';
import { listRanksHandler, createRankHandler, updateRankHandler, deleteRankHandler, getRankHandler, getRankSystemStatusHandler, toggleRankSystemHandler } from '../controllers/admin/adminRankController.js';

export async function registerAdminRoutes(app: FastifyInstance) {
  app.post('/admin/user/:id/ban', { preHandler: requireAuth }, banUserHandler); //DONE
  app.post('/admin/user/:id/unban', { preHandler: requireAuth }, unbanUserHandler); //DONE
  app.post('/admin/user/:id/promote', { preHandler: requireAuth }, promoteUserHandler); //DONE
  app.post('/admin/user/:id/demote', { preHandler: requireAuth }, demoteUserHandler); //DONE
  app.post('/admin/user/transfer-founder', { preHandler: requireAuth }, transferFounderRoleHandler); //DONE
  app.get('/admin/overview-stats', { preHandler: requireAuth }, getOverviewStatsHandler); //DONE
  app.get('/admin/users', { preHandler: requireAuth }, listAllUsersHandler); //DONE
  app.put('/admin/user/:id/email', { preHandler: requireAuth }, updateUserEmailHandler); //DONE
  app.put('/admin/user/:id', { preHandler: requireAuth }, updateUserHandler); //DONE
  app.get('/admin/peerban', { preHandler: requireAuth }, listPeerBans); //DONE
  app.get('/admin/peerban/:id', { preHandler: requireAuth }, getPeerBan); //DONE
  app.post('/admin/peerban', { preHandler: requireAuth }, addPeerBan); //DONE
  app.delete('/admin/peerban/:id', { preHandler: requireAuth }, removePeerBan); //DONE
  app.get('/admin/smtp', { preHandler: requireAuth }, getSmtpConfigHandler);
  app.post('/admin/smtp', { preHandler: requireAuth }, updateSmtpConfigHandler);
  app.post('/admin/smtp/test', { preHandler: requireAuth }, testSmtpHandler);
  app.get('/admin/config', { preHandler: requireAuth }, getConfigHandler);
  app.post('/admin/config', { preHandler: requireAuth }, updateConfigHandler);
  app.get('/admin/category', { preHandler: requireAuth }, listCategoriesHandler); //DONE
  app.post('/admin/category', { preHandler: requireAuth }, createCategoryHandler); //DONE
  app.put('/admin/category/:id', { preHandler: requireAuth }, updateCategoryHandler); //DONE
  app.delete('/admin/category/:id', { preHandler: requireAuth }, deleteCategoryHandler); //DONE
  app.post('/admin/category/reorder', { preHandler: requireAuth }, reorderCategoriesHandler); //DONE
  app.post('/admin/category/move', { preHandler: requireAuth }, moveCategoryHandler); //DONE
  // Category Sources
  app.get('/admin/category/:id/sources', { preHandler: requireAuth }, getCategorySourcesHandler);
  app.post('/admin/category/:id/sources', { preHandler: requireAuth }, addCategorySourceHandler);
  app.delete('/admin/category/:id/sources/:sourceId', { preHandler: requireAuth }, deleteCategorySourceHandler);
  app.put('/admin/category/:id/sources/reorder', { preHandler: requireAuth }, reorderCategorySourcesHandler);
  app.post('/admin/request/:id/close', { preHandler: requireAuth }, closeRequestHandler); //DONE
  app.post('/admin/request/:id/reject', { preHandler: requireAuth }, rejectRequestHandler); //DONE
  app.post('/admin/announcement', { preHandler: requireAuth }, createAnnouncementHandler); //DONE
  app.put('/admin/announcement/:id', { preHandler: requireAuth }, updateAnnouncementHandler); //DONE
  app.delete('/admin/announcement/:id', { preHandler: requireAuth }, deleteAnnouncementHandler); //DONE
  app.post('/admin/announcement/:id/pin', { preHandler: requireAuth }, pinAnnouncementHandler); //DONE
  app.post('/admin/announcement/:id/unpin', { preHandler: requireAuth }, unpinAnnouncementHandler); //DONE
  app.post('/admin/announcement/:id/show', { preHandler: requireAuth }, showAnnouncementHandler); //DONE
  app.post('/admin/announcement/:id/hide', { preHandler: requireAuth }, hideAnnouncementHandler); //DONE
  app.get('/admin/announcement', { preHandler: requireAuth }, listAllAnnouncementsHandler); //DONE
  app.get('/admin/wiki', { preHandler: requireAuth }, listAllWikiPagesHandler); // NEW: list all wiki pages for admin
  app.post('/admin/wiki', { preHandler: requireAuth }, createWikiPageHandler); //DONE
  app.put('/admin/wiki/:id', { preHandler: requireAuth }, updateWikiPageHandler); //DONE
  app.delete('/admin/wiki/:id', { preHandler: requireAuth }, deleteWikiPageHandler); //DONE
  app.post('/admin/wiki/:id/lock', { preHandler: requireAuth }, lockWikiPageHandler); //DONE
  app.post('/admin/wiki/:id/unlock', { preHandler: requireAuth }, unlockWikiPageHandler); //DONE
  app.post('/admin/wiki/:id/show', { preHandler: requireAuth }, showWikiPageHandler); //DONE
  app.post('/admin/wiki/:id/hide', { preHandler: requireAuth }, hideWikiPageHandler); //DONE
  // RSS
  app.post('/admin/user/:id/rss-enabled', { preHandler: requireAuth }, adminSetRssEnabledHandler); //DONE
  app.post('/admin/user/:id/rss-token', { preHandler: requireAuth }, adminResetRssTokenHandler); //DONE
  // Notifications
  app.get('/admin/notifications', { preHandler: requireAuth }, getAdminNotificationsHandler);

  // Rank management routes
  app.get('/admin/ranks', { preHandler: requireAuth }, listRanksHandler);
  app.post('/admin/ranks', { preHandler: requireAuth }, createRankHandler);
  app.get('/admin/ranks/:id', { preHandler: requireAuth }, getRankHandler);
  app.put('/admin/ranks/:id', { preHandler: requireAuth }, updateRankHandler);
  app.delete('/admin/ranks/:id', { preHandler: requireAuth }, deleteRankHandler);
  app.get('/admin/ranks/status', { preHandler: requireAuth }, getRankSystemStatusHandler);
  app.post('/admin/ranks/toggle', { preHandler: requireAuth }, toggleRankSystemHandler);
} 