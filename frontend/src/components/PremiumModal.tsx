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
      // Prevent body scroll when modal is open
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
      bg: 'bg-amber-500/10 dark:bg-amber-500/15'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: t('premium.modal.features.remix.title'),
      desc: t('premium.modal.features.remix.desc'),
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15'
    },
    {
      icon: <Eye className="w-5 h-5 text-blue-500" />,
      title: t('premium.modal.features.nutrition.title'),
      desc: t('premium.modal.features.nutrition.desc'),
      bg: 'bg-blue-500/10 dark:bg-blue-500/15'
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-purple-500" />,
      title: t('premium.modal.features.shoppingList.title'),
      desc: t('premium.modal.features.shoppingList.desc'),
      bg: 'bg-purple-500/10 dark:bg-purple-500/15'
    },
    {
      icon: <ChefHat className="w-5 h-5 text-rose-500" />,
      title: t('premium.modal.features.cookingMode.title'),
      desc: t('premium.modal.features.cookingMode.desc'),
      bg: 'bg-rose-500/10 dark:bg-rose-500/15'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-teal-500" />,
      title: t('premium.modal.features.catalog.title'),
      desc: t('premium.modal.features.catalog.desc'),
      bg: 'bg-teal-500/10 dark:bg-teal-500/15'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">
      {/* Full-screen gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20" />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 right-0 w-56 h-56 bg-amber-400/15 dark:bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Content — flex column, fills screen, no overflow */}
      <div className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 pt-safe-top pb-safe-bottom select-none">

        {/* Close button */}
        {!loading && (
          <div className="flex justify-end pt-4 pb-2 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/6 hover:bg-black/10 dark:bg-white/8 dark:hover:bg-white/12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-14 shrink-0" />}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2.5 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-xl shadow-emerald-500/25 animate-pulse-slow">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent leading-tight">
              {t('premium.modal.title')}
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
              {t('premium.modal.subtitle')}
            </p>
          </div>
        </div>

        {/* Feature Grid — 2 columns, fills remaining space */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 flex-1 content-start">
          {featureItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-2 p-3.5 rounded-2xl ${item.bg}`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-gray-900/60 flex items-center justify-center shadow-sm shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-rose-500 bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20 text-center shrink-0">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-emerald-500 bg-emerald-500/10 py-2 px-3 rounded-xl border border-emerald-500/20 text-center flex items-center justify-center gap-1.5 shrink-0">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA Button — always at bottom, never scrolled away */}
        <div className="shrink-0 mt-4 mb-6">
          {isPremium ? (
            <button
              className="w-full h-14 text-sm font-extrabold rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-center gap-2 cursor-default"
            >
              <Check className="w-5 h-5" /> Du hast Premium
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 text-base font-extrabold rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-90 active:scale-[0.98] text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
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
