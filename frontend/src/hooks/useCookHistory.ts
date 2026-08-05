import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../api';
import { useAuth } from '../context/AuthContext';

export interface CookHistoryItem {
  id: string;
  cookedAt: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  viaCookingMode: boolean;
  timerElapsed: boolean;
}

export interface CookHistory {
  count: number;
  firstCookedAt: string | null;
  lastCookedAt: string | null;
  items: CookHistoryItem[];
}

/**
 * Fetches per-job cook history (count + timeline) for the recipe detail view.
 * Refetches when `refreshKey` changes (e.g. right after marking a cook) so the
 * chip and timeline update immediately.
 */
export function useCookHistory(jobId: string | undefined, refreshKey = 0) {
  const { getAccessToken } = useAuth();
  const [history, setHistory] = useState<CookHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    const token = await getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/jobs/${jobId}/cook-history`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistory({
            count: data.count ?? 0,
            firstCookedAt: data.firstCookedAt ?? null,
            lastCookedAt: data.lastCookedAt ?? null,
            items: data.items ?? [],
          });
        }
      }
    } catch (err) {
      console.warn('[useCookHistory] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, getAccessToken]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { history, loading, reload: load };
}
