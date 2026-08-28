import React, { useState, useMemo } from 'react';
import { X, Search, Clock, Flame, ChefHat, Sparkles, Plus } from 'lucide-react';
import type { RecipePickerModalProps } from './types';
import CachedImage from '../CachedImage';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { hapticLight, hapticMedium } from '../../utils/haptics';

type FilterType = 'all' | 'quick' | 'favorites';

function formatDateHuman(iso: string, language: string): string {
  const d = new Date(iso + 'T00:00:00');
  const locale = language === 'en' ? 'en-US' : 'de-DE';
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

export const RecipePickerModal: React.FC<RecipePickerModalProps> = ({
  isOpen,
  mealType,
  dateStr,
  history,
  onClose,
  onSelectRecipe,
}) => {
  const { t, language } = useI18n();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredHistory = useMemo(() => {
    let result = history;

    // Filter by type
    if (activeFilter === 'quick') {
      result = result.filter(
        (h) => h.recipe?.prepTime && Number(h.recipe.prepTime) <= 25,
      );
    } else if (activeFilter === 'favorites') {
      result = result.filter(
        (h) => (h as unknown as { isFavorite?: boolean })?.isFavorite || (h as unknown as { favorite?: boolean })?.favorite,
      );
      // Fallback if no explicit favorites: show top 5
      if (result.length === 0) result = history.slice(0, 5);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.recipe?.title?.toLowerCase().includes(query) ||
          h.recipe?.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [history, searchQuery, activeFilter]);

  const handleRandomPick = () => {
    if (history.length === 0) return;
    hapticMedium();
    const randomIndex = Math.floor(Math.random() * history.length);
    const chosen = history[randomIndex];
    toast.success(t('mealPlanner.randomPicked'));
    onSelectRecipe(chosen);
    onClose();
  };

  const handleSelect = (saved: (typeof history)[0]) => {
    hapticMedium();
    onSelectRecipe(saved);
    onClose();
  };

  if (!isOpen) return null;

  const mealTitle = mealType ? t(`mealPlanner.meals.${mealType}`) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl border-none shadow-[0_-8px_32px_rgba(0,0,0,0.15)] max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {mealTitle} – {formatDateHuman(dateStr, language)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('mealPlanner.addRecipePrompt')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 active:scale-90 transition-all flex items-center justify-center border-none cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.25]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 pt-1 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rezept suchen..."
              className="w-full pl-9 pr-9 py-2.5 text-xs font-medium rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-none focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-none bg-transparent cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              hapticLight();
              setActiveFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 cursor-pointer border-none ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('mealPlanner.pickerFilterAll')}
          </button>
          <button
            onClick={() => {
              hapticLight();
              setActiveFilter('quick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 cursor-pointer border-none ${
              activeFilter === 'quick'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('mealPlanner.pickerFilterQuick')}
          </button>
          <button
            onClick={() => {
              hapticLight();
              setActiveFilter('favorites');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 cursor-pointer border-none ${
              activeFilter === 'favorites'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('mealPlanner.pickerFilterFavorites')}
          </button>
          <button
            onClick={handleRandomPick}
            className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.95] transition-all duration-150 cursor-pointer border-none flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>{t('mealPlanner.pickerFilterRandom')}</span>
          </button>
        </div>

        {/* Recipes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((saved) => {
              const calories =
                saved.recipe?.nutritionalValues?.calories ??
                saved.recipe?.sourceNutritionalValues?.calories;

              return (
                <button
                  key={saved.recipeId}
                  onClick={() => handleSelect(saved)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 text-left active:scale-[0.98] transition-all duration-150 group border-none cursor-pointer bg-transparent"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
                    <CachedImage
                      src={saved.recipe?.imageUrl}
                      alt={saved.recipe?.title || 'Recipe'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                      {saved.recipe?.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                      {saved.recipe?.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{saved.recipe.prepTime} min</span>
                        </span>
                      )}
                      {calories && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{Math.round(calories)} kcal</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400">
              <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">Keine Rezepte gefunden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipePickerModal;
