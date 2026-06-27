import { Check, Minus } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { translateCategory } from '../../i18n';
import { useI18n } from '../../context/I18nContext';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingListGroupProps {
  groupedCategories: Array<{ category: string; items: AggregatedShoppingItem[] }>;
  getItemKey: (item: AggregatedShoppingItem) => string;
  onItemToggle: (item: AggregatedShoppingItem) => void;
  onGroupHeaderClick: (items: AggregatedShoppingItem[]) => void;
  onDelete: (item: AggregatedShoppingItem) => void;
  formatItemAmount: (amount: number, unit: string) => string;
}

export default function ShoppingListGroup({
  groupedCategories,
  getItemKey,
  onItemToggle,
  onGroupHeaderClick,
  onDelete,
  formatItemAmount
}: ShoppingListGroupProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      {groupedCategories.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('shopping.toBuy', { count: groupedCategories.reduce((acc, g) => acc + g.items.filter(i => !i.checked).length, 0) })}
          </h4>
          <div className="flex flex-col gap-4">
            {groupedCategories.map((group) => {
              const checkedCount = group.items.filter((item) => item.checked).length;
              const isAllChecked = checkedCount === group.items.length;
              const isSomeChecked = checkedCount > 0 && checkedCount < group.items.length;

              return (
                <div key={group.category} className="flex flex-col gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-1.5 px-1 py-0.5 border-b border-black/5 dark:border-white/5 pb-2 mb-1">
                    <div
                      onClick={() => onGroupHeaderClick(group.items)}
                      className="flex items-center gap-2 cursor-pointer select-none py-0.5"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                        isAllChecked || isSomeChecked
                          ? 'bg-emerald-500 border border-emerald-500 text-white'
                          : 'border border-black/20 dark:border-white/20'
                      }`}>
                        {isAllChecked && <Check className="w-3 h-3 text-white" />}
                        {isSomeChecked && <Minus className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {translateCategory(group.category)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-auto">
                      {group.items.length} {t(group.items.length === 1 ? 'shopping.entry' : 'shopping.entries')}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <ShoppingListItem
                          key={`${item.checked ? 'checked' : 'unchecked'}-${key}`}
                          item={item}
                          isChecked={item.checked}
                          onClick={() => onItemToggle(item)}
                          onDelete={() => onDelete(item)}
                          formatItemAmount={formatItemAmount}
                        />
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
