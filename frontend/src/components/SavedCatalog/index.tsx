import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SearchX } from 'lucide-react';
import type { Job, Ingredient, Recipe } from '../../types';
import RecipeDetails from '../RecipeDetails';
import { useMobileNavigationBack } from '../../hooks/useMobileNavigationBack';
import { useI18n } from '../../context/I18nContext';
import { useSavedCatalog, EMPTY_FILTERS } from '../../hooks/useSavedCatalog';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useCollections';
import PremiumModal from '../PremiumModal';
import PremiumHint from '../PremiumHint';
import CollectionSheet from './CollectionSheet';
import { FlagSheet } from './FlagSheet';

import RecipePosterCard from './RecipePosterCard';
import RecipeListItem from './RecipeListItem';
import CatalogFilters from './CatalogFilters';
import FilterSheet from './FilterSheet';
import CookbookHome from './CookbookHome';
import BulkActionBar from './BulkActionBar';
import CatalogEmptyState from './CatalogEmptyState';
import CatalogLoadingState from './CatalogLoadingState';
import { buildListRoute, isCatalogListRoute, parseListRoute, type CatalogPreset } from './catalogRoutes';

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
  /** Current `#/history/...` sub-path — `null` = cookbook home. */
  catalogSubPath?: string | null;
  /** Navigates within the catalog tab (`null` returns to the cookbook home). */
  onNavigateCatalog?: (subPath?: string | null) => void;
}

