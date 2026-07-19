import { Check } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { useI18n } from '../../context/I18nContext';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingCheckedDrawerProps {
  items: AggregatedShoppingItem[];
  getItemKey: (item: AggregatedShoppingItem) => string;
  onItemToggle: (item: AggregatedShoppingItem) => void;
  onDelete: (item: AggregatedShoppingItem) => void;
  formatItemAmount: (amount: number, unit: string) => string;
  collapsingKeys: Set<string>;
}

/**
 * Non-collapsible "Erledigt" container that holds every checked-off item.
 */
export default function ShoppingCheckedDrawer({
  items,
  getItemKey,
  onItemToggle,
  onDelete,
  formatItemAmount,
  collapsingKeys
}: ShoppingCheckedDrawerProps) {
  const { t } = useI18n();

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left select-none">
        <span className="w-5.5 h-5.5 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
        </span>
        <span className="flex-1 text-sm font-bold text-gray-600 dark:text-gray-300">
          {t('shopping.doneCount', { count: items.length })}
        </span>
      </div>

      <ul className="flex flex-col gap-0.5 px-1.5 pb-2">
        {items.map((item) => {
          const displayKey = `checked-${getItemKey(item)}`;
          return (
            <ShoppingListItem
              key={displayKey}
              item={item}
              isChecked
              isCollapsing={collapsingKeys.has(displayKey)}
              onClick={() => onItemToggle(item)}
              onDelete={() => onDelete(item)}
              formatItemAmount={formatItemAmount}
            />
          );
        })}
      </ul>
    </div>
  );
}
