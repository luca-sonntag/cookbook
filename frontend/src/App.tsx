import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Key, ChefHat } from 'lucide-react';

import type { Recipe, Job, BeforeInstallPromptEvent } from './types';
import ThemeToggle from './components/ThemeToggle';
import ApiConfig from './components/ApiConfig';
import InstallBanner from './components/InstallBanner';
import ExtractForm from './components/ExtractForm';
import ProgressTracker from './components/ProgressTracker';
import ErrorBanner from './components/ErrorBanner';
import RecipeDetails from './components/RecipeDetails';
import SavedCatalog from './components/SavedCatalog';

export default function App() {
  // Config & Secrets
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('recipe_api_key') || 'recipe_extractor_secret_key_12345';
  });
  const [showApiConfig, setShowApiConfig] = useState(false);

  // Form URL
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Job orchestration states
  const [isPending, setIsPending] = useState(false);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // PWA states
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<'installed' | 'standalone' | 'browser'>('browser');

  // History & Multi-view states
  const [history, setHistory] = useState<Job[]>([]);
  const [activeView, setActiveView] = useState<'extract' | 'history'>('extract');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Theme state & Syncing effect
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  // Fetch history on load and when API key changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const handleDeleteJob = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this recipe from your saved recipes?')) {
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
        alert('Failed to delete recipe.');
      }
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Connection error occurred.');
    }
  };

  // Check display mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && 
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (isStandalone || isIOSStandalone) {
      setTimeout(() => {
        setInstallStatus('standalone');
      }, 0);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);



  const saveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('recipe_api_key', newKey);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallStatus('installed');
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  const validateUrl = (testUrl: string): boolean => {
    if (!testUrl.trim()) {
      setUrlError('Instagram Reel URL is required.');
      return false;
    }
    const regex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/[A-Za-z0-9_-]+\/?/i;
    if (!regex.test(testUrl.trim())) {
      setUrlError('Must be a valid Instagram Reel URL (e.g., https://www.instagram.com/reel/...).');
      return false;
    }
    setUrlError('');
    return true;
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(data.error || 'Failed to check status from server.');
          setIsPending(false);
          return;
        }

        const job = data.job;
        setJobStatus(job.status);

        if (job.status === 'completed') {
          clearInterval(interval);
          setRecipe(job.recipe);
          setIsPending(false);
          fetchHistory();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || 'The recipe extraction failed.');
          setIsPending(false);
        }
      } catch {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError('Lost connection to backend server.');
        setIsPending(false);
      }
    }, 2000);
  };

  const triggerExtraction = async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!validateUrl(cleanUrl)) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);
    setRecipe(null);

    try {
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();
      
      if (response.status === 401) {
        throw new Error('Unauthorized. Please verify your API Key in Settings.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit extraction job.');
      }

      setJobStatus(data.status);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during submission.';
      setJobError(errorMessage);
      setIsPending(false);
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
        return { text: 'Enqueuing extraction job...', sub: 'Adding to backend processing queue.' };
      case 'scraping':
        return { text: 'Downloading Reels metadata & audio...', sub: 'Fetching video media stream via Apify Scraper.' };
      case 'processing':
        return { text: 'AI Analyzing Reel & Audio track...', sub: 'Google Gemini 1.5 is translating multimodal content into recipe structure.' };
      case 'completed':
        return { text: 'Recipe generated successfully!', sub: 'Enjoy your cooking session.' };
      case 'failed':
        return { text: 'Failed to extract recipe.', sub: jobError || 'Unknown processing error.' };
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
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white m-0 leading-none">Recipe Extractor</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">Instagram Reel AI Parser ({installStatus})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* PWA Promotion Banner */}
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
            Extract New
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
            Saved Recipes ({history.filter(h => h.status === 'completed').length})
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
            {recipe && <RecipeDetails key={recipe.title} recipe={recipe} />}
          </>
        ) : (
          /* SAVED RECIPES TAB */
          <SavedCatalog 
            history={history} 
            selectedJob={selectedJob} 
            setSelectedJob={setSelectedJob} 
            handleDeleteJob={handleDeleteJob} 
          />
        )}
      </main>
    </div>
  );
}
