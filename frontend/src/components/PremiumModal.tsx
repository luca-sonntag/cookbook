import { useState, useEffect } from 'react';
import { Button, Card } from '@heroui/react';
import { Crown, Check, X, Zap, ChefHat, Sparkles, ShoppingBag, Eye, Calendar, BookOpen } from 'lucide-react';
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
    }
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
      // Direct call to capacitor purchase logic
      const purchased = await buyPremium();
      if (purchased) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        // User cancelled, just reset loading state
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
      icon: <Zap className="w-5 h-5 text-amber-500 shrink-0" />,
      title: t('premium.modal.features.extractions.title'),
      desc: t('premium.modal.features.extractions.desc')
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: t('premium.modal.features.remix.title'),
      desc: t('premium.modal.features.remix.desc')
    },
    {
      icon: <Eye className="w-5 h-5 text-blue-500 shrink-0" />,
      title: t('premium.modal.features.nutrition.title'),
      desc: t('premium.modal.features.nutrition.desc')
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-purple-500 shrink-0" />,
      title: t('premium.modal.features.shoppingList.title'),
      desc: t('premium.modal.features.shoppingList.desc')
    },
    {
      icon: <ChefHat className="w-5 h-5 text-rose-500 shrink-0" />,
      title: t('premium.modal.features.cookingMode.title'),
      desc: t('premium.modal.features.cookingMode.desc')
    },
    {
      icon: <BookOpen className="w-5 h-5 text-teal-500 shrink-0" />,
      title: t('premium.modal.features.catalog.title'),
      desc: t('premium.modal.features.catalog.desc')
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with premium dark-glow blur effect */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Modal Container */}
      <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 p-6 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 z-10 select-none">
        
        {/* Animated ambient background glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 dark:bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        {!loading && (
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-1 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mt-2 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 animate-pulse-slow">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent mt-1">
            {t('premium.modal.title')}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('premium.modal.subtitle')}
          </p>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-3.5 my-2 z-10">
          {featureItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
              {item.icon}
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {item.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Status Messaging */}
        {errorMsg && (
          <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 dark:bg-rose-500/5 py-2 px-3 rounded-xl border border-rose-500/20 text-center z-10">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 py-2 px-3 rounded-xl border border-emerald-500/20 text-center flex items-center justify-center gap-1.5 z-10">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-1 z-10">
          {isPremium ? (
            <Button
              className="w-full h-12 text-sm font-extrabold rounded-2xl bg-emerald-500 text-white shadow-lg border border-emerald-400/20 shrink-0 cursor-default"
            >
              <Check className="w-5 h-5" /> Du hast Premium
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              isLoading={loading}
              className="w-full h-12 text-sm font-extrabold rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:opacity-90 active:scale-98 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/20 shrink-0 transition-all duration-200"
            >
              {loading ? t('premium.modal.loading') : t('premium.modal.cta')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
