import React from 'react';
import { useI18n } from '../context/I18nContext';

// Custom SVG component for Instagram icon
export const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const ShareStep1Mockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-between select-none">
    <div className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
      <InstagramIcon className="w-9 h-9 text-black/10 dark:text-white/10" />
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 w-2/3">
        <div className="h-1.5 w-10 rounded bg-black/20 dark:bg-white/20" />
        <div className="h-1 w-full rounded bg-black/10 dark:bg-white/10" />
      </div>
      <div className="absolute bottom-2 right-2 flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
        <div className="w-6 h-6 rounded-full bg-black/25 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </div>
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
          <div className="relative w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg className="w-3 h-3 text-white translate-x-[0.5px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ShareStep2Mockup = () => {
  const { language } = useI18n();
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-end select-none">
      <div className="flex-1 flex flex-col gap-2 opacity-25 px-1 pt-1">
        <div className="h-2 w-full rounded bg-black/20 dark:bg-white/20" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-black/30 dark:bg-white/30" />
              <div className="w-4 h-1 rounded bg-black/20 dark:bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-black/10 dark:border-white/10 rounded-lg p-1.5 shadow-md flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-black/5 dark:border-white/5">
            <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">Story</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-black/5 dark:border-white/5">
            <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">
            {language === 'de' ? 'Kopieren' : 'Copy'}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
            <div className="relative w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-400 shadow-md shadow-emerald-500/20 text-white">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
          </div>
          <span className="text-[7px] leading-none font-bold text-emerald-600 dark:text-emerald-400 truncate w-full text-center">
            {language === 'de' ? 'Teilen' : 'Share'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ShareStep3Mockup = () => {
  return (
    <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-2 overflow-hidden shadow-inner flex flex-col justify-end select-none">
      <div className="flex-1 flex flex-col gap-1 opacity-25 px-0.5 pt-0.5">
        <div className="h-2 w-1/3 rounded bg-black/40 dark:bg-white/40" />
        <div className="h-1.5 w-full rounded bg-black/20 dark:bg-white/20" />
        <div className="h-1.5 w-2/3 rounded bg-black/20 dark:bg-white/20" />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-black/10 dark:border-white/10 rounded-lg p-1.5 shadow-md flex items-start gap-1 pt-0.5">
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.02-5.11-2.884-6.974C16.592 1.89 14.12 1.865 11.99 1.865c-5.43 0-9.854 4.417-9.858 9.853-.002 1.773.465 3.5 1.353 5.03L2.43 21.65l5.06-1.33.157.08z"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">WhatsApp</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
            <div className="relative w-6 h-6 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-500 overflow-hidden p-0.5">
              <img src="/icon-192.png" alt="Snagbite Logo" className="w-full h-full object-contain rounded-full" />
            </div>
          </div>
          <span className="text-[7px] leading-none font-bold text-emerald-600 dark:text-emerald-400 truncate w-full text-center">Snagbite</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">
            {useI18n().language === 'de' ? 'Mehr' : 'More'}
          </span>
        </div>
      </div>
    </div>
  );
};
