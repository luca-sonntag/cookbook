import { Card, Button } from '@heroui/react';
import { ChefHat, ShoppingCart, Play, MessageCircle, Clock, Utensils } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

/* Step 1 — a mini saved-recipe card being tapped */
const RecipeCardMockup = () => {
  const { language } = useI18n();
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex items-center justify-center select-none">
      {/* Recipe card */}
      <div className="relative w-[74px] rounded-lg bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
        {/* Image area with creator badge */}
        <div className="relative h-[42px] bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-black/10 dark:text-white/10" />
          <div className="absolute bottom-1 left-1 h-2.5 px-1 rounded bg-black/50 flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-pink-400" />
            <span className="h-0.5 w-2.5 rounded bg-white/70" />
          </div>
        </div>
        {/* Title + stat footer */}
        <div className="p-1.5 flex flex-col gap-1">
          <div className="h-1 w-full rounded bg-black/15 dark:bg-white/15" />
          <div className="h-1 w-2/3 rounded bg-black/10 dark:bg-white/10" />
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="flex items-center gap-0.5">
              <Clock className="w-1.5 h-1.5 text-emerald-500" />
              <span className="h-0.5 w-2 rounded bg-black/15 dark:bg-white/15" />
            </span>
            <span className="flex items-center gap-0.5">
              <Utensils className="w-1.5 h-1.5 text-emerald-500" />
              <span className="h-0.5 w-2 rounded bg-black/15 dark:bg-white/15" />
            </span>
          </div>
        </div>
      </div>

      {/* Tap affordance */}
      <div className="absolute bottom-2 right-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
          <div className="relative px-1.5 h-4 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <span className="text-[7px] font-bold text-white leading-none">
              {language === 'de' ? 'Öffnen' : 'Open'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Step 2 — the recipe floating action dock with the cart button highlighted */
const AddToCartMockup = () => {
  const { language } = useI18n();
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-end select-none">
      {/* Faint recipe content behind the dock */}
      <div className="flex-1 flex flex-col gap-1 opacity-25 px-0.5 pt-0.5">
        <div className="h-2 w-1/2 rounded bg-black/30 dark:bg-white/30" />
        <div className="h-1.5 w-full rounded bg-black/20 dark:bg-white/20" />
        <div className="h-1.5 w-5/6 rounded bg-black/20 dark:bg-white/20" />
        <div className="h-1.5 w-2/3 rounded bg-black/20 dark:bg-white/20" />
      </div>

      {/* Floating action dock: Start cooking · Remix · Add to cart */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-black/10 dark:border-white/10 rounded-full px-1.5 py-1.5 shadow-md flex items-center justify-center gap-1.5">
        {/* Start cooking pill (muted) */}
        <div className="h-5 px-1.5 rounded-full bg-emerald-500/40 flex items-center gap-0.5 opacity-70">
          <Play className="w-2 h-2 text-white" fill="currentColor" />
          <span className="h-0.5 w-3 rounded bg-white/70" />
        </div>

        {/* Remix / Copilot Chat (muted) */}
        <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center opacity-50">
          <MessageCircle className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Highlighted cart action */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
          <div className="relative w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-400 shadow-md shadow-emerald-500/20 text-white">
            <ShoppingCart className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-center pt-1">
        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
          {language === 'de' ? 'In den Wagen' : 'Add to cart'}
        </span>
      </div>
    </div>
  );
};

/* Step 3 — items landing in the list, auto-grouped by supermarket aisle */
const AisleListMockup = () => {
  const { language } = useI18n();
  const aisles: { label: string; items: number }[] = [
    { label: language === 'de' ? 'Obst & Gemüse' : 'Produce', items: 2 },
    { label: language === 'de' ? 'Molkerei' : 'Dairy', items: 1 },
  ];
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col gap-1.5 select-none">
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shrink-0">
        <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
      </div>

      {/* Aisle groups */}
      {aisles.map((aisle) => (
        <div key={aisle.label} className="flex flex-col gap-1">
          <span className="text-[7px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 leading-none">
            {aisle.label}
          </span>
          {[...Array(aisle.items)].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[3px] border border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-500/10 shrink-0" />
              <div className="h-1 flex-1 rounded bg-black/10 dark:bg-white/10" style={{ maxWidth: i % 2 === 0 ? '100%' : '70%' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default function ShoppingEmptyState() {
  const { t } = useI18n();

  const handleNavigateToRecipes = () => {
    window.location.hash = '#/history';
  };

  return (
    <Card className="glass-panel p-6 sm:p-8 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col gap-6 sm:gap-8 max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="text-center flex flex-col items-center justify-center pt-2">
        <h3 className="text-lg font-bold text-gray-950 dark:text-white leading-snug">
          {t('shopping.emptyState.welcomeTitle')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs leading-relaxed">
          {t('shopping.emptyState.welcomeDesc')}
        </p>
      </div>

      {/* Step-by-step guide */}
      <div className="flex flex-col gap-4">
        {/* Step 1 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('shopping.emptyState.step1Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('shopping.emptyState.step1Desc')}
            </p>
          </div>
          <RecipeCardMockup />
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('shopping.emptyState.step2Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('shopping.emptyState.step2Desc')}
            </p>
          </div>
          <AddToCartMockup />
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-default">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {t('shopping.emptyState.step3Title')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
              {t('shopping.emptyState.step3Desc')}
            </p>
          </div>
          <AisleListMockup />
        </div>
      </div>

      {/* Primary CTA */}
      <div className="flex justify-center pb-2">
        <Button
          onPress={handleNavigateToRecipes}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all flex items-center gap-2 border border-emerald-500/15 active:scale-95 duration-150"
        >
          <ChefHat className="w-4 h-4" />
          <span>{t('shopping.emptyState.ctaButton')}</span>
        </Button>
      </div>
    </Card>
  );
}
