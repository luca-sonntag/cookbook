import { useState } from 'react';
import { Check, Trash2, ChevronDown } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface ShoppingListItemProps {
  item: AggregatedShoppingItem;
  isChecked: boolean;
  isCollapsing?: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatItemAmount: (amount: number, unit: string) => string;
}

export default function ShoppingListItem({
  item,
  isChecked,
  isCollapsing = false,
  onClick,
  onDelete,
  formatItemAmount
}: ShoppingListItemProps) {
  const { t } = useI18n();
  const [showSources, setShowSources] = useState(false);
  const amountStr = formatItemAmount(item.amount, item.unit);
  const sourceCount = item.sources?.length ?? 0;
  const hasMultipleSources = sourceCount > 1;

  const animationClass = isCollapsing ? 'animate-item-collapse' : 'animate-item-expand';

  // Compact, dimmed row used inside the "Erledigt" drawer.
  if (isChecked) {
    return (
      <li className={`flex items-center justify-between gap-2 py-1 px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${animationClass}`}>
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 text-left outline-none"
          aria-label={t('shopping.restoreItem')}
        >
          <span className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate">
            {amountStr && <span className="font-semibold mr-1.5">{amountStr}</span>}
            <span>{item.name}</span>
            {item.modifier && <span className="ml-1 font-normal">({item.modifier})</span>}
          </span>
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
          aria-label={t('shopping.deleteItem')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </li>
    );
  }

  // Active (to-buy) row — big tap target, amount as a scannable chip.
  return (
    <li className={`rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors group ${animationClass}`}>
      <div className="flex items-center justify-between gap-2 py-1 px-2 min-h-[36px]">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 text-left outline-none"
          aria-label={item.name}
        >
          <span className="w-5 h-5 rounded-md border-2 border-black/15 dark:border-white/20 group-hover:border-emerald-500/60 flex items-center justify-center flex-shrink-0 transition-colors" />
          {amountStr && (
            <span className="flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold tabular-nums rounded-md px-1.5 py-0.5 text-[11px] whitespace-nowrap">
              {amountStr}
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 min-w-0 leading-tight">
            <span className="break-words">{item.name}</span>
            {item.modifier && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-normal">
                ({item.modifier})
              </span>
            )}
          </span>
        </button>

        <div className="flex items-center flex-shrink-0">
          {hasMultipleSources && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSources((s) => !s);
              }}
              className="inline-flex items-center gap-1 pl-2 pr-1.5 h-6 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
              aria-label={t('shopping.recipeCount', { count: sourceCount })}
              aria-expanded={showSources}
            >
              <span>{t('shopping.recipeCount', { count: sourceCount })}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSources ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
            aria-label={t('shopping.deleteItem')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Per-recipe breakdown — only rendered for merged items and only when expanded */}
      {hasMultipleSources && showSources && (
        <div className="pl-[38px] pr-3 pb-2 -mt-0.5 flex flex-col gap-1 animate-item-expand">
          {item.sources.map((src, sIdx) => (
            <div
              key={sIdx}
              className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400"
            >
              <span className="truncate">{src.recipeTitle || t('shopping.manual')}</span>
              {src.amount > 0 && (
                <span className="flex-shrink-0 font-medium tabular-nums opacity-80">
                  {formatItemAmount(src.amount, src.unit)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
