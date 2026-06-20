export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
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
  title: string;
  description: string;
  prepTime: string; // e.g. "15 mins"
  cookTime: string; // e.g. "20 mins"
  servings: number;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  equipment: string[];
  nutritionalEstimates?: NutritionalEstimates;
  tips?: string[];
  alternativeIngredients?: AlternativeIngredient[];
  transcript?: string | null;
  imageUrl?: string | null;
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
