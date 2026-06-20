import React from 'react';
import { Card, Button } from '@heroui/react';
import { Globe, Utensils, Clock, Trash2 } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-4">
      {selectedJob ? (
        /* DETAIL VIEW FOR SAVED RECIPE */
        <div className="flex flex-col gap-4">
          <Button 
            variant="tertiary" 
            className="self-start flex items-center gap-1.5 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 py-1.5 px-3 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl active:scale-95 transition-all"
            onPress={() => setSelectedJob(null)}
          >
            ← Back to Saved Recipes
          </Button>
          
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3 px-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Saved on {new Date(selectedJob.createdAt).toLocaleDateString()}
            </span>
            <a 
              href={selectedJob.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-xs flex items-center gap-1 font-medium"
            >
              <Globe className="w-3.5 h-3.5" /> View original Reel
            </a>
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
                    className="glass-panel p-5 rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all flex flex-col justify-between"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-1">
                          {r.title}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteJob(e, job.id)}
                          className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          aria-label="Delete recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400">
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
