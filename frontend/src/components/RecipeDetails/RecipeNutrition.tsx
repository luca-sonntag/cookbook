import { useState } from 'react';
import AiNotice from '../AiNotice';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import PremiumModal from '../PremiumModal';
import { Lock, Flame } from 'lucide-react';

interface RecipeNutritionProps {
  nutritionalValues: any;
  isAiEstimated: boolean;
  showTotalNutrition?: boolean;
  onToggleTotalNutrition?: (isTotal: boolean) => void;
  getNutritionDisplayValue: (val: any, unit?: string, isTotal?: boolean, includeUnit?: boolean) => string;
}

export default function RecipeNutrition({
  nutritionalValues,
  isAiEstimated,
  getNutritionDisplayValue
}: RecipeNutritionProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const statLabel =
    'text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500';

  return (
    <>
      <div
        onClick={() => !isPremium && setIsPremiumModalOpen(true)}
        className={`relative px-4.5 py-3.5 sm:px-5 sm:py-4 transition-all duration-300 ${
          !isPremium ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''
        }`}
      >
        {/* Top Header Row: Flame Icon + NÄHRWERTE label on left, pro Portion on right */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className={statLabel}>
              {t('recipe.nutritionTitle')}
            </span>
            {isAiEstimated && isPremium && <AiNotice type="badge" />}
          </div>

          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded select-none flex-shrink-0">
            {t('recipe.nutritionPerServing')}
          </span>
        </div>

        {/* 4 Nutritional Values evenly spread across full width */}
        <div className={`grid grid-cols-4 gap-1 sm:gap-2 text-center text-xs transition-all duration-300 ${
          !isPremium ? 'filter blur-sm select-none pointer-events-none opacity-30' : ''
        }`}>
          <div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold tabular-nums">
              {getNutritionDisplayValue(nutritionalValues.calories, 'kcal', false, false)}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {t('recipe.nutritionCalories')}
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold tabular-nums">
              {getNutritionDisplayValue(nutritionalValues.protein, 'g', false, true)}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {t('recipe.nutritionProtein')}
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold tabular-nums">
              {getNutritionDisplayValue(nutritionalValues.carbs, 'g', false, true)}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {t('recipe.nutritionCarbs')}
            </div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold tabular-nums">
              {getNutritionDisplayValue(nutritionalValues.fat, 'g', false, true)}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {t('recipe.nutritionFat')}
            </div>
          </div>
        </div>

        {/* Locked Overlay */}
        {!isPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/[0.01] dark:bg-white/[0.01] rounded-xl z-10">
            <div className="flex items-center gap-1.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-md border border-emerald-400/20 active:scale-95 transition-all">
              <Lock className="w-3 h-3" />
              <span>{t('premium.hint.unlockNutrition')}</span>
            </div>
          </div>
        )}
      </div>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen} 
      />
    </>
  );
}
