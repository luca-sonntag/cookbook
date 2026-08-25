import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { config } from '../config.js';

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

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  _client ??= createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY);
  return _client;
}

export const PGRST_NO_ROWS = 'PGRST116';

export function isNoRowsError(err: PostgrestError): boolean {
  return err.code === PGRST_NO_ROWS;
}

export function wrapError(context: string, err: PostgrestError): Error {
  return new Error(`${context}: ${err.message}`, { cause: err });
}

export const PG_UNIQUE_VIOLATION = '23505';

export function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function checkDbHealth(): Promise<boolean> {
  try {
    const { error } = await getClient()
      .from('jobs')
      .select('id')
      .limit(1);
    return !error;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}
