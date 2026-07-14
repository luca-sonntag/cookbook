import React, { useState, useEffect, useMemo } from 'react';
import type { Job, Ingredient, Recipe } from '../../types';
import RecipeDetails from '../RecipeDetails';
import { useMobileNavigationBack } from '../../hooks/useMobileNavigationBack';
import { useI18n } from '../../context/I18nContext';
import { useSavedCatalog } from '../../hooks/useSavedCatalog';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useCollections';
import PremiumModal from '../PremiumModal';
import PremiumHint from '../PremiumHint';
import CollectionSheet from './CollectionSheet';
import { FlagSheet } from './FlagSheet';

import RecipeCard from './RecipeCard';
import RecipeListItem from './RecipeListItem';
import CatalogFilters from './CatalogFilters';
import BulkActionBar from './BulkActionBar';
import CatalogEmptyState from './CatalogEmptyState';
import CatalogLoadingState from './CatalogLoadingState';

interface SavedCatalogProps {
  history: Job[];
  historyLoaded?: boolean;
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  handleDeleteJob: (e: React.MouseEvent, id: string) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  fetchHistory?: () => void;
  getAccessToken?: () => Promise<string | null>;
  onNavigateToShoppingList?: () => void;
  shoppingListCount?: number;
  onRemixSuccess?: (newRecipe: Recipe, newJobId?: string) => void;
  onReplaceCurrent?: (newRecipe: Recipe) => void;
  onSelectModeChange?: (active: boolean) => void;
}

