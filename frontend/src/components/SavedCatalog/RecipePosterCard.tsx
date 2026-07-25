import React from 'react';
import { Clock, Check } from 'lucide-react';
import type { Job } from '../../types';
import CachedImage from '../CachedImage';
import { detectPlatform, PlatformIcon, PLATFORM_ICON_COLOR } from './PlatformIcon';

interface RecipePosterCardProps {
  job: Job;
  /** Pre-formatted total time, e.g. "35 Min." — null hides the badge. */
  totalTime: string | null;
  onClick: (e: React.MouseEvent) => void;
  /**
   * `grid` fills its column (2-up catalog grid), `shelf` is a fixed-width
   * card for the horizontally scrolling rows on the cookbook home.
   */
  variant?: 'grid' | 'shelf';
  isSelected?: boolean;
  isSelectMode?: boolean;
  bindLongPress?: any;
}

/**
 * Compact recipe poster: image, title, total time. Deliberately omits the
 * description and tag pills that the old card carried — those belong in the
 * detail view, and dropping them roughly triples how many recipes fit on a
 * screen. Delete moved to the multi-select bar / detail view.
 */
export default function RecipePosterCard({
  job,
  totalTime,
  onClick,
  variant = 'grid',
  isSelected = false,
  isSelectMode = false,
  bindLongPress,
}: RecipePosterCardProps) {
  const r = job.recipe!;
  const platform = detectPlatform(job.url);
  const iconColor = PLATFORM_ICON_COLOR[platform];
  const isShelf = variant === 'shelf';

  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden border cursor-pointer active:scale-[0.98] transition-all select-none flex flex-col ${
        isShelf ? 'w-[9.5rem] shrink-0' : 'w-full'
      } ${isSelected ? '!border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5 hover:border-emerald-500/30'}`}
      onClick={onClick}
      {...(bindLongPress ?? {})}
    >
      {/* Cover */}
      <div className="relative w-full aspect-[4/3] bg-black/5 dark:bg-white/5 overflow-hidden">
        <CachedImage
          src={r.imageUrl}
          emoji={r.emoji}
          alt={r.title}
          className="w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Select-mode checkbox */}
        {isSelectMode && (
          <div
            className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
              isSelected
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                : 'bg-black/40 backdrop-blur-sm border-white/30 text-white'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
          </div>
        )}

        {/* Source platform */}
        {!isSelectMode && (
          <div className="absolute bottom-1.5 left-1.5 z-[5] bg-white/25 dark:bg-black/25 backdrop-blur-md shadow-sm rounded-lg w-7 h-7 flex items-center justify-center pointer-events-none select-none">
            <PlatformIcon platform={platform} className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 px-3 py-2.5 flex-1">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {r.title}
        </h4>
        {totalTime && (
          <span className="mt-auto flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {totalTime}
          </span>
        )}
      </div>
    </div>
  );
}
