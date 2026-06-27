import { useEffect, useState } from 'react';
import { Button, Drawer } from '@heroui/react';
import { Clock, Play } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTimerManager } from '../hooks/useTimerManager';

interface TimerConfirmSheetProps {
  isOpen: boolean;
  durationSeconds: number;
  label: string;
  onClose: () => void;
  recipeId?: string;
  stepNum?: number;
}

/** Format seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/** Preset durations in seconds */
const PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
];

export default function TimerConfirmSheet({
  isOpen,
  durationSeconds,
  label,
  onClose,
  recipeId,
  stepNum,
}: TimerConfirmSheetProps) {
  const { t } = useI18n();
  const { addTimer } = useTimerManager();

  const [adjusted, setAdjusted] = useState(durationSeconds);

  // Reset adjusted duration whenever sheet opens with a new value
  useEffect(() => {
    if (isOpen) {
      setAdjusted(durationSeconds);
    }
  }, [isOpen, durationSeconds]);

  const handleStart = () => {
    addTimer(adjusted, label, recipeId, stepNum);
    onClose();
  };

  const isPresetActive = (s: number) => adjusted === s;

  return (
    <Drawer>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} className="!z-[100]">
        <Drawer.Content placement="bottom" className="!z-[100]">
          <Drawer.Dialog>
            <Drawer.Handle />

            {/* Header */}
            <Drawer.Header>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Drawer.Heading className="text-base font-bold">
                  {t('timer.confirmTitle')}
                </Drawer.Heading>
              </div>
            </Drawer.Header>

            <Drawer.Body>
              {/* Label */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed italic line-clamp-2">
                „{label}"
              </p>

              {/* Duration display */}
              <div className="flex items-center justify-center mb-5">
                <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                  {formatDuration(adjusted)}
                </span>
              </div>

              {/* Adjust label */}
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-3">
                {t('timer.adjustDuration')}
              </p>

              {/* Preset chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.seconds}
                    onClick={() => setAdjusted(preset.seconds)}
                    className={`
                      px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                      active:scale-95
                      ${isPresetActive(preset.seconds)
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 dark:bg-emerald-500 dark:text-white'
                        : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
                      }
                    `}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </Drawer.Body>

            <Drawer.Footer>
              <div className="flex gap-3 w-full">
                <Button
                  variant="tertiary"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  slot="close"
                  onPress={onClose}
                >
                  {t('timer.confirmCancel')}
                </Button>
                <Button
                  className="flex-[2] py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all"
                  onPress={handleStart}
                >
                  <Play className="w-4 h-4 fill-white" />
                  {t('timer.confirmStart')}
                </Button>
              </div>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
