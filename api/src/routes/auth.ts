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
// import { createAuthRateLimitConfig } from '../middleware/rateLimitMiddleware.js'; // Not used in this simplified approach

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register a single, very lenient rate limiter for all auth endpoints
  await app.register(rateLimit, {
    max: 500, // Increased to 500 requests per window
    timeWindow: '5 minutes', // Reduced to 5 minute window for faster reset
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.round(Number(context.after) / 1000) || 15
    }),
    skipOnError: false,
    enableDraftSpec: true
  });

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