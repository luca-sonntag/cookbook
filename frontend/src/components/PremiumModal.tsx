import { useState, useEffect } from 'react';
import { Crown, Check, X, Loader2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">

      {/* Deep emerald dark gradient — on-brand but elevated */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-gray-950 to-gray-950" />
      {/* Subtle emerald glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-56 bg-emerald-500/20 rounded-full filter blur-3xl pointer-events-none" />
      {/* Amber glow bottom-right */}
      <div className="absolute bottom-24 right-0 w-48 h-48 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Content */}
      <div
        className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 select-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)'
        }}
      >

        {/* Close button */}
        {!loading && (
          <div className="flex justify-end pb-1 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/14 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-10 shrink-0" />}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 pb-7 shrink-0">
          {/* Crown badge with amber glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400/30 rounded-3xl filter blur-xl" />
            <div className="relative w-[68px] h-[68px] rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <Crown className="w-8 h-8 text-white drop-shadow-sm" fill="white" />
            </div>
          </div>

          <div>
            <h2 className="text-[28px] font-black text-white leading-tight tracking-tight">
              {t('premium.modal.title')}
            </h2>
            {/* Emerald underline accent */}
            <div className="mx-auto mt-1.5 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <p className="text-sm font-medium text-gray-400 mt-2.5">
              {t('premium.modal.subtitle')}
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="flex-1 flex flex-col justify-center gap-0">
          {featureItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 py-3.5 ${idx < featureItems.length - 1 ? 'border-b border-white/6' : ''}`}
            >
              {/* Emerald check circle */}
              <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white leading-snug">
                  {item.title}
                </span>
                <span className="text-xs text-gray-500 leading-snug">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-rose-400 bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20 text-center shrink-0">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2 px-3 rounded-xl border border-emerald-500/20 text-center flex items-center justify-center gap-1.5 shrink-0">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA */}
        <div className="shrink-0 mt-5">
          {isPremium ? (
            <button className="w-full h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 cursor-default">
              <Check className="w-5 h-5" /> Du hast Premium
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-gray-950 text-base font-extrabold flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/25 transition-all duration-150 disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('premium.modal.loading')}</>
                : t('premium.modal.cta')}
            </button>
          )}
          {/* Trust line */}
          {!isPremium && !loading && (
            <p className="text-center text-[11px] text-gray-600 mt-2.5 font-medium">
              Jederzeit kündbar · Sicher über Google Play
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
