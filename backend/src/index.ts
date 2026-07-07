import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { startQueue, stopQueue } from './queue.js';
import { apiRouter } from './routes.js';
import { checkDbHealth } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';
const isWorker = config.ROLE === 'worker' || config.ROLE === 'both';
const isWeb    = config.ROLE === 'web'    || config.ROLE === 'both';

async function bootstrap() {
  try {
    if (isWorker) {
      startQueue();
      console.log(`Worker started (ROLE=${config.ROLE}, concurrency=${config.WORKER_CONCURRENCY})`);
    }

    if (!isWeb) {
      // Worker-only: keep process alive via the queue interval; handle shutdown here
      const shutdown = () => {
        console.log('\nShutting down worker gracefully...');
        stopQueue();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      return;
    }

    const app = express();

    // Trust first proxy for rate limiting behind nginx/railway/etc.
    app.set('trust proxy', 1);

    app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // für /api/image proxy
      contentSecurityPolicy: isProduction ? {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'sha256-gRea1ud4dovMrn/WaGWbyWZ3C28Ahr9nd40nKPz0IO8='"],
          "connect-src": ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
          "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
        }
      } : false,
    }));

    // Origins used by the native (Capacitor) app's webview. These are always
    // allowed so the Android/iOS builds can reach the API regardless of the
    // configured web origin.
    const nativeOrigins = ['http://localhost', 'https://localhost', 'capacitor://localhost'];
    const configuredOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    app.use(cors({
      origin: (origin, callback) => {
        // Non-browser clients (curl, server-to-server) send no Origin header.
        if (!origin || nativeOrigins.includes(origin)) return callback(null, true);
        if (!isProduction) return callback(null, origin === 'http://localhost:5173');
        // Production: allow the configured web origin(s); if none set, allow all.
        if (configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    // NOTE: this store is per-instance. For multiple web instances, move rate
    // limiting to the load balancer or replace with a shared store (Redis).
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    });
    app.use('/api', apiLimiter);

    app.use(express.json({ limit: '1mb' }));

    const frontendDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    // Image proxy to bypass Instagram CORP blocks (before apiRouter to skip API key check)
    app.get('/api/image', async (req, res) => {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        res.status(400).send('Missing url parameter');
        return;
      }
      try {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch image');
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          res.status(415).send('URL did not return an image');
          return;
        }
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch {
        res.status(500).send('Error proxying image');
      }
    });

    app.use('/api', apiRouter);

    app.get('/health', async (_req, res) => {
      const dbHealthy = await checkDbHealth();
      res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'OK' : 'degraded',
        uptime: process.uptime(),
        nodeEnv: process.env.NODE_ENV || 'development',
        dbConnected: dbHealthy,
        role: config.ROLE,
      });
    });

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/proxy')) {
        return next();
      }
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });

    const server = app.listen(config.PORT, () => {
      console.log(`Web server running at http://localhost:${config.PORT} (ROLE=${config.ROLE})`);
    });

    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      if (isWorker) stopQueue();
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error: any) {
    console.error('Failed to bootstrap server:', error.message);
    process.exit(1);
  }
}

bootstrap();
