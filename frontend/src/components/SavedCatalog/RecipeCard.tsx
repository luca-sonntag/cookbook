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

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
);

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'website';

function detectPlatform(url?: string): Platform {
  if (!url) return 'website';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  } catch { /* ignore */ }
  return 'website';
}

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  switch (platform) {
    case 'instagram': return <InstagramIcon className={className} />;
    case 'tiktok': return <TikTokIcon className={className} />;
    case 'youtube': return <YouTubeIcon className={className} />;
    default: return <GlobeIcon className={className} />;
  }
}

const PLATFORM_ICON_COLOR: Record<Platform, string> = {
  instagram: 'text-pink-400',
  tiktok: 'text-cyan-300',
  youtube: 'text-red-400',
  website: 'text-blue-300',
};

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

// --- Class Name Constants ---
const styles = {
  cardBase: "glass-panel rounded-2xl hover:border-emerald-500/30 cursor-pointer active:scale-[0.99] transition-all flex flex-col gap-0 justify-between overflow-hidden relative border select-none",
  cardSelected: "!border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10",
  cardUnselected: "border-black/5 dark:border-white/5",

  fallbackCheckbox: "absolute top-4 left-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all border",
  fallbackCheckboxSelected: "bg-emerald-500 border-emerald-500 text-white shadow-md",
  fallbackCheckboxUnselected: "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 text-gray-500 dark:text-gray-400",

  imageContainer: "h-32 w-full bg-black/5 dark:bg-white/5 relative overflow-hidden",
  image: "w-full h-full object-cover object-center rounded-t-2xl pointer-events-none select-none",

  imageCheckbox: "absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all border",
  imageCheckboxSelected: "bg-emerald-500 border-emerald-500 text-white shadow-md",
  imageCheckboxUnselected: "bg-black/40 backdrop-blur-sm border-white/30 text-white",

  instagramBadge: "absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 font-semibold backdrop-blur-sm pointer-events-none select-none z-[5] border border-white/10 shadow-md",

  inlineTagBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full select-none whitespace-nowrap",

  titleContainer: "flex justify-between items-start gap-2 px-5 pt-3",
  title: "text-base font-bold text-gray-900 dark:text-white line-clamp-1",
  description: "text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed px-5",

  footer: "flex items-center justify-between pt-3 px-5 border-t border-black/5 dark:border-white/5 text-sm text-gray-500 dark:text-gray-400",

  addBtnBase: "active:scale-95 transition-all cursor-pointer flex items-center justify-center",
  addBtnAdded: "w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-500 scale-110 shadow-emerald-500/25 shadow-md border-transparent text-xs",
  addBtnNotAdded: "text-gray-500 hover:text-emerald-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors",

  deleteBtn: "text-gray-500 hover:text-red-500 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
};

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
  const platform = detectPlatform(job.url);
  const iconColor = PLATFORM_ICON_COLOR[platform];

  return (
    <Card
      className={`${styles.cardBase} ${isSelected ? styles.cardSelected : styles.cardUnselected}`}
      onClick={onClick}
      {...bindLongPress}
    >
      {/* Fallback Checkbox overlay in select mode when no image exists */}
      {isSelectMode && !r.imageUrl && (
        <div className={`${styles.fallbackCheckbox} ${isSelected ? styles.fallbackCheckboxSelected : styles.fallbackCheckboxUnselected}`}>
          {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Thumbnail Image Container */}
        {r.imageUrl && (
          <div className={styles.imageContainer}>
            <CachedImage
              src={r.imageUrl}
              alt={r.title}
              className={styles.image}
            />
            {/* Checkbox overlay inside the thumbnail container */}
            {isSelectMode && (
              <div className={`${styles.imageCheckbox} ${isSelected ? styles.imageCheckboxSelected : styles.imageCheckboxUnselected}`}>
                {isSelected && <Check className="w-4 h-4 text-white stroke-[3px]" />}
              </div>
            )}
            {/* Creator Badge Overlay */}
            {r.instagramHandle && (
              <div className={styles.instagramBadge}>
                <PlatformIcon platform={platform} className={`w-3.5 h-3.5 ${iconColor}`} />
                <span>{r.instagramHandle}</span>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className={styles.titleContainer}>
          <h4 className={styles.title}>
            {r.title}
          </h4>
        </div>

        {/* Description */}
        <p className={styles.description}>
          {r.description}
        </p>

        {/* Tag pills under the description */}
        {(durationBadge || recipeTags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-5 mt-auto pt-4">
            {durationBadge && (
              <span className={styles.inlineTagBadge}>
                {durationBadge}
              </span>
            )}
            {recipeTags.map((tag: string, idx: number) => (
              <span key={idx} className={styles.inlineTagBadge}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats & direct shopping list button + delete button */}
      <div className={styles.footer}>
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
              className={`${styles.addBtnBase} ${isAdded ? styles.addBtnAdded : styles.addBtnNotAdded}`}
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
              className={styles.deleteBtn}
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

