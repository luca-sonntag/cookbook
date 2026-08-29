import { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCheck, ShoppingCart } from 'lucide-react';
import type { AggregatedShoppingItem, ShoppingListItem } from '../../types';
import { categoryOrder } from '../../i18n';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { formatQuantity } from '../../utils/formatQuantity';
import { PageHeader } from '../PageHeader';

// Import subcomponents
import CustomItemForm from './CustomItemForm';
import ShoppingListGroup from './ShoppingListGroup';
import ShoppingCheckedDrawer from './ShoppingCheckedDrawer';
import ShoppingEmptyState from './ShoppingEmptyState';
import ShoppingAllDoneState from './ShoppingAllDoneState';
import ShoppingRecipeCarousel from './ShoppingRecipeCarousel';
import type { SavedRecipe } from '../../types';

interface ActiveShoppingRecipe {
  recipeId: string;
  recipeTitle: string;
  totalItems: number;
  checkedItems: number;
}

interface ShoppingListProps {
  shoppingList?: ShoppingListItem[];
  aggregatedList: {
    unchecked: AggregatedShoppingItem[];
    checked: AggregatedShoppingItem[];
  };
  activeRecipes?: ActiveShoppingRecipe[];
  history?: SavedRecipe[];
  onSelectRecipe?: (jobId: string) => void;
  onRemoveRecipe?: (recipeId: string) => void;
  addCustomItem: (name: string, amount: number, unit: string) => void;
  toggleItemIds?: (itemIds: string[], targetChecked: boolean) => void;
  deleteItemIds?: (itemIds: string[]) => void;
  toggleItemGroup: (name: string, modifier: string | undefined, unit: string, targetChecked: boolean) => void;
  deleteItemGroup: (name: string, modifier: string | undefined, unit: string) => void;
  clearAll: () => void;
  clearChecked: () => void;
  restoreItems?: (items: ShoppingListItem[]) => void;
  restoreList?: (items: ShoppingListItem[]) => void;
}

