import type { SupportedLanguage } from './i18n';

/**
 * Frontend counterpart to `backend/src/errors.ts`. Maps every machine-readable
 * error code to a localized (DE/EN) message, with structured `params`
 * interpolation. The backend only ever sends a code (+params) — as a JSON
 * envelope persisted on a job's `error`, or as `code`/`params` fields on an API
 * response — and this module turns it into human text in the active language.
 *
 * IMPORTANT: keep this list in sync with `AppErrorCode` in the backend. A code
 * with no entry here falls back to a friendly generic message (never a raw
 * dump), so an unmapped code degrades gracefully rather than leaking internals.
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

type MessageBuilder = (p: ErrorParams, lang: SupportedLanguage) => string;

/** A generic, friendly, never-technical fallback per language. */
function genericMessage(lang: SupportedLanguage): string {
  return lang === 'de'
    ? 'Beim Erstellen des Rezepts ist ein Fehler aufgetreten. Bitte versuche es erneut.'
    : 'Something went wrong while creating the recipe. Please try again.';
}

/** Humanizes the rate-limit "try again in N minutes" tail. */
function retryAfter(minutes: number, lang: SupportedLanguage): string {
  if (!minutes || minutes <= 0) {
    return lang === 'de' ? 'Bitte versuche es später erneut.' : 'Please try again later.';
  }
  if (minutes >= 1440) {
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    if (lang === 'de') {
      const dayStr = d === 1 ? '1 Tag' : `${d} Tagen`;
      return `Bitte versuche es in ${dayStr}${h > 0 ? ` und ${h} Std.` : ''} erneut.`;
    }
    const dayStr = d === 1 ? '1 day' : `${d} days`;
    return `Please try again in ${dayStr}${h > 0 ? ` and ${h} hr.` : ''}.`;
  }
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (lang === 'de') {
      return m > 0
        ? `Bitte versuche es in ${h} Std. und ${m} Min. erneut.`
        : `Bitte versuche es in ${h} Std. erneut.`;
    }
    return m > 0 ? `Please try again in ${h} hr. and ${m} min.` : `Please try again in ${h} hr.`;
  }
  return lang === 'de'
    ? `Bitte versuche es in ${minutes} Min. erneut.`
    : `Please try again in ${minutes} min.`;
}

/** Premium-gated features have per-feature copy so the ask is specific. */
const PREMIUM_FEATURE_TEXT: Record<string, { de: string; en: string }> = {
  remix: {
    de: 'Rezept Remix ist eine Premium-Funktion. Hol dir Premium, um Rezepte anzupassen.',
    en: 'Recipe Remix is a premium feature. Upgrade to Premium to customize recipes.',
  },
  chat: {
    de: 'Der KI-Küchenchef-Chat ist eine Premium-Funktion. Hol dir Premium, um mit dem Rezept-Copilot zu chatten.',
    en: 'AI Kitchen Chef chat is a premium feature. Upgrade to Premium to chat with Recipe Copilot.',
  },
  collections: {
    de: 'Sammlungen sind eine Premium-Funktion. Hol dir Premium, um sie zu nutzen.',
    en: 'Collections are a premium feature. Upgrade to Premium to use them.',
  },
  tags: {
    de: 'Eigene Tags sind eine Premium-Funktion. Hol dir Premium, um sie zu nutzen.',
    en: 'Custom tags are a premium feature. Upgrade to Premium to use them.',
  },
};

/** Field name → friendly label for MISSING_FIELD / INVALID_FIELD messages. */
const FIELD_LABELS: Record<string, { de: string; en: string }> = {
  url: { de: 'Der Link', en: 'The link' },
  prompt: { de: 'Der Text', en: 'The text' },
  message: { de: 'Die Nachricht', en: 'The message' },
  modificationRequest: { de: 'Die Änderung', en: 'The change request' },
};

function fieldLabel(field: string, lang: SupportedLanguage): string {
  const known = FIELD_LABELS[field];
  if (known) return lang === 'de' ? known.de : known.en;
  return lang === 'de' ? 'Eine Angabe' : 'A field';
}

/**
 * The code → message registry. Each builder receives interpolation params and
 * the active language. Messages are user-facing, friendly, and never leak
 * technical detail.
 */
