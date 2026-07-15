import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Check, X, Loader2, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { buyPremium, getSubscriptionOfferings } from '../utils/purchase';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api';

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  const { t } = useI18n();
  const { isPremium, user, getAccessToken, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Optimizations States
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [showTableVariant, setShowTableVariant] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMsg(null);
      setLoading(false);
      document.body.style.overflow = 'hidden';

      // Verify status with server if currently seen as free user
      const currentTier = user?.app_metadata?.tier;
      if (currentTier !== 'premium' && currentTier !== 'beta') {
        const verifyServerTier = async () => {
          setIsValidating(true);
          try {
            const token = await getAccessToken();
            if (!token) return;
            const res = await fetch(apiUrl('/api/extractions/limit'), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.tier && data.tier !== currentTier) {
                console.log(`PremiumModal: Tier mismatch detected (local: ${currentTier}, server: ${data.tier}). Refreshing session...`);
                await refreshSession();
              }
            }
          } catch (err) {
            console.warn('PremiumModal: Failed to verify server tier:', err);
          } finally {
            setIsValidating(false);
          }
        };
        verifyServerTier();
      }

      // Load Packages from RevenueCat
      const loadOfferings = async () => {
        setIsLoadingPackages(true);
        try {
          const offs = await getSubscriptionOfferings();
          setPackages(offs);
          if (offs.length > 0) {
            // Auto-select Yearly package if present, otherwise first available
            const yearly = offs.find(p => p.packageType === 'ANNUAL');
            setSelectedPackageId(yearly?.identifier || offs[0].identifier);
          }
        } catch (err) {
          console.error('PremiumModal: Failed to load subscription offerings:', err);
        } finally {
          setIsLoadingPackages(false);
        }
      };
      loadOfferings();
    } else {
      document.body.style.overflow = '';
      setIsValidating(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user, getAccessToken, refreshSession]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) onOpenChange(false);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, loading, onOpenChange]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!selectedPackageId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const purchased = await buyPremium(selectedPackageId);
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
    { title: t('premium.modal.features.organization.title'), desc: t('premium.modal.features.organization.desc') },
  ];

  // Helper to determine trial info
  const selectedPackage = packages.find(p => p.identifier === selectedPackageId);
  const hasSelectedTrial = !!(selectedPackage?.product?.introPrice && selectedPackage?.product?.introPrice?.price === 0);
  const trialDays = selectedPackage?.product?.introPrice?.periodNumberOfUnits || 7;

  // Render the Coffee Anchor Badge if we have a monthly package or yearly monthly equivalence
  const renderCoffeeAnchor = () => {
    return (
      <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold tracking-wide uppercase shrink-0">
        <Sparkles className="w-3.5 h-3.5 fill-amber-300 animate-pulse" />
        {t('premium.modal.coffeeAnchor') || 'Weniger als ein Kaffee im Monat ☕'}
      </div>
    );
  };

  const modal = (
    <div className="fixed inset-0 z-[200] flex flex-col" role="dialog" aria-modal="true">

      {/* Fullscreen emerald-to-teal gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-emerald-700 to-teal-800" />

      {/* Radial highlight at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-60 bg-emerald-400/20 rounded-full filter blur-3xl pointer-events-none" />
      {/* Depth shadow at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

      {/* Content */}
      <div
        className="relative flex flex-col h-full w-full max-w-md mx-auto px-5 select-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)'
        }}
      >

        {/* Close Button */}
        {!loading && (
          <div className="flex justify-end pb-1 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/15 hover:bg-black/25 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label={t('premium.modal.close') || 'Schließen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && <div className="h-10 shrink-0" />}

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 pb-3 shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-7 h-7 text-amber-300 fill-amber-300" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">
              {t('premium.modal.title')}
            </h2>
          </div>
          <p className="text-sm text-emerald-100/80 max-w-xs leading-relaxed">
            {t('premium.modal.subtitle')}
          </p>
          {renderCoffeeAnchor()}
        </div>

        {/* Scrollable middle container */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 flex flex-col gap-4 py-2 scrollbar-thin">

          {/* Dynamic Comparison Table or Outcome Benefits */}
          {showTableVariant ? (
            /* Variant B: Comparison Table */
            <div className="flex flex-col rounded-3xl overflow-hidden bg-black/15 border border-white/10 shrink-0">
              <div className="bg-black/10 px-4 py-2 border-b border-white/10 text-center">
                <span className="text-xs font-bold text-white tracking-wide">
                  {t('premium.modal.comparison.tableTitle')}
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/8 text-[9px] uppercase tracking-wider text-emerald-200/50">
                    <th className="px-4 py-2.5 font-bold">{t('premium.modal.comparison.headerFeature')}</th>
                    <th className="px-3 py-2.5 font-bold text-center">{t('premium.modal.comparison.headerFree')}</th>
                    <th className="px-3 py-2.5 font-bold text-center text-amber-300">{t('premium.modal.comparison.headerPremium')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white">{t('premium.modal.comparison.rowExtractions')}</td>
                    <td className="px-3 py-2 text-center text-emerald-100/60">{t('premium.modal.comparison.rowExtractionsFree')}</td>
                    <td className="px-3 py-2 text-center font-bold text-amber-300">{t('premium.modal.comparison.rowExtractionsPremium')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white">{t('premium.modal.comparison.rowCookbook')}</td>
                    <td className="px-3 py-2 text-center text-emerald-100/60">{t('premium.modal.comparison.rowCookbookFree')}</td>
                    <td className="px-3 py-2 text-center font-bold text-amber-300">{t('premium.modal.comparison.rowCookbookPremium')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white">{t('premium.modal.comparison.rowShoppingList')}</td>
                    <td className="px-3 py-2 text-center text-emerald-100/60">{t('premium.modal.comparison.rowShoppingListFree')}</td>
                    <td className="px-3 py-2 text-center font-bold text-amber-300">{t('premium.modal.comparison.rowShoppingListPremium')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white">{t('premium.modal.comparison.rowAiChat')}</td>
                    <td className="px-3 py-2 text-center text-emerald-100/60">{t('premium.modal.comparison.rowAiChatFree')}</td>
                    <td className="px-3 py-2 text-center font-bold text-amber-300">{t('premium.modal.comparison.rowAiChatPremium')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white">{t('premium.modal.comparison.rowNutrition')}</td>
                    <td className="px-3 py-2 text-center text-emerald-100/60">{t('premium.modal.comparison.rowNutritionFree')}</td>
                    <td className="px-3 py-2 text-center font-bold text-amber-300">{t('premium.modal.comparison.rowNutritionPremium')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Variant A (Default): Outcome Benefits List */
            <div className="flex flex-col rounded-3xl overflow-hidden bg-black/10 border border-white/10 shrink-0">
              {featureItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 px-5 py-3 ${idx < featureItems.length - 1 ? 'border-b border-white/8' : ''}`}
                >
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-400/90 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/30">
                    <Check className="w-3.5 h-3.5 text-emerald-950" strokeWidth={3} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </span>
                    <span className="text-xs text-emerald-100/65 leading-snug">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle Layout Button */}
          <button
            onClick={() => setShowTableVariant(prev => !prev)}
            className="mx-auto text-[11px] font-bold text-amber-300/80 hover:text-amber-300 active:scale-95 transition-all py-1 flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            {showTableVariant ? t('premium.modal.switchLayoutBack') : t('premium.modal.switchLayout')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Pricing Options Cards */}
          {isLoadingPackages ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 shrink-0">
              <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
              <span className="text-xs text-emerald-100/60">{t('premium.modal.verifying') || 'Lade Optionen...'}</span>
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.identifier;
                const isYearly = pkg.packageType === 'ANNUAL';
                
                // Format monthly equivalent for yearly (standard yearly price / 12)
                let monthlyPriceStr = pkg.product.priceString;
                if (isYearly) {
                  const monthlyEquiv = pkg.product.pricePerMonthString || 
                    (pkg.product.price ? `${(pkg.product.price / 12).toFixed(2).replace('.', ',')} €` : '');
                  monthlyPriceStr = t('premium.modal.priceMonthlyEquivalent').replace('{price}', monthlyEquiv);
                }

                // If monthly package exists, we can show savings percentage on yearly
                // Hardcode 58% if there's a monthly equivalent package
                const hasSavings = isYearly && packages.some(p => p.packageType === 'MONTHLY');

                return (
                  <div
                    key={pkg.identifier}
                    onClick={() => setSelectedPackageId(pkg.identifier)}
                    className={`relative p-4 rounded-3xl flex flex-col gap-1 border-2 transition-all active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/25 border-amber-400 shadow-lg shadow-black/15'
                        : 'bg-black/15 border-white/10 hover:bg-black/20 hover:border-white/20'
                    }`}
                  >
                    {/* Bestseller Badge */}
                    {isYearly && (
                      <span className="absolute top-0 right-4 -translate-y-1/2 bg-amber-400 text-emerald-950 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {t('premium.modal.bestseller') || 'Bestseller'}
                      </span>
                    )}

                    {/* Savings Badge */}
                    {hasSavings && (
                      <span className="absolute top-2 left-2 bg-emerald-400 text-emerald-950 font-extrabold text-[7px] px-1.5 py-0.5 rounded">
                        {t('premium.modal.savePercent').replace('{percent}', '58') || '-58%'}
                      </span>
                    )}

                    <div className="pt-2 text-xs font-bold text-white/80">
                      {isYearly ? t('premium.modal.yearly') : t('premium.modal.monthly')}
                    </div>

                    <div className="text-lg font-extrabold text-white leading-tight">
                      {monthlyPriceStr}
                    </div>

                    <div className="text-[10px] text-emerald-100/60 mt-auto">
                      {isYearly 
                        ? t('premium.modal.priceYearlyPeriod').replace('{price}', pkg.product.priceString)
                        : t('premium.modal.pricePeriod').replace('{price}', pkg.product.priceString)
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="text-xs text-amber-200/80 leading-relaxed">
                Keine Angebote geladen. Der Kauf wird über das Standard-Abo abgewickelt.
              </span>
            </div>
          )}

          {/* Blinkist Step-by-Step Trial Timeline */}
          {!isLoadingPackages && hasSelectedTrial && (
            <div className="flex flex-col gap-3 bg-black/15 border border-white/10 rounded-3xl p-4.5 shrink-0">
              <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                {t('premium.modal.freeTrialTitle') || '7 Tage kostenlos testen'}
              </div>
              
              <div className="relative pl-7 flex flex-col gap-4">
                {/* Connector Line */}
                <div className="absolute left-[9px] top-2.5 bottom-2.5 w-0.5 bg-emerald-500/30" />
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-amber-400 border border-emerald-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-extrabold text-white">
                      {t('premium.modal.timeline.step1Title') || 'Heute'}
                    </span>
                    <span className="text-[11px] text-emerald-100/70">
                      {t('premium.modal.timeline.step1Desc') || 'Testphase starten. Vollzugriff.'}
                    </span>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-emerald-600 border border-emerald-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-extrabold text-white">
                      {t('premium.modal.timeline.step2Title') || 'Tag 5'}
                    </span>
                    <span className="text-[11px] text-emerald-100/70">
                      {t('premium.modal.timeline.step2Desc') || 'Erinnerungs-Push erhalten.'}
                    </span>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-emerald-600 border border-emerald-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-extrabold text-white">
                      {t('premium.modal.timeline.step3Title').replace('{days}', String(trialDays)) || 'Tag 7'}
                    </span>
                    <span className="text-[11px] text-emerald-100/70">
                      {t('premium.modal.timeline.step3Desc') || 'Abo beginnt. Jederzeit kündbar.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mt-3 text-xs font-semibold text-white bg-red-500/30 py-2 px-3 rounded-xl border border-red-300/20 text-center shrink-0">
            {errorMsg}
          </div>
        )}
        {success && (
          <div className="mt-3 text-xs font-semibold text-white bg-emerald-400/20 py-2 px-3 rounded-xl border border-emerald-300/20 text-center flex items-center justify-center gap-1.5 shrink-0">
            <Check className="w-4 h-4" /> {t('premium.modal.success')}
          </div>
        )}

        {/* CTA Button Block */}
        <div className="shrink-0 mt-4">
          {user?.app_metadata?.tier === 'beta' ? (
            <button className="w-full h-14 rounded-2xl bg-white/15 border border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-default">
              <Check className="w-5 h-5 text-amber-300" /> {t('premium.modal.betaOwned') || 'Beta-Zugriff Aktiv'}
            </button>
          ) : isPremium ? (
            <button className="w-full h-14 rounded-2xl bg-white/15 border border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-default">
              <Check className="w-5 h-5 text-amber-300" /> {t('premium.modal.owned') || 'Du hast Premium'}
            </button>
          ) : isValidating || isLoadingPackages ? (
            <button disabled className="w-full h-14 rounded-2xl bg-white/15 border border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-default">
              <Loader2 className="w-5 h-5 animate-spin text-amber-300" /> {t('premium.modal.verifying') || 'Verifiziere Status...'}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading || !selectedPackageId}
              className="w-full h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-base font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-black/25 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 cursor-pointer animate-pulse"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('premium.modal.loading')}</>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  <span>
                    {hasSelectedTrial ? t('premium.modal.ctaWithTrial') : t('premium.modal.ctaWithoutTrial')}
                  </span>
                </>
              )}
            </button>
          )}
          {!isPremium && !loading && !isValidating && !isLoadingPackages && (
            <p className="text-center text-[11px] text-emerald-100/50 mt-2 font-semibold">
              {t('premium.modal.cancelSubtitle') || 'Kein Risiko. Jederzeit kündbar.'}
            </p>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
