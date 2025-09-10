import { FastifyInstance } from 'fastify';
import { registerHandler } from '../controllers/authController.js';
import { loginHandler } from '../controllers/authController.js';
import {
  requestEmailVerificationHandler,
  verifyEmailHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
  getProfileHandler,
  updateProfileHandler,
  rotatePasskeyHandler
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { registerAuthRateLimit } from '../middleware/rateLimitMiddleware.js';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register rate limiting for authentication routes
  await registerAuthRateLimit(app);

  // Authentication routes with rate limiting applied
  app.post('/auth/register', {
    config: { rateLimit: 'auth-general' }
  }, registerHandler);

  app.post('/auth/login', {
    config: { rateLimit: 'auth-general' }
  }, loginHandler);

  app.post('/auth/request-email-verification', {
    preHandler: requireAuth,
    config: { rateLimit: 'auth-email' }
  }, requestEmailVerificationHandler);

  app.post('/auth/verify-email', {
    config: { rateLimit: 'auth-email' }
  }, verifyEmailHandler);

  app.post('/auth/request-password-reset', {
    config: { rateLimit: 'auth-password' }
  }, requestPasswordResetHandler);

  app.post('/auth/reset-password', {
    config: { rateLimit: 'auth-password' }
  }, resetPasswordHandler);

  app.post('/auth/rotate-passkey', {
    preHandler: requireAuth,
    config: { rateLimit: 'auth-general' }
  }, rotatePasskeyHandler);

  app.get('/auth/profile', {
    preHandler: requireAuth,
    config: { rateLimit: 'auth-profile' }
  }, getProfileHandler);

  app.patch('/auth/profile', {
    preHandler: requireAuth,
    config: { rateLimit: 'auth-profile' }
  }, updateProfileHandler);
} 