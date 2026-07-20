import { Card, Button } from '@heroui/react';
import { Check, Plus, Sparkles, Crown } from 'lucide-react';
import type { Ingredient, Recipe } from '../../types';
import AiNotice from '../AiNotice';
import { useI18n } from '../../context/I18nContext';

interface RecipeIngredientsProps {
  recipe: Recipe;
  sortedIngredients: Array<{ group: { name: string; items: Ingredient[] }; originalIdx: number }>;
  checkedIngredients: Record<string, boolean>;
  toggleIngredient: (id: string) => void;
  showIngredientNutrition: boolean;
  onToggleIngredientNutrition: () => void;
  hasIngredientNutrition: boolean;
  isPremium: boolean;
  scaleFactor: number;
  formatAmount: (amount: number | undefined, unit: string | undefined) => string;
  onAddIngredients?: () => void;
  isAdded: boolean;
}

export default function RecipeIngredients({
  recipe,
  sortedIngredients,
  checkedIngredients,
  toggleIngredient,
  showIngredientNutrition,
  onToggleIngredientNutrition,
  hasIngredientNutrition,
  isPremium,
  scaleFactor,
  formatAmount,
  onAddIngredients,
  isAdded
}: RecipeIngredientsProps) {
  const { t, translateCategory } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
          <div className="flex flex-wrap justify-between items-baseline gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('recipe.ingredientsTitle')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 normal-case font-normal">
              {t('recipe.ingredientsSubtitle')}
            </span>
          </div>
          {hasIngredientNutrition && (
            <div className="flex justify-start items-center gap-1.5">
              <button
                onClick={onToggleIngredientNutrition}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all border ${
                  showIngredientNutrition
                    ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:opacity-90'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${showIngredientNutrition ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{t('recipe.showNutritionPerIngredient')}</span>
                {!isPremium && <Crown className="w-3 h-3 text-amber-500 fill-amber-500 ml-0.5" />}
              </button>
              {isPremium && <AiNotice type="badge" tooltipText={t('recipe.aiIngredientsEstimateTooltip')} />}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4.5">
          {sortedIngredients.map(({ group, originalIdx }, sortedIdx) => (
            <div key={sortedIdx} className="flex flex-col gap-1.5">
              {recipe.ingredients.length > 1 && (
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-3 border-l-2 border-emerald-500 flex items-center gap-1.5">
                  <span>{translateCategory(group.name)}</span>
                </h4>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((ing, idx) => {
                  const scaledAmount = formatAmount(ing.amount, ing.unit);
                  const amountStr = scaledAmount ? `${scaledAmount} ` : '';
                  const unitStr = ing.unit ? `${ing.unit} ` : '';
                  const name = ing.name;
                  const uniqueId = `${name}-${originalIdx}-${idx}`;
                  const isChecked = !!checkedIngredients[uniqueId];
 
                  return (
                    <li
                      key={uniqueId}
                      onClick={() => toggleIngredient(uniqueId)}
                      className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-sm select-none transition-all ${
                        isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">{amountStr}{unitStr}</span>
                        {ing.replacedOriginal && (
                          <span className="text-xs text-red-500/70 line-through mx-1.5">{ing.replacedOriginal}</span>
                        )}
                        <span>{name}</span>
                        {ing.modifier && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-normal">
                            ({ing.modifier})
                          </span>
                        )}
                        {ing.isStaple && (
                          <span className="inline-flex items-center ml-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wide select-none align-middle whitespace-nowrap no-underline">
                            {t('recipe.staplePillLabel')}
                          </span>
                        )}
                        {showIngredientNutrition && (() => {
                          const parts = [];
                          if (ing.calories) parts.push(`${Math.round(ing.calories * scaleFactor)} kcal`);
                          if (ing.protein) parts.push(`${Math.round(ing.protein * scaleFactor * 10) / 10}g ${t('recipe.nutritionProteinShort')}`);
                          if (ing.carbs) parts.push(`${Math.round(ing.carbs * scaleFactor * 10) / 10}g ${t('recipe.nutritionCarbsShort')}`);
                          if (ing.fat) parts.push(`${Math.round(ing.fat * scaleFactor * 10) / 10}g ${t('recipe.nutritionFatShort')}`);
                          
                          if (parts.length === 0) return null;
                          return (
                            <span className="inline-flex gap-1 ml-2 text-[11px] text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md font-medium select-none align-middle">
                              {parts.join(' | ')}
                            </span>
                          );
                        })()}
                        {ing.notes && <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{ing.notes}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {onAddIngredients && (
          <Button
            className={`w-full mt-5 py-3.5 rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white h-12 text-sm ${
              isAdded ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            onPress={onAddIngredients}
          >
            {isAdded ? (
              <>
                <Check className="w-4.5 h-4.5" />
                <span>{t('recipe.addedToShopping')}</span>
              </>
            ) : (
              <>
                <Plus className="w-4.5 h-4.5" />
                <span>{t('recipe.addToShopping')}</span>
              </>
            )}
          </Button>
        )}
      </Card>

      {recipe.alternativeIngredients && recipe.alternativeIngredients.length > 0 && (
        <Card className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">{t('recipe.alternativeIngredients')}</h3>
          <div className="flex flex-col gap-3">
            {recipe.alternativeIngredients.map((alt, idx) => (
              <div key={idx} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-red-600 dark:text-red-400 line-through">{alt.original}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{alt.substitute}</span>
                </div>
                {alt.notes && <p className="text-gray-500 dark:text-gray-400 mt-1.5 leading-normal">{alt.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
