import { Button } from '@heroui/react';
import { ShoppingCart, Play, Sparkles } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import FloatingActionBar, { FloatingDivider } from '../FloatingActionBar';

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

  const showStart = totalStepsCount > 0;
  const showRemix = !!recipeId && !!onRemixClick;
  const showShopping = !!onNavigateToShoppingList;

  // Compute whether each optional divider should render based on what
  // actions are present on either side.
  const showRemixDivider = showRemix && (showStart || showShopping);
  const showShoppingDivider = showShopping && (showStart || showRemix);

  return (
    <FloatingActionBar className="bottom-32">
      {/* Start Cooking Button */}
      {showStart && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold pl-3.5 pr-4 h-9 rounded-full flex items-center gap-1.5 active:scale-95 transition-all text-xs border border-emerald-500/10 shadow-sm"
          onPress={onStartCooking}
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{t('recipe.startCooking')}</span>
        </Button>
      )}

      {/* Remix Button */}
      {showRemix && (
        <>
          <FloatingDivider show={showRemixDivider} />
          <button
            onClick={onRemixClick}
            className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 outline-none border-none group"
            title="Recipe Remix"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
          </button>
        </>
      )}

      {/* Shopping List Button */}
      {showShopping && (
        <>
          <FloatingDivider show={showShoppingDivider} />
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
        </>
      )}
    </FloatingActionBar>
  );
}