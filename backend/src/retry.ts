/** Runs `fn` up to `maxAttempts` times with exponential backoff on error. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 1000 }: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, (err as Error).message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
