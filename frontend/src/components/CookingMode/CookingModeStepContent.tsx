import React from 'react';
import type { Recipe, InstructionStep } from '../../types';
import type { StepIngredientItem } from './types';
import RecipeInstructionText from '../RecipeInstructionText';
import CookingModeIngredients from './CookingModeIngredients';
import { useI18n } from '../../context/I18nContext';

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
  const { t } = useI18n();

  if (!currentStep) return null;

  return (
    <div
      key={cookingStepIndex}
      className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain flex flex-col items-center py-2 sm:py-3 px-0.5 sm:px-2 animate-fade-in"
    >
      {/* Cohesive Step Card - Visible background & elegant elevation */}
      <div className="w-full max-w-3xl bg-gray-100/90 dark:bg-gray-900/80 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-sm shadow-black/[0.04] dark:shadow-black/30 border-none flex flex-col my-auto shrink-0 transition-all">
        {/* Step Header & Instruction Text - Left-aligned for natural reading flow & visual harmony */}
        <div className="p-5 sm:p-7 flex flex-col gap-3 text-left">
          {/* Step Header with Step Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg shadow-xs select-none shrink-0">
              {currentStep.step}
            </div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t('recipe.step')} {currentStep.step}
            </span>
          </div>

          {/* Step Description */}
          <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-gray-900 dark:text-white tracking-tight leading-relaxed sm:leading-[1.55]">
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
