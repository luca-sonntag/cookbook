import { useState } from 'react';
import { Camera, Utensils } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import CookedModal from './CookedModal';

interface CookedButtonProps {
  jobId: string;
  recipeTitle?: string;
  viaCookingMode?: boolean;
  className?: string;
  variant?: 'card' | 'compact' | 'dock';
}

/**
 * "I cooked this" call-to-action with mandatory photo verification.
 * Renders in different variants:
 * - 'card': A prominent end-of-recipe card.
 * - 'dock': An icon button inside the floating action dock.
 * - 'compact': A full-width standalone button.
 */
export default function CookedButton({
  jobId,
  recipeTitle,
  viaCookingMode,
  className = '',
  variant = 'compact',
}: CookedButtonProps) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {variant === 'card' ? (
        <div className={`rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-gray-900 to-teal-950/40 p-5 text-center shadow-lg ${className}`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
            <Utensils className="h-6 w-6" />
          </div>
          <h4 className="text-base font-extrabold text-white">
            {t('app.gamification.cookedCardTitle')}
          </h4>
          <p className="mt-1 text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
            {t('app.gamification.cookedCardSubtitle')}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-5 py-3 font-bold text-sm text-gray-950 shadow-md active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-gray-950" />
            <span>{t('app.gamification.cookedCardBtn')}</span>
          </button>
        </div>
      ) : variant === 'dock' ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`relative p-3 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 outline-none border-none group ${className}`}
          title={t('app.gamification.cookedCardBtn')}
          aria-label={t('app.gamification.cookedCardBtn')}
        >
          <Camera className="w-5.5 h-5.5 group-hover:scale-110 transition-transform text-emerald-500 dark:text-emerald-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-4 font-semibold text-white shadow-lg active:scale-[0.98] transition-all ${className}`}
        >
          <Camera className="h-5 w-5" />
          <span>{t('app.gamification.cookedCardBtn')}</span>
        </button>
      )}

      <CookedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobId={jobId}
        recipeTitle={recipeTitle}
        viaCookingMode={viaCookingMode}
      />
    </>
  );
}
