import { useMemo, useEffect } from 'react';
import { Button } from '@heroui/react';
import {
  ChefHat,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';
import type { Recipe, Ingredient } from '../types';
import { useCookingMode } from '../hooks/useCookingMode';
import RecipeInstructionText from './RecipeInstructionText';
import { useI18n } from '../context/I18nContext';
import { useDialog } from '../context/DialogContext';
import { useTimerManager } from '../hooks/useTimerManager';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  checkedSteps: Record<number, boolean>;
  toggleStep: (stepNum: number) => void;
  formatAmount: (amount: number, unit?: string) => string;
  initialStepOverride?: number;
}

export default function CookingMode({
  recipe,
  onClose,
  checkedSteps,
  toggleStep,
  formatAmount,
  initialStepOverride,
}: CookingModeProps) {
  const dialog = useDialog();
  const { t } = useI18n();
  const { timers, removeTimer, dismissFinished, setPendingNavigation } = useTimerManager();

  // Find the first uncompleted step as initial step index
  const initialStepIndex = useMemo(() => {
    if (initialStepOverride !== undefined) {
      return initialStepOverride;
    }
    if (recipe.instructions) {
      const firstUncompleted = recipe.instructions.findIndex(s => !checkedSteps[s.step]);
      return firstUncompleted !== -1 ? firstUncompleted : 0;
    }
    return 0;
  }, [recipe.instructions, checkedSteps, initialStepOverride]);

  const {
    cookingStepIndex,
    setCookingStepIndex,
    handleNextCookingStep,
    handlePrevCookingStep,
    handleTouchStart,
    handleTouchEnd
  } = useCookingMode({
    instructionsCount: recipe.instructions?.length || 0,
    initialStepIndex,
    onClose
  });

  // Listen to navigation events (e.g. clicking on a timer card) to jump to the step if Cooking Mode is open
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ recipeId: string; stepNum: number }>;
      if (
        customEvent.detail &&
        customEvent.detail.stepNum !== undefined &&
        (customEvent.detail.recipeId === recipe.id || customEvent.detail.recipeId === recipe.title)
      ) {
        // Jump to 0-based instruction index
        setCookingStepIndex(customEvent.detail.stepNum - 1);
      }
    };
    window.addEventListener('app:navigate-to-timer-step', handleNavigate);
    return () => window.removeEventListener('app:navigate-to-timer-step', handleNavigate);
  }, [recipe.id, recipe.title, setCookingStepIndex]);

  // Flat list of ingredients
  const allIngredients = useMemo(() => {
    return recipe.ingredients ? recipe.ingredients.flatMap(g => g.items) : [];
  }, [recipe.ingredients]);

  // Find ingredients mentioned in a specific step description
  const getIngredientsForStep = (description: string) => {
    if (!description) return [];
    const mentioned: Ingredient[] = [];
    
    const isMatch = (term: string | undefined, text: string) => {
      if (!term) return false;
      const lowerTerm = term.toLowerCase();
      const lowerText = text.toLowerCase();
      
      if (term.length <= 3) {
        const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?<=^|[\\s.,:;!?()\\[\\]{}'"\\-\\/])${escapedTerm}(?=$|[\\s.,:;!?()\\[\\]{}'"\\-\\/])`, 'i');
        return regex.test(text);
      }
      return lowerText.includes(lowerTerm);
    };

    allIngredients.forEach(ing => {
      if (isMatch(ing.baseName, description) || isMatch(ing.name, description)) {
        if (!mentioned.some(m => m.name === ing.name)) {
          mentioned.push(ing);
        }
      }
    });
    return mentioned;
  };

  const currentStep = recipe.instructions?.[cookingStepIndex];

  return (
    <div
      className="fixed inset-0 z-[90] bg-white dark:bg-gray-950 flex flex-col justify-between p-4 md:p-8 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('recipe.cookingMode')}</span>
        </div>
        {/* Progress indicator */}
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {t('recipe.cookingModeProgress', { current: cookingStepIndex + 1, total: recipe.instructions?.length || 0 })}
        </div>
        <Button
          isIconOnly
          variant="ghost"
          onPress={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-none"
          aria-label={t('dialog.closeAria')}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress bar at the top */}
      {recipe.instructions && (
        <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            style={{ width: `${((cookingStepIndex + 1) / recipe.instructions.length) * 100}%` }}
          />
        </div>
      )}

      {/* Active Timers Sektion in Cooking Mode */}
      {timers.length > 0 && (
        <div className="flex flex-col gap-2 mt-3 w-full max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            {timers.map(timer => {
              const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
              const isFinished = timer.isFinished;

              const m = Math.floor(remaining / 60);
              const s = remaining % 60;
              const countdownStr = isFinished
                ? t('timer.finished')
                : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

              const { recipeId, stepNum } = timer;
              const isAssociated = !!(recipeId && stepNum);

              return (
                <div
                  key={timer.id}
                  onClick={isAssociated ? () => {
                    setPendingNavigation({ recipeId: recipeId!, stepNum: stepNum! });
                    window.dispatchEvent(new CustomEvent('app:navigate-to-timer-step', {
                      detail: { recipeId, stepNum }
                    }));
                  } : undefined}
                  className={`snap-center shrink-0 relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl shadow-sm overflow-hidden transition-all duration-300 border ${
                    isAssociated ? 'cursor-pointer active:scale-[0.98]' : ''
                  } ${
                    isFinished
                      ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 animate-pulse text-rose-600 dark:text-rose-400'
                      : 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}
                  style={{ minWidth: '140px' }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] opacity-75 font-semibold truncate max-w-[100px]">
                      {timer.label}
                    </span>
                    <span className="text-xs font-black tabular-nums leading-tight">
                      {countdownStr}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFinished) {
                        dismissFinished(timer.id);
                      } else {
                        removeTimer(timer.id);
                      }
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isFinished
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400'
                        : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Central Instruction Step Card */}
      <div className="flex-1 flex flex-col justify-center items-center my-6 max-w-4xl mx-auto w-full px-4 text-center">
        {/* Step Number Badge */}
        {currentStep && (
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            {currentStep.step}
          </div>
        )}

        {/* Step Description */}
        {currentStep && (
          <h1 className="text-2xl md:text-3.5xl font-bold text-gray-900 dark:text-white leading-relaxed mb-8 max-h-[40dvh] overflow-y-auto px-2">
            <RecipeInstructionText text={currentStep.description} recipe={recipe} formatAmount={formatAmount} stepNum={currentStep.step} />
          </h1>
        )}

        {/* Contextual Ingredients needed for this step */}
        {currentStep && getIngredientsForStep(currentStep.description).length > 0 && (
          <div className="w-full max-w-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-left backdrop-blur-sm">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('recipe.ingredientsForStep')}</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {getIngredientsForStep(currentStep.description).map((ing, i) => {
                const scaledAmount = formatAmount(ing.amount, ing.unit);
                const amountStr = scaledAmount ? `${scaledAmount} ` : '';
                const unitStr = ing.unit ? `${ing.unit} ` : '';
                return (
                  <li key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-white/50 dark:bg-black/35 border border-black/5 dark:border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">{amountStr}{unitStr}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {ing.name}
                      {ing.modifier && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">
                          ({ing.modifier})
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col gap-4 max-w-md mx-auto w-full border-t border-black/5 dark:border-white/5 pt-4">
        <div className="flex gap-3 justify-between items-center w-full">
          <Button
            variant="outline"
            onPress={handlePrevCookingStep}
            isDisabled={cookingStepIndex === 0}
            className="flex-1 py-3 h-12 rounded-xl font-semibold border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('recipe.back')}
          </Button>

          {/* Mark Completed & Next Button */}
          {recipe.instructions && cookingStepIndex === recipe.instructions.length - 1 ? (
            <Button
              className="flex-[2] py-3 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              onPress={() => {
                const currentStepNum = recipe.instructions[cookingStepIndex].step;
                if (!checkedSteps[currentStepNum]) {
                  toggleStep(currentStepNum);
                }
                onClose();
                dialog.alert({
                  title: t('recipe.finishedAlertTitle'),
                  message: t('recipe.finishedAlertMessage'),
                  status: 'success'
                });
              }}
            >
              {t('recipe.finish')}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-[2] py-3 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              onPress={() => {
                if (recipe.instructions) {
                  const currentStepNum = recipe.instructions[cookingStepIndex].step;
                  if (!checkedSteps[currentStepNum]) {
                    toggleStep(currentStepNum);
                  }
                }
                handleNextCookingStep();
              }}
            >
              {t('recipe.doneNext')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        <div className="text-[10px] text-center text-gray-500 dark:text-gray-400">
          {t('recipe.cookingModeTip')}
        </div>
      </div>
    </div>
  );
}
