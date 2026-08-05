import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Check, Utensils } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useGamification } from '../context/GamificationContext';
import { compressImage, PREVIEW_PROFILE } from '../utils/imageCompression';

type Status = 'idle' | 'saving' | 'done' | 'duplicate' | 'error';

interface CookedButtonProps {
  jobId: string;
  /** Set when the user reached the end of the premium cooking mode. */
  viaCookingMode?: boolean;
  className?: string;
}

/**
 * "I cooked this" call-to-action. Available to ALL users (not premium-gated) —
 * it awards XP/coins via the gamification backend and triggers the reward
 * overlay. An optional finished-dish photo (compressed client-side) adds a bonus
 * and makes the cook leaderboard-eligible.
 */
export default function CookedButton({ jobId, viaCookingMode, className = '' }: CookedButtonProps) {
  const { t } = useI18n();
  const { markCooked } = useGamification();
  const [status, setStatus] = useState<Status>('idle');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, PREVIEW_PROFILE);
      setPhoto(dataUrl);
    } catch (err) {
      console.warn('[Cook] Photo compression failed:', err);
    }
  };

  const handleCooked = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    try {
      const result = await markCooked(jobId, {
        photoBase64: photo ?? undefined,
        viaCookingMode,
      });
      setStatus(result?.duplicate ? 'duplicate' : 'done');
      setPhoto(null);
    } catch (err) {
      console.error('[Cook] Failed to record cook:', err);
      setStatus('error');
    } finally {
      // Return to idle so the recipe can be cooked again another day.
      window.setTimeout(() => setStatus('idle'), 3200);
    }
  };

  const mainLabel = (() => {
    switch (status) {
      case 'saving': return t('app.gamification.cooking');
      case 'done': return t('app.gamification.cookedDone');
      case 'duplicate': return t('app.gamification.duplicate');
      case 'error': return t('app.gamification.cookError');
      default: return t('app.gamification.cooked');
    }
  })();

  const settled = status === 'done' || status === 'duplicate';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePhotoPick}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label={t('app.gamification.addPhoto')}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
          photo
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-black/10 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        {photo ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={handleCooked}
        disabled={status === 'saving'}
        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-4 font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 ${
          settled
            ? 'bg-emerald-600'
            : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'
        }`}
      >
        {settled ? <Check className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}
        <span>{mainLabel}</span>
      </button>
    </div>
  );
}
