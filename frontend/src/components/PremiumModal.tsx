import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Check, X, Loader2, Sparkles } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { buyPremium } from '../utils/purchase';
import { useAuth } from '../context/AuthContext';

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMsg(null);
      setLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) onOpenChange(false);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, loading, onOpenChange]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const purchased = await buyPremium();
      if (purchased) {
        setSuccess(true);
        setTimeout(() => onOpenChange(false), 1500);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('premium.modal.error'));
      setLoading(false);
    }
  };

  const featureItems = [
    { title: t('premium.modal.features.extractions.title'), desc: t('premium.modal.features.extractions.desc') },
    { title: t('premium.modal.features.remix.title'),        desc: t('premium.modal.features.remix.desc') },
    { title: t('premium.modal.features.nutrition.title'),    desc: t('premium.modal.features.nutrition.desc') },
    { title: t('premium.modal.features.shoppingList.title'), desc: t('premium.modal.features.shoppingList.desc') },
    { title: t('premium.modal.features.cookingMode.title'),  desc: t('premium.modal.features.cookingMode.desc') },
    { title: t('premium.modal.features.catalog.title'),      desc: t('premium.modal.features.catalog.desc') },
  ];

  const modal = (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">

      {/* Same gradient as the settings card — expanded to fullscreen */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-emerald-700 to-teal-800" />

      {/* Subtle radial highlight at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-60 bg-emerald-400/20 rounded-full filter blur-3xl pointer-events-none" />
      {/* Depth shadow at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-black/20 pointer-events-none" />

      {/* Content */}
      <div
        className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 select-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)'
        }}
      >

        {/* Close */}
        {!loading && (
          <div className="flex justify-end pb-2 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/15 hover:bg-black/25 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label={t('premium.modal.close') || 'Schließen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-11 shrink-0" />}

        {/* Header — matches card header style */}
        <div className="flex flex-col items-center text-center gap-2.5 pb-5 shrink-0">
          <div className="flex items-center justify-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-300 fill-amber-300 animate-pulse" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">
              {t('premium.modal.title')}
            </h2>
          </div>
          <p className="text-sm text-emerald-100/80 max-w-xs leading-relaxed">
            {t('premium.modal.subtitle')}
          </p>
        </div>

        {/* Feature list — white/translucent rows, same card feel */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col rounded-3xl overflow-hidden bg-black/10 border border-white/10">
            {featureItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 px-5 py-3 ${idx < featureItems.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                {/* Amber check — matching the card's button color */}
                <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-400/90 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/30">
                  <Check className="w-3.5 h-3.5 text-emerald-950" strokeWidth={3} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-white leading-snug">
                    {item.title}
                  </span>
                  <span className="text-xs text-emerald-100/65 leading-snug">
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-white bg-red-500/30 py-2 px-3 rounded-xl border border-red-300/20 text-center shrink-0">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-white bg-emerald-400/20 py-2 px-3 rounded-xl border border-emerald-300/20 text-center flex items-center justify-center gap-1.5 shrink-0">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA — exact same amber button as the settings card */}
        <div className="shrink-0 mt-5">
          {isPremium ? (
            <button className="w-full h-14 rounded-2xl bg-white/15 border border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-default">
              <Check className="w-5 h-5 text-amber-300" /> {t('premium.modal.owned') || 'Du hast Premium'}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-base font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-black/25 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('premium.modal.loading')}</>
                : <><Crown className="w-5 h-5" /> {t('premium.modal.cta')}</>}
            </button>
          )}
          {!isPremium && !loading && (
            <p className="text-center text-[11px] text-emerald-100/50 mt-2.5 font-medium">
              {t('premium.modal.footer') || 'Jederzeit kündbar · Sicher über Google Play'}
            </p>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
