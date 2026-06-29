import { useSwipeBack } from './useSwipeBack';

/**
 * Adds a swipe-right-from-left-edge gesture to trigger a "go back" action.
 *
 * NOTE: Browser history management (pushState / popstate) is intentionally
 * omitted here. The app uses hash-based routing (useHashRouter), which already
 * creates proper browser history entries for every navigation. This hook only
 * layers the swipe gesture on top.
 */
export function useMobileNavigationBack(
  isActive: boolean,
  onGoBack: () => void
) {
  useSwipeBack({ isActive, onSwipe: onGoBack });
}
