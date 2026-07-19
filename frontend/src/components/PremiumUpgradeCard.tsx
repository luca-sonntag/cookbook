import { Crown, Sparkles } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

interface PremiumUpgradeCardProps {
  onUpgradeClick: () => void;
  className?: string;
}

export default function PremiumUpgradeCard({ onUpgradeClick, className = '' }: PremiumUpgradeCardProps) {
  const { t } = useI18n();
  const { user, isPremiumOverride } = useAuth();
  const isRealPremium = user?.app_metadata?.tier === 'premium' || isPremiumOverride;

  if (isRealPremium) return null;

  return (
    <div
      onClick={onUpgradeClick}
      className={`cursor-pointer p-5 bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-3xl border border-emerald-500/20 shadow-md text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:brightness-[1.02] active:scale-[0.99] transition-all relative overflow-hidden group ${className}`}
    >
      <div className="z-10">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
          Snagbite Premium
        </h3>
        <p className="text-xs text-emerald-100/90 mt-1 max-w-sm">
          {t('app.settings.premiumCardDesc') || 'Unlock unlimited recipe extractions, advanced remix capabilities, and smart shopping lists.'}
        </p>
      </div>
      <div
        className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md active:scale-95 transition-all self-start sm:self-auto flex items-center gap-1.5 shrink-0 z-10"
      >
        <Crown className="w-3.5 h-3.5" />
        {t('app.settings.upgradePremium') || 'Upgrade to Premium'}
      </div>
    </div>
  );
}
