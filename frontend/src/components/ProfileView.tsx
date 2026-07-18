import { useState } from 'react';
import { ArrowLeft, Crown, Sparkles } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import ExtractionCard from './ExtractionCard';
import PremiumUpgradeCard from './PremiumUpgradeCard';
import PremiumModal from './PremiumModal';

interface ProfileViewProps {
  onBack: () => void;
  limitStatus: any;
}

const getInitials = (email?: string) => {
  if (!email) return 'U';
  return email.charAt(0).toUpperCase();
};

export default function ProfileView({ onBack, limitStatus }: ProfileViewProps) {
  const { t, language } = useI18n();
  const { user, isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out font-sans pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3 px-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {language === 'de' ? 'Mein Bereich' : 'My Space'}
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
            {language === 'de' ? 'Profil' : 'Profile'}
          </h2>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="mx-2 p-5 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-3xl shadow-sm flex flex-col gap-4 relative overflow-hidden">
        {isPremium && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
        )}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0 ${
            isPremium 
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/20 ring-2 ring-emerald-500/20' 
              : 'bg-gradient-to-tr from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 shadow-black/10'
          }`}>
            {getInitials(user?.email)}
          </div>
          <div className="flex flex-col min-w-0 font-sans">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {language === 'de' ? 'Konto' : 'Account'}
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white truncate mt-0.5">
              {user?.email}
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              {user?.app_metadata?.tier === 'beta' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                  {t('app.settings.betaActive') || 'Beta Access'}
                </span>
              ) : isPremium ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  <Crown className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  Premium
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5 uppercase tracking-wider">
                  Free Member
                </span>
              )}
            </div>
          </div>
        </div>

        {user?.app_metadata?.tier === 'beta' ? (
          <div className="pt-3.5 border-t border-black/5 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {t('app.settings.betaActiveDesc') || 'You are a beta tester! You have free access to all premium features during the beta. Extraction limits apply.'}
            </span>
          </div>
        ) : isPremium ? (
          <div className="pt-3.5 border-t border-black/5 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {t('app.settings.premiumActiveDesc') || 'You have unlimited access to all premium features.'}
            </span>
          </div>
        ) : null}
      </div>

      {/* Extraction Card */}
      <ExtractionCard 
        limitStatus={limitStatus} 
        onUpgradeClick={() => setIsPremiumModalOpen(true)} 
        className="mx-2"
      />

      {/* Premium Upgrade Promotion */}
      <PremiumUpgradeCard 
        onUpgradeClick={() => setIsPremiumModalOpen(true)} 
        className="mx-2"
      />

      {/* Premium Modal */}
      <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
    </div>
  );
}
