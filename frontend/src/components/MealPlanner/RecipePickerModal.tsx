import React, { useState, useMemo } from 'react';
import { X, Search, Clock, ChefHat, Sparkles } from 'lucide-react';
import type { RecipePickerModalProps } from './types';
import CachedImage from '../CachedImage';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { hapticLight, hapticMedium } from '../../utils/haptics';

type FilterType = 'all' | 'quick' | 'favorites';

function formatDateHuman(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const RecipePickerModal: React.FC<RecipePickerModalProps> = ({
  isOpen,
  mealType,
  dateStr,
  history,
  onClose,
  onSelectRecipe,
}) => {
  const { t } = useI18n();
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl border-none shadow-[0_-4px_30px_rgba(0,0,0,0.12)] max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {mealTitle} – {formatDateHuman(dateStr)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('mealPlanner.addRecipePrompt')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 active:scale-90 transition-all border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
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
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-none focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              hapticLight();
              setActiveFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border-none ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border-none ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border-none ${
              activeFilter === 'favorites'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('mealPlanner.pickerFilterFavorites')}
          </button>
          <button
            onClick={handleRandomPick}
            className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer border-none flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('mealPlanner.pickerFilterRandom')}
          </button>
        </div>

        {/* Recipes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((saved) => (
              <button
                key={saved.recipeId}
                onClick={() => handleSelect(saved)}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-left active:scale-[0.99] transition-all group border-none cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  <CachedImage
                    src={saved.recipe?.imageUrl}
                    alt={saved.recipe?.title || 'Recipe'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {saved.recipe?.title}
                  </h4>
                  {saved.recipe?.prepTime && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{saved.recipe.prepTime} min</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400">
              <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Keine Rezepte gefunden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipePickerModal;
