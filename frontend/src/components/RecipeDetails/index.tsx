import { useState, useMemo, useEffect } from 'react';
import { Card, Tabs } from '@heroui/react';
import type { Recipe, Ingredient } from '../../types';
import { useRecipeScaling } from '../../hooks/useRecipeScaling';
import { useRecipeProgress } from '../../hooks/useRecipeProgress';
import { useRecipeNutrition } from '../../hooks/useRecipeNutrition';
import { useSwipeableTabs } from '../../hooks/useSwipeableTabs';
import { categoryOrder, legacyCategoryMap } from '../../i18n';
import { useDialog } from '../../context/DialogContext';
import { useI18n } from '../../context/I18nContext';
import { useTimerManager } from '../../hooks/useTimerManager';

// Import subcomponents
import RecipeHeader from './RecipeHeader';
import RecipeStats from './RecipeStats';
import RecipeNutrition from './RecipeNutrition';
import RecipeIngredients from './RecipeIngredients';
import RecipeInstructions from './RecipeInstructions';
import RecipeActionDock from './RecipeActionDock';
import CookingMode from '../CookingMode';
import RecipeCopilot from './RecipeCopilot';
import { useAuth } from '../../context/AuthContext';
import PremiumModal from '../PremiumModal';

interface RecipeDetailsProps {
  recipe: Recipe;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  onDelete?: () => void;
  reelUrl?: string;
  createdAt?: string;
  onBack?: () => void;
  onNavigateToShoppingList?: () => void;
  shoppingListCount?: number;
  onRemixSuccess?: (newRecipe: Recipe, newJobId: string) => void;
  onReplaceCurrent?: (newRecipe: Recipe) => void;
  isParentAvailable?: boolean;
  onNavigateToRecipe?: (recipeId: string) => void;
  parentRecipeTitle?: string | null;
  onAssignCollections?: () => void;
  onManageFlags?: () => void;
  flags?: string[];
}

