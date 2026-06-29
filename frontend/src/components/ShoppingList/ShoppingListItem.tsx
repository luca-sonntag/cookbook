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
      <li className={`flex items-start justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${
        isCollapsing ? 'animate-item-collapse' : 'animate-item-expand'
      }`}>
        <div
          onClick={onClick}
          className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
        >
          <div className="w-6 h-6 rounded-md bg-emerald-500 border border-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate font-medium">
            {amountStr && (
              <span className="mr-1.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
                {amountStr}
              </span>
            )}
            <span>{item.name}</span>
            {item.modifier && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-normal">
                ({item.modifier})
              </span>
            )}
          </span>
        </div>

        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
          aria-label={t('shopping.deleteItem')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </li>
    );
  }

  return (
    <li className={`flex items-start justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${
      isCollapsing ? 'animate-item-collapse' : 'animate-item-expand'
    }`}>
      <div
        onClick={onClick}
        className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isPending ? 'bg-emerald-500 border border-emerald-500' : 'border border-black/20 dark:border-white/20'}`}>
          {isPending && <Check className="w-4 h-4 text-white" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-medium transition-all ${isPending ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
            {amountStr && (
              <span className={`font-semibold mr-1.5 transition-all whitespace-nowrap flex-shrink-0 ${isPending ? 'text-emerald-600/50 dark:text-emerald-400/40' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {amountStr}
              </span>
            )}
            <span>{item.name}</span>
            {item.modifier && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-normal">
                ({item.modifier})
              </span>
            )}
          </span>
          <div className="flex flex-wrap mt-0.5">
            {item.sources.map((src, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center text-[10px] text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-1.5 py-0.2 rounded-md mr-1 mt-1 font-medium max-w-[200px] sm:max-w-[320px] min-w-0"
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
                    className="opacity-75 ml-1"
                    style={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    ({formatItemAmount(src.amount, src.unit)})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
        aria-label={t('shopping.deleteItem')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
