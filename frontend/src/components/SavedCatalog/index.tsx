import React from 'react';
import type { Job, Ingredient, Recipe } from '../../types';
import RecipeDetails from '../RecipeDetails';
import { useMobileNavigationBack } from '../../hooks/useMobileNavigationBack';
import { useI18n } from '../../context/I18nContext';
import { useSavedCatalog } from '../../hooks/useSavedCatalog';

import RecipeCard from './RecipeCard';
import RecipeListItem from './RecipeListItem';
import CatalogFilters from './CatalogFilters';
import BulkActionBar from './BulkActionBar';
import CatalogEmptyState from './CatalogEmptyState';

interface SavedCatalogProps {
  history: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  handleDeleteJob: (e: React.MouseEvent, id: string) => void;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  fetchHistory?: () => void;
  getAccessToken?: () => Promise<string | null>;
  onNavigateToShoppingList?: () => void;
  shoppingListCount?: number;
  onRemixSuccess?: (newRecipe: Recipe) => void;
  onSelectModeChange?: (active: boolean) => void;
}

export default function SavedCatalog({
  history,
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
  const { language } = useI18n();

  // Custom hook for swipe-to-go-back and mobile back button handling
  useMobileNavigationBack(!!selectedJob, () => setSelectedJob(null));

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
    allTags,
    formatTimeValue,
    getDurationBadge,
    getRecipeTags,
    bindLongPress,
    handleCardClick,
    handleDirectAddToShoppingList,
    handleBulkAddToShoppingList,
    handleBulkDelete
  } = useSavedCatalog({
    history,
    setSelectedJob,
    onAddIngredients,
    fetchHistory,
    getAccessToken,
    onSelectModeChange
  });

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
              onNavigateToShoppingList={onNavigateToShoppingList}
              shoppingListCount={shoppingListCount}
              onRemixSuccess={onRemixSuccess}
              isParentAvailable={selectedJob.recipe?.parentJobId ? history.some(j => j.id === selectedJob.recipe?.parentJobId) : false}
              onNavigateToRecipe={(recipeId) => {
                const parentJob = history.find(j => j.id === recipeId);
                if (parentJob) {
                  setSelectedJob(parentJob);
                }
              }}
            />
          )}
        </div>
      ) : (
        /* LIST VIEW OF SAVED RECIPES */
        <div className="flex flex-col gap-4">
          {completedJobs.length === 0 ? (
            <CatalogEmptyState />
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
                allTags={allTags}
                isSelectMode={isSelectMode}
                setIsSelectMode={(active) => {
                  setIsSelectMode(active);
                  if (!active) {
                    setSelectedIds(new Set());
                  }
                }}
              />

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
        />
      )}
    </div>
  );
}
