import { Button } from '@heroui/react';
import { Minus, Plus, Utensils } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeServingsStepperProps {
  servings: number;
  onDecreaseServings: () => void;
  onIncreaseServings: () => void;
  /**
   * `compact` drops the label and shrinks the touch targets so the stepper fits
   * into the ingredients header; `full` is the labelled row used in the info
   * sheet.
   * @default 'full'
   */
  variant?: 'compact' | 'full';
}

/**
 * The servings stepper that drives `useRecipeScaling`. Rendered both inside the
 * recipe info sheet and inline above the ingredient list, where changing the
 * portion count is most likely to be needed.
 */
export default function RecipeServingsStepper({
  servings,
  onDecreaseServings,
  onIncreaseServings,
  variant = 'full',
}: RecipeServingsStepperProps) {
  const { t } = useI18n();
  const isCompact = variant === 'compact';

  // 44px targets in both variants — the compact one only tightens the gaps.
  const buttonClasses =
    'w-11 h-11 min-w-[44px] min-h-[44px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full';

  return (
    <div
      className={
        isCompact
          ? 'flex items-center gap-1 flex-shrink-0'
          : 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] p-3 px-4 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between'
      }
    >
      {!isCompact && (
        <div className="flex items-center gap-2">
          <Utensils className="w-4.5 h-4.5 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('recipe.serves')}
          </span>
        </div>
      )}

      <div className={`flex items-center ${isCompact ? 'gap-0.5' : 'gap-3'}`}>
        <Button
          isIconOnly
          size="sm"
          variant="tertiary"
          className={buttonClasses}
          onPress={onDecreaseServings}
          aria-label={t('recipe.decreaseServings')}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-extrabold text-gray-900 dark:text-white min-w-[1.5rem] text-center tabular-nums">
          {servings}
        </span>
        <Button
          isIconOnly
          size="sm"
          variant="tertiary"
          className={buttonClasses}
          onPress={onIncreaseServings}
          aria-label={t('recipe.increaseServings')}
        >
          <Plus className="w-4 h-4" />
        </Button>
        {isCompact && (
          <Utensils className="w-4 h-4 text-emerald-500 ml-1.5 flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
