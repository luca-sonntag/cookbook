import { useState } from 'react';
import { Bell, Sparkles, X, Check } from 'lucide-react';
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

  // Criteria:
  // 1. User logged in
  // 2. Saved recipes >= 2
  // 3. Notifications not already enabled
  // 4. Prompt not dismissed (in metadata or localStorage)
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
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 shadow-md shadow-emerald-950/5 dark:shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm">
      {/* Glow background accent */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-emerald-400/20 to-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative p-4 flex flex-col gap-3.5">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          aria-label={t('notification.prompt.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {t('notification.prompt.badge')}
              </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              {t('notification.prompt.title')}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              {t('notification.prompt.description')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5 pl-13">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            {busy ? (
              '...'
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {t('notification.prompt.enable')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="py-2.5 px-4 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 active:scale-[0.98] disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {t('notification.prompt.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
