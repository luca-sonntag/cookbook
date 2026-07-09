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
    <div className="flex flex-col gap-3">
      {groupedCategories.map((group) => {
        const isGroupCollapsing = collapsingKeys.has(`group-${group.category}`);
        const icon = getCategoryIcon(group.category);
        const openCount = group.items.length;

        return (
          <div
            key={group.category}
            className={`flex flex-col p-2.5 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] transition-all hover:border-emerald-500/20 ${
              isGroupCollapsing ? 'animate-group-collapse' : 'animate-group-expand'
            }`}
          >
            <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-2.5 mb-1 border-b border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => onGroupHeaderClick(group.items)}
                className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0 text-left outline-none"
              >
                <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-lg">
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
              </button>
              <button
                type="button"
                onClick={() => onGroupHeaderClick(group.items)}
                aria-label={t('shopping.checkGroup', { defaultValue: 'Gruppe abhaken' })}
                className="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-black/15 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              />
            </div>
            <ul className="flex flex-col gap-0.5">
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
