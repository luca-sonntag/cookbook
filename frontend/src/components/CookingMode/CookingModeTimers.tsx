import React from 'react';
import { Bell, Timer, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useTimerManager } from '../../hooks/useTimerManager';
import { stripInlineIngredientTags } from '../../utils/ingredientMatch';
import { hapticLight } from '../../utils/haptics';

export const CookingModeTimers: React.FC = () => {
  const { t } = useI18n();
  const { timers, removeTimer, dismissFinished, setPendingNavigation } = useTimerManager();

  if (timers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 w-full max-w-lg mx-auto shrink-0">
      <div className="flex flex-col gap-1.5">
        {timers.map((timer) => {
          const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
          const isFinished = timer.isFinished;

          const m = Math.floor(remaining / 60);
          const s = remaining % 60;
          const countdownStr = isFinished
            ? t('timer.finished')
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

          const { recipeId, stepNum } = timer;
          const isAssociated = Boolean(recipeId && stepNum);
          const progress = isFinished ? 0 : remaining / timer.durationSeconds;

          const handleCardClick = () => {
            if (!isAssociated) return;
            hapticLight();
            setPendingNavigation({ recipeId: recipeId!, stepNum: stepNum! });
            window.dispatchEvent(
              new CustomEvent('app:navigate-to-timer-step', {
                detail: { recipeId, stepNum },
              })
            );
          };

          return (
            <div
              key={timer.id}
              onClick={handleCardClick}
              className={`w-full relative flex items-center gap-3 px-4 py-2.5 rounded-2xl overflow-hidden transition-all duration-300 ${
                isAssociated ? 'cursor-pointer active:scale-[0.98]' : ''
              } ${
                isFinished
                  ? 'bg-rose-600 dark:bg-rose-700 animate-pulse text-white shadow-sm'
                  : 'bg-blue-600 dark:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {/* Background progress track */}
              {!isFinished && (
                <div
                  className="absolute inset-0 bg-white/15 origin-left transition-all duration-500"
                  style={{ transform: `scaleX(${progress})` }}
                />
              )}

              {/* Icon */}
              <div className="relative flex-shrink-0">
                {isFinished ? (
                  <Bell className="w-4 h-4 text-white animate-bounce" />
                ) : (
                  <Timer className="w-4 h-4 text-white/90" />
                )}
              </div>

              {/* Label + countdown */}
              <div className="relative flex-1 min-w-0 text-left">
                <p className="text-[10px] text-white/80 font-semibold leading-tight truncate">
                  {stripInlineIngredientTags(timer.label)}
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5 leading-none">
                  {countdownStr}
                </p>
              </div>

              {/* Close/Dismiss button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticLight();
                  if (isFinished) {
                    dismissFinished(timer.id);
                  } else {
                    removeTimer(timer.id);
                  }
                }}
                className="relative flex-shrink-0 w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-white/20 hover:bg-white/35 active:scale-90 flex items-center justify-center transition-all cursor-pointer border-none"
                aria-label={t('dialog.closeAria')}
              >
                <X className="w-4 h-4 text-white stroke-[2.5px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CookingModeTimers;
