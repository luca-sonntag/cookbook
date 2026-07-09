import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
 * Collapsible "Erledigt" drawer that holds every checked-off item. Keeping done
 * items out of the aisles lets the active list shrink to just what's left to grab.
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
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2.5 w-full px-3 py-3 text-left cursor-pointer outline-none select-none"
      >
        <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
        </span>
        <span className="flex-1 text-sm font-bold text-gray-600 dark:text-gray-300">
          {t('shopping.doneCount', { count: items.length })}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Pure-CSS collapse via grid-rows 0fr -> 1fr */}
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden min-h-0">
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
      </div>
    </div>
  );
}
