export interface ParentIngredientInfo {
  name: string;
  baseName: string;
  unit?: string;
  yieldFactor?: number;
}

export interface Ingredient {
  name: string;
  baseName?: string;
  parentIngredient?: ParentIngredientInfo;
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

export type ProgressStage = 'queued' | 'scraping' | 'downloading_media' | 'extracting_frames' | 'reading_photos' | 'extracting_recipe' | 'finalizing';

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
  /** ISO timestamp set when a user "deletes" the job (soft-delete). NULL means the job is live. */
  deletedAt?: string | null;
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

// ── Gamification ─────────────────────────────────────────────────────────────

export interface StreakTier {
  /** Minimum consecutive-day streak length for this multiplier to apply. */
  minDays: number;
  /** Multiplier applied to the whole cook's XP. */
  mult: number;
}

export interface DailySoftcap {
  /** Number of cooks per day that score at full value. */
  fullCount: number;
  /** Factor for cooks beyond fullCount up to reducedUntilCount. */
  reducedFactor: number;
  /** Cook index (1-based) up to which reducedFactor applies. */
  reducedUntilCount: number;
  /** Factor for every cook beyond reducedUntilCount. */
  tailFactor: number;
}

/**
 * The tunable point formula. Persisted as a JSON row in `global_settings`
 * (key `gamification_config`) so balancing changes need no redeploy; the backend
 * falls back to {@link DEFAULT_GAMIFICATION_CONFIG} when the row is absent.
 */
export interface GamificationConfig {
  baseXp: number;
  /** Multiplier per difficulty tier keyed "1"|"2"|"3". Flat (all 1) at launch. */
  difficultyMultipliers: Record<string, number>;
  /** Diminishing factors indexed by how often this recipe was cooked before
   *  (within `repetitionWindowDays`). The last entry is a floor, not a penalty. */
  repetitionFactors: number[];
  /** Days within which a prior cook of the same recipe counts as a repeat.
   *  Cooks older than this window reset to full value — so a weekly favorite
   *  is rewarded, not punished. 0/negative disables the window (count all). */
  repetitionWindowDays: number;
  noveltyRecipeBonus: number;
  /** Reserved: applied once a cuisine signal exists on recipes. */
  noveltyCuisineBonus: number;
  /** Percentage bonus when a finished-dish photo is attached. */
  photoBonusPct: number;
  streakTiers: StreakTier[];
  dailySoftcap: DailySoftcap;
  coinsPerXp: number;
  /** Minimum seconds between two *different* recipes counting as cooked. */
  velocityMinSeconds: number;
  /** Cumulative XP required to reach level index+1 (levelThresholds[0] = L1). */
  levelThresholds: number[];
}

/** Code-side defaults; mirror of the seeded `gamification_config` row. */
export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  baseXp: 100,
  difficultyMultipliers: { '1': 1, '2': 1.5, '3': 2 },
  repetitionFactors: [1, 0.9, 0.8, 0.75],
  repetitionWindowDays: 7,
  noveltyRecipeBonus: 20,
  noveltyCuisineBonus: 50,
  photoBonusPct: 50,
  streakTiers: [
    { minDays: 3, mult: 1.1 },
    { minDays: 7, mult: 1.25 },
    { minDays: 30, mult: 1.5 },
  ],
  dailySoftcap: { fullCount: 3, reducedFactor: 0.5, reducedUntilCount: 5, tailFactor: 0.25 },
  coinsPerXp: 0.1,
  velocityMinSeconds: 120,
  levelThresholds: [0, 500, 1200, 2200, 3500, 5100, 7000, 9300, 12000, 15100],
};

export interface UserStats {
  userId: string;
  xp: number;
  level: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  /** ISO date (YYYY-MM-DD) of the most recent counted cook, or null. */
  lastCookDate: string | null;
  totalCooks: number;
}

/** Signals passed in when a user marks a recipe cooked. */
export interface CookSignals {
  hasPhoto?: boolean;
  photoPath?: string | null;
  viaCookingMode?: boolean;
  timerElapsed?: boolean;
}

export interface EarnedReward {
  xp: number;
  coins: number;
  /** Human-readable ledger reasons, e.g. "base", "photo_bonus", "streak_x1.25". */
  reasons: string[];
}

/** Full result of recording a cook — everything the reward overlay needs. */
export interface CookedResult {
  stats: UserStats;
  earned: EarnedReward;
  newBadges: string[];
  previousXp: number;
  previousLevel: number;
  leveledUp: boolean;
  /** True when the tap was ignored as a duplicate (rapid re-tap of same recipe). */
  duplicate?: boolean;
}


