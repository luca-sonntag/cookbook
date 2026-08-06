import { Capacitor } from '@capacitor/core';

/** Fixed id so re-scheduling replaces the previous pending streak reminder. */
const STREAK_NOTIFICATION_ID = 7301;

export interface StreakReminderMessages {
  title: string;
  body: string;
}

/**
 * Best-effort: schedule a local notification for tomorrow evening reminding the
 * user to keep their cooking streak alive. No-ops on web and whenever the plugin
 * or notification permission is unavailable — the in-app streak display never
 * depends on this.
 */
export async function scheduleStreakReminder(
  _streakDays: number,
  messages: StreakReminderMessages,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    const perm = await LocalNotifications.checkPermissions();
    let granted = perm.display === 'granted';
    if (!granted) {
      const req = await LocalNotifications.requestPermissions();
      granted = req.display === 'granted';
    }
    if (!granted) return;

    // Tomorrow at ~18:00 local time.
    const when = new Date();
    when.setDate(when.getDate() + 1);
    when.setHours(18, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: STREAK_NOTIFICATION_ID,
          title: messages.title,
          body: messages.body,
          schedule: { at: when, allowWhileIdle: true },
        },
      ],
    });
  } catch (err) {
    console.warn('[Streak] Could not schedule reminder:', err);
  }
}
