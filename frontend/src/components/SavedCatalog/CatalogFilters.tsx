import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Search, List, LayoutGrid, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface CatalogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'card' | 'compact';
  setViewMode: (mode: 'card' | 'compact') => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  allTags: string[];
  isSelectMode: boolean;
  setIsSelectMode: (active: boolean) => void;
}

export default function CatalogFilters({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  activeFilter,
  setActiveFilter,
  allTags,
  isSelectMode,
  setIsSelectMode
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
    <div className="sticky top-[52px] z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 pb-3 -mx-4 px-4 md:-mx-6 md:px-6 flex flex-col gap-3 pt-3">
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
            <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-white pl-1 select-none">
              {t('catalog.title')}
            </h1>
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

        {/* Dynamic Tag chips */}
        {allTags.map((tag: string) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-4.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
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
  );
}
