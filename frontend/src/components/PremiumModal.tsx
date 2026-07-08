import { useState, useEffect } from 'react';
import { Crown, Check, X, Zap, ChefHat, Sparkles, ShoppingBag, Eye, BookOpen, Loader2 } from 'lucide-react';
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
      if (e.key === 'Escape' && isOpen && !loading) {
        onOpenChange(false);
      }
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
        setTimeout(() => { onOpenChange(false); }, 1500);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setErrorMsg(err.message || t('premium.modal.error'));
      setLoading(false);
    }
  };

  const featureItems = [
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: t('premium.modal.features.extractions.title'),
      desc: t('premium.modal.features.extractions.desc'),
      bg: 'bg-amber-500/15'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: t('premium.modal.features.remix.title'),
      desc: t('premium.modal.features.remix.desc'),
      bg: 'bg-emerald-500/15'
    },
    {
      icon: <Eye className="w-5 h-5 text-blue-500" />,
      title: t('premium.modal.features.nutrition.title'),
      desc: t('premium.modal.features.nutrition.desc'),
      bg: 'bg-blue-500/15'
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-purple-500" />,
      title: t('premium.modal.features.shoppingList.title'),
      desc: t('premium.modal.features.shoppingList.desc'),
      bg: 'bg-purple-500/15'
    },
    {
      icon: <ChefHat className="w-5 h-5 text-rose-500" />,
      title: t('premium.modal.features.cookingMode.title'),
      desc: t('premium.modal.features.cookingMode.desc'),
      bg: 'bg-rose-500/15'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-teal-500" />,
      title: t('premium.modal.features.catalog.title'),
      desc: t('premium.modal.features.catalog.desc'),
      bg: 'bg-teal-500/15'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col backdrop-blur-2xl bg-black/55"
      role="dialog"
      aria-modal="true"
    >
      {/* Soft gradient tint over blur so text reads well */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

      {/* Content column — full height, safe-area aware */}
      <div
        className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 select-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >

        {/* Close button — below status bar */}
        {!loading && (
          <div className="flex justify-end pb-2 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-11 shrink-0" />}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-2xl shadow-emerald-500/30 animate-pulse-slow">
            <div className="w-full h-full bg-white/90 dark:bg-gray-900/90 rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent leading-tight drop-shadow">
              {t('premium.modal.title')}
            </h2>
            <p className="text-sm font-medium text-white/75 mt-1 drop-shadow">
              {t('premium.modal.subtitle')}
            </p>
          </div>
        </div>

        {/* Feature Grid — 2 columns */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 flex-1 content-start">
          {featureItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-2 p-3.5 rounded-2xl ${item.bg} backdrop-blur-sm border border-white/10`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-white/65 leading-normal mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-rose-300 bg-rose-500/20 py-2 px-3 rounded-xl border border-rose-500/30 text-center shrink-0">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-emerald-300 bg-emerald-500/20 py-2 px-3 rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1.5 shrink-0">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA */}
        <div className="shrink-0 mt-4">
          {isPremium ? (
            <button className="w-full h-14 text-sm font-extrabold rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-center gap-2 cursor-default">
              <Check className="w-5 h-5" /> Du hast Premium
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 text-base font-extrabold rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-90 active:scale-[0.98] text-white shadow-2xl shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
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
