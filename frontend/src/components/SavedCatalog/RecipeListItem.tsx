import React from 'react';
import { Card } from '@heroui/react';
import { Clock, Utensils, ShoppingCart, Check, Trash2 } from 'lucide-react';
import type { Job } from '../../types';

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
      className={`glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all p-3 flex flex-row items-center gap-3 overflow-hidden border ${
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
          <img
            src={r.imageUrl.startsWith('/') ? r.imageUrl : `/api/image?url=${encodeURIComponent(r.imageUrl)}`}
            alt={r.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {r.title}
          </h4>
          {/* Tag pills (1 in compact view to save space) */}
          {durationBadge && (
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full select-none">
              {durationBadge}
            </span>
          )}
          {recipeTags.slice(0, 1).map((tag: string, idx: number) => (
            <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full select-none">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
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
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={`active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
              isAdded
                ? 'w-8 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent text-xs'
                : 'text-gray-500 hover:text-emerald-500 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
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
            className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Delete recipe"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );
}
