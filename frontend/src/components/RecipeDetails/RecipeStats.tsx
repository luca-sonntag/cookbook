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
    <div className="grid grid-cols-3 gap-2 py-4">
      <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
        <Clock className="w-4 h-4 text-emerald-500 mb-1" />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.prep')}</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(prepTime)}</span>
      </div>
      <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
        <Utensils className="w-4 h-4 text-emerald-500 mb-1" />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.cook')}</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(cookTime)}</span>
      </div>
      <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
        <ListChecks className="w-4 h-4 text-emerald-500 mb-1" />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.serves')}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <Button
            isIconOnly
            size="sm"
            variant="tertiary"
            className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            onPress={onDecreaseServings}
            aria-label="Decrease servings"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[1.2rem]">{servings}</span>
          <Button
            isIconOnly
            size="sm"
            variant="tertiary"
            className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            onPress={onIncreaseServings}
            aria-label="Increase servings"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
