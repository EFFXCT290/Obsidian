import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';

/**
 * Rate limiting middleware for authentication routes
 * Prevents brute force attacks and DoS attacks on sensitive endpoints
 */

// Rate limiting configuration for different types of auth endpoints
const authRateLimitConfig = {
  // General auth endpoints (register, login) - more restrictive
  general: {
    max: 5, // Maximum 5 requests
    timeWindow: '15 minutes', // Per 15 minutes
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.round(context.after / 1000) || 15
    })
  },
  
  // Email verification endpoints - moderate restrictions
  email: {
    max: 3, // Maximum 3 requests
    timeWindow: '10 minutes', // Per 10 minutes
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many email verification attempts. Please try again later.',
      retryAfter: Math.round(context.after / 1000) || 10
    })
  },
  
  // Password reset endpoints - more restrictive
  password: {
    max: 3, // Maximum 3 requests
    timeWindow: '30 minutes', // Per 30 minutes
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: Math.round(context.after / 1000) || 30
    })
  },
  
  // Profile endpoints - less restrictive but still limited
  profile: {
    max: 20, // Maximum 20 requests
    timeWindow: '15 minutes', // Per 15 minutes
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many profile requests. Please try again later.',
      retryAfter: Math.round(context.after / 1000) || 15
    })
  }
};

/**
 * Register rate limiting plugins for authentication routes
 */
export async function registerAuthRateLimit(app: FastifyInstance) {
  // Register the rate limit plugin
  await app.register(rateLimit, {
    global: false, // We'll apply it selectively to specific routes
    keyGenerator: (request: FastifyRequest) => {
      // Use IP address as the key for rate limiting
      return request.ip;
    },
    skipOnError: false, // Don't skip rate limiting on errors
    enableDraftSpec: true, // Enable draft spec for better compatibility
  });

  // Register specific rate limiters for different auth endpoint types
  await app.register(rateLimit, {
    ...authRateLimitConfig.general,
    name: 'auth-general',
    keyGenerator: (request: FastifyRequest) => `auth-general:${request.ip}`,
  });

  await app.register(rateLimit, {
    ...authRateLimitConfig.email,
    name: 'auth-email',
    keyGenerator: (request: FastifyRequest) => `auth-email:${request.ip}`,
  });

  await app.register(rateLimit, {
    ...authRateLimitConfig.password,
    name: 'auth-password',
    keyGenerator: (request: FastifyRequest) => `auth-password:${request.ip}`,
  });

  await app.register(rateLimit, {
    ...authRateLimitConfig.profile,
    name: 'auth-profile',
    keyGenerator: (request: FastifyRequest) => `auth-profile:${request.ip}`,
  });
}

/**
 * Get rate limit configuration for specific endpoint types
 */
export function getRateLimitConfig(type: keyof typeof authRateLimitConfig) {
  return authRateLimitConfig[type];
}
