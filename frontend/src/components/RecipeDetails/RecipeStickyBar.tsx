import { Tabs } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeStickyBarProps {
  recipeTitle: string;
  /** True once the hero/title block has scrolled out of view. */
  isCollapsed: boolean;
  onBack?: () => void;
}

/**
 * The ingredients/instructions switcher, pinned below the app's sticky top
 * region (see `--app-sticky-top`). Previously the tab list sat in the normal
 * flow roughly two screens down, so switching tabs mid-recipe meant scrolling
 * all the way back up.
 *
 * Once the title block is gone the bar reveals a compact header row with a back
 * arrow and the recipe title, so the user never loses track of which recipe
 * they are looking at.
 *
 * The `<Tabs>` root stays in `RecipeDetails/index.tsx` — only the list lives
 * here — so `useSwipeableTabs` keeps driving both the list and the panels.
 */
export default function RecipeStickyBar({ recipeTitle, isCollapsed, onBack }: RecipeStickyBarProps) {
  const { t } = useI18n();

  // HeroUI's `variant="secondary"` (underline) styling is scoped to
  // `.tabs--secondary > .tabs__list-container`. Wrapping the list in this
  // sticky container breaks that direct-child relationship, so the underline
  // look is re-applied explicitly on the slots below.
  const tabClasses =
    'flex-1 flex-shrink-0 px-3 text-center !h-auto py-3 !rounded-none text-sm font-semibold transition-all cursor-pointer !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white whitespace-nowrap';

  const indicatorClasses =
    '!top-auto !bottom-0 !h-0.5 !rounded-none !shadow-none bg-emerald-600 dark:bg-emerald-500';

  return (
    <div className="sticky top-[var(--app-sticky-top)] z-30 -mx-4 px-4 bg-[#f9fafb]/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
      {/* Collapsed title row — only present once the hero has scrolled away. */}
      <div
        className={`flex items-center gap-2 overflow-hidden motion-safe:transition-all motion-safe:duration-200 ${
          isCollapsed ? 'max-h-12 opacity-100 pt-2' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isCollapsed}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            tabIndex={isCollapsed ? 0 : -1}
            aria-label={t('recipe.back')}
            className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all cursor-pointer outline-none border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
          {recipeTitle}
        </span>
      </div>

      <Tabs.ListContainer className="w-full !bg-transparent !rounded-none">
        <Tabs.List className="flex w-full !p-0 overflow-x-auto scrollbar-none">
          <Tabs.Tab id="ingredients" className={tabClasses}>
            {t('recipe.tabIngredients')}
            <Tabs.Indicator className={indicatorClasses} />
          </Tabs.Tab>
          <Tabs.Tab id="steps" className={tabClasses}>
            {t('recipe.tabInstructions')}
            <Tabs.Indicator className={indicatorClasses} />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </div>
  );
}
