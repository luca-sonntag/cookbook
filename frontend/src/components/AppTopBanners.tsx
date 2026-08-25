import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import TimerBanner from './TimerBanner';
import OtaUpdateBanner from './OtaUpdateBanner';
import type { Recipe } from '../types';

interface AppTopBannersProps {
  activeView: string;
  isPending: boolean;
  recipe: Recipe | null;
}

export const AppTopBanners: React.FC<AppTopBannersProps> = ({
  activeView,
  isPending,
  recipe,
}) => {
  const { t } = useI18n();
  const [stickyTopEl, setStickyTopEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!stickyTopEl) {
      root.style.removeProperty('--app-sticky-top');
      return;
    }
    const publish = () => {
      root.style.setProperty('--app-sticky-top', `${stickyTopEl.offsetHeight}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(stickyTopEl);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--app-sticky-top');
    };
  }, [stickyTopEl]);

  return (
    <div ref={setStickyTopEl} className="sticky top-0 z-40 w-full">
      {/* Status bar background filler for devices with safe-area-inset-top */}
      <div className="w-full h-[var(--safe-area-inset-top)] bg-[#064e3b]" />

      {activeView === 'extract' && !isPending && !recipe && (
        <header className="w-full bg-gray-50/85 dark:bg-gray-950/85 backdrop-blur-md transition-colors duration-300">
          <div className="relative w-full max-w-md mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0">
                <img src="/logo-login.png" alt="App Logo" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white m-0 leading-none">
                  {t('form.headerTitle') || t('app.title')}
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">
                  {t('form.headerSubtitle')}
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Active Cooking Timers Banner */}
      <TimerBanner />

      {/* Instant OTA Update Consent Banner */}
      <OtaUpdateBanner />
    </div>
  );
};
export default AppTopBanners;
