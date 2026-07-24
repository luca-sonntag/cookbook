import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import type { Job, JobStatus, Recipe, ProgressData, Collection } from './types.js';

// ── Types ────────────────────────────────────────────────────────────────────

/** Row shape as stored in Supabase (snake_case columns). */
interface JobRow {
  id: string;
  url: string;
  status: string;
  error: string | null;
  recipe: unknown;
  user_id: string;
  parent_job_id: string | null;
  prompt: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  locked_by: string | null;
  url_normalized: string | null;
  is_favorite?: boolean;
  flags?: string[];
  media_bytes?: number;
}

// ── Supabase client (lazy singleton) ─────────────────────────────────────────

let _client: SupabaseClient | undefined;

export function getClient(): SupabaseClient {
  // Use service_role key so the queue worker (which has no user JWT) can also operate.
  // RLS is enforced via explicit .eq('user_id', userId) filters in every query.
  _client ??= createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY);
  return _client;
}

// ── Error helpers ────────────────────────────────────────────────────────────

/** PostgREST error code for "no rows returned by .single()". */
const PGRST_NO_ROWS = 'PGRST116';

function isNoRowsError(err: PostgrestError): boolean {
  return err.code === PGRST_NO_ROWS;
}

function wrapError(context: string, err: PostgrestError): Error {
  return new Error(`${context}: ${err.message}`, { cause: err });
}

// ── Row ↔ Domain mapping ─────────────────────────────────────────────────────

function rowToJob(row: JobRow): Job {
  const recipeData = row.recipe as any;
  const isProgress = recipeData && recipeData.isProgress;

  const job: Job = {
    id: row.id,
    url: row.url,
    status: row.status as JobStatus,
    error: row.error,
    recipe: isProgress ? null : (row.recipe as Recipe),
    progress: isProgress ? (row.recipe as ProgressData) : null,
    parentJobId: row.parent_job_id,
    prompt: row.prompt,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite ?? false,
    flags: row.flags ?? [],
    mediaBytes: row.media_bytes ?? 0,
  };
  if (job.recipe) {
    normalizeRecipe(job.recipe, job.id);
    if (job.parentJobId) {
      job.recipe.parentJobId = job.parentJobId;
    }
    if (job.prompt) {
      job.recipe.remixPrompt = job.prompt;
    }
  }
  return job;
}

function jobToRow(updates: Partial<Job>): Partial<JobRow> {
  const row: Partial<JobRow> = {};
  if (updates.url !== undefined) row.url = updates.url;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.error !== undefined) row.error = updates.error;
  if (updates.recipe !== undefined) row.recipe = updates.recipe;
  if (updates.parentJobId !== undefined) row.parent_job_id = updates.parentJobId;
  if (updates.prompt !== undefined) row.prompt = updates.prompt;
  if (updates.createdAt !== undefined) row.created_at = updates.createdAt;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;
  if (updates.isFavorite !== undefined) row.is_favorite = updates.isFavorite;
  if (updates.flags !== undefined) row.flags = updates.flags;
  if (updates.mediaBytes !== undefined) row.media_bytes = updates.mediaBytes;
  return row;
}

// ── Recipe normalization ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecipe(recipe: any, jobId: string): void {
  if (recipe && recipe.isProgress) return;
  if (!recipe.id) {
    recipe.id = jobId;
  }
  if (recipe.nutritionalEstimates && !recipe.nutritionalValues) {
    recipe.nutritionalValues = recipe.nutritionalEstimates;
    delete recipe.nutritionalEstimates;
  }
  if (Array.isArray(recipe.ingredients)) {
    const ingredients = recipe.ingredients as Array<{ items?: unknown[] }>;
    const needsConversion =
      ingredients.length === 0 ||
      (ingredients[0] && !Array.isArray(ingredients[0].items));
    if (needsConversion) {
      recipe.ingredients = [{ name: 'Ingredients', items: ingredients }];
    }
  }
}

