import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load .env file
dotenv.config();

export interface Config {
  PORT: number;
  APIFY_TOKEN: string;
  /** RapidAPI key for the "Social Download All In One" API (primary social scraper). Optional — falls back to the Apify chain when unset. */
  RAPIDAPI_KEY?: string;
  /** RapidAPI host for the social downloader. */
  RAPIDAPI_SOCIAL_HOST: string;
  /** Actor id (`owner/name` or id) of the first-party social downloader (apify-actor repo). Optional final-fallback provider. */
  APIFY_SOCIAL_ACTOR_ID?: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_TEMPERATURE: number;
  RECIPE_LANGUAGE: string;
  PREFERRED_TEMPERATURE_UNIT: string;
  PREFERRED_UNIT_SYSTEM: string;
  WORKER_CONCURRENCY: number;
  WORKER_LEASE_TIMEOUT_MINUTES: number;
  ROLE: 'web' | 'worker' | 'both';
  MAX_JOBS_PER_USER: number;
  EXTRACTION_LIMIT_WINDOW_DAYS: number;
  FREE_MAX_EXTRACTIONS_PER_WINDOW: number;
  PREMIUM_MAX_EXTRACTIONS_PER_WINDOW: number;
  /** Max number of saved recipes (cookbook entries) a free account may keep. Premium is unlimited. */
  FREE_MAX_SAVED_RECIPES: number;
  BETA_ACTIVE: boolean;
  BETA_MAX_EXTRACTIONS_PER_WINDOW: number;
  BETA_MAX_SAVED_RECIPES: number;
  YTDLP_COOKIES_FILE?: string;
  YTDLP_COOKIES_FROM_BROWSER?: string;
  REVENUECAT_SECRET_KEY?: string;
  ADMIN_EMAILS: string;
  HEALTHCHECK_WEBSITE_URL?: string;
  HEALTHCHECK_BACKEND_URL?: string;
  NTFY_TOPIC?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

// Validation helper
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: Config = {
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  APIFY_TOKEN: getEnv('APIFY_TOKEN'),
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
  RAPIDAPI_SOCIAL_HOST: getEnv('RAPIDAPI_SOCIAL_HOST', 'social-download-all-in-one.p.rapidapi.com'),
  APIFY_SOCIAL_ACTOR_ID: process.env.APIFY_SOCIAL_ACTOR_ID,
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY'),
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: getEnv('SUPABASE_PUBLISHABLE_KEY'),
  SUPABASE_SECRET_KEY: getEnv('SUPABASE_SECRET_KEY'),
  GEMINI_MODEL: getEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
  GEMINI_TEMPERATURE: parseFloat(getEnv('GEMINI_TEMPERATURE', '0')),
  RECIPE_LANGUAGE: getEnv('RECIPE_LANGUAGE', 'German'),
  PREFERRED_TEMPERATURE_UNIT: getEnv('PREFERRED_TEMPERATURE_UNIT', 'Celsius'),
  PREFERRED_UNIT_SYSTEM: getEnv('PREFERRED_UNIT_SYSTEM', 'metric'),
  WORKER_CONCURRENCY: parseInt(getEnv('WORKER_CONCURRENCY', '3'), 10),
  WORKER_LEASE_TIMEOUT_MINUTES: parseInt(getEnv('WORKER_LEASE_TIMEOUT_MINUTES', '10'), 10),
  ROLE: getEnv('ROLE', 'both') as 'web' | 'worker' | 'both',
  MAX_JOBS_PER_USER: parseInt(getEnv('MAX_JOBS_PER_USER', '3'), 10),
  EXTRACTION_LIMIT_WINDOW_DAYS: parseInt(getEnv('EXTRACTION_LIMIT_WINDOW_DAYS', '1'), 10),
  FREE_MAX_EXTRACTIONS_PER_WINDOW: parseInt(getEnv('FREE_MAX_EXTRACTIONS_PER_WINDOW', '3'), 10),
  PREMIUM_MAX_EXTRACTIONS_PER_WINDOW: parseInt(getEnv('PREMIUM_MAX_EXTRACTIONS_PER_WINDOW', '50'), 10),
  FREE_MAX_SAVED_RECIPES: parseInt(getEnv('FREE_MAX_SAVED_RECIPES', '5'), 10),
  BETA_ACTIVE: getEnv('BETA_ACTIVE', 'false') === 'true',
  BETA_MAX_EXTRACTIONS_PER_WINDOW: parseInt(getEnv('BETA_MAX_EXTRACTIONS_PER_WINDOW', '10'), 10),
  BETA_MAX_SAVED_RECIPES: parseInt(getEnv('BETA_MAX_SAVED_RECIPES', '20'), 10),
  YTDLP_COOKIES_FILE: process.env.YTDLP_COOKIES_FILE,
  YTDLP_COOKIES_FROM_BROWSER: process.env.YTDLP_COOKIES_FROM_BROWSER,
  REVENUECAT_SECRET_KEY: process.env.REVENUECAT_SECRET_KEY,
  ADMIN_EMAILS: getEnv('ADMIN_EMAILS', ''),
  HEALTHCHECK_WEBSITE_URL: process.env.HEALTHCHECK_WEBSITE_URL,
  HEALTHCHECK_BACKEND_URL: process.env.HEALTHCHECK_BACKEND_URL,
  NTFY_TOPIC: process.env.NTFY_TOPIC,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
};

/**
 * Returns options for yt-dlp to handle authentication cookies if configured.
 * Automatically detects a 'cookies.txt' file in the workspace root if it exists
 * and no explicit configuration is provided.
 */
export function getYtdlpCookieOptions(): Record<string, string> {
  const opts: Record<string, string> = {};

  if (config.YTDLP_COOKIES_FILE) {
    opts.cookiefile = path.resolve(config.YTDLP_COOKIES_FILE);
  } else {
    // Default fallback to cookies.txt in root directory
    const defaultCookies = path.resolve('cookies.txt');
    if (existsSync(defaultCookies)) {
      opts.cookiefile = defaultCookies;
    }
  }

  if (config.YTDLP_COOKIES_FROM_BROWSER) {
    opts.cookiesFromBrowser = config.YTDLP_COOKIES_FROM_BROWSER;
  }

  return opts;
}

