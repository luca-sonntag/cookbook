import React from 'react';
import type { Recipe, InstructionStep } from '../../types';
import type { StepIngredientItem } from './types';
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
}

export const CookingModeStepContent: React.FC<CookingModeStepContentProps> = ({
  recipe,
  currentStep,
  stepIngredients,
  formatAmount,
  cookingStepIndex,
  totalSteps,
}) => {
  if (!currentStep) return null;

  const hasCover = Boolean(recipe.imageUrl || recipe.emoji);
  const progressPercent = totalSteps > 0 ? ((cookingStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div
      key={cookingStepIndex}
      className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain scrollbar-none flex flex-col items-center py-2 sm:py-3 px-0.5 sm:px-2 animate-fade-in"
    >
      {/* Cohesive Step Content - Clean Flat seamless container */}
      <div className="w-full max-w-3xl flex flex-col my-auto shrink-0 transition-all">
        {/* Pure, Unobscured Cover Photo with Seamless Bottom Edge Progress Bar (Variante 2) */}
        {hasCover && (
          <div className="w-full h-40 sm:h-52 rounded-[28px] overflow-hidden relative shadow-xs shrink-0 bg-gray-100 dark:bg-gray-800/80 mb-3">
            <CachedImage
              src={recipe.imageUrl}
              emoji={recipe.emoji}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />

            {/* Seamless 3px Glowing Progress Line at bottom edge of image */}
            {totalSteps > 0 && (
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/15 dark:bg-white/15 overflow-hidden z-10 pointer-events-none">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step Badge & Recipe Context */}
        <div className="px-2 pt-1 pb-1 flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shadow-xs select-none shrink-0">
            {currentStep.step}
          </div>
          {recipe.title && (
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate">
              {recipe.title}
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
