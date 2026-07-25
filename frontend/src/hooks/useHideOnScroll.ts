import { useEffect, useRef, useState } from 'react';

interface UseHideOnScrollOptions {
  /**
   * Minimum distance (px) the scroll position must travel in one direction
   * before the visibility flips. Keeps the bar from flickering on the small
   * jitter that touch scrolling and momentum produce.
   * @default 12
   */
  threshold?: number;
  /**
   * The element stays visible while the page is scrolled less than this many
   * pixels from the top, so it never hides on a short page or right after the
   * view opens.
   * @default 80
   */
  revealOffset?: number;
  /** Set to false to pin the element visible (e.g. while an overlay is open). */
  enabled?: boolean;
}

/**
 * Tracks the scroll direction of the document and reports whether a floating
 * element should be hidden: scrolling down hides it, scrolling up (or being
 * near the top of the page) brings it back.
 *
 * Reads are batched into a `requestAnimationFrame` so the passive scroll
 * listener never lays out on every event.
 */
export function useHideOnScroll({
  threshold = 12,
  revealOffset = 80,
  enabled = true,
}: UseHideOnScrollOptions = {}): boolean {
  const [isHidden, setIsHidden] = useState(false);
  const lastYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsHidden(false);
      return;
    }

    lastYRef.current = window.scrollY;

    const evaluate = () => {
      frameRef.current = null;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastYRef.current;

      if (y <= revealOffset) {
        lastYRef.current = y;
        setIsHidden(false);
        return;
      }
      if (Math.abs(delta) < threshold) return;

      lastYRef.current = y;
      setIsHidden(delta > 0);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(evaluate);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [threshold, revealOffset, enabled]);

  return isHidden;
}
