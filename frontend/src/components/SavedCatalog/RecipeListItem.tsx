import React from 'react';
import { Clock, ShoppingCart, Check, Star, Tag } from 'lucide-react';
import type { Job } from '../../types';
import CachedImage from '../CachedImage';

interface RecipeListItemProps {
  job: Job;
  isSelected: boolean;
  isSelectMode: boolean;
  isAdded: boolean;
  /** Pre-formatted total time, e.g. "35 Min." — null hides the badge. */
  totalTime: string | null;
  recipeTags: string[];
  bindLongPress: any;
  onClick: (e: React.MouseEvent) => void;
  onDirectAdd: (e: React.MouseEvent) => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

/**
 * Dense list row — the alternative to the poster grid. One line of title,
 * one line of meta. Like the poster card it no longer carries a delete
 * button; deleting happens in multi-select mode or from the detail view.
 */
export default function RecipeListItem({
  job,
  isSelected,
  isSelectMode,
  isAdded,
  totalTime,
  recipeTags,
  bindLongPress,
  onClick,
  onDirectAdd,
  onToggleFavorite
}: RecipeListItemProps) {
  const r = job.recipe!;
  const firstTag = recipeTags[0];
  const firstFlag = job.flags?.[0];

  return (
    <div
      className={`glass-panel rounded-2xl cursor-pointer active:scale-[0.99] transition-all p-2.5 flex flex-row items-center gap-3 overflow-hidden border select-none ${
        isSelected ? '!border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5 hover:border-emerald-500/30'
      }`}
      onClick={onClick}
      {...bindLongPress}
    >
      {/* Select mode checkbox */}
      {isSelectMode && (
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
          isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
        }`}>
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
        <CachedImage
          src={r.imageUrl}
          emoji={r.emoji}
          alt={r.title}
          className="w-full h-full object-cover object-center pointer-events-none select-none"
        />
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
          {r.title}
        </h4>

        <div className="flex items-center gap-1.5 min-w-0 text-xs text-gray-500 dark:text-gray-400">
          {totalTime && (
            <span className="flex items-center gap-1 shrink-0 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {totalTime}
            </span>
          )}
          {firstTag && (
            <>
              {totalTime && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0" />}
              <span className="truncate">{firstTag}</span>
            </>
          )}
          {firstFlag && (
            <span className="shrink-0 flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
              <Tag className="w-2.5 h-2.5" />
              <span className="truncate max-w-[6rem]">{firstFlag}</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isSelectMode && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e);
              }}
              className="text-gray-500 hover:text-amber-500 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle favorite"
            >
              <Star className={`w-4 h-4 ${job.isFavorite ? 'text-amber-500 fill-amber-500 stroke-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
            </button>
          )}
          <button
            className={`active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
              isAdded
                ? 'w-8 h-8 rounded-xl bg-emerald-500 text-white shadow-emerald-500/25 shadow-md'
                : 'text-gray-500 hover:text-emerald-500 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
            }`}
            onClick={onDirectAdd}
            aria-label="Direct add"
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 animate-scale-up" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
