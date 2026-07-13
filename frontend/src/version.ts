// App version, injected at build time from android/version.properties via
// Vite's `define` (see vite.config.ts). This is the same versionName/versionCode
// the release pipeline bumps and the Play Store build reports, so the value
// shown in-app and attached to bug reports stays accurate across releases.
declare const __APP_VERSION__: string;
declare const __APP_BUILD__: string;

/** Marketing version, e.g. "1.0.1". */
export const APP_VERSION = __APP_VERSION__;

/** Build/version code, e.g. "11". */
export const APP_BUILD = __APP_BUILD__;

/** Human-readable label, e.g. "v1.0.1 (11)". */
export const APP_VERSION_LABEL = `v${APP_VERSION} (${APP_BUILD})`;
