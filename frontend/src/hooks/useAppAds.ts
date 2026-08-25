import { useEffect, useRef } from 'react';
import { APP_OPEN_RESUME_MIN_BG_MS } from '../env';
import { registerAppStateListener, clearRecipeReadyNotification } from '../native';
import type { Recipe } from '../types';

interface UseAppAdsProps {
  user: { id: string } | null;
  authLoading: boolean;
  isPremium: boolean;
  isPending: boolean;
  recipe: Recipe | null;
  showOnboarding: boolean;
}

export function useAppAds({
  user,
  authLoading,
  isPremium,
  isPending,
  recipe,
  showOnboarding,
}: UseAppAdsProps) {
  const appOpenAttemptedRef = useRef(false);
  const appBackgroundedAtRef = useRef<number | null>(null);
  const appOpenBlockedRef = useRef(true);
  appOpenBlockedRef.current = isPremium || isPending || !!recipe || showOnboarding;

  // Initialize Billing and Ads once user is resolved
  useEffect(() => {
    if (authLoading || !user) return;

    // Initialize RevenueCat billing for the logged-in user
    import('../utils/purchase')
      .then(({ initBilling }) => {
        initBilling(user.id);
      })
      .catch((err) => console.error('Failed to load billing module:', err));

    // Initialize AdMob (+ EU consent)
    import('../utils/ads')
      .then(({ initAds }) => {
        initAds();
      })
      .catch((err) => console.error('Failed to load ads module:', err));
  }, [authLoading, user]);

  // App-Open ad: a full-screen interstitial shown ONCE on a neutral cold start
  useEffect(() => {
    if (authLoading || !user || showOnboarding) return;
    if (appOpenAttemptedRef.current) return;
    appOpenAttemptedRef.current = true;
    if (appOpenBlockedRef.current) return;

    import('../utils/ads')
      .then(({ appOpenAdWouldShow, preloadAppOpenAd }) => {
        if (appOpenAdWouldShow()) preloadAppOpenAd();
      })
      .catch(() => {});

    const id = setTimeout(() => {
      if (appOpenBlockedRef.current) return;
      import('../utils/ads')
        .then(({ maybeShowAppOpenAd }) => maybeShowAppOpenAd())
        .catch((err) => console.error('Failed to load ads module:', err));
    }, 1200);

    return () => clearTimeout(id);
  }, [authLoading, user, showOnboarding]);

  // App-Open ad on RESUME
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = registerAppStateListener((isActive) => {
      if (!isActive) {
        appBackgroundedAtRef.current = Date.now();
        return;
      }
      clearRecipeReadyNotification();
      const bgAt = appBackgroundedAtRef.current;
      appBackgroundedAtRef.current = null;
      if (bgAt == null || Date.now() - bgAt < APP_OPEN_RESUME_MIN_BG_MS) return;
      if (appOpenBlockedRef.current) return;

      import('../utils/ads')
        .then(({ appOpenAdWouldShow, preloadAppOpenAd }) => {
          if (appOpenAdWouldShow()) preloadAppOpenAd();
        })
        .catch(() => {});

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (appOpenBlockedRef.current) return;
        import('../utils/ads')
          .then(({ maybeShowAppOpenAd }) => maybeShowAppOpenAd())
          .catch((err) => console.error('Failed to load ads module:', err));
      }, 1200);
    });

    return () => {
      if (timer) clearTimeout(timer);
      cleanup();
    };
  }, []);
}