// ── URL normalization ────────────────────────────────────────────────────────

function normalizeUrl(urlStr: string): string {
  let clean = urlStr.replace(/^(https?:\/\/)?(www\.)?/i, '');
  clean = clean.split('?')[0];
  clean = clean.endsWith('/') ? clean.slice(0, -1) : clean;
  return clean.toLowerCase();
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Postgres error code for a unique-constraint violation. */
const PG_UNIQUE_VIOLATION = '23505';

/** Create a new pending job. */
export async function createJob(url: string, userId: string): Promise<Job> {
  const now = new Date().toISOString();
  const id = randomUUID();

  const { data, error } = await getClient()
    .from('jobs')
    .insert({ id, url, url_normalized: normalizeUrl(url), status: 'pending', error: null, recipe: null, user_id: userId, created_at: now, updated_at: now })
    .select()
    .returns<JobRow>()
    .single();

  if (error) {
    // Two near-simultaneous requests for the same URL can both pass the
    // app-level active-job check before either INSERT commits; the partial
    // unique index on (user_id, url_normalized) for active jobs catches that
    // race here. Return the job the other request created instead of failing.
    if (error.code === PG_UNIQUE_VIOLATION) {
      const existing = await findActiveJobByUrl(url, userId);
      if (existing) return existing;
    }
    throw wrapError('Failed to create job', error);
  }
  return rowToJob(data);
}

/** Create a new pending remix job. */
export async function createRemixJob(parentJobId: string, url: string, prompt: string, userId: string): Promise<Job> {
  const now = new Date().toISOString();
  const id = randomUUID();

  const { data, error } = await getClient()
    .from('jobs')
    .insert({ id, url, url_normalized: normalizeUrl(url), status: 'pending', error: null, recipe: null, user_id: userId, parent_job_id: parentJobId, prompt, created_at: now, updated_at: now })
    .select()
    .returns<JobRow>()
    .single();

  if (error) throw wrapError('Failed to create remix job', error);
  return rowToJob(data);
}

/** Save a completed recipe remix directly. */
export async function saveCompletedRemix(parentJobId: string, url: string, recipe: Recipe, prompt: string, userId: string): Promise<Job> {
  const now = new Date().toISOString();
  const id = randomUUID();

  const finalRecipe = {
    ...recipe,
    id,
    parentJobId,
    remixPrompt: prompt
  };

  const { data, error } = await getClient()
    .from('jobs')
    .insert({
      id,
      url,
      url_normalized: normalizeUrl(url),
      status: 'completed',
      error: null,
      recipe: finalRecipe as any,
      user_id: userId,
      parent_job_id: parentJobId,
      prompt,
      created_at: now,
      updated_at: now
    })
    .select()
    .returns<JobRow>()
    .single();

  if (error) throw wrapError('Failed to save completed remix job', error);
  return rowToJob(data);
}

/** Update an existing job by ID. */
export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  const now = new Date().toISOString();
  const rowUpdates = { ...jobToRow(updates), updated_at: now };

  const { error } = await getClient()
    .from('jobs')
    .update(rowUpdates)
    .eq('id', id);

  if (error) throw wrapError(`Failed to update job ${id}`, error);
}

/** Retrieve a job by ID, or `null` if not found. Scoped to userId when provided. */
export async function getJob(id: string, userId?: string): Promise<Job | null> {
  let query = getClient()
    .from('jobs')
    .select()
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.returns<JobRow>().single();

  if (error) {
    if (isNoRowsError(error)) return null;
    throw wrapError(`Failed to get job ${id}`, error);
  }
  return rowToJob(data);
}

/**
 * Atomically claims the oldest pending job for a worker using SKIP LOCKED.
 * Returns null if no pending jobs are available.
 */
export async function claimNextJob(workerId: string): Promise<Job | null> {
  const { data, error } = await getClient()
    .rpc('claim_next_job', { worker_id: workerId });

  if (error) throw wrapError('Failed to claim next job', error);
  const rows = data as JobRow[] | null;
  if (!rows || rows.length === 0) return null;
  return rowToJob(rows[0]);
}

