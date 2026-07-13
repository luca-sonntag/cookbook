import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, BookOpen, ShoppingCart, User } from 'lucide-react';

import type { Job } from './types';
import { apiUrl } from './api';
import { registerShareIntent, registerNotificationTap, hideSplashScreen, registerBackButtonHandler } from './native';
import { parseSharedUrl } from './utils/shareUrl';
import InstallBanner from './components/InstallBanner';
import ExtractForm from './components/ExtractForm';
import ProgressTracker from './components/ProgressTracker';
import ErrorBanner from './components/ErrorBanner';
import RecipeDetails from './components/RecipeDetails';
import SavedCatalog from './components/SavedCatalog/index';
import ShoppingList from './components/ShoppingList';
import AuthForm from './components/AuthForm';
import SettingsView from './components/SettingsView';
import TimerBanner from './components/TimerBanner';
import WelcomeGuide from './components/WelcomeGuide';

import { usePwaInstall } from './hooks/usePwaInstall';
import { useRecipeExtraction } from './hooks/useRecipeExtraction';
import { useShoppingList } from './hooks/useShoppingList';
import { useDialog } from './context/DialogContext';
import { useI18n } from './context/I18nContext';
import { resolveJobError } from './i18n';
import { useAuth } from './context/AuthContext';
import { useHashRouter } from './hooks/useHashRouter';
import { useMobileNavigationBack } from './hooks/useMobileNavigationBack';
import { deleteCachedImage } from './utils/imageStore';
import { useTimerManager } from './hooks/useTimerManager';
import { useOnboarding } from './hooks/useOnboarding';

// Module-level flag to ensure the Web Share Target is only processed once per page load.
// This prevents re-triggering the interceptor when the user's auth state or metadata updates.
let isWebShareProcessed = false;

