import React from 'react';
import { Button } from '@heroui/react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ChefHat
} from 'lucide-react';
import type { Recipe } from '../types';
import { useImageGallery } from '../hooks/useImageGallery';
import { useI18n } from '../context/I18nContext';
import CachedImage from './CachedImage';
import { getCachedImage } from '../utils/imageStore';

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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
);

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'website';

function detectPlatform(url: string): Platform {
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

function platformIconColor(platform: Platform): string {
  switch (platform) {
    case 'instagram': return 'text-pink-400';
    case 'tiktok': return 'text-cyan-300';
    case 'youtube': return 'text-red-400';
    default: return 'text-blue-300';
  }
}

interface RecipeImageGalleryProps {
  recipe: Recipe;
  reelUrl?: string;
  onBack?: () => void;
}

export default function RecipeImageGallery({ recipe, reelUrl, onBack }: RecipeImageGalleryProps) {
  const { t } = useI18n();

  // Derive initial list (excluding local: URLs since they need to be verified asynchronously)
  const initialImages = (recipe.imageUrls && recipe.imageUrls.length > 0
    ? recipe.imageUrls
    : (recipe.imageUrl ? [recipe.imageUrl] : [])
  ).filter(url => !url.startsWith('local:'));

  const [availableImages, setAvailableImages] = React.useState<string[]>(initialImages);

  React.useEffect(() => {
    let isMounted = true;
    async function checkLocalImages() {
      const urls = recipe.imageUrls && recipe.imageUrls.length > 0
        ? recipe.imageUrls
        : (recipe.imageUrl ? [recipe.imageUrl] : []);

      const checks = await Promise.all(
        urls.map(async (url) => {
          if (url.startsWith('local:')) {
            const cached = await getCachedImage(url);
            return cached ? url : null;
          }
          return url;
        })
      );

      const valid = checks.filter((url): url is string => url !== null);
      if (isMounted) {
        setAvailableImages(valid);
      }
    }
    checkLocalImages();
    return () => {
      isMounted = false;
    };
  }, [recipe.imageUrls, recipe.imageUrl]);

  const images = availableImages;

  const {
    fullscreenIndex,
    setFullscreenIndex,
    scale,
    offset,
    swipeTranslation,
    isDraggingImage,
    fullscreenContainerRef,
    scrollContainerRef,
    isDragging,
    handleNextImage,
    handlePrevImage,
    handleDoubleTap,
    handleFullscreenPointerDown,
    handleFullscreenPointerMove,
    handleFullscreenPointerUp,
    handleKeyDown,
    handleFullscreenContainerClick,
    handlePointerDown,
    handlePointerLeave,
    handlePointerUp,
    handlePointerMove,
    handleImageClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageGallery(images);

  const overlayButtons = (
    <>
      {/* Floating Back Button */}
      {onBack && (
        <Button
          isIconOnly
          onPress={onBack}
          className="absolute top-4 left-4 z-20 bg-black/65 hover:bg-emerald-600/90 text-white w-9 h-9 min-w-0 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Floating Bottom Actions */}
      {(reelUrl || recipe.instagramHandle) && (() => {
        const platform = reelUrl ? detectPlatform(reelUrl) : 'instagram';
        const iconColor = platformIconColor(platform);

        // Build author profile URL based on platform. If it's a display name (contains spaces/invalid chars), link to the Reel itself instead.
        const handle = recipe.instagramHandle?.replace('@', '').trim() || '';
        const isValidUsername = /^[a-zA-Z0-9._-]+$/.test(handle);
        const authorHref = isValidUsername
          ? (platform === 'instagram'
            ? `https://instagram.com/${handle}`
            : platform === 'tiktok'
            ? `https://tiktok.com/@${handle}`
            : platform === 'youtube'
            ? `https://youtube.com/@${handle}`
            : reelUrl || '#')
          : (reelUrl || '#');

        return (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            {recipe.instagramHandle && (
              <a
                href={authorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/65 hover:bg-emerald-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border border-white/10 shadow-md transition-all duration-300 hover:scale-105"
              >
                <PlatformIcon platform={platform} className={`w-3 h-3 ${iconColor}`} />
                <span>{recipe.instagramHandle}</span>
              </a>
            )}
            {reelUrl && (
              <a
                href={reelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/65 hover:bg-emerald-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:scale-105"
              >
                <PlatformIcon platform={platform} className={`w-3 h-3 ${iconColor}`} />
                <span>{t('catalog.viewReel')}</span>
              </a>
            )}
          </div>
        );
      })()}
    </>
  );

  return (
    <>
      {/* Inline Gallery */}
      {availableImages.length > 1 ? (
        <div className="-mt-6 -mx-6 mb-6 relative group">
          {overlayButtons}
          <div
            ref={scrollContainerRef}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            className={`flex overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'md:cursor-pointer cursor-grab snap-x snap-mandatory'}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {availableImages.map((img, idx) => {
              return (
                <div key={idx} className="w-full shrink-0 snap-center snap-always relative">
                  <CachedImage
                    src={img}
                    emoji={recipe.emoji}
                    draggable={false}
                    alt={`${recipe.title} - view ${idx + 1}`}
                    className={`w-full h-56 object-cover object-center transition-transform duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                      }`}
                    onClick={() => handleImageClick(idx)}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none opacity-80 backdrop-blur-sm">
                    {idx + 1} / {availableImages.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : availableImages.length === 1 ? (
        <div className="-mt-6 -mx-6 mb-6 bg-black/5 dark:bg-white/5 relative group">
          {overlayButtons}
          <CachedImage
            src={availableImages[0]}
            emoji={recipe.emoji}
            alt={recipe.title}
            className="w-full h-56 object-cover object-center cursor-pointer"
            onClick={() => {
              setFullscreenIndex(0);
            }}
          />
        </div>
      ) : (
        <div className="-mt-6 -mx-6 mb-6 h-48 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-indigo-500/[0.04] border-b border-black/5 dark:border-white/5 relative flex items-center justify-center overflow-hidden">
          {overlayButtons}
          {recipe.emoji ? (
            <span className="text-5xl select-none" role="img" aria-label="recipe emoji">
              {recipe.emoji}
            </span>
          ) : (
            <ChefHat className="w-12 h-12 text-emerald-500/20 dark:text-emerald-400/15 animate-pulse" />
          )}
        </div>
      )}

      {/* Fullscreen Overlay */}
      {fullscreenIndex !== null && images.length > 0 && createPortal(
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-0 m-0 select-none overflow-hidden touch-none outline-none"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          onClick={handleFullscreenContainerClick}
        >
          {/* Top Controls Overlay */}
          <div className="absolute top-[calc(1rem_+_var(--safe-area-inset-top))] right-4 z-[101] flex items-center gap-2">
            {/* Close Button */}
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => setFullscreenIndex(null)}
              className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full border-none"
              aria-label="Close fullscreen"
            >
              <X size={22} />
            </Button>
          </div>

          {/* Carousel Slider */}
          <div
            className="w-full h-full flex items-center justify-center relative"
            onPointerDown={handleFullscreenPointerDown}
            onPointerMove={handleFullscreenPointerMove}
            onPointerUp={handleFullscreenPointerUp}
            onPointerCancel={handleFullscreenPointerUp}
            onDoubleClick={handleDoubleTap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <div
              className={`flex w-full h-full ${!isDraggingImage ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{
                transform: `translateX(calc(-${fullscreenIndex * 100}% + ${swipeTranslation}px))`
              }}
            >
              {images.map((imgUrl, idx) => {
                return (
                  <div
                    key={idx}
                    className="w-full h-full shrink-0 flex items-center justify-center overflow-hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <CachedImage
                      src={imgUrl}
                      emoji={recipe.emoji}
                      alt={`Fullscreen view ${idx + 1}`}
                      draggable={false}
                      className="max-w-[80%] max-h-[80dvh] object-contain select-none pointer-events-auto"
                      style={{
                        transform: idx === fullscreenIndex ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : 'scale(1)',
                        cursor: idx === fullscreenIndex && scale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'pointer',
                        transition: idx === fullscreenIndex && !isDraggingImage ? 'transform 200ms ease-out' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows (Desktop) */}
          {images.length > 1 && scale === 1 && (
            <>
              {fullscreenIndex > 0 && (
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-[101] text-white/50 hover:text-white bg-black/30 hover:bg-black/60 rounded-full border-none hidden md:flex"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </Button>
              )}
              {fullscreenIndex < images.length - 1 && (
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-[101] text-white/50 hover:text-white bg-black/30 hover:bg-black/60 rounded-full border-none hidden md:flex"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </Button>
              )}
            </>
          )}

          {/* Page Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-[calc(1rem_+_var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-[101] backdrop-blur-sm">
              {fullscreenIndex + 1} / {images.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