/** Find a completed job by URL (normalized), scoped to userId. */
export async function findCompletedJobByUrl(url: string, userId: string): Promise<Job | null> {
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .eq('status', 'completed')
    .eq('user_id', userId)
    .eq('url_normalized', normalizeUrl(url))
    .returns<JobRow[]>()
    .limit(1);

  if (error) throw wrapError('Failed to search jobs by URL', error);
  return data.length > 0 ? rowToJob(data[0]) : null;
}

/** Find a still-running (not yet completed/failed) job by URL (normalized), scoped to userId. */
export async function findActiveJobByUrl(url: string, userId: string): Promise<Job | null> {
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .in('status', ['pending', 'scraping', 'processing'])
    .eq('user_id', userId)
    .eq('url_normalized', normalizeUrl(url))
    .returns<JobRow[]>()
    .limit(1);

  if (error) throw wrapError('Failed to search active jobs by URL', error);
  return data.length > 0 ? rowToJob(data[0]) : null;
}

/** Retrieve all jobs for a user, newest first. */
export async function getAllJobs(userId: string): Promise<Job[]> {
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>();

  if (error) throw wrapError('Failed to get all jobs', error);
  const jobs = data.map(rowToJob);

  try {
    const memberships = await getCollectionMembership(userId);
    for (const job of jobs) {
      job.collectionIds = memberships[job.id] ?? [];
    }
  } catch (err) {
    console.warn('Failed to load collection memberships for jobs:', err);
    for (const job of jobs) {
      job.collectionIds = [];
    }
  }

  return jobs;
}

/** Delete a job by ID, scoped to userId. Returns `true` if deleted, `false` if not found. */
export async function deleteJob(id: string, userId: string): Promise<boolean> {
  const { error, count } = await getClient()
    .from('jobs')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw wrapError(`Failed to delete job ${id}`, error);
  return (count ?? 0) > 0;
}

/**
 * Uploads a recipe frame to private Supabase Storage as a *transient* hand-off.
 * The bytes are pulled once by the extracting device (see getRecipeFrames) and
 * then deleted; they are never persisted long-term nor exposed via a durable URL,
 * so we do not rehost third-party video content. Orphans are swept by
 * sweepOldRecipeFrames as a backstop.
 */
export async function uploadRecipeFrame(jobId: string, index: number, buffer: Buffer): Promise<void> {
  const storagePath = `${jobId}/${index}.jpg`;

  const { error: uploadError } = await getClient().storage
    .from('recipe-frames')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw new Error(`Failed to upload frame: ${uploadError.message}`);
}

/**
 * Downloads all transiently-stored frames for a job and returns them as base64
 * JPEG data URLs, ordered by frame index. Used for the one-time device hand-off.
 */
export async function getRecipeFrames(jobId: string): Promise<{ index: number; dataUrl: string }[]> {
  const { data: list, error: listError } = await getClient().storage.from('recipe-frames').list(jobId);
  if (listError || !list || list.length === 0) return [];

  const frames: { index: number; dataUrl: string }[] = [];
  for (const file of list) {
    const index = parseInt(file.name.replace(/\.jpg$/i, ''), 10);
    if (Number.isNaN(index)) continue;

    const { data: blob, error: dlError } = await getClient().storage
      .from('recipe-frames')
      .download(`${jobId}/${file.name}`);
    if (dlError || !blob) continue;

    const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
    frames.push({ index, dataUrl: `data:image/jpeg;base64,${base64}` });
  }

  frames.sort((a, b) => a.index - b.index);
  return frames;
}

/** Deletes all stored frames for a job from Supabase Storage. */
export async function deleteRecipeFrames(jobId: string): Promise<void> {
  const { data, error } = await getClient().storage.from('recipe-frames').list(jobId);
  if (error || !data || data.length === 0) return;
  const paths = data.map(f => `${jobId}/${f.name}`);
  await getClient().storage.from('recipe-frames').remove(paths);
}

