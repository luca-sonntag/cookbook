import { useState, useCallback } from 'react';
import type { Recipe, Job } from '../types';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { translateApiError } from '../i18n';

export function useRecipeRemix(onRemixSuccess: (newRecipe: Recipe) => void) {
  const { t, language } = useI18n();
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
          setJobError(t('form.validation.unauthorized'));
          setIsPending(false);
          return;
        }
        const response = await fetch(`/api/jobs/${id}`, {
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
          const errMsg = response.status === 429
            ? translateApiError('too many requests', language)
            : t('form.validation.serverError');
          setJobError(errMsg);
          setIsPending(false);
          return;
        }
        
        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(translateApiError(data.error, language) || t('form.validation.failedCheck'));
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
          setJobError(translateApiError(job.error, language) || t('form.validation.failedExtraction'));
          setIsPending(false);
        }
      } catch (err: unknown) {
        clearInterval(interval);
        setJobStatus('failed');
        const errMsg = err instanceof Error ? translateApiError(err.message, language) : t('form.validation.lostConnection');
        setJobError(errMsg);
        setIsPending(false);
      }
    }, 2000);
  }, [getAccessToken, onRemixSuccess, t, language]);

  const triggerRemix = useCallback(async (parentJobId: string, prompt: string) => {
    if (!prompt.trim()) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(t('form.validation.unauthorized'));
      }
      
      const response = await fetch(`/api/jobs/${parentJobId}/remix`, {
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
        if (response.status === 429) {
          throw new Error(translateApiError('too many requests', language));
        }
        throw new Error(t('form.validation.serverError'));
      }
      
      if (response.status === 401) {
        throw new Error(t('form.validation.unauthorized'));
      }

      if (!response.ok || !data.success) {
        throw new Error(translateApiError(data.error, language) || t('form.validation.submitFailed'));
      }

      setJobStatus(data.status);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      const errorMessage = err instanceof Error ? translateApiError(err.message, language) : t('form.validation.submissionError');
      setJobError(errorMessage);
      setIsPending(false);
    }
  }, [getAccessToken, startPolling, t, language]);


  return {
    isPending,
    jobStatus,
    jobError,
    triggerRemix,
  };
}
