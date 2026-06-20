import { useState, useRef, useEffect } from 'react';
import { Card, Button, Tabs } from '@heroui/react';
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
  Plus
} from 'lucide-react';
import type { Recipe, Ingredient, IngredientGroup, InstructionStep } from '../types';
import { useRecipeScaling } from '../hooks/useRecipeScaling';

interface RecipeDetailsProps {
  recipe: Recipe;
}

export default function RecipeDetails({ recipe }: RecipeDetailsProps) {
  // Checklists state (encapsulated locally!)
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Configurable servings & scaling hook
  const {
    servings,
    setServings,
    formatAmount,
    formatNutritionValue
  } = useRecipeScaling(recipe);

  // Copy state (encapsulated locally!)
  const [isCopied, setIsCopied] = useState(false);

  // Fullscreen image state
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [swipeTranslation, setSwipeTranslation] = useState(0);

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Derive images list
  const images = recipe.imageUrls && recipe.imageUrls.length > 0
    ? recipe.imageUrls
    : (recipe.imageUrl ? [recipe.imageUrl] : []);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      document.body.style.overflow = 'hidden';
      // Auto focus container to listen for keyboard events
      setTimeout(() => {
        fullscreenContainerRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = 'unset';
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setSwipeTranslation(0);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenIndex]);

  const handleNextImage = () => {
    if (fullscreenIndex === null) return;
    if (fullscreenIndex < images.length - 1) {
      setFullscreenIndex(fullscreenIndex + 1);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handlePrevImage = () => {
    if (fullscreenIndex === null) return;
    if (fullscreenIndex > 0) {
      setFullscreenIndex(fullscreenIndex - 1);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleFullscreenPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click / touch
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleFullscreenPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingImage) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (scale > 1) {
      // Pan the image itself
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Swipe visual preview
      if (images.length > 1) {
        setSwipeTranslation(dx);
      }
    }
  };

  const handleFullscreenPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingImage) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore capture release errors
    }
    setIsDraggingImage(false);

    if (scale === 1 && images.length > 1 && fullscreenIndex !== null) {
      const threshold = 80;
      if (swipeTranslation < -threshold && fullscreenIndex < images.length - 1) {
        handleNextImage();
      } else if (swipeTranslation > threshold && fullscreenIndex > 0) {
        handlePrevImage();
      }
    }
    setSwipeTranslation(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFullscreenIndex(null);
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    }
  };

  const handleFullscreenContainerClick = (e: React.MouseEvent) => {
    // Close only when clicking outside controls and the active image slide
    if (e.target === e.currentTarget) {
      setFullscreenIndex(null);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.clientX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setIsDragging(false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    setIsDragging(false);

    const dragDistance = (e.clientX - scrollContainerRef.current.offsetLeft) - startX;
    const containerWidth = scrollContainerRef.current.clientWidth;
    
    // If dragged more than 50px, act as a swipe
    if (Math.abs(dragDistance) > 50) {
      const direction = dragDistance < 0 ? 1 : -1; // drag left means go next
      const currentIndex = Math.round(scrollLeft / containerWidth);
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, (recipe.imageUrls?.length || 1) - 1));
      
      scrollContainerRef.current.scrollTo({
        left: nextIndex * containerWidth,
        behavior: 'smooth'
      });
    } else {
      // Snap back to current image if not dragged enough
      const currentIndex = Math.round(scrollLeft / containerWidth);
      scrollContainerRef.current.scrollTo({
        left: currentIndex * containerWidth,
        behavior: 'smooth'
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX); // 1:1 scroll speed
    
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleImageClick = (idx: number) => {
    if (!hasDragged) {
      setFullscreenIndex(idx);
    }
  };

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const toggleStep = (stepNum: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const copyRecipeMarkdown = () => {
    let md = `# ${recipe.title}\n\n${recipe.description}\n\n`;
    md += `**Prep Time:** ${recipe.prepTime} | **Cook Time:** ${recipe.cookTime} | **Servings:** ${servings}\n\n`;
    
    md += `## Ingredients\n`;
    recipe.ingredients.forEach((group: IngredientGroup) => {
      if (recipe.ingredients.length > 1) {
        md += `### ${group.name}\n`;
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
                      className={`w-full h-56 object-cover object-center transition-transform duration-300 ${
                        isDragging ? 'cursor-grabbing' : 'cursor-pointer'
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
          <Button
            isIconOnly
            variant="outline"
            className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onPress={copyRecipeMarkdown}
            aria-label="Copy recipe"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
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
            <Tabs.Tab id="details" className="flex-1 flex-shrink-0 px-3 text-center py-2 text-sm font-medium border-b-2 border-transparent data-[selected=true]:border-emerald-600 dark:data-[selected=true]:border-emerald-500 !text-gray-500 dark:!text-gray-400 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white transition-all cursor-pointer !bg-transparent !shadow-none !rounded-none whitespace-nowrap">
              Transcript
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
              {recipe.ingredients.map((group: IngredientGroup, groupIdx) => (
                <div key={groupIdx} className="flex flex-col gap-2.5">
                  {recipe.ingredients.length > 1 && (
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-3 border-l-2 border-emerald-500">
                      {group.name}
                    </h4>
                  )}
                  <ul className="flex flex-col gap-2">
                    {group.items.map((ing, idx) => {
                      const scaledAmount = formatAmount(ing.amount, ing.unit);
                      const amountStr = scaledAmount ? `${scaledAmount} ` : '';
                      const unitStr = ing.unit ? `${ing.unit} ` : '';
                      const name = ing.name;
                      const uniqueId = `${name}-${groupIdx}-${idx}`;
                      const isChecked = !!checkedIngredients[uniqueId];

                      return (
                        <li 
                          key={uniqueId}
                          onClick={() => toggleIngredient(uniqueId)}
                          className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm select-none transition-all ${
                            isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
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

          <Card className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Step-by-Step Instructions</h3>
            <div className="flex flex-col gap-4">
              {recipe.instructions.map((step) => {
                const isChecked = !!checkedSteps[step.step];

                return (
                  <div 
                    key={step.step}
                    onClick={() => toggleStep(step.step)}
                    className="flex items-start gap-4 p-3.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                    }`}>
                      {isChecked ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{step.step}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm leading-relaxed block select-none transition-all ${
                        isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {step.description}
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
                    <span className="bg-emerald-500/10 text-emerald-500 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-emerald-500/20">{idx+1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Tabs.Panel>

        {/* Equipment & Tips tab */}
        <Tabs.Panel id="details" className="flex flex-col gap-4">
          {recipe.transcript && (
            <Card className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Raw Audio Transcript</h3>
              <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed max-h-48 overflow-y-auto pr-2 bg-black/5 dark:bg-black/20 p-3 rounded-xl font-mono">
                {recipe.transcript}
              </p>
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
    </article>
  );
}
