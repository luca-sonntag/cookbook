import { Crown } from 'lucide-react';

interface PremiumHintProps {
  onClick: () => void;
  /** Main hint text. */
  label: string;
  /** Optional trailing call-to-action label (banner variant only), e.g. "Upgrade". */
  cta?: string;
  /** `banner` = full-width row surface, `inline` = compact text link. */
  variant?: 'banner' | 'inline';
  className?: string;
}

/**
 * Unified premium upsell hint. Every touchpoint (catalog banner, extract-form
 * link, …) shares one "gold crown on emerald" language so they read as the same
 * system as the PremiumModal and the Settings upgrade card. This is the single
 * source of truth for that style — do not restyle the hints at the call sites.
 */
export default function PremiumHint({
  onClick,
  label,
  cta,
  variant = 'banner',
  className = ''
}: PremiumHintProps) {
  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors ${className}`}
      >
        <Crown className="w-3 h-3" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:border-emerald-400/15 hover:from-emerald-500/15 hover:to-teal-500/15 active:scale-[0.99] transition-all text-left ${className}`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-full bg-amber-400/90 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/30">
          <Crown className="w-3.5 h-3.5 text-emerald-950" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
          {label}
        </span>
      </span>
      {cta && (
        <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
          {cta}
        </span>
      )}
    </button>
  );
}
