import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';
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

// ─── Local Notifications ──────────────────────────────────────────────────────

const TIMER_NOTIFICATION_ID = 1;

/**
 * Ask the OS for permission to post local notifications (Android 13+ / iOS).
 * No-op returning `false` on web — callers fall back to the Web Notification API.
 */
export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch (err) {
    console.warn('LocalNotifications permission request failed:', err);
    return false;
  }
}

/**
 * Show an immediate native local notification for a finished cooking timer.
 * The recipe/step are stored in `extra` so a tap can route back to the step.
 * Returns `false` if not on native or if delivery failed (caller may fall back).
 */
export async function sendNativeNotification(
  title: string,
  body: string,
  recipeId?: string,
  stepNum?: number,
): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const granted = await requestNativeNotificationPermission();
    if (!granted) return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: TIMER_NOTIFICATION_ID,
          title,
          body,
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_launcher',
          ongoing: false,
          extra: { recipeId, stepNum },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error('sendNativeNotification failed:', err);
    return false;
  }
}

/**
 * Register a handler for taps on native local notifications. Invokes `onTap`
 * with the recipe/step stored in the notification's `extra`. Returns a cleanup
 * function. No-op on web.
 */
export function registerNotificationTap(
  onTap: (recipeId?: string, stepNum?: number) => void,
): () => void {
  if (!isNative()) return () => {};

  const handlePromise = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const extra = (action.notification.extra ?? {}) as {
        recipeId?: string;
        stepNum?: number;
      };
      onTap(extra.recipeId, extra.stepNum);
    },
  );

  return () => {
    handlePromise.then((handle) => handle.remove()).catch(() => {});
  };
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
