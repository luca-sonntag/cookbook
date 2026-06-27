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
}

/**
 * FloatingActionBar – a generic, glassmorphism pill that anchors to the
 * bottom-center of the viewport. Used for both recipe actions and the
 * shopping-list clear buttons.
 *
 * Content composition is up to the caller; the bar just provides the
 * frosted-glass container, the rounded-full shape and the soft shadow.
 */
export default function FloatingActionBar({ children, className = '' }: FloatingActionBarProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up ${className}`}
    >
      <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2 py-1.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xl">
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
  return <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10 mx-1.5" />;
}