import React from 'react';
import { Sparkles, BookOpen, ShoppingCart, User, Trophy } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import type { AppTab } from '../hooks/useHashRouter';

interface AppBottomNavProps {
  activeView: AppTab;
  isPending: boolean;
  isPremium: boolean;
  isCatalogSelectMode: boolean;
  isCatalogSheetOpen: boolean;
  isPremiumModalOpen: boolean;
  uncheckedShoppingItemsCount: number;
  incomingRequestsCount: number;
  userLevel: number | null;
  lastHistorySubPath: string | null;
  onNavigate: (tab: AppTab, subPath?: string | null) => void;
  onFetchHistory: () => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeView,
  isPending,
  isPremium,
  isCatalogSelectMode,
  isCatalogSheetOpen,
  isPremiumModalOpen,
  uncheckedShoppingItemsCount,
  incomingRequestsCount,
  userLevel,
  lastHistorySubPath,
  onNavigate,
  onFetchHistory,
}) => {
  const { t } = useI18n();

  const isBottomBarHidden =
    (activeView === 'history' && (isCatalogSelectMode || isCatalogSheetOpen)) ||
    (isPending && !isPremium) ||
    isPremiumModalOpen;

  const bottomBarClasses = `fixed bottom-0 inset-x-0 z-40 transition-all duration-300 ease-in-out px-3 pb-[calc(0.75rem_+_var(--safe-area-inset-bottom))] ${
    isBottomBarHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
  }`;

  return (
    <>
      {/* Subtle bottom gradient fade to soften scrolling content behind floating bars */}
      <div
        className={`fixed bottom-0 inset-x-0 h-28 pointer-events-none z-30 bg-gradient-to-t from-[#f9fafb] via-[#f9fafb]/80 to-transparent dark:from-[#1a1917] dark:via-[#1a1917]/80 transition-opacity duration-300 ${
          isBottomBarHidden ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      <div className={bottomBarClasses}>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.16),0_4px_16px_rgba(0,0,0,0.08)] w-full max-w-md mx-auto flex flex-col rounded-3xl overflow-hidden">
          <div className="w-full flex justify-around items-center pt-3 pb-3 px-3">
            {/* Extract / New Recipe Tab */}
            <button
              onClick={() => onNavigate('extract')}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${
                activeView === 'extract'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Sparkles className="w-5.5 h-5.5 mb-1" />
                {isPending && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin" />
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-wide font-medium">{t('app.nav.newRecipe')}</span>
              {activeView === 'extract' && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              )}
            </button>

            {/* Recipes / History Tab */}
            <button
              onClick={() => {
                if (activeView === 'history') {
                  onNavigate('history');
                } else {
                  onNavigate('history', lastHistorySubPath);
                }
                onFetchHistory();
              }}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${
                activeView === 'history'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <BookOpen className="w-5.5 h-5.5 mb-1" />
              </div>
              <span className="text-[11px] tracking-wide font-medium">{t('app.nav.savedRecipes')}</span>
              {activeView === 'history' && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              )}
            </button>

            {/* Shopping List Tab */}
            <button
              onClick={() => onNavigate('shopping-list')}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${
                activeView === 'shopping-list'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-5.5 h-5.5 mb-1" />
                {uncheckedShoppingItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse-slow">
                    {uncheckedShoppingItemsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-wide font-medium">{t('app.nav.shoppingList')}</span>
              {activeView === 'shopping-list' && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              )}
            </button>

            {/* Progress Tab */}
            <button
              onClick={() => onNavigate('progress')}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${
                activeView === 'progress'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Trophy className="w-5.5 h-5.5 mb-1" />
                {incomingRequestsCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center text-center leading-none rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                    {incomingRequestsCount}
                  </span>
                ) : userLevel !== null && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center text-center leading-none rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-gray-900 animate-pulse-slow">
                    {userLevel}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-wide font-medium">{t('app.nav.progress')}</span>
              {activeView === 'progress' && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              )}
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => onNavigate('settings')}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${
                activeView === 'settings'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <User className="w-5.5 h-5.5 mb-1" />
              </div>
              <span className="text-[11px] tracking-wide font-medium">{t('app.nav.settings') || 'Profil'}</span>
              {activeView === 'settings' && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default AppBottomNav;
