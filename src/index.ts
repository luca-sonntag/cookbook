import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDb } from './db.js';
import { startQueue, stopQueue } from './queue.js';
import { apiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  try {
    // 1. Initialize the SQLite-like JSON database
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized successfully.');

    // 2. Start the background queue worker
    startQueue();

    // 3. Create Express app
    const app = express();

    app.use(cors());
    app.use(express.json());

    // 4. Register API routes
    app.use('/api', apiRouter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', uptime: process.uptime() });
    });

    // Serve HTTP Shortcuts import file for easy phone setup
    app.get('/shortcuts', (req, res) => {
      const jsonPath = path.resolve(__dirname, '..', 'http-shortcuts', 'recipe-extractor.json');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="recipe-extractor.json"');
      res.sendFile(jsonPath);
    });

    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`Server is running at http://localhost:${config.PORT}`);
      console.log(`API endpoints:`);
      console.log(`- POST http://localhost:${config.PORT}/api/extract-recipe`);
      console.log(`- GET  http://localhost:${config.PORT}/api/jobs/:id`);
      console.log(`- GET  http://localhost:${config.PORT}/shortcuts  ← HTTP Shortcuts import URL`);
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
