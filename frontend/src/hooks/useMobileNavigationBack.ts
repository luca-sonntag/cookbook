import { useEffect, useRef } from 'react';

/**
 * Adds a swipe-right-from-left-edge gesture to trigger a "go back" action.
 *
 * NOTE: We intentionally do NOT push/intercept browser history entries here.
 * The app uses hash-based routing (useHashRouter), which already creates proper
 * browser history entries for every navigation. The popstate / hashchange events
 * are handled by the router. This hook only adds the swipe gesture on top.
 */
export function useMobileNavigationBack(
  isActive: boolean,
  onGoBack: () => void
) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
