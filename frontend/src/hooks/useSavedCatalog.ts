import { useState, useEffect, useMemo, useRef } from 'react';
import type { Job, Ingredient, Collection } from '../types';
import { useI18n } from '../context/I18nContext';
import { useDialog } from '../context/DialogContext';
import { useAuth } from '../context/AuthContext';
import { deleteCachedImage } from '../utils/imageStore';
import { apiUrl } from '../api';

interface UseSavedCatalogProps {
  history: Job[];
  setSelectedJob: (job: Job | null) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  fetchHistory?: () => void;
  getAccessToken?: () => Promise<string | null>;
  onSelectModeChange?: (active: boolean) => void;
}

export function useSavedCatalog({
  history,
  setSelectedJob,
  onAddIngredients,
  fetchHistory,
  getAccessToken,
  onSelectModeChange
}: UseSavedCatalogProps) {
  const dialog = useDialog();
  const { t, language } = useI18n();
  const { isPremiumOverride } = useAuth();

  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});
  const [optimisticFlags, setOptimisticFlags] = useState<Record<string, string[]>>({});
  const [optimisticCollections, setOptimisticCollections] = useState<Record<string, string[]>>({});

  const completedJobs = useMemo(() => {
    return history
      .filter(h => h.status === 'completed' && h.recipe)
      .map(job => ({
        ...job,
        isFavorite: optimisticFavorites[job.id] !== undefined ? optimisticFavorites[job.id] : (job.isFavorite ?? false),
        flags: optimisticFlags[job.id] !== undefined ? optimisticFlags[job.id] : (job.flags ?? []),
        collectionIds: optimisticCollections[job.id] !== undefined ? optimisticCollections[job.id] : (job.collectionIds ?? [])
      }));
  }, [history, optimisticFavorites, optimisticFlags, optimisticCollections]);


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

  // Sorting state persisted to localStorage
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'time'>(() => {
    return (localStorage.getItem('recipe_catalog_sort') as 'newest' | 'title' | 'time') || 'newest';
  });

  useEffect(() => {
    localStorage.setItem('recipe_catalog_sort', sortBy);
  }, [sortBy]);

  // Derive unique flags from completed recipes
  const allFlags = useMemo(() => {
    const flagsSet = new Set<string>();
    completedJobs.forEach(job => {
      if (job.flags) {
        job.flags.forEach((flag: string) => {
          flagsSet.add(flag.trim());
        });
      }
    });
    return Array.from(flagsSet);
  }, [completedJobs]);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Notify parent of select mode changes
  useEffect(() => {
    onSelectModeChange?.(isSelectMode);
    return () => {
      onSelectModeChange?.(false);
    };
  }, [isSelectMode, onSelectModeChange]);

  // Direct shopping list addition success states (mapping job.id -> isAdded)
  const [addedRecipeIds, setAddedRecipeIds] = useState<Record<string, boolean>>({});

  // Pointer/Long press logic
  const longPressTimeout = useRef<Record<string, any>>({});
  const pressStartTime = useRef<number>(0);
  const wasLongPressed = useRef<boolean>(false);

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
    const filtered = completedJobs.filter(job => {
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
        if (activeFilter === 'favorites') {
          return job.isFavorite === true;
        }
        if (activeFilter.startsWith('flag:')) {
          const flag = activeFilter.substring(5);
          return job.flags?.includes(flag) || false;
        }
        if (activeFilter.startsWith('collection:')) {
          const colId = activeFilter.substring(11);
          return job.collectionIds?.includes(colId) || false;
        }
        return tags.includes(activeFilter);
      }

      return true;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return (a.recipe?.title || '').localeCompare(b.recipe?.title || '', language);
      }
      if (sortBy === 'time') {
        const aPrep = typeof a.recipe?.prepTime === 'number' ? a.recipe.prepTime : 0;
        const aCook = typeof a.recipe?.cookTime === 'number' ? a.recipe.cookTime : 0;
        const aTime = aPrep + aCook;

        const bPrep = typeof b.recipe?.prepTime === 'number' ? b.recipe.prepTime : 0;
        const bCook = typeof b.recipe?.cookTime === 'number' ? b.recipe.cookTime : 0;
        const bTime = bPrep + bCook;

        return aTime - bTime;
      }
      // default: 'newest'
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [completedJobs, searchQuery, activeFilter, sortBy, language]);


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
    wasLongPressed.current = false;
    longPressTimeout.current[jobId] = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
      wasLongPressed.current = true;
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
    if (pressDuration >= 600) {
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
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
  };

  const handleCardClick = (e: React.MouseEvent, job: Job) => {
    if (wasLongPressed.current) {
      wasLongPressed.current = false;
      return;
    }
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
        const job = completedJobs.find(j => j.id === id);
        if (job?.recipe) {
          const r = job.recipe;
          const imagesToDelete = r.imageUrls && r.imageUrls.length > 0
            ? r.imageUrls
            : (r.imageUrl ? [r.imageUrl] : []);
          
          for (const imgUrl of imagesToDelete) {
            await deleteCachedImage(imgUrl);
          }
        }

        const token = getAccessToken ? await getAccessToken() : null;
        if (!token) return;
        await fetch(apiUrl(`/api/jobs/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
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

  // Toggle favorite status via PATCH /api/jobs/:id/favorite
  const toggleFavorite = async (job: Job) => {
    const nextVal = !job.isFavorite;
    setOptimisticFavorites(prev => ({ ...prev, [job.id]: nextVal }));

    try {
      const token = getAccessToken ? await getAccessToken() : null;
      if (!token) return;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (isPremiumOverride) {
        headers['X-Simulate-Premium'] = 'true';
      }

      const response = await fetch(apiUrl(`/api/jobs/${job.id}/favorite`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isFavorite: nextVal })
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      if (fetchHistory) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setOptimisticFavorites(prev => ({ ...prev, [job.id]: job.isFavorite ?? false }));
    }
  };

  // Toggle custom flag/tag via PATCH /api/jobs/:id/flags
  const toggleFlag = async (job: Job, flagName: string) => {
    const currentFlags = job.flags ?? [];
    const nextFlags = currentFlags.includes(flagName)
      ? currentFlags.filter(f => f !== flagName)
      : [...currentFlags, flagName];

    setOptimisticFlags(prev => ({ ...prev, [job.id]: nextFlags }));

    try {
      const token = getAccessToken ? await getAccessToken() : null;
      if (!token) return { success: false };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (isPremiumOverride) {
        headers['X-Simulate-Premium'] = 'true';
      }

      const response = await fetch(apiUrl(`/api/jobs/${job.id}/flags`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ flags: nextFlags })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update flags');
      }

      if (fetchHistory) {
        fetchHistory();
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error updating flag:', err);
      setOptimisticFlags(prev => ({ ...prev, [job.id]: currentFlags }));
      return { success: false, error: err.message };
    }
  };

  // Assign collections via PATCH /api/jobs/:id/collections
  const assignCollections = async (jobId: string, collectionIds: string[]) => {
    const job = completedJobs.find(j => j.id === jobId);
    const currentCollectionIds = job?.collectionIds ?? [];

    setOptimisticCollections(prev => ({ ...prev, [jobId]: collectionIds }));

    try {
      const token = getAccessToken ? await getAccessToken() : null;
      if (!token) return { success: false };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (isPremiumOverride) {
        headers['X-Simulate-Premium'] = 'true';
      }

      const response = await fetch(apiUrl(`/api/jobs/${jobId}/collections`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ collectionIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update collections');
      }

      if (fetchHistory) {
        fetchHistory();
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error updating collections:', err);
      setOptimisticCollections(prev => ({ ...prev, [jobId]: currentCollectionIds }));
      return { success: false, error: err.message };
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
    handleBulkDelete,
    sortBy,
    setSortBy,
    allFlags,
    toggleFavorite,
    toggleFlag,
    assignCollections
  };
}
