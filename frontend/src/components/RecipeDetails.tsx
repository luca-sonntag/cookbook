import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Tabs, Popover } from '@heroui/react';
import {
  Check,
  Copy,
  Clock,
  Utensils,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  X,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  Play,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Trash2
} from 'lucide-react';
import type { Recipe, Ingredient, InstructionStep } from '../types';
import { useRecipeScaling } from '../hooks/useRecipeScaling';
import { useImageGallery } from '../hooks/useImageGallery';
import { useRecipeProgress } from '../hooks/useRecipeProgress';
import {
  translateCategory,
  getCategoryIcon,
  categoryOrder,
  legacyCategoryMap
} from '../i18n';
import { useDialog } from '../context/DialogContext';

interface RecipeDetailsProps {
  recipe: Recipe;
  onAddIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
  onDelete?: () => void;
}

export default function RecipeDetails({ recipe, onAddIngredients, onDelete }: RecipeDetailsProps) {
  const dialog = useDialog();
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
  const [cookingStepIndex, setCookingStepIndex] = useState(0);
  const [wakeLock, setWakeLock] = useState<any>(null);

  // Touch state for swipe gestures in Cooking Mode
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Flat list of ingredients
  const allIngredients = useMemo(() => {
    return recipe.ingredients ? recipe.ingredients.flatMap(g => g.items) : [];
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

  // Highlights ingredients and equipment in instructions text
  const highlightText = (text: string) => {
    if (!text) return text;
    if (!recipe.ingredients && !recipe.equipment) return <span>{text}</span>;

    const terms: { term: string; type: 'ingredient' | 'equipment'; original: string; info: string }[] = [];

    // Add ingredients
    allIngredients.forEach(ing => {
      const scaledAmount = formatAmount(ing.amount, ing.unit);
      const amountStr = scaledAmount ? `${scaledAmount} ` : '';
      const unitStr = ing.unit ? `${ing.unit} ` : '';
      const noteStr = ing.notes ? ` (${ing.notes})` : '';
      const info = `Zutat: ${ing.name} (${amountStr}${unitStr}${noteStr})`.trim();

      if (ing.name && ing.name.length > 2) {
        terms.push({ term: ing.name.toLowerCase(), type: 'ingredient', original: ing.name, info });
      }
      if (ing.baseName && ing.baseName.length > 2) {
        terms.push({ term: ing.baseName.toLowerCase(), type: 'ingredient', original: ing.name, info });
      }
    });

    // Add equipment
    if (recipe.equipment) {
      recipe.equipment.forEach(eq => {
        if (eq && eq.length > 2) {
          terms.push({ term: eq.toLowerCase(), type: 'equipment', original: eq, info: `Gerät: ${eq}` });
        }
      });
    }

    // Sort by term length descending to match longest terms first
    terms.sort((a, b) => b.term.length - a.term.length);

    // Remove duplicates
    const uniqueTerms = terms.filter((item, index, self) =>
      self.findIndex(t => t.term === item.term) === index
    );

    if (uniqueTerms.length === 0) return <span>{text}</span>;

    const escapedTerms = uniqueTerms.map(t => t.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) => {
          const matched = uniqueTerms.find(t => t.term === part.toLowerCase());
          if (matched) {
            const isIng = matched.type === 'ingredient';
            return (
              <span key={index} onClick={(e) => e.stopPropagation()}>
                <Popover>
                  <Popover.Trigger>
                    <span className={`inline-block font-semibold decoration-dotted underline underline-offset-4 cursor-pointer transition-all outline-none ${isIng
                        ? 'text-emerald-600 dark:text-emerald-400 decoration-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-300'
                        : 'text-amber-600 dark:text-amber-400 decoration-amber-500 hover:text-amber-500 dark:hover:text-amber-300'
                      }`}>
                      {part}
                    </span>
                  </Popover.Trigger>
                  <Popover.Content
                    placement="top"
                    className="bg-black/90 dark:bg-white/95 text-white dark:text-gray-900 shadow-md rounded-lg backdrop-blur-sm border border-white/10 dark:border-black/10 px-2 py-1.5"
                  >
                    <Popover.Dialog className="outline-none border-none p-0 m-0">
                      <span className="text-xs font-semibold">{matched.info}</span>
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </span>
            );
          }
          return part;
        })}
      </>
    );
  };

  // Find ingredients mentioned in a specific step description
  const getIngredientsForStep = (description: string) => {
    if (!description) return [];
    const mentioned: Ingredient[] = [];
    allIngredients.forEach(ing => {
      const term1 = ing.baseName?.toLowerCase();
      const term2 = ing.name.toLowerCase();
      const descLower = description.toLowerCase();
      if ((term1 && descLower.includes(term1)) || descLower.includes(term2)) {
        if (!mentioned.some(m => m.name === ing.name)) {
          mentioned.push(ing);
        }
      }
    });
    return mentioned;
  };

  // Cooking Mode navigations
  const handleNextCookingStep = () => {
    if (recipe.instructions && cookingStepIndex < recipe.instructions.length - 1) {
      setCookingStepIndex(prev => prev + 1);
    }
  };

  const handlePrevCookingStep = () => {
    if (cookingStepIndex > 0) {
      setCookingStepIndex(prev => prev - 1);
    }
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 60) {
      handleNextCookingStep();
    } else if (diff < -60) {
      handlePrevCookingStep();
    }
    setTouchStartX(null);
  };

  // Keyboard navigation for Cooking Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCookingMode) return;
      if (e.key === 'ArrowRight') {
        handleNextCookingStep();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCookingStep();
      } else if (e.key === 'Escape') {
        setIsCookingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCookingMode, cookingStepIndex, recipe.instructions]);

  // Screen Wake Lock control
  useEffect(() => {
    const requestWakeLock = async () => {
      const nav = navigator as any;
      if (isCookingMode && nav.wakeLock) {
        try {
          const lock = await nav.wakeLock.request('screen');
          setWakeLock(lock);
        } catch (err) {
          console.warn('Could not acquire Screen Wake Lock:', err);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          setWakeLock(null);
        }).catch((err: any) => {
          console.warn('Error releasing Wake Lock:', err);
        });
      }
    };

    if (isCookingMode) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => { });
      }
    };
  }, [isCookingMode]);

  // Initialize cooking mode step index when entering
  const startCooking = () => {
    // Find the first uncompleted step, default to step 0
    if (recipe.instructions) {
      const firstUncompleted = recipe.instructions.findIndex(s => !checkedSteps[s.step]);
      setCookingStepIndex(firstUncompleted !== -1 ? firstUncompleted : 0);
    } else {
      setCookingStepIndex(0);
    }
    setIsCookingMode(true);
  };

  // Derive images list
  const images = recipe.imageUrls && recipe.imageUrls.length > 0
    ? recipe.imageUrls
    : (recipe.imageUrl ? [recipe.imageUrl] : []);

  // Image gallery & fullscreen zoom hook
  const {
    fullscreenIndex,
    setFullscreenIndex,
    scale,
    offset,
    swipeTranslation,
    isDraggingImage,
    fullscreenContainerRef,
    scrollContainerRef,
    isDragging,
    handleNextImage,
    handlePrevImage,
    handleDoubleTap,
    handleFullscreenPointerDown,
    handleFullscreenPointerMove,
    handleFullscreenPointerUp,
    handleKeyDown,
    handleFullscreenContainerClick,
    handlePointerDown,
    handlePointerLeave,
    handlePointerUp,
    handlePointerMove,
    handleImageClick,
  } = useImageGallery(images);
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
        title: 'Bereits hinzugefügt',
        message: 'Alle Zutaten dieses Rezepts sind bereits abgehakt!',
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
    md += `**Prep Time:** ${recipe.prepTime} | **Cook Time:** ${recipe.cookTime} | **Servings:** ${servings}\n\n`;

    md += `## Ingredients\n`;
    sortedIngredients.forEach(({ group }) => {
      if (recipe.ingredients.length > 1) {
        md += `### ${getCategoryIcon(group.name)} ${translateCategory(group.name)}\n`;
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

    md += `## Instructions\n`;
    recipe.instructions.forEach((step: InstructionStep) => {
      md += `${step.step}. ${step.description}\n`;
    });
    md += `\n`;

    if (recipe.equipment && recipe.equipment.length > 0) {
      md += `## Equipment\n`;
      recipe.equipment.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (recipe.tips && recipe.tips.length > 0) {
      md += `## Chef Tips\n`;
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
        {/* Image Gallery */}
        {(recipe.imageUrls && recipe.imageUrls.length > 0) ? (
          <div className="-mt-6 -mx-6 mb-6 relative group">
            <div
              ref={scrollContainerRef}
              onPointerDown={handlePointerDown}
              onPointerLeave={handlePointerLeave}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              className={`flex overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'md:cursor-pointer cursor-grab snap-x snap-mandatory'}`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {recipe.imageUrls.map((img, idx) => {
                const src = img.startsWith('/') ? img : `/api/image?url=${encodeURIComponent(img)}`;
                return (
                  <div key={idx} className="w-full shrink-0 snap-center relative">
                    <img
                      src={src}
                      draggable={false}
                      alt={`${recipe.title} - view ${idx + 1}`}
                      className={`w-full h-56 object-cover object-center transition-transform duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                        }`}
                      onClick={() => handleImageClick(idx)}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none opacity-80 backdrop-blur-sm">
                      {idx + 1} / {recipe.imageUrls?.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : recipe.imageUrl ? (
          <div className="-mt-6 -mx-6 mb-6 bg-black/5 dark:bg-white/5 relative">
            <img
              src={recipe.imageUrl.startsWith('/') ? recipe.imageUrl : `/api/image?url=${encodeURIComponent(recipe.imageUrl)}`}
              alt={recipe.title}
              className="w-full h-56 object-cover object-center cursor-pointer"
              onClick={() => {
                setFullscreenIndex(0);
              }}
            />
          </div>
        ) : null}

        {/* Recipe title header */}
        <div className="flex justify-between items-start gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{recipe.title}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{recipe.description}</p>
          </div>
          <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} placement="bottom-end">
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
            <Popover.Content className="p-1 min-w-[160px] bg-white dark:bg-gray-950 border border-black/10 dark:border-white/10 rounded-xl shadow-lg">
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
                      <span className="text-emerald-500 font-semibold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Rezept kopieren</span>
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
                    <span>Rezept löschen</span>
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
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Prep</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{recipe.prepTime || 'N/A'}</span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <Utensils className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Cook</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{recipe.cookTime || 'N/A'}</span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center">
            <ListChecks className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Serves</span>
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
        {recipe.nutritionalEstimates && (
          <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-black/5 dark:border-white/5">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nutritional Estimates</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{formatNutritionValue(recipe.nutritionalEstimates.calories)}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">kcal</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{formatNutritionValue(recipe.nutritionalEstimates.protein)}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">Protein</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{formatNutritionValue(recipe.nutritionalEstimates.carbs)}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">Carbs</div>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{formatNutritionValue(recipe.nutritionalEstimates.fat)}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">Fat</div>
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
              Ingredients
            </Tabs.Tab>
            <Tabs.Tab id="steps" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-600 dark:data-[selected=true]:border-emerald-500 !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white transition-all cursor-pointer !bg-transparent !shadow-none !rounded-none whitespace-nowrap">
              Instructions
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Ingredients tab */}
        <Tabs.Panel id="ingredients" className="flex flex-col gap-4">
          <Card className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center justify-between">
              <span>Ingredients Checklist</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 normal-case font-normal">Check ingredients you have prepared</span>
            </h3>
            <div className="flex flex-col gap-6">
              {sortedIngredients.map(({ group, originalIdx }, sortedIdx) => (
                <div key={sortedIdx} className="flex flex-col gap-2.5">
                  {recipe.ingredients.length > 1 && (
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-3 border-l-2 border-emerald-500 flex items-center gap-1.5">
                      <span className="text-sm">{getCategoryIcon(group.name)}</span>
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
                    <span>In Einkaufsliste hinzugefügt!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Zur Einkaufsliste hinzufügen</span>
                  </>
                )}
              </Button>
            )}
          </Card>

          {recipe.alternativeIngredients && recipe.alternativeIngredients.length > 0 && (
            <Card className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Alternative Ingredients</h3>
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
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Required Equipment</h3>
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
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Kochfortschritt</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {completedStepsCount} von {totalStepsCount} Schritten ({Math.round(progressPercent)}%)
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
                onPress={startCooking}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Kochen starten</span>
              </Button>
            </div>
          </Card>

          <Card className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Step-by-Step Instructions</h3>
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
                          Aktueller Schritt
                        </span>
                      )}
                      <span className={`text-sm leading-relaxed block select-none transition-all ${isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                        {highlightText(step.description)}
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
                <span>Chef Cooking Tips</span>
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

      {/* Fullscreen Image Overlay */}
      {fullscreenIndex !== null && images.length > 0 && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0 m-0 select-none overflow-hidden touch-none outline-none"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          onClick={handleFullscreenContainerClick}
        >
          {/* Top Controls Overlay */}
          <div className="absolute top-4 right-4 z-[101] flex items-center gap-2">
            {/* Zoom Toggle Button */}
            <Button
              isIconOnly
              variant="ghost"
              onPress={handleDoubleTap}
              className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full border-none"
              aria-label={scale > 1 ? "Zoom Out" : "Zoom In"}
            >
              {scale > 1 ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
            </Button>
            {/* Close Button */}
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => setFullscreenIndex(null)}
              className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full border-none"
              aria-label="Close fullscreen"
            >
              <X size={22} />
            </Button>
          </div>

          {/* Carousel Slider */}
          <div
            className="w-full h-full flex items-center justify-center relative"
            onPointerDown={handleFullscreenPointerDown}
            onPointerMove={handleFullscreenPointerMove}
            onPointerUp={handleFullscreenPointerUp}
            onPointerCancel={handleFullscreenPointerUp}
            onDoubleClick={handleDoubleTap}
          >
            <div
              className={`flex w-full h-full ${!isDraggingImage ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{
                transform: `translateX(calc(-${fullscreenIndex * 100}% + ${swipeTranslation}px))`
              }}
            >
              {images.map((imgUrl, idx) => {
                const src = imgUrl.startsWith('/') ? imgUrl : `/api/image?url=${encodeURIComponent(imgUrl)}`;
                return (
                  <div
                    key={idx}
                    className="w-full h-full shrink-0 flex items-center justify-center overflow-hidden"
                    onClick={(e) => {
                      // Prevent background click handler from closing when clicking inside the slide
                      e.stopPropagation();
                    }}
                  >
                    <img
                      src={src}
                      alt={`Fullscreen view ${idx + 1}`}
                      draggable={false}
                      className="max-w-[80%] max-h-[80dvh] object-contain select-none pointer-events-auto"
                      style={{
                        transform: idx === fullscreenIndex ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : 'scale(1)',
                        cursor: idx === fullscreenIndex && scale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'pointer',
                        transition: idx === fullscreenIndex && !isDraggingImage ? 'transform 200ms ease-out' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows (Desktop) */}
          {images.length > 1 && scale === 1 && (
            <>
              {fullscreenIndex > 0 && (
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-[101] text-white/50 hover:text-white bg-black/30 hover:bg-black/60 rounded-full border-none hidden md:flex"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </Button>
              )}
              {fullscreenIndex < images.length - 1 && (
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-[101] text-white/50 hover:text-white bg-black/30 hover:bg-black/60 rounded-full border-none hidden md:flex"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </Button>
              )}
            </>
          )}

          {/* Page Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-[101] backdrop-blur-sm">
              {fullscreenIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      {/* Cooking Mode Fullscreen Overlay */}
      {isCookingMode && (
        <div
          className="fixed inset-0 z-[90] bg-white dark:bg-gray-950 flex flex-col justify-between p-4 md:p-8 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Kochmodus</span>
            </div>
            {/* Progress indicator */}
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Schritt {cookingStepIndex + 1} von {recipe.instructions.length}
            </div>
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => setIsCookingMode(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-none"
              aria-label="Kochmodus beenden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress bar at the top */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${((cookingStepIndex + 1) / recipe.instructions.length) * 100}%` }}
            />
          </div>

          {/* Central Instruction Step Card */}
          <div className="flex-1 flex flex-col justify-center items-center my-6 max-w-4xl mx-auto w-full px-4 text-center">
            {/* Step Number Badge */}
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              {recipe.instructions[cookingStepIndex]?.step}
            </div>

            {/* Step Description */}
            <h1 className="text-2xl md:text-3.5xl font-bold text-gray-900 dark:text-white leading-relaxed mb-8 max-h-[40dvh] overflow-y-auto px-2">
              {highlightText(recipe.instructions[cookingStepIndex]?.description)}
            </h1>

            {/* Contextual Ingredients needed for this step */}
            {getIngredientsForStep(recipe.instructions[cookingStepIndex]?.description).length > 0 && (
              <div className="w-full max-w-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-left backdrop-blur-sm">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zutaten für diesen Schritt:</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {getIngredientsForStep(recipe.instructions[cookingStepIndex]?.description).map((ing, i) => {
                    const scaledAmount = formatAmount(ing.amount, ing.unit);
                    const amountStr = scaledAmount ? `${scaledAmount} ` : '';
                    const unitStr = ing.unit ? `${ing.unit} ` : '';
                    return (
                      <li key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-white/50 dark:bg-black/35 border border-black/5 dark:border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{amountStr}{unitStr}</span>
                        <span className="text-gray-700 dark:text-gray-300">{ing.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col gap-4 max-w-md mx-auto w-full border-t border-black/5 dark:border-white/5 pt-4">
            <div className="flex gap-3 justify-between items-center w-full">
              <Button
                variant="outline"
                onPress={handlePrevCookingStep}
                isDisabled={cookingStepIndex === 0}
                className="flex-1 py-3 h-12 rounded-xl font-semibold border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>

              {/* Mark Completed & Next Button */}
              {cookingStepIndex === recipe.instructions.length - 1 ? (
                <Button
                  className="flex-[2] py-3 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  onPress={() => {
                    const currentStepNum = recipe.instructions[cookingStepIndex].step;
                    if (!checkedSteps[currentStepNum]) {
                      toggleStep(currentStepNum);
                    }
                    setIsCookingMode(false);
                    dialog.alert({
                      title: 'Fertig!',
                      message: 'Guten Appetit! Du hast das Rezept erfolgreich zubereitet.',
                      status: 'success'
                    });
                  }}
                >
                  Fertigstellen
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-[2] py-3 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  onPress={() => {
                    const currentStepNum = recipe.instructions[cookingStepIndex].step;
                    if (!checkedSteps[currentStepNum]) {
                      toggleStep(currentStepNum);
                    }
                    handleNextCookingStep();
                  }}
                >
                  Erledigt & Weiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
            <div className="text-[10px] text-center text-gray-500 dark:text-gray-400">
              Tipp: Nutze die Pfeiltasten ← → auf dem Desktop oder wische nach links/rechts auf dem Handy.
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
