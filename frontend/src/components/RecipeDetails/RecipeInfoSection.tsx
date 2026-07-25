import { Clock, Utensils } from 'lucide-react';
import RecipeNutrition from './RecipeNutrition';
import RecipeServingsStepper from './RecipeServingsStepper';
import { useI18n } from '../../context/I18nContext';

interface RecipeInfoSectionProps {
  prepTime: any;
  cookTime: any;
  formatTimeValue: (time: any) => string;
  servings: number;
  onDecreaseServings: () => void;
  onIncreaseServings: () => void;
  /** Nutrition block is omitted entirely when the recipe carries no values. */
  nutritionalValues: any | null;
  isAiEstimated: boolean;
  showTotalNutrition: boolean;
  onToggleTotalNutrition: (isTotal: boolean) => void;
  getNutritionDisplayValue: (val: any, unit?: string, isTotal?: boolean, includeUnit?: boolean) => string;
}

/**
 * Embedded section holding prep/cook times, the servings stepper, the full
 * nutrition table and the AI disclaimer directly on the main recipe details page.
 */
export default function RecipeInfoSection({
  prepTime,
  cookTime,
  formatTimeValue,
  servings,
  onDecreaseServings,
  onIncreaseServings,
  nutritionalValues,
  isAiEstimated,
  showTotalNutrition,
  onToggleTotalNutrition,
  getNutritionDisplayValue,
}: RecipeInfoSectionProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 pb-2">
        {/* Prep / cook time */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <Clock className="w-4.5 h-4.5 text-emerald-500 mb-1" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.prep')}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(prepTime)}</span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <Utensils className="w-4.5 h-4.5 text-emerald-500 mb-1" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.cook')}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(cookTime)}</span>
          </div>
        </div>

        {/* Servings */}
        <RecipeServingsStepper
          servings={servings}
          onDecreaseServings={onDecreaseServings}
          onIncreaseServings={onIncreaseServings}
        />

        {/* Nutrition (incl. per-serving / total switch and premium gate) */}
        {nutritionalValues && (
          <RecipeNutrition
            nutritionalValues={nutritionalValues}
            isAiEstimated={isAiEstimated}
            showTotalNutrition={showTotalNutrition}
            onToggleTotalNutrition={onToggleTotalNutrition}
            getNutritionDisplayValue={getNutritionDisplayValue}
          />
        )}
      </div>
    </div>
  );
}
