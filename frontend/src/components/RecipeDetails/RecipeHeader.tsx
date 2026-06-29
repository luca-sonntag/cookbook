import { useState } from 'react';
import { Popover, Button } from '@heroui/react';
import { MoreVertical, Check, Copy, ShoppingCart, Trash2 } from 'lucide-react';
import type { Recipe } from '../../types';
import RecipeImageGallery from '../RecipeImageGallery';
import { useI18n } from '../../context/I18nContext';

interface RecipeHeaderProps {
  recipe: Recipe;
  reelUrl?: string;
  createdAt?: string;
  onBack?: () => void;
  onNavigateToShoppingList?: () => void;
  onDelete?: () => void;
  onCopyMarkdown: () => void;
  isCopied: boolean;
  isParentAvailable?: boolean;
  onNavigateToRecipe?: (recipeId: string) => void;
  parentRecipeTitle?: string | null;
}

export default function RecipeHeader({
  recipe,
  reelUrl,
  createdAt,
  onBack,
  onNavigateToShoppingList,
  onDelete,
  onCopyMarkdown,
  isCopied,
  isParentAvailable,
  onNavigateToRecipe,
  parentRecipeTitle
}: RecipeHeaderProps) {
  const { t, language } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const resolvedParentTitle = parentRecipeTitle || recipe.parentRecipeTitle;

  return (
    <>
      {/* Responsive Image Gallery */}
      <RecipeImageGallery recipe={recipe} reelUrl={reelUrl} onBack={onBack} />

      {/* Recipe title header */}
      <div className="flex justify-between items-start gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">{recipe.title}</h2>
          {recipe.parentJobId && resolvedParentTitle && (
            <div className="mt-1.5 text-xs flex flex-wrap items-center gap-1 text-gray-500 dark:text-gray-400 leading-normal break-words">
              <span>{t('remix.parentLinkPrefix') || 'Abgewandelt von'}</span>
              {isParentAvailable ? (
                <button
                  type="button"
                  onClick={() => onNavigateToRecipe?.(recipe.parentJobId!)}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer outline-none border-none p-0 bg-transparent text-left leading-normal"
                >
                  {resolvedParentTitle}
                </button>
              ) : (
                <span className="font-semibold text-gray-400 dark:text-gray-500 italic">
                  {resolvedParentTitle} ({t('remix.parentLinkDeleted') || 'gelöscht'})
                </span>
              )}
              {recipe.remixPrompt && (
                <span className="italic text-gray-400 dark:text-gray-500 ml-1">
                  ({recipe.remixPrompt})
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed break-words">{recipe.description}</p>
          {createdAt && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
              {t('catalog.savedOn', { date: new Date(createdAt).toLocaleDateString(language) })}
            </p>
          )}
        </div>
        <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <Popover.Trigger>
            <Button
              isIconOnly
              variant="outline"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl flex items-center justify-center"
              aria-label="Options"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </Popover.Trigger>
          <Popover.Content placement="bottom end" className="p-1.5 min-w-[180px] bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 rounded-xl shadow-lg">
            <div className="flex flex-col w-full">
              <button
                onClick={() => {
                  onCopyMarkdown();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4.5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-left transition-colors cursor-pointer outline-none border-none"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">{t('recipe.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('recipe.copyRecipe')}</span>
                  </>
                )}
              </button>

              {onNavigateToShoppingList && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigateToShoppingList();
                  }}
                  className="flex items-center gap-3 w-full px-4.5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-left transition-colors cursor-pointer outline-none border-none"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  <span>{t('recipe.goToShoppingList')}</span>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete();
                  }}
                  className="flex items-center gap-3 w-full px-4.5 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors cursor-pointer outline-none border-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('recipe.delete')}</span>
                </button>
              )}
            </div>
          </Popover.Content>
        </Popover>
      </div>
    </>
  );
}
