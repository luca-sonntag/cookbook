import { useState, useMemo, useRef } from 'react';
import { Card } from '@heroui/react';
import { ShoppingCart, Plus, Trash2, X, ListChecks, Sparkles } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { categoryOrder } from '../../i18n';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import FloatingActionBar, { FloatingDivider } from '../FloatingActionBar';

// Import subcomponents
import CustomItemForm from './CustomItemForm';
import ShoppingListGroup from './ShoppingListGroup';

interface ShoppingListProps {
  aggregatedList: {
    unchecked: AggregatedShoppingItem[];
    checked: AggregatedShoppingItem[];
  };
  addCustomItem: (name: string, amount: number, unit: string) => void;
  toggleItemGroup: (name: string, modifier: string | undefined, unit: string, targetChecked: boolean) => void;
  deleteItemGroup: (name: string, modifier: string | undefined, unit: string) => void;
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
  const { t } = useI18n();

  // Local UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const addFormRef = useRef<HTMLDivElement>(null);
  const [collapsingKeys, setCollapsingKeys] = useState<Set<string>>(new Set());

  const getItemKey = (item: AggregatedShoppingItem) =>
    `${item.baseName || item.name}|${(item.modifier || '').toLowerCase().trim()}|${item.unit}`.toLowerCase();

  const triggerCollapseAndAction = (keys: string[], action: () => void) => {
    setCollapsingKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
    setTimeout(() => {
      action();
      setCollapsingKeys((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    }, 200);
  };

  const handleItemToggle = (item: AggregatedShoppingItem) => {
    const key = getItemKey(item);
    const displayKey = `${item.checked ? 'checked' : 'unchecked'}-${key}`;
    const keysToCollapse = [displayKey];

    const cat = item.category || 'OTHER';
    const categoryItems = allAggregatedItems.filter((i) => (i.category || 'OTHER') === cat);
    if (categoryItems.length > 0) {
      if (!item.checked) {
        // Checking: will it complete the category?
        const otherItemsChecked = categoryItems.filter((i) => getItemKey(i) !== key).every((i) => i.checked);
        if (otherItemsChecked) {
          keysToCollapse.push(`group-${cat}`);
        }
      } else {
        // Unchecking: was the category previously fully checked?
        const allItemsChecked = categoryItems.every((i) => i.checked);
        if (allItemsChecked) {
          keysToCollapse.push(`group-${cat}`);
        }
      }
    }

    triggerCollapseAndAction(keysToCollapse, () => {
      toggleItemGroup(item.baseName || item.name, item.modifier, item.unit, !item.checked);
    });
  };

  const handleGroupHeaderClick = (items: AggregatedShoppingItem[]) => {
    const allChecked = items.every((item) => item.checked);
    const keysToCollapse = items
      .filter((item) => item.checked === allChecked)
      .map((item) => {
        const key = getItemKey(item);
        return `${item.checked ? 'checked' : 'unchecked'}-${key}`;
      });

    if (items.length > 0) {
      const cat = items[0].category || 'OTHER';
      keysToCollapse.push(`group-${cat}`);
    }

    triggerCollapseAndAction(keysToCollapse, () => {
      items.forEach((item) => {
        if (item.checked === allChecked) {
          toggleItemGroup(item.baseName || item.name, item.modifier, item.unit, !allChecked);
        }
      });
    });
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

  // Combine checked and unchecked aggregated items
  const allAggregatedItems = useMemo(() => {
    return [...aggregatedList.unchecked, ...aggregatedList.checked];
  }, [aggregatedList.unchecked, aggregatedList.checked]);

  // Group all items by category
  const groupedCategories = useMemo(() => {
    const groups: Record<string, AggregatedShoppingItem[]> = {};

    allAggregatedItems.forEach((item) => {
      const cat = item.category || 'OTHER';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });

    // Map to category groups and pre-calculate checked state
    const mappedGroups = Object.keys(groups).map((cat) => {
      const items = groups[cat];
      const allChecked = items.every((item) => item.checked);
      return {
        category: cat,
        items,
        allChecked,
      };
    });

    // Sort: uncompleted first, completed last. Within each, sort by categoryOrder.
    return mappedGroups.sort((a, b) => {
      if (a.allChecked !== b.allChecked) {
        return a.allChecked ? 1 : -1;
      }
      const idxA = categoryOrder.indexOf(a.category.toUpperCase() as any);
      const idxB = categoryOrder.indexOf(b.category.toUpperCase() as any);
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      return valA - valB;
    });
  }, [allAggregatedItems]);

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Add Custom Item Form */}
      {showAddForm && (
        <CustomItemForm
          addCustomItem={addCustomItem}
          addFormRef={addFormRef}
        />
      )}

      {/* Main Shopping List Content */}
      <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5">
        {/* Progress Stats Bar */}
        {totalCount > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                    {t('shopping.progressLabel', { defaultValue: 'Fortschritt' })}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {aggregatedList.checked.length} / {totalCount}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {Math.round((aggregatedList.checked.length / totalCount) * 100)}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                  {t('shopping.done', { defaultValue: 'Erledigt' })}
                </div>
              </div>
            </div>
            <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(aggregatedList.checked.length / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {totalCount === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse-slow" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">{t('shopping.emptyTitle')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs leading-relaxed">
              {t('shopping.emptyDesc')}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{t('shopping.emptyHint', { defaultValue: 'Tipp: Öffne ein Rezept und tippe auf den Einkaufswagen' })}</span>
            </div>
          </div>
        ) : (
          <>
            <ShoppingListGroup
              groupedCategories={groupedCategories}
              getItemKey={getItemKey}
              onItemToggle={handleItemToggle}
              onGroupHeaderClick={handleGroupHeaderClick}
              onDelete={(item) => deleteItemGroup(item.baseName || item.name, item.modifier, item.unit)}
              formatItemAmount={formatItemAmount}
              collapsingKeys={collapsingKeys}
            />

            {/* Spacer reserves room for the floating clear bar so the last
                category card isn't permanently hidden behind it */}
            <div className="h-20" aria-hidden="true" />
          </>
        )}
      </Card>

      {/* Floating Clear Bar */}
      {totalCount > 0 && (
        <FloatingActionBar className="bottom-24 md:bottom-6">
          {aggregatedList.checked.length > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('shopping.clearChecked')}</span>
            </button>
          )}
          {aggregatedList.checked.length > 0 && <FloatingDivider />}
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('shopping.clearAll')}</span>
          </button>
        </FloatingActionBar>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => {
          const willOpen = !showAddForm;
          setShowAddForm(willOpen);
          // Scroll to top of page when opening the form
          if (willOpen) {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
          }
        }}
        aria-label={t('shopping.addTitle')}
        className="fixed bottom-28 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer"
      >
        <Plus className={`w-6 h-6 transition-transform duration-200 ${showAddForm ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
}
