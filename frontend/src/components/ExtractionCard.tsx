import { BookOpen, Video } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import PremiumHint from './PremiumHint';

interface ExtractionCardProps {
  limitStatus: {
    limit: number;
    used: number;
    remaining: number;
    windowDays: number;
    savedRecipes: number;
    maxSavedRecipes: number;
    cookbookFull: boolean;
  } | null;
  onUpgradeClick: () => void;
  className?: string;
}

export default function ExtractionCard({ limitStatus, onUpgradeClick, className = '' }: ExtractionCardProps) {
  const { t } = useI18n();
  const { isPremium, isPremiumOverride } = useAuth();
  const isRealPremium = isPremium || isPremiumOverride;

  if (!limitStatus) return null;

  const { limit, used, remaining, windowDays, savedRecipes, maxSavedRecipes, cookbookFull } = limitStatus;
  const extractionLimitReached = !isRealPremium && limit >= 0 && remaining <= 0;

  // Calculate percentages for progress bars
  const recipesPercent = Math.min(100, Math.max(0, (savedRecipes / maxSavedRecipes) * 100));
  const extractionsPercent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  return (
    <div className={`p-5 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-3xl shadow-sm flex flex-col gap-4 relative overflow-hidden ${className}`}>
      <h3 className="text-sm font-bold text-gray-955 dark:text-white flex items-center gap-2">
        <Video className="w-4 h-4 text-emerald-500" />
        {t('app.settings.limits') || 'Usage & Limits'}
      </h3>

      {/* Saved Recipes Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {t('app.settings.savedRecipesLimit') || 'Saved Recipes'}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            {savedRecipes} / {maxSavedRecipes}
          </span>
        </div>
        <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              cookbookFull ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${recipesPercent}%` }}
          />
        </div>
      </div>

      {/* Extractions Limit Progress */}
      {limit >= 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              {windowDays === 1 
                ? t('form.remainingExtractionsToday') || 'Extractions Today'
                : t('form.remainingExtractionsDays', { days: windowDays }) || `Extractions (${windowDays}d)`
              }
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {remaining} / {limit} {t('form.remaining') || 'remaining'}
            </span>
          </div>
          <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                extractionLimitReached ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${100 - extractionsPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Premium Upgrade Promotion when limit reached or cookbook full */}
      {!isRealPremium && (cookbookFull || extractionLimitReached) && (
        <div className="mt-2">
          <PremiumHint
            variant="banner"
            onClick={onUpgradeClick}
            label={
              cookbookFull
                ? t('premium.hint.catalogFull', { count: savedRecipes, limit: maxSavedRecipes })
                : t('premium.hint.extractionLimitReached', { used, limit })
            }
            cta={t('premium.hint.upgrade')}
          />
        </div>
      )}
    </div>
  );
}
