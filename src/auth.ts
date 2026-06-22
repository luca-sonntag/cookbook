import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Extend Express Request to carry the authenticated user's ID
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// ── Supabase admin client (service_role) for JWT verification ────────────────

let _adminClient: SupabaseClient | undefined;

function getAdminClient(): SupabaseClient {
  _adminClient ??= createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _adminClient;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Middleware that verifies the Supabase JWT from the Authorization header.
 * Attaches `req.userId` on success.
 *
 * Header format:  Authorization: Bearer <supabase_access_token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or malformed Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    const { data, error } = await getAdminClient().auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired token.',
      });
      return;
    }

    req.userId = data.user.id;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Token verification failed.',
    });
  }
}
