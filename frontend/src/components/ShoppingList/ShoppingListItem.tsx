import { Check, Trash2 } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface ShoppingListItemProps {
  item: AggregatedShoppingItem;
  isChecked: boolean;
  isCollapsing?: boolean;
  isPending?: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatItemAmount: (amount: number, unit: string) => string;
}

export default function ShoppingListItem({
  item,
  isChecked,
  isCollapsing = false,
  isPending = false,
  onClick,
  onDelete,
  formatItemAmount
}: ShoppingListItemProps) {
  const { t } = useI18n();
  const amountStr = formatItemAmount(item.amount, item.unit);

  if (isChecked) {
    return (
      <li className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl opacity-60 hover:opacity-90 hover:bg-black/5 dark:hover:bg-white/5 transition-all group ${
        isCollapsing ? 'animate-item-collapse' : 'animate-item-expand'
      }`}>
        <div
          onClick={onClick}
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
        >
          <div className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 flex items-center justify-center flex-shrink-0 transition-all shadow-sm shadow-emerald-500/20">
            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
          </div>
          {amountStr && (
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 line-through tabular-nums whitespace-nowrap">
              {amountStr}
            </span>
          )}
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate font-medium">
            <span>{item.name}</span>
            {item.modifier && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5 font-normal">
                ({item.modifier})
              </span>
            )}
          </span>
        </div>

        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
          aria-label={t('shopping.deleteItem')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </li>
    );
  }

  return (
    <li className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06] hover:border-emerald-500/20 border border-transparent transition-all group ${
      isCollapsing ? 'animate-item-collapse' : 'animate-item-expand'
    }`}>
      <div
        onClick={onClick}
        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
      >
        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
          isPending
            ? 'bg-emerald-500 border border-emerald-500 shadow-sm shadow-emerald-500/20'
            : 'border-2 border-black/20 dark:border-white/20 group-hover:border-emerald-500/60'
        }`}>
          {isPending && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
        </div>
        {amountStr && (
          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
            isPending
              ? 'bg-emerald-500/10 text-emerald-600/50 dark:text-emerald-400/40 line-through'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-500/25 shadow-sm'
          }`}>
            {amountStr}
          </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`text-sm font-semibold transition-all truncate ${
            isPending
              ? 'text-gray-400 dark:text-gray-500 line-through'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            <span>{item.name}</span>
            {item.modifier && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-normal">
                ({item.modifier})
              </span>
            )}
          </span>
          {item.sources.length > 0 && (
            <div className="flex flex-wrap mt-1 gap-1">
              {item.sources.map((src, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center text-[9px] text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-black/30 border border-black/5 dark:border-white/10 px-1.5 py-0.5 rounded-md font-medium max-w-[200px] sm:max-w-[280px] min-w-0 backdrop-blur-sm"
                  style={{
                    display: 'inline-flex',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    alignItems: 'center'
                  }}
                  title={src.recipeTitle || t('shopping.manual')}
                >
                  <span
                    style={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flex: '1 1 0%'
                    }}
                  >
                    {src.recipeTitle || t('shopping.manual')}
                  </span>
                  {src.amount > 0 && (
                    <span
                      className="opacity-70 ml-1 font-semibold text-emerald-600 dark:text-emerald-400"
                      style={{
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {formatItemAmount(src.amount, src.unit)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
        aria-label={t('shopping.deleteItem')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}