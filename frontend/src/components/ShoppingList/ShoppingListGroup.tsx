import { Button } from '@heroui/react';
import { X } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { translateCategory } from '../../i18n';
import { useI18n } from '../../context/I18nContext';
import ShoppingListItem from './ShoppingListItem';

interface ShoppingListGroupProps {
  groupedUnchecked: Array<{ category: string; items: AggregatedShoppingItem[] }>;
  checkedItems: AggregatedShoppingItem[];
  pendingChecks: Set<string>;
  getItemKey: (item: AggregatedShoppingItem) => string;
  onUncheckedClick: (item: AggregatedShoppingItem) => void;
  onCheckedClick: (item: AggregatedShoppingItem) => void;
  onDelete: (item: AggregatedShoppingItem) => void;
  onClearChecked: () => void;
  formatItemAmount: (amount: number, unit: string) => string;
}

export default function ShoppingListGroup({
  groupedUnchecked,
  checkedItems,
  pendingChecks,
  getItemKey,
  onUncheckedClick,
  onCheckedClick,
  onDelete,
  onClearChecked,
  formatItemAmount
}: ShoppingListGroupProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      {/* Unchecked Items */}
      {groupedUnchecked.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('shopping.toBuy', { count: groupedUnchecked.reduce((acc, g) => acc + g.items.length, 0) })}
          </h4>
          <div className="flex flex-col gap-4">
            {groupedUnchecked.map((group) => (
              <div key={group.category} className="flex flex-col gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5 px-1 py-0.5 border-b border-black/5 dark:border-white/5 pb-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {translateCategory(group.category)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-auto">
                    {group.items.length} {t(group.items.length === 1 ? 'shopping.entry' : 'shopping.entries')}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const key = getItemKey(item);
                    return (
                      <ShoppingListItem
                        key={`unchecked-${key}`}
                        item={item}
                        isChecked={false}
                        isPending={pendingChecks.has(key)}
                        onClick={() => onUncheckedClick(item)}
                        onDelete={() => onDelete(item)}
                        formatItemAmount={formatItemAmount}
                      />
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checked Items */}
      {checkedItems.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('shopping.inCart', { count: checkedItems.length })}
            </h4>
            <Button
              size="sm"
              variant="tertiary"
              className="!h-7 !px-2 !py-0 !text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
              onPress={onClearChecked}
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('shopping.clearChecked')}</span>
            </Button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {checkedItems.map((item) => {
              const key = getItemKey(item);
              return (
                <ShoppingListItem
                  key={`checked-${key}`}
                  item={item}
                  isChecked={true}
                  onClick={() => onCheckedClick(item)}
                  onDelete={() => onDelete(item)}
                  formatItemAmount={formatItemAmount}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
