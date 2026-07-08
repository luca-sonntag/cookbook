import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, Key, TouchEvent } from 'react';

type SwipeDirection = 'next' | 'prev';

interface UseSwipeableTabsOptions<T extends string> {
  /** Ordered list of tab keys (left → right). */
  tabs: readonly T[];
  /** Initially selected tab. @default tabs[0] */
  defaultTab?: T;
  /**
   * Minimum horizontal distance (px) required to switch tabs on release.
   * @default 56
   */
  threshold?: number;
}

interface UseSwipeableTabsResult<T extends string> {
  activeTab: T;
  /** Programmatically switch tabs (animates in the correct direction). */
  selectTab: (tab: T) => void;
  /** Spread onto the HeroUI `<Tabs>` element for controlled selection. */
  tabsProps: {
    selectedKey: T;
    onSelectionChange: (key: Key) => void;
  };
  /** Spread onto the element that clips and receives the swipe gesture. */
  containerProps: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
    style: CSSProperties;
  };
  /** Spread onto the wrapper directly around the `<Tabs.Panel>`s. */
  panelProps: {
    key: T;
    className: string;
    style: CSSProperties;
  };
}

/** Distance the touch must travel before we lock onto a horizontal swipe. */
const AXIS_LOCK_SLOP = 8;

/**
 * Drives a HeroUI `<Tabs>` with a horizontal swipe gesture: the visible panel
 * follows the finger (with rubber-banding at the edges) and, once released past
 * `threshold`, the neighbouring tab is selected and animated in from the side
 * the swipe came from. Tapping a tab animates in the same way.
 *
 * Only the active panel is mounted by react-aria, so the incoming panel is
 * animated on mount via a keyed slide-in class rather than a two-panel track.
 */
export function useSwipeableTabs<T extends string>({
  tabs,
  defaultTab,
  threshold = 56,
}: UseSwipeableTabsOptions<T>): UseSwipeableTabsResult<T> {
  const [activeTab, setActiveTab] = useState<T>(defaultTab ?? tabs[0]);
  const [direction, setDirection] = useState<SwipeDirection | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<'horizontal' | 'vertical' | null>(null);
  const tracking = useRef(false);

  const selectTab = useCallback(
    (tab: T) => {
      const currentIdx = tabs.indexOf(activeTab);
      const nextIdx = tabs.indexOf(tab);
      if (nextIdx === -1 || nextIdx === currentIdx) return;
      setDirection(nextIdx > currentIdx ? 'next' : 'prev');
      setActiveTab(tab);
    },
    [tabs, activeTab]
  );

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current = null;
    tracking.current = true;
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      // Wait until the gesture has a clear direction before committing to it,
      // so vertical scrolling is never hijacked.
      if (axis.current === null) {
        if (Math.abs(dx) < AXIS_LOCK_SLOP && Math.abs(dy) < AXIS_LOCK_SLOP) return;
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        if (axis.current === 'horizontal') setIsDragging(true);
      }
      if (axis.current !== 'horizontal') return;

      // Rubber-band when dragging past the first/last tab (no neighbour to reveal).
      const idx = tabs.indexOf(activeTab);
      const atStart = idx === 0 && dx > 0;
      const atEnd = idx === tabs.length - 1 && dx < 0;
      setDragOffset(atStart || atEnd ? dx / 3 : dx);
    },
    [tabs, activeTab]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const wasHorizontal = axis.current === 'horizontal';
      axis.current = null;
      setIsDragging(false);
      setDragOffset(0); // settle back to 0 (transition animates the spring-back)
      if (!wasHorizontal) return;

      const dx = e.changedTouches[0].clientX - startX.current;
      const idx = tabs.indexOf(activeTab);
      if (dx <= -threshold && idx < tabs.length - 1) {
        selectTab(tabs[idx + 1]);
      } else if (dx >= threshold && idx > 0) {
        selectTab(tabs[idx - 1]);
      }
    },
    [tabs, activeTab, threshold, selectTab]
  );

  const animationClass =
    direction === 'next'
      ? 'animate-tab-in-right'
      : direction === 'prev'
        ? 'animate-tab-in-left'
        : '';

  return {
    activeTab,
    selectTab,
    tabsProps: {
      selectedKey: activeTab,
      onSelectionChange: (key: Key) => selectTab(key as T),
    },
    containerProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      style: { touchAction: 'pan-y', overflow: 'hidden' },
    },
    panelProps: {
      key: activeTab,
      className: animationClass,
      style: {
        transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s ease',
        willChange: 'transform',
      },
    },
  };
}
