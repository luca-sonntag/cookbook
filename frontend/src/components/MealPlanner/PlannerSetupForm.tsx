import { useMemo, useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import type { Job } from '../../types';
import { useI18n } from '../../context/I18nContext';
import RecipeServingsStepper from '../RecipeDetails/RecipeServingsStepper';
import CachedImage from '../CachedImage';

export interface PlannerSetupValues {
  goal?: string;
  servings: number;
  numDishes: number;
  includeJobIds: string[];
}

interface PlannerSetupFormProps {
  /** Completed recipes the user can force-include. */
  recipes: Job[];
  isGenerating: boolean;
  error?: string | null;
  onGenerate: (values: PlannerSetupValues) => void;
}

/** Canonical goal tokens sent to the backend (Gemini reads them directly). */
const GOAL_OPTIONS: { key: string; goal?: string; labelKey: string }[] = [
  { key: 'none', goal: undefined, labelKey: 'planner.goalNone' },
  { key: 'balanced', goal: 'balanced / ausgewogen', labelKey: 'planner.goalBalanced' },
  { key: 'vegetarian', goal: 'vegetarian / vegetarisch', labelKey: 'planner.goalVegetarian' },
  { key: 'vegan', goal: 'vegan', labelKey: 'planner.goalVegan' },
  { key: 'highProtein', goal: 'high protein', labelKey: 'planner.goalHighProtein' },
  { key: 'lowCarb', goal: 'low carb', labelKey: 'planner.goalLowCarb' },
  { key: 'quick', goal: 'quick / schnell (short prep + cook time)', labelKey: 'planner.goalQuick' },
];

const MAX_DISHES = 21;

export default function PlannerSetupForm({ recipes, isGenerating, error, onGenerate }: PlannerSetupFormProps) {
  const { t } = useI18n();
  const [goalKey, setGoalKey] = useState<string>('balanced');
  const [customGoal, setCustomGoal] = useState('');
  const [servings, setServings] = useState(2);
  const [numDishes, setNumDishes] = useState(5);
  const [includeIds, setIncludeIds] = useState<Set<string>>(new Set());

  const recipeCount = recipes.length;

  const resolvedGoal = useMemo(() => {
    const custom = customGoal.trim();
    if (custom) return custom;
    return GOAL_OPTIONS.find(o => o.key === goalKey)?.goal;
  }, [goalKey, customGoal]);

  const toggleInclude = (id: string) => {
    setIncludeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dishClamped = Math.min(numDishes, Math.max(1, MAX_DISHES));

  const handleGenerate = () => {
    onGenerate({
      goal: resolvedGoal,
      servings,
      numDishes: dishClamped,
      includeJobIds: [...includeIds],
    });
  };

  const sectionCard = 'flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]';
  const sectionLabel = 'text-sm font-bold text-gray-900 dark:text-white';

  return (
    <div className="flex flex-col gap-4">
      {/* Goal */}
      <div className={sectionCard}>
        <div className="flex items-center gap-2">
          <span className={sectionLabel}>{t('planner.goalLabel')}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{t('planner.goalOptional')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map(opt => {
            const active = goalKey === opt.key && !customGoal.trim();
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => { setGoalKey(opt.key); setCustomGoal(''); }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border-none transition-all active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:bg-emerald-500/10'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={customGoal}
          onChange={(e) => setCustomGoal(e.target.value)}
          placeholder={t('planner.goalPlaceholder')}
          maxLength={120}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border-none outline-none focus:ring-2 focus:ring-emerald-500/40 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Servings + dishes */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <span className={sectionLabel}>{t('planner.servingsLabel')}</span>
          <RecipeServingsStepper
            servings={servings}
            onDecreaseServings={() => setServings(s => Math.max(1, s - 1))}
            onIncreaseServings={() => setServings(s => Math.min(20, s + 1))}
          />
        </div>
        <div className="h-px bg-black/[0.05] dark:bg-white/[0.06]" />
        <div className="flex items-center justify-between gap-3">
          <span className={sectionLabel}>{t('planner.dishesLabel')}</span>
          <RecipeServingsStepper
            servings={dishClamped}
            onDecreaseServings={() => setNumDishes(n => Math.max(1, n - 1))}
            onIncreaseServings={() => setNumDishes(n => Math.min(MAX_DISHES, n + 1))}
          />
        </div>
      </div>

      {/* Must-include recipes */}
      {recipeCount > 0 && (
        <div className={sectionCard}>
          <div className="flex items-center justify-between gap-2">
            <span className={sectionLabel}>{t('planner.includeLabel')}</span>
            {includeIds.size > 0 && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {t('planner.includeSelected', { count: includeIds.size })}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{t('planner.includeHint')}</p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
            {recipes.map(job => {
              const selected = includeIds.has(job.id);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => toggleInclude(job.id)}
                  className="w-24 shrink-0 flex flex-col gap-1 text-left active:scale-[0.97] transition-transform cursor-pointer"
                >
                  <span className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${selected ? 'border-emerald-500' : 'border-transparent'}`}>
                    <CachedImage
                      src={job.recipe?.imageUrl || job.recipe?.imageUrls?.[0]}
                      emoji={job.recipe?.emoji}
                      alt={job.recipe?.title || ''}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug px-0.5">
                    {job.recipe?.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400 px-1">{error}</p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center justify-center gap-2 w-full h-13 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-md hover:bg-emerald-500 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isGenerating ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            {t('planner.generating')}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {t('planner.generate')}
          </>
        )}
      </button>
    </div>
  );
}
