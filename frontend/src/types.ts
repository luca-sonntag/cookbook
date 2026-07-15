export interface Ingredient {
  name: string;
  baseName?: string;
  replacedOriginal?: string;
  amount: number;
  unit: string;
  notes?: string;
  modifier?: string;
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

export interface NutritionalValues {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
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
  nutritionalValues?: NutritionalValues;
  tips?: string[];
  alternativeIngredients?: AlternativeIngredient[];
  transcript?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  tags?: string[];
  instagramHandle?: string | null;
  parentJobId?: string | null;
  parentRecipeTitle?: string | null;
  remixPrompt?: string | null;
}

export type ProgressStage = 'queued' | 'scraping' | 'downloading_media' | 'extracting_frames' | 'extracting_recipe' | 'finalizing';

export interface ProgressData {
  isProgress: true;
  percent: number;
  stage: ProgressStage;
}

export interface Job {
  id: string;
  url: string;
  status: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed';
  recipe?: Recipe;
  progress?: ProgressData;
  error?: string;
  parentJobId?: string | null;
  prompt?: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  flags?: string[];
  collectionIds?: string[];
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
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
  modifier?: string;
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
  modifier?: string;
  sources: { recipeId?: string; recipeTitle?: string; amount: number; unit: string }[];
}


