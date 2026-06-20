import { useState, useCallback } from 'react';
import type { Recipe, Job } from '../types';

export function useRecipeExtraction(apiKey: string, onExtractionSuccess: () => void) {
  const [isPending, setIsPending] = useState(false);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateUrl = useCallback((testUrl: string): boolean => {
    if (!testUrl.trim()) {
      setUrlError('Instagram Reel URL is required.');
      return false;
    }
    const regex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/[A-Za-z0-9_-]+\/?/i;
    if (!regex.test(testUrl.trim())) {
      setUrlError('Must be a valid Instagram Reel URL (e.g., https://www.instagram.com/reel/...).');
      return false;
    }
    setUrlError('');
    return true;
  }, []);

  const startPolling = useCallback((id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(data.error || 'Failed to check status from server.');
          setIsPending(false);
          return;
        }

        const job = data.job;
        setJobStatus(job.status);

        if (job.status === 'completed') {
          clearInterval(interval);
          setRecipe(job.recipe);
          setIsPending(false);
          onExtractionSuccess();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || 'The recipe extraction failed.');
          setIsPending(false);
        }
      } catch {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError('Lost connection to backend server.');
        setIsPending(false);
      }
    }, 2000);
  }, [apiKey, onExtractionSuccess]);

  const triggerExtraction = useCallback(async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!validateUrl(cleanUrl)) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);
    setRecipe(null);

    try {
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();
      
      if (response.status === 401) {
        throw new Error('Unauthorized. Please verify your API Key in Settings.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit extraction job.');
      }

      setJobStatus(data.status);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during submission.';
      setJobError(errorMessage);
      setIsPending(false);
    }
  }, [apiKey, startPolling, validateUrl]);

  return {
    isPending,
    jobStatus,
    jobError,
    recipe,
    setRecipe,
    url,
    setUrl,
    urlError,
    setUrlError,
    validateUrl,
    triggerExtraction,
  };
}
