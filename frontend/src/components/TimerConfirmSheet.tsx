import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { Clock, Play, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTimerManager } from '../hooks/useTimerManager';

interface TimerConfirmSheetProps {
  isOpen: boolean;
  durationSeconds: number;
  label: string;
  onClose: () => void;
}

/** Format seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/** Round to nearest 15 seconds for clean step adjustments */
function clampSeconds(s: number): number {
  return Math.max(15, Math.round(s / 15) * 15);
}

export default function TimerConfirmSheet({
  isOpen,
  durationSeconds,
  label,
  onClose,
}: TimerConfirmSheetProps) {
  const { t } = useI18n();
  const { addTimer } = useTimerManager();

  // Adjusted duration — user can tweak via slider
  const [adjusted, setAdjusted] = useState(durationSeconds);

  // Reset adjusted duration whenever sheet opens with a new value
  useEffect(() => {
    if (isOpen) {
      setAdjusted(clampSeconds(durationSeconds));
    }
  }, [isOpen, durationSeconds]);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleStart = () => {
    addTimer(adjusted, label);
    onClose();
  };

  // Slider min/max: 15s to 3× original, capped at 3h
  const minVal = 15;
  const maxVal = Math.min(clampSeconds(durationSeconds * 3), 3 * 3600);
  const step = durationSeconds >= 3600 ? 300 : durationSeconds >= 600 ? 60 : 15;

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={handleBackdropClick}
    >
      {/* Sheet */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5 pb-8 shadow-2xl"
        style={{ animation: 'slideUpSheet 0.22s cubic-bezier(0.32,0.72,0,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-black/15 dark:bg-white/15 rounded-full mx-auto mb-5" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('timer.confirmTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Label */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed italic line-clamp-2">
          „{label}"
        </p>

        {/* Duration display */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
            {formatDuration(adjusted)}
          </span>
        </div>

        {/* Adjust label */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-2">
          {t('timer.adjustDuration')}
        </p>

        {/* Slider */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setAdjusted(v => Math.max(minVal, v - step))}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-bold flex-shrink-0"
            aria-label="Decrease"
          >
            −
          </button>
          <input
            type="range"
            min={minVal}
            max={maxVal}
            step={step}
            value={adjusted}
            onChange={e => setAdjusted(Number(e.target.value))}
            className="flex-1 accent-blue-500 h-2 rounded-full cursor-pointer"
            style={{ accentColor: '#3b82f6' }}
          />
          <button
            onClick={() => setAdjusted(v => Math.min(maxVal, v + step))}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-bold flex-shrink-0"
            aria-label="Increase"
          >
            +
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="tertiary"
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10"
            onPress={onClose}
          >
            {t('timer.confirmCancel')}
          </Button>
          <Button
            className="flex-[2] py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
            onPress={handleStart}
          >
            <Play className="w-4 h-4 fill-white" />
            {t('timer.confirmStart')}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
