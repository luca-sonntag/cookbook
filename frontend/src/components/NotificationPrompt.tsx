import { useState } from 'react';
import { Bell, Sparkles, X } from 'lucide-react';
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
    savedCount >= 2 &&
    !isEnabled &&
    !isDismissedInMeta &&
    !dismissedLocally;

  if (!shouldShow) return null;

  const handleDismiss = async () => {
    localStorage.setItem(PROMPT_DISMISSED_STORAGE_KEY, '1');
    setDismissedLocally(true);
    await updateUserMetadata({ notification_prompt_dismissed: true }).catch(() => {});
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
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90 dark:from-emerald-950/95 dark:via-teal-950/95 dark:to-slate-950/95 border border-emerald-500/30 dark:border-emerald-500/20 shadow-lg shadow-emerald-950/20 text-white animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative p-4 flex flex-col gap-3">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-emerald-200/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label={t('notification.prompt.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content header */}
        <div className="flex items-start gap-3 pr-6">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 border border-emerald-400/20 shadow-inner">
            <Bell className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                {t('notification.prompt.badge')}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('notification.prompt.title')}
            </h3>

            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
              {t('notification.prompt.description')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 pl-11">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-950/40 transition-all cursor-pointer text-center"
          >
            {busy ? '...' : t('notification.prompt.enable')}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={busy}
            className="py-2 px-3 bg-white/10 hover:bg-white/15 active:scale-[0.98] disabled:opacity-50 text-emerald-100 text-xs font-medium rounded-xl transition-all cursor-pointer"
          >
            {t('notification.prompt.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
