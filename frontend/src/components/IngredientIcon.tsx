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
  sm: 'w-6 h-6 min-w-[24px] text-xs rounded-lg',
  md: 'w-8 h-8 min-w-[32px] text-sm rounded-xl',
  lg: 'w-12 h-12 min-w-[48px] text-xl rounded-2xl',
};

const ICON_SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
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

  const containerClasses = `${SIZE_MAP[size]} flex items-center justify-center overflow-hidden flex-shrink-0 relative transition-all shadow-xs select-none bg-white dark:bg-white/95 border border-black/5 dark:border-white/10 ${className}`;

  if (!iconUrl || hasError) {
    return (
      <div
        className={`${SIZE_MAP[size]} flex items-center justify-center overflow-hidden flex-shrink-0 select-none bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 ${className}`}
        title={category || name}
      >
        <span className="leading-none">{categoryIcon}</span>
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
