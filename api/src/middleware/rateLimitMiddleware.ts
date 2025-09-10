import { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';

/**
 * Rate limiting middleware for authentication routes
 * Prevents brute force attacks and DoS attacks on sensitive endpoints
 */

/**
 * Register rate limiting for authentication routes
 * This function sets up rate limiting specifically for auth endpoints
 */
export async function registerAuthRateLimit(app: FastifyInstance) {
  // Register rate limiting plugin with specific configurations
  await app.register(rateLimit, {
    max: 5, // Maximum 5 requests per window
    timeWindow: '15 minutes', // 15 minute window
    keyGenerator: (request: FastifyRequest) => {
      // Use IP address as the key for rate limiting
      return request.ip;
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.round(context.after / 1000) || 15
    }),
    skipOnError: false,
    enableDraftSpec: true
  });
}

/**
 * Create rate limiting configuration for specific auth endpoint types
 */
export function createAuthRateLimitConfig(type: 'general' | 'email' | 'password' | 'profile') {
  const configs = {
    general: {
      max: 5,
      timeWindow: '15 minutes',
      message: 'Too many authentication attempts. Please try again later.'
    },
    email: {
      max: 3,
      timeWindow: '10 minutes',
      message: 'Too many email verification attempts. Please try again later.'
    },
    password: {
      max: 3,
      timeWindow: '30 minutes',
      message: 'Too many password reset attempts. Please try again later.'
    },
    profile: {
      max: 20,
      timeWindow: '15 minutes',
      message: 'Too many profile requests. Please try again later.'
    }
  };

  const config = configs[type];
  
  return {
    max: config.max,
    timeWindow: config.timeWindow,
    keyGenerator: (request: FastifyRequest) => `auth-${type}:${request.ip}`,
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: config.message,
      retryAfter: Math.round(context.after / 1000) || 15
    }),
    skipOnError: false,
    enableDraftSpec: true
  };
}
