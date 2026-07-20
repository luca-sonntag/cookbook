import React from 'react';
import { ChefHat } from 'lucide-react';
import { useCachedImage } from '../hooks/useCachedImage';

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallbackComponent?: React.ReactNode;
  cacheOnly?: boolean;
}

/**
 * Drop-in replacement for <img> that automatically compresses and caches
 * images in IndexedDB on the client side.
 */
export default function CachedImage({ src: originalUrl, fallbackComponent, cacheOnly, className, alt, ...props }: CachedImageProps) {
  const { src, isLoading } = useCachedImage(originalUrl, { cacheOnly });
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (isLoading && !src) {
    return (
      <div className={`flex items-center justify-center bg-black/5 dark:bg-white/5 animate-pulse ${className}`}>
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!src || hasError) {
    return fallbackComponent ? (
      <>{fallbackComponent}</>
    ) : (
      <div className={`flex items-center justify-center bg-gradient-to-br from-emerald-600/10 to-teal-600/15 dark:from-emerald-950/20 dark:to-teal-950/20 ${className}`}>
        <ChefHat className="w-8 h-8 text-emerald-500/30 dark:text-emerald-400/25" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
