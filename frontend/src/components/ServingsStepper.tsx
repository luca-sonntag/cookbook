import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { hapticLight } from '../utils/haptics';

export interface ServingsStepperProps {
  servings: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const ServingsStepper: React.FC<ServingsStepperProps> = ({
  servings,
  onDecrease,
  onIncrease,
  min = 1,
  max,
  size = 'md',
  showIcon = true,
  className = '',
  ariaLabel = 'Portionen anpassen',
}) => {
  const isMinDisabled = servings <= min;
  const isMaxDisabled = max !== undefined && servings >= max;

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMinDisabled) {
      hapticLight();
      onDecrease();
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaxDisabled) {
      hapticLight();
      onIncrease();
    }
  };

  // Size variations with touch-friendly targets (Rule 1: Min Tap Areas)
  const sizeConfig = {
    sm: {
      capsule: 'h-9 px-1 gap-1',
      btn: 'w-8 h-8 min-w-[32px] min-h-[32px]',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs min-w-[22px]',
      userIcon: 'w-3.5 h-3.5',
    },
    md: {
      capsule: 'h-10 px-1 gap-1.5',
      btn: 'w-9 h-9 min-w-[36px] min-h-[36px]',
      icon: 'w-4 h-4 stroke-[2.5]',
      text: 'text-xs font-bold min-w-[26px]',
      userIcon: 'w-4 h-4',
    },
    lg: {
      capsule: 'h-11.5 px-1.5 gap-2',
      btn: 'w-10 h-10 min-w-[40px] min-h-[40px]',
      icon: 'w-4.5 h-4.5 stroke-[2.5]',
      text: 'text-sm font-bold min-w-[30px]',
      userIcon: 'w-4.5 h-4.5',
    },
  }[size];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-gray-100/90 dark:bg-gray-800/80 rounded-full shrink-0 select-none border-none transition-colors ${sizeConfig.capsule} ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrease}
        disabled={isMinDisabled}
        aria-label="Portionen verringern"
        className={`${sizeConfig.btn} rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 active:scale-90 transition-all cursor-pointer border-none`}
      >
        <Minus className={sizeConfig.icon} />
      </button>

      <div className={`flex items-center justify-center gap-1 px-1 text-gray-800 dark:text-gray-100 ${sizeConfig.text}`}>
        {showIcon && (
          <Users className={`${sizeConfig.userIcon} text-gray-400 dark:text-gray-500 shrink-0`} />
        )}
        <span className="font-black tabular-nums">{servings}</span>
      </div>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={isMaxDisabled}
        aria-label="Portionen erhöhen"
        className={`${sizeConfig.btn} rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 active:scale-90 transition-all cursor-pointer border-none`}
      >
        <Plus className={sizeConfig.icon} />
      </button>
    </div>
  );
};

export default ServingsStepper;

