import { Drawer } from '@heroui/react';
import { Clock, Info, Utensils } from 'lucide-react';
import RecipeNutrition from './RecipeNutrition';
import RecipeServingsStepper from './RecipeServingsStepper';
import { useI18n } from '../../context/I18nContext';

interface RecipeInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
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
 * Bottom sheet holding everything that used to occupy a full screen above the
 * ingredient list: prep/cook times, the servings stepper, the full nutrition
 * table and the AI disclaimer. Opened from `RecipeMetaStrip`.
 */
export default function RecipeInfoSheet({
  isOpen,
  onClose,
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
}: RecipeInfoSheetProps) {
  const { t } = useI18n();

  return (
    <Drawer>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} className="!z-[100]">
        <Drawer.Content placement="bottom" className="!z-[100]">
          <Drawer.Dialog className="relative !bg-white dark:!bg-gray-900 pb-[calc(1.5rem_+_var(--safe-area-inset-bottom))]">
            <Drawer.Handle />

            <Drawer.Header>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <Info className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Drawer.Heading className="text-base font-bold">
                  {t('recipe.infoSheetTitle')}
                </Drawer.Heading>
              </div>
            </Drawer.Header>

            <Drawer.Body>
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

                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-normal select-none">
                  {t('recipe.aiGeneratedDisclaimer')}
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
