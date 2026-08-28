import React, { useState, useMemo } from 'react';
import { X, Search, Clock, ChefHat } from 'lucide-react';
import type { RecipePickerModalProps } from './types';
import CachedImage from '../CachedImage';
import { useI18n } from '../../context/I18nContext';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const query = searchQuery.toLowerCase().trim();
    return history.filter(
      (h) =>
        h.recipe?.title?.toLowerCase().includes(query) ||
        h.recipe?.tags?.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [history, searchQuery]);

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
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 active:scale-90 transition-all border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-2">
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

        {/* Recipes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((saved) => (
              <button
                key={saved.recipeId}
                onClick={() => {
                  onSelectRecipe(saved);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-left active:scale-[0.99] transition-all group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  <CachedImage
                    src={saved.recipe?.imageUrl}
                    alt={saved.recipe?.title || 'Recipe'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {saved.recipe?.title}
                  </h4>
                  {saved.recipe?.prepTime && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
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
