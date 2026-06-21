import { useState, useEffect, useMemo, useRef } from 'react';
import type { Job, Ingredient } from '../types';
import { useI18n } from '../context/I18nContext';
import { useDialog } from '../context/DialogContext';

interface UseSavedCatalogProps {
  history: Job[];
  setSelectedJob: (job: Job | null) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  fetchHistory?: () => void;
}

export function useSavedCatalog({
  history,
  setSelectedJob,
  onAddIngredients,
  fetchHistory
}: UseSavedCatalogProps) {
  const dialog = useDialog();
  const { t, language } = useI18n();

  const completedJobs = useMemo(() => history.filter(h => h.status === 'completed' && h.recipe), [history]);

  // View Layout mode: 'card' or 'compact', persisted in localStorage
  const [viewMode, setViewMode] = useState<'card' | 'compact'>(() => {
    return (localStorage.getItem('recipe_catalog_view') as 'card' | 'compact') || 'card';
  });

  useEffect(() => {
    localStorage.setItem('recipe_catalog_view', viewMode);
  }, [viewMode]);

  // State for search query & tag filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Direct shopping list addition success states (mapping job.id -> isAdded)
  const [addedRecipeIds, setAddedRecipeIds] = useState<Record<string, boolean>>({});

  // Pointer/Long press logic
  const longPressTimeout = useRef<Record<string, any>>({});
  const pressStartTime = useRef<number>(0);

  // Format prep and cook time helper supporting both legacy string values and new number values
  const formatTimeValue = (time: any) => {
    if (time === undefined || time === null || time === '') return 'N/A';
    if (typeof time === 'number') {
      return t('recipe.minutes', { count: time });
    }
    const strTime = String(time).trim();
    const match = strTime.match(/\d+/);
    if (match) {
      return t('recipe.minutes', { count: match[0] });
    }
    return strTime;
  };

  // Fallback tagging logic for old recipes in the database
  // Programmatic duration badge calculation (Frontend only)
  const getDurationBadge = (recipe: any): string | null => {
    const prep = typeof recipe.prepTime === 'number' ? recipe.prepTime : (parseInt(recipe.prepTime) || 0);
    const cook = typeof recipe.cookTime === 'number' ? recipe.cookTime : (parseInt(recipe.cookTime) || 0);
    const totalTime = prep + cook;
    if (totalTime > 0) {
      if (totalTime < 15) {
        return t('catalog.under15');
      } else if (totalTime < 30) {
        return t('catalog.under30');
      }
    }
    return null;
  };

  // Get recipe tags sanitized of any time-based tags
  const getRecipeTags = (recipe: any): string[] => {
    const rawTags = recipe.tags || [];
    return rawTags.filter((tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      return !(trimmedTag.includes('min') || trimmedTag.startsWith('<') || trimmedTag.startsWith('unter'));
    });
  };

  // Collect all unique tags dynamically (actual + fallback, filtering out time-based tags)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    completedJobs.forEach(job => {
      if (job.recipe) {
        getRecipeTags(job.recipe).forEach((tag: string) => {
          const trimmedTag = tag.trim();
          const isTimeTag = trimmedTag.toLowerCase().includes('min') || trimmedTag.startsWith('<') || trimmedTag.toLowerCase().startsWith('unter');
          if (!isTimeTag) {
            tagsSet.add(trimmedTag);
          }
        });
      }
    });
    return Array.from(tagsSet);
  }, [completedJobs, language]);

  // Filter jobs based on search query and active filter chip
  const filteredJobs = useMemo(() => {
    return completedJobs.filter(job => {
      const r = job.recipe!;

      // 1. Search Query filter (matches title, description, tags, ingredients)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesDesc = r.description?.toLowerCase() || '';
        const descMatches = matchesDesc.includes(query);
        const matchesTags = getRecipeTags(r).some((tag: string) => tag.toLowerCase().includes(query));
        const matchesIngredients = r.ingredients?.some(group =>
          group.items?.some(ing => ing.name.toLowerCase().includes(query))
        ) || false;

        if (!matchesTitle && !descMatches && !matchesTags && !matchesIngredients) {
          return false;
        }
      }

      // 2. Chip Filter
      if (activeFilter && activeFilter !== 'all') {
        const tags = getRecipeTags(r);
        if (activeFilter === 'under15') {
          const prep = typeof r.prepTime === 'number' ? r.prepTime : (parseInt(String(r.prepTime)) || 0);
          const cook = typeof r.cookTime === 'number' ? r.cookTime : (parseInt(String(r.cookTime)) || 0);
          return (prep + cook) > 0 && (prep + cook) <= 15;
        }
        if (activeFilter === 'under30') {
          const prep = typeof r.prepTime === 'number' ? r.prepTime : (parseInt(String(r.prepTime)) || 0);
          const cook = typeof r.cookTime === 'number' ? r.cookTime : (parseInt(String(r.cookTime)) || 0);
          return (prep + cook) > 0 && (prep + cook) <= 30;
        }
        return tags.includes(activeFilter);
      }

      return true;
    });
  }, [completedJobs, searchQuery, activeFilter, language]);

  // Helper to check if event target is inside an interactive element
  const isInteractiveTarget = (target: HTMLElement) => {
    return !!target.closest('button, a, [role="button"]');
  };

  // Long press event handlers
  const handlePointerDown = (e: React.PointerEvent, jobId: string) => {
    if (isInteractiveTarget(e.target as HTMLElement)) {
      return;
    }
    pressStartTime.current = Date.now();
    longPressTimeout.current[jobId] = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
    }, 600);
  };

  const handlePointerUp = (e: React.PointerEvent, job: Job) => {
    if (isInteractiveTarget(e.target as HTMLElement)) {
      return;
    }
    if (longPressTimeout.current[job.id]) {
      clearTimeout(longPressTimeout.current[job.id]);
      delete longPressTimeout.current[job.id];
    }
    const pressDuration = Date.now() - pressStartTime.current;
    if (pressDuration < 600) {
      handleCardClick(e as any, job);
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerLeave = (jobId: string) => {
    if (longPressTimeout.current[jobId]) {
      clearTimeout(longPressTimeout.current[jobId]);
      delete longPressTimeout.current[jobId];
    }
  };

  const bindLongPress = (jobId: string, job: Job) => {
    return {
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, jobId),
      onPointerUp: (e: React.PointerEvent) => handlePointerUp(e, job),
      onPointerLeave: () => handlePointerLeave(jobId),
    };
  };

  const handleCardClick = (e: React.MouseEvent, job: Job) => {
    if (isInteractiveTarget(e.target as HTMLElement)) {
      return;
    }
    if (isSelectMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(job.id)) {
          next.delete(job.id);
          if (next.size === 0) {
            setIsSelectMode(false);
          }
        } else {
          next.add(job.id);
        }
        return next;
      });
    } else {
      setSelectedJob(job);
    }
  };

  // Direct add all ingredients of a recipe to shopping list
  const handleDirectAddToShoppingList = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const r = job.recipe!;
    if (!onAddIngredients) return;

    const itemsToAdd: Ingredient[] = [];
    r.ingredients.forEach((group) => {
      group.items.forEach((ing) => {
        itemsToAdd.push({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit || '',
          notes: ing.notes,
          category: group.name
        });
      });
    });

    if (itemsToAdd.length === 0) return;

    onAddIngredients(itemsToAdd, job.id, r.title);

    // Checkmark success animation trigger
    setAddedRecipeIds(prev => ({ ...prev, [job.id]: true }));
    setTimeout(() => {
      setAddedRecipeIds(prev => ({ ...prev, [job.id]: false }));
    }, 2000);
  };

  // Bulk add to shopping list in Multi-Select mode
  const handleBulkAddToShoppingList = () => {
    if (!onAddIngredients) return;

    let totalAdded = 0;
    const selectedJobs = completedJobs.filter(j => selectedIds.has(j.id));

    selectedJobs.forEach(job => {
      const r = job.recipe!;
      const itemsToAdd: Ingredient[] = [];
      r.ingredients.forEach((group) => {
        group.items.forEach((ing) => {
          itemsToAdd.push({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit || '',
            notes: ing.notes,
            category: group.name
          });
        });
      });

      if (itemsToAdd.length > 0) {
        onAddIngredients(itemsToAdd, job.id, r.title);
        totalAdded++;
      }
    });

    if (totalAdded > 0) {
      setIsSelectMode(false);
      setSelectedIds(new Set());

      dialog.alert({
        title: t('recipe.addedToShopping'),
        message: language === 'de'
          ? `Zutaten aus ${totalAdded} Rezepten wurden erfolgreich hinzugefügt!`
          : `Ingredients from ${totalAdded} recipes have been successfully added!`,
        status: 'success'
      });
    }
  };

  // Bulk delete in Multi-Select mode
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    const confirmed = await dialog.confirm({
      title: t('catalog.confirmBulkDeleteTitle'),
      message: t('catalog.confirmBulkDeleteMessage', { count }),
      confirmLabel: t('app.dialog.deleteRecipe.confirm'),
      cancelLabel: t('app.dialog.deleteRecipe.cancel'),
      status: 'danger'
    });

    if (!confirmed) return;

    const deletePromises = Array.from(selectedIds).map(async (id) => {
      try {
        await fetch(`/api/jobs/${id}`, {
          method: 'DELETE',
          headers: {
            'X-API-Key': localStorage.getItem('recipe_api_key') || 'recipe_extractor_secret_key_12345'
          }
        });
      } catch (err) {
        console.error('Error deleting recipe:', id, err);
      }
    });

    await Promise.all(deletePromises);
    setIsSelectMode(false);
    setSelectedIds(new Set());

    if (fetchHistory) {
      fetchHistory();
    }
  };

  return {
    completedJobs,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
    addedRecipeIds,
    filteredJobs,
    allTags,
    formatTimeValue,
    getDurationBadge,
    getRecipeTags,
    bindLongPress,
    handleCardClick,
    handleDirectAddToShoppingList,
    handleBulkAddToShoppingList,
    handleBulkDelete
  };
}