export default function App() {
  const dialog = useDialog();
  const { t, language } = useI18n();
  const { user, loading: authLoading, getAccessToken, isPremiumOverride } = useAuth();

  // ── URL-based routing ────────────────────────────────────────────────────
  const { tab: activeView, subPath, navigate, replace } = useHashRouter();

  // History & multi-view states
  const [history, setHistory] = useState<Job[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [isCatalogSelectMode, setIsCatalogSelectMode] = useState(false);
  const { pendingNavigation } = useTimerManager();

  // First-launch onboarding gate (also re-openable from Settings)
  const {
    shouldShow: showOnboarding,
    complete: completeOnboarding,
    replay: replayOnboarding,
  } = useOnboarding();

  // Derived: which saved job is currently open (from URL sub-path)
  const selectedJob: Job | null =
    activeView === 'history' && subPath && historyLoaded
      ? (history.find(j => j.id === subPath) ?? null)
      : null;

  // Setter for selected job — navigates via URL
  const setSelectedJob = useCallback((job: Job | null) => {
    if (job) {
      navigate('history', job.id);
    } else {
      navigate('history');
    }
  }, [navigate]);

  // Custom Hooks for PWA Installation, Recipe Extraction, and Shopping List
  const { isInstallable, handleInstallClick } = usePwaInstall();
  const {
    aggregatedList,
    addRecipeIngredients,
    addCustomItem,
    toggleItemGroup,
    deleteItemGroup,
    clearAll,
    clearChecked
  } = useShoppingList();

  // Tracks the jobId of a just-completed extraction so the history validity
  // effect doesn't clear its subPath before the history state catches up.
  const newlyExtractedJobIdRef = useRef<string | null>(null);

  // Fetch recipe extraction history (using JWT).
  // Bounded with a timeout: on a cold app start the access token may be
  // expired, so getAccessToken() can trigger a network refresh before the
  // request even goes out. Without a cap, a stalled connection at launch
  // left the catalog spinning forever instead of failing visibly.
  const fetchHistory = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(apiUrl('/api/jobs'), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setHistory(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      clearTimeout(timeout);
      setHistoryLoaded(true);
    }
  }, [getAccessToken]);

  const handleExtractionSuccess = useCallback((jobId: string) => {
    newlyExtractedJobIdRef.current = jobId;
    navigate('history', jobId);
    fetchHistory();
  }, [fetchHistory, navigate]);

  const {
    isPending,
    jobStatus,
    jobError,
    recipe,
    setRecipe,
    progress,
    url,
    setUrl,
    urlError,
    setUrlError,
    validateUrl,
    triggerExtraction,
    limitStatus,
    fetchLimitStatus
  } = useRecipeExtraction(getAccessToken, handleExtractionSuccess, isPremiumOverride);

  // Mobile back button & swipe gestures for newly extracted recipe details
  useMobileNavigationBack(activeView === 'extract' && !!recipe, () => {
    setRecipe(null);
    setUrl('');
    navigate('extract');
  });

  // Android hardware back-button & edge swipe-back gesture (Capacitor native).
  // Without this listener, Capacitor exits the app instead of navigating back.
  // Priority order:
  //   1. history + selectedJob open → go back to recipe list
  //   2. extract + recipe shown   → go back to extract form
  //   3. any non-root tab         → go to history (root tab)
  //   4. root (history, no job)   → return false → Capacitor calls exitApp()
  useEffect(() => {
    return registerBackButtonHandler(() => {
      if (activeView === 'history' && selectedJob) {
        navigate('history');
        return true;
      }
      if (activeView === 'extract' && recipe) {
        setRecipe(null);
        setUrl('');
        navigate('extract');
        return true;
      }
      if (activeView !== 'history') {
        navigate('history');
        return true;
      }
      // Already at root — let Capacitor exit the app.
      return false;
    });
  // Note: activeView, selectedJob and recipe are intentionally in the dep array
  // so the handler always closes over the latest state.
  }, [activeView, selectedJob, recipe, navigate, setRecipe, setUrl]);

  // Fetch history on load. Waits for AuthContext's own initial getSession()
  // to settle first (authLoading) instead of firing immediately on mount —
  // otherwise this call and AuthContext's race to refresh the access token
  // concurrently on a cold start, doubling up on network work exactly when
  // connectivity is least reliable. If there's no user, skip the request
  // entirely rather than letting fetchHistory resolve a null token.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHistoryLoaded(true);
      return;
    }
    fetchHistory();

    // Initialize RevenueCat billing for the logged-in user
    import('./utils/purchase').then(({ initBilling }) => {
      initBilling(user.id);
    }).catch(err => console.error('Failed to load billing module:', err));
  }, [authLoading, user, fetchHistory]);

  // Initial sync on startup/login
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setInitialSyncDone(true);
      return;
    }

    let active = true;
    const sync = async () => {
      try {
        await fetchLimitStatus();
      } catch (e) {
        console.warn('Startup sync failed:', e);
      } finally {
        if (active) {
          setInitialSyncDone(true);
        }
      }
    };
    sync();
    return () => { active = false; };
  }, [authLoading, user, fetchLimitStatus]);

  // Fetch rate limit status when entering the extract tab (refresh)
  useEffect(() => {
    if (initialSyncDone && activeView === 'extract' && user) {
      fetchLimitStatus();
    }
  }, [activeView, user, isPremiumOverride, fetchLimitStatus, initialSyncDone]);

  // Hide native splash screen when app is fully ready
  useEffect(() => {
    if (!authLoading && initialSyncDone) {
      hideSplashScreen();
    }
  }, [authLoading, initialSyncDone]);

  // After history loads, check if current URL references a valid jobId and keep it,
  // or clear the subPath if the jobId no longer exists.
  useEffect(() => {
    if (!historyLoaded) return;
    if (activeView === 'history' && subPath) {
      const exists = history.some(j => j.id === subPath);
      if (exists) {
        // Clear the guard once the job is confirmed in history.
        if (newlyExtractedJobIdRef.current === subPath) {
          newlyExtractedJobIdRef.current = null;
        }
      } else if (subPath !== newlyExtractedJobIdRef.current) {
        // Only clear stale subPaths — never clear a newly-extracted job
        // that hasn't landed in history state yet.
        replace('history');
      }
    }
  }, [historyLoaded, history, activeView, subPath, replace]);

  // Listen to state-based pending navigation (handles timing/mount delays)
  useEffect(() => {
    if (pendingNavigation) {
      const targetId = pendingNavigation.recipeId;

      // 1. Check if the target is the currently active/extracted recipe
      if (recipe && (recipe.id === targetId || recipe.title === targetId)) {
        navigate('extract');
        return;
      }

      // 2. Check if the recipe exists in history
      const matchedJob = history.find(j => j.id === targetId || (j.recipe && j.recipe.title === targetId));
      if (matchedJob) {
        navigate('history', matchedJob.id);
      }
    }
  }, [pendingNavigation, recipe, history, navigate]);

  // Listen for timer click navigation events to route to the correct tab and set selected recipe
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ recipeId: string; stepNum: number }>;
      if (customEvent.detail && customEvent.detail.recipeId) {
        const targetId = customEvent.detail.recipeId;

        // 1. Check if the target is the currently active/extracted recipe
        if (recipe && (recipe.id === targetId || recipe.title === targetId)) {
          navigate('extract');
          return;
        }

        // 2. Check if the recipe exists in history
        const matchedJob = history.find(j => j.id === targetId || (j.recipe && j.recipe.title === targetId));
        if (matchedJob) {
          navigate('history', matchedJob.id);
        }
      }
    };
    window.addEventListener('app:navigate-to-timer-step', handleNavigate);
    return () => window.removeEventListener('app:navigate-to-timer-step', handleNavigate);
  }, [recipe, history, navigate]);

  // Listen for service worker messages (notification clicks on Android PWA)
  useEffect(() => {
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { recipeId, stepNum } = event.data;
        if (recipeId) {
          window.dispatchEvent(
            new CustomEvent('app:navigate-to-timer-step', {
              detail: { recipeId, stepNum },
            })
          );
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
  }, []);

  // Listen for taps on native local notifications (Capacitor Android/iOS)
  useEffect(() => {
    return registerNotificationTap((recipeId, stepNum) => {
      if (recipeId) {
        window.dispatchEvent(
          new CustomEvent('app:navigate-to-timer-step', {
            detail: { recipeId, stepNum },
          })
        );
      }
    });
  }, []);

  // Allow Settings to re-open the onboarding guide via a decoupled event,
  // avoiding threading the hook's state through props into SettingsView.
  useEffect(() => {
    const handler = () => replayOnboarding();
    window.addEventListener('app:replay-onboarding', handler);
    return () => window.removeEventListener('app:replay-onboarding', handler);
  }, [replayOnboarding]);

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
      const response = await fetch(apiUrl(`/api/jobs/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchHistory();
        if (selectedJob?.id === id) {
          navigate('history');
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
    if (authLoading || !user) return;
    if (isWebShareProcessed) return;
    isWebShareProcessed = true;

    const params = new URLSearchParams(window.location.search);
    const text = params.get('text');
    const urlParam = params.get('url');
    const title = params.get('title');

    if (text || urlParam || title) {
      const combinedSearch = [text, urlParam, title].filter(Boolean).join(' ');
      const extractedUrl = parseSharedUrl(combinedSearch);
      if (extractedUrl) {
        // Clear query parameters, strip /share pathname, and switch to extract view
        replace('extract');
        setUrl(extractedUrl);
        triggerExtraction(extractedUrl);
      } else {
        // Clear query parameters anyway so they don't linger in the browser address bar
        replace(activeView);
      }
    }
  }, [authLoading, user, replace, setUrl, triggerExtraction, activeView]);

  // Native (Capacitor) share intent: route a shared Instagram link into the
  // same extraction flow as the Web Share Target above.
  useEffect(() => {
    if (authLoading || !user) return;
    return registerShareIntent((sharedUrl) => {
      replace('extract');
      setUrl(sharedUrl);
      triggerExtraction(sharedUrl);
    });
  }, [authLoading, user, replace, setUrl, triggerExtraction]);

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
        return { text: t('job.status.failed.text'), sub: resolveJobError(jobError, language) || t('job.status.failed.sub') };
      default:
        return null;
    }
  };

  const statusDetails = getStatusDetails();

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (authLoading || !initialSyncDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center transition-colors duration-300">
      {/* Sticky top region: header + banners share one sticky container so the
          status-bar safe-area inset is applied once and they stack without a gap
          or overlapping each other when pinned. */}
      <div className="sticky top-0 z-40 w-full">
        {/* Status bar background filler for devices with safe-area-inset-top (e.g. Android 15 Edge-to-Edge) */}
        <div className="w-full h-[env(safe-area-inset-top)] bg-[#064e3b]" />

        <header className="w-full bg-gray-50/85 dark:bg-gray-950/85 backdrop-blur-md transition-colors duration-300">
          <div className="relative w-full max-w-md mx-auto px-4 py-3 flex justify-center items-center">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <img src="/icon-512.png" alt="App Logo" className="w-7 h-7 object-contain rounded-lg" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white m-0 leading-none">{t('app.title')}</h1>
              </div>
            </div>
          </div>
        </header>

        {/* App Install Banner */}
        <InstallBanner isInstallable={isInstallable} handleInstallClick={handleInstallClick} />

        {/* Active Cooking Timers Banner */}
        <TimerBanner />
      </div>

      {/* Main content body */}
      <main className={`w-full max-w-md mx-auto px-4 mt-1 flex-1 flex flex-col gap-6 ${
        selectedJob || (activeView === 'extract' && recipe) || activeView === 'shopping-list' || (activeView === 'history' && isCatalogSelectMode)
          ? 'pb-48'
          : 'pb-24'
      }`}>

        {/* CONDITIONAL RENDERING OF VIEWS */}
        {activeView === 'extract' ? (
          recipe ? (
            /* Recipe Detail View — hides extract inputs once extraction is done */
            <RecipeDetails
              key={recipe.id || recipe.title}
              recipe={recipe}
              onAddIngredients={addRecipeIngredients}
              reelUrl={url}
              onBack={() => {
                setRecipe(null);
                setUrl('');
                navigate('extract');
              }}
              onNavigateToShoppingList={() => navigate('shopping-list')}
              shoppingListCount={aggregatedList.unchecked.length}
              onRemixSuccess={(newRecipe) => setRecipe(newRecipe)}
              onReplaceCurrent={(newRecipe) => {
                setRecipe(newRecipe);
                fetchHistory();
              }}
              isParentAvailable={recipe?.parentJobId ? history.some(j => j.id === recipe?.parentJobId) : false}
              parentRecipeTitle={recipe?.parentRecipeTitle || (recipe?.parentJobId ? history.find(j => j.id === recipe.parentJobId)?.recipe?.title : null)}
              onNavigateToRecipe={(recipeId) => {
                const parentJob = history.find(j => j.id === recipeId);
                if (parentJob) {
                  navigate('history', parentJob.id);
                  setRecipe(null);
                  setUrl('');
                }
              }}
            />
          ) : (
            <>
              {/* Extraction Form */}
              <ExtractForm
                url={url}
                setUrl={setUrl}
                urlError={urlError}
                setUrlError={setUrlError}
                validateUrl={validateUrl}
                isPending={isPending}
                handleFormSubmit={handleFormSubmit}
                limitStatus={limitStatus}
              />

              {/* Processing State Tracker */}
              <ProgressTracker isPending={isPending} jobStatus={jobStatus} statusDetails={statusDetails} progress={progress} />

              {/* Error State Banner */}
              <ErrorBanner
                isPending={isPending}
                jobStatus={jobStatus}
                jobError={jobError}
                triggerExtraction={triggerExtraction}
                url={url}
              />
            </>
          )
        ) : activeView === 'history' ? (
          /* SAVED RECIPES TAB */
          <SavedCatalog
            history={history}
            historyLoaded={historyLoaded}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            handleDeleteJob={handleDeleteJob}
            onAddIngredients={addRecipeIngredients}
            fetchHistory={fetchHistory}
            getAccessToken={getAccessToken}
            onNavigateToShoppingList={() => {
              navigate('shopping-list');
            }}
            shoppingListCount={aggregatedList.unchecked.length}
            onRemixSuccess={async (newRecipe, newJobId) => {
              await fetchHistory();
              if (newJobId) {
                navigate('history', newJobId);
              } else {
                // To immediately show the new recipe, we can switch to extraction view
                setRecipe(newRecipe);
                setUrl('');
                navigate('extract');
              }
            }}
            onReplaceCurrent={() => {
              fetchHistory();
            }}
            onSelectModeChange={setIsCatalogSelectMode}
          />
        ) : activeView === 'shopping-list' ? (
          /* SHOPPING LIST TAB */
          <ShoppingList
            aggregatedList={aggregatedList}
            addCustomItem={addCustomItem}
            toggleItemGroup={toggleItemGroup}
            deleteItemGroup={deleteItemGroup}
            clearAll={clearAll}
            clearChecked={clearChecked}
          />
        ) : (
          /* SETTINGS TAB */
          <SettingsView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {(() => {
        const isBottomBarHidden = activeView === 'history' && isCatalogSelectMode;
        const bottomBarClasses = `fixed bottom-0 inset-x-0 z-40 transition-all duration-300 ease-in-out pb-safe ${isBottomBarHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`;

        return (
          <div className={bottomBarClasses}>
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-black/10 dark:border-white/10 w-full max-w-md mx-auto flex justify-around items-center pt-3 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] px-3">
              {/* Extract / New Recipe Tab */}
              <button
                onClick={() => navigate('extract')}
                className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${activeView === 'extract'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Sparkles className="w-5.5 h-5.5 mb-1" />
                <span className="text-[11px] tracking-wide font-medium">{t('app.nav.newRecipe')}</span>
                {activeView === 'extract' && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </button>

              {/* Recipes / History Tab */}
              <button
                onClick={() => {
                  navigate('history');
                  fetchHistory();
                }}
                className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${activeView === 'history'
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
                onClick={() => navigate('shopping-list')}
                className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${activeView === 'shopping-list'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-5.5 h-5.5 mb-1" />
                  {aggregatedList.unchecked.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse-slow">
                      {aggregatedList.unchecked.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-wide font-medium">{t('app.nav.shoppingList')}</span>
                {activeView === 'shopping-list' && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </button>

              {/* Settings Tab */}
              <button
                onClick={() => navigate('settings')}
                className={`flex-1 flex flex-col items-center justify-center pt-2 pb-2.5 relative transition-colors ${activeView === 'settings'
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
        );
      })()}

      {/* First-launch onboarding overlay (rendered via portal) */}
      {showOnboarding && (
        <WelcomeGuide
          onClose={() => {
            completeOnboarding();
            navigate('extract');
          }}
        />
      )}
    </div>
  );
}
