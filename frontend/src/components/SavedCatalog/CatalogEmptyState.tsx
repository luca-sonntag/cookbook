import { Card, Button } from '@heroui/react';
import { ChefHat, Compass, Link, Sparkles, Plus, Clipboard } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const CatalogDiscoverMockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col gap-1 justify-between select-none">
    {/* Search Bar Representation */}
    <div className="h-4 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center px-1.5 gap-1 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
      <div className="h-1 w-10 rounded bg-black/15 dark:bg-white/15" />
    </div>
    {/* Food Post Representation */}
    <div className="flex-1 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/5 flex items-center justify-center relative overflow-hidden">
      <ChefHat className="w-7 h-7 text-emerald-600/30 dark:text-emerald-400/20" />
      <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5 w-2/3">
        <div className="h-1 w-8 rounded bg-black/20 dark:bg-white/20" />
        <div className="h-0.5 w-full rounded bg-black/10 dark:bg-white/10" />
      </div>
      <div className="absolute right-1.5 bottom-1.5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
          <div className="relative w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 text-white">
            <Compass className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CatalogCopyLinkMockup = () => {
  const { language } = useI18n();
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-center gap-2 select-none">
      {/* Browser URL bar */}
      <div className="rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 flex items-center justify-between gap-1 shadow-sm">
        <div className="flex-1 min-w-0 flex items-center gap-1 pl-0.5">
          <Link className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          <span className="text-[7px] text-gray-400 truncate">instagram.com/reel/C3b...</span>
        </div>
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75 duration-1000" />
          <div className="relative w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border border-blue-400 shadow-md shadow-blue-500/20 text-white">
            <Clipboard className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>
      {/* Success Indicator */}
      <div className="flex items-center gap-1 justify-center opacity-90 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        <span className="text-[8px] font-bold text-green-600 dark:text-green-400">
          {language === 'de' ? 'Link kopiert!' : 'Link copied!'}
        </span>
      </div>
    </div>
  );
};

const CatalogExtractMockup = () => {
  const { language } = useI18n();
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-between select-none">
      {/* App Header representation */}
      <div className="flex items-center justify-center gap-1 pt-0.5">
        <div className="relative w-3.5 h-3.5 shrink-0 rounded bg-emerald-500 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
          </svg>
        </div>
        <span className="text-[8px] font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">Snagbite</span>
      </div>
      {/* Input Field representation */}
      <div className="rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-1 flex items-center shrink-0">
        <span className="text-[6px] text-gray-400 dark:text-gray-500 truncate flex-1">https://instagram.com/p/DYixug...</span>
      </div>
      {/* Extract Button representation */}
      <div className="relative mt-1">
        <div className="absolute inset-0 rounded-lg bg-emerald-500 animate-ping opacity-75 duration-1000" />
        <div className="relative h-6 rounded-lg bg-emerald-600 border border-emerald-500 flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 text-white px-2">
          <Sparkles className="w-2.5 h-2.5 text-white" />
          <span className="text-[8px] font-bold leading-none">
            {language === 'de' ? 'Zaubern' : 'Extract'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function CatalogEmptyState() {
  const { t } = useI18n();

  const handleNavigateToExtract = () => {
    window.location.hash = '#/extract';
  };

  return (
    <Card className="glass-panel p-6 sm:p-8 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col gap-6 sm:gap-8 max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Top Ambient Glows */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="text-center flex flex-col items-center justify-center pt-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 dark:from-emerald-500/30 dark:to-teal-500/20 flex items-center justify-center mb-4 shadow-inner border border-emerald-500/10 group hover:scale-105 transition-transform duration-300">
          <ChefHat className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse-slow" />
        </div>
        <h3 className="text-lg font-bold text-gray-950 dark:text-white leading-snug">
          {t('catalog.emptyState.welcomeTitle')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs leading-relaxed">
          {t('catalog.emptyState.welcomeDesc')}
        </p>
      </div>

      {/* Interactive Step-by-Step Guide with Mockups */}
      <div className="flex flex-col gap-4">
        {/* Step 1 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('catalog.emptyState.step1Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('catalog.emptyState.step1Desc')}
            </p>
          </div>
          <CatalogDiscoverMockup />
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('catalog.emptyState.step2Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('catalog.emptyState.step2Desc')}
            </p>
          </div>
          <CatalogCopyLinkMockup />
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('catalog.emptyState.step3Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('catalog.emptyState.step3Desc')}
            </p>
          </div>
          <CatalogExtractMockup />
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="flex justify-center pb-2">
        <Button
          onPress={handleNavigateToExtract}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all flex items-center gap-2 border border-emerald-500/15 active:scale-95 duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>{t('catalog.emptyState.ctaButton')}</span>
        </Button>
      </div>
    </Card>
  );
}