export default function ShoppingList({
  shoppingList = [],
  aggregatedList,
  activeRecipes = [],
  history = [],
  onSelectRecipe,
  onRemoveRecipe,
  addCustomItem,
  toggleItemIds,
  deleteItemIds,
  toggleItemGroup,
  deleteItemGroup,
  clearAll,
  clearChecked,
  restoreItems,
  restoreList
}: ShoppingListProps) {
  const dialog = useDialog();
  const { t } = useI18n();
  const toast = useToast();

  // Local UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState<Set<string>>(new Set());
  const [collapsingKeys, setCollapsingKeys] = useState<Set<string>>(new Set());

  const getItemKey = (item: AggregatedShoppingItem) =>
    `${item.baseName || item.name}|${(item.modifier || '').toLowerCase().trim()}|${item.unit}`.toLowerCase();

  const categoryIndex = (cat: string) => {
    const idx = (categoryOrder as readonly string[]).indexOf(cat.toUpperCase());
    return idx === -1 ? 999 : idx;
  };

  const triggerCollapseAndAction = (
    keysToCollapse: string[],
    action: () => void,
    keysToMarkChecking?: string[]
  ) => {
    if (keysToMarkChecking && keysToMarkChecking.length > 0) {
      // 1. Immediately show checkmark & strikethrough feedback so user sees it
      setCheckingKeys((prev) => {
        const next = new Set(prev);
        keysToMarkChecking.forEach((k) => next.add(k));
        return next;
      });

      // 2. Brief satisfying pause (280ms) to perceive the checkmark animation
      setTimeout(() => {
        // 3. Smooth collapse animation (200ms)
        setCollapsingKeys((prev) => {
          const next = new Set(prev);
          keysToCollapse.forEach((k) => next.add(k));
          return next;
        });

        setTimeout(() => {
          action();
          requestAnimationFrame(() => {
            setCheckingKeys((prev) => {
              const next = new Set(prev);
              keysToMarkChecking.forEach((k) => next.delete(k));
              return next;
            });
            setCollapsingKeys((prev) => {
              const next = new Set(prev);
              keysToCollapse.forEach((k) => next.delete(k));
              return next;
            });
          });
        }, 200);
      }, 280);
    } else {
      // Direct collapse for unchecking / deleting
      setCollapsingKeys((prev) => {
        const next = new Set(prev);
        keysToCollapse.forEach((k) => next.add(k));
        return next;
      });
      setTimeout(() => {
        action();
        requestAnimationFrame(() => {
          setCollapsingKeys((prev) => {
            const next = new Set(prev);
            keysToCollapse.forEach((k) => next.delete(k));
            return next;
          });
        });
      }, 200);
    }
  };

  const handleItemToggle = (item: AggregatedShoppingItem) => {
    const key = getItemKey(item);
    const displayKey = `${item.checked ? 'checked' : 'unchecked'}-${key}`;
    const keysToCollapse = [displayKey];

    // Checking an item off: if it's the last open item in its aisle, collapse the
    // whole aisle so it disappears cleanly as the item moves to the "Erledigt" drawer.
    let keysToMarkChecking: string[] | undefined;
    if (!item.checked) {
      keysToMarkChecking = [displayKey];
      const cat = item.category || 'OTHER';
      const openInCat = aggregatedList.unchecked.filter((i) => (i.category || 'OTHER') === cat);
      if (openInCat.length === 1) {
        keysToCollapse.push(`group-${cat}`);
      }
    }

    triggerCollapseAndAction(keysToCollapse, () => {
      if (toggleItemIds && item.itemIds?.length) {
        toggleItemIds(item.itemIds, !item.checked);
      } else {
        toggleItemGroup(item.baseName || item.name, item.modifier, item.unit, !item.checked);
      }
    }, keysToMarkChecking);
  };

  // Check off every item in an aisle at once (aisle groups only ever hold open items).
  const handleGroupHeaderClick = (items: AggregatedShoppingItem[]) => {
    if (items.length === 0) return;
    const keys = items.map((i) => `unchecked-${getItemKey(i)}`);
    const keysToCollapse = [...keys, `group-${items[0].category || 'OTHER'}`];

    triggerCollapseAndAction(keysToCollapse, () => {
      if (toggleItemIds) {
        const allItemIds = items.flatMap((i) => i.itemIds || []);
        toggleItemIds(allItemIds, true);
      } else {
        items.forEach((i) => toggleItemGroup(i.baseName || i.name, i.modifier, i.unit, true));
      }
    }, keys);
  };

  const formatItemAmount = (amount: number, unit: string) => {
    if (!amount) return '';
    const numberStr = formatQuantity(amount, unit);
    if (!numberStr) return '';
    const unitStr = unit ? ` ${unit}` : '';
    return `${numberStr}${unitStr}`;
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
      const allItems = [...shoppingList];
      clearAll();
      toast.info(t('toast.clearedAllItems'), {
        action: restoreList && allItems.length > 0
          ? {
              label: t('toast.undo'),
              onClick: () => restoreList(allItems),
            }
          : undefined,
      });
    }
  };

  const handleClearChecked = () => {
    const checkedItems = shoppingList.filter((item) => item.checked);
    if (checkedItems.length === 0) return;
    clearChecked();
    toast.info(t('toast.clearedCheckedItems', { count: checkedItems.length }), {
      action: restoreItems
        ? {
            label: t('toast.undo'),
            onClick: () => restoreItems(checkedItems),
          }
        : undefined,
    });
  };

  const handleRemoveRecipe = async (recipeId: string, recipeTitle: string) => {
    const confirmed = await dialog.confirm({
      title: t('shopping.removeRecipeConfirmTitle'),
      message: t('shopping.removeRecipeConfirmMessage', { title: recipeTitle }),
      confirmLabel: t('shopping.removeRecipeConfirmBtn'),
      cancelLabel: t('shopping.dialogClear.cancel'),
      status: 'danger'
    });
    if (confirmed && onRemoveRecipe) {
      onRemoveRecipe(recipeId);
    }
  };

  const toggleAddForm = () => {
    setShowAddForm((prev) => !prev);
  };

  const checkedCount = aggregatedList.checked.length;
  const totalCount = aggregatedList.unchecked.length + checkedCount;
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Active aisles (still to buy), ordered by supermarket layout.
  const activeGroups = useMemo(() => {
    const groups: Record<string, AggregatedShoppingItem[]> = {};
    aggregatedList.unchecked.forEach((item) => {
      const cat = item.category || 'OTHER';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.keys(groups)
      .map((category) => ({ category, items: groups[category] }))
      .sort((a, b) => categoryIndex(a.category) - categoryIndex(b.category));
  }, [aggregatedList.unchecked]);

  // Checked items for the drawer — flat list, ordered by the same supermarket layout.
  const checkedSorted = useMemo(() => {
    return [...aggregatedList.checked].sort(
      (a, b) => categoryIndex(a.category || 'OTHER') - categoryIndex(b.category || 'OTHER')
    );
  }, [aggregatedList.checked]);

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Page Header */}
      <div className="w-full flex flex-col gap-2">
        <PageHeader
          icon={<ShoppingCart className="w-6 h-6" />}
          title={t('shopping.title')}
          subtitle={
            totalCount > 0
              ? t('shopping.progressSubtitle', { checked: checkedCount, total: totalCount })
              : t('shopping.subtitle')
          }
          action={
            totalCount > 0 ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {checkedCount > 0 && (
                  <button
                    onClick={handleClearChecked}
                    aria-label={t('shopping.clearChecked')}
                    title={t('shopping.clearChecked')}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-2xl border-none bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-90 transition-all cursor-pointer shadow-2xs"
                  >
                    <CheckCheck className="w-5 h-5 stroke-[2.25]" />
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  aria-label={t('shopping.clearAll')}
                  title={t('shopping.clearAll')}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-2xl border-none bg-black/5 dark:bg-white/5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : undefined
          }
        />

        {totalCount > 0 && (
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Bottom Sheet add-item form */}
      <CustomItemForm
        isOpen={showAddForm}
        addCustomItem={addCustomItem}
        onClose={() => setShowAddForm(false)}
      />

      {totalCount === 0 ? (
        <ShoppingEmptyState />
      ) : (
        <div className="flex flex-col gap-3 pb-28">
          {/* Active Recipe Tiles Carousel */}
          {activeRecipes.length > 0 && onSelectRecipe && (
            <ShoppingRecipeCarousel
              recipes={activeRecipes}
              history={history}
              onSelectRecipe={onSelectRecipe}
              onRemoveRecipe={handleRemoveRecipe}
            />
          )}

          {activeGroups.length > 0 ? (
            <ShoppingListGroup
              groupedCategories={activeGroups}
              getItemKey={getItemKey}
              onItemToggle={handleItemToggle}
              onGroupHeaderClick={handleGroupHeaderClick}
              onDelete={(item) => (deleteItemIds && item.itemIds?.length ? deleteItemIds(item.itemIds) : deleteItemGroup(item.baseName || item.name, item.modifier, item.unit))}
              formatItemAmount={formatItemAmount}
              collapsingKeys={collapsingKeys}
              checkingKeys={checkingKeys}
            />
          ) : (
            <ShoppingAllDoneState onClear={handleClearChecked} />
          )}

          <ShoppingCheckedDrawer
            items={checkedSorted}
            getItemKey={getItemKey}
            onItemToggle={handleItemToggle}
            onDelete={(item) => (deleteItemIds && item.itemIds?.length ? deleteItemIds(item.itemIds) : deleteItemGroup(item.baseName || item.name, item.modifier, item.unit))}
            formatItemAmount={formatItemAmount}
            collapsingKeys={collapsingKeys}
          />
        </div>
      )}

      {/* Floating Add FAB — bottom-right corner so it never sits over centered
          content (e.g. the empty-state CTA). Sits just above the nav bar and
          respects the device safe-area inset. */}
      <button
        type="button"
        onClick={toggleAddForm}
        aria-label={t('shopping.addTitle')}
        className="fixed right-4 bottom-[calc(6.5rem_+_var(--safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer animate-fade-in-up"
      >
        <Plus className={`w-6 h-6 transition-transform duration-200 ${showAddForm ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
}