export default function RecipeDetails({
  recipe,
  onAddIngredients,
  onDelete,
  reelUrl,
  createdAt,
  onBack,
  onNavigateToShoppingList,
  onRemixSuccess,
  onReplaceCurrent,
  isParentAvailable,
  onNavigateToRecipe,
  parentRecipeTitle,
  onAssignCollections,
  onManageFlags,
  flags
}: RecipeDetailsProps) {
  const dialog = useDialog();
  const { t, translateCategory } = useI18n();

  // Checklists state (persisted in localStorage)
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
    formatAmount
  } = useRecipeScaling(recipe);

  // Local UI states
  const [isCopied, setIsCopied] = useState(false);
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [initialStepOverride, setInitialStepOverride] = useState<number | undefined>(undefined);
  const { pendingNavigation, setPendingNavigation } = useTimerManager();

  // Swipe-to-switch between the ingredients and steps tabs (with slide animation)
  const { tabsProps, containerProps, panelProps } = useSwipeableTabs({
    tabs: ['ingredients', 'steps'] as const,
  });

  // Listen to state-based pending navigation (handles timing/mount delays)
  useEffect(() => {
    if (
      pendingNavigation &&
      pendingNavigation.stepNum !== undefined &&
      (pendingNavigation.recipeId === recipe.id || pendingNavigation.recipeId === recipe.title)
    ) {
      setInitialStepOverride(pendingNavigation.stepNum - 1);
      setIsCookingMode(true);
      // Consume the navigation state
      setPendingNavigation(null);
    }
  }, [pendingNavigation, recipe.id, recipe.title, setPendingNavigation]);

  // Listen to timer click navigation events to open cooking mode at the correct step
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ recipeId: string; stepNum: number }>;
      if (
        customEvent.detail &&
        customEvent.detail.stepNum !== undefined &&
        (customEvent.detail.recipeId === recipe.id || customEvent.detail.recipeId === recipe.title)
      ) {
        setInitialStepOverride(customEvent.detail.stepNum - 1);
        setIsCookingMode(true);
      }
    };
    window.addEventListener('app:navigate-to-timer-step', handleNavigate);
    return () => window.removeEventListener('app:navigate-to-timer-step', handleNavigate);
  }, [recipe.id, recipe.title]);

  // Show ingredient nutrition state (persisted in localStorage)
  const [showIngredientNutrition, setShowIngredientNutrition] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('recipe_show_ingredient_nutrition');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Show total or per portion nutrition (persisted in localStorage)
  const [showTotalNutrition, setShowTotalNutrition] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('recipe_show_total_nutrition');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

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

  // Helper to format nutrition values, optionally scaling them and appending units
  const getNutritionDisplayValue = (val: any, unit: string = 'g', isTotal: boolean = false, includeUnit: boolean = true) => {
    if (val === undefined || val === null || val === '') return '—';

    let numericVal: number;
    let originalUnit = '';

    if (typeof val === 'number') {
      numericVal = val;
    } else {
      const match = String(val).trim().match(/^([\d.,]+)\s*([a-zA-Z%]*)$/);
      if (!match) return String(val);
      numericVal = parseFloat(match[1].replace(',', '.'));
      originalUnit = match[2] || '';
      if (isNaN(numericVal)) return String(val);
    }

    if (numericVal === 0) return '—';

    // Scale value if total is requested: multiply the per-serving value by the selected servings
    const finalVal = isTotal ? numericVal * servings : numericVal;

    const displayUnit = originalUnit || unit;
    const isKcal = displayUnit.toLowerCase() === 'kcal';

    const rounded = isKcal
      ? Math.round(finalVal)
      : Math.round(finalVal * 10) / 10;

    if (includeUnit) {
      return `${rounded}${displayUnit}`;
    }
    return String(rounded);
  };

  const handleToggleTotalNutrition = (isTotal: boolean) => {
    setShowTotalNutrition(isTotal);
    try {
      localStorage.setItem('recipe_show_total_nutrition', JSON.stringify(isTotal));
    } catch (e) {
      console.error('Error saving showTotalNutrition to localStorage', e);
    }
  };

  // Cooking mode is premium-gated: free users are steered to the upsell modal.
  const handleStartCooking = () => {
    if (isPremium) {
      setIsCookingMode(true);
    } else {
      setIsPremiumModalOpen(true);
    }
  };

  const handleToggleIngredientNutrition = () => {
    // Per-ingredient nutrition is a premium feature (advertised alongside the
    // nutrition card). Free users get the upsell instead of toggling it on.
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
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
            modifier: ing.modifier,
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

  const handleAddAndNavigateToShoppingList = () => {
    // Add ingredients silently (without warning alert) if there are any to add
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
            modifier: ing.modifier,
            category: group.name
          });
        }
      });
    });

    if (itemsToAdd.length > 0 && onAddIngredients) {
      const recipeId = recipe.id || recipe.title;
      onAddIngredients(itemsToAdd, recipeId, recipe.title);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }

    // Always navigate
    onNavigateToShoppingList?.();
  };

  // Build a human-readable ingredient line, e.g. "200 g Mehl (gesiebt) (Bio)"
  const formatIngredientLine = (ing: Ingredient) => {
    const scaledAmount = formatAmount(ing.amount, ing.unit);
    const amountStr = scaledAmount ? `${scaledAmount} ` : '';
    const unitStr = ing.unit ? `${ing.unit} ` : '';
    const modifierStr = ing.modifier ? ` (${ing.modifier})` : '';
    const noteStr = ing.notes ? ` (${ing.notes})` : '';
    return `${amountStr}${unitStr}${ing.name}${modifierStr}${noteStr}`;
  };

  // Escape user-provided text so it is safe/well-formed inside the rich-text (HTML) clipboard payload
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Copy the recipe to the clipboard in two shapes at once:
  //  - text/plain: clean, readable text (no markdown symbols) for WhatsApp, notes, e-mail
  //  - text/html: real headings/bold/lists that paste formatted into Word, Google Docs, Gmail
  const copyRecipe = () => {
    const hasGroups = recipe.ingredients.length > 1;
    const metaLine = `${t('recipe.prep')}: ${formatTimeValue(recipe.prepTime)} · ${t('recipe.cook')}: ${formatTimeValue(recipe.cookTime)} · ${t('recipe.serves')}: ${servings}`;

    // --- Plain text ---
    let text = `${recipe.title}\n\n`;
    if (recipe.description) text += `${recipe.description}\n\n`;
    text += `${metaLine}\n\n`;

    text += `${t('recipe.tabIngredients')}\n`;
    sortedIngredients.forEach(({ group }) => {
      if (hasGroups) text += `${translateCategory(group.name)}\n`;
      group.items.forEach((ing: Ingredient) => {
        text += `• ${formatIngredientLine(ing)}\n`;
      });
      if (hasGroups) text += `\n`;
    });
    if (!hasGroups) text += `\n`;

    text += `${t('recipe.tabInstructions')}\n`;
    recipe.instructions.forEach((step) => {
      text += `${step.step}. ${step.description}\n`;
    });
    text += `\n`;

    if (recipe.equipment && recipe.equipment.length > 0) {
      text += `${t('recipe.requiredEquipment')}\n`;
      recipe.equipment.forEach((item) => {
        text += `• ${item}\n`;
      });
      text += `\n`;
    }

    if (recipe.tips && recipe.tips.length > 0) {
      text += `${t('recipe.tipsTitle')}\n`;
      recipe.tips.forEach((tip) => {
        text += `• ${tip}\n`;
      });
      text += `\n`;
    }

    // --- Rich text (HTML) ---
    let html = `<h1>${escapeHtml(recipe.title)}</h1>`;
    if (recipe.description) html += `<p>${escapeHtml(recipe.description)}</p>`;
    html += `<p><strong>${escapeHtml(t('recipe.prep'))}:</strong> ${escapeHtml(formatTimeValue(recipe.prepTime))} · <strong>${escapeHtml(t('recipe.cook'))}:</strong> ${escapeHtml(formatTimeValue(recipe.cookTime))} · <strong>${escapeHtml(t('recipe.serves'))}:</strong> ${servings}</p>`;

    html += `<h2>${escapeHtml(t('recipe.tabIngredients'))}</h2>`;
    sortedIngredients.forEach(({ group }) => {
      if (hasGroups) html += `<h3>${escapeHtml(translateCategory(group.name))}</h3>`;
      html += `<ul>`;
      group.items.forEach((ing: Ingredient) => {
        html += `<li>${escapeHtml(formatIngredientLine(ing))}</li>`;
      });
      html += `</ul>`;
    });

    html += `<h2>${escapeHtml(t('recipe.tabInstructions'))}</h2><ol>`;
    recipe.instructions.forEach((step) => {
      html += `<li>${escapeHtml(step.description)}</li>`;
    });
    html += `</ol>`;

    if (recipe.equipment && recipe.equipment.length > 0) {
      html += `<h2>${escapeHtml(t('recipe.requiredEquipment'))}</h2><ul>`;
      recipe.equipment.forEach((item) => {
        html += `<li>${escapeHtml(item)}</li>`;
      });
      html += `</ul>`;
    }

    if (recipe.tips && recipe.tips.length > 0) {
      html += `<h2>${escapeHtml(t('recipe.tipsTitle'))}</h2><ul>`;
      recipe.tips.forEach((tip) => {
        html += `<li>${escapeHtml(tip)}</li>`;
      });
      html += `</ul>`;
    }

    const markCopied = () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    // Prefer writing both HTML + plain text; fall back to plain text where
    // ClipboardItem is unavailable (e.g. some Android WebViews).
    const writeRichText = async () => {
      try {
        if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([text], { type: 'text/plain' }),
            }),
          ]);
          return;
        }
      } catch {
        // fall through to plain-text write
      }
      await navigator.clipboard.writeText(text);
    };

    writeRichText().then(markCopied).catch(() => {
      // Last resort: plain text only
      navigator.clipboard.writeText(text).then(markCopied).catch(() => { });
    });
  };

  return (
    <article className="flex flex-col mt-3 gap-6">
      <Card className="glass-panel p-6 rounded-2xl overflow-hidden">
        {/* Recipe Title & Gallery */}
        <RecipeHeader
          recipe={recipe}
          reelUrl={reelUrl}
          createdAt={createdAt}
          onBack={onBack}
          onNavigateToShoppingList={onAddIngredients ? handleAddAndNavigateToShoppingList : onNavigateToShoppingList}
          onDelete={onDelete}
          onCopyRecipe={copyRecipe}
          isCopied={isCopied}
          isParentAvailable={isParentAvailable}
          onNavigateToRecipe={onNavigateToRecipe}
          parentRecipeTitle={parentRecipeTitle}
          onAssignCollections={onAssignCollections}
          onManageFlags={onManageFlags}
          flags={flags}
        />

        {/* Recipe Stats (Prep/Cook Time, Servings) */}
        <RecipeStats
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={servings}
          onDecreaseServings={() => setServings(s => Math.max(1, s - 1))}
          onIncreaseServings={() => setServings(s => s + 1)}
          formatTimeValue={formatTimeValue}
        />

        {/* Nutrition estimate */}
        {hasNutritionInfo && nutritionalValues && (
          <RecipeNutrition
            nutritionalValues={nutritionalValues}
            isAiEstimated={isAiEstimated}
            showTotalNutrition={showTotalNutrition}
            onToggleTotalNutrition={handleToggleTotalNutrition}
            getNutritionDisplayValue={getNutritionDisplayValue}
          />
        )}

        {/* AI generated content disclaimer */}
        <p className="mt-4 text-[10px] text-gray-400 dark:text-gray-500 text-center leading-normal select-none">
          {t('recipe.aiGeneratedDisclaimer')}
        </p>
      </Card>

      {/* Tabbed view for recipe items */}
      <Tabs {...tabsProps} variant="secondary" className="w-full">
        <Tabs.ListContainer className="w-full">
          <Tabs.List className="flex w-full mb-4 overflow-x-auto scrollbar-none">
            <Tabs.Tab id="ingredients" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-semibold transition-all cursor-pointer !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white whitespace-nowrap">
              {t('recipe.tabIngredients')}
              <Tabs.Indicator className="bg-emerald-600 dark:bg-emerald-500" />
            </Tabs.Tab>
            <Tabs.Tab id="steps" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-semibold transition-all cursor-pointer !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white whitespace-nowrap">
              {t('recipe.tabInstructions')}
              <Tabs.Indicator className="bg-emerald-600 dark:bg-emerald-500" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Swipeable panel area: the visible panel follows the finger and the
            neighbouring tab slides in once the swipe passes the threshold. */}
        <div {...containerProps}>
          <div {...panelProps}>
            {/* Ingredients tab */}
            <Tabs.Panel id="ingredients">
              <RecipeIngredients
                recipe={recipe}
                sortedIngredients={sortedIngredients}
                checkedIngredients={checkedIngredients}
                toggleIngredient={toggleIngredient}
                showIngredientNutrition={isPremium && showIngredientNutrition}
                onToggleIngredientNutrition={handleToggleIngredientNutrition}
                hasIngredientNutrition={hasIngredientNutrition}
                isPremium={isPremium}
                scaleFactor={scaleFactor}
                formatAmount={formatAmount}
                onAddIngredients={onAddIngredients ? handleAddToShoppingList : undefined}
                isAdded={isAdded}
              />
            </Tabs.Panel>

            {/* Instructions tab */}
            <Tabs.Panel id="steps">
              <RecipeInstructions
                recipe={recipe}
                checkedSteps={checkedSteps}
                toggleStep={toggleStep}
                activeStepNum={activeStepNum}
                completedStepsCount={completedStepsCount}
                totalStepsCount={totalStepsCount}
                progressPercent={progressPercent}
                onStartCooking={handleStartCooking}
                formatAmount={formatAmount}
              />
            </Tabs.Panel>
          </div>
        </div>
      </Tabs>

      {/* Unified Floating Action Dock (Bottom-Center) */}
      {!isCookingMode && (totalStepsCount > 0 || onAddIngredients || onNavigateToShoppingList) && (
        <RecipeActionDock
          totalStepsCount={totalStepsCount}
          onAddToCart={onAddIngredients ? handleAddToShoppingList : undefined}
          isAdded={isAdded}
          onStartCooking={handleStartCooking}
          recipeId={recipe.id}
          onRemixClick={() => {
            if (isPremium) {
              setIsCopilotOpen(true);
            } else {
              setIsPremiumModalOpen(true);
            }
          }}
        />
      )}

      {/* Cooking Mode Fullscreen Overlay */}
      {isCookingMode && (
        <CookingMode
          recipe={recipe}
          onClose={() => {
            setIsCookingMode(false);
            setInitialStepOverride(undefined);
          }}
          checkedSteps={checkedSteps}
          toggleStep={toggleStep}
          formatAmount={formatAmount}
          initialStepOverride={initialStepOverride}
          onRemixSuccess={onRemixSuccess}
          onReplaceCurrent={onReplaceCurrent}
        />
      )}

      {/* Recipe Copilot Chatbot */}
      {recipe.id && onRemixSuccess && (
        <RecipeCopilot
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          recipe={recipe}
          onRemixSuccess={onRemixSuccess}
          onReplaceCurrent={onReplaceCurrent!}
        />
      )}

      {/* Premium Upgrade Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onOpenChange={setIsPremiumModalOpen}
      />
    </article>
  );
}
