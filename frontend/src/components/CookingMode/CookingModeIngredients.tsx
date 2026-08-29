import React from 'react';
import { Sparkles } from 'lucide-react';
import type { StepIngredientItem } from './types';
import { useI18n } from '../../context/I18nContext';
import IngredientIcon from '../IngredientIcon';

interface CookingModeIngredientsProps {
  ingredients: StepIngredientItem[];
  formatAmount: (amount: number, unit?: string) => string;
}

export const CookingModeIngredients: React.FC<CookingModeIngredientsProps> = ({
  ingredients,
  formatAmount,
}) => {
  const { t } = useI18n();

  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div className="w-full max-w-xl bg-gray-50/90 dark:bg-gray-900/60 rounded-3xl p-4 sm:p-5 text-left flex flex-col min-h-0 border-none shadow-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {t('recipe.ingredientsForStep')}
          </h3>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 tabular-nums select-none">
          {ingredients.length}
        </span>
      </div>

      {/* Ingredients List */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs overflow-y-auto pr-1 min-h-0 max-h-[35dvh]">
        {ingredients.map((ing, i) => {
          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';

          return (
            <li
              key={`${ing.name}-${i}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800/80 shadow-xs border-none transition-all"
            >
              <IngredientIcon
                baseName={ing.baseName}
                canonicalId={ing.canonicalId}
                category={ing.category}
                name={ing.name}
                size="md"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {ing.replacedOriginal && (
                  <span className="text-[11px] leading-tight text-red-500/70 dark:text-red-400/70 line-through font-normal truncate block mb-0.5">
                    {ing.replacedOriginal}
                  </span>
                )}

                {/* Name & modifier */}
                <div className="flex items-baseline flex-wrap gap-x-1.5 min-w-0 text-sm font-medium text-gray-900 dark:text-white leading-snug">
                  <span className="truncate">{ing.name}</span>
                  {ing.modifier && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      ({ing.modifier})
                    </span>
                  )}
                </div>

                {/* Amount & notes */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  {(amountStr || unitStr) && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {`${amountStr}${unitStr}`.trim()}
                    </span>
                  )}
                  {ing.notes && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {ing.notes}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CookingModeIngredients;
