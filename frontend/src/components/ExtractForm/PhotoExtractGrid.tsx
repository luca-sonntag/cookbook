import React from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { MAX_IMPORT_PHOTOS } from '../../hooks/useRecipeExtraction';

interface PhotoExtractGridProps {
  photos: File[];
  photoPreviews: string[];
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onOpenPicker: (ref: React.RefObject<HTMLInputElement | null>) => void;
}

export const PhotoExtractGrid: React.FC<PhotoExtractGridProps> = ({
  photos,
  photoPreviews,
  cameraInputRef,
  galleryInputRef,
  onPhotoChange,
  onRemovePhoto,
  onOpenPicker,
}) => {
  const { t } = useI18n();
  const photosFull = photos.length >= MAX_IMPORT_PHOTOS;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPhotoChange}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 text-center border-none">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10">
            <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t('form.photo.emptyTitle')}</p>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 max-w-[16rem]">
            {t('form.photo.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={`${photo.name}-${index}`}
              className="relative aspect-square rounded-2xl overflow-hidden border-none bg-gray-100 dark:bg-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <img src={photoPreviews[index]} alt="" className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full bg-black/65 text-white text-[10px] font-bold flex items-center justify-center backdrop-blur-sm">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemovePhoto(index)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform cursor-pointer border-none"
                aria-label={t('form.photo.remove')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenPicker(cameraInputRef)}
          disabled={photosFull}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-gray-800 border-none text-gray-900 dark:text-white disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all cursor-pointer shadow-none"
        >
          <Camera className="w-4 h-4" />
          <span>{t('form.photo.takePhoto')}</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenPicker(galleryInputRef)}
          disabled={photosFull}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-gray-800 border-none text-gray-900 dark:text-white disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all cursor-pointer shadow-none"
        >
          <ImagePlus className="w-4 h-4" />
          <span>{t('form.photo.fromGallery')}</span>
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
        {t('form.photo.counter', { count: photos.length, max: MAX_IMPORT_PHOTOS })}
      </p>
    </div>
  );
};
export default PhotoExtractGrid;
