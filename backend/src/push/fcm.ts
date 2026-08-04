import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { importPKCS8, SignJWT } from 'jose';
import { config } from '../config.js';

/**
 * Minimal Firebase Cloud Messaging HTTP v1 sender.
 *
 * We deliberately avoid the heavy `firebase-admin` SDK: the only thing we need
 * is to mint an OAuth2 access token from the service account (a signed JWT
 * exchanged at Google's token endpoint) and POST a message to the v1 send
 * endpoint. `jose` (already a backend dependency for Supabase JWT verification)
 * signs the assertion, so no new dependency is required.
 */

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
}

let _serviceAccount: ServiceAccount | null | undefined;
let _cachedToken: { accessToken: string; expiresAt: number } | null = null;

/** Result of a single-token send so the caller can prune dead tokens. */
export interface FcmSendResult {
  token: string;
  ok: boolean;
  /** true when FCM says the token is permanently invalid (should be disabled). */
  unregistered: boolean;
  error?: string;
}

export interface FcmMessage {
  title: string;
  body: string;
  imageUrl?: string;
  /** String-only data payload (FCM v1 requires string values); used for tap routing. */
  data?: Record<string, string>;
}

/**
 * Load and cache the service-account credentials. `FCM_SERVICE_ACCOUNT_JSON` may
 * be the raw JSON (single-line env var) or an absolute/relative path to the .json file.
 * Returns null when notifications are not configured.
 */
function getServiceAccount(): ServiceAccount | null {
  if (_serviceAccount !== undefined) return _serviceAccount;

  let raw = config.FCM_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    _serviceAccount = null;
    return null;
  }

  // Strip Byte Order Mark (BOM) if present
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1).trim();
  }

  try {
    let text: string;
    const resolvedPath = path.resolve(raw);

    // Check if raw is a valid file path on disk
    if (existsSync(raw) || existsSync(resolvedPath)) {
      const targetFile = existsSync(raw) ? raw : resolvedPath;
      text = readFileSync(targetFile, 'utf-8');
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1).trim();
      }
    } else {
      text = raw;
    }

    let parsed: ServiceAccount;
    try {
      parsed = JSON.parse(text) as ServiceAccount;
    } catch {
      // Fallback: try parsing with sanitized unescaped newlines in private key
      const sanitizedText = text.replace(/\\n/g, '\n');
      parsed = JSON.parse(sanitizedText) as ServiceAccount;
    }

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('service account missing client_email or private_key');
    }

    // Normalize escaped \\n in private_key string if present
    if (parsed.private_key.includes('\\n')) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    _serviceAccount = parsed;
  } catch (err: any) {
    console.error('[fcm] Failed to load FCM_SERVICE_ACCOUNT_JSON:', err.message);
    _serviceAccount = null;
  }
  return _serviceAccount;
}

/** Whether FCM is fully configured (project id + service account present). */
export function isFcmConfigured(): boolean {
  return !!config.FCM_PROJECT_ID && !!getServiceAccount();
}

/** Mint (and cache) a short-lived OAuth2 access token for the FCM scope. */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) {
    return _cachedToken.accessToken;
  }

  const sa = getServiceAccount();
  if (!sa) throw new Error('FCM service account not configured');

  const tokenUri = sa.token_uri || GOOGLE_TOKEN_URI;
  const iat = Math.floor(now / 1000);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(tokenUri)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 3600)
    .sign(key);

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`FCM token exchange failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = {
    accessToken: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return _cachedToken.accessToken;
}

/**
 * Send one message to a single device token. Returns a structured result rather
 * than throwing so the worker can keep going and disable dead tokens. An FCM
 * `UNREGISTERED` / `NOT_FOUND` error means the token is permanently invalid.
 */
export async function sendToToken(token: string, message: FcmMessage): Promise<FcmSendResult> {
  try {
    const accessToken = await getAccessToken();
    const projectId = config.FCM_PROJECT_ID;

    const payload = {
      message: {
        token,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl ? { image: message.imageUrl } : {}),
        },
        data: message.data ?? {},
        android: {
          priority: 'HIGH' as const,
          notification: {
            title: message.title,
            body: message.body,
            sound: 'default',
            notification_priority: 'PRIORITY_HIGH' as const,
            ...(message.imageUrl ? { image: message.imageUrl } : {}),
          },
        },
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) return { token, ok: true, unregistered: false };

    const errText = await res.text().catch(() => '');
    // FCM v1 surfaces a dead token as HTTP 404 with status UNREGISTERED, or 400
    // INVALID_ARGUMENT for a malformed token — both mean "stop using this token".
    const unregistered =
      res.status === 404 ||
      /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/i.test(errText);
    return { token, ok: false, unregistered, error: `HTTP ${res.status}: ${errText}` };
  } catch (err: any) {
    return { token, ok: false, unregistered: false, error: err?.message ?? String(err) };
  }
}
