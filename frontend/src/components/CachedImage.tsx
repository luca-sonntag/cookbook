import React from 'react';
import { useCachedImage } from '../hooks/useCachedImage';

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallbackComponent?: React.ReactNode;
}

/**
 * Drop-in replacement for <img> that automatically compresses and caches
 * images in IndexedDB on the client side.
 */
export default function CachedImage({ src: originalUrl, fallbackComponent, className, alt, ...props }: CachedImageProps) {
  const { src, isLoading } = useCachedImage(originalUrl);

  if (isLoading && !src) {
    return (
      <div className={`flex items-center justify-center bg-black/5 dark:bg-white/5 animate-pulse ${className}`}>
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!src) {
    return fallbackComponent ? (
      <>{fallbackComponent}</>
    ) : (
      <div className={`bg-black/5 dark:bg-white/5 ${className}`} />
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      {...props}
    />
  );
}
