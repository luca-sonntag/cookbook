import { Card, Button } from '@heroui/react';
import { ChefHat, Link, Sparkles, Plus, Clipboard } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const CatalogDiscoverMockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-1 flex items-center justify-center overflow-hidden shadow-inner select-none">
    {/* Vertical Phone Screen Mockup representing a Reel */}
    <div className="w-[54px] h-[88px] rounded-lg bg-black relative border border-black/20 overflow-hidden shadow-md flex flex-col justify-between p-1">
      {/* Video Content representation (cook gradient background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950 flex items-center justify-center">
        <ChefHat className="w-6 h-6 text-white/15" />
      </div>

      {/* Top Status Bar mock */}
      <div className="absolute top-1 left-0 right-0 px-1.5 flex justify-between items-center z-10 opacity-60">
        <div className="w-1 h-1 rounded-full bg-white" />
        <div className="flex gap-0.5">
          <div className="w-1 h-0.5 bg-white rounded-xs" />
          <div className="w-2 h-0.5 bg-white rounded-xs" />
        </div>
      </div>

      {/* Bottom overlay: user profile and caption */}
      <div className="absolute bottom-1 left-1 flex flex-col gap-0.5 z-10 w-[24px]">
        {/* User avatar + handle */}
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 border border-white/20 shrink-0" />
          <div className="h-0.5 w-3 rounded bg-white/30" />
        </div>
        {/* Caption lines */}
        <div className="h-0.5 w-full rounded bg-white/20" />
        <div className="h-0.5 w-2/3 rounded bg-white/20" />
      </div>

      {/* Right side overlays: Action icons stack */}
      <div className="absolute right-1 bottom-1 flex flex-col items-center gap-1 z-10">
        {/* Like (Heart) */}
        <div className="w-2.5 h-2.5 rounded-full bg-white/15 border border-white/10 flex items-center justify-center">
          <svg className="w-1.5 h-1.5 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        {/* Comment */}
        <div className="w-2.5 h-2.5 rounded-full bg-white/15 border border-white/10 flex items-center justify-center">
          <svg className="w-1.5 h-1.5 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        {/* Share (Paper Airplane) with active highlight */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
          <div className="relative w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white border border-emerald-400 shadow-md shadow-emerald-500/30">
            <svg className="w-2 h-2 translate-x-[0.3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
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
