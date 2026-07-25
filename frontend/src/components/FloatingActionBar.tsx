import type { ReactNode } from 'react';

interface FloatingActionBarProps {
  /**
   * Children are rendered inside the pill container, separated by a thin
   * vertical divider. Use any combination of buttons, icons or custom nodes.
   */
  children: ReactNode;
  /**
   * Additional classes applied to the outermost fixed wrapper, e.g. to control
   * the vertical position (defaults to `bottom-6`).
   */
  className?: string;
  /**
   * Slides the bar out of view (downwards) without unmounting it, so it can be
   * hidden while the user scrolls through content and brought back afterwards.
   */
  isHidden?: boolean;
}

/**
 * FloatingActionBar – a generic, glassmorphism pill that anchors to the
 * bottom-center of the viewport. Used for both recipe actions and the
 * shopping-list clear buttons.
 *
 * Content composition is up to the caller; the bar just provides the
 * frosted-glass container, the rounded-full shape and the soft shadow.
 */
export default function FloatingActionBar({ children, className = '', isHidden = false }: FloatingActionBarProps) {
  const hasBottomClass = className.split(' ').some(c => c.startsWith('bottom-') || c.includes(':bottom-'));
  const defaultBottom = hasBottomClass ? '' : 'bottom-6';

  // Only the translate is toggled: `animate-fade-in-up` runs with `forwards`,
  // so an opacity utility here would lose against the animation's held end
  // frame. Sliding the bar fully past the bottom edge hides it just as well.
  const hiddenClasses = isHidden
    ? 'translate-y-[calc(100%+2.5rem)] pointer-events-none'
    : 'translate-y-0';

  return (
    <div
      className={`fixed ${defaultBottom} left-1/2 -translate-x-1/2 z-40 animate-fade-in-up transition-transform duration-300 ease-in-out ${hiddenClasses} ${className}`}
    >
      <div className="flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/**
 * Vertical 1px divider used between actions inside a FloatingActionBar.
 * Renders nothing when `show` is false so callers can conditionally include
 * adjacent dividers without duplicating layout math.
 */
export function FloatingDivider({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10 mx-2" />;
}