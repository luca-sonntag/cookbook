import { Bell, X, Timer } from 'lucide-react';
import { useTimerManager } from '../hooks/useTimerManager';
import { useI18n } from '../context/I18nContext';

/** Compute remaining seconds from a timer's endAt timestamp */
function getRemainingSeconds(endAt: number): number {
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

/** Format seconds as mm:ss */
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Shorten a label to max N chars */
function shortenLabel(label: string, maxLen = 28): string {
  return label.length > maxLen ? label.slice(0, maxLen).trimEnd() + '…' : label;
}

export default function TimerBanner() {
  const { timers, removeTimer, dismissFinished, setPendingNavigation } = useTimerManager();
  const { t } = useI18n();

  if (timers.length === 0) return null;

  return (
    <div
      className="sticky top-0 z-50 w-full"
      style={{ animation: 'timerBannerSlideDown 0.25s cubic-bezier(0.32,0.72,0,1) both' }}
    >
      <div className="w-full max-w-md mx-auto px-3 pt-2 pb-1.5 flex flex-col gap-1.5">
        {timers.map(timer => {
          const remaining = getRemainingSeconds(timer.endAt);
          const isFinished = timer.isFinished;

          // Progress 0→1 as time runs down
          const progress = isFinished ? 0 : remaining / timer.durationSeconds;

          const { recipeId, stepNum } = timer;
          const isAssociated = !!(recipeId && stepNum);

          return (
            <div
              key={timer.id}
              onClick={isAssociated ? () => {
                setPendingNavigation({ recipeId: recipeId!, stepNum: stepNum! });
                window.dispatchEvent(new CustomEvent('app:navigate-to-timer-step', {
                  detail: { recipeId, stepNum }
                }));
              } : undefined}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                isAssociated ? 'cursor-pointer active:scale-[0.99]' : ''
              } ${
                isFinished
                  ? 'bg-rose-600 dark:bg-rose-700 animate-pulse'
                  : 'bg-blue-600 dark:bg-blue-700'
              }`}
            >
              {/* Background progress track */}
              {!isFinished && (
                <div
                  className="absolute inset-0 bg-white/10 origin-left transition-all duration-500"
                  style={{ transform: `scaleX(${progress})` }}
                />
              )}

              {/* Icon */}
              <div className="relative flex-shrink-0">
                {isFinished ? (
                  <Bell className="w-4 h-4 text-white animate-bounce" />
                ) : (
                  <Timer className="w-4 h-4 text-white/80" />
                )}
              </div>

              {/* Label + countdown */}
              <div className="relative flex-1 min-w-0">
                <p className="text-[10px] text-white/70 font-medium leading-none truncate">
                  {shortenLabel(timer.label)}
                </p>
                <p className={`text-sm font-black text-white tabular-nums mt-0.5 leading-none ${isFinished ? '' : ''}`}>
                  {isFinished
                    ? t('timer.finished')
                    : formatCountdown(remaining)
                  }
                </p>
              </div>

              {/* Dismiss / Cancel button */}
              <button
                onClick={() => isFinished ? dismissFinished(timer.id) : removeTimer(timer.id)}
                className="relative flex-shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                aria-label={isFinished ? t('timer.dismiss') : 'Cancel timer'}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes timerBannerSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
