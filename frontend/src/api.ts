// Base URL for backend API calls.
//
// On the web build this is empty, so calls stay relative (e.g. "/api/jobs")
// and go through Vite's dev proxy / same-origin in production.
//
// In native builds (Capacitor) the webview is served from capacitor://localhost
// (iOS) or http://localhost (Android), so relative paths would hit the local
// bundle instead of the backend. Set VITE_API_BASE_URL to your production
// backend origin (e.g. https://api.kochbuddy.app) for native builds.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/**
 * Resolve an API path (e.g. "/api/jobs") to an absolute URL when a base URL is
 * configured, otherwise leave it relative for same-origin web requests.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
