import React from 'react';
import type { Recipe, InstructionStep } from '../../types';
import type { StepIngredientItem } from './types';
import RecipeInstructionText from '../RecipeInstructionText';
import CookingModeIngredients from './CookingModeIngredients';

interface CookingModeStepContentProps {
  recipe: Recipe;
  currentStep?: InstructionStep;
  stepIngredients: StepIngredientItem[];
  formatAmount: (amount: number, unit?: string) => string;
  cookingStepIndex: number;
}

export const CookingModeStepContent: React.FC<CookingModeStepContentProps> = ({
  recipe,
  currentStep,
  stepIngredients,
  formatAmount,
  cookingStepIndex,
}) => {
  if (!currentStep) return null;

  return (
    <div
      key={cookingStepIndex}
      className="flex-1 min-h-0 flex flex-col justify-center items-center my-2 sm:my-5 max-w-4xl mx-auto w-full px-2 sm:px-4 text-center overflow-y-auto animate-fade-in"
    >
      {/* Step Number Badge */}
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl mb-4 shrink-0 shadow-xs select-none">
        {currentStep.step}
      </div>

      {/* Step Description */}
      <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-bold text-gray-900 dark:text-white tracking-tight leading-relaxed md:leading-[1.6] mb-5 max-h-[35dvh] overflow-y-auto px-2 shrink-0">
        <RecipeInstructionText
          variant="focused"
          text={currentStep.description}
          recipe={recipe}
          formatAmount={formatAmount}
          stepNum={currentStep.step}
        />
      </h1>

      {/* Contextual Ingredients */}
      <CookingModeIngredients
        ingredients={stepIngredients}
        formatAmount={formatAmount}
      />
    </div>
  );
};

export default CookingModeStepContent;
