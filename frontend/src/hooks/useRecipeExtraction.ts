import { useState, useCallback, useEffect, useRef } from 'react';
import type { Recipe, Job, ProgressData } from '../types';
import { useI18n } from '../context/I18nContext';
import { apiUrl } from '../api';
import { useAuth } from '../context/AuthContext';

// Tracks the currently in-flight extraction job across reloads/restarts, so a
// still-running job can be resumed instead of the user re-submitting the same
// URL (which previously produced a duplicate saved recipe).
const PENDING_JOB_STORAGE_KEY = 'kb_pending_job_id';

export function useRecipeExtraction(getAccessToken: () => Promise<string | null>, onExtractionSuccess: (jobId: string) => void, isPremiumOverride?: boolean) {
  const { t } = useI18n();
  const { user, refreshSession } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [jobStatus, setJobStatus] = useState<Job['status'] | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobErrorCode, setJobErrorCode] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [limitStatus, setLimitStatus] = useState<{ limit: number; used: number; remaining: number; windowDays: number; tier: 'free' | 'beta' | 'premium'; savedRecipes: number; maxSavedRecipes: number; cookbookFull: boolean } | null>(null);

  const fetchLimitStatus = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      if (isPremiumOverride) {
        headers['X-Simulate-Premium'] = 'true';
      }

      const response = await fetch(apiUrl('/api/extractions/limit'), {
        headers
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLimitStatus({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
          windowDays: data.windowDays,
          tier: data.tier,
          savedRecipes: data.savedRecipes ?? 0,
          maxSavedRecipes: data.maxSavedRecipes ?? -1,
          cookbookFull: data.cookbookFull ?? false
        });

        // Auto-refresh auth session on tier mismatch (e.g. after beta auto-assignment)
        if (user && data.tier && user.app_metadata?.tier !== data.tier) {
          console.log(`Tier mismatch detected: local is '${user.app_metadata?.tier}', server is '${data.tier}'. Refreshing session...`);
          refreshSession().catch(err => console.warn('Failed to refresh session on tier change:', err));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch rate limit status:', err);
    }
  }, [getAccessToken, isPremiumOverride, user, refreshSession]);

  const validateUrl = useCallback((testUrl: string): boolean => {
    const trimmed = testUrl.trim();
    if (!trimmed) {
      setUrlError(t('form.validation.required'));
      return false;
    }
    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
    if (!regex.test(trimmed)) {
      setUrlError(t('form.validation.invalid'));
      return false;
    }

    try {
      const urlWithProtocol = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
      const urlObj = new URL(urlWithProtocol);
      const hostname = urlObj.hostname.toLowerCase();
      const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';
      
      if (isYouTube) {
        const isShort = urlObj.pathname.startsWith('/shorts/');
        if (!isShort) {
          setUrlError(t('form.validation.youtubeShortsOnly'));
          return false;
        }
      }
    } catch (e) {
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
          setJobError('form.validation.unauthorized');
          setIsPending(false);
          localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
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
          localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
          return;
        }

        if (!response.ok || !data.success) {
          clearInterval(interval);
          setJobStatus('failed');
          setJobError(data.error || 'form.validation.failedCheck');
          setIsPending(false);
          localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
          return;
        }

        const job = data.job;
        setJobStatus(job.status);

        if (job.status === 'completed') {
          clearInterval(interval);
          setProgress(null);
          setIsPending(false);
          setUrl('');
          localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
          onExtractionSuccess(job.id);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setJobError(job.error || 'form.validation.failedExtraction');
          setProgress(null);
          setIsPending(false);
          localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
        } else {
          setProgress(job.progress || null);
        }
      } catch (err: unknown) {
        clearInterval(interval);
        setJobStatus('failed');
        setJobError(err instanceof Error ? err.message : 'form.validation.lostConnection');
        setProgress(null);
        setIsPending(false);
        localStorage.removeItem(PENDING_JOB_STORAGE_KEY);
      }
    }, 2000);
  }, [getAccessToken, onExtractionSuccess]);

  const triggerExtraction = useCallback(async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!validateUrl(cleanUrl)) return;

    setIsPending(true);
    setJobStatus('pending');
    setJobError(null);
    setJobErrorCode(null);
    setRecipe(null);
    setProgress(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('form.validation.unauthorized');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (isPremiumOverride) {
        headers['X-Simulate-Premium'] = 'true';
      }

      const response = await fetch(apiUrl('/api/extract-recipe'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: cleanUrl })
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
        throw Object.assign(new Error(data.error || 'form.validation.submitFailed'), { code: data.code });
      }

      setJobStatus(data.status);
      fetchLimitStatus();
      localStorage.setItem(PENDING_JOB_STORAGE_KEY, data.jobId);
      startPolling(data.jobId);
    } catch (err: unknown) {
      setJobStatus('failed');
      setJobError(err instanceof Error ? err.message : 'form.validation.submissionError');
      setJobErrorCode(err instanceof Error && 'code' in err ? (err as Error & { code?: string }).code ?? null : null);
      setIsPending(false);
    }
  }, [getAccessToken, startPolling, validateUrl, fetchLimitStatus]);

  // Resume a still-running extraction after a reload/restart wiped in-memory
  // state (e.g. the app was backgrounded and killed by the OS, or the PWA was
  // relaunched). Without this, the Extract tab looked blank even though a job
  // was still running, which led users to re-submit the same URL and end up
  // with two saved recipes for one source.
  const hasResumedPendingJobRef = useRef(false);
  useEffect(() => {
    if (hasResumedPendingJobRef.current) return;
    hasResumedPendingJobRef.current = true;

    const pendingJobId = localStorage.getItem(PENDING_JOB_STORAGE_KEY);
    if (!pendingJobId) return;

    setIsPending(true);
    setJobStatus('pending');
    startPolling(pendingJobId);
  }, [startPolling]);


  return {
    isPending,
    jobStatus,
    jobError,
    jobErrorCode,
    recipe,
    setRecipe,
    progress,
    url,
    setUrl,
    urlError,
    setUrlError,
    validateUrl,
    triggerExtraction,
    limitStatus,
    fetchLimitStatus
  };
}
