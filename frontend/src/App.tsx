import React, { useState, useEffect } from 'react';
import { Button, Card, TextField, Label, Input, Spinner, Tabs, FieldError } from '@heroui/react';
import { 
  Key, 
  Clock, 
  Utensils, 
  ListChecks, 
  ChevronRight, 
  Copy, 
  Check, 
  AlertCircle,
  Share2,
  BookOpen,
  ChefHat,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

interface InstructionStep {
  step: number;
  description: string;
}

interface AlternativeIngredient {
  original: string;
  substitute: string;
  notes?: string;
}

interface NutritionalEstimates {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  equipment: string[];
  nutritionalEstimates?: NutritionalEstimates;
  tips?: string[];
  alternativeIngredients?: AlternativeIngredient[];
  transcript?: string | null;
}

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
  const [jobStatus, setJobStatus] = useState<'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // PWA states
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installStatus, setInstallStatus] = useState<'installed' | 'standalone' | 'browser'>('browser');

  // Interactive Checklist lists
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Copy state
  const [isCopied, setIsCopied] = useState(false);

  // Check display mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setInstallStatus('standalone');
    } else if ((window.navigator as any).standalone) {
      setInstallStatus('standalone');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
        setUrl(extractedUrl);
        // Clear query parameters so a refresh does not run extraction again
        window.history.replaceState({}, document.title, '/');
        // Auto trigger extraction
        triggerExtraction(extractedUrl);
      }
    }
  }, []);

  // Persist API Key changes
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

  // Validate Instagram Reel URL
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

  // Start polling
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
          // Initialize checklist states
          setCheckedIngredients({});
          setCheckedSteps({});
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || 'The recipe extraction failed.');
          setIsPending(false);
        }
      } catch (err: any) {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError('Lost connection to backend server.');
        setIsPending(false);
      }
    }, 2000);
  };

  // Trigger Backend Job
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
    } catch (err: any) {
      setJobStatus('failed');
      setJobError(err.message || 'An error occurred during submission.');
      setIsPending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerExtraction(url);
  };

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const toggleStep = (stepNum: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const copyRecipeMarkdown = () => {
    if (!recipe) return;

    let md = `# ${recipe.title}\n\n${recipe.description}\n\n`;
    md += `**Prep Time:** ${recipe.prepTime} | **Cook Time:** ${recipe.cookTime} | **Servings:** ${recipe.servings}\n\n`;
    
    md += `## Ingredients\n`;
    recipe.ingredients.forEach(ing => {
      const amountStr = ing.amount ? `${ing.amount} ` : '';
      const unitStr = ing.unit ? `${ing.unit} ` : '';
      const noteStr = ing.notes ? ` (${ing.notes})` : '';
      md += `- ${amountStr}${unitStr}${ing.name}${noteStr}\n`;
    });
    md += `\n`;

    md += `## Instructions\n`;
    recipe.instructions.forEach(step => {
      md += `${step.step}. ${step.description}\n`;
    });
    md += `\n`;

    if (recipe.equipment && recipe.equipment.length > 0) {
      md += `## Equipment\n`;
      recipe.equipment.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (recipe.tips && recipe.tips.length > 0) {
      md += `## Chef Tips\n`;
      recipe.tips.forEach(tip => {
        md += `- ${tip}\n`;
      });
      md += `\n`;
    }

    navigator.clipboard.writeText(md).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Get status message styling
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
    <div className="min-h-screen pb-16 flex flex-col items-center">
      {/* Header Container */}
      <header className="w-full max-w-2xl px-4 mt-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">Recipe Extractor</h1>
            <span className="text-xs text-gray-400">Instagram Reel AI Parser ({installStatus})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant="tertiary"
            className="text-gray-400 hover:text-white"
            onPress={() => setShowApiConfig(!showApiConfig)}
            aria-label="Settings"
          >
            <Key className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* PWA Promotion Banner */}
      {isInstallable && (
        <div className="w-full max-w-2xl px-4 mt-6">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-950/20">
            <div className="flex gap-3 items-center">
              <Share2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Install as App (PWA)</p>
                <p className="text-xs text-gray-300">Share Reels directly to this app to extract recipes fast!</p>
              </div>
            </div>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-lg" onPress={handleInstallClick}>
              Install
            </Button>
          </div>
        </div>
      )}

      {/* Main content body */}
      <main className="w-full max-w-2xl px-4 mt-6 flex-1 flex flex-col gap-6">
        
        {/* API config drawer */}
        {showApiConfig && (
          <Card className="glass-panel p-5 rounded-2xl">
            <Card.Header className="p-0 pb-3 flex justify-between items-center border-b border-white/5">
              <Card.Title className="text-sm font-semibold text-white">Backend Access Settings</Card.Title>
            </Card.Header>
            <Card.Content className="p-0 pt-4 flex flex-col gap-4">
              <p className="text-xs text-gray-400">
                Configure your secret API Key to communicate with the server backend extractor endpoints.
              </p>
              <TextField fullWidth name="apiKey" value={apiKey} onChange={saveApiKey}>
                <Label className="text-xs text-gray-400">API Key</Label>
                <Input 
                  type="password"
                  placeholder="Enter secret API Key" 
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" 
                />
              </TextField>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" className="text-xs" onPress={() => setShowApiConfig(false)}>
                  Close
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Extraction Form */}
        <Card className="glass-panel p-6 rounded-2xl">
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <TextField 
              fullWidth 
              name="url" 
              value={url} 
              onChange={(val) => {
                setUrl(val);
                if (urlError) validateUrl(val);
              }}
              isInvalid={!!urlError}
            >
              <Label className="text-sm font-medium text-gray-300">Instagram Reel URL</Label>
              <div className="relative mt-2">
                <Input 
                  placeholder="https://www.instagram.com/reel/C8C_jApt_2j/" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  disabled={isPending}
                />
                {url && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setUrl('')}
                    disabled={isPending}
                  >
                    ×
                  </button>
                )}
              </div>
              {urlError && <FieldError className="text-xs text-red-400 mt-1">{urlError}</FieldError>}
            </TextField>

            <Button
              type="submit"
              fullWidth
              isPending={isPending}
              className={`py-3 rounded-xl font-semibold shadow-lg text-white ${
                isPending 
                  ? 'bg-emerald-800' 
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all'
              }`}
            >
              {({ isPending }) => (
                <span className="flex items-center gap-2 justify-center">
                  {isPending ? (
                    <>
                      <Spinner color="current" size="sm" />
                      <span>Processing Reel...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Extract Recipe</span>
                    </>
                  )}
                </span>
              )}
            </Button>
          </form>
        </Card>

        {/* Processing State Tracker */}
        {isPending && statusDetails && (
          <Card className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/5">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 animate-pulse-slow">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{statusDetails.text}</h3>
                  <span className="text-xs text-emerald-400 font-mono capitalize">{jobStatus}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{statusDetails.sub}</p>

                {/* Progress bar steps */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className={`h-1.5 rounded-full ${['pending', 'scraping', 'processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                  <div className={`h-1.5 rounded-full ${['scraping', 'processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-white/10'} ${jobStatus === 'scraping' ? 'animate-pulse-slow' : ''}`}></div>
                  <div className={`h-1.5 rounded-full ${['processing', 'completed'].includes(jobStatus || '') ? 'bg-emerald-500' : 'bg-white/10'} ${jobStatus === 'processing' ? 'animate-pulse-slow' : ''}`}></div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error State Banner */}
        {!isPending && jobStatus === 'failed' && (
          <Card className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-950/10">
            <div className="flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">Extraction Failed</h3>
                <p className="text-xs text-red-300 mt-1">{jobError || 'An unknown error occurred while analyzing the Reel.'}</p>
                <Button 
                  size="sm" 
                  variant="tertiary" 
                  className="mt-3 text-xs text-white border border-white/10 hover:bg-white/5" 
                  onPress={() => triggerExtraction(url)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recipe Display Card */}
        {recipe && (
          <article className="flex flex-col gap-6">
            <Card className="glass-panel p-6 rounded-2xl">
              
              {/* Recipe title header */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{recipe.title}</h2>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{recipe.description}</p>
                </div>
                <Button
                  isIconOnly
                  variant="outline"
                  className="text-gray-400 hover:text-white border-white/10 hover:bg-white/5"
                  onPress={copyRecipeMarkdown}
                  aria-label="Copy recipe"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Cooking stats summary */}
              <div className="grid grid-cols-3 gap-2 py-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Prep</span>
                  <span className="text-xs font-bold text-white mt-0.5">{recipe.prepTime || 'N/A'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Utensils className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cook</span>
                  <span className="text-xs font-bold text-white mt-0.5">{recipe.cookTime || 'N/A'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <ListChecks className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Serves</span>
                  <span className="text-xs font-bold text-white mt-0.5">{recipe.servings || 'N/A'}</span>
                </div>
              </div>

              {/* Nutrition estimate */}
              {recipe.nutritionalEstimates && (
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Nutritional Estimates</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="text-white font-bold">{recipe.nutritionalEstimates.calories}</div>
                      <div className="text-[9px] text-gray-400">kcal</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{recipe.nutritionalEstimates.protein}</div>
                      <div className="text-[9px] text-gray-400">Protein</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{recipe.nutritionalEstimates.carbs}</div>
                      <div className="text-[9px] text-gray-400">Carbs</div>
                    </div>
                    <div>
                      <div className="text-white font-bold">{recipe.nutritionalEstimates.fat}</div>
                      <div className="text-[9px] text-gray-400">Fat</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Tabbed view for recipe items */}
            <Tabs defaultSelectedKey="ingredients" className="w-full">
              <Tabs.ListContainer className="w-full">
                <Tabs.List className="flex border-b border-white/10 w-full mb-4">
                  <Tabs.Tab id="ingredients" className="flex-1 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-500 data-[selected=true]:text-white text-gray-400 hover:text-white transition-all cursor-pointer">
                    Ingredients
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="steps" className="flex-1 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-500 data-[selected=true]:text-white text-gray-400 hover:text-white transition-all cursor-pointer">
                    Instructions
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="details" className="flex-1 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-500 data-[selected=true]:text-white text-gray-400 hover:text-white transition-all cursor-pointer">
                    Equipment & Tips
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              {/* Ingredients tab */}
              <Tabs.Panel id="ingredients" className="flex flex-col gap-4">
                <Card className="glass-panel p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center justify-between">
                    <span>Ingredients Checklist</span>
                    <span className="text-xs text-gray-400 normal-case font-normal">Check ingredients you have prepared</span>
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {recipe.ingredients.map((ing, idx) => {
                      const amountStr = ing.amount ? `${ing.amount} ` : '';
                      const unitStr = ing.unit ? `${ing.unit} ` : '';
                      const name = ing.name;
                      const uniqueId = `${name}-${idx}`;
                      const isChecked = !!checkedIngredients[uniqueId];

                      return (
                        <li 
                          key={uniqueId}
                          onClick={() => toggleIngredient(uniqueId)}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm select-none transition-all ${
                            isChecked ? 'text-gray-500 line-through' : 'text-gray-200'
                          }`}>
                            <span className="font-semibold text-emerald-400">{amountStr}{unitStr}</span>
                            <span>{name}</span>
                            {ing.notes && <span className="text-xs text-gray-400 block mt-0.5">{ing.notes}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </Tabs.Panel>

              {/* Instructions tab */}
              <Tabs.Panel id="steps" className="flex flex-col gap-4">
                <Card className="glass-panel p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Step-by-Step Instructions</h3>
                  <div className="flex flex-col gap-4">
                    {recipe.instructions.map((step) => {
                      const isChecked = !!checkedSteps[step.step];

                      return (
                        <div 
                          key={step.step}
                          onClick={() => toggleStep(step.step)}
                          className="flex items-start gap-4 p-3.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                          }`}>
                            {isChecked ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <span className="text-[10px] text-gray-400">{step.step}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm leading-relaxed block select-none transition-all ${
                              isChecked ? 'text-gray-500 line-through' : 'text-gray-200'
                            }`}>
                              {step.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Tabs.Panel>

              {/* Equipment & Tips tab */}
              <Tabs.Panel id="details" className="flex flex-col gap-4">
                {recipe.equipment && recipe.equipment.length > 0 && (
                  <Card className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Required Equipment</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {recipe.equipment.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 py-1.5 px-2.5 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {recipe.tips && recipe.tips.length > 0 && (
                  <Card className="glass-panel p-5 rounded-2xl border border-emerald-500/10">
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4" />
                      <span>Chef Cooking Tips</span>
                    </h3>
                    <ul className="flex flex-col gap-3 text-xs text-gray-300">
                      {recipe.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-normal">
                          <span className="bg-emerald-500/10 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-emerald-500/20">{idx+1}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {recipe.alternativeIngredients && recipe.alternativeIngredients.length > 0 && (
                  <Card className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Alternative Ingredients</h3>
                    <div className="flex flex-col gap-3">
                      {recipe.alternativeIngredients.map((alt, idx) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-red-400 line-through">{alt.original}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-emerald-400">{alt.substitute}</span>
                          </div>
                          {alt.notes && <p className="text-gray-400 mt-1.5 leading-normal">{alt.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {recipe.transcript && (
                  <Card className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Raw Audio Transcript</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-h-48 overflow-y-auto pr-2 bg-black/20 p-3 rounded-xl font-mono">
                      {recipe.transcript}
                    </p>
                  </Card>
                )}
              </Tabs.Panel>
            </Tabs>
          </article>
        )}
      </main>
    </div>
  );
}
