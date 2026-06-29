import { Card, Button } from '@heroui/react';
import { ChevronRight, Play, Sparkles, Check, ChefHat } from 'lucide-react';
import type { Recipe } from '../../types';
import RecipeInstructionText from '../RecipeInstructionText';
import { useI18n } from '../../context/I18nContext';

interface RecipeInstructionsProps {
  recipe: Recipe;
  checkedSteps: Record<number, boolean>;
  toggleStep: (step: number) => void;
  activeStepNum: number | null;
  completedStepsCount: number;
  totalStepsCount: number;
  progressPercent: number;
  onStartCooking: () => void;
  formatAmount: (amount: number | undefined, unit: string | undefined) => string;
}

export default function RecipeInstructions({
  recipe,
  checkedSteps,
  toggleStep,
  activeStepNum,
  completedStepsCount,
  totalStepsCount,
  progressPercent,
  onStartCooking,
  formatAmount
}: RecipeInstructionsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      {recipe.equipment && recipe.equipment.length > 0 && (
        <Card className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">{t('recipe.requiredEquipment')}</h3>
          <ul className="grid grid-cols-2 gap-2">
            {recipe.equipment.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 py-1.5 px-2.5 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Cooking Progress Bar & Start Button Card */}
      <Card className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t('recipe.cookingProgress')}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {t('recipe.progressSteps', { completed: completedStepsCount, total: totalStepsCount, percent: Math.round(progressPercent) })}
              </span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all flex-shrink-0 self-start sm:self-center"
            onPress={onStartCooking}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{t('recipe.startCooking')}</span>
          </Button>
        </div>
      </Card>

      <Card className="glass-panel p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{t('recipe.stepByStep')}</h3>
        <div className="flex flex-col gap-4">
          {recipe.instructions.map((step) => {
            const isChecked = !!checkedSteps[step.step];
            const isActive = step.step === activeStepNum;

            return (
              <div
                key={step.step}
                onClick={() => toggleStep(step.step)}
                className={`flex items-start gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]'
                    : isChecked
                    ? 'bg-black/2 dark:bg-white/2 border-transparent opacity-65'
                    : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                }`}>
                  {isChecked ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{step.step}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  {isActive && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      {t('recipe.currentStep')}
                    </span>
                  )}
                  <span className={`text-sm leading-relaxed block select-none transition-all ${
                    isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    <RecipeInstructionText text={step.description} recipe={recipe} formatAmount={formatAmount} stepNum={step.step} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {recipe.tips && recipe.tips.length > 0 && (
        <Card className="glass-panel p-5 rounded-2xl border border-emerald-500/10">
          <h3 className="text-sm font-bold text-emerald-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            <span>{t('recipe.tipsTitle')}</span>
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-300">
            {recipe.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-normal">
                <span className="bg-emerald-500/10 text-emerald-500 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border border-emerald-500/20">{idx + 1}</span>
                <span>
                  <RecipeInstructionText text={tip} recipe={recipe} formatAmount={formatAmount} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
