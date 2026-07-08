import React, { useState } from 'react';
import type { Job, Ingredient, Recipe } from '../../types';
import RecipeDetails from '../RecipeDetails';
import { useMobileNavigationBack } from '../../hooks/useMobileNavigationBack';
import { useI18n } from '../../context/I18nContext';
import { useSavedCatalog } from '../../hooks/useSavedCatalog';
import { useAuth } from '../../context/AuthContext';
import PremiumModal from '../PremiumModal';
import { Crown } from 'lucide-react';

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
  onRemixSuccess?: (newRecipe: Recipe) => void;
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
  const { language } = useI18n();
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
              parentRecipeTitle={selectedJob.recipe?.parentRecipeTitle || (selectedJob.recipe?.parentJobId ? history.find(j => j.id === selectedJob.recipe?.parentJobId)?.recipe?.title : null)}
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
          {/* Free plan catalog limit banner */}
          {!isPremium && completedJobs.length >= FREE_RECIPE_LIMIT - 1 && (
            <div
              onClick={() => setIsPremiumModalOpen(true)}
              className="cursor-pointer flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 dark:border-amber-500/10 hover:from-amber-500/15 hover:to-emerald-500/15 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {completedJobs.length >= FREE_RECIPE_LIMIT
                    ? (language === 'de' ? `Kochbuch voll (${completedJobs.length}/${FREE_RECIPE_LIMIT}) – Lösche ein Rezept oder upgrade.` : `Cookbook full (${completedJobs.length}/${FREE_RECIPE_LIMIT}) – Delete a recipe or upgrade.`)
                    : (language === 'de' ? `Kochbuch fast voll (${completedJobs.length}/${FREE_RECIPE_LIMIT})` : `Cookbook almost full (${completedJobs.length}/${FREE_RECIPE_LIMIT})`)}
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0 hover:text-amber-500">
                {language === 'de' ? 'Upgrade' : 'Upgrade'}
              </span>
            </div>
          )}
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

      {/* Premium Modal */}
      <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
    </div>
  );
}
