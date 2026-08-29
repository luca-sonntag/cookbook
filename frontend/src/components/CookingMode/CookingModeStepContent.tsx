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
      className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain flex flex-col items-center py-2 sm:py-3 px-0.5 sm:px-2 animate-fade-in"
    >
      {/* Cohesive Step Content - Clean Flat seamless container */}
      <div className="w-full max-w-3xl flex flex-col my-auto shrink-0 transition-all">
        {/* Step Header & Instruction Text - Left-aligned for natural reading flow & visual harmony */}
        <div className="px-2 py-4 sm:px-4 sm:py-6 flex flex-col gap-3.5 text-left">
          {/* Step Badge */}
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shadow-xs select-none shrink-0">
            {currentStep.step}
          </div>

          {/* Step Description - Warm, elegant, readable editorial typography */}
          <div className="text-lg sm:text-xl md:text-[22px] font-medium text-gray-800 dark:text-gray-100 tracking-normal leading-[1.65] sm:leading-[1.7]">
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
