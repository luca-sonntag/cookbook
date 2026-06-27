import { Button } from '@heroui/react';
import { ShoppingCart, Play, Sparkles } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeActionDockProps {
  totalStepsCount: number;
  onNavigateToShoppingList?: () => void;
  shoppingListCount?: number;
  onStartCooking: () => void;
  recipeId?: string;
  onRemixClick?: () => void;
}

export default function RecipeActionDock({
  totalStepsCount,
  onNavigateToShoppingList,
  shoppingListCount,
  onStartCooking,
  recipeId,
  onRemixClick
}: RecipeActionDockProps) {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
      <div className="flex items-center gap-3.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xl">
        {/* Start Cooking Button */}
        {totalStepsCount > 0 && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold pl-3.5 pr-4 h-9 rounded-full flex items-center gap-1.5 active:scale-95 transition-all text-xs border border-emerald-500/10 shadow-sm"
            onPress={onStartCooking}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{t('recipe.startCooking')}</span>
          </Button>
        )}

        {/* Remix Button */}
        {recipeId && onRemixClick && (
          <>
            <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10" />
            <button
              onClick={onRemixClick}
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 outline-none border-none group"
              title="Recipe Remix"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            </button>
          </>
        )}

        {/* Vertical Divider */}
        {onNavigateToShoppingList && (totalStepsCount > 0 || (recipeId && onRemixClick)) && (
          <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10" />
        )}

        {/* Shopping List Button */}
        {onNavigateToShoppingList && (
          <button
            onClick={onNavigateToShoppingList}
            className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 outline-none border-none"
            aria-label="Go to shopping list"
          >
            <ShoppingCart className="w-5 h-5" />
            {shoppingListCount !== undefined && shoppingListCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse-slow">
                {shoppingListCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
