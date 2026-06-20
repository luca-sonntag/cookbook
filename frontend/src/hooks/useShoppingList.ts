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

  const saveList = (list: ShoppingListItem[]) => {
    setShoppingList(list);
    try {
      localStorage.setItem('recipe_shopping_list', JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save shopping list:', err);
    }
  };

  // Add scaled, unchecked ingredients from a recipe
  const addRecipeIngredients = (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => {
    // Remove previous items from this recipe to prevent duplicates on portion adjustments
    const filteredList = shoppingList.filter(item => item.recipeId !== recipeId);

    // Map new ingredients
    const newItems: ShoppingListItem[] = ingredients.map((ing, idx) => ({
      id: `${recipeId}-${encodeURIComponent(ing.name)}-${idx}-${Date.now()}`,
      name: ing.name,
      baseName: ing.baseName,
      amount: ing.amount || 0,
      unit: ing.unit || '',
      recipeId,
      recipeTitle,
      checked: false,
      notes: ing.notes,
      createdAt: new Date().toISOString(),
      category: ing.category
    }));

    saveList([...filteredList, ...newItems]);
  };

  // Add custom manual item
  const addCustomItem = (name: string, amount: number, unit: string, notes?: string) => {
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
    saveList([...shoppingList, newItem]);
  };

  // Toggle check state of an aggregated group
  const toggleItemGroup = (groupKeyName: string, unit: string, targetChecked: boolean) => {
    const keyName = groupKeyName.toLowerCase().trim();
    const keyUnit = unit.toLowerCase().trim();

    const updatedList = shoppingList.map(item => {
      const matchName = (item.baseName || item.name).toLowerCase().trim() === keyName;
      if (matchName && item.unit.toLowerCase().trim() === keyUnit) {
        return { ...item, checked: targetChecked };
      }
      return item;
    });

    saveList(updatedList);
  };

  // Delete all items of an aggregated group
  const deleteItemGroup = (groupKeyName: string, unit: string) => {
    const keyName = groupKeyName.toLowerCase().trim();
    const keyUnit = unit.toLowerCase().trim();

    const updatedList = shoppingList.filter(item => {
      const matchName = (item.baseName || item.name).toLowerCase().trim() === keyName;
      const matchUnit = item.unit.toLowerCase().trim() === keyUnit;
      return !(matchName && matchUnit);
    });

    saveList(updatedList);
  };

  // Clear all items from the list
  const clearAll = () => {
    saveList([]);
  };

  // Clear only checked items
  const clearChecked = () => {
    saveList(shoppingList.filter(item => !item.checked));
  };

  // Aggregate items: group by lowercase name and unit.
  const aggregatedList = useMemo(() => {
    const uncheckedMap = new Map<string, AggregatedShoppingItem>();
    const checkedMap = new Map<string, AggregatedShoppingItem>();

    shoppingList.forEach(item => {
      const groupKeyName = item.baseName || item.name;
      const key = `${groupKeyName.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}`;
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
