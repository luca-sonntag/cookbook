import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SendIntent } from 'send-intent';
import { parseSharedUrl } from './utils/shareUrl';

const BRAND_COLOR = '#064e3b';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Theme the native status bar to match the app's brand color and hide the
 * splash screen. Safe to call on web (no-ops off native).
 */
export async function initNativeUi(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark }); // dark background -> light icons
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: BRAND_COLOR });
    }
  } catch (err) {
    console.warn('StatusBar setup failed:', err);
  } finally {
    // Hide the splash once the web layer is ready, regardless of status bar result.
    SplashScreen.hide().catch(() => {});
  }
}

/**
 * Register a handler for Android share intents (ACTION_SEND). Invokes `onUrl`
 * with the first URL found in the shared text. Handles both cold starts and
 * shares received while the app is already running. Returns a cleanup function.
 */
export function registerShareIntent(onUrl: (url: string) => void): () => void {
  if (!isNative()) return () => {};

  const handle = async () => {
    try {
      const result = await SendIntent.checkSendIntentReceived();
      // Shared plain text arrives in `title`; `url` is set for shared links.
      const payload = (result as { url?: string; title?: string })?.url
        ?? (result as { title?: string })?.title;
      if (!payload) return;
      const decoded = decodeURIComponent(payload);
      const url = parseSharedUrl(decoded);
      if (url) onUrl(url);
    } catch {
      // No pending intent — ignore.
    }
  };

  // Cold start (app launched via share) and warm shares (app already open).
  handle();
  window.addEventListener('sendIntentReceived', handle);
  return () => window.removeEventListener('sendIntentReceived', handle);
}
