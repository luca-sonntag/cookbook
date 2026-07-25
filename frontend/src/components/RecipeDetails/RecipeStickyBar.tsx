import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface RecipeStickyBarProps {
  recipeTitle: string;
  isCollapsed: boolean;
  onBack?: () => void;
  activeSection: 'ingredients' | 'instructions' | 'details';
  onSectionClick: (sectionId: 'ingredients' | 'instructions' | 'details') => void;
}

/**
 * Pinned below the app's sticky top region (see `--app-sticky-top`).
 * In the single-page layout, it provides a smart scroll spy sub-navigation:
 * - Highlights the section currently in view (Zutaten, Zubereitung, Details).
 * - Tapping a section smooth-scrolls the page directly to it.
 * - When collapsed (scrolled down), reveals the recipe title and a back button.
 */
export default function RecipeStickyBar({
  recipeTitle,
  isCollapsed,
  onBack,
  activeSection,
  onSectionClick,
}: RecipeStickyBarProps) {
  const { t } = useI18n();

  const sections = [
    { id: 'ingredients' as const, label: t('recipe.tabIngredients') },
    { id: 'instructions' as const, label: t('recipe.tabInstructions') },
    { id: 'details' as const, label: t('recipe.infoSheetTitle') },
  ];

  return (
    <div className="sticky top-[var(--app-sticky-top)] z-30 -mx-4 px-4 bg-[#f9fafb]/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
      {/* Collapsed title row — only present once the hero has scrolled away. */}
      <div
        className={`flex items-center gap-2 overflow-hidden motion-safe:transition-all motion-safe:duration-200 ${
          isCollapsed ? 'max-h-12 opacity-100 pt-2' : 'max-h-0 opacity-0 pointer-events-none'
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

      {/* Navigation tabs */}
      <nav className="flex w-full mt-1.5" aria-label="Recipe Navigation">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionClick(section.id)}
              className={`flex-1 text-center py-3 text-sm font-semibold transition-all relative cursor-pointer outline-none border-none select-none ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{section.label}</span>
              {/* Smooth sliding scale underline */}
              <span
                className={`absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600 dark:bg-emerald-500 transition-all duration-200 origin-center ${
                  isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
