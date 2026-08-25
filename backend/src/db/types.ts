// Client / Core Database Models
export interface JobRow {
  id: string;
  user_id: string;
  kind: string;
  status: string;
  source_url: string;
  source_url_normalized: string | null;
  parent_recipe_id: string | null;
  remix_prompt: string | null;
  recipe_id: string | null;
  progress: unknown;
  error: string | null;
  client_frames?: unknown;
  scrape_meta?: unknown;
  llm_usage?: unknown;
  media_bytes?: number;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeRow {
  id: string;
  created_by: string | null;
  visibility: string;
  origin: string;
  source_url: string | null;
  source_handle: string | null;
  parent_recipe_id: string | null;
  remix_prompt: string | null;
  title: string;
  description: string | null;
  emoji: string | null;
  is_recipe: boolean;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | string | null;
  tags: string[];
  equipment: string[];
  tips: string[];
  image_url: string | null;
  image_urls: string[];
  image_prompt: string | null;
  is_ai_cover: boolean;
  transcript: string | null;
  ingredients: unknown;
  instructions: unknown;
  alternative_ingredients: unknown;
  calories: number | string | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  source_nutritional_values: unknown;
  has_explicit_nutritional_values: boolean;
  nutrition_coverage: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecipeRow {
  id: string;
  user_id: string;
  recipe_id: string;
  source_job_id: string | null;
  source: string;
  is_favorite: boolean;
  flags: string[];
  added_at: string;
  updated_at: string;
  recipes?: RecipeRow | null;
}

// Settings Models
export interface GlobalSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// Collection Models
export interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Gamification Models
export interface UserStatsRow {
  user_id: string;
  xp: number | string;
  level: number;
  coins: number | string;
  current_streak: number;
  longest_streak: number;
  last_cook_date: string | null;
  total_cooks: number;
}

export interface InsertCookEventArgs {
  userId: string;
  recipeId: string;
  xp: number;
  coins: number;
  hasPhoto: boolean;
  photoPath: string | null;
  verified: boolean;
  leaderboardEligible: boolean;
  trustScore: number;
  viaCookingMode: boolean;
  timerElapsed: boolean;
}

export interface CookPhotoItem {
  id: string;
  recipeId: string | null;
  photoUrl: string;
  cookedAt: string;
  recipeTitle?: string;
}

export interface CookHistoryItem {
  id: string;
  cookedAt: string;
  xpAwarded: number;
  coinsAwarded: number;
  hasPhoto: boolean;
  photoUrl: string | null;
  verified: boolean;
  viaCookingMode: boolean;
  timerElapsed: boolean;
}

export interface CookHistory {
  count: number;
  firstCookedAt: string | null;
  lastCookedAt: string | null;
  items: CookHistoryItem[];
}

export interface LedgerRow {
  deltaXp: number;
  deltaCoins: number;
  reason: string;
}

// Social Models
export interface ProfileRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  responded_at: string | null;
}

export interface RawUserStatsRow {
  user_id: string;
  xp: number | string;
  level: number;
  coins: number | string;
  current_streak: number;
  longest_streak: number;
  last_cook_date: string | null;
  total_cooks: number;
}

// Admin / System Models
export interface FeedbackInput {
  type: 'bug' | 'idea';
  message: string;
  context?: unknown;
  screenshotsBase64?: string[];
}

export interface FeedbackRow {
  id: string;
  user_id: string;
  type: string;
  message: string;
  context: unknown;
  screenshot_urls: string[] | null;
  created_at: string;
}

export interface AppBundleRow {
  id: string;
  channel: 'production' | 'alpha' | 'internal';
  version: string;
  storage_path: string;
  checksum: string;
  min_version_code: number;
  max_version_code: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface FailedJobDetails {
  id: string;
  url: string;
  error: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogEntry {
  userId: string;
  category: string;
  type: string;
  recipeId?: string | null;
  title?: string | null;
}

export interface NotificationLogRow {
  sentAt: string;
  category: string;
  type: string;
  recipeId: string | null;
}

export interface NotificationUser {
  id: string;
  metadata: Record<string, unknown>;
}
