import { Card, Button } from '@heroui/react';
import { ChefHat, Compass, Link, Sparkles, Plus } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

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

      {/* Interactive Step-by-Step Guide */}
      <div className="flex flex-col gap-4">
        {/* Step 1 */}
        <div className="flex gap-3.5 items-start p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/[0.03] dark:border-white/[0.03] transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.08]">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {t('catalog.emptyState.step1Title')}
            </span>
            <span className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t('catalog.emptyState.step1Desc')}
            </span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3.5 items-start p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/[0.03] dark:border-white/[0.03] transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.08]">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Link className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {t('catalog.emptyState.step2Title')}
            </span>
            <span className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t('catalog.emptyState.step2Desc')}
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3.5 items-start p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/[0.03] dark:border-white/[0.03] transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.08]">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {t('catalog.emptyState.step3Title')}
            </span>
            <span className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t('catalog.emptyState.step3Desc')}
            </span>
          </div>
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
