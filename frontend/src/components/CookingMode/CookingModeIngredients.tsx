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
    <div className="w-full px-5 py-4 sm:px-8 sm:py-6 border-t border-black/5 dark:border-white/5 flex flex-col text-left">
      {/* Section Header inside cohesive card */}
      <div className="flex items-center justify-between gap-2 mb-3.5 shrink-0">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {t('recipe.ingredientsForStep')}
        </h3>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-0.5 tabular-nums select-none">
          {ingredients.length}
        </span>
      </div>

      {/* 2-Column Grid with Large Glanceable Typography & 44px Icons */}
      <ul className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 text-xs sm:text-sm">
        {ingredients.map((ing, i) => {
          const scaledAmount = formatAmount(ing.amount, ing.unit);
          const amountStr = scaledAmount ? `${scaledAmount} ` : '';
          const unitStr = ing.unit ? `${ing.unit} ` : '';

          return (
            <li
              key={`${ing.name}-${i}`}
              className="flex items-center gap-3 py-1 px-1 rounded-2xl transition-colors min-w-0"
            >
              <IngredientIcon
                baseName={ing.baseName}
                canonicalId={ing.canonicalId}
                category={ing.category}
                name={ing.name}
                size="md"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center leading-snug">
                {ing.replacedOriginal && (
                  <span className="text-[11px] leading-tight text-red-500/70 dark:text-red-400/70 line-through font-normal truncate block mb-0.5">
                    {ing.replacedOriginal}
                  </span>
                )}

                {/* Name & modifier */}
                <div className="flex items-baseline flex-wrap gap-x-1.5 min-w-0 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  <span className="truncate">{ing.name}</span>
                  {ing.modifier && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-normal truncate">
                      ({ing.modifier})
                    </span>
                  )}
                </div>

                {/* Amount & notes */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  {(amountStr || unitStr) && (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate text-sm sm:text-base">
                      {`${amountStr}${unitStr}`.trim()}
                    </span>
                  )}
                  {ing.notes && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
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
