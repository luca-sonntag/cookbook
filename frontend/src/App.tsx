import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@heroui/react';
import { ChefHat, Sparkles, BookOpen, ShoppingCart, LogOut } from 'lucide-react';

import type { Job } from './types';
import ThemeToggle from './components/ThemeToggle';
import InstallBanner from './components/InstallBanner';
import ExtractForm from './components/ExtractForm';
import ProgressTracker from './components/ProgressTracker';
import ErrorBanner from './components/ErrorBanner';
import RecipeDetails from './components/RecipeDetails';
import SavedCatalog from './components/SavedCatalog/index';
import ShoppingList from './components/ShoppingList';
import AuthForm from './components/AuthForm';

import { useTheme } from './hooks/useTheme';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useRecipeExtraction } from './hooks/useRecipeExtraction';
import { useShoppingList } from './hooks/useShoppingList';
import { useDialog } from './context/DialogContext';
import { useI18n } from './context/I18nContext';
import { useAuth } from './context/AuthContext';
import { useMobileNavigationBack } from './hooks/useMobileNavigationBack';
import { deleteCachedImage } from './utils/imageStore';

export default function App() {
  const dialog = useDialog();
  const { t, language, setLanguage } = useI18n();
  const { user, loading: authLoading, signOut, getAccessToken } = useAuth();

  // History & Multi-view states
  const [history, setHistory] = useState<Job[]>([]);
  const [activeView, setActiveView] = useState<'extract' | 'history' | 'shopping-list'>('history');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Custom Hooks for Theme, PWA Installation, Recipe Extraction, and Shopping List
  const [theme, setTheme] = useTheme();
  const { isInstallable, installStatus, handleInstallClick } = usePwaInstall();
  const {
    aggregatedList,
    addRecipeIngredients,
    addCustomItem,
    toggleItemGroup,
    deleteItemGroup,
    clearAll,
    clearChecked
  } = useShoppingList();

  // Fetch recipe extraction history (using JWT)
  const fetchHistory = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setHistory(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [getAccessToken]);

  const {
    isPending,
    jobStatus,
    jobError,
    recipe,
    setRecipe,
    url,
    setUrl,
    urlError,
    validateUrl,
    triggerExtraction,
  } = useRecipeExtraction(getAccessToken, fetchHistory);

  // Mobile back button & swipe gestures for newly extracted recipe details
  useMobileNavigationBack(activeView === 'extract' && !!recipe, () => {
    setRecipe(null);
    setUrl('');
  });

  // Fetch history on load and when API key changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const handleDeleteJob = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await dialog.confirm({
      title: t('app.dialog.deleteRecipe.title'),
      message: t('app.dialog.deleteRecipe.message'),
      confirmLabel: t('app.dialog.deleteRecipe.confirm'),
      cancelLabel: t('app.dialog.deleteRecipe.cancel'),
      status: 'danger'
    });
    if (!confirmed) {
      return;
    }

    try {
      const job = history.find(j => j.id === id);
      if (job?.recipe) {
        const r = job.recipe;
        const imagesToDelete = r.imageUrls && r.imageUrls.length > 0
          ? r.imageUrls
          : (r.imageUrl ? [r.imageUrl] : []);
        
        for (const imgUrl of imagesToDelete) {
          await deleteCachedImage(imgUrl);
        }
      }

      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchHistory();
        if (selectedJob?.id === id) {
          setSelectedJob(null);
        }
      } else {
        dialog.alert({
          title: t('app.dialog.deleteError.title'),
          message: t('app.dialog.deleteError.message'),
          status: 'danger'
        });
      }
    } catch (err) {
      console.error('Error deleting recipe:', err);
      dialog.alert({
        title: t('app.dialog.connectionError.title'),
        message: t('app.dialog.connectionError.message'),
        status: 'danger'
      });
    }
  };

  // Web Share Target Interceptor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text');
    const urlParam = params.get('url');
    const title = params.get('title');

    if (text || urlParam || title) {
      const combinedSearch = [text, urlParam, title].filter(Boolean).join(' ');
      const regex = /(https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/[A-Za-z0-9_-]+)/i;
      const match = combinedSearch.match(regex);
      if (match) {
        const extractedUrl = match[1];
        window.history.replaceState({}, document.title, '/');
        // Defer state update to avoid calling setState synchronously in effect
        setTimeout(() => {
          setUrl(extractedUrl);
          setActiveView('extract');
          triggerExtraction(extractedUrl);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerExtraction(url);
  };

  const getStatusDetails = () => {
    switch (jobStatus) {
      case 'pending':
        return { text: t('job.status.pending.text'), sub: t('job.status.pending.sub') };
      case 'scraping':
        return { text: t('job.status.scraping.text'), sub: t('job.status.scraping.sub') };
      case 'processing':
        return { text: t('job.status.processing.text'), sub: t('job.status.processing.sub') };
      case 'completed':
        return { text: t('job.status.completed.text'), sub: t('job.status.completed.sub') };
      case 'failed':
        return { text: t('job.status.failed.text'), sub: jobError || t('job.status.failed.sub') };
      default:
        return null;
    }
  };

  const statusDetails = getStatusDetails();

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] dark:bg-[#030712]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center transition-colors duration-300">
      {/* Sticky Header Container */}
      <header className="sticky top-0 z-40 w-full bg-[#f9fafb]/85 dark:bg-[#030712]/85 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors duration-300">
        <div className="relative w-full max-w-2xl mx-auto px-4 py-3.5 flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white m-0 leading-none">{t('app.title')}</h1>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">{t('app.subtitle')} ({installStatus})</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (hidden on mobile) */}
          <div className="hidden md:flex border border-black/10 dark:border-white/10 p-1 rounded-xl bg-black/5 dark:bg-white/5 items-center">
            <button
              onClick={() => setActiveView('extract')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'extract' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('app.nav.newRecipe')}</span>
            </button>
            <button
              onClick={() => {
                setActiveView('history');
                fetchHistory();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'history' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('app.nav.savedRecipes')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                activeView === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}>
                {history.filter(h => h.status === 'completed').length}
              </span>
            </button>
            <button
              onClick={() => setActiveView('shopping-list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeView === 'shopping-list' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('app.nav.shoppingList')}</span>
              {aggregatedList.unchecked.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                  activeView === 'shopping-list'
                    ? 'bg-white text-emerald-600'
                    : 'bg-rose-500 text-white'
                }`}>
                  {aggregatedList.unchecked.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="tertiary"
              className="font-bold text-xs min-w-0 px-2 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all outline-none border-none"
              onPress={() => setLanguage(language === 'de' ? 'en' : 'de')}
              aria-label="Change Language"
            >
              {language.toUpperCase()}
            </Button>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <Button
              isIconOnly
              variant="tertiary"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onPress={() => signOut()}
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* App Install Banner */}
      <InstallBanner isInstallable={isInstallable} handleInstallClick={handleInstallClick} />

      {/* Main content body */}
      <main className="w-full max-w-2xl px-4 mt-6 flex-1 flex flex-col gap-6 pb-24 md:pb-8">

        {/* CONDITIONAL RENDERING OF VIEWS */}
        {activeView === 'extract' ? (
          <>
            {/* Extraction Form */}
            <ExtractForm 
              url={url} 
              setUrl={setUrl} 
              urlError={urlError} 
              validateUrl={validateUrl} 
              isPending={isPending} 
              handleFormSubmit={handleFormSubmit} 
            />

            {/* Processing State Tracker */}
            <ProgressTracker isPending={isPending} jobStatus={jobStatus} statusDetails={statusDetails} />

            {/* Error State Banner */}
            <ErrorBanner 
              isPending={isPending} 
              jobStatus={jobStatus} 
              jobError={jobError} 
              triggerExtraction={triggerExtraction} 
              url={url} 
            />

            {/* Recipe Display Card */}
            {recipe && (
              <RecipeDetails 
                key={recipe.id || recipe.title} 
                recipe={recipe} 
                onAddIngredients={addRecipeIngredients} 
                reelUrl={url}
                onBack={() => {
                  setRecipe(null);
                  setUrl('');
                }}
                onNavigateToShoppingList={() => setActiveView('shopping-list')}
                shoppingListCount={aggregatedList.unchecked.length}
              />
            )}
          </>
        ) : activeView === 'history' ? (
          /* SAVED RECIPES TAB */
          <SavedCatalog 
            history={history} 
            selectedJob={selectedJob} 
            setSelectedJob={setSelectedJob} 
            handleDeleteJob={handleDeleteJob} 
            onAddIngredients={addRecipeIngredients}
            fetchHistory={fetchHistory}
            getAccessToken={getAccessToken}
            onNavigateToShoppingList={() => {
              setSelectedJob(null);
              setActiveView('shopping-list');
            }}
            shoppingListCount={aggregatedList.unchecked.length}
          />
        ) : (
          /* SHOPPING LIST TAB */
          <ShoppingList
            aggregatedList={aggregatedList}
            addCustomItem={addCustomItem}
            toggleItemGroup={toggleItemGroup}
            deleteItemGroup={deleteItemGroup}
            clearAll={clearAll}
            clearChecked={clearChecked}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {(() => {
        const isRecipeDetailOpen = !!selectedJob || (activeView === 'extract' && !!recipe);
        const bottomBarClasses = `fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-black/10 dark:border-white/10 md:hidden transition-all duration-300 ease-in-out pb-safe ${
          isRecipeDetailOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`;

        return (
          <div className={bottomBarClasses}>
            <div className="flex justify-around items-center pt-2.5 pb-4 px-2">
              {/* Extract / New Recipe Tab */}
              <button
                onClick={() => setActiveView('extract')}
                className={`flex-1 flex flex-col items-center justify-center pt-1.5 pb-3 relative transition-colors ${
                  activeView === 'extract'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-wide">{t('app.nav.newRecipe')}</span>
                {activeView === 'extract' && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </button>

              {/* Recipes / History Tab */}
              <button
                onClick={() => {
                  setActiveView('history');
                  fetchHistory();
                }}
                className={`flex-1 flex flex-col items-center justify-center pt-1.5 pb-3 relative transition-colors ${
                  activeView === 'history'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <BookOpen className="w-5 h-5 mb-0.5" />
                </div>
                <span className="text-[10px] tracking-wide">{t('app.nav.savedRecipes')}</span>
                {activeView === 'history' && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </button>

              {/* Shopping List Tab */}
              <button
                onClick={() => setActiveView('shopping-list')}
                className={`flex-1 flex flex-col items-center justify-center pt-1.5 pb-3 relative transition-colors ${
                  activeView === 'shopping-list'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 mb-0.5" />
                  {aggregatedList.unchecked.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse-slow">
                      {aggregatedList.unchecked.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-wide">{t('app.nav.shoppingList')}</span>
                {activeView === 'shopping-list' && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
