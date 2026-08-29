import React from 'react';
import type { Recipe, InstructionStep } from '../../types';
import type { StepIngredientItem } from './types';
import type { StepSlideDirection } from '../../hooks/useCookingMode';
import RecipeInstructionText from '../RecipeInstructionText';
import CookingModeIngredients from './CookingModeIngredients';
import CachedImage from '../CachedImage';

interface CookingModeStepContentProps {
  recipe: Recipe;
  currentStep?: InstructionStep;
  stepIngredients: StepIngredientItem[];
  formatAmount: (amount: number, unit?: string) => string;
  cookingStepIndex: number;
  totalSteps: number;
  slideDirection?: StepSlideDirection;
}

export const CookingModeStepContent: React.FC<CookingModeStepContentProps> = ({
  recipe,
  currentStep,
  stepIngredients,
  formatAmount,
  cookingStepIndex,
  totalSteps,
  slideDirection = 'forward',
}) => {
  if (!currentStep) return null;

  const hasCover = Boolean(recipe.imageUrl || recipe.emoji);
  const progressPercent = totalSteps > 0 ? ((cookingStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div
      key={cookingStepIndex}
      className={`flex-1 min-h-0 w-full overflow-y-auto overscroll-contain scrollbar-none flex flex-col items-center py-2 sm:py-3 px-0.5 sm:px-2 ${
        slideDirection === 'forward' ? 'animate-step-in-right' : 'animate-step-in-left'
      }`}
    >
      {/* Cohesive Step Content with smooth layout transition */}
      <div className="w-full max-w-3xl flex flex-col my-auto shrink-0 transition-[margin,transform,height] duration-350 ease-out">
        {/* 100% Unobscured Cover Photo without overlays */}
        {hasCover && (
          <div className="w-full h-40 sm:h-52 rounded-[28px] overflow-hidden relative shadow-xs shrink-0 bg-gray-100 dark:bg-gray-800/80 mb-3.5">
            <CachedImage
              src={recipe.imageUrl}
              emoji={recipe.emoji}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Unified Step & Progress Bar (Lösung B: Badge + Balken + Zähler) */}
        <div className="px-2 pt-1 pb-1 flex items-center gap-3 w-full">
          {/* Step Badge */}
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-sm shadow-xs select-none shrink-0">
            {currentStep.step}
          </div>

          {/* Connected Progress Bar Track */}
          {totalSteps > 0 && (
            <div className="flex-1 bg-black/[0.06] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Step Counter */}
          {totalSteps > 0 && (
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums shrink-0 select-none">
              {currentStep.step} / {totalSteps}
            </span>
          )}
        </div>

        {/* Step Description - Warm, readable editorial typography */}
        <div className="px-2 py-2 sm:px-4 sm:py-3 flex flex-col text-left">
          <div className="text-[22px] sm:text-[26px] md:text-[28px] font-semibold text-gray-800 dark:text-gray-100 tracking-normal leading-[1.55] sm:leading-[1.6]">
            <RecipeInstructionText
              variant="focused"
              text={currentStep.description}
              recipe={recipe}
              formatAmount={formatAmount}
              stepNum={currentStep.step}
            />
          </div>
        </div>

        {/* Integrated Contextual Step Ingredients */}
        <CookingModeIngredients
          ingredients={stepIngredients}
          formatAmount={formatAmount}
        />
      </div>
    </div>
  );
};

export default CookingModeStepContent;
