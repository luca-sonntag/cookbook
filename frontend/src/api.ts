import { isNative } from './native';

// Base URL for backend API calls.
//
// On the web build this is empty, so calls stay relative (e.g. "/api/jobs")
// and go through Vite's dev proxy / same-origin in production.
//
// In native builds (Capacitor) the webview is served from capacitor://localhost
// (iOS) or http://localhost (Android), so relative paths would hit the local
// bundle instead of the backend. We use VITE_API_BASE_URL (from .env.development
// or .env.production) with fallback to the Railway dev/prod origins.

const rawApiBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

const defaultNativeOrigin = import.meta.env.DEV
  ? 'https://cookbook-development.up.railway.app'
  : 'https://cookbook-production-8769.up.railway.app';

const API_BASE_URL = rawApiBase || (isNative() ? defaultNativeOrigin : '');

/**
 * Resolve an API path (e.g. "/api/jobs") to an absolute URL when a base URL is
 * configured (or in native builds), otherwise leave it relative for same-origin web requests.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
