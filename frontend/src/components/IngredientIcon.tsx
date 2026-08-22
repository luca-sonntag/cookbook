import React, { useState } from 'react';
import { getIngredientIconUrl } from '../utils/ingredientIcon';
import { getCategoryIcon } from '../i18n';

export interface IngredientIconProps {
  canonicalId?: string | null;
  category?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-7 h-7 min-w-[28px] text-xs rounded-lg',
  md: 'w-9 h-9 min-w-[36px] text-sm rounded-xl',
  lg: 'w-12 h-12 min-w-[48px] text-xl rounded-2xl',
};

const ICON_SIZE_MAP = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-11 h-11',
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
  const categoryIcon = getCategoryIcon(category);

  // Clean flat container without heavy shadows or borders
  const containerClasses = `${SIZE_MAP[size]} flex items-center justify-center overflow-hidden flex-shrink-0 relative select-none bg-white dark:bg-white rounded-xl ${className}`;

  if (!iconUrl || hasError) {
    return (
      <div
        className={`${SIZE_MAP[size]} flex items-center justify-center overflow-hidden flex-shrink-0 select-none bg-black/[0.03] dark:bg-white/[0.06] rounded-xl ${className}`}
        title={category || name}
      >
        <span className="leading-none text-base sm:text-lg">{categoryIcon}</span>
      </div>
    );
  }

  return (
    <div className={containerClasses} title={name}>
      {/* Background fallback until image is fully loaded */}
      {!isLoaded && (
        <span className="absolute inset-0 flex items-center justify-center opacity-60 text-xs">
          {categoryIcon}
        </span>
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