export const ERROR_MESSAGES: Record<AppErrorCode, MessageBuilder> = {
  MISSING_FIELD: (p, lang) =>
    lang === 'de'
      ? `${fieldLabel(String(p.field ?? ''), lang)} fehlt. Bitte überprüfe deine Eingabe.`
      : `${fieldLabel(String(p.field ?? ''), lang)} is missing. Please check your input.`,
  INVALID_FIELD: (p, lang) =>
    lang === 'de'
      ? `${fieldLabel(String(p.field ?? ''), lang)} ist ungültig. Bitte überprüfe deine Eingabe.`
      : `${fieldLabel(String(p.field ?? ''), lang)} is invalid. Please check your input.`,
  INVALID_URL: (_p, lang) =>
    lang === 'de'
      ? 'Ungültiger Link. Bitte gib einen gültigen Instagram-, TikTok-, YouTube-Shorts- oder Website-Link ein.'
      : 'Invalid link. Please enter a valid Instagram, TikTok, YouTube Shorts, or website link.',
  YOUTUBE_SHORTS_ONLY: (_p, lang) =>
    lang === 'de'
      ? 'Es werden nur YouTube Shorts unterstützt, keine regulären YouTube-Videos.'
      : 'Only YouTube Shorts are supported, not regular YouTube videos.',
  REMIX_PROMPT_TOO_LONG: (p, lang) =>
    lang === 'de'
      ? `Der Remix-Text darf maximal ${p.max ?? 250} Zeichen lang sein.`
      : `The remix text must not exceed ${p.max ?? 250} characters.`,
  MESSAGE_TOO_LONG: (p, lang) =>
    lang === 'de'
      ? `Die Nachricht ist zu lang (max. ${p.max ?? 4000} Zeichen).`
      : `The message is too long (max ${p.max ?? 4000} characters).`,
  TOO_MANY_SCREENSHOTS: (p, lang) =>
    lang === 'de'
      ? `Zu viele Screenshots (max. ${p.max ?? 6}).`
      : `Too many screenshots (max ${p.max ?? 6}).`,
  SCREENSHOTS_TOO_LARGE: (_p, lang) =>
    lang === 'de'
      ? 'Die Screenshots sind zu groß. Bitte verwende kleinere Bilder.'
      : 'The screenshots are too large. Please use smaller images.',
  PARENT_JOB_NOT_COMPLETED: (_p, lang) =>
    lang === 'de'
      ? 'Das Ursprungsrezept ist noch nicht fertig. Bitte warte, bis es abgeschlossen ist.'
      : 'The original recipe is not ready yet. Please wait until it finishes.',
  UNAUTHORIZED: (_p, lang) =>
    lang === 'de'
      ? 'Nicht autorisiert. Bitte melde dich erneut an.'
      : 'Unauthorized. Please sign in again.',
  PREMIUM_REQUIRED: (p, lang) => {
    const feature = PREMIUM_FEATURE_TEXT[String(p.feature ?? '')];
    if (feature) return lang === 'de' ? feature.de : feature.en;
    return lang === 'de'
      ? 'Das ist eine Premium-Funktion. Hol dir Premium, um sie zu nutzen.'
      : 'This is a premium feature. Upgrade to Premium to use it.';
  },
  COOKBOOK_FULL: (p, lang) => {
    const countStr = p.count != null && p.limit != null ? `${p.count}/${p.limit}` : `${p.limit ?? ''}`;
    return lang === 'de'
      ? `Kochbuch voll (${countStr}). Lösche ein Rezept oder hol dir Premium, um weitere Rezepte zu extrahieren.`
      : `Cookbook full (${countStr}). Delete a recipe or upgrade to Premium to extract more.`;
  },
  RATE_LIMIT_EXCEEDED: (p, lang) => {
    const limit = p.limit ?? 10;
    const days = Number(p.days ?? 1);
    const minutes = Number(p.minutes ?? 0);
    const daysStr = days === 1 ? (lang === 'de' ? 'Tag' : 'day') : (lang === 'de' ? `${days} Tagen` : `${days} days`);
    return lang === 'de'
      ? `Du hast dein Limit von ${limit} Rezept-Extraktionen pro ${daysStr} erreicht. ${retryAfter(minutes, lang)}`
      : `You have reached your limit of ${limit} recipe extractions per ${daysStr}. ${retryAfter(minutes, lang)}`;
  },
  ACTIVE_JOB_EXISTS: (p, lang) =>
    lang === 'de'
      ? `Du hast bereits ${p.count ?? 1} laufende Extraktion(en). Bitte warte, bis diese abgeschlossen sind.`
      : `You already have ${p.count ?? 1} extraction(s) in progress. Please wait for them to finish.`,
  TOO_MANY_REQUESTS: (_p, lang) =>
    lang === 'de'
      ? 'Zu viele Anfragen. Bitte versuche es später noch einmal.'
      : 'Too many requests. Please try again later.',
  JOB_NOT_FOUND: (_p, lang) =>
    lang === 'de' ? 'Rezept nicht gefunden.' : 'Recipe not found.',
  RECIPE_NOT_FOUND: (_p, lang) =>
    lang === 'de' ? 'Rezept nicht gefunden.' : 'Recipe not found.',
  COLLECTION_NOT_FOUND: (_p, lang) =>
    lang === 'de' ? 'Sammlung nicht gefunden.' : 'Collection not found.',
  PARENT_JOB_NOT_FOUND: (_p, lang) =>
    lang === 'de' ? 'Ursprungsrezept nicht gefunden.' : 'Original recipe not found.',
  SCRAPE_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Aus diesem Link konnte kein Rezept geladen werden. Das Video ist möglicherweise privat, wurde gelöscht oder wird nicht unterstützt. Bitte überprüfe den Link oder versuche es mit einem anderen Beitrag.'
      : "We couldn't load a recipe from this link. The video may be private, deleted, or unsupported. Please check the link or try another post.",
  SCRAPE_TIMEOUT: (_p, lang) =>
    lang === 'de'
      ? 'Zeitüberschreitung beim Laden des Videos. Bitte versuche es in einem Moment noch einmal.'
      : 'The video took too long to load. Please try again in a moment.',
  VIDEO_TOO_LONG: (p, lang) => {
    const sec = Number(p.maxSeconds ?? 0);
    const label = sec > 0
      ? sec % 60 === 0
        ? lang === 'de' ? `${sec / 60} Minuten` : `${sec / 60} minutes`
        : lang === 'de' ? `${sec} Sekunden` : `${sec} seconds`
      : null;
    return lang === 'de'
      ? label ? `Das Video ist zu lang. Es sind maximal ${label} erlaubt.` : 'Das Video ist zu lang.'
      : label ? `The video is too long. The maximum allowed length is ${label}.` : 'The video is too long.';
  },
  MEDIA_DOWNLOAD_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Die Mediendatei konnte nicht heruntergeladen werden. Bitte versuche es noch einmal.'
      : 'Failed to download the media file. Please try again.',
  NOT_A_RECIPE: (_p, lang) =>
    lang === 'de'
      ? 'In diesem Video wurde kein Rezept erkannt. Bitte versuche es mit einem Rezept-Video.'
      : 'No recipe was found in this video. Please try a recipe video.',
  WEBSITE_NO_RECIPE: (_p, lang) =>
    lang === 'de'
      ? 'Auf dieser Website konnte kein Rezept gefunden werden.'
      : 'Could not find a recipe on this website.',
  EXTRACTION_FAILED: (_p, lang) => genericMessage(lang),
  UNRELATED_REMIX_REQUEST: (_p, lang) =>
    lang === 'de'
      ? 'Ungültige Anfrage: Die KI hat keine Rezeptänderung im eingegebenen Text erkannt.'
      : 'Invalid request: the AI did not recognize any recipe modification in the text.',
  REVENUECAT_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Der Abo-Status konnte nicht abgerufen werden. Bitte versuche es später erneut.'
      : 'Could not fetch your subscription status. Please try again later.',
  PROFILE_UPDATE_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Dein Profil konnte nicht aktualisiert werden. Bitte versuche es später erneut.'
      : 'Could not update your profile. Please try again later.',
  CHAT_CHIPS_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Die Vorschläge konnten nicht geladen werden. Bitte versuche es später erneut.'
      : 'Could not load suggestions. Please try again later.',
  REMIX_CONFIRM_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Der Remix konnte nicht bestätigt werden. Bitte versuche es später erneut.'
      : 'Could not confirm the remix. Please try again later.',
  CHAT_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Der Chat ist fehlgeschlagen. Bitte versuche es später erneut.'
      : 'The chat failed. Please try again later.',
  ACCOUNT_DELETE_FAILED: (_p, lang) =>
    lang === 'de'
      ? 'Dein Konto konnte nicht gelöscht werden. Bitte versuche es später erneut.'
      : 'Could not delete your account. Please try again later.',
  INTERNAL_ERROR: (_p, lang) =>
    lang === 'de'
      ? 'Ein interner Serverfehler ist aufgetreten. Bitte versuche es später erneut.'
      : 'An internal server error occurred. Please try again later.',
};

/** True when `code` is a known {@link AppErrorCode}. */
export function isKnownErrorCode(code: string): code is AppErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code);
}

/** Builds the localized message for a code + params, with a safe generic fallback. */
export function messageForCode(
  code: string | null | undefined,
  params: ErrorParams | undefined,
  lang: SupportedLanguage,
): string {
  if (code && isKnownErrorCode(code)) {
    return ERROR_MESSAGES[code](params ?? {}, lang);
  }
  return genericMessage(lang);
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
