import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load .env file
dotenv.config();

export interface Config {
  PORT: number;
  APIFY_TOKEN: string;
  GEMINI_API_KEY: string;
  DATABASE_PATH: string;
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
  YTDLP_COOKIES_FILE?: string;
  YTDLP_COOKIES_FROM_BROWSER?: string;
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
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY'),
  DATABASE_PATH: getEnv('DATABASE_PATH', 'database.json'), // Use database.json as the persistent JSON file store
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
  YTDLP_COOKIES_FILE: process.env.YTDLP_COOKIES_FILE,
  YTDLP_COOKIES_FROM_BROWSER: process.env.YTDLP_COOKIES_FROM_BROWSER,
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

