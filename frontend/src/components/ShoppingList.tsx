import React, { useState, useMemo } from 'react';
import { Card, Button } from '@heroui/react';
import { ShoppingCart, Plus, Trash2, Check, X } from 'lucide-react';
import type { AggregatedShoppingItem } from '../types';
import { translateCategory, categoryOrder, uiTranslations } from '../i18n';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../context/I18nContext';

interface ShoppingListProps {
  aggregatedList: {
    unchecked: AggregatedShoppingItem[];
    checked: AggregatedShoppingItem[];
  };
  addCustomItem: (name: string, amount: number, unit: string) => void;
  toggleItemGroup: (name: string, unit: string, targetChecked: boolean) => void;
  deleteItemGroup: (name: string, unit: string) => void;
  clearAll: () => void;
  clearChecked: () => void;
}

export default function ShoppingList({
  aggregatedList,
  addCustomItem,
  toggleItemGroup,
  deleteItemGroup,
  clearAll,
  clearChecked
}: ShoppingListProps) {
  const dialog = useDialog();
  const { t, language } = useI18n();
  // Manual item state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');

  // Quick unit suggestions
  const suggestions = uiTranslations[language].shopping.suggestionsList;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numAmount = parseFloat(amount.replace(',', '.'));
    addCustomItem(name.trim(), isNaN(numAmount) ? 0 : numAmount, unit.trim());

    // Reset state
    setName('');
    setAmount('');
    setUnit('');
  };

  const formatItemAmount = (amount: number, unit: string) => {
    if (!amount) return '';
    const rounded = Math.round(amount * 100) / 100;
    const unitStr = unit ? ` ${unit}` : '';
    return `${rounded}${unitStr}`;
  };

  const handleClearAll = async () => {
    const confirmed = await dialog.confirm({
      title: t('shopping.dialogClear.title'),
      message: t('shopping.dialogClear.message'),
      confirmLabel: t('shopping.dialogClear.confirm'),
      cancelLabel: t('shopping.dialogClear.cancel'),
      status: 'danger'
    });
    if (confirmed) {
      clearAll();
    }
  };

  const totalCount = aggregatedList.unchecked.length + aggregatedList.checked.length;

  // Group unchecked items by category
  const groupedUnchecked = useMemo(() => {
    const groups: Record<string, AggregatedShoppingItem[]> = {};

    aggregatedList.unchecked.forEach((item) => {
      const cat = item.category || 'OTHER';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });

    // Sort categories based on categoryOrder
    return Object.keys(groups)
      .sort((a, b) => {
        const idxA = categoryOrder.indexOf(a.toUpperCase() as any);
        const idxB = categoryOrder.indexOf(b.toUpperCase() as any);
        const valA = idxA === -1 ? 999 : idxA;
        const valB = idxB === -1 ? 999 : idxB;
        return valA - valB;
      })
      .map((cat) => ({
        category: cat,
        items: groups[cat],
      }));
  }, [aggregatedList.unchecked]);

  return (
    <div className="flex flex-col gap-6">
      {/* Add Custom Item Form */}
      <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" />
          <span>{t('shopping.addTitle')}</span>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 md:col-span-6">
              <input
                type="text"
                placeholder={t('shopping.placeholderName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-3 md:col-span-3">
              <input
                type="text"
                placeholder={t('shopping.placeholderAmount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="col-span-3 md:col-span-3">
              <input
                type="text"
                placeholder={t('shopping.placeholderUnit')}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 items-center mt-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">{t('shopping.suggestions')}</span>
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setUnit(sug)}
                className="text-[10px] px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shopping.btnAdd')}</span>
          </Button>
        </form>
      </Card>

      {/* Main Shopping List Content */}
      <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-black/5 dark:border-white/5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <span>{t('shopping.title')}</span>
          </h3>

          {totalCount > 0 && (
            <div className="flex gap-2">
              {aggregatedList.checked.length > 0 && (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
                  onPress={clearChecked}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('shopping.clearChecked')}</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="tertiary"
                className="px-2.5 py-1 text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
                onPress={handleClearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('shopping.clearAll')}</span>
              </Button>
            </div>
          )}
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-gray-400 mb-3 animate-pulse-slow" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('shopping.emptyTitle')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-normal">
              {t('shopping.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Unchecked Items */}
            {aggregatedList.unchecked.length > 0 && (
              <div className="flex flex-col gap-4">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('shopping.toBuy', { count: aggregatedList.unchecked.length })}
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
                          const key = `${item.name.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}`;
                          const amountStr = formatItemAmount(item.amount, item.unit);

                          return (
                            <li
                              key={`unchecked-${key}`}
                              className="flex items-start justify-between gap-3 py-1.5 px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                            >
                              <div
                                onClick={() => toggleItemGroup(item.baseName || item.name, item.unit, true)}
                                className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                              >
                                <div className="w-5 h-5 rounded-md border border-black/20 dark:border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all">
                                  {/* Empty checkbox */}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                    {amountStr && (
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5">
                                        {amountStr}
                                      </span>
                                    )}
                                    <span>{item.name}</span>
                                  </span>
                                  <div className="flex flex-wrap mt-0.5">
                                    {item.sources.map((src, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center text-[9px] text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-1.5 py-0.2 rounded-md mr-1 mt-1 font-medium"
                                      >
                                        {src.recipeTitle || t('shopping.manual')}
                                        {src.amount > 0 && (
                                          <span className="opacity-75 ml-1">
                                            ({formatItemAmount(src.amount, src.unit)})
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => deleteItemGroup(item.baseName || item.name, item.unit)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
                                aria-label={t('shopping.deleteItem')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checked Items */}
            {aggregatedList.checked.length > 0 && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('shopping.inCart', { count: aggregatedList.checked.length })}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {aggregatedList.checked.map((item) => {
                    const key = `${item.name.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}`;
                    const amountStr = formatItemAmount(item.amount, item.unit);

                    return (
                      <li
                        key={`checked-${key}`}
                        className="flex items-start justify-between gap-3 py-2 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div
                          onClick={() => toggleItemGroup(item.baseName || item.name, item.unit, false)}
                          className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate font-medium">
                            {amountStr && (
                              <span className="mr-1.5 font-semibold text-emerald-600/50 dark:text-emerald-400/40">
                                {amountStr}
                              </span>
                            )}
                            <span>{item.name}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => deleteItemGroup(item.baseName || item.name, item.unit)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer flex-shrink-0 self-center"
                          aria-label={t('shopping.deleteItem')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