const FREE_RECIPE_LIMIT = 5;

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
  onSelectModeChange,
  catalogSubPath = null,
  onNavigateCatalog
}: SavedCatalogProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const navigateCatalog = useCallback((subPath?: string | null) => {
    if (onNavigateCatalog) onNavigateCatalog(subPath ?? null);
    else window.location.hash = subPath ? `#/history/${subPath}` : '#/history';
  }, [onNavigateCatalog]);

  // Which of the three catalog levels is showing
  const isListLevel = !selectedJob && isCatalogListRoute(catalogSubPath);
  const preset = useMemo(() => parseListRoute(catalogSubPath), [catalogSubPath]);

  // Swipe-back / mobile back out of the detail view returns to whichever level
  // the recipe was opened from — the list route, or `null` for the cookbook
  // home. Frozen while a recipe is open so the detail route can't overwrite it.
  const listRouteBeforeDetailRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedJob) return;
    listRouteBeforeDetailRef.current = isCatalogListRoute(catalogSubPath) ? catalogSubPath : null;
  }, [selectedJob, catalogSubPath]);

  useMobileNavigationBack(!!selectedJob, () => {
    navigateCatalog(listRouteBeforeDetailRef.current);
  });
  useMobileNavigationBack(isListLevel, () => {
    navigateCatalog(null);
  });

  // Custom hook to manage the complex state, long-press, filters, and actions
  const {
    completedJobs,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
    filteredJobs,
    countMatches,
    formatTotalTime,
    getRecipeTags,
    bindLongPress,
    handleCardClick,
    handleBulkAddToShoppingList,
    handleBulkDelete,
    sortBy,
    setSortBy,
    allFlags,
    toggleFavorite,
    setRecipeFlags,
    assignCollections,
    shelves,
    jobsByCollection,
    markOpened
  } = useSavedCatalog({
    history,
    setSelectedJob,
    onAddIngredients,
    fetchHistory,
    getAccessToken,
    onSelectModeChange
  });

  const { collections, refreshCollections } = useCollections();

  // Always read selectedJob from completedJobs so all optimistic overrides
  // (isFavorite, flags, collectionIds) are immediately reflected in the UI
  // without waiting for a history re-fetch.
  const selectedJobResolved = selectedJob
    ? (completedJobs.find(j => j.id === selectedJob.id) ?? selectedJob)
    : null;
  const [isCollectionSheetOpen, setIsCollectionSheetOpen] = useState(false);
  const [collectionSheetJob, setCollectionSheetJob] = useState<Job | undefined>(undefined);
  const [collectionSheetBulkJobs, setCollectionSheetBulkJobs] = useState<Job[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // FlagSheet states
  const [isFlagSheetOpen, setIsFlagSheetOpen] = useState(false);
  const [flagSheetJob, setFlagSheetJob] = useState<Job | null>(null);

  // Memoize all distinct flags in catalog to pass as suggestions
  const allExistingFlags = useMemo(() => {
    return Array.from(new Set(completedJobs.flatMap(j => j.flags || [])));
  }, [completedJobs]);

  const listTitle = useMemo(() => {
    switch (preset.kind) {
      case 'favorites':
        return t('catalog.favoritesFilter');
      case 'quick':
        return t('catalog.shelfQuick');
      case 'recent':
        return t('catalog.shelfRecent');
      case 'collection': {
        const col = collections.find(c => c.id === preset.id);
        return col ? `${col.emoji} ${col.name}` : t('catalog.allRecipesTitle');
      }
      case 'flag':
        return preset.name;
      case 'search':
        return t('catalog.allRecipesTitle');
      default:
        return t('catalog.allRecipesTitle');
    }
  }, [preset, collections, t]);

  useEffect(() => {
    if (historyLoaded) {
      refreshCollections();
    }
  }, [historyLoaded, refreshCollections]);

  // Record recency centrally so deep links and notification taps count too.
  useEffect(() => {
    if (selectedJob) markOpened(selectedJob.id);
  }, [selectedJob?.id, markOpened]);

  // Seed search/filters/sort from the route preset whenever the list level is
  // entered with a different preset. Tracked by ref so the user's own edits
  // inside the sheet are never clobbered by a re-render.
  const appliedRouteRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isCatalogListRoute(catalogSubPath)) {
      appliedRouteRef.current = null;
      return;
    }
    if (appliedRouteRef.current === catalogSubPath) return;
    appliedRouteRef.current = catalogSubPath ?? null;

    setSearchQuery('');
    switch (preset.kind) {
      case 'favorites':
        setFilters({ ...EMPTY_FILTERS, favoritesOnly: true });
        setSortBy('newest');
        break;
      case 'quick':
        setFilters({ ...EMPTY_FILTERS, maxTime: 30 });
        setSortBy('newest');
        break;
      case 'collection':
        setFilters({ ...EMPTY_FILTERS, collectionIds: [preset.id] });
        setSortBy('newest');
        break;
      case 'flag':
        setFilters({ ...EMPTY_FILTERS, flags: [preset.name] });
        setSortBy('newest');
        break;
      case 'recent':
        setFilters(EMPTY_FILTERS);
        setSortBy('recent');
        break;
      default:
        setFilters(EMPTY_FILTERS);
        setSortBy('newest');
        break;
    }
  }, [catalogSubPath, preset, setFilters, setSearchQuery, setSortBy]);

  // Automatically transition to the list level (Level 2) if search query
  // or active filter count becomes greater than 0 while on Cookbook Home (Level 1).
  useEffect(() => {
    if (!isListLevel && (searchQuery || activeFilterCount > 0)) {
      navigateCatalog(buildListRoute({ kind: 'search' }));
    }
  }, [isListLevel, searchQuery, activeFilterCount, navigateCatalog]);

  const openList = useCallback((target: CatalogPreset) => {
    navigateCatalog(buildListRoute(target));
  }, [navigateCatalog]);

  const handleAddCollectionClick = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      // Open directly in "create" mode — no checkbox list, since there's no
      // pre-existing recipe assignment context.
      setCollectionSheetJob(undefined);
      setCollectionSheetBulkJobs([]);
      setIsCollectionSheetOpen(true);
    }
  };

  const handleBulkAddToCollectionClick = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setCollectionSheetJob(undefined);
      // Pass the FULL Job objects (not just IDs) so the sheet can pre-check the
      // intersection of their memberships and support per-recipe add/remove.
      setCollectionSheetBulkJobs(completedJobs.filter(j => selectedIds.has(j.id)));
      setIsCollectionSheetOpen(true);
    }
  };

  const handleAssignCollectionsClick = (job: Job) => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
    } else {
      setCollectionSheetJob(job);
      setCollectionSheetBulkJobs([]);
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

  const premiumBanner = !isPremium && completedJobs.length >= FREE_RECIPE_LIMIT - 1 && (
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
  );

  // ---------------------------------------------------------------------------
  // Level 3: recipe detail
  // ---------------------------------------------------------------------------
  if (selectedJobResolved) {
    return (
      <div className="flex flex-col gap-4">
        {selectedJobResolved.recipe && (
          <RecipeDetails
            key={selectedJobResolved.id}
            recipe={selectedJobResolved.recipe}
            onAddIngredients={onAddIngredients}
            onDelete={() => handleDeleteJob({ stopPropagation: () => { } } as any, selectedJobResolved.id)}
            reelUrl={selectedJobResolved.url}
            createdAt={selectedJobResolved.createdAt}
            onBack={() => navigateCatalog(listRouteBeforeDetailRef.current)}
            flags={selectedJobResolved.flags}
            onNavigateToShoppingList={onNavigateToShoppingList}
            shoppingListCount={shoppingListCount}
            onRemixSuccess={onRemixSuccess}
            onReplaceCurrent={() => {
              fetchHistory?.();
            }}
            isParentAvailable={selectedJobResolved.recipe?.parentJobId ? history.some(j => j.id === selectedJobResolved.recipe?.parentJobId) : false}
            parentRecipeTitle={selectedJobResolved.recipe?.parentRecipeTitle || (selectedJobResolved.recipe?.parentJobId ? history.find(j => j.id === selectedJobResolved.recipe?.parentJobId)?.recipe?.title : null)}
            onNavigateToRecipe={(recipeId) => {
              const parentJob = history.find(j => j.id === recipeId);
              if (parentJob) {
                setSelectedJob(parentJob);
              }
            }}
            onAssignCollections={() => handleAssignCollectionsClick(selectedJobResolved)}
            onManageFlags={() => handleManageFlagsClick(selectedJobResolved)}
            isFavorite={selectedJobResolved.isFavorite}
            onToggleFavorite={() => toggleFavorite(selectedJobResolved)}
          />
        )}

        <CollectionSheet
          isOpen={isCollectionSheetOpen}
          onClose={() => setIsCollectionSheetOpen(false)}
          job={collectionSheetJob}
          selectedJobs={collectionSheetBulkJobs}
          initialMode={!collectionSheetJob && collectionSheetBulkJobs.length === 0 ? 'manage' : 'assign'}
          onAssign={assignCollections}
          onUpdated={() => refreshCollections()}
        />
        <FlagSheet
          isOpen={isFlagSheetOpen}
          onClose={() => setIsFlagSheetOpen(false)}
          job={flagSheetJob}
          allExistingFlags={allExistingFlags}
          onSave={async (j, flags) => {
            await setRecipeFlags(j, flags);
          }}
        />
        <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty / loading
  // ---------------------------------------------------------------------------
  if (completedJobs.length === 0) {
    return !historyLoaded ? <CatalogLoadingState /> : <CatalogEmptyState />;
  }

  const sheets = (
    <>
      <CollectionSheet
        isOpen={isCollectionSheetOpen}
        onClose={() => setIsCollectionSheetOpen(false)}
        job={collectionSheetJob}
        selectedJobs={collectionSheetBulkJobs}
        initialMode={
          !collectionSheetJob && collectionSheetBulkJobs.length === 0
            ? 'manage'
            : 'assign'
        }
        onAssign={assignCollections}
        onUpdated={() => refreshCollections()}
      />

      <FlagSheet
        isOpen={isFlagSheetOpen}
        onClose={() => setIsFlagSheetOpen(false)}
        job={flagSheetJob}
        allExistingFlags={allExistingFlags}
        onSave={async (j, flags) => {
          await setRecipeFlags(j, flags);
        }}
      />

      <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
    </>
  );

  // ---------------------------------------------------------------------------
  // Level 1 & 2: Unified Layout
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      <CatalogFilters
        title={isListLevel ? listTitle : t('catalog.myCookbookTitle')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        autoFocusSearch={isListLevel && preset.kind === 'search'}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filters={filters}
        setFilters={setFilters}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setIsFilterSheetOpen(true)}
        collections={collections}
        isSelectMode={isSelectMode}
        setIsSelectMode={(active) => {
          setIsSelectMode(active);
          if (!active) setSelectedIds(new Set());
        }}
        onBack={isListLevel ? () => navigateCatalog(null) : undefined}
        resultCount={isListLevel ? filteredJobs.length : completedJobs.length}
        sortBy={sortBy}
        showViewModeToggle={isListLevel}
      />

      {premiumBanner}

      {!isListLevel ? (
        <CookbookHome
          totalRecipes={completedJobs.length}
          collections={collections}
          jobsByCollection={jobsByCollection}
          shelves={shelves}
          allFlags={allFlags}
          formatTotalTime={formatTotalTime}
          onOpenList={openList}
          onOpenRecipe={(e, job) => handleCardClick(e, job)}
          onAddCollection={handleAddCollectionClick}
          onManageCollections={handleAddCollectionClick}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          bindLongPress={bindLongPress}
        />
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center py-14 px-6">
          <SearchX className="w-9 h-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {t('catalog.noMatches')}
          </p>
          {(activeFilterCount > 0 || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                resetFilters();
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-bold rounded-full bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
            >
              {t('catalog.resetFilters')}
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredJobs.map(job => (
            <RecipePosterCard
              key={job.id}
              job={job}
              totalTime={formatTotalTime(job.recipe!)}
              isSelected={selectedIds.has(job.id)}
              isSelectMode={isSelectMode}
              bindLongPress={bindLongPress(job.id, job)}
              onClick={(e) => handleCardClick(e, job)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredJobs.map(job => (
            <RecipeListItem
              key={job.id}
              job={job}
              isSelected={selectedIds.has(job.id)}
              isSelectMode={isSelectMode}
              totalTime={formatTotalTime(job.recipe!)}
              recipeTags={getRecipeTags(job.recipe!)}
              bindLongPress={bindLongPress(job.id, job)}
              onClick={(e) => handleCardClick(e, job)}
            />
          ))}
        </div>
      )}

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

      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        sortBy={sortBy}
        onApply={(next, nextSort) => {
          setFilters(next);
          setSortBy(nextSort);
        }}
        collections={collections}
        allFlags={allFlags}
        countMatches={countMatches}
      />

      {sheets}
    </div>
  );
}
