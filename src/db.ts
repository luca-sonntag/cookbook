import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';
import { Job } from './types.js';

// Simple in-memory lock to prevent race conditions during file read/write operations
let dbLock = Promise.resolve();

async function runLocked<T>(fn: () => Promise<T>): Promise<T> {
  const resultPromise = dbLock.then(fn);
  dbLock = resultPromise.then(
    () => { },
    () => { }
  );
  return resultPromise;
}

// Utility to generate simple unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Ensure database file exists
export async function initDb(): Promise<void> {
  return runLocked(async () => {
    const dbPath = path.resolve(config.DATABASE_PATH);
    try {
      await fs.access(dbPath);
    } catch {
      // File does not exist, initialize with empty array
      await fs.writeFile(dbPath, JSON.stringify([], null, 2), 'utf-8');
    }
  });
}

// Helper to normalize older recipe ingredients structure
function normalizeRecipe(recipe: any, jobId: string): void {
  if (!recipe) return;
  if (!recipe.id) {
    recipe.id = jobId;
  }
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    const needsConversion = recipe.ingredients.length === 0 || 
      (recipe.ingredients[0] && !Array.isArray(recipe.ingredients[0].items));
    if (needsConversion) {
      recipe.ingredients = [
        {
          name: 'Ingredients',
          items: recipe.ingredients,
        },
      ];
    }
  }
}

// Read all jobs from file
async function readJobsRaw(): Promise<Job[]> {
  const dbPath = path.resolve(config.DATABASE_PATH);
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const jobs = JSON.parse(data) as Job[];
    for (const job of jobs) {
      if (job.recipe) {
        normalizeRecipe(job.recipe, job.id);
      }
    }
    return jobs;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

// Write all jobs to file atomically
async function writeJobsRaw(jobs: Job[]): Promise<void> {
  const dbPath = path.resolve(config.DATABASE_PATH);
  const tempPath = `${dbPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(jobs, null, 2), 'utf-8');
  await fs.rename(tempPath, dbPath);
}

// Create a new job
export async function createJob(url: string): Promise<Job> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const now = new Date().toISOString();
    const newJob: Job = {
      id: generateId(),
      url,
      status: 'pending',
      error: null,
      recipe: null,
      createdAt: now,
      updatedAt: now,
    };
    jobs.push(newJob);
    await writeJobsRaw(jobs);
    return newJob;
  });
}

// Update an existing job
export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) {
      throw new Error(`Job with ID ${id} not found.`);
    }

    const now = new Date().toISOString();
    jobs[index] = {
      ...jobs[index],
      ...updates,
      updatedAt: now,
    };
    await writeJobsRaw(jobs);
  });
}

// Retrieve a job by ID
export async function getJob(id: string): Promise<Job | null> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const job = jobs.find(j => j.id === id);
    return job || null;
  });
}

// Retrieve the oldest pending job
export async function getNextPendingJob(): Promise<Job | null> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const pendingJob = jobs.find(j => j.status === 'pending');
    return pendingJob || null;
  });
}

// Retrieve a completed job by URL
export async function findCompletedJobByUrl(url: string): Promise<Job | null> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const completedJob = jobs.find(j => j.url === url && j.status === 'completed');
    return completedJob || null;
  });
}

// Retrieve all jobs sorted by creation date (newest first)
export async function getAllJobs(): Promise<Job[]> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
}

// Delete a job by ID
export async function deleteJob(id: string): Promise<boolean> {
  return runLocked(async () => {
    const jobs = await readJobsRaw();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) {
      return false;
    }
    jobs.splice(index, 1);
    await writeJobsRaw(jobs);
    return true;
  });
}


