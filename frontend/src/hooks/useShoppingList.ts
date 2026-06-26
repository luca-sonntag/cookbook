import { useState, useMemo } from 'react';
import type { Ingredient, ShoppingListItem, AggregatedShoppingItem } from '../types';

export function useShoppingList() {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
      const saved = localStorage.getItem('recipe_shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveList = (listOrUpdater: ShoppingListItem[] | ((prev: ShoppingListItem[]) => ShoppingListItem[])) => {
    setShoppingList(prev => {
      const next = typeof listOrUpdater === 'function' ? listOrUpdater(prev) : listOrUpdater;
      try {
        localStorage.setItem('recipe_shopping_list', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save shopping list:', err);
      }
      return next;
    });
  };

  // Add scaled, unchecked ingredients from a recipe
  const addRecipeIngredients = (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => {
    saveList(prevList => {
      // Remove previous items from this recipe to prevent duplicates on portion adjustments
      const filteredList = prevList.filter(item => item.recipeId !== recipeId);

      // Map new ingredients
      const newItems: ShoppingListItem[] = ingredients.map((ing, idx) => ({
        id: `${recipeId}-${encodeURIComponent(ing.name)}-${idx}-${Date.now()}`,
        name: ing.name,
        baseName: ing.baseName,
        modifier: ing.modifier,
        amount: ing.amount || 0,
        unit: ing.unit || '',
        recipeId,
        recipeTitle,
        checked: false,
        notes: ing.notes,
        createdAt: new Date().toISOString(),
        category: ing.category
      }));

      return [...filteredList, ...newItems];
    });
  };

  // Add custom manual item
  const addCustomItem = (name: string, amount: number, unit: string, notes?: string) => {
    saveList(prevList => {
      const newItem: ShoppingListItem = {
        id: `manual-${encodeURIComponent(name)}-${Date.now()}`,
        name,
        amount: amount || 0,
        unit: unit || '',
        checked: false,
        notes,
        createdAt: new Date().toISOString(),
        category: 'OTHER'
      };
      return [...prevList, newItem];
    });
  };

  // Toggle check state of an aggregated group
  const toggleItemGroup = (groupKeyName: string, modifier: string | undefined, unit: string, targetChecked: boolean) => {
    const keyName = groupKeyName.toLowerCase().trim();
    const keyModifier = (modifier || '').toLowerCase().trim();
    const keyUnit = unit.toLowerCase().trim();

    saveList(prevList =>
      prevList.map(item => {
        const matchName = (item.baseName || item.name).toLowerCase().trim() === keyName;
        const matchModifier = (item.modifier || '').toLowerCase().trim() === keyModifier;
        if (matchName && matchModifier && item.unit.toLowerCase().trim() === keyUnit) {
          return { ...item, checked: targetChecked };
        }
        return item;
      })
    );
  };

  // Delete all items of an aggregated group
  const deleteItemGroup = (groupKeyName: string, modifier: string | undefined, unit: string) => {
    const keyName = groupKeyName.toLowerCase().trim();
    const keyModifier = (modifier || '').toLowerCase().trim();
    const keyUnit = unit.toLowerCase().trim();

    saveList(prevList =>
      prevList.filter(item => {
        const matchName = (item.baseName || item.name).toLowerCase().trim() === keyName;
        const matchModifier = (item.modifier || '').toLowerCase().trim() === keyModifier;
        const matchUnit = item.unit.toLowerCase().trim() === keyUnit;
        return !(matchName && matchModifier && matchUnit);
      })
    );
  };

  // Clear all items from the list
  const clearAll = () => {
    saveList([]);
  };

  // Clear only checked items
  const clearChecked = () => {
    saveList(prevList => prevList.filter(item => !item.checked));
  };

  // Aggregate items: group by lowercase name and unit.
  const aggregatedList = useMemo(() => {
    const uncheckedMap = new Map<string, AggregatedShoppingItem>();
    const checkedMap = new Map<string, AggregatedShoppingItem>();

    shoppingList.forEach(item => {
      const groupKeyName = item.baseName || item.name;
      const key = `${groupKeyName.toLowerCase().trim()}|${(item.modifier || '').toLowerCase().trim()}|${item.unit.toLowerCase().trim()}`;
      const targetMap = item.checked ? checkedMap : uncheckedMap;

      const existing = targetMap.get(key);
      if (existing) {
        existing.amount += item.amount;
        if (!existing.category && item.category) {
          existing.category = item.category;
        }
        // Avoid duplicate sources for the same recipe
        const hasSource = existing.sources.some(s => s.recipeId === item.recipeId);
        if (!hasSource) {
          existing.sources.push({
            recipeId: item.recipeId,
            recipeTitle: item.recipeTitle,
            amount: item.amount,
            unit: item.unit
          });
        } else {
          // If already has source, add the amount to that source
          const sourceObj = existing.sources.find(s => s.recipeId === item.recipeId);
          if (sourceObj) {
            sourceObj.amount += item.amount;
          }
        }
      } else {
        targetMap.set(key, {
          name: item.name, // Keep the display name of the first item
          baseName: item.baseName,
          modifier: item.modifier,
          unit: item.unit,
          amount: item.amount,
          checked: item.checked,
          category: item.category,
          sources: [{
            recipeId: item.recipeId,
            recipeTitle: item.recipeTitle,
            amount: item.amount,
            unit: item.unit
          }]
        });
      }
    });

    return {
      unchecked: Array.from(uncheckedMap.values()),
      checked: Array.from(checkedMap.values())
    };
  }, [shoppingList]);

  return {
    shoppingList,
    aggregatedList,
    addRecipeIngredients,
    addCustomItem,
    toggleItemGroup,
    deleteItemGroup,
    clearAll,
    clearChecked
  };
}
