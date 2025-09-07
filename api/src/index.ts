import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAuthRoutes } from './routes/auth.js';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import { registerTorrentRoutes } from './routes/torrent.js';
import { registerUserRoutes } from './routes/user.js';
import { registerAnnounceRoutes } from './routes/announce.js';
import { registerRssRoutes } from './routes/rss.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerConfigRoutes } from './routes/config.js';
import { registerFileRoutes } from './routes/files.js';
import { checkHitAndRunGracePeriod } from './announce_features/hitAndRun.js';
import path from 'path';

const app = Fastify({ 
  logger: {
    level: 'info' // Log all requests to debug
  }
});

// Add global request logging
app.addHook('onRequest', async (request, _reply) => {
  console.log(`[GLOBAL] ${request.method} ${request.url}`, {
    headers: request.headers,
    params: request.params,
    query: request.query
  });
});

// Register CORS with dynamic origin from .env, with sensible local defaults
const defaultCorsOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const envOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || [];
const corsOrigins = envOrigins.length > 0 ? envOrigins : defaultCorsOrigins;
await app.register(cors, {
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  credentials: true
});

app.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

// Register static file serving for uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const absoluteUploadDir = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.resolve(process.cwd(), UPLOAD_DIR);

await app.register(staticPlugin, {
  root: absoluteUploadDir,
  prefix: '/uploads/',
  decorateReply: false
});

// Register multipart with file size limit (32MB)
await app.register(multipart, {
  limits: {
    fileSize: 32 * 1024 * 1024 // 32MB
  }
});

// Import plugins and routes (to be implemented)
// import { registerAuthRoutes } from './routes/auth';
// import { registerUserRoutes } from './routes/user';
// import { registerTorrentRoutes } from './routes/torrent';
// import { registerAnnounceRoutes } from './routes/announce';
// import { registerAdminRoutes } from './routes/admin';

// Example usage (to be implemented):
await registerAuthRoutes(app);
await registerTorrentRoutes(app);
await registerUserRoutes(app);
await registerAnnounceRoutes(app);
await registerRssRoutes(app);
await registerAdminRoutes(app);
await registerStatsRoutes(app);
await registerConfigRoutes(app);
await registerFileRoutes(app);
// registerUserRoutes(app);
// registerTorrentRoutes(app);
// registerAnnounceRoutes(app);
// registerAdminRoutes(app);

const start = async () => {
  try {
    // Listen on both IPv4 and IPv6
    await app.listen({ port: 3001, host: '::' });
    console.log('API server running on http://localhost:3001');
    
    // Start grace period hit and run check every 30 minutes
    setInterval(async () => {
      try {
        await checkHitAndRunGracePeriod();
      } catch (error) {
        console.error('Error in grace period check:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    console.log('Grace period hit and run check scheduled every 30 minutes');
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 