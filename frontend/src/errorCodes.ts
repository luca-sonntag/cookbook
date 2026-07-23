/**
 * Frontend counterpart to `backend/src/errors.ts`: the machine-readable error
 * code registry. This module is intentionally message-free — it only knows the
 * set of codes and how to (de)serialize the transport/persisted envelope. The
 * localized copy for every code lives in the i18n dictionary (`uiTranslations`
 * under `error.codes.*`) and is resolved by `messageForCode` in `i18n.ts`.
 *
 * IMPORTANT: keep this list in sync with `AppErrorCode` in the backend and with
 * the `error.codes.*` entries in `i18n.ts`. A code with no i18n entry falls back
 * to a friendly generic message (never a raw dump), so an unmapped code degrades
 * gracefully rather than leaking internals.
 */
export type AppErrorCode =
  | 'MISSING_FIELD'
  | 'INVALID_FIELD'
  | 'INVALID_URL'
  | 'YOUTUBE_SHORTS_ONLY'
  | 'REMIX_PROMPT_TOO_LONG'
  | 'MESSAGE_TOO_LONG'
  | 'TOO_MANY_SCREENSHOTS'
  | 'SCREENSHOTS_TOO_LARGE'
  | 'PARENT_JOB_NOT_COMPLETED'
  | 'UNAUTHORIZED'
  | 'PREMIUM_REQUIRED'
  | 'COOKBOOK_FULL'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACTIVE_JOB_EXISTS'
  | 'TOO_MANY_REQUESTS'
  | 'JOB_NOT_FOUND'
  | 'RECIPE_NOT_FOUND'
  | 'COLLECTION_NOT_FOUND'
  | 'PARENT_JOB_NOT_FOUND'
  | 'SCRAPE_FAILED'
  | 'SCRAPE_TIMEOUT'
  | 'VIDEO_TOO_LONG'
  | 'MEDIA_DOWNLOAD_FAILED'
  | 'NOT_A_RECIPE'
  | 'WEBSITE_NO_RECIPE'
  | 'EXTRACTION_FAILED'
  | 'UNRELATED_REMIX_REQUEST'
  | 'REVENUECAT_FAILED'
  | 'PROFILE_UPDATE_FAILED'
  | 'CHAT_CHIPS_FAILED'
  | 'REMIX_CONFIRM_FAILED'
  | 'CHAT_FAILED'
  | 'ACCOUNT_DELETE_FAILED'
  | 'INTERNAL_ERROR';

export type ErrorParams = Record<string, string | number>;

/** Transport/persisted shape emitted by the backend for async job failures. */
export interface SerializedError {
  code: AppErrorCode;
  params?: ErrorParams;
}

/** The complete set of known error codes (single source of truth on the client). */
export const ALL_ERROR_CODES: readonly AppErrorCode[] = [
  'MISSING_FIELD',
  'INVALID_FIELD',
  'INVALID_URL',
  'YOUTUBE_SHORTS_ONLY',
  'REMIX_PROMPT_TOO_LONG',
  'MESSAGE_TOO_LONG',
  'TOO_MANY_SCREENSHOTS',
  'SCREENSHOTS_TOO_LARGE',
  'PARENT_JOB_NOT_COMPLETED',
  'UNAUTHORIZED',
  'PREMIUM_REQUIRED',
  'COOKBOOK_FULL',
  'RATE_LIMIT_EXCEEDED',
  'ACTIVE_JOB_EXISTS',
  'TOO_MANY_REQUESTS',
  'JOB_NOT_FOUND',
  'RECIPE_NOT_FOUND',
  'COLLECTION_NOT_FOUND',
  'PARENT_JOB_NOT_FOUND',
  'SCRAPE_FAILED',
  'SCRAPE_TIMEOUT',
  'VIDEO_TOO_LONG',
  'MEDIA_DOWNLOAD_FAILED',
  'NOT_A_RECIPE',
  'WEBSITE_NO_RECIPE',
  'EXTRACTION_FAILED',
  'UNRELATED_REMIX_REQUEST',
  'REVENUECAT_FAILED',
  'PROFILE_UPDATE_FAILED',
  'CHAT_CHIPS_FAILED',
  'REMIX_CONFIRM_FAILED',
  'CHAT_FAILED',
  'ACCOUNT_DELETE_FAILED',
  'INTERNAL_ERROR',
];

const ERROR_CODE_SET = new Set<string>(ALL_ERROR_CODES);

/** True when `code` is a known {@link AppErrorCode}. */
export function isKnownErrorCode(code: string): code is AppErrorCode {
  return ERROR_CODE_SET.has(code);
}

/**
 * Attempts to parse a persisted job `error` string as a {@link SerializedError}
 * envelope (`{"code":...,"params":...}`). Returns null when the string is not an
 * envelope (legacy raw text, an i18n key, or a bare code).
 */
export function parseSerializedError(raw: string): SerializedError | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && typeof (parsed as any).code === 'string') {
      return parsed as SerializedError;
    }
  } catch {
    /* not JSON — fall through */
  }
  return null;
}
