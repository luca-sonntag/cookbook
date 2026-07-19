import { useState, useEffect } from 'react';
import { Crown, X, Sparkles } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'snagbite_trial_banner_dismissed';

interface TrialBannerProps {
  onOpenPremium: () => void;
}

/**
 * One-time trial banner shown to free users after login.
 * Dismissed state is persisted in localStorage — once dismissed,
 * it never reappears for that user.
 */
export default function TrialBanner({ onOpenPremium }: TrialBannerProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show for premium/beta users
    if (isPremium) return;
    // Already dismissed
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    setVisible(true);
  }, [isPremium]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 dark:from-amber-600 dark:via-amber-500 dark:to-yellow-600 shadow-lg shadow-amber-500/20 border border-amber-300/30 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Ambient glow spots */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-200/30 rounded-full blur-xl pointer-events-none" />

      <div className="relative px-4 py-3.5">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 active:scale-90 transition-all z-10"
          aria-label={t('premium.modal.trialBanner.dismiss')}
        >
          <X className="w-3.5 h-3.5 text-amber-900/70" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-amber-900" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-950 leading-tight">
              {t('premium.modal.trialBanner.title')}
            </h3>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-950/80 mt-1 leading-relaxed">
              {t('premium.modal.trialBanner.body')}
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={() => {
                dismiss();
                onOpenPremium();
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-950 text-amber-100 text-xs font-bold hover:bg-amber-900 active:scale-[0.97] transition-all shadow-sm"
            >
              <Crown className="w-3 h-3" />
              {t('premium.modal.trialBanner.cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}