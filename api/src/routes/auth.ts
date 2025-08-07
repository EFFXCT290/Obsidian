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

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/register', registerHandler); //DONE
  app.post('/auth/login', loginHandler); //DONE
  app.post('/auth/request-email-verification', { preHandler: requireAuth }, requestEmailVerificationHandler); //DONE
  app.post('/auth/verify-email', verifyEmailHandler); //DONE
  app.post('/auth/request-password-reset', requestPasswordResetHandler); //DONE
  app.post('/auth/reset-password', resetPasswordHandler); //DONE
  app.post('/auth/rotate-passkey', { preHandler: requireAuth }, rotatePasskeyHandler); //DONE
  app.get('/auth/profile', { preHandler: requireAuth }, getProfileHandler); //DONE
  app.patch('/auth/profile', { preHandler: requireAuth }, updateProfileHandler); //DONE
} 