import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { startQueue, stopQueue } from './queue.js';
import { apiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  try {
    // 1. Start the background queue worker
    startQueue();

    // 2. Create Express app
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Serve static files from React build directory
    const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    // Serve permanently saved recipe food images (extracted video frames)
    const recipeImagesPath = path.resolve('public', 'recipe-images');
    app.use('/recipe-images', express.static(recipeImagesPath));

    // Image proxy to bypass Instagram CORP blocks (MUST BE BEFORE apiRouter to bypass API key check)
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
        
        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (err) {
        res.status(500).send('Error proxying image');
      }
    });

    // 4. Register API routes
    app.use('/api', apiRouter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', uptime: process.uptime() });
    });



    // Fallback for React routing (SPA)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/proxy')) {
        return next();
      }
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });

    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`Server is running at http://localhost:${config.PORT}`);
      console.log(`API endpoints:`);
      console.log(`- POST http://localhost:${config.PORT}/api/extract-recipe`);
      console.log(`- GET  http://localhost:${config.PORT}/api/jobs/:id`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      stopQueue();
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
