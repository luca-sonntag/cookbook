import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Button } from '@heroui/react';
import { 
  Globe, 
  Utensils, 
  Clock, 
  Trash2, 
  ArrowLeft, 
  Search, 
  LayoutGrid, 
  List, 
  ShoppingCart, 
  Check
} from 'lucide-react';
import type { Job, Ingredient } from '../types';
import RecipeDetails from './RecipeDetails';
import { useMobileNavigationBack } from '../hooks/useMobileNavigationBack';
import { useI18n } from '../context/I18nContext';
import { useDialog } from '../context/DialogContext';

// Custom SVG component for Instagram icon
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface SavedCatalogProps {
  history: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  handleDeleteJob: (e: React.MouseEvent, id: string) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  fetchHistory?: () => void;
}

export default function SavedCatalog({
  history,
  selectedJob,
  setSelectedJob,
  handleDeleteJob,
  onAddIngredients,
  fetchHistory
}: SavedCatalogProps) {
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

  // Custom hook for swipe-to-go-back and mobile back button handling
  useMobileNavigationBack(!!selectedJob, () => setSelectedJob(null));

  // Fallback tagging logic for old recipes in the database
  const getRecipeTags = (recipe: any): string[] => {
    if (recipe.tags && recipe.tags.length > 0) {
      return recipe.tags;
    }
    const fallbackTags: string[] = [];
    
    // 1. Duration check
    const prep = parseInt(recipe.prepTime) || 0;
    const cook = parseInt(recipe.cookTime) || 0;
    const totalTime = prep + cook;
    if (totalTime > 0) {
      if (totalTime < 15) {
        fallbackTags.push(language === 'de' ? 'Unter 15 Min.' : '< 15 Min');
      } else if (totalTime < 30) {
        fallbackTags.push(language === 'de' ? 'Unter 30 Min.' : '< 30 Min');
      }
    }
    
    // 2. High Protein check
    const proteinStr = recipe.nutritionalEstimates?.protein;
    if (proteinStr) {
      const proteinVal = parseFloat(proteinStr) || 0;
      if (proteinVal >= 20) {
        fallbackTags.push('High-Protein');
      }
    }

    // 3. Vegan / Vegetarian check based on ingredients or title
    const titleLower = recipe.title.toLowerCase();
    const descLower = recipe.description?.toLowerCase() || '';
    const isVegan = titleLower.includes('vegan') || descLower.includes('vegan');
    const isVegetarian = titleLower.includes('vegetarisch') || descLower.includes('vegetarisch') || titleLower.includes('veggie') || isVegan;

    if (isVegan) {
      fallbackTags.push('Vegan');
    } else if (isVegetarian) {
      fallbackTags.push('Vegetarisch');
    }
    
    return fallbackTags.slice(0, 2);
  };

  // Collect all unique tags dynamically (actual + fallback, filtering out time-based tags to avoid duplicates with dedicated duration chips)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    completedJobs.forEach(job => {
      if (job.recipe) {
        getRecipeTags(job.recipe).forEach((tag: string) => {
          const t = tag.trim();
          const isTimeTag = t.toLowerCase().includes('min') || t.startsWith('<') || t.toLowerCase().startsWith('unter');
          if (!isTimeTag) {
            tagsSet.add(t);
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
          const prep = parseInt(r.prepTime) || 0;
          const cook = parseInt(r.cookTime) || 0;
          return (prep + cook) > 0 && (prep + cook) < 15;
        }
        if (activeFilter === 'under30') {
          const prep = parseInt(r.prepTime) || 0;
          const cook = parseInt(r.cookTime) || 0;
          return (prep + cook) > 0 && (prep + cook) < 30;
        }
        return tags.includes(activeFilter);
      }

      return true;
    });
  }, [completedJobs, searchQuery, activeFilter, language]);

  // Long press event handlers
  const handlePointerDown = (jobId: string) => {
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
    if (longPressTimeout.current[job.id]) {
      clearTimeout(longPressTimeout.current[job.id]);
      delete longPressTimeout.current[job.id];
    }
    const pressDuration = Date.now() - pressStartTime.current;
    if (pressDuration < 600) {
      handleCardClick(job);
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
      onPointerDown: () => handlePointerDown(jobId),
      onPointerUp: (e: React.PointerEvent) => handlePointerUp(e, job),
      onPointerLeave: () => handlePointerLeave(jobId),
    };
  };

  const handleCardClick = (job: Job) => {
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
  const handleDirectAddToShoppingList = (e: React.MouseEvent | React.TouchEvent, job: Job) => {
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

  return (
    <div className="flex flex-col gap-4">
      {selectedJob ? (
        /* DETAIL VIEW FOR SAVED RECIPE */
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              className="flex-shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 w-9 h-9 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all text-base leading-none"
              onPress={() => setSelectedJob(null)}
              aria-label={t('catalog.backToSaved')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1 flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-2.5 px-4 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {t('catalog.savedOn', { date: new Date(selectedJob.createdAt).toLocaleDateString(language) })}
              </span>
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-xs flex items-center gap-1 font-medium ml-3"
              >
                <Globe className="w-3.5 h-3.5" /> {t('catalog.viewReel')}
              </a>
            </div>
          </div>

          {selectedJob.recipe && (
            <RecipeDetails 
              key={selectedJob.id} 
              recipe={selectedJob.recipe} 
              onAddIngredients={onAddIngredients} 
              onDelete={() => handleDeleteJob({ stopPropagation: () => {} } as any, selectedJob.id)}
            />
          )}
        </div>
      ) : (
        /* LIST VIEW OF SAVED RECIPES */
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">
            {t('catalog.title')}
          </h3>

          {completedJobs.length === 0 ? (
            <Card className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
              <Utensils className="w-8 h-8 text-gray-500 mb-3 animate-pulse-slow" />
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{t('catalog.emptyTitle')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-normal">
                {t('catalog.emptyDesc')}
              </p>
            </Card>
          ) : (
            <>
              {/* Sticky Search and Filter Chips Row */}
              <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 pb-3 -mx-4 px-4 md:-mx-6 md:px-6 flex flex-col gap-3 pt-3">
                {/* Search & View Toggle Bar */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('catalog.searchPlaceholder')}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-lg font-bold w-5 h-5 flex items-center justify-center cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <Button
                    isIconOnly
                    variant="tertiary"
                    className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-500 hover:text-emerald-500 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
                    onPress={() => setViewMode(v => v === 'card' ? 'compact' : 'card')}
                    aria-label={t('catalog.viewToggle')}
                  >
                    {viewMode === 'card' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Horizontal Scrollable Filter Chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none py-0.5 -mx-4 px-4 md:-mx-6 md:px-6 scroll-smooth">
                  {/* 'All' chip */}
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('catalog.allFilter')}
                  </button>

                  {/* 'Under 15' chip */}
                  <button
                    onClick={() => setActiveFilter('under15')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                      activeFilter === 'under15'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('catalog.under15')}
                  </button>

                  {/* 'Under 30' chip */}
                  <button
                    onClick={() => setActiveFilter('under30')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                      activeFilter === 'under30'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('catalog.under30')}
                  </button>

                  {/* Dynamic Tag chips */}
                  {allTags.map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                        activeFilter === tag
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* RECIPES DISPLAY GRID/LIST */}
              {filteredJobs.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500">
                  {language === 'de' ? 'Keine passenden Rezepte gefunden.' : 'No matching recipes found.'}
                </div>
              ) : viewMode === 'card' ? (
                /* CARD GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {filteredJobs.map(job => {
                    const r = job.recipe!;
                    const isSelected = selectedIds.has(job.id);
                    return (
                      <Card
                        key={job.id}
                        className={`glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all flex flex-col justify-between overflow-hidden relative border ${
                          isSelected ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5'
                        }`}
                        onClick={() => handleCardClick(job)}
                        {...bindLongPress(job.id, job)}
                      >
                        {/* Checkbox overlay in select mode */}
                        {isSelectMode && (
                          <div className="absolute top-3 left-3 z-10 w-6 h-6 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/40'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        )}

                        <div>
                          {/* Thumbnail Image Container */}
                          {r.imageUrl && (
                            <div className="h-32 w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                              <img
                                src={r.imageUrl.startsWith('/') ? r.imageUrl : `/api/image?url=${encodeURIComponent(r.imageUrl)}`}
                                alt={r.title}
                                className="w-full h-full object-cover object-center rounded-t-2xl"
                              />
                              {/* Creator Badge Overlay */}
                              {r.instagramHandle && (
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-semibold backdrop-blur-sm pointer-events-none select-none z-[5] border border-white/10 shadow-md">
                                  <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                                  <span>{r.instagramHandle}</span>
                                </div>
                              )}
                              
                              {/* KI Tag Badges Overlays */}
                              <div className="absolute top-2 right-2 flex flex-col gap-1 z-[5]">
                                {getRecipeTags(r).map((tag: string, idx: number) => (
                                  <span key={idx} className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm select-none border border-white/5 shadow-sm">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Title & Delete */}
                          <div className="flex justify-between items-start gap-2 px-5 pt-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                              {r.title}
                            </h4>
                            {!isSelectMode && (
                              <button
                                onClick={(e) => handleDeleteJob(e, job.id)}
                                className="flex-shrink-0 text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer -mt-1 -mr-2"
                                aria-label={t('catalog.deleteRecipe')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed px-5">
                            {r.description}
                          </p>
                        </div>

                        {/* Footer with stats & direct shopping list button */}
                        <div className="flex items-center justify-between mt-4 pt-3 pb-4 px-5 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400">
                          <div className="flex gap-2">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" /> {r.prepTime || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Utensils className="w-3.5 h-3.5 text-emerald-500" /> {r.cookTime || 'N/A'}
                            </span>
                          </div>

                          {!isSelectMode && (
                            <Button
                              isIconOnly
                              variant="tertiary"
                              className={`w-8 h-8 rounded-lg active:scale-95 transition-all text-xs border border-black/10 dark:border-white/10 ${
                                addedRecipeIds[job.id] 
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent' 
                                  : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-emerald-500'
                              }`}
                              onPress={(e) => handleDirectAddToShoppingList(e as any, job)}
                              aria-label="Direct add"
                            >
                              {addedRecipeIds[job.id] ? (
                                <Check className="w-3.5 h-3.5 animate-scale-up" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* COMPACT LIST VIEW */
                <div className="flex flex-col gap-2.5 mt-2">
                  {filteredJobs.map(job => {
                    const r = job.recipe!;
                    const isSelected = selectedIds.has(job.id);
                    return (
                      <Card
                        key={job.id}
                        className={`glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all p-3 flex flex-row items-center gap-3 overflow-hidden border ${
                          isSelected ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5'
                        }`}
                        onClick={() => handleCardClick(job)}
                        {...bindLongPress(job.id, job)}
                      >
                        {/* Select mode checkbox */}
                        {isSelectMode && (
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        )}

                        {/* Thumbnail Image */}
                        {r.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 shrink-0 relative">
                            <img
                              src={r.imageUrl.startsWith('/') ? r.imageUrl : `/api/image?url=${encodeURIComponent(r.imageUrl)}`}
                              alt={r.title}
                              className="w-full h-full object-cover object-center"
                            />
                            {/* Creator Handle Overlay */}
                            {r.instagramHandle && (
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[7px] px-1 py-0.5 rounded flex items-center gap-0.5 pointer-events-none select-none z-[5] backdrop-blur-[1px]">
                                <InstagramIcon className="w-2 h-2 text-pink-400" />
                                <span className="truncate max-w-[40px]">{r.instagramHandle}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {r.title}
                            </h4>
                            {/* Tag pills (1 in compact view to save space) */}
                            {getRecipeTags(r).slice(0, 1).map((tag: string, idx: number) => (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full select-none">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" /> {r.prepTime || 'N/A'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3.5 h-3.5 text-emerald-500" /> {r.cookTime || 'N/A'}
                            </span>
                          </p>
                        </div>

                        {/* Actions */}
                        {!isSelectMode && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              isIconOnly
                              variant="tertiary"
                              className={`w-8 h-8 rounded-lg active:scale-95 transition-all text-xs border border-black/10 dark:border-white/10 ${
                                addedRecipeIds[job.id] 
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent' 
                                  : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-emerald-500'
                              }`}
                              onPress={(e) => handleDirectAddToShoppingList(e as any, job)}
                              aria-label="Direct add"
                            >
                              {addedRecipeIds[job.id] ? (
                                <Check className="w-3.5 h-3.5 animate-scale-up" />
                              ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <button
                              onClick={(e) => handleDeleteJob(e, job.id)}
                              className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              aria-label={t('catalog.deleteRecipe')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating bottom action bar in select mode */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-slide-up border-emerald-500/30">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {t('catalog.itemsSelected', { count: selectedIds.size })}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Meal-Prep Plan
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                setIsSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="text-xs border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-semibold"
            >
              {t('dialog.cancelDefault')}
            </Button>
            
            <Button
              size="sm"
              onPress={handleBulkAddToShoppingList}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{language === 'de' ? 'Einkaufsliste' : 'Cart'}</span>
            </Button>

            <Button
              size="sm"
              onPress={handleBulkDelete}
              className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'de' ? 'Löschen' : 'Delete'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
