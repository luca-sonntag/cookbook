import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { enablePushNotifications } from '../push';
import { isNative } from '../native';

const PROMPT_DISMISSED_STORAGE_KEY = 'snagbite_notification_prompt_dismissed';
const ALL_CATEGORY_IDS = ['seasonal', 'reminders', 'timing', 'taste', 'motivation'];

interface NotificationPromptProps {
  savedCount: number;
}

export default function NotificationPrompt({ savedCount }: NotificationPromptProps) {
  const { t } = useI18n();
  const { user, updateUserMetadata, getAccessToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PROMPT_DISMISSED_STORAGE_KEY) === '1';
  });

  const isEnabled = user?.user_metadata?.notifications_enabled === true;
  const isDismissedInMeta = user?.user_metadata?.notification_prompt_dismissed === true;

  const shouldShow =
    !!user &&
    savedCount >= 0 &&
    !isEnabled &&
    !isDismissedInMeta &&
    !dismissedLocally;

  if (false && !shouldShow) return null;

  const handleDismiss = async () => {
    localStorage.setItem(PROMPT_DISMISSED_STORAGE_KEY, '1');
    setDismissedLocally(true);
    await updateUserMetadata({ notification_prompt_dismissed: true }).catch(() => { });
  };

  const handleEnable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await enablePushNotifications(getAccessToken);
      if (!granted && isNative()) {
        setBusy(false);
        return; // OS permission denied -> do not change state
      }

      const timezone = (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
          return undefined;
        }
      })();

      await updateUserMetadata({
        notifications_enabled: true,
        notification_categories: ALL_CATEGORY_IDS,
        ...(timezone ? { notification_timezone: timezone } : {}),
        notification_prompt_dismissed: true,
      });
      localStorage.setItem(PROMPT_DISMISSED_STORAGE_KEY, '1');
      setDismissedLocally(true);
    } catch (err) {
      console.warn('Failed to enable notifications from prompt:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-4 transition-all">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        aria-label={t('notification.prompt.dismiss')}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-4.5 h-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {t('notification.prompt.title')}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {t('notification.prompt.description')}
          </p>

          <div className="flex items-center gap-3.5 mt-3.5">
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="flex-1 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer text-center"
            >
              {busy ? '...' : t('notification.prompt.enable')}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={busy}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer px-1"
            >
              {t('notification.prompt.later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
