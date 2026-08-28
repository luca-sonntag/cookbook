import React from 'react';
import { ShoppingCart, ShoppingBag, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { PageHeader } from '../PageHeader';
import type { MealPlannerHeaderProps } from './types';

export const MealPlannerHeader: React.FC<MealPlannerHeaderProps> = ({
  plannedTotalCount,
  isAddingToShopping,
  isShopAdded = false,
  onShopWeek,
}) => {
  const { t } = useI18n();

  const shopAction = plannedTotalCount > 0 ? (
    <button
      onClick={onShopWeek}
      disabled={isAddingToShopping}
      className={`flex items-center justify-center gap-1.5 w-10 h-10 min-w-[40px] min-h-[40px] sm:w-auto sm:px-3 sm:py-2 rounded-2xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer border-none ${
        isShopAdded
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
      }`}
      title={t('mealPlanner.shopWeekDescription')}
      aria-label={t('mealPlanner.shopWeek')}
    >
      {isAddingToShopping ? (
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
      ) : isShopAdded ? (
        <ShoppingBag className="w-5 h-5" />
      ) : (
        <ShoppingCart className="w-5 h-5" />
      )}
      <span className="hidden sm:inline text-xs font-semibold">{t('mealPlanner.shopWeek')}</span>
    </button>
  ) : undefined;

  return (
    <PageHeader
      icon={<CalendarIcon className="w-6 h-6" />}
      title={t('mealPlanner.title')}
      subtitle={t('mealPlanner.subtitle')}
      action={shopAction}
    />
  );
};

export default MealPlannerHeader;
