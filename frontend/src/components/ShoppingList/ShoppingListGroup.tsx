import { Check, Minus } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { translateCategory, getCategoryIcon } from '../../i18n';
import { useI18n } from '../../context/I18nContext';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingListGroupProps {
  groupedCategories: Array<{ category: string; items: AggregatedShoppingItem[] }>;
  getItemKey: (item: AggregatedShoppingItem) => string;
  onItemToggle: (item: AggregatedShoppingItem) => void;
  onGroupHeaderClick: (items: AggregatedShoppingItem[]) => void;
  onDelete: (item: AggregatedShoppingItem) => void;
  formatItemAmount: (amount: number, unit: string) => string;
  collapsingKeys: Set<string>;
}

export default function ShoppingListGroup({
  groupedCategories,
  getItemKey,
  onItemToggle,
  onGroupHeaderClick,
  onDelete,
  formatItemAmount,
  collapsingKeys
}: ShoppingListGroupProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      {groupedCategories.length > 0 && (
        <div className="flex flex-col gap-3">
            {groupedCategories.map((group) => {
              const checkedCount = group.items.filter((item) => item.checked).length;
              const isAllChecked = checkedCount === group.items.length;
              const isSomeChecked = checkedCount > 0 && checkedCount < group.items.length;
              const isGroupCollapsing = collapsingKeys.has(`group-${group.category}`);
              const icon = getCategoryIcon(group.category);
              const uncheckedCount = group.items.length - checkedCount;

              return (
                <div
                  key={`${group.category}-${isAllChecked ? 'completed' : 'active'}`}
                  className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
                    isAllChecked
                      ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/20'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-emerald-500/20'
                  } ${
                    isGroupCollapsing ? 'animate-group-collapse' : 'animate-group-expand'
                  }`}
                >
                  <div className="flex items-center gap-2.5 px-1 py-1 pb-2.5 mb-1 border-b border-black/5 dark:border-white/5">
                    <div
                      onClick={() => onGroupHeaderClick(group.items)}
                      className="flex items-center gap-2.5 cursor-pointer select-none py-0.5 flex-1 min-w-0"
                    >
                      <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all text-lg ${
                        isAllChecked ? 'opacity-60' : ''
                      }`}>
                        <span>{icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold uppercase tracking-wider truncate ${
                          isAllChecked
                            ? 'text-emerald-600/60 dark:text-emerald-400/60 line-through'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {translateCategory(group.category)}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                          {isAllChecked
                            ? `${checkedCount} ${t(group.items.length === 1 ? 'shopping.entry' : 'shopping.entries')}`
                            : `${uncheckedCount} ${t('shopping.toBuyCount', { defaultValue: 'offen' })}`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onGroupHeaderClick(group.items)}
                      aria-label={
                        isAllChecked
                          ? t('shopping.uncheckGroup', { defaultValue: 'Gruppe abwählen' })
                          : t('shopping.checkGroup', { defaultValue: 'Gruppe abhaken' })
                      }
                      className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                        isAllChecked || isSomeChecked
                          ? 'bg-emerald-500 border border-emerald-500 text-white hover:bg-emerald-400 hover:border-emerald-400'
                          : 'border border-black/20 dark:border-white/20 hover:border-emerald-500/60'
                      }`}
                    >
                      {isAllChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      {isSomeChecked && <Minus className="w-3 h-3 text-white stroke-[3px]" />}
                    </button>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const key = getItemKey(item);
                      const displayKey = `${item.checked ? 'checked' : 'unchecked'}-${key}`;
                      return (
                        <ShoppingListItem
                          key={displayKey}
                          item={item}
                          isChecked={item.checked}
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
            })}
        </div>
      )}
    </div>
  );
}
