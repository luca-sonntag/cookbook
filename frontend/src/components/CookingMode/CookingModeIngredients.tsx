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
    <div className="w-full px-4.5 py-4 sm:px-6 sm:py-5 border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] flex flex-col text-left">
      {/* Section Header inside cohesive card */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('recipe.ingredientsForStep')}
          </h3>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 tabular-nums select-none">
          {ingredients.length}
        </span>
      </div>

      {/* 2-Column Grid of Clean Flat ingredient chips */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {ingredients.map((ing, i) => {
          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';

          return (
            <li
              key={`${ing.name}-${i}`}
              className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800/90 shadow-xs border-none transition-all"
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
