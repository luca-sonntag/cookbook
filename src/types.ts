export interface Ingredient {
  name: string;
  baseName?: string;
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
  protein: string; // e.g. "20g"
  carbs: string;   // e.g. "30g"
  fat: string;     // e.g. "10g"
}

export interface Recipe {
  id?: string;
  isRecipe?: boolean;
  title: string;
  description: string;

  prepTime: string; // e.g. "15 mins"
  cookTime: string; // e.g. "20 mins"
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

export type JobStatus = 'pending' | 'scraping' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  error?: string | null;
  recipe?: Recipe | null;
  createdAt: string;
  updatedAt: string;
}
