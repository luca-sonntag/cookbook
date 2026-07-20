import { Button } from '@heroui/react';
import { Clock, Utensils, ListChecks, Minus, Plus } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeStatsProps {
  prepTime: any;
  cookTime: any;
  servings: number;
  onDecreaseServings: () => void;
  onIncreaseServings: () => void;
  formatTimeValue: (time: any) => string;
}

export default function RecipeStats({
  prepTime,
  cookTime,
  servings,
  onDecreaseServings,
  onIncreaseServings,
  formatTimeValue
}: RecipeStatsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Time stats row */}
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

      {/* Full-width serving control */}
      <div className="bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] p-3 px-4 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4.5 h-4.5 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('recipe.serves')}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            size="sm"
            variant="tertiary"
            className="w-11 h-11 min-w-[44px] min-h-[44px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            onPress={onDecreaseServings}
            aria-label="Decrease servings"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white min-w-[1.5rem] text-center">{servings}</span>
          <Button
            isIconOnly
            size="sm"
            variant="tertiary"
            className="w-11 h-11 min-w-[44px] min-h-[44px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            onPress={onIncreaseServings}
            aria-label="Increase servings"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
