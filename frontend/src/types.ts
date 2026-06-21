export interface Ingredient {
  name: string;
  baseName?: string;
  amount: number;
  unit: string;
  notes?: string;
  category?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
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
  calories?: number | null;
  protein?: string | null;
  carbs?: string | null;
  fat?: string | null;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  prepTime: number | null;
  cookTime: number | null;
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
  tags?: string[];
  instagramHandle?: string | null;
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
  baseName?: string;
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
  baseName?: string;
  unit: string;
  amount: number;
  checked: boolean;
  category?: string;
  sources: { recipeId?: string; recipeTitle?: string; amount: number; unit: string }[];
}


