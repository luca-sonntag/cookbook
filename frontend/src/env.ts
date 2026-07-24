// Centralized, typed access to the Vite env flags that configure the dev /
// preview experience. Keeping them here (instead of reading import.meta.env
// ad-hoc) makes it obvious which flags exist and keeps the auth bypass in a
// single, greppable place.

/**
 * When `true`, the app auto-signs-in with a seeded test user on startup instead
 * of showing the login form. Set ONLY in dev / preview builds via
 * `VITE_TEST_LOGIN=true` (see `.env.development`). It is never set in the
 * production / Play Store build, so the auto-login code below is dead code there.
 */
const TEST_LOGIN_FLAG = import.meta.env.VITE_TEST_LOGIN === 'true';

/** Test-user credentials. Injected as build variables / `.env.development.local` — never committed. */
export const TEST_USER_EMAIL = import.meta.env.VITE_TEST_USER_EMAIL as string | undefined;
export const TEST_USER_PASSWORD = import.meta.env.VITE_TEST_USER_PASSWORD as string | undefined;

/**
 * Auto-login is only active when the flag is on AND credentials are present, so
 * a misconfigured build (flag on, no creds) falls back to the normal login form
 * rather than crashing.
 */
export const TEST_LOGIN_ENABLED = TEST_LOGIN_FLAG && !!TEST_USER_EMAIL && !!TEST_USER_PASSWORD;
