import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { enablePushNotifications, disablePushNotifications } from '../push';
import { isNative } from '../native';

// The five opt-in groups. Ids match the backend NotificationCategory union.
const CATEGORY_IDS = ['seasonal', 'reminders', 'timing', 'taste', 'motivation'] as const;
type CategoryId = (typeof CATEGORY_IDS)[number];

const CATEGORY_LABELS: Record<CategoryId, { de: string; en: string; descDe: string; descEn: string }> = {
  seasonal: {
    de: 'Saisonales & Anlässe', en: 'Seasonal & occasions',
    descDe: 'Passend zu Jahreszeit und Feiertagen', descEn: 'Matched to the season and holidays',
  },
  reminders: {
    de: 'Erinnerungen', en: 'Reminders',
    descDe: 'Gespeicherte Rezepte, die auf dich warten', descEn: 'Saved recipes waiting for you',
  },
  timing: {
    de: 'Zeit & Wochentag', en: 'Time & weekday',
    descDe: 'Ideen passend zu Tag und Uhrzeit', descEn: 'Ideas that fit the day and time',
  },
  taste: {
    de: 'Auf deinen Geschmack', en: 'Your taste',
    descDe: 'Passend zu deinen Lieblingszutaten & -küchen', descEn: 'Based on your favorite ingredients & cuisines',
  },
  motivation: {
    de: 'Meilensteine & Motivation', en: 'Milestones & motivation',
    descDe: 'Kleine Anstöße und Erfolge', descEn: 'Little nudges and wins',
  },
};

function Toggle({ on, onClick, disabled, label }: { on: boolean; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none border-2 shrink-0 disabled:opacity-50 disabled:pointer-events-none ${
        on ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const { language } = useI18n();
  const { user, updateUserMetadata, getAccessToken } = useAuth();
  const isDe = language === 'de';
  const [busy, setBusy] = useState(false);

  const enabled = user?.user_metadata?.notifications_enabled === true;
  const rawCategories = user?.user_metadata?.notification_categories;
  const categories: Set<CategoryId> = new Set(
    Array.isArray(rawCategories) && rawCategories.length > 0
      ? (rawCategories.filter((c: string) => (CATEGORY_IDS as readonly string[]).includes(c)) as CategoryId[])
      : CATEGORY_IDS,
  );

  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  })();

  const handleMasterToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!enabled) {
        // Ask the OS for permission and register the device before persisting.
        const granted = await enablePushNotifications(getAccessToken);
        if (!granted && isNative()) {
          setBusy(false);
          return; // permission denied -> stay off
        }
        await updateUserMetadata({
          notifications_enabled: true,
          notification_categories: Array.from(categories),
          ...(timezone ? { notification_timezone: timezone } : {}),
        });
      } else {
        await disablePushNotifications(getAccessToken);
        await updateUserMetadata({ notifications_enabled: false });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCategoryToggle = async (id: CategoryId) => {
    if (busy) return;
    const next = new Set(categories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBusy(true);
    try {
      await updateUserMetadata({ notification_categories: Array.from(next) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {isDe ? 'Benachrichtigungen' : 'Notifications'}
      </h3>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden mx-2">
        {/* Master toggle */}
        <div className="p-4 flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {isDe ? 'Smarte Rezept-Tipps' : 'Smart recipe tips'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                {isDe
                  ? 'Persönliche Ideen aus deinem Kochbuch – nie spammy'
                  : 'Personal ideas from your cookbook – never spammy'}
              </p>
            </div>
          </div>
          <Toggle on={enabled} onClick={handleMasterToggle} disabled={busy} label="Toggle notifications" />
        </div>

        {/* Category toggles (only when enabled) */}
        {enabled &&
          CATEGORY_IDS.map((id, idx) => {
            const labels = CATEGORY_LABELS[id];
            return (
              <div
                key={id}
                className={`p-4 flex items-center justify-between gap-3 ${
                  idx < CATEGORY_IDS.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {isDe ? labels.de : labels.en}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                    {isDe ? labels.descDe : labels.descEn}
                  </p>
                </div>
                <Toggle
                  on={categories.has(id)}
                  onClick={() => handleCategoryToggle(id)}
                  disabled={busy}
                  label={`Toggle ${id}`}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}
