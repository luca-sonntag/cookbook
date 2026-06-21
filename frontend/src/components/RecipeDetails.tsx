import { useState, useMemo } from 'react';
import { Card, Button, Tabs, Popover } from '@heroui/react';
import {
  Check,
  Copy,
  Clock,
  Utensils,
  ListChecks,
  ChefHat,
  ChevronRight,
  Minus,
  Plus,
  Play,
  Sparkles,
  MoreVertical,
  Trash2
} from 'lucide-react';
import type { Recipe, Ingredient, InstructionStep } from '../types';
import { useRecipeScaling } from '../hooks/useRecipeScaling';
import { useRecipeProgress } from '../hooks/useRecipeProgress';
import { useRecipeNutrition } from '../hooks/useRecipeNutrition';
import {
  categoryOrder,
  legacyCategoryMap
} from '../i18n';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../context/I18nContext';

// Import subcomponents
import RecipeImageGallery from './RecipeImageGallery';
import RecipeInstructionText from './RecipeInstructionText';
import CookingMode from './CookingMode';
import AiNotice from './AiNotice';

interface RecipeDetailsProps {
  recipe: Recipe;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  onDelete?: () => void;
}

export default function RecipeDetails({ recipe, onAddIngredients, onDelete }: RecipeDetailsProps) {
  const dialog = useDialog();
  const { t, translateCategory } = useI18n();

  // Format prep and cook time helper supporting both legacy string values and new number values
  const formatTimeValue = (time: any) => {
    if (time === undefined || time === null || time === '') return 'N/A';
    if (typeof time === 'number') {
      return t('recipe.minutes', { count: time });
    }
    const strTime = String(time).trim();
    const match = strTime.match(/\d+/);
    if (match) {
      return t('recipe.minutes', { count: match[0] });
    }
    return strTime;
  };

  // Helper to format nutrition values and append units without duplication
  const renderNutritionWithUnit = (val: any, unit: string = 'g') => {
    const formatted = formatNutritionValue(val);
    if (formatted === '—') return '—';
    const str = String(formatted);
    if (str.toLowerCase().endsWith(unit.toLowerCase())) return str;
    return `${str}${unit}`;
  };

  // Checklists state (persisted in localStorage!)
  const {
    checkedIngredients,
    checkedSteps,
    toggleIngredient,
    toggleStep
  } = useRecipeProgress(recipe);

  // Configurable servings & scaling hook
  const {
    servings,
    setServings,
    scaleFactor,
    formatAmount,
    formatNutritionValue
  } = useRecipeScaling(recipe);

  // Added/copied states (encapsulated locally!)
  const [isCopied, setIsCopied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cooking Mode states
  const [isCookingMode, setIsCookingMode] = useState(false);

  // Show ingredient nutrition state (persisted in localStorage)
  const [showIngredientNutrition, setShowIngredientNutrition] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('recipe_show_ingredient_nutrition');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const handleToggleIngredientNutrition = () => {
    setShowIngredientNutrition(prev => {
      const next = !prev;
      try {
        localStorage.setItem('recipe_show_ingredient_nutrition', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving showIngredientNutrition to localStorage', e);
      }
      return next;
    });
  };

  // Check if at least one ingredient has nutrition values estimated/defined
  const hasIngredientNutrition = useMemo(() => {
    if (!recipe.ingredients) return false;
    return recipe.ingredients.some(group =>
      group.items.some(ing =>
        (ing.calories !== undefined && ing.calories !== null && ing.calories > 0) ||
        (ing.protein !== undefined && ing.protein !== null && ing.protein > 0) ||
        (ing.carbs !== undefined && ing.carbs !== null && ing.carbs > 0) ||
        (ing.fat !== undefined && ing.fat !== null && ing.fat > 0)
      )
    );
  }, [recipe.ingredients]);

  // Find the first uncompleted step to highlight it
  const activeStepNum = useMemo(() => {
    if (!recipe.instructions) return null;
    const activeStep = recipe.instructions.find(s => !checkedSteps[s.step]);
    return activeStep ? activeStep.step : null;
  }, [recipe.instructions, checkedSteps]);

  // Steps progress calculations
  const totalStepsCount = recipe.instructions ? recipe.instructions.length : 0;
  const completedStepsCount = useMemo(() => {
    if (!recipe.instructions) return 0;
    return recipe.instructions.filter(s => !!checkedSteps[s.step]).length;
  }, [recipe.instructions, checkedSteps]);
  const progressPercent = totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0;

  // Get nutritional info (either reel-level or aggregated per-ingredient AI estimates)
  const { nutritionalValues, isAiEstimated, hasNutritionInfo } = useRecipeNutrition(recipe);

  // Sort ingredient groups based on categoryOrder
  const sortedIngredients = useMemo(() => {
    if (!recipe.ingredients) return [];

    // Map each group to include its original index for correct checklist progress tracking
    const mapped = recipe.ingredients.map((group, originalIdx) => ({
      group,
      originalIdx
    }));

    return mapped.sort((a, b) => {
      const getCategoryIndex = (name: string) => {
        const cleanName = name.trim().toUpperCase();
        let idx = categoryOrder.indexOf(cleanName as any);
        if (idx !== -1) return idx;

        const lowerName = name.trim().toLowerCase();
        const enumKey = legacyCategoryMap[lowerName];
        if (enumKey) {
          return categoryOrder.indexOf(enumKey);
        }
        return 999;
      };

      return getCategoryIndex(a.group.name) - getCategoryIndex(b.group.name);
    });
  }, [recipe.ingredients]);

  const handleAddToShoppingList = () => {
    if (!onAddIngredients) return;

    const itemsToAdd: Ingredient[] = [];
    sortedIngredients.forEach(({ group, originalIdx }) => {
      group.items.forEach((ing, idx) => {
        const uniqueId = `${ing.name}-${originalIdx}-${idx}`;
        const isChecked = !!checkedIngredients[uniqueId];
        if (!isChecked) {
          const baseAmount = ing.amount || 0;
          const scaledAmount = baseAmount * scaleFactor;
          itemsToAdd.push({
            name: ing.name,
            amount: scaledAmount,
            unit: ing.unit || '',
            notes: ing.notes,
            category: group.name
          });
        }
      });
    });

    if (itemsToAdd.length === 0) {
      dialog.alert({
        title: t('recipe.alreadyAddedTitle'),
        message: t('recipe.alreadyAddedMessage'),
        status: 'warning'
      });
      return;
    }

    const recipeId = recipe.id || recipe.title;
    onAddIngredients(itemsToAdd, recipeId, recipe.title);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const copyRecipeMarkdown = () => {
    let md = `# ${recipe.title}\n\n${recipe.description}\n\n`;
    md += `**Prep Time:** ${formatTimeValue(recipe.prepTime)} | **Cook Time:** ${formatTimeValue(recipe.cookTime)} | **Servings:** ${servings}\n\n`;

    md += `## ${t('recipe.tabIngredients')}\n`;
    sortedIngredients.forEach(({ group }) => {
      if (recipe.ingredients.length > 1) {
        md += `### ${translateCategory(group.name)}\n`;
      }
      group.items.forEach((ing: Ingredient) => {
        const scaledAmount = formatAmount(ing.amount, ing.unit);
        const amountStr = scaledAmount ? `${scaledAmount} ` : '';
        const unitStr = ing.unit ? `${ing.unit} ` : '';
        const noteStr = ing.notes ? ` (${ing.notes})` : '';
        md += `- ${amountStr}${unitStr}${ing.name}${noteStr}\n`;
      });
      if (recipe.ingredients.length > 1) {
        md += `\n`;
      }
    });
    if (recipe.ingredients.length <= 1) {
      md += `\n`;
    }

    md += `## ${t('recipe.tabInstructions')}\n`;
    recipe.instructions.forEach((step: InstructionStep) => {
      md += `${step.step}. ${step.description}\n`;
    });
    md += `\n`;

    if (recipe.equipment && recipe.equipment.length > 0) {
      md += `## ${t('recipe.requiredEquipment')}\n`;
      recipe.equipment.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (recipe.tips && recipe.tips.length > 0) {
      md += `## ${t('recipe.tipsTitle')}\n`;
      recipe.tips.forEach((tip: string) => {
        md += `- ${tip}\n`;
      });
      md += `\n`;
    }

    navigator.clipboard.writeText(md).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <article className="flex flex-col gap-6">
      <Card className="glass-panel p-6 rounded-2xl overflow-hidden">
        {/* Responsive Image Gallery */}
        <RecipeImageGallery recipe={recipe} />

        {/* Recipe title header */}
        <div className="flex justify-between items-start gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{recipe.title}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{recipe.description}</p>
          </div>
          <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Popover.Trigger>
              <Button
                isIconOnly
                variant="outline"
                className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom end" className="p-1 min-w-[160px] bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 rounded-xl shadow-lg">
              <div className="flex flex-col w-full">
                <button
                  onClick={() => {
                    copyRecipeMarkdown();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-left transition-colors cursor-pointer outline-none"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">{t('recipe.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('recipe.copyRecipe')}</span>
                    </>
                  )}
                </button>

                {onDelete && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('recipe.delete')}</span>
                  </button>
                )}
              </div>
            </Popover.Content>
          </Popover>
        </div>

        {/* Cooking stats summary */}
        <div className="grid grid-cols-3 gap-2 py-4">
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <Clock className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.prep')}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(recipe.prepTime)}</span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <Utensils className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.cook')}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{formatTimeValue(recipe.cookTime)}</span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <ListChecks className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('recipe.serves')}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                onPress={() => setServings(s => Math.max(1, s - 1))}
                aria-label="Decrease servings"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[1.2rem]">{servings}</span>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                onPress={() => setServings(s => s + 1)}
                aria-label="Increase servings"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Nutrition estimate */}
        {hasNutritionInfo && nutritionalValues && (
          <div className={`p-3.5 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-300 ${
            isAiEstimated
              ? 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] shadow-[0_0_15px_rgba(99,102,241,0.05)]'
              : 'bg-black/5 dark:bg-white/5'
          }`}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('recipe.nutritionTitle')}</h4>
              {isAiEstimated && <AiNotice type="badge" />}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{formatNutritionValue(nutritionalValues.calories)}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionCalories')}</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{renderNutritionWithUnit(nutritionalValues.protein, 'g')}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionProtein')}</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{renderNutritionWithUnit(nutritionalValues.carbs, 'g')}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionCarbs')}</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{renderNutritionWithUnit(nutritionalValues.fat, 'g')}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">{t('recipe.nutritionFat')}</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabbed view for recipe items */}
      <Tabs defaultSelectedKey="ingredients" className="w-full">
        <Tabs.ListContainer className="w-full">
          <Tabs.List className="flex !bg-transparent !p-0 !rounded-none border-b border-black/10 dark:border-white/10 w-full mb-4 overflow-x-auto scrollbar-none">
            <Tabs.Tab id="ingredients" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-600 dark:data-[selected=true]:border-emerald-500 !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white transition-all cursor-pointer !bg-transparent !shadow-none !rounded-none whitespace-nowrap">
              {t('recipe.tabIngredients')}
            </Tabs.Tab>
            <Tabs.Tab id="steps" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-600 dark:data-[selected=true]:border-emerald-500 !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white transition-all cursor-pointer !bg-transparent !shadow-none !rounded-none whitespace-nowrap">
              {t('recipe.tabInstructions')}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Ingredients tab */}
        <Tabs.Panel id="ingredients" className="flex flex-col gap-4">
          <Card className="glass-panel p-5 rounded-2xl">
            <div className="flex flex-col gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('recipe.ingredientsTitle')}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 normal-case font-normal">
                  {t('recipe.ingredientsSubtitle')}
                </span>
              </div>
              {hasIngredientNutrition && (
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    onClick={handleToggleIngredientNutrition}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold select-none cursor-pointer transition-all border ${
                      showIngredientNutrition
                        ? 'bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:opacity-90'
                        : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${showIngredientNutrition ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span>{t('recipe.showNutritionPerIngredient')}</span>
                  </button>
                  <AiNotice type="badge" tooltipText={t('recipe.aiIngredientsEstimateTooltip')} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-6">
              {sortedIngredients.map(({ group, originalIdx }, sortedIdx) => (
                <div key={sortedIdx} className="flex flex-col gap-2.5">
                  {recipe.ingredients.length > 1 && (
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-3 border-l-2 border-emerald-500 flex items-center gap-1.5">
                      <span>{translateCategory(group.name)}</span>
                    </h4>
                  )}
                  <ul className="flex flex-col gap-2">
                    {group.items.map((ing, idx) => {
                      const scaledAmount = formatAmount(ing.amount, ing.unit);
                      const amountStr = scaledAmount ? `${scaledAmount} ` : '';
                      const unitStr = ing.unit ? `${ing.unit} ` : '';
                      const name = ing.name;
                      const uniqueId = `${name}-${originalIdx}-${idx}`;
                      const isChecked = !!checkedIngredients[uniqueId];

                      return (
                        <li
                          key={uniqueId}
                          onClick={() => toggleIngredient(uniqueId)}
                          className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                            }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm select-none transition-all ${isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                            }`}>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{amountStr}{unitStr}</span>
                            <span>{name}</span>
                            {showIngredientNutrition && (() => {
                              const parts = [];
                              if (ing.calories) parts.push(`${Math.round(ing.calories * scaleFactor)} kcal`);
                              if (ing.protein) parts.push(`${Math.round(ing.protein * scaleFactor * 10) / 10}g ${t('recipe.nutritionProteinShort')}`);
                              if (ing.carbs) parts.push(`${Math.round(ing.carbs * scaleFactor * 10) / 10}g ${t('recipe.nutritionCarbsShort')}`);
                              if (ing.fat) parts.push(`${Math.round(ing.fat * scaleFactor * 10) / 10}g ${t('recipe.nutritionFatShort')}`);
                              
                              if (parts.length === 0) return null;
                              return (
                                <span className="inline-flex gap-1 ml-2 text-[10px] text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-medium select-none align-middle">
                                  {parts.join(' | ')}
                                </span>
                              );
                            })()}
                            {ing.notes && <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{ing.notes}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {onAddIngredients && (
              <Button
                className={`w-full mt-5 py-2.5 rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white ${isAdded ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                onPress={handleAddToShoppingList}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('recipe.addedToShopping')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('recipe.addToShopping')}</span>
                  </>
                )}
              </Button>
            )}
          </Card>

          {recipe.alternativeIngredients && recipe.alternativeIngredients.length > 0 && (
            <Card className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">{t('recipe.alternativeIngredients')}</h3>
              <div className="flex flex-col gap-3">
                {recipe.alternativeIngredients.map((alt, idx) => (
                  <div key={idx} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-red-600 dark:text-red-400 line-through">{alt.original}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{alt.substitute}</span>
                    </div>
                    {alt.notes && <p className="text-gray-500 dark:text-gray-400 mt-1.5 leading-normal">{alt.notes}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Tabs.Panel>

        {/* Instructions tab */}
        <Tabs.Panel id="steps" className="flex flex-col gap-4">
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
                onPress={() => setIsCookingMode(true)}
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
                    className={`flex items-start gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${isActive
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]'
                      : isChecked
                        ? 'bg-black/2 dark:bg-white/2 border-transparent opacity-65'
                        : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                      }`}>
                      {isChecked ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{step.step}</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {isActive && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          {t('recipe.currentStep')}
                        </span>
                      )}
                      <span className={`text-sm leading-relaxed block select-none transition-all ${isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                        <RecipeInstructionText text={step.description} recipe={recipe} formatAmount={formatAmount} />
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
              <ul className="flex flex-col gap-3 text-xs text-gray-700 dark:text-gray-300">
                {recipe.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-normal">
                    <span className="bg-emerald-500/10 text-emerald-500 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-emerald-500/20">{idx + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Floating Action Button (FAB) for Start Cooking */}
      {!isCookingMode && totalStepsCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up">
          <Button
            className="bg-emerald-600/90 hover:bg-emerald-500/95 dark:bg-emerald-500/90 dark:hover:bg-emerald-400/95 backdrop-blur-xs text-white font-semibold px-4 h-10 rounded-full shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
            onPress={() => setIsCookingMode(true)}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs tracking-wide">{t('recipe.startCooking')}</span>
          </Button>
        </div>
      )}


      {/* Cooking Mode Fullscreen Overlay */}
      {isCookingMode && (
        <CookingMode
          recipe={recipe}
          onClose={() => setIsCookingMode(false)}
          checkedSteps={checkedSteps}
          toggleStep={toggleStep}
          formatAmount={formatAmount}
        />
      )}
    </article>
  );
}

