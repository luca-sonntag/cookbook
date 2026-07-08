import { useState, useCallback } from 'react';
import type { Recipe, Job } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api';

export function useRecipeRemix(onRemixSuccess: (newRecipe: Recipe) => void) {
  const { getAccessToken } = useAuth();
  
  const [isPending, setIsPending] = useState(false);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const startPolling = useCallback((id: string) => {
    const interval = setInterval(async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError('form.validation.unauthorized');
          setIsPending(false);
          return;
        }
        const response = await fetch(apiUrl(`/api/jobs/${id}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        let data: any;
        try {
          data = await response.json();
        } catch {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(response.status === 429 ? 'too many requests' : 'form.validation.serverError');
          setIsPending(false);
          return;
        }

        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(data.error || 'form.validation.failedCheck');
          setIsPending(false);
          return;
        }

        const job = data.job;
        setJobStatus(job.status);

        if (job.status === 'completed' && job.recipe) {
          clearInterval(interval);
          setIsPending(false);
          onRemixSuccess(job.recipe);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || 'form.validation.failedExtraction');
          setIsPending(false);
        }
      } catch (err: unknown) {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError(err instanceof Error ? err.message : 'form.validation.lostConnection');
        setIsPending(false);
      }
    }, 2000);
  }, [getAccessToken, onRemixSuccess]);

  const triggerRemix = useCallback(async (parentJobId: string, prompt: string) => {
    if (!prompt.trim()) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('form.validation.unauthorized');
      }

      const response = await fetch(apiUrl(`/api/jobs/${parentJobId}/remix`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(response.status === 429 ? 'too many requests' : 'form.validation.serverError');
      }

      if (response.status === 401) {
        throw new Error('form.validation.unauthorized');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'form.validation.submitFailed');
      }

      setJobStatus(data.status);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      setJobError(err instanceof Error ? err.message : 'form.validation.submissionError');
      setIsPending(false);
    }
  }, [getAccessToken, startPolling]);


  return {
    isPending,
    jobStatus,
    jobError,
    triggerRemix,
  };
}
