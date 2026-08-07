import { ShoppingCart, ShoppingBag, Play, MessageCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import FloatingActionBar, { FloatingDivider } from '../FloatingActionBar';
import PremiumCrownBadge from '../PremiumCrownBadge';
import CookedButton from '../CookedButton';
import { useHideOnScroll } from '../../hooks/useHideOnScroll';

interface RecipeActionDockProps {
  totalStepsCount: number;
  onAddToCart?: () => void;
  isAdded?: boolean;
  onStartCooking: () => void;
  recipeId?: string;
  recipeTitle?: string;
  onRemixClick?: () => void;
}

export default function RecipeActionDock({
  totalStepsCount,
  onAddToCart,
  isAdded,
  onStartCooking,
  recipeId,
  recipeTitle,
  onRemixClick
}: RecipeActionDockProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();

  const isHidden = useHideOnScroll();

  const showStart = totalStepsCount > 0;
  const showRemix = !!recipeId && !!onRemixClick;
  const showShopping = !!onAddToCart;
  const showCooked = !!recipeId;

  const showRemixDivider = showRemix && (showStart || showShopping);
  const showShoppingDivider = showShopping && (showStart || showRemix);
  const showCookedDivider = showCooked && (showStart || showRemix || showShopping);

  return (
    <FloatingActionBar className="bottom-[calc(7rem_+_var(--safe-area-inset-bottom))]" isHidden={isHidden}>
      {/* Start Cooking Button */}
      {showStart && (
        <button
          onClick={onStartCooking}
          className="relative p-3 text-white bg-emerald-600 hover:bg-emerald-500 active:scale-90 transition-all cursor-pointer flex items-center justify-center rounded-full shadow-md outline-none border-none group"
          title={t('recipe.startCooking')}
          aria-label={t('recipe.startCooking')}
        >
          <Play className="w-5.5 h-5.5 fill-white" />
          {!isPremium && <PremiumCrownBadge />}
        </button>
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
            <MessageCircle className="w-5.5 h-5.5 group-hover:animate-pulse" />
            {!isPremium && <PremiumCrownBadge />}
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

      {/* Cooked / Photo Verification Button */}
      {showCooked && (
        <>
          <FloatingDivider show={showCookedDivider} />
          <CookedButton
            jobId={recipeId}
            recipeTitle={recipeTitle}
            variant="dock"
          />
        </>
      )}
    </FloatingActionBar>
  );
}