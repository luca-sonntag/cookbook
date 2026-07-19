import { useState, useEffect } from 'react';
import { Crown, X, Gift } from 'lucide-react';
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
    if (isPremium) return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    setVisible(true);
  }, [isPremium]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 border border-emerald-500/20 shadow-md shadow-emerald-900/10 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="relative px-4 py-3">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/15 hover:bg-black/25 active:scale-90 transition-all z-10"
          aria-label={t('premium.modal.trialBanner.dismiss')}
        >
          <X className="w-3.5 h-3.5 text-emerald-50/80" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          {/* Icon: amber crown in soft ring — matches PremiumHint language */}
          <div className="w-9 h-9 rounded-xl bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-white leading-tight">
                {t('premium.modal.trialBanner.title')}
              </h3>
              <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            </div>
            <p className="text-[11px] text-emerald-50/80 mt-0.5 leading-snug">
              {t('premium.modal.trialBanner.body')}
            </p>

            {/* CTA — same gold-on-emerald pattern as PremiumHint */}
            <button
              type="button"
              onClick={() => {
                dismiss();
                onOpenPremium();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.97] transition-all shadow-sm"
            >
              {t('premium.modal.trialBanner.cta')} ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}