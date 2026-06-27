import { useState, useMemo, useRef } from 'react';
import { Card, Button } from '@heroui/react';
import { ShoppingCart, Plus, Trash2, X } from 'lucide-react';
import type { AggregatedShoppingItem } from '../../types';
import { categoryOrder } from '../../i18n';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <span>{t('shopping.title')}</span>
          </h3>

          {totalCount > 0 && (
            <div className="flex items-center gap-2 justify-start w-full sm:justify-end sm:w-auto">
              {aggregatedList.checked.length > 0 && (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="!h-7 !px-2 !py-0 !text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  onPress={clearChecked}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('shopping.clearChecked')}</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="tertiary"
                className="!h-7 !px-2 !py-0 !text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
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
          <ShoppingListGroup
            groupedCategories={groupedCategories}
            getItemKey={getItemKey}
            onItemToggle={handleItemToggle}
            onGroupHeaderClick={handleGroupHeaderClick}
            onDelete={(item) => deleteItemGroup(item.baseName || item.name, item.modifier, item.unit)}
            formatItemAmount={formatItemAmount}
            collapsingKeys={collapsingKeys}
          />
        )}
      </Card>

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
