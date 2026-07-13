import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from './config.js';

// Extend Express Request to carry the authenticated user's ID
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
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
 * Attaches `req.userId` and `req.userEmail` on success.
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
    req.userEmail = payload.email as string | undefined;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token.' });
  }
}

/**
 * Middleware that verifies if the authenticated user is a configured admin.
 * Assumes requireAuth has already executed and populated req.userId and req.userEmail.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
    return;
  }

  const email = req.userEmail;
  if (!email) {
    res.status(403).json({ success: false, error: 'Forbidden: Missing email claim in authentication token.' });
    return;
  }

  const adminEmails = config.ADMIN_EMAILS.split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(email.toLowerCase())) {
    res.status(403).json({ success: false, error: 'Forbidden: User is not configured as an admin.' });
    return;
  }

  next();
}