/**
 * Backstop cleanup: removes transiently-stored frames older than `maxAgeHours`.
 * Normally frames are deleted right after the device pulls them; this catches
 * orphans left when the device never fetched (e.g. the app was killed).
 */
export async function sweepOldRecipeFrames(maxAgeHours = 24): Promise<number> {
  const cutoff = Date.now() - maxAgeHours * 3600 * 1000;
  const { data: folders, error } = await getClient().storage.from('recipe-frames').list('', { limit: 1000 });
  if (error || !folders || folders.length === 0) return 0;

  let removed = 0;
  for (const folder of folders) {
    // Root entries without a metadata blob are the per-job folders.
    if (!folder.name) continue;
    const { data: files, error: filesError } = await getClient().storage
      .from('recipe-frames')
      .list(folder.name);
    if (filesError || !files || files.length === 0) continue;

    const allExpired = files.every(f => {
      const ts = f.created_at ? new Date(f.created_at).getTime() : 0;
      return ts > 0 && ts < cutoff;
    });
    if (!allExpired) continue;

    const paths = files.map(f => `${folder.name}/${f.name}`);
    const { error: removeError } = await getClient().storage.from('recipe-frames').remove(paths);
    if (!removeError) removed += paths.length;
  }
  return removed;
}

// ── Feedback / bug reports ────────────────────────────────────────────────────

export interface FeedbackInput {
  type: 'bug' | 'idea';
  message: string;
  context?: unknown;
  /** Optional screenshots as data-URL or raw base64 JPEG strings. */
  screenshotsBase64?: string[];
}

/**
 * Persist an in-app bug report / feedback submission. Any attached screenshots
 * are uploaded to the private `feedback-screenshots` bucket and their long-lived
 * signed URLs are stored (as an array) alongside the report.
 */
export async function createFeedback(userId: string, input: FeedbackInput): Promise<{ id: string }> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const screenshotUrls: string[] = [];
  const shots = input.screenshotsBase64 ?? [];
  for (let index = 0; index < shots.length; index++) {
    try {
      const base64 = shots[index].replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const storagePath = `${userId}/${id}/${index}.jpg`;

      const { error: uploadError } = await getClient().storage
        .from('feedback-screenshots')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data, error: urlError } = await getClient().storage
        .from('feedback-screenshots')
        .createSignedUrl(storagePath, 10 * 365 * 24 * 3600); // 10 years
      if (urlError || !data) throw new Error(urlError?.message || 'No signed URL');
      screenshotUrls.push(data.signedUrl);
    } catch (err: any) {
      // A failed screenshot upload must not lose the report itself.
      console.error(`Failed to upload feedback screenshot ${index}:`, err?.message || err);
    }
  }

  const { error } = await getClient()
    .from('feedback')
    .insert({
      id,
      user_id: userId,
      type: input.type,
      message: input.message,
      context: input.context ?? null,
      screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : null,
      created_at: now,
    });

  if (error) throw wrapError('Failed to create feedback', error);
  return { id };
}

