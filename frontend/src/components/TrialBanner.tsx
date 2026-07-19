import { Crown, X, ChevronRight, Timer } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'snagbite_trial_banner_dismissed';

interface TrialBannerProps {
  onOpenPremium: () => void;
}

/**
 * One-time trial banner shown to free users after login.
 * Renders only when RevenueCat reports a free-trial offering; the
 * displayed "N Tage" badge is derived from the longest trial length
 * across all packages (no hardcoded value). Dismissed state is
 * persisted in localStorage — once dismissed, it never reappears
 * for that user.
 */
export default function TrialBanner({ onOpenPremium }: TrialBannerProps) {
  const { t } = useI18n();
  const { isPremium, hasTrialAvailable, trialDays, trialLoading } = useAuth();

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
  };

  // Show the banner only when RevenueCat has confirmed a trial offering
  // exists, the user hasn't dismissed it, and they aren't already premium.
  const show = !trialLoading
    && !isPremium
    && hasTrialAvailable
    && trialDays > 0
    && typeof window !== 'undefined'
    && localStorage.getItem(STORAGE_KEY) !== '1';

  if (!show) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 border border-emerald-500/20 shadow-md shadow-emerald-900/10 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="relative px-3.5 py-3">
        {/* Dismiss button — subtle white-tinted, matches emerald surface */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all z-10"
          aria-label={t('premium.modal.trialBanner.dismiss')}
        >
          <X className="w-3 h-3 text-white/70" />
        </button>

        <div className="flex items-center gap-3 pr-7">
          {/* Crown icon — same language as PremiumHint */}
          <div className="w-9 h-9 rounded-xl bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Headline row — clear hierarchy: "N Tage" badge + title */}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight truncate">
                {t('premium.modal.trialBanner.title')}
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                <Timer className="w-2.5 h-2.5" />
                {trialDays} {t('premium.modal.trialBanner.days')}
              </span>
            </div>

            {/* Body — single line, trusts the user */}
            <p className="text-[11px] text-emerald-50/80 mt-0.5 leading-snug">
              {t('premium.modal.trialBanner.body')}
            </p>

            {/* Inline CTA — matches the action language of PremiumModal */}
            <button
              type="button"
              onClick={() => {
                dismiss();
                onOpenPremium();
              }}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 active:scale-[0.97] transition-all"
            >
              {t('premium.modal.trialBanner.cta')}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}