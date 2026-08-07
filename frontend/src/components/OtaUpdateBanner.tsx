import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
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

  const titleText = t('ota.banner.title') || 'Neues App-Update verfügbar';
  const descText = t('ota.banner.description') || `Version ${updateInfo.version} wurde geladen. Jetzt neu laden?`;
  const applyText = t('ota.banner.apply') || 'Jetzt neu laden';
  const laterText = t('ota.banner.later') || 'Später';

  return (
    <div className="w-full bg-gradient-to-r from-emerald-900/90 via-emerald-950/95 to-slate-900/90 backdrop-blur-md border-b border-emerald-500/30 text-white shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-emerald-300">
                {titleText}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                {updateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate font-medium">
              {descText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${applying ? 'animate-spin' : ''}`} />
            <span>{applying ? '...' : applyText}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={applying}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
