export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  category?: string;
}

export interface IngredientGroup {
  name: string;
  items: Ingredient[];
}

export interface InstructionStep {
  step: number;
  description: string;
}

export interface AlternativeIngredient {
  original: string;
  substitute: string;
  notes?: string;
}

export interface NutritionalEstimates {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  equipment: string[];
  nutritionalEstimates?: NutritionalEstimates;
  tips?: string[];
  alternativeIngredients?: AlternativeIngredient[];
  transcript?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
}

export interface Job {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed';
  recipe?: Recipe;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  recipeId?: string;
  recipeTitle?: string;
  checked: boolean;
  notes?: string;
  createdAt: string;
  category?: string;
}

export interface AggregatedShoppingItem {
  name: string;
  unit: string;
  amount: number;
  checked: boolean;
  category?: string;
  sources: { recipeId?: string; recipeTitle?: string; amount: number; unit: string }[];
}


