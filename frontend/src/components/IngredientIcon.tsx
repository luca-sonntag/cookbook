import React, { useState } from 'react';
import { getIngredientIconUrl } from '../utils/ingredientIcon';
import { getCategoryIconUrl } from '../i18n';

export interface IngredientIconProps {
  canonicalId?: string | null;
  category?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 min-w-[32px] text-sm rounded-lg',
  md: 'w-11 h-11 min-w-[44px] text-base rounded-xl',
  lg: 'w-14 h-14 min-w-[56px] text-2xl rounded-2xl',
};

const ICON_SIZE_MAP = {
  sm: 'w-full h-full p-0.5',
  md: 'w-full h-full p-0.5',
  lg: 'w-full h-full p-1',
};

export const IngredientIcon: React.FC<IngredientIconProps> = ({
  canonicalId,
  category = '',
  name = '',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iconUrl = getIngredientIconUrl(canonicalId);
  const categoryIconUrl = getCategoryIconUrl(category);

  // Clean flat container without heavy shadows or borders
  const containerClasses = `${SIZE_MAP[size]} flex items-center justify-center overflow-hidden flex-shrink-0 relative select-none bg-white dark:bg-white rounded-xl ${className}`;

  if (!iconUrl || hasError) {
    return (
      <div className={containerClasses} title={category || name}>
        <img
          src={categoryIconUrl}
          alt={category || name || 'Kategorie'}
          loading="lazy"
          className={`${ICON_SIZE_MAP[size]} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses} title={name}>
      {/* Category icon placeholder until specific image is fully loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={categoryIconUrl}
            alt={category || name || 'Kategorie'}
            className={`${ICON_SIZE_MAP[size]} object-contain opacity-40`}
          />
        </div>
      )}
      <img
        src={iconUrl}
        alt={name || 'Zutat'}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${ICON_SIZE_MAP[size]} object-contain relative z-10 transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default IngredientIcon;

