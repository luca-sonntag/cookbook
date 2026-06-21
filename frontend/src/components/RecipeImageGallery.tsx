import { Button } from '@heroui/react';
import { createPortal } from 'react-dom';
import {
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Recipe } from '../types';
import { useImageGallery } from '../hooks/useImageGallery';

interface RecipeImageGalleryProps {
  recipe: Recipe;
}

export default function RecipeImageGallery({ recipe }: RecipeImageGalleryProps) {
  // Derive images list
  const images = recipe.imageUrls && recipe.imageUrls.length > 0
    ? recipe.imageUrls
    : (recipe.imageUrl ? [recipe.imageUrl] : []);

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
  } = useImageGallery(images);

  if (images.length === 0) return null;

  return (
    <>
      {/* Inline Gallery */}
      {recipe.imageUrls && recipe.imageUrls.length > 0 ? (
        <div className="-mt-6 -mx-6 mb-6 relative group">
          <div
            ref={scrollContainerRef}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            className={`flex overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'md:cursor-pointer cursor-grab snap-x snap-mandatory'}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recipe.imageUrls.map((img, idx) => {
              const src = img.startsWith('/') ? img : `/api/image?url=${encodeURIComponent(img)}`;
              return (
                <div key={idx} className="w-full shrink-0 snap-center relative">
                  <img
                    src={src}
                    draggable={false}
                    alt={`${recipe.title} - view ${idx + 1}`}
                    className={`w-full h-56 object-cover object-center transition-transform duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                      }`}
                    onClick={() => handleImageClick(idx)}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none opacity-80 backdrop-blur-sm">
                    {idx + 1} / {recipe.imageUrls?.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : recipe.imageUrl ? (
        <div className="-mt-6 -mx-6 mb-6 bg-black/5 dark:bg-white/5 relative">
          <img
            src={recipe.imageUrl.startsWith('/') ? recipe.imageUrl : `/api/image?url=${encodeURIComponent(recipe.imageUrl)}`}
            alt={recipe.title}
            className="w-full h-56 object-cover object-center cursor-pointer"
            onClick={() => {
              setFullscreenIndex(0);
            }}
          />
        </div>
      ) : null}

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
          <div className="absolute top-4 right-4 z-[101] flex items-center gap-2">
            {/* Zoom Toggle Button */}
            <Button
              isIconOnly
              variant="ghost"
              onPress={handleDoubleTap}
              className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full border-none"
              aria-label={scale > 1 ? "Zoom Out" : "Zoom In"}
            >
              {scale > 1 ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
            </Button>
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
          >
            <div
              className={`flex w-full h-full ${!isDraggingImage ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{
                transform: `translateX(calc(-${fullscreenIndex * 100}% + ${swipeTranslation}px))`
              }}
            >
              {images.map((imgUrl, idx) => {
                const src = imgUrl.startsWith('/') ? imgUrl : `/api/image?url=${encodeURIComponent(imgUrl)}`;
                return (
                  <div
                    key={idx}
                    className="w-full h-full shrink-0 flex items-center justify-center overflow-hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <img
                      src={src}
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none z-[101] backdrop-blur-sm">
              {fullscreenIndex + 1} / {images.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
