import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Image as ImageIcon, Sparkles, AlertTriangle, RotateCcw, X, Loader2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useGamification } from '../context/GamificationContext';
import { compressImage, PREVIEW_PROFILE } from '../utils/imageCompression';

interface CookedModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  recipeTitle?: string;
  viaCookingMode?: boolean;
}

export default function CookedModal({
  isOpen,
  onClose,
  jobId,
  recipeTitle,
  viaCookingMode,
}: CookedModalProps) {
  const { t } = useI18n();
  const { markCooked } = useGamification();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsCompressing(true);
    setRejectionReason(null);
    try {
      const dataUrl = await compressImage(file, PREVIEW_PROFILE);
      setPhoto(dataUrl);
    } catch (err) {
      console.warn('[CookedModal] Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!photo || isVerifying) return;

    setIsVerifying(true);
    setRejectionReason(null);

    try {
      await markCooked(jobId, {
        photoBase64: photo,
        viaCookingMode,
      });
      // GamificationContext automatically opens the RewardOverlay on success
      handleResetAndClose();
    } catch (err: any) {
      console.error('[CookedModal] Verification failed:', err);
      // Surface rejection reason if provided by backend AppError params
      const reason = err?.params?.reason || err?.message || t('error.codes.PHOTO_NOT_MATCHING');
      setRejectionReason(reason);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetAndClose = () => {
    setPhoto(null);
    setRejectionReason(null);
    setIsVerifying(false);
    setIsCompressing(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 pb-[calc(1.5rem_+_var(--safe-area-inset-bottom))] transition-opacity animate-in fade-in duration-200">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePhotoSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handlePhotoSelect}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-gray-900 border border-white/10 p-6 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          disabled={isVerifying}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              {t('app.gamification.modalTitle')}
            </h3>
            {recipeTitle && (
              <p className="text-xs text-gray-400 line-clamp-1 font-medium">{recipeTitle}</p>
            )}
          </div>
        </div>

        {/* Body content based on state */}
        {!photo && !isCompressing && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-300 leading-relaxed">
              {t('app.gamification.modalSubtitle')}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all active:scale-[0.97]"
              >
                <Camera className="w-7 h-7" />
                <span className="text-xs">{t('app.gamification.takePhoto')}</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 font-bold transition-all active:scale-[0.97]"
              >
                <ImageIcon className="w-7 h-7" />
                <span className="text-xs">{t('app.gamification.chooseGallery')}</span>
              </button>
            </div>
          </div>
        )}

        {isCompressing && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-gray-300">Foto wird verarbeitet...</p>
          </div>
        )}

        {photo && !isCompressing && (
          <div className="space-y-4 py-1">
            {/* Image Preview Container */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <img
                src={photo}
                alt="Uploaded dish preview"
                className="h-full w-full object-cover"
              />
              {!isVerifying && (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Rejection Message if AI rejected previous attempt */}
            {rejectionReason && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-rose-200">Verifizierung fehlgeschlagen</p>
                  <p className="leading-normal text-rose-300/90">{rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Verifying Status or Submit Button */}
            {isVerifying ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('app.gamification.verifyingTitle')}</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  {t('app.gamification.verifyingDesc')}
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                {rejectionReason ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setRejectionReason(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 px-4 py-3 text-xs font-semibold text-white transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('app.gamification.retryPhoto')}</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleVerifyAndSubmit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-4 py-3 text-xs font-bold text-white shadow-lg active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('app.gamification.verifyBtn')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
