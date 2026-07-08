import { useState } from 'react';
import AiNotice from '../AiNotice';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import PremiumModal from '../PremiumModal';
import { Lock } from 'lucide-react';

interface RecipeNutritionProps {
  nutritionalValues: any;
  isAiEstimated: boolean;
  showTotalNutrition: boolean;
  onToggleTotalNutrition: (isTotal: boolean) => void;
  getNutritionDisplayValue: (val: any, unit?: string, isTotal?: boolean, includeUnit?: boolean) => string;
}

export default function RecipeNutrition({
  nutritionalValues,
  isAiEstimated,
  showTotalNutrition,
  onToggleTotalNutrition,
  getNutritionDisplayValue
}: RecipeNutritionProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => !isPremium && setIsPremiumModalOpen(true)}
        className={`relative p-3.5 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-300 ${
          !isPremium ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shadow-xs' : ''
        } ${
          isAiEstimated
            ? 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] shadow-[0_0_15px_rgba(99,102,241,0.05)]'
            : 'bg-black/5 dark:bg-white/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('recipe.nutritionTitle')}</h4>
            {isAiEstimated && <AiNotice type="badge" />}
          </div>
          
          {/* Portion / Gesamt Switcher */}
          <div 
            onClick={(e) => !isPremium && e.stopPropagation()}
            className={`flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5 select-none w-full sm:w-auto ${
              !isPremium ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleTotalNutrition(false)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer outline-none border-none text-center ${
                !showTotalNutrition
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('recipe.nutritionPerServing')}
            </button>
            <button
              type="button"
              onClick={() => onToggleTotalNutrition(true)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer outline-none border-none text-center ${
                showTotalNutrition
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('recipe.nutritionTotal')}
            </button>
          </div>
        </div>

        {/* Nutritional Values Grid */}
        <div className={`grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs transition-all duration-300 ${
          !isPremium ? 'filter blur-sm select-none pointer-events-none opacity-30' : ''
        }`}>
          <div>
            <div className="text-gray-900 dark:text-white text-sm font-bold">{getNutritionDisplayValue(nutritionalValues.calories, 'kcal', showTotalNutrition, false)}</div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{t('recipe.nutritionCalories')}</div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm font-bold">{getNutritionDisplayValue(nutritionalValues.protein, 'g', showTotalNutrition, true)}</div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{t('recipe.nutritionProtein')}</div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm font-bold">{getNutritionDisplayValue(nutritionalValues.carbs, 'g', showTotalNutrition, true)}</div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{t('recipe.nutritionCarbs')}</div>
          </div>
          <div>
            <div className="text-gray-900 dark:text-white text-sm font-bold">{getNutritionDisplayValue(nutritionalValues.fat, 'g', showTotalNutrition, true)}</div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{t('recipe.nutritionFat')}</div>
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
