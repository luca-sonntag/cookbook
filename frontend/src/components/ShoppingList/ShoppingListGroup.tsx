import { CheckCheck } from 'lucide-react';
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

/**
 * Renders the active (still-to-buy) shopping list as aisle sections, ordered by
 * the supermarket category order. Checked items live in the separate "Erledigt"
 * drawer, so every item shown here is unchecked.
 */
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

  if (groupedCategories.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {groupedCategories.map((group) => {
        const isGroupCollapsing = collapsingKeys.has(`group-${group.category}`);
        const icon = getCategoryIcon(group.category);
        const openCount = group.items.length;

        return (
          <div
            key={group.category}
            className={`flex flex-col p-2.5 rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-gray-900 transition-all hover:border-emerald-500/20 ${
              isGroupCollapsing ? 'animate-group-collapse' : 'animate-group-expand'
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2 mb-0.5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5 select-none flex-1 min-w-0 text-left">
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-base">
                  {icon}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                    {translateCategory(group.category)}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {openCount} {t('shopping.toBuyCount', { defaultValue: 'offen' })}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => onGroupHeaderClick(group.items)}
                aria-label={t('shopping.checkGroup', { defaultValue: 'Gruppe abhaken' })}
                title={t('shopping.checkGroup', { defaultValue: 'Alle in dieser Kategorie abhaken' })}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-gray-500 dark:text-gray-400 text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('shopping.checkAll', { defaultValue: 'Alle' })}</span>
              </button>
            </div>
            <ul className="flex flex-col gap-1 py-0.5">

              {group.items.map((item) => {
                const displayKey = `unchecked-${getItemKey(item)}`;
                return (
                  <ShoppingListItem
                    key={displayKey}
                    item={item}
                    isChecked={false}
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
  );
}
