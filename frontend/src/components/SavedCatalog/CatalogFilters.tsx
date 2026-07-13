import { useState, useEffect } from 'react';
import { Button, Select, ListBox } from '@heroui/react';
import { Search, List, LayoutGrid, CheckSquare, Square, ArrowLeft, Star, Tag, Plus } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { Collection } from '../../types';

interface CatalogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'card' | 'compact';
  setViewMode: (mode: 'card' | 'compact') => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  allFlags: string[];
  collections: Collection[];
  isSelectMode: boolean;
  setIsSelectMode: (active: boolean) => void;
  sortBy: 'newest' | 'title' | 'time';
  setSortBy: (sort: 'newest' | 'title' | 'time') => void;
  onAddCollection: () => void;
}

export default function CatalogFilters({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  activeFilter,
  setActiveFilter,
  allFlags,
  collections,
  isSelectMode,
  setIsSelectMode,
  sortBy,
  setSortBy,
  onAddCollection
}: CatalogFiltersProps) {
  const { t } = useI18n();
  const [isSearchActive, setIsSearchActive] = useState(!!searchQuery);

  // Auto-open search if searchQuery is set from outside
  useEffect(() => {
    if (searchQuery) {
      setIsSearchActive(true);
    }
  }, [searchQuery]);

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  return (
    <div className="sticky top-[calc(52px+env(safe-area-inset-top))] z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 pb-3 -mx-4 px-4 md:-mx-6 md:px-6 flex flex-col gap-3 pt-3">
      {/* Search & View Toggle Bar */}
      <div className="flex gap-2 items-center min-h-[44px]">
        {isSearchActive ? (
          <div className="flex-1 flex gap-2 items-center w-full">
            <Button
              isIconOnly
              variant="tertiary"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-transparent border-0 text-gray-500 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
              onPress={handleCloseSearch}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.searchPlaceholder')}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-10 py-3 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 animate-in fade-in slide-in-from-left-2 duration-200"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl font-bold w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Button
              isIconOnly
              variant="tertiary"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-transparent border-0 text-gray-500 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
              onPress={() => setIsSearchActive(true)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              isIconOnly
              variant="tertiary"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-transparent border-0 text-gray-500 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
              onPress={() => setViewMode(viewMode === 'card' ? 'compact' : 'card')}
              aria-label={t('catalog.viewToggle')}
            >
              {viewMode === 'card' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </Button>
            <Button
              isIconOnly
              variant="tertiary"
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl active:scale-95 transition-all shrink-0 ${
                isSelectMode
                  ? 'bg-emerald-600 border-0 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/10'
                  : 'bg-transparent border-0 text-gray-500 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onPress={() => setIsSelectMode(!isSelectMode)}
              aria-label={t('catalog.selectModeToggle')}
            >
              {isSelectMode ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </Button>

            <div className="flex-1" />

            {/* Sort Control Dropdown */}
            <Select
              variant="secondary"
              selectedKey={sortBy}
              onSelectionChange={(key) => setSortBy(key as any)}
              className="w-32 shrink-0"
              aria-label="Sort"
            >
              <Select.Trigger className="h-11 py-1.5 px-3 flex items-center leading-none rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-none hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <Select.Value className="text-xs font-semibold text-gray-600 dark:text-gray-300" />
                <Select.Indicator className="size-3.5 ml-1 text-gray-500" />
              </Select.Trigger>
              <Select.Popover className="p-1 min-w-[140px] bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 rounded-xl shadow-lg">
                <ListBox>
                  <ListBox.Item id="newest" textValue={t('catalog.sortNewest')} className="px-3.5 py-2.5 text-xs font-semibold rounded-lg">
                    {t('catalog.sortNewest')}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="title" textValue={t('catalog.sortTitle')} className="px-3.5 py-2.5 text-xs font-semibold rounded-lg">
                    {t('catalog.sortTitle')}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="time" textValue={t('catalog.sortTime')} className="px-3.5 py-2.5 text-xs font-semibold rounded-lg">
                    {t('catalog.sortTime')}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </>
        )}
      </div>

      {/* Horizontal Scrollable Filter Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 md:-mx-6 md:px-6 scroll-smooth">
        {/* 'All' chip */}
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('catalog.allFilter')}
        </button>

        {/* 'Favorites' chip */}
        <button
          onClick={() => setActiveFilter('favorites')}
          className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'favorites'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeFilter === 'favorites' ? 'fill-white stroke-white text-white' : 'text-amber-500 fill-amber-500'}`} />
          {t('catalog.favoritesFilter') || 'Favoriten'}
        </button>

        {/* Collection chips */}
        {collections.map(col => {
          const colFilter = `collection:${col.id}`;
          const isSelected = activeFilter === colFilter;
          return (
            <button
              key={col.id}
              onClick={() => setActiveFilter(isSelected ? 'all' : colFilter)}
              className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {col.emoji && <span className="text-base leading-none">{col.emoji}</span>}
              <span>{col.name}</span>
            </button>
          );
        })}

        {/* 'Under 15' chip */}
        <button
          onClick={() => setActiveFilter('under15')}
          className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
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
          className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
            activeFilter === 'under30'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('catalog.under30')}
        </button>

        {/* Custom Flag chips */}
        {allFlags.map((flag: string) => {
          const flagFilter = `flag:${flag}`;
          const isSelected = activeFilter === flagFilter;
          return (
            <button
              key={flag}
              onClick={() => setActiveFilter(isSelected ? 'all' : flagFilter)}
              className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm font-bold'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Tag className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
              <span>{flag}</span>
            </button>
          );
        })}

        {/* '+ Sammlung' button */}
        <button
          onClick={onAddCollection}
          className="px-4.5 py-2 text-sm font-semibold rounded-full border border-dashed border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 active:scale-95 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('catalog.addCollection') || '＋ Sammlung'}</span>
        </button>
      </div>
    </div>
  );
}
