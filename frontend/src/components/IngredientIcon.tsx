import React, { useState } from 'react';
import { getIngredientIconUrl } from '../utils/ingredientIcon';
import { getCategoryIconUrl } from '../i18n';

export interface IngredientIconProps {
  baseName?: string | null;
  canonicalId?: string | null;
  category?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square rounded-full',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] aspect-square rounded-full',
  lg: 'w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] aspect-square rounded-full',
};

const ICON_SIZE_MAP = {
  sm: 'w-full h-full p-0.5',
  md: 'w-full h-full p-0.5',
  lg: 'w-full h-full p-1',
};

const FADE_MASK_STYLE: React.CSSProperties = {
  maskImage: 'radial-gradient(circle at center, black 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(circle at center, black 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%)',
};

export const IngredientIcon: React.FC<IngredientIconProps> = ({
  baseName,
  canonicalId,
  category = '',
  name = '',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iconUrl = getIngredientIconUrl(baseName, canonicalId);
  const categoryIconUrl = getCategoryIconUrl(category);

  // Clean flat circular container with soft radial fade towards transparent edges
  const containerClasses = `${SIZE_MAP[size]} flex items-center justify-center overflow-hidden shrink-0 relative select-none rounded-full bg-white/80 dark:bg-white/80 ${className}`;

  if (!iconUrl || hasError) {
    return (
      <div className={containerClasses} style={FADE_MASK_STYLE} title={category || name}>
        <img
          src={categoryIconUrl}
          alt={category || name || 'Kategorie'}
          loading="lazy"
          className={`${ICON_SIZE_MAP[size]} object-contain rounded-full`}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses} style={FADE_MASK_STYLE} title={name}>
      {/* Category icon placeholder until specific image is fully loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={categoryIconUrl}
            alt={category || name || 'Kategorie'}
            className={`${ICON_SIZE_MAP[size]} object-contain rounded-full opacity-40`}
          />
        </div>
      )}
      <img
        src={iconUrl}
        alt={name || 'Zutat'}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${ICON_SIZE_MAP[size]} object-contain rounded-full relative z-10 transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default IngredientIcon;

