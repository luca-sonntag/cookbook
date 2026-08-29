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
        {/* Hero Cover Banner (Appetite Banner) */}
        {(recipe.imageUrl || recipe.emoji) && (
          <div className="w-full h-36 sm:h-48 rounded-[24px] overflow-hidden relative shadow-xs shrink-0 bg-gray-100 dark:bg-gray-800/80 mb-2">
            <CachedImage
              src={recipe.imageUrl}
              emoji={recipe.emoji}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            {/* Subtle gradient vignette at bottom for seamless depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Step Header & Instruction Text - Left-aligned for natural reading flow & visual harmony */}
        <div className="px-2 py-3 sm:px-4 sm:py-4 flex flex-col gap-3 text-left">
          {/* Step Badge & Recipe context */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shadow-xs select-none shrink-0">
              {currentStep.step}
            </div>
            {recipe.title && (
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate">
                {recipe.title}
              </span>
            )}
          </div>

          {/* Step Description - Slightly larger, warm, editorial typography */}
          <div className="text-xl sm:text-2xl md:text-[25px] font-semibold text-gray-800 dark:text-gray-100 tracking-normal leading-[1.6] sm:leading-[1.65]">
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
