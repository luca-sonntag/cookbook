import React from 'react';
import { Card } from '@heroui/react';
import { Clock, Utensils, ShoppingCart, Check, Trash2 } from 'lucide-react';
import type { Job } from '../../types';
import CachedImage from '../CachedImage';

// Custom SVG component for Instagram icon
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface RecipeCardProps {
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

export default function RecipeCard({
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
}: RecipeCardProps) {
  const r = job.recipe!;

  return (
    <Card
      className={`glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all flex flex-col justify-between overflow-hidden relative border ${
        isSelected ? '!border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-black/5 dark:border-white/5'
      }`}
      onClick={onClick}
      {...bindLongPress}
    >
      {/* Fallback Checkbox overlay in select mode when no image exists */}
      {isSelectMode && !r.imageUrl && (
        <div
          className={`absolute top-4 left-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
            isSelected
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 text-gray-500 dark:text-gray-400'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
        </div>
      )}

      <div>
        {/* Thumbnail Image Container */}
        {r.imageUrl && (
          <div className="h-32 w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
            <CachedImage
              src={r.imageUrl}
              alt={r.title}
              className="w-full h-full object-cover object-center rounded-t-2xl"
            />
            {/* Checkbox overlay inside the thumbnail container */}
            {isSelectMode && (
              <div
                className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                    : 'bg-black/40 backdrop-blur-sm border-white/30 text-white'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
              </div>
            )}
            {/* Creator Badge Overlay */}
            {r.instagramHandle && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-semibold backdrop-blur-sm pointer-events-none select-none z-[5] border border-white/10 shadow-md">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>{r.instagramHandle}</span>
              </div>
            )}

            {/* KI Tag Badges Overlays */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-[5]">
              {durationBadge && (
                <span className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm select-none border border-white/5 shadow-sm">
                  {durationBadge}
                </span>
              )}
              {recipeTags.map((tag: string, idx: number) => (
                <span key={idx} className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm select-none border border-white/5 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="flex justify-between items-start gap-2 px-5 pt-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
            {r.title}
          </h4>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed px-5">
          {r.description}
        </p>
      </div>

      {/* Footer with stats & direct shopping list button + delete button */}
      <div className="flex items-center justify-between mt-4 pt-3 px-5 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex gap-2">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-500" /> {formattedPrepTime}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Utensils className="w-3.5 h-3.5 text-emerald-500" /> {formattedCookTime}
          </span>
        </div>

        {!isSelectMode && (
          <div className="flex items-center gap-2">
            <button
              className={`active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                isAdded
                  ? 'w-8 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent text-xs'
                  : 'text-gray-500 hover:text-emerald-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
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
              className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Delete recipe"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
