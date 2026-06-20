import { Request, Response, NextFunction } from 'express';
import { config } from './config.js';

/**
 * Middleware to require and validate API key.
 * Checks for API Key in:
 * 1. X-API-Key header
 * 2. Authorization Bearer header
 * 3. Query string parameter "apiKey"
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-API-Key') || 
                 req.header('Authorization')?.replace(/^Bearer\s+/i, '') || 
                 req.query.apiKey;

  if (!apiKey || apiKey !== config.API_KEY) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API Key.',
    });
    return;
  }

  next();
}
