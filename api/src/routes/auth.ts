import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
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
import { createAuthRateLimitConfig } from '../middleware/rateLimitMiddleware.js';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register rate limiting for general auth endpoints (register, login)
  await app.register(rateLimit, createAuthRateLimitConfig('general'));

  // Register rate limiting for email verification endpoints
  await app.register(rateLimit, createAuthRateLimitConfig('email'));

  // Register rate limiting for password reset endpoints
  await app.register(rateLimit, createAuthRateLimitConfig('password'));

  // Register rate limiting for profile endpoints
  await app.register(rateLimit, createAuthRateLimitConfig('profile'));

  // Authentication routes with rate limiting applied
  app.post('/auth/register', registerHandler);
  app.post('/auth/login', loginHandler);
  app.post('/auth/request-email-verification', { preHandler: requireAuth }, requestEmailVerificationHandler);
  app.post('/auth/verify-email', verifyEmailHandler);
  app.post('/auth/request-password-reset', requestPasswordResetHandler);
  app.post('/auth/reset-password', resetPasswordHandler);
  app.post('/auth/rotate-passkey', { preHandler: requireAuth }, rotatePasskeyHandler);
  app.get('/auth/profile', { preHandler: requireAuth }, getProfileHandler);
  app.patch('/auth/profile', { preHandler: requireAuth }, updateProfileHandler);
} 