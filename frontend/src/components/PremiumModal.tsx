import { useState, useEffect } from 'react';
import { Crown, Check, X, Zap, ChefHat, Sparkles, ShoppingBag, Eye, BookOpen, Loader2, Star } from 'lucide-react';
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
    { icon: <Zap className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.extractions.title'), desc: t('premium.modal.features.extractions.desc') },
    { icon: <Sparkles className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.remix.title'), desc: t('premium.modal.features.remix.desc') },
    { icon: <Eye className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.nutrition.title'), desc: t('premium.modal.features.nutrition.desc') },
    { icon: <ShoppingBag className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.shoppingList.title'), desc: t('premium.modal.features.shoppingList.desc') },
    { icon: <ChefHat className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.cookingMode.title'), desc: t('premium.modal.features.cookingMode.desc') },
    { icon: <BookOpen className="w-4 h-4 text-amber-900/80" />, title: t('premium.modal.features.catalog.title'), desc: t('premium.modal.features.catalog.desc') },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">

      {/* Warm luxury gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600" />
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-transparent to-amber-700/40" />
      {/* Soft vignette bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

      {/* Decorative stars */}
      <div className="absolute top-16 left-6 opacity-30 pointer-events-none">
        <Star className="w-3 h-3 text-white fill-white" />
      </div>
      <div className="absolute top-28 right-8 opacity-20 pointer-events-none">
        <Star className="w-2 h-2 text-white fill-white" />
      </div>
      <div className="absolute top-20 right-16 opacity-25 pointer-events-none">
        <Star className="w-4 h-4 text-white fill-white" />
      </div>

      {/* Content */}
      <div
        className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 select-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >

        {/* Close button */}
        {!loading && (
          <div className="flex justify-end pb-2 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/15 hover:bg-black/25 text-white/90 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-11 shrink-0" />}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 pb-6 shrink-0">
          {/* Crown icon */}
          <div className="w-18 h-18 rounded-3xl bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-xl shadow-amber-900/20 p-4">
            <Crown className="w-9 h-9 text-white drop-shadow-lg" fill="white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white drop-shadow-md leading-tight tracking-tight">
              {t('premium.modal.title')}
            </h2>
            <p className="text-sm font-semibold text-white/75 mt-1.5 drop-shadow">
              {t('premium.modal.subtitle')}
            </p>
          </div>
        </div>

        {/* Feature list — white glass card */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 overflow-hidden shadow-xl shadow-amber-900/15">
            {featureItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3.5 px-4 py-3.5 ${idx < featureItems.length - 1 ? 'border-b border-white/20' : ''}`}
              >
                {/* Check circle */}
                <div className="w-8 h-8 rounded-full bg-white/30 border border-white/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold text-white leading-snug drop-shadow-sm">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-white/70 leading-snug">
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-white bg-red-500/40 py-2 px-3 rounded-xl border border-red-300/30 text-center shrink-0 backdrop-blur-sm">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-white bg-emerald-500/40 py-2 px-3 rounded-xl border border-emerald-300/30 text-center flex items-center justify-center gap-1.5 shrink-0 backdrop-blur-sm">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA button */}
        <div className="shrink-0 mt-5">
          {isPremium ? (
            <button className="w-full h-14 rounded-2xl bg-white/30 border border-white/40 text-white text-sm font-extrabold flex items-center justify-center gap-2 backdrop-blur-sm cursor-default shadow-lg">
              <Check className="w-5 h-5" /> Du hast Premium
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-white text-amber-600 text-base font-extrabold flex items-center justify-center gap-2 shadow-2xl shadow-amber-900/30 hover:bg-amber-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 tracking-wide"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('premium.modal.loading')}</>
                : t('premium.modal.cta')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
