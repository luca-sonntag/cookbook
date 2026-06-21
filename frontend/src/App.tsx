import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Key, ChefHat } from 'lucide-react';

import type { Job } from './types';
import ThemeToggle from './components/ThemeToggle';
import ApiConfig from './components/ApiConfig';
import InstallBanner from './components/InstallBanner';
import ExtractForm from './components/ExtractForm';
import ProgressTracker from './components/ProgressTracker';
import ErrorBanner from './components/ErrorBanner';
import RecipeDetails from './components/RecipeDetails';
import SavedCatalog from './components/SavedCatalog';
import ShoppingList from './components/ShoppingList';

import { useTheme } from './hooks/useTheme';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useRecipeExtraction } from './hooks/useRecipeExtraction';
import { useShoppingList } from './hooks/useShoppingList';
import { useDialog } from './context/DialogContext';
import { useI18n } from './context/I18nContext';

export default function App() {
  const dialog = useDialog();
  const { t, language, setLanguage } = useI18n();
  // Config & Secrets
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('recipe_api_key') || 'recipe_extractor_secret_key_12345';
  });
  const [showApiConfig, setShowApiConfig] = useState(false);

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

  // Fetch recipe extraction history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setHistory(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [apiKey]);

  const {
    isPending,
    jobStatus,
    jobError,
    recipe,
    url,
    setUrl,
    urlError,
    validateUrl,
    triggerExtraction,
  } = useRecipeExtraction(apiKey, fetchHistory);

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
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey
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

  const saveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('recipe_api_key', newKey);
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

  return (
    <div className="min-h-screen pb-16 flex flex-col items-center transition-colors duration-300">
      {/* Header Container */}
      <header className="w-full max-w-2xl px-4 mt-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white m-0 leading-none">{t('app.title')}</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('app.subtitle')} ({installStatus})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            className="font-bold text-xs min-w-0 px-2.5 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all outline-none border-none"
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
            onPress={() => setShowApiConfig(!showApiConfig)}
            aria-label="Settings"
          >
            <Key className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* App Install Banner */}
      <InstallBanner isInstallable={isInstallable} handleInstallClick={handleInstallClick} />

      {/* Main content body */}
      <main className="w-full max-w-2xl px-4 mt-6 flex-1 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex border border-black/10 dark:border-white/10 p-1 rounded-xl bg-black/5 dark:bg-white/5 w-fit self-center">
          <button
            onClick={() => setActiveView('extract')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'extract' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('app.nav.newRecipe')}
          </button>
          <button
            onClick={() => {
              setActiveView('history');
              fetchHistory();
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'history' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('app.nav.savedRecipes')} ({history.filter(h => h.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveView('shopping-list')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'shopping-list' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('app.nav.shoppingList')} {aggregatedList.unchecked.length > 0 && `(${aggregatedList.unchecked.length})`}
          </button>
        </div>

        {/* API config drawer */}
        {showApiConfig && (
          <ApiConfig apiKey={apiKey} saveApiKey={saveApiKey} setShowApiConfig={setShowApiConfig} />
        )}

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
    </div>
  );
}
