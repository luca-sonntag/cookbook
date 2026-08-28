export interface ParentIngredientInfo {
  name: string;
  baseName: string;
  unit?: string;
  yieldFactor?: number;
}

export interface Ingredient {
  name: string;
  baseName?: string;
  synonyms?: string[];
  parentIngredient?: ParentIngredientInfo;
  replacedOriginal?: string;
  amount: number;
  unit: string;
  gramsPerUnit?: number | null;
  notes?: string;
  modifier?: string;
  brand?: string;
  category?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  isStaple?: boolean;
  canonicalId?: string | null;
  matchedName?: string | null;
  isVerified?: boolean | null;
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

export type RecipeVisibility = 'private' | 'unlisted' | 'public';
export type RecipeOrigin = 'url' | 'photo' | 'remix';

export interface Recipe {
  id?: string;
  isRecipe?: boolean;
  createdBy?: string | null;
  visibility?: RecipeVisibility;
  origin?: RecipeOrigin;
  sourceUrl?: string | null;
  parentRecipeId?: string | null;
  title: string;
  description: string;
  emoji?: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  equipment: string[];
  nutritionalValues?: NutritionalValues;
  sourceNutritionalValues?: NutritionalValues | null;
  hasExplicitNutritionalValues?: boolean;
  nutritionCoverage?: number;
  tips?: string[];
  alternativeIngredients?: AlternativeIngredient[];
  transcript?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  imagePrompt?: string | null;
  isAiCover?: boolean;
  tags?: string[];
  sourceHandle?: string | null;
  remixPrompt?: string | null;
  parentRecipeTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
