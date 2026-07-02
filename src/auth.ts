import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from './config.js';

// Extend Express Request to carry the authenticated user's ID
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// JWKS fetched once and cached by jose (auto-refreshed on key rotation)
const JWKS = createRemoteJWKSet(
  new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

/**
 * Middleware that verifies the Supabase JWT locally via JWKS.
 * No network round-trip to Supabase Auth per request.
 * Attaches `req.userId` on success.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed Authorization header.' });
    return;
  }

  const token = header.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: 'authenticated',
    });

    if (!payload.sub) {
      res.status(401).json({ success: false, error: 'Unauthorized: Token missing subject.' });
      return;
    }

    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token.' });
  }
}
