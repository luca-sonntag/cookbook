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
      className="flex-1 min-h-0 flex flex-col justify-center items-center my-auto max-w-2xl mx-auto w-full px-1 sm:px-2 overflow-y-auto animate-fade-in py-2"
    >
      {/* Cohesive Step Card */}
      <div className="w-full bg-gray-50/90 dark:bg-gray-900/60 rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] border-none flex flex-col transition-all">
        {/* Step Header & Instruction Text */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
          {/* Step Number Badge */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl shadow-xs select-none mb-1">
            {currentStep.step}
          </div>

          {/* Step Description - Large & Bold for kitchen glanceability */}
          <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.4] sm:leading-[1.45] px-1">
            <RecipeInstructionText
              variant="focused"
              text={currentStep.description}
              recipe={recipe}
              formatAmount={formatAmount}
              stepNum={currentStep.step}
            />
          </h1>
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
