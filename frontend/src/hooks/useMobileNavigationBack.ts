import { useEffect, useRef } from 'react';

export function useMobileNavigationBack(
  isActive: boolean,
  onGoBack: () => void
) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Push browser history state when the detail view becomes active
  useEffect(() => {
    if (isActive) {
      window.history.pushState({ mobileNavigationBack: true }, '');
    }
  }, [isActive]);

  // Intercept back-button clicks (system back gesture / button on mobile)
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (isActive) {
        e.preventDefault?.();
        onGoBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isActive, onGoBack]);

  // Intercept swipe-right gesture from left screen edge to go back
  useEffect(() => {
    if (!isActive) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      // Trigger go back if swiped right >= 80px starting within 40px of left edge
      if (touchStartX.current <= 40 && dx >= 80 && dy < 60) {
        onGoBack();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isActive, onGoBack]);
}
