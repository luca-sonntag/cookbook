import type { MealPlanEntry, MealType, SavedRecipe, Ingredient } from '../../types';

export interface WeekDayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // e.g. 'Mo', 'Di'
  dayNumber: number; // e.g. 27
  isToday: boolean;
  plannedCount: number;
}

export interface MealPlannerViewProps {
  history: SavedRecipe[];
  onSelectRecipe: (recipeId: string) => void;
  onOpenCookMode?: (recipeId: string) => void;
  onOpenCookedModal?: (recipeId: string, recipeTitle: string) => void;
  addRecipeIngredients?: (ingredients: Ingredient[], recipeId: string, recipeTitle: string) => void;
}

export interface MealPlannerHeaderProps {
  weekStart: Date;
  weekEnd: Date;
  isCurrentWeek: boolean;
  plannedTotalCount: number;
  isAddingToShopping: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onShopWeek: () => void;
}

export interface WeekDayPickerProps {
  days: WeekDayInfo[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

export interface DayMealSlotsProps {
  selectedDateStr: string;
  entries: MealPlanEntry[];
  onAddRecipeToSlot: (mealType: MealType) => void;
  onUpdateServings: (id: string, servings: number) => void;
  onToggleCooked: (entry: MealPlanEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSelectRecipe: (recipeId: string) => void;
  onOpenCookMode?: (recipeId: string) => void;
}

export interface MealPlanCardProps {
  entry: MealPlanEntry;
  onUpdateServings: (id: string, servings: number) => void;
  onToggleCooked: (entry: MealPlanEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSelectRecipe: (recipeId: string) => void;
  onOpenCookMode?: (recipeId: string) => void;
}

export interface RecipePickerModalProps {
  isOpen: boolean;
  mealType: MealType | null;
  dateStr: string;
  history: SavedRecipe[];
  onClose: () => void;
  onSelectRecipe: (recipe: SavedRecipe) => void;
}
