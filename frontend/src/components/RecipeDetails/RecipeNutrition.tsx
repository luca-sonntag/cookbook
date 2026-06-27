import AiNotice from '../AiNotice';
import { useI18n } from '../../context/I18nContext';

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

  return (
    <div className={`p-3.5 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-300 ${
      isAiEstimated
        ? 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] shadow-[0_0_15px_rgba(99,102,241,0.05)]'
        : 'bg-black/5 dark:bg-white/5'
    }`}>
      <div className="flex justify-between items-center mb-2.5 gap-2">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('recipe.nutritionTitle')}</h4>
          {isAiEstimated && <AiNotice type="badge" />}
        </div>
        
        {/* Portion / Gesamt Switcher */}
        <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5 select-none shrink-0">
          <button
            type="button"
            onClick={() => onToggleTotalNutrition(false)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer outline-none border-none ${
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
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer outline-none border-none ${
              showTotalNutrition
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('recipe.nutritionTotal')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="text-gray-900 dark:text-white font-bold">{getNutritionDisplayValue(nutritionalValues.calories, 'kcal', showTotalNutrition, false)}</div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionCalories')}</div>
        </div>
        <div>
          <div className="text-gray-900 dark:text-white font-bold">{getNutritionDisplayValue(nutritionalValues.protein, 'g', showTotalNutrition, true)}</div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionProtein')}</div>
        </div>
        <div>
          <div className="text-gray-900 dark:text-white font-bold">{getNutritionDisplayValue(nutritionalValues.carbs, 'g', showTotalNutrition, true)}</div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionCarbs')}</div>
        </div>
        <div>
          <div className="text-gray-900 dark:text-white font-bold">{getNutritionDisplayValue(nutritionalValues.fat, 'g', showTotalNutrition, true)}</div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionFat')}</div>
        </div>
      </div>
    </div>
  );
}
