import { useState, useCallback } from 'react';
import type { Recipe, Job, ProgressData } from '../types';
import { useI18n } from '../context/I18nContext';

export function useRecipeExtraction(getAccessToken: () => Promise<string | null>, onExtractionSuccess: () => void) {
  const { t } = useI18n();
  const [isPending, setIsPending] = useState(false);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateUrl = useCallback((testUrl: string): boolean => {
    if (!testUrl.trim()) {
      setUrlError(t('form.validation.required'));
      return false;
    }
    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
    if (!regex.test(testUrl.trim())) {
      setUrlError(t('form.validation.invalid'));
      return false;
    }
    setUrlError('');
    return true;
  }, [t]);

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
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(data.error || t('form.validation.failedCheck'));
          setIsPending(false);
          return;
        }

        const job = data.job;
        setJobStatus(job.status);

        if (job.status === 'completed') {
          clearInterval(interval);
          setRecipe(job.recipe);
          setProgress(null);
          setIsPending(false);
          onExtractionSuccess();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || t('form.validation.failedExtraction'));
          setProgress(null);
          setIsPending(false);
        } else {
          setProgress(job.progress || null);
        }
      } catch {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError(t('form.validation.lostConnection'));
        setProgress(null);
        setIsPending(false);
      }
    }, 2000);
  }, [getAccessToken, onExtractionSuccess, t]);

  const triggerExtraction = useCallback(async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!validateUrl(cleanUrl)) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);
    setRecipe(null);
    setProgress(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(t('form.validation.unauthorized'));
      }
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await response.json();
      
      if (response.status === 401) {
        throw new Error(t('form.validation.unauthorized'));
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('form.validation.submitFailed'));
      }

      setJobStatus(data.status);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      const errorMessage = err instanceof Error ? err.message : t('form.validation.submissionError');
      setJobError(errorMessage);
      setIsPending(false);
    }
  }, [getAccessToken, startPolling, validateUrl, t]);


  return {
    isPending,
    jobStatus,
    jobError,
    recipe,
    setRecipe,
    progress,
    url,
    setUrl,
    urlError,
    setUrlError,
    validateUrl,
    triggerExtraction,
  };
}
