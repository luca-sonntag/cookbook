import { Button } from '@heroui/react';
import { ShoppingCart, ShoppingBag, Play, Sparkles, Lock } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import FloatingActionBar, { FloatingDivider } from '../FloatingActionBar';

interface RecipeActionDockProps {
  totalStepsCount: number;
  onAddToCart?: () => void;
  isAdded?: boolean;
  onStartCooking: () => void;
  recipeId?: string;
  onRemixClick?: () => void;
}

export default function RecipeActionDock({
  totalStepsCount,
  onAddToCart,
  isAdded,
  onStartCooking,
  recipeId,
  onRemixClick
}: RecipeActionDockProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();

  const showStart = totalStepsCount > 0;
  const showRemix = !!recipeId && !!onRemixClick;
  const showShopping = !!onAddToCart;

  // Compute whether each optional divider should render based on what
  // actions are present on either side.
  const showRemixDivider = showRemix && (showStart || showShopping);
  const showShoppingDivider = showShopping && (showStart || showRemix);

  return (
    <FloatingActionBar className="bottom-28">
      {/* Start Cooking Button */}
      {showStart && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold pl-4.5 pr-5 h-11 rounded-full flex items-center gap-2 active:scale-95 transition-all text-sm border border-emerald-500/10 shadow-sm"
          onPress={onStartCooking}
        >
          {isPremium ? (
            <Play className="w-4 h-4 fill-white" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          <span>{t('recipe.startCooking')}</span>
        </Button>
      )}

      {/* Remix Button */}
      {showRemix && (
        <>
          <FloatingDivider show={showRemixDivider} />
          <button
            onClick={onRemixClick}
            className="relative p-3 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 outline-none border-none group"
            title="Recipe Remix"
          >
            <Sparkles className="w-5.5 h-5.5 group-hover:animate-pulse" />
            {!isPremium && (
              <div className="absolute -top-0.5 -right-0.5 bg-amber-500 border border-white dark:border-gray-900 text-white text-[9px] font-bold rounded-full p-0.5 shadow-sm">
                <Lock className="w-2 h-2" />
              </div>
            )}
          </button>
        </>
      )}

      {/* Add to Shopping List Button */}
      {showShopping && (
        <>
          <FloatingDivider show={showShoppingDivider} />
          <button
            onClick={onAddToCart}
            className={`relative p-3 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full outline-none border-none ${
              isAdded
                ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                : 'text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            aria-label="Add to shopping list"
          >
            {isAdded
              ? <ShoppingBag className="w-5.5 h-5.5" />
              : <ShoppingCart className="w-5.5 h-5.5" />
            }
          </button>
        </>
      )}
    </FloatingActionBar>
  );
}