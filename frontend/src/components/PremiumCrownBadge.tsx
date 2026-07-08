import { Crown } from 'lucide-react';

/**
 * Small amber crown "seal" marking a premium-locked control. Renders as an
 * absolutely-positioned corner badge, so the parent must be `relative`.
 * Single source of truth for the locked-button premium marker (cooking-mode
 * start buttons, remix) — keeps the crown = premium language consistent.
 */
export default function PremiumCrownBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-gray-900 shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      aria-hidden="true"
    >
      <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
    </span>
  );
}
