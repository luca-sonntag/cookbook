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
  isStaple?: boolean;
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
  isRecipe?: boolean;
  title: string;
  description: string;
  emoji?: string | null;

  prepTime: number | null; // prep time in minutes
  cookTime: number | null; // cook time in minutes
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

export type JobStatus = 'pending' | 'scraping' | 'processing' | 'completed' | 'failed';

export type ProgressStage = 'queued' | 'scraping' | 'downloading_media' | 'extracting_frames' | 'extracting_recipe' | 'finalizing';

export interface ProgressData {
  isProgress: true;
  percent: number;
  stage: ProgressStage;
}

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  error?: string | null;
  recipe?: Recipe | null;
  progress?: ProgressData | null;
  parentJobId?: string | null;
  prompt?: string | null;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  flags?: string[];
  collectionIds?: string[];
  /** Total bytes of media (audio + video) downloaded by the worker for this job. */
  mediaBytes?: number;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  emoji?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}


