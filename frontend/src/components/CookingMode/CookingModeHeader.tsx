import React from 'react';
import { Button } from '@heroui/react';
import { X, Timer, MessageCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useTimerContext } from '../../context/TimerContext';
import { hapticLight } from '../../utils/haptics';

interface CookingModeHeaderProps {
  currentStepIndex: number;
  totalSteps: number;
  onClose: () => void;
  onOpenTimer: () => void;
  onOpenCopilot: () => void;
}

export const CookingModeHeader: React.FC<CookingModeHeaderProps> = ({
  currentStepIndex,
  totalSteps,
  onClose,
  onOpenTimer,
  onOpenCopilot,
}) => {
  const { t } = useI18n();
  const { timers } = useTimerContext();
  const hasRunningTimer = timers.some((t) => !t.isFinished);

  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <header className="flex flex-col gap-2.5 pb-1 shrink-0">
      {/* Top action row: Left Close, Center Step Badge, Right Tools */}
      <div className="flex justify-between items-center gap-2">
        {/* Left: Close Action */}
        <div className="flex items-center">
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => {
              hapticLight();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center border-none transition-all active:scale-95 cursor-pointer"
            aria-label={t('dialog.closeAria')}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Center: Step Progress Pill */}
        <div className="flex items-center">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full select-none tabular-nums">
            {t('recipe.cookingModeProgress', { current: currentStepIndex + 1, total: totalSteps })}
          </span>
        </div>

        {/* Right: Quick action controls in unified calm styling */}
        <div className="flex items-center gap-1.5">
          <Button
            isIconOnly
            variant="ghost"
            onPress={() => {
              hapticLight();
              onOpenTimer();
            }}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center border-none transition-all active:scale-95 cursor-pointer ${
              hasRunningTimer
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse'
                : 'bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-label={t('timer.start')}
          >
            <Timer className="w-5 h-5" />
          </Button>

          <Button
            isIconOnly
            variant="ghost"
            onPress={() => {
              hapticLight();
              onOpenCopilot();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center border-none transition-all active:scale-95 cursor-pointer"
            aria-label={t('recipe.copilot')}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress bar track */}
      {totalSteps > 0 && (
        <div className="w-full bg-black/[0.04] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
};

export default CookingModeHeader;
