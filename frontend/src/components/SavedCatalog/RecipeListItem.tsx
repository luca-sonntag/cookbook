import React from 'react';
import { Card } from '@heroui/react';
import { Clock, Utensils, ShoppingCart, Check, Trash2 } from 'lucide-react';
import type { Job } from '../../types';
import CachedImage from '../CachedImage';

interface RecipeListItemProps {
  job: Job;
  isSelected: boolean;
  isSelectMode: boolean;
  isAdded: boolean;
  durationBadge: string | null;
  recipeTags: string[];
  formattedPrepTime: string;
  formattedCookTime: string;
  bindLongPress: any;
  onClick: (e: React.MouseEvent) => void;
  onDirectAdd: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function RecipeListItem({
  job,
  isSelected,
  isSelectMode,
  isAdded,
  durationBadge,
  recipeTags,
  formattedPrepTime,
  formattedCookTime,
  bindLongPress,
  onClick,
  onDirectAdd,
  onDelete
}: RecipeListItemProps) {
  const r = job.recipe!;

  return (
    <Card
      className={`glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all p-3 flex flex-row items-center gap-3 overflow-hidden relative border ${
        isSelected ? '!border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5'
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

      {/* Thumbnail Image */}
      {r.imageUrl && (
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 shrink-0 relative">
          <CachedImage
            src={r.imageUrl}
            alt={r.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate pr-4">
          {r.title}
        </h4>
        {/* Tag pills under the name */}
        {(durationBadge || recipeTags.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1 pr-20">
            {durationBadge && (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full select-none whitespace-nowrap">
                {durationBadge}
              </span>
            )}
            {recipeTags.slice(0, 2).map((tag: string, idx: number) => (
              <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full select-none whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 pr-20">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" /> {formattedPrepTime}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span className="flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5 text-emerald-500" /> {formattedCookTime}
          </span>
        </p>
      </div>

      {/* Actions */}
      {!isSelectMode && (
        <div className="absolute right-3 bottom-2 flex items-center gap-1.5">
          <button
            className={`active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
              isAdded
                ? 'w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent text-xs'
                : 'text-gray-500 hover:text-emerald-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
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
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Delete recipe"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );
}
