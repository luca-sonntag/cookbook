import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Recipe, Ingredient } from '../../types';
import type { RecipeSectionId, SortedIngredientGroup } from './types';
import { useRecipeScaling } from '../../hooks/useRecipeScaling';
import { useRecipeProgress } from '../../hooks/useRecipeProgress';
import { useRecipeNutrition } from '../../hooks/useRecipeNutrition';
import { categoryOrder, legacyCategoryMap } from '../../i18n';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { useTimerManager } from '../../hooks/useTimerManager';
import { useGamification } from '../../context/GamificationContext';
import { useCookHistory } from '../../hooks/useCookHistory';
import { useAuth } from '../../context/AuthContext';
import { stripInlineIngredientTags } from '../../utils/ingredientMatch';

interface UseRecipeDetailsOptions {
  recipe: Recipe;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  onNavigateToShoppingList?: () => void;
}

export function useRecipeDetails({ recipe, onAddIngredients, onNavigateToShoppingList }: UseRecipeDetailsOptions) {
  const { t, translateCategory } = useI18n();
  const toast = useToast();
  const { isPremium } = useAuth();

  // Checklists state (persisted in localStorage)
  const { checkedSteps, toggleStep } = useRecipeProgress(recipe);

  // Configurable servings & scaling hook
  const { servings, setServings, scaleFactor, formatAmount } = useRecipeScaling(recipe);

  // Local UI states
  const [isCopied, setIsCopied] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [isCookedModalOpen, setIsCookedModalOpen] = useState(false);
  const [initialStepOverride, setInitialStepOverride] = useState<number | undefined>(undefined);
  const [isShoppingConfirmOpen, setIsShoppingConfirmOpen] = useState(false);
  const [isAddToPlanOpen, setIsAddToPlanOpen] = useState(false);
  const [shouldNavigateAfterAdd, setShouldNavigateAfterAdd] = useState(false);

  // Timer & gamification
  const { pendingNavigation, setPendingNavigation } = useTimerManager();
  const { snapshot } = useGamification();
  const cookRefreshKey = snapshot?.stats?.totalCooks ?? 0;
  const { history: cookHistory } = useCookHistory(recipe.id, cookRefreshKey);

  // Scroll spy state
  const [activeSection, setActiveSection] = useState<RecipeSectionId>('details');
  const [collapseSentinel, setCollapseSentinel] = useState<HTMLDivElement | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Nutrition display
  const [showTotalNutrition, setShowTotalNutrition] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('recipe_show_total_nutrition');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const { nutritionalValues, sourceNutritionalValues, isAiEstimated, isVerified, hasNutritionInfo } =
    useRecipeNutrition(recipe);

  // Dev mode logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🍳 [DevMode] Full Recipe Model:', recipe);
    }
  }, [recipe]);

  // --- Scroll spy effect ---
  useEffect(() => {
    const handleScroll = () => {
      const stickyTopHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--app-sticky-top') || '0',
        10
      );

      const stickyBar = document.getElementById('recipe-sticky-bar');
      if (stickyBar) {
        const barRect = stickyBar.getBoundingClientRect();
        const isStuck = barRect.top <= stickyTopHeight + 1;
        const isPastHeader = collapseSentinel
          ? collapseSentinel.getBoundingClientRect().top <= stickyTopHeight + 2
          : isStuck;
        setIsHeaderCollapsed(isStuck && isPastHeader);
      }

      const sections: RecipeSectionId[] = ['ingredients', 'instructions', 'details'];
      const offset = stickyTopHeight + 48 + 120;
      const scrollPosition = window.scrollY + offset;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [recipe, collapseSentinel]);

  // --- Timer navigation effects ---
  useEffect(() => {
    if (
      pendingNavigation &&
      pendingNavigation.stepNum !== undefined &&
      (pendingNavigation.recipeId === recipe.id || pendingNavigation.recipeId === recipe.title)
    ) {
      setInitialStepOverride(pendingNavigation.stepNum - 1);
      setIsCookingMode(true);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, recipe.id, recipe.title, setPendingNavigation]);

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

  // --- Scroll to section ---
  const scrollToSection = useCallback((sectionId: RecipeSectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const stickyTopHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--app-sticky-top') || '0',
      10
    );
    const bar = document.getElementById('recipe-sticky-bar');
    const barHeight = bar?.offsetHeight ?? 44;
    const reserved = Math.max(barHeight, 96);
    const offset = stickyTopHeight + reserved + 20;
    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
  }, []);

  // --- Step toggle handler ---
  const handleToggleStep = useCallback((stepNum: number) => {
    const instructions = recipe.instructions ?? [];
    const isCurrentlyChecked = !!checkedSteps[stepNum];
    const currentIdx = instructions.findIndex((s) => s.step === stepNum);
    toggleStep(stepNum);

    if (!isCurrentlyChecked && instructions.length > 0 && currentIdx === instructions.length - 1 && recipe.id) {
      setIsCookedModalOpen(true);
    }
  }, [recipe.instructions, recipe.id, checkedSteps, toggleStep]);

  // --- Steps progress ---
  const activeStepNum = useMemo(() => {
    if (!recipe.instructions) return null;
    const activeStep = recipe.instructions.find(s => !checkedSteps[s.step]);
    return activeStep ? activeStep.step : null;
  }, [recipe.instructions, checkedSteps]);

  const totalStepsCount = recipe.instructions ? recipe.instructions.length : 0;
  const completedStepsCount = useMemo(() => {
    if (!recipe.instructions) return 0;
    return recipe.instructions.filter(s => !!checkedSteps[s.step]).length;
  }, [recipe.instructions, checkedSteps]);
  const progressPercent = totalStepsCount > 0 ? (completedStepsCount / totalStepsCount) * 100 : 0;

  // --- Time & nutrition helpers ---
  const totalTimeLabel = useMemo(() => {
    const minutesOf = (time: string | number | null | undefined): number | null => {
      if (time === undefined || time === null || time === '') return null;
      if (typeof time === 'number') return time;
      const match = String(time).match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    };
    const total = [minutesOf(recipe.prepTime), minutesOf(recipe.cookTime)]
      .filter((v): v is number => v !== null)
      .reduce((sum, v) => sum + v, 0);
    return total > 0 ? t('recipe.minutes', { count: total }) : null;
  }, [recipe.prepTime, recipe.cookTime, t]);

  const metaCalories = useMemo(() => {
    const raw = nutritionalValues?.calories;
    if (raw === undefined || raw === null) return null;
    return raw > 0 ? Math.round(raw) : null;
  }, [nutritionalValues]);

  const formatTimeValue = useCallback((time: string | number | null | undefined) => {
    if (time === undefined || time === null || time === '') return 'N/A';
    if (typeof time === 'number') return t('recipe.minutes', { count: time });
    const strTime = String(time).trim();
    const match = strTime.match(/\d+/);
    if (match) return t('recipe.minutes', { count: match[0] });
    return strTime;
  }, [t]);

  const getNutritionDisplayValue = useCallback((
    val: string | number | null | undefined,
    unit: string = 'g',
    isTotal: boolean = false,
    includeUnit: boolean = true
  ) => {
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
    const finalVal = isTotal ? numericVal * servings : numericVal;
    const displayUnit = originalUnit || unit;
    const rounded = Math.round(finalVal);
    return includeUnit ? `${rounded}${displayUnit}` : String(rounded);
  }, [servings]);

  const handleToggleTotalNutrition = useCallback((isTotal: boolean) => {
    setShowTotalNutrition(isTotal);
    try {
      localStorage.setItem('recipe_show_total_nutrition', JSON.stringify(isTotal));
    } catch (e) {
      console.error('Error saving showTotalNutrition to localStorage', e);
    }
  }, []);

  // --- Sorted ingredients ---
  const sortedIngredients: SortedIngredientGroup[] = useMemo(() => {
    if (!recipe.ingredients) return [];
    const mapped = recipe.ingredients.map((group, originalIdx) => ({ group, originalIdx }));
    return mapped.sort((a, b) => {
      const getCategoryIndex = (name: string) => {
        const cleanName = name.trim().toUpperCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let idx = categoryOrder.indexOf(cleanName as any);
        if (idx !== -1) return idx;
        const lowerName = name.trim().toLowerCase();
        const enumKey = legacyCategoryMap[lowerName];
        if (enumKey) return categoryOrder.indexOf(enumKey);
        return 999;
      };
      return getCategoryIndex(a.group.name) - getCategoryIndex(b.group.name);
    });
  }, [recipe.ingredients]);

  // --- Shopping list handlers ---
  const handleAddToShoppingList = useCallback(() => {
    setShouldNavigateAfterAdd(false);
    setIsShoppingConfirmOpen(true);
  }, []);

  const handleAddAndNavigateToShoppingList = useCallback(() => {
    setShouldNavigateAfterAdd(true);
    setIsShoppingConfirmOpen(true);
  }, []);

  const handleConfirmShoppingListSelection = useCallback((itemsToAdd: Ingredient[]) => {
    if (!onAddIngredients) return;
    if (itemsToAdd.length === 0) return;
    const recipeId = recipe.id || recipe.title;
    onAddIngredients(itemsToAdd, recipeId, recipe.title);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    const title =
      itemsToAdd.length === 1
        ? t('toast.ingredientsAddedSingle', { name: itemsToAdd[0].name })
        : t('toast.ingredientsAddedMany', { count: itemsToAdd.length });

    toast.success(title, {
      description: recipe.title,
      action: onNavigateToShoppingList
        ? { label: t('toast.viewShoppingList'), onClick: () => onNavigateToShoppingList() }
        : undefined,
    });

    if (shouldNavigateAfterAdd) {
      onNavigateToShoppingList?.();
    }
  }, [onAddIngredients, recipe.id, recipe.title, t, toast, onNavigateToShoppingList, shouldNavigateAfterAdd]);

  // --- Cooking mode handler ---
  const handleStartCooking = useCallback(() => {
    if (isPremium) {
      setIsCookingMode(true);
    } else {
      setIsPremiumModalOpen(true);
    }
  }, [isPremium]);

  // --- Clipboard copy ---
  const copyRecipe = useCallback(() => {
    const hasGroups = recipe.ingredients.length > 1;
    const metaLine = `${t('recipe.prep')}: ${formatTimeValue(recipe.prepTime)} · ${t('recipe.cook')}: ${formatTimeValue(recipe.cookTime)} · ${t('recipe.serves')}: ${servings}`;

    const formatIngredientLine = (ing: Ingredient) => {
      const scaledAmount = formatAmount(ing.amount, ing.unit);
      const amountStr = scaledAmount ? `${scaledAmount} ` : '';
      const unitStr = ing.unit ? `${ing.unit} ` : '';
      const modifierStr = ing.modifier ? ` (${ing.modifier})` : '';
      const noteStr = ing.notes ? ` (${ing.notes})` : '';
      return `${amountStr}${unitStr}${ing.name}${modifierStr}${noteStr}`;
    };

    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // --- Plain text ---
    let text = `${recipe.title}\n\n`;
    if (recipe.description) text += `${stripInlineIngredientTags(recipe.description)}\n\n`;
    text += `${metaLine}\n\n`;
    text += `${t('recipe.tabIngredients')}\n`;
    sortedIngredients.forEach(({ group }) => {
      if (hasGroups) text += `${translateCategory(group.name)}\n`;
      group.items.forEach((ing) => { text += `• ${formatIngredientLine(ing)}\n`; });
      if (hasGroups) text += `\n`;
    });
    if (!hasGroups) text += `\n`;
    text += `${t('recipe.tabInstructions')}\n`;
    recipe.instructions.forEach((step) => { text += `${step.step}. ${stripInlineIngredientTags(step.description)}\n`; });
    text += `\n`;
    if (recipe.equipment && recipe.equipment.length > 0) {
      text += `${t('recipe.requiredEquipment')}\n`;
      recipe.equipment.forEach((item) => { text += `• ${stripInlineIngredientTags(item)}\n`; });
      text += `\n`;
    }
    if (recipe.tips && recipe.tips.length > 0) {
      text += `${t('recipe.tipsTitle')}\n`;
      recipe.tips.forEach((tip) => { text += `• ${stripInlineIngredientTags(tip)}\n`; });
      text += `\n`;
    }

    // --- Rich text (HTML) ---
    let html = `<h1>${escapeHtml(recipe.title)}</h1>`;
    if (recipe.description) html += `<p>${escapeHtml(stripInlineIngredientTags(recipe.description))}</p>`;
    html += `<p><strong>${escapeHtml(t('recipe.prep'))}:</strong> ${escapeHtml(formatTimeValue(recipe.prepTime))} · <strong>${escapeHtml(t('recipe.cook'))}:</strong> ${escapeHtml(formatTimeValue(recipe.cookTime))} · <strong>${escapeHtml(t('recipe.serves'))}:</strong> ${servings}</p>`;
    html += `<h2>${escapeHtml(t('recipe.tabIngredients'))}</h2>`;
    sortedIngredients.forEach(({ group }) => {
      if (hasGroups) html += `<h3>${escapeHtml(translateCategory(group.name))}</h3>`;
      html += `<ul>`;
      group.items.forEach((ing) => { html += `<li>${escapeHtml(formatIngredientLine(ing))}</li>`; });
      html += `</ul>`;
    });
    html += `<h2>${escapeHtml(t('recipe.tabInstructions'))}</h2><ol>`;
    recipe.instructions.forEach((step) => { html += `<li>${escapeHtml(stripInlineIngredientTags(step.description))}</li>`; });
    html += `</ol>`;
    if (recipe.equipment && recipe.equipment.length > 0) {
      html += `<h2>${escapeHtml(t('recipe.requiredEquipment'))}</h2><ul>`;
      recipe.equipment.forEach((item) => { html += `<li>${escapeHtml(stripInlineIngredientTags(item))}</li>`; });
      html += `</ul>`;
    }
    if (recipe.tips && recipe.tips.length > 0) {
      html += `<h2>${escapeHtml(t('recipe.tipsTitle'))}</h2><ul>`;
      recipe.tips.forEach((tip) => { html += `<li>${escapeHtml(stripInlineIngredientTags(tip))}</li>`; });
      html += `</ul>`;
    }

    const markCopied = () => {
      setIsCopied(true);
      toast.success(t('toast.recipeCopied'));
      setTimeout(() => setIsCopied(false), 2000);
    };

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
      navigator.clipboard.writeText(text).then(markCopied).catch(() => { });
    });
  }, [recipe, sortedIngredients, servings, formatAmount, formatTimeValue, t, translateCategory, toast]);

  return {
    // Auth & premium
    isPremium,
    isPremiumModalOpen,
    setIsPremiumModalOpen,

    // Scaling
    servings,
    setServings,
    scaleFactor,
    formatAmount,

    // Steps & progress
    checkedSteps,
    toggleStep,
    handleToggleStep,
    activeStepNum,
    totalStepsCount,
    completedStepsCount,
    progressPercent,

    // Scroll spy
    activeSection,
    isHeaderCollapsed,
    setCollapseSentinel,
    scrollToSection,

    // Nutrition
    nutritionalValues,
    sourceNutritionalValues,
    isAiEstimated,
    isVerified,
    hasNutritionInfo,
    showTotalNutrition,
    handleToggleTotalNutrition,
    formatTimeValue,
    getNutritionDisplayValue,
    totalTimeLabel,
    metaCalories,

    // Sorted ingredients
    sortedIngredients,

    // UI state
    isCopied,
    isCopilotOpen,
    setIsCopilotOpen,
    isCookingMode,
    setIsCookingMode,
    initialStepOverride,
    setInitialStepOverride,
    isCookedModalOpen,
    setIsCookedModalOpen,
    isAdded,
    isShoppingConfirmOpen,
    setIsShoppingConfirmOpen,
    isAddToPlanOpen,
    setIsAddToPlanOpen,

    // Handlers
    handleStartCooking,
    handleAddToShoppingList,
    handleAddAndNavigateToShoppingList,
    handleConfirmShoppingListSelection,
    copyRecipe,

    // Gamification & cook history
    cookRefreshKey,
    cookHistory,
  };
}
