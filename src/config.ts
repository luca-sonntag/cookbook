import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export interface Config {
  PORT: number;
  APIFY_TOKEN: string;
  GEMINI_API_KEY: string;
  DATABASE_PATH: string;
  GEMINI_MODEL: string;
  GEMINI_TEMPERATURE: number;
  RECIPE_LANGUAGE: string;
  API_KEY: string;
  PREFERRED_TEMPERATURE_UNIT: string;
  PREFERRED_UNIT_SYSTEM: string;
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
  GEMINI_MODEL: getEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
  GEMINI_TEMPERATURE: parseFloat(getEnv('GEMINI_TEMPERATURE', '0')),
  RECIPE_LANGUAGE: getEnv('RECIPE_LANGUAGE', 'German'),
  API_KEY: getEnv('API_KEY'),
  PREFERRED_TEMPERATURE_UNIT: getEnv('PREFERRED_TEMPERATURE_UNIT', 'Celsius'),
  PREFERRED_UNIT_SYSTEM: getEnv('PREFERRED_UNIT_SYSTEM', 'metric'),
};

