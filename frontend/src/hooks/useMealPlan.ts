import { useState, useCallback, useEffect } from 'react';
import type { MealPlan, MealPlanEntry, MealPlanConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { resolveErrorCode } from '../i18n';
import { apiUrl } from '../api';

interface ApiResult<T> {
  success: boolean;
  data?: T;
  /** Localized, ready-to-display error message. */
  error?: string;
}

/**
 * Client for the weekly meal planner API. Follows the app's manual
 * fetch + useState convention (no React Query), mirroring `useCollections`.
 */
export function useMealPlan() {
  const { getAccessToken, user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(async () => {
    const token = await getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, [getAccessToken]);

  /** Turn a failed response body into a localized message. */
  const toError = useCallback((data: any): string => {
    return resolveErrorCode(data?.code, data?.params, data?.error, language) || t('planner.createError');
  }, [language, t]);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch(apiUrl('/api/meal-plans'), { headers });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Load plans once auth settles (in parallel with the rest of the app).
  useEffect(() => {
    if (!authLoading && user) refreshPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const generatePlan = useCallback(async (
    config: MealPlanConfig & { title?: string | null },
  ): Promise<ApiResult<MealPlan>> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(apiUrl('/api/meal-plans/generate'), {
        method: 'POST',
        headers,
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlans(prev => [data.plan, ...prev]);
        return { success: true, data: data.plan };
      }
      return { success: false, error: toError(data) };
    } catch (err: any) {
      console.error('Error generating meal plan:', err);
      return { success: false, error: t('planner.createError') };
    }
  }, [getHeaders, toError, t]);

  const swapEntry = useCallback(async (
    planId: string,
    entryId: string,
  ): Promise<ApiResult<MealPlanEntry>> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(apiUrl(`/api/meal-plans/${planId}/entries/${entryId}/swap`), {
        method: 'POST',
        headers,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlans(prev => prev.map(p => p.id === planId
          ? { ...p, entries: (p.entries || []).map(e => e.id === entryId ? data.entry : e) }
          : p));
        return { success: true, data: data.entry };
      }
      return { success: false, error: toError(data) };
    } catch (err: any) {
      console.error('Error swapping meal plan entry:', err);
      return { success: false, error: t('planner.swapError') };
    }
  }, [getHeaders, toError, t]);

  const deletePlan = useCallback(async (planId: string): Promise<ApiResult<null>> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(apiUrl(`/api/meal-plans/${planId}`), {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlans(prev => prev.filter(p => p.id !== planId));
        return { success: true };
      }
      return { success: false, error: toError(data) };
    } catch (err: any) {
      console.error('Error deleting meal plan:', err);
      return { success: false, error: t('planner.createError') };
    }
  }, [getHeaders, toError, t]);

  return { plans, loading, refreshPlans, generatePlan, swapEntry, deletePlan };
}