export default function SavedCatalog({
  history,
  historyLoaded = true,
  selectedJob,
  setSelectedJob,
  handleDeleteJob,
  onAddIngredients,
  fetchHistory,
  getAccessToken,
  onNavigateToShoppingList,
  shoppingListCount,
  onRemixSuccess,
  onSelectModeChange
}: SavedCatalogProps) {
  const { language, t } = useI18n();
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const FREE_RECIPE_LIMIT = 5;

  // Custom hook for swipe-to-go-back and mobile back button handling
  // Swipe-back / browser back: navigate to the history list URL so App.tsx
  // derives selectedJob = null from the hash automatically.
  useMobileNavigationBack(!!selectedJob, () => {
    window.location.hash = '#/history';
  });

  // Custom hook to manage the complex state, long-press, filters, and actions
  const {
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
    setRecipeFlags
  } = useSavedCatalog({
    history,
    setSelectedJob,
    onAddIngredients,
    fetchHistory,
    getAccessToken,
    onSelectModeChange
  });

  const { collections, refreshCollections } = useCollections();
  const [isCollectionSheetOpen, setIsCollectionSheetOpen] = useState(false);
  const [collectionSheetJob, setCollectionSheetJob] = useState<Job | undefined>(undefined);
  const [collectionSheetBulkIds, setCollectionSheetBulkIds] = useState<string[]>([]);

  // FlagSheet states
  const [isFlagSheetOpen, setIsFlagSheetOpen] = useState(false);
  const [flagSheetJob, setFlagSheetJob] = useState<Job | null>(null);

  // Memoize all distinct flags in catalog to pass as suggestions
  const allExistingFlags = useMemo(() => {
    return Array.from(new Set(completedJobs.flatMap(j => j.flags || [])));
  }, [completedJobs]);

  useEffect(() => {
    if (historyLoaded) {
      refreshCollections();
    }
  }, [historyLoaded, refreshCollections]);

  const handleAddCollectionClick = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setCollectionSheetJob(undefined);
      setCollectionSheetBulkIds([]);
      setIsCollectionSheetOpen(true);
    }
  };

  const handleBulkAddToCollectionClick = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      const ids = Array.from(selectedIds);
      // For a single selected recipe, open the sheet in single-recipe mode so its
      // current collection memberships are preloaded — this lets the user remove it
      // from a collection, not just add it. Multiple selections use bulk mode.
      if (ids.length === 1) {
        setCollectionSheetJob(completedJobs.find(j => j.id === ids[0]));
        setCollectionSheetBulkIds([]);
      } else {
        setCollectionSheetJob(undefined);
        setCollectionSheetBulkIds(ids);
      }
      setIsCollectionSheetOpen(true);
    }
  };

  const handleAssignCollectionsClick = (job: Job) => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setCollectionSheetJob(job);
      setCollectionSheetBulkIds([]);
      setIsCollectionSheetOpen(true);
    }
  };

  const handleManageFlagsClick = async (job: Job) => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    setFlagSheetJob(job);
    setIsFlagSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {selectedJob ? (
        /* DETAIL VIEW FOR SAVED RECIPE */
        <div className="flex flex-col gap-4">
          {selectedJob.recipe && (
            <RecipeDetails
              key={selectedJob.id}
              recipe={selectedJob.recipe}
              onAddIngredients={onAddIngredients}
              onDelete={() => handleDeleteJob({ stopPropagation: () => { } } as any, selectedJob.id)}
              reelUrl={selectedJob.url}
              createdAt={selectedJob.createdAt}
              onBack={() => setSelectedJob(null)}
              flags={selectedJob.flags}
              onNavigateToShoppingList={onNavigateToShoppingList}
              shoppingListCount={shoppingListCount}
              onRemixSuccess={onRemixSuccess}
              onReplaceCurrent={() => {
                // Just refresh history — the job recipe was updated in-place in the DB
                fetchHistory?.();
              }}
              isParentAvailable={selectedJob.recipe?.parentJobId ? history.some(j => j.id === selectedJob.recipe?.parentJobId) : false}
              parentRecipeTitle={selectedJob.recipe?.parentRecipeTitle || (selectedJob.recipe?.parentJobId ? history.find(j => j.id === selectedJob.recipe?.parentJobId)?.recipe?.title : null)}
              onNavigateToRecipe={(recipeId) => {
                const parentJob = history.find(j => j.id === recipeId);
                if (parentJob) {
                  setSelectedJob(parentJob);
                }
              }}
              onAssignCollections={() => handleAssignCollectionsClick(selectedJob)}
              onManageFlags={() => handleManageFlagsClick(selectedJob)}
            />
          )}
        </div>
      ) : (
        /* LIST VIEW OF SAVED RECIPES */
        <div className="flex flex-col gap-4">
          {completedJobs.length === 0 ? (
            !historyLoaded ? (
              <CatalogLoadingState />
            ) : (
              <CatalogEmptyState />
            )
          ) : (
            <>
              {/* Sticky Search and Filter Chips Row */}
              <CatalogFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                allFlags={allFlags}
                collections={collections}
                isSelectMode={isSelectMode}
                setIsSelectMode={(active) => {
                  setIsSelectMode(active);
                  if (!active) {
                    setSelectedIds(new Set());
                  }
                }}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onAddCollection={handleAddCollectionClick}
              />

              {/* Free plan catalog limit banner */}
              {!isPremium && completedJobs.length >= FREE_RECIPE_LIMIT - 1 && (
                <PremiumHint
                  variant="banner"
                  onClick={() => setIsPremiumModalOpen(true)}
                  label={
                    completedJobs.length >= FREE_RECIPE_LIMIT
                      ? t('premium.hint.catalogFull', { count: completedJobs.length, limit: FREE_RECIPE_LIMIT })
                      : t('premium.hint.catalogAlmostFull', { count: completedJobs.length, limit: FREE_RECIPE_LIMIT })
                  }
                  cta={t('premium.hint.upgrade')}
                />
              )}

              {/* RECIPES DISPLAY GRID/LIST */}
              {filteredJobs.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500">
                  {language === 'de' ? 'Keine passenden Rezepte gefunden.' : 'No matching recipes found.'}
                </div>
              ) : viewMode === 'card' ? (
                /* CARD GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {filteredJobs.map((job) => (
                    <RecipeCard
                      key={job.id}
                      job={job}
                      isSelected={selectedIds.has(job.id)}
                      isSelectMode={isSelectMode}
                      isAdded={!!addedRecipeIds[job.id]}
                      durationBadge={getDurationBadge(job.recipe!)}
                      recipeTags={getRecipeTags(job.recipe!)}
                      formattedPrepTime={formatTimeValue(job.recipe!.prepTime)}
                      formattedCookTime={formatTimeValue(job.recipe!.cookTime)}
                      bindLongPress={bindLongPress(job.id, job)}
                      onClick={(e) => handleCardClick(e, job)}
                      onDirectAdd={(e) => handleDirectAddToShoppingList(e, job)}
                      onDelete={(e) => handleDeleteJob(e, job.id)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        toggleFavorite(job);
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* COMPACT LIST VIEW */
                <div className="flex flex-col gap-2.5 mt-2">
                  {filteredJobs.map((job) => (
                    <RecipeListItem
                      key={job.id}
                      job={job}
                      isSelected={selectedIds.has(job.id)}
                      isSelectMode={isSelectMode}
                      isAdded={!!addedRecipeIds[job.id]}
                      durationBadge={getDurationBadge(job.recipe!)}
                      recipeTags={getRecipeTags(job.recipe!)}
                      formattedPrepTime={formatTimeValue(job.recipe!.prepTime)}
                      formattedCookTime={formatTimeValue(job.recipe!.cookTime)}
                      bindLongPress={bindLongPress(job.id, job)}
                      onClick={(e) => handleCardClick(e, job)}
                      onDirectAdd={(e) => handleDirectAddToShoppingList(e, job)}
                      onDelete={(e) => handleDeleteJob(e, job.id)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        toggleFavorite(job);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating bottom action bar in select mode */}
      {isSelectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onCancel={() => {
            setIsSelectMode(false);
            setSelectedIds(new Set());
          }}
          onBulkAdd={handleBulkAddToShoppingList}
          onBulkDelete={handleBulkDelete}
          onBulkAddToCollection={handleBulkAddToCollectionClick}
        />
      )}

      {/* Collection Management bottom sheet */}
      <CollectionSheet
        isOpen={isCollectionSheetOpen}
        onClose={() => setIsCollectionSheetOpen(false)}
        job={collectionSheetJob}
        selectedJobIds={collectionSheetBulkIds}
        onUpdated={() => {
          fetchHistory?.();
          refreshCollections();
        }}
      />

      {/* Flag/Label Management bottom sheet */}
      <FlagSheet
        isOpen={isFlagSheetOpen}
        onClose={() => setIsFlagSheetOpen(false)}
        job={flagSheetJob}
        allExistingFlags={allExistingFlags}
        onSave={async (j, flags) => {
          await setRecipeFlags(j, flags);
          fetchHistory?.();
        }}
      />

      {/* Premium Modal */}
      <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
    </div>
  );
}
