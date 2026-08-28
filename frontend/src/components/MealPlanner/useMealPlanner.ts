import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MealPlanEntry, MealType, SavedRecipe, Ingredient } from '../../types';
import type { WeekDayInfo } from './types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../context/I18nContext';
import { apiUrl } from '../../api';
import { hapticLight, hapticMedium } from '../../utils/haptics';

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function useMealPlanner(
  history: SavedRecipe[],
  addRecipeIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void,
) {
  const { getAccessToken, user } = useAuth();
  const toast = useToast();
  const { t, language } = useI18n();

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateIso(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlanEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingToShopping, setIsAddingToShopping] = useState<boolean>(false);
  const [isShopAdded, setIsShopAdded] = useState<boolean>(false);
  const [pickerSlot, setPickerSlot] = useState<{ date: string; mealType: MealType } | null>(null);

  const weekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);
  const startDateStr = useMemo(() => formatDateIso(currentWeekStart), [currentWeekStart]);
  const endDateStr = useMemo(() => formatDateIso(weekEnd), [weekEnd]);

  const isCurrentWeek = useMemo(() => {
    const todayMonday = getMonday(new Date());
    return formatDateIso(todayMonday) === startDateStr;
  }, [startDateStr]);

  // Fetch meal plans for the selected week
  const fetchPlans = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      const res = await fetch(apiUrl(`/api/meal-plan?startDate=${startDateStr}&endDate=${endDateStr}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.mealPlans)) {
        setMealPlans(data.mealPlans);
      }
    } catch (err) {
      console.error('Failed to fetch meal plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken, startDateStr, endDateStr]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Navigation handlers
  const goToPrevWeek = useCallback(() => {
    hapticLight();
    setIsShopAdded(false);
    setCurrentWeekStart((prev) => {
      const next = addDays(prev, -7);
      setSelectedDate(formatDateIso(next));
      return next;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    hapticLight();
    setIsShopAdded(false);
    setCurrentWeekStart((prev) => {
      const next = addDays(prev, 7);
      setSelectedDate(formatDateIso(next));
      return next;
    });
  }, []);

  const goToToday = useCallback(() => {
    hapticLight();
    setIsShopAdded(false);
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    setSelectedDate(formatDateIso(today));
  }, []);

  // Compute 7 days info for the week picker
  const weekDays = useMemo<WeekDayInfo[]>(() => {
    const todayStr = formatDateIso(new Date());
    const dayNamesDe = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = language === 'en' ? dayNamesEn : dayNamesDe;

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(currentWeekStart, i);
      const dStr = formatDateIso(d);
      const dayPlans = mealPlans.filter((p) => p.planDate === dStr);
      const plannedCount = dayPlans.length;
      const cookedCount = dayPlans.filter((p) => p.isCooked).length;

      return {
        date: d,
        dateStr: dStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dStr === todayStr,
        plannedCount,
        cookedCount,
      };
    });
  }, [currentWeekStart, mealPlans, language]);

  // Add a recipe to meal plan
  const addPlan = useCallback(
    async (recipe: SavedRecipe, planDate: string, mealType: MealType, servings?: number) => {
      if (!user) return;
      const targetServings = servings ?? (recipe.recipe?.servings ? Number(recipe.recipe.servings) : 2);
      try {
        const token = await getAccessToken();
        const res = await fetch(apiUrl('/api/meal-plan'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipeId: recipe.recipeId,
            planDate,
            mealType,
            servings: targetServings,
          }),
        });
        const data = await res.json();
        if (data.success && data.mealPlan) {
          setMealPlans((prev) => [...prev, data.mealPlan]);
          toast.success(t('mealPlanner.addedToPlan'));
        }
      } catch (err) {
        console.error('Failed to create meal plan:', err);
      }
    },
    [user, getAccessToken, toast, t],
  );

  // Update servings
  const updateServings = useCallback(
    async (id: string, newServings: number) => {
      if (newServings < 1) return;
      setMealPlans((prev) => prev.map((p) => (p.id === id ? { ...p, servings: newServings } : p)));
      try {
        const token = await getAccessToken();
        await fetch(apiUrl(`/api/meal-plan/${id}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ servings: newServings }),
        });
      } catch (err) {
        console.error('Failed to update servings:', err);
        fetchPlans();
      }
    },
    [getAccessToken, fetchPlans],
  );

  // Toggle cooked status
  const toggleCooked = useCallback(
    async (entry: MealPlanEntry) => {
      const nextCooked = !entry.isCooked;
      setMealPlans((prev) => prev.map((p) => (p.id === entry.id ? { ...p, isCooked: nextCooked } : p)));
      try {
        const token = await getAccessToken();
        await fetch(apiUrl(`/api/meal-plan/${entry.id}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isCooked: nextCooked }),
        });
        toast.info(
          nextCooked ? t('mealPlanner.markAsCooked') : t('mealPlanner.markAsUncooked'),
        );
      } catch (err) {
        console.error('Failed to toggle cooked state:', err);
        fetchPlans();
      }
    },
    [getAccessToken, toast, t, fetchPlans],
  );

  // Move entry to tomorrow
  const moveToTomorrow = useCallback(
    async (entry: MealPlanEntry) => {
      const currentDate = new Date(entry.planDate + 'T00:00:00');
      const tomorrow = addDays(currentDate, 1);
      const tomorrowStr = formatDateIso(tomorrow);
      setMealPlans((prev) =>
        prev.map((p) => (p.id === entry.id ? { ...p, planDate: tomorrowStr } : p)),
      );
      try {
        const token = await getAccessToken();
        await fetch(apiUrl(`/api/meal-plan/${entry.id}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planDate: tomorrowStr }),
        });
        toast.success(t('mealPlanner.movedToTomorrow'));
      } catch (err) {
        console.error('Failed to move plan to tomorrow:', err);
        fetchPlans();
      }
    },
    [getAccessToken, toast, t, fetchPlans],
  );

  // Delete plan entry
  const deletePlan = useCallback(
    async (id: string) => {
      setMealPlans((prev) => prev.filter((p) => p.id !== id));
      try {
        const token = await getAccessToken();
        await fetch(apiUrl(`/api/meal-plan/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.info(t('mealPlanner.removeFromPlan'));
      } catch (err) {
        console.error('Failed to delete meal plan:', err);
        fetchPlans();
      }
    },
    [getAccessToken, toast, t, fetchPlans],
  );

  // Batch add week ingredients to shopping list
  const addWeekToShoppingList = useCallback(async () => {
    if (!addRecipeIngredients) return;
    setIsAddingToShopping(true);
    try {
      let addedCount = 0;
      for (const entry of mealPlans) {
        const fullRecipe = history.find((h) => h.recipeId === entry.recipeId)?.recipe || entry.recipe;
        if (!fullRecipe || !fullRecipe.ingredients) continue;

        const baseServings = fullRecipe.servings ? Number(fullRecipe.servings) : 2;
        const scaleFactor = (entry.servings || baseServings) / baseServings;

        // Flatten & scale ingredients
        const scaledIngredients: Ingredient[] = [];
        for (const group of fullRecipe.ingredients) {
          for (const item of group.items) {
            scaledIngredients.push({
              ...item,
              amount: (item.amount || 0) * scaleFactor,
            });
          }
        }

        if (scaledIngredients.length > 0) {
          addRecipeIngredients(scaledIngredients, entry.recipeId, fullRecipe.title || 'Rezept');
          addedCount++;
        }
      }

      if (addedCount > 0) {
        hapticMedium();
        setIsShopAdded(true);
        toast.success(t('mealPlanner.addedToShoppingList'));
      } else {
        toast.info(t('mealPlanner.noPlannedRecipes'));
      }
    } finally {
      setIsAddingToShopping(false);
    }
  }, [addRecipeIngredients, mealPlans, history, toast, t]);

  const activeDayEntries = useMemo(() => {
    return mealPlans.filter((p) => p.planDate === selectedDate);
  }, [mealPlans, selectedDate]);

  return {
    currentWeekStart,
    weekEnd,
    isCurrentWeek,
    selectedDate,
    setSelectedDate,
    mealPlans,
    activeDayEntries,
    weekDays,
    isLoading,
    isAddingToShopping,
    isShopAdded,
    pickerSlot,
    setPickerSlot,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    addPlan,
    updateServings,
    toggleCooked,
    moveToTomorrow,
    deletePlan,
    addWeekToShoppingList,
  };
}
