import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import type { Job, JobStatus, Recipe, ProgressData } from './types.js';

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

  if (error) throw wrapError('Failed to create job', error);
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

/** Retrieve all jobs for a user, newest first. */
export async function getAllJobs(userId: string): Promise<Job[]> {
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>();

  if (error) throw wrapError('Failed to get all jobs', error);
  return data.map(rowToJob);
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

/** Uploads a recipe frame to private Supabase Storage and returns a long-lived signed URL. */
export async function uploadRecipeFrame(jobId: string, index: number, buffer: Buffer): Promise<string> {
  const storagePath = `${jobId}/${index}.jpg`;

  const { error: uploadError } = await getClient().storage
    .from('recipe-frames')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw new Error(`Failed to upload frame: ${uploadError.message}`);

  const { data, error: urlError } = await getClient().storage
    .from('recipe-frames')
    .createSignedUrl(storagePath, 10 * 365 * 24 * 3600); // 10 years

  if (urlError || !data) throw new Error(`Failed to create signed URL: ${urlError?.message}`);
  return data.signedUrl;
}

/** Deletes all stored frames for a job from Supabase Storage. */
export async function deleteRecipeFrames(jobId: string): Promise<void> {
  const { data, error } = await getClient().storage.from('recipe-frames').list(jobId);
  if (error || !data || data.length === 0) return;
  const paths = data.map(f => `${jobId}/${f.name}`);
  await getClient().storage.from('recipe-frames').remove(paths);
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

/** Get all extraction jobs created by a user in the last N hours (excluding remixes). */
export async function getExtractionsForUserInTimeframe(userId: string, hours: number): Promise<Job[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await getClient()
    .from('jobs')
    .select()
    .eq('user_id', userId)
    .is('parent_job_id', null)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .returns<JobRow[]>();

  if (error) throw wrapError('Failed to get extractions in timeframe', error);
  return data.map(rowToJob);
}




