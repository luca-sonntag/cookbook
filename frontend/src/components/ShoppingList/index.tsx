import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, Button } from '@heroui/react';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
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

  // Pending-check state: items that have been clicked but not yet moved to "in cart"
  const [pendingChecks, setPendingChecks] = useState<Set<string>>(new Set());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const PENDING_CHECK_DELAY_MS = 600;

  const getItemKey = (item: AggregatedShoppingItem) =>
    `${item.baseName || item.name}|${(item.modifier || '').toLowerCase().trim()}|${item.unit}`.toLowerCase();

  const cancelPendingCheck = (key: string) => {
    const timer = pendingTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      pendingTimers.current.delete(key);
    }
    setPendingChecks((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const schedulePendingCheck = (key: string, item: AggregatedShoppingItem) => {
    // Cancel any existing timer for this key
    const existing = pendingTimers.current.get(key);
    if (existing) clearTimeout(existing);

    // Mark as pending (visual checked state)
    setPendingChecks((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // After delay, actually move to "in cart"
    const timer = setTimeout(() => {
      pendingTimers.current.delete(key);
      setPendingChecks((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toggleItemGroup(item.baseName || item.name, item.modifier, item.unit, true);
    }, PENDING_CHECK_DELAY_MS);

    pendingTimers.current.set(key, timer);
  };

  const handleUncheckedClick = (item: AggregatedShoppingItem) => {
    const key = getItemKey(item);
    if (pendingChecks.has(key)) {
      // Already pending — clicking again cancels the check
      cancelPendingCheck(key);
      return;
    }
    schedulePendingCheck(key, item);
  };

  const handleCheckedClick = (item: AggregatedShoppingItem) => {
    const key = getItemKey(item);
    // Cancel any pending check for this item (in case it was scheduled)
    cancelPendingCheck(key);
    toggleItemGroup(item.baseName || item.name, item.modifier, item.unit, false);
  };

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = pendingTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

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
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-black/5 dark:border-white/5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <span>{t('shopping.title')}</span>
          </h3>

          {totalCount > 0 && (
            <Button
              size="sm"
              variant="tertiary"
              className="!h-7 !px-2 !py-0 !text-xs text-gray-500 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer"
              onPress={handleClearAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('shopping.clearAll')}</span>
            </Button>
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
            groupedUnchecked={groupedUnchecked}
            checkedItems={aggregatedList.checked}
            pendingChecks={pendingChecks}
            getItemKey={getItemKey}
            onUncheckedClick={handleUncheckedClick}
            onCheckedClick={handleCheckedClick}
            onDelete={(item) => deleteItemGroup(item.baseName || item.name, item.modifier, item.unit)}
            onClearChecked={clearChecked}
            formatItemAmount={formatItemAmount}
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