/** Check whether the Supabase database connection is healthy. */
export async function checkDbHealth(): Promise<boolean> {
  try {
    // head: true → HTTP HEAD request, no body transferred
    // limit 1  → Postgres stops after first row on PK index
    const { error } = await getClient()
      .from('jobs')
      .select('id', { head: true })
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

/** Updates locked_at timestamp to signal a job is still actively being processed. */
export async function heartbeatJob(id: string): Promise<void> {
  const { error } = await getClient()
    .from('jobs')
    .update({ locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) console.warn(`Heartbeat failed for job ${id}: ${error.message}`);
}

/**
 * Reclaims jobs whose lease has expired back to 'pending' so another worker
 * can pick them up. Runs periodically instead of at startup to support
 * multiple worker instances safely.
 */
export async function reclaimExpiredJobs(timeoutMinutes: number): Promise<void> {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

  const { error, count } = await getClient()
    .from('jobs')
    .update({ status: 'pending', locked_at: null, locked_by: null, updated_at: new Date().toISOString() }, { count: 'exact' })
    .in('status', ['scraping', 'processing'])
    .lt('locked_at', cutoff);

  if (error) {
    console.error('Failed to reclaim expired jobs:', error.message);
  } else if (count && count > 0) {
    console.log(`Reclaimed ${count} expired job(s) back to pending.`);
  }
}

/** Count active (pending/scraping/processing) jobs for a user. */
export async function countActiveJobsForUser(userId: string): Promise<number> {
  const { count, error } = await getClient()
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'scraping', 'processing']);

  if (error) throw wrapError('Failed to count active jobs', error);
  return count ?? 0;
}

/** Count a user's saved recipes (completed cookbook entries, including remixes). */
export async function countCompletedRecipesForUser(userId: string): Promise<number> {
  const { count, error } = await getClient()
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('recipe', 'is', null);

  if (error) throw wrapError('Failed to count completed recipes', error);
  return count ?? 0;
}

/**
 * Get all extraction jobs created by a user in the last N days (excluding remixes).
 * Failed extractions are excluded so they don't consume the user's rate-limit
 * allowance — only in-flight (pending/scraping/processing) and completed jobs count.
 */
export async function getExtractionsForUserInTimeframe(userId: string, days: number): Promise<Job[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .eq('user_id', userId)
    .is('parent_job_id', null)
    .neq('status', 'failed')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .returns<JobRow[]>();

  if (error) throw wrapError('Failed to get extractions in timeframe', error);
  return data.map(rowToJob);
}

// ── Global Settings & Caching ───────────────────────────────────────────────

const settingsCache: Record<string, { value: any; timestamp: number }> = {};

export async function getGlobalSetting<T>(key: string, defaultValue: T): Promise<T> {
  const now = Date.now();
  const cached = settingsCache[key];
  // Cache for 60 seconds
  if (cached && (now - cached.timestamp < 60000)) {
    return cached.value;
  }

  try {
    const { data, error } = await getClient()
      .from('global_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data) {
      let val: any = data.value;
      if (typeof defaultValue === 'boolean') {
        val = val === true || val === 'true';
      } else if (typeof defaultValue === 'number') {
        val = parseInt(val, 10);
        if (isNaN(val)) val = defaultValue;
      }
      settingsCache[key] = { value: val, timestamp: now };
      return val as T;
    }
  } catch (err) {
    console.warn(`Error reading global setting ${key}, using default:`, err);
  }

  return defaultValue;
}

export async function isAlphaActive(): Promise<boolean> {
  return getGlobalSetting('alpha_active', config.ALPHA_ACTIVE);
}

export async function getAlphaMaxExtractions(): Promise<number> {
  return getGlobalSetting('alpha_max_extractions_per_window', config.ALPHA_MAX_EXTRACTIONS_PER_WINDOW);
}

export async function getAlphaMaxSavedRecipes(): Promise<number> {
  return getGlobalSetting('alpha_max_saved_recipes', config.ALPHA_MAX_SAVED_RECIPES);
}

export async function getFreeMaxExtractions(): Promise<number> {
  return getGlobalSetting('free_max_extractions_per_window', config.FREE_MAX_EXTRACTIONS_PER_WINDOW);
}

export async function getFreeMaxSavedRecipes(): Promise<number> {
  return getGlobalSetting('free_max_saved_recipes', config.FREE_MAX_SAVED_RECIPES);
}

export async function getPremiumMaxExtractions(): Promise<number> {
  return getGlobalSetting('premium_max_extractions_per_window', config.PREMIUM_MAX_EXTRACTIONS_PER_WINDOW);
}

export async function getPremiumMaxSavedRecipes(): Promise<number> {
  return getGlobalSetting('premium_max_saved_recipes', -1);
}

export async function getMaxVideoDurationSeconds(): Promise<number> {
  return getGlobalSetting('max_video_duration_seconds', config.MAX_VIDEO_DURATION_SECONDS);
}

export interface GlobalSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

/** Fetch all global settings. */
export async function getAllGlobalSettings(): Promise<GlobalSetting[]> {
  const { data, error } = await getClient()
    .from('global_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw wrapError('Failed to fetch global settings', error);
  return data || [];
}

/** Update multiple global settings in bulk and invalidate cache. */
export async function updateGlobalSettings(settings: Record<string, string>): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await getClient()
    .from('global_settings')
    .upsert(rows);

  if (error) throw wrapError('Failed to update global settings', error);

  // Clear internal cache for updated settings
  for (const key of Object.keys(settings)) {
    delete settingsCache[key];
  }
}

/** Retrieve all feedback submissions ordered by creation date. */
export async function getAllFeedback(): Promise<any[]> {
  const { data, error } = await getClient()
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw wrapError('Failed to fetch all feedback', error);
  return data || [];
}

/** Set whether a job is favorited, scoped to userId. */
export async function setFavorite(jobId: string, userId: string, value: boolean): Promise<void> {
  const { error } = await getClient()
    .from('jobs')
    .update({ is_favorite: value, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId);

  if (error) throw wrapError(`Failed to set favorite for job ${jobId}`, error);
}

/** Set custom flags for a job, scoped to userId. */
export async function setFlags(jobId: string, userId: string, flags: string[]): Promise<void> {
  const { error } = await getClient()
    .from('jobs')
    .update({ flags, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', userId);

  if (error) throw wrapError(`Failed to set flags for job ${jobId}`, error);
}

/** List all collections for a user. */
export async function listCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await getClient()
    .from('collections')
    .select()
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw wrapError('Failed to list collections', error);

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    emoji: row.emoji,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/** Create a new collection for a user. */
export async function createCollection(userId: string, col: Partial<Collection>): Promise<Collection> {
  const now = new Date().toISOString();
  const id = col.id || randomUUID();
  const position = col.position ?? 0;

  const { data, error } = await getClient()
    .from('collections')
    .insert({
      id,
      user_id: userId,
      name: col.name!,
      emoji: col.emoji || null,
      position,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) throw wrapError('Failed to create collection', error);

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    emoji: data.emoji,
    position: data.position,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/** Update an existing collection for a user. */
export async function updateCollection(id: string, userId: string, col: Partial<Collection>): Promise<Collection> {
  const now = new Date().toISOString();
  const updates: Record<string, any> = { updated_at: now };
  if (col.name !== undefined) updates.name = col.name;
  if (col.emoji !== undefined) updates.emoji = col.emoji;
  if (col.position !== undefined) updates.position = col.position;

  const { data, error } = await getClient()
    .from('collections')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw wrapError(`Failed to update collection ${id}`, error);

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    emoji: data.emoji,
    position: data.position,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/** Delete a collection, scoped to user. */
export async function deleteCollection(id: string, userId: string): Promise<boolean> {
  const { error, count } = await getClient()
    .from('collections')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw wrapError(`Failed to delete collection ${id}`, error);
  return (count ?? 0) > 0;
}

/** Get collection membership mappings { [jobId]: string[] } for a user. */
export async function getCollectionMembership(userId: string): Promise<Record<string, string[]>> {
  const { data, error } = await getClient()
    .from('recipe_collections')
    .select('job_id, collection_id')
    .eq('user_id', userId);

  if (error) throw wrapError('Failed to get collection membership', error);

  const mapping: Record<string, string[]> = {};
  if (data) {
    for (const row of data) {
      mapping[row.job_id] ??= [];
      mapping[row.job_id].push(row.collection_id);
    }
  }
  return mapping;
}

/** Set collection memberships for a recipe. */
export async function setRecipeCollections(jobId: string, userId: string, collectionIds: string[]): Promise<void> {
  // Delete existing memberships for this recipe
  const { error: deleteError } = await getClient()
    .from('recipe_collections')
    .delete()
    .eq('job_id', jobId)
    .eq('user_id', userId);

  if (deleteError) throw wrapError('Failed to clear old recipe collections', deleteError);

  // Insert new memberships
  if (collectionIds.length > 0) {
    const inserts = collectionIds.map(cid => ({
      collection_id: cid,
      job_id: jobId,
      user_id: userId
    }));
    const { error: insertError } = await getClient()
      .from('recipe_collections')
      .insert(inserts);

    if (insertError) throw wrapError('Failed to save new recipe collections', insertError);
  }
}

/** Retrieve database job execution and queue metrics. */
export async function getJobMetrics(
  since: Date | null = null,
  windowDays: number | null = 14,
): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  mediaBytes: number;
  mediaMb: number;
  dailyStats: { date: string; count: number }[];
}> {
  let query = getClient()
    .from('jobs')
    .select('status, created_at, media_bytes');

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data: allJobs, error } = await query;

  if (error) throw wrapError('Failed to fetch jobs for metrics', error);

  let total = 0;
  let completed = 0;
  let failed = 0;
  let pending = 0;
  let processing = 0;
  let mediaBytes = 0;
  const dailyCounts: Record<string, number> = {};

  if (allJobs) {
    total = allJobs.length;
    for (const job of allJobs) {
      if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
      else if (job.status === 'pending') pending++;
      else if (job.status === 'processing') processing++;

      // media_bytes comes back as a string for bigint via PostgREST → coerce.
      mediaBytes += Number((job as any).media_bytes ?? 0) || 0;

      if (job.created_at) {
        const dateStr = job.created_at.split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    }
  }

  // Build the daily stats array. For a bounded window, emit a dense
  // zero-filled array of the last `windowDays` calendar days. For an
  // unbounded ("all") window, emit only the dates that actually have data,
  // sorted ascending, to avoid an unboundedly long array.
  const dailyStats: { date: string; count: number }[] = [];
  if (windowDays && windowDays > 0) {
    const now = new Date();
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyStats.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      });
    }
  } else {
    for (const dateStr of Object.keys(dailyCounts).sort()) {
      dailyStats.push({ date: dateStr, count: dailyCounts[dateStr] });
    }
  }

  const mediaMb = parseFloat((mediaBytes / (1024 * 1024)).toFixed(2));

  return { total, completed, failed, pending, processing, mediaBytes, mediaMb, dailyStats };
}

/**
 * Count successfully extracted recipes (completed jobs) grouped by user. When
 * `since` is provided, only jobs created on/after that timestamp are counted;
 * otherwise all completed jobs are aggregated ("all-time"). Users with zero
 * extractions in the window are omitted, and the result is sorted descending
 * by count. The caller is responsible for resolving `user_id` → email.
 */
export async function getExtractionsPerUser(
  since: Date | null = null,
): Promise<{ userId: string; count: number }[]> {
  let query = getClient()
    .from('jobs')
    .select('user_id')
    .eq('status', 'completed');

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) throw wrapError('Failed to fetch per-user extraction metrics', error);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const uid = (row as any).user_id;
    if (!uid) continue;
    counts[uid] = (counts[uid] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([userId, count]) => ({ userId, count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

export interface FailedJobDetails {
  id: string;
  url: string;
  error: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** Retrieve detailed information on failed jobs within the specified time window. */
export async function getFailedJobs(
  since: Date | null = null,
  limit: number = 50
): Promise<FailedJobDetails[]> {
  let query = getClient()
    .from('jobs')
    .select('id, url, error, user_id, created_at, updated_at')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) throw wrapError('Failed to fetch failed jobs for metrics', error);

  return (data || []).map((row: any) => ({
    id: row.id,
    url: row.url,
    error: row.error,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}






