import { useEffect } from 'react';

interface UseSwipeBackOptions {
  /** Whether the swipe listener should be active. */
  isActive: boolean;
  /** Called when a valid swipe-back gesture is detected. */
  onSwipe: () => void;
  /**
   * Maximum X position (in px) from the left edge where the touch must START.
   * @default 40
   */
  edgeThreshold?: number;
  /**
   * Minimum horizontal swipe distance (in px) required to trigger.
   * @default 80
   */
  minSwipeDistance?: number;
  /**
   * Maximum absolute vertical movement (in px) allowed during the swipe.
   * Prevents triggering on diagonal scrolls.
   * @default 60
   */
  maxVerticalDrift?: number;
}

/**
 * Detects a swipe-right gesture starting within `edgeThreshold` pixels of the
 * left screen edge and calls `onSwipe` when the gesture meets the thresholds.
 *
 * Used for "swipe to go back" interactions on mobile.
 */
export function useSwipeBack({
  isActive,
  onSwipe,
  edgeThreshold = 40,
  minSwipeDistance = 80,
  maxVerticalDrift = 60,
}: UseSwipeBackOptions) {
  useEffect(() => {
    if (!isActive) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (startX <= edgeThreshold && dx >= minSwipeDistance && dy < maxVerticalDrift) {
        onSwipe();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isActive, onSwipe, edgeThreshold, minSwipeDistance, maxVerticalDrift]);
}
