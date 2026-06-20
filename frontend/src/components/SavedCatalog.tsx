import React, { useEffect, useRef } from 'react';
import { Card, Button } from '@heroui/react';
import { Globe, Utensils, Clock, Trash2, ArrowLeft } from 'lucide-react';
import type { Job } from '../types';
import RecipeDetails from './RecipeDetails';

interface SavedCatalogProps {
  history: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  handleDeleteJob: (e: React.MouseEvent, id: string) => void;
}

export default function SavedCatalog({
  history,
  selectedJob,
  setSelectedJob,
  handleDeleteJob
}: SavedCatalogProps) {
  const completedJobs = history.filter(h => h.status === 'completed' && h.recipe);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* ── History API: push a state when entering detail so Android system
     back button / gesture triggers popstate → go back ── */
  useEffect(() => {
    if (selectedJob) {
      history.length; // satisfy linter — history prop is separate from window.history
      window.history.pushState({ recipeDetail: true }, '');
    }
  }, [selectedJob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      // If user pressed system back while in detail view, return to list
      if (selectedJob) {
        e.preventDefault?.();
        setSelectedJob(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [selectedJob, setSelectedJob]);

  /* ── Touch swipe: right-swipe from left edge → go back ── */
  useEffect(() => {
    if (!selectedJob) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      // Swipe starts within 40px of left edge, travels ≥80px right, mostly horizontal
      if (touchStartX.current <= 40 && dx >= 80 && dy < 60) {
        setSelectedJob(null);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [selectedJob, setSelectedJob]);



  return (
    <div className="flex flex-col gap-4">
      {selectedJob ? (
        /* DETAIL VIEW FOR SAVED RECIPE */
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {/* Icon-only back button in its own container */}
            <Button
              variant="tertiary"
              className="flex-shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 w-9 h-9 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all text-base leading-none"
              onPress={() => setSelectedJob(null)}
              aria-label="Back to Saved Recipes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            {/* Saved on / View original Reel bar */}
            <div className="flex-1 flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-2.5 px-4 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                Saved on {new Date(selectedJob.createdAt).toLocaleDateString()}
              </span>
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-xs flex items-center gap-1 font-medium ml-3"
              >
                <Globe className="w-3.5 h-3.5" /> View original Reel
              </a>
            </div>
          </div>

          {selectedJob.recipe && <RecipeDetails key={selectedJob.id} recipe={selectedJob.recipe} />}
        </div>
      ) : (
        /* LIST VIEW OF SAVED RECIPES */
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">
            Saved Recipes Catalog
          </h3>
          
          {completedJobs.length === 0 ? (
            <Card className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
              <Utensils className="w-8 h-8 text-gray-500 mb-3 animate-pulse-slow" />
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white">No Saved Recipes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-normal">
                Extract recipes from Instagram Reels in the "Extract New" tab to save them here!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedJobs.map(job => {
                const r = job.recipe!;
                return (
                  <Card 
                    key={job.id} 
                    className="glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all flex flex-col justify-between overflow-hidden"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div>
                      {r.imageUrl && (
                        <div className="h-32 w-full mb-3 bg-black/5 dark:bg-white/5">
                          <img 
                            src={r.imageUrl.startsWith('/') ? r.imageUrl : `/api/image?url=${encodeURIComponent(r.imageUrl)}`}
                            alt={r.title} 
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-2 px-5 pt-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-1">
                          {r.title}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteJob(e, job.id)}
                          className="flex-shrink-0 text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer -mt-1 -mr-2"
                          aria-label="Delete recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed px-5">
                        {r.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 pb-5 px-5 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-emerald-500" /> {r.prepTime || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Utensils className="w-3 h-3 text-emerald-500" /> {r.cookTime || 'N/A'}
                        </span>
                      </div>
                      <span className="font-mono text-gray-500 dark:text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
