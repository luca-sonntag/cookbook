import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import {
  OTA_READY_EVENT,
  getPendingOtaUpdate,
  applyOtaUpdateImmediately,
  type OtaReadyInfo,
} from '../utils/otaUpdater';

export default function OtaUpdateBanner() {
  const { t } = useI18n();
  const [updateInfo, setUpdateInfo] = useState<OtaReadyInfo | null>(() => getPendingOtaUpdate());
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const handleOtaReady = (e: Event) => {
      const customEvent = e as CustomEvent<OtaReadyInfo>;
      if (customEvent.detail) {
        setUpdateInfo(customEvent.detail);
        setDismissed(false);
      }
    };

    window.addEventListener(OTA_READY_EVENT, handleOtaReady);
    return () => {
      window.removeEventListener(OTA_READY_EVENT, handleOtaReady);
    };
  }, []);

  if (!updateInfo || dismissed) return null;

  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      await applyOtaUpdateImmediately(updateInfo.bundleId);
    } catch (err) {
      console.warn('[OTA] Failed to apply update immediately:', err);
      setApplying(false);
    }
  };

  const titleText = t('ota.banner.title');
  const descText = t('ota.banner.description', { version: updateInfo.version });
  const applyText = t('ota.banner.apply');
  const laterText = t('ota.banner.later');

  return (
    <div className="w-full bg-emerald-700 dark:bg-emerald-800 text-white border-b border-emerald-600/50 py-2.5 transition-all animate-in slide-in-from-top duration-200">
      <div className="w-full max-w-md mx-auto px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 text-white ${applying ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">
                {titleText}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white shrink-0">
                {updateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 truncate font-medium leading-tight mt-0.5">
              {descText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 active:scale-95 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {applying ? '...' : applyText}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={applying}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={laterText}
            title={laterText}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
