import React from 'react';
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
    <div className="w-full px-4.5 py-4 sm:px-6 sm:py-5 border-t border-black/5 dark:border-white/5 flex flex-col text-left">
      {/* Section Header inside cohesive card (without Sparkles icon) */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {t('recipe.ingredientsForStep')}
        </h3>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 tabular-nums select-none">
          {ingredients.length}
        </span>
      </div>

      {/* 2-Column Grid directly on mobile and tablet */}
      <ul className="grid grid-cols-2 gap-x-3.5 sm:gap-x-6 gap-y-2 text-xs">
        {ingredients.map((ing, i) => {
          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';

          return (
            <li
              key={`${ing.name}-${i}`}
              className="flex items-center gap-2.5 py-1 px-1 rounded-xl transition-colors min-w-0"
            >
              <IngredientIcon
                baseName={ing.baseName}
                canonicalId={ing.canonicalId}
                category={ing.category}
                name={ing.name}
                size="sm"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {ing.replacedOriginal && (
                  <span className="text-[10px] leading-tight text-red-500/70 dark:text-red-400/70 line-through font-normal truncate block mb-0.5">
                    {ing.replacedOriginal}
                  </span>
                )}

                {/* Name & modifier */}
                <div className="flex items-baseline flex-wrap gap-x-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-snug">
                  <span className="truncate">{ing.name}</span>
                  {ing.modifier && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal truncate">
                      ({ing.modifier})
                    </span>
                  )}
                </div>

                {/* Amount & notes */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  {(amountStr || unitStr) && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                      {`${amountStr}${unitStr}`.trim()}
                    </span>
                  )}
                  {ing.notes && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
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
