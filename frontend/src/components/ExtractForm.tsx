import React, { useState, useEffect } from 'react';
import { Card, TextField, Label, Input, Button, FieldError, Spinner, Accordion } from '@heroui/react';
import { BookOpen, Clipboard, Globe, HelpCircle } from 'lucide-react';
import { Clipboard as CapClipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import PremiumModal from './PremiumModal';
import PremiumHint from './PremiumHint';

// Custom SVG component for Instagram icon
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

// Custom SVG component for YouTube icon
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const ShareStep1Mockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-800/40 p-2 overflow-hidden shadow-inner flex flex-col justify-between">
    <div className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center relative overflow-hidden">
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

const ShareStep2Mockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-800/40 p-2 overflow-hidden shadow-inner flex flex-col justify-end">
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

    <div className="bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded-lg p-1.5 shadow-md flex items-start gap-1">
      <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-black/5 dark:border-white/5">
          <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">Story</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-black/5 dark:border-white/5">
          <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">Kopieren</span>
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
        <span className="text-[7px] leading-none font-bold text-emerald-600 dark:text-emerald-400 truncate w-full text-center">Teilen</span>
      </div>
    </div>
  </div>
);

const ShareStep3Mockup = () => (
  <div className="relative w-[132px] h-[104px] shrink-0 mx-auto rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-800/40 p-2 overflow-hidden shadow-inner flex flex-col justify-end">
    <div className="flex-1 flex flex-col gap-1 opacity-25 px-0.5 pt-0.5">
      <div className="h-2 w-1/3 rounded bg-black/40 dark:bg-white/40" />
      <div className="h-1.5 w-full rounded bg-black/20 dark:bg-white/20" />
      <div className="h-1.5 w-2/3 rounded bg-black/20 dark:bg-white/20" />
    </div>

    <div className="bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded-lg p-1.5 shadow-md flex flex-col gap-1.5">
      <div className="w-6 h-0.5 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto" />

      <div className="flex items-start gap-1 pt-0.5">
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.02-5.11-2.884-6.974C16.592 1.89 14.12 1.865 11.99 1.865c-5.43 0-9.854 4.417-9.858 9.853-.002 1.773.465 3.5 1.353 5.03L2.43 21.65l5.06-1.33.157.08z"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">WhatsApp</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75 duration-1000" />
            <div className="relative w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-500 overflow-hidden p-0.5">
              <img src="/icon-192.png" alt="Snagbite Logo" className="w-full h-full object-contain rounded-full" />
            </div>
          </div>
          <span className="text-[7px] leading-none font-bold text-emerald-600 dark:text-emerald-400 truncate w-full text-center">Snagbite</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1 opacity-40">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
          <span className="text-[7px] leading-none text-gray-500 dark:text-gray-400 truncate w-full text-center">Mehr</span>
        </div>
      </div>
    </div>
  </div>
);

interface ExtractFormProps {
  url: string;
  setUrl: (url: string) => void;
  urlError: string;
  setUrlError?: (error: string) => void;
  validateUrl: (url: string) => boolean;
  isPending: boolean;
  handleFormSubmit: (e: React.FormEvent) => void;
  limitStatus?: { limit: number; used: number; remaining: number; windowDays: number; savedRecipes: number; maxSavedRecipes: number; cookbookFull: boolean } | null;
}

export default function ExtractForm({
  url,
  setUrl,
  urlError,
  setUrlError,
  validateUrl,
  isPending,
  handleFormSubmit,
  limitStatus
}: ExtractFormProps) {
  const { t } = useI18n();
  const { isPremium } = useAuth();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [canPaste, setCanPaste] = useState(false);

  // Free cookbook is full → block new extractions and steer to upgrade.
  const cookbookFull = !isPremium && !!limitStatus?.cookbookFull;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setCanPaste(true);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      setCanPaste(true);
    }
  }, []);

  const handlePaste = async () => {
    try {
      let text = '';
      if (Capacitor.isNativePlatform()) {
        const result = await CapClipboard.read();
        text = result.value;
      } else {
        text = await navigator.clipboard.readText();
      }
      if (text) {
        setUrl(text);
        validateUrl(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setUrlError(t('form.pasteFailed'));
    }
  };

  const handleDemoClick = (demoUrl: string) => {
    if (isPending) return;
    if (cookbookFull) { setIsPremiumModalOpen(true); return; }
    setUrl(demoUrl);
    validateUrl(demoUrl);

    // Auto-submit the form
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 50);
  };

  const DEMO_RECIPES = [
    {
      name: 'Instagram Reel',
      url: 'https://www.instagram.com/p/DYixugyxvSe/',
      color: 'from-pink-500 to-rose-500',
      icon: <InstagramIcon className="w-4 h-4 text-white" />
    },
    {
      name: 'TikTok Video',
      url: 'https://www.tiktok.com/@on_todays_bake/video/7618942237535194390',
      color: 'from-gray-900 to-black dark:from-gray-800 dark:to-gray-900',
      icon: <TikTokIcon className="w-4 h-4 text-white" />
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Input Card */}
      <Card className="glass-panel p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl">
        <form
          onSubmit={(e) => {
            if (cookbookFull) { e.preventDefault(); setIsPremiumModalOpen(true); return; }
            handleFormSubmit(e);
          }}
          className="flex flex-col gap-4"
        >
          <TextField
            fullWidth
            name="url"
            value={url}
            onChange={(val) => {
              setUrl(val);
              if (urlError) validateUrl(val);
            }}
            isInvalid={!!urlError}
          >
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.urlLabel')}</Label>
            <div className="relative mt-2">
              <Input
                placeholder={t('form.urlPlaceholder')}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-3 !pr-12 py-3.5 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                disabled={isPending}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {url && (
                  <button
                    type="button"
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => setUrl('')}
                    disabled={isPending}
                  >
                    ×
                  </button>
                )}
                {canPaste && !url && (
                  <button
                    type="button"
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500/10 transition-colors"
                    onClick={handlePaste}
                    disabled={isPending}
                    title={t('form.pasteTooltip')}
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {urlError && <FieldError className="text-xs text-red-500 mt-1">{urlError}</FieldError>}
          </TextField>

          <Button
            type="submit"
            fullWidth
            isPending={isPending}
            isDisabled={cookbookFull}
            className={`py-3.5 h-12 text-sm rounded-xl font-semibold shadow-lg text-white ${cookbookFull
              ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70'
              : isPending
                ? 'bg-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all'
              }`}
          >
            {({ isPending }) => (
              <span className="flex items-center gap-2 justify-center">
                {isPending ? (
                  <>
                    <Spinner color="current" size="sm" />
                    <span>{t('form.btnPending')}</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>{t('form.btnSubmit')}</span>
                  </>
                )}
              </span>
            )}
          </Button>

          {cookbookFull ? (
            <div className="flex flex-col gap-1.5 -mt-1">
              <PremiumHint
                variant="banner"
                onClick={() => setIsPremiumModalOpen(true)}
                label={t('premium.hint.catalogFull', {
                  count: limitStatus?.savedRecipes ?? 0,
                  limit: limitStatus?.maxSavedRecipes ?? 5
                })}
                cta={t('premium.hint.upgrade')}
              />
            </div>
          ) : limitStatus && limitStatus.limit >= 0 ? (
            <div className="flex flex-col items-center gap-1.5 -mt-1">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors">
                {t('form.remainingExtractions', {
                  remaining: limitStatus.remaining,
                  limit: limitStatus.limit,
                  days: limitStatus.windowDays === 1
                    ? t('form.remainingExtractionsToday')
                    : t('form.remainingExtractionsDays', { days: limitStatus.windowDays })
                })}
              </p>
              {!isPremium && (
                <PremiumHint
                  variant="inline"
                  onClick={() => setIsPremiumModalOpen(true)}
                  label={t('premium.hint.extractUnlimited')}
                />
              )}
            </div>
          ) : null}

          {/* Premium Modal */}
          <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />

          {/* Supported Platforms */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('form.platformsTitle')}
            </span>
            <div className="flex gap-5">
              <div className="flex flex-col items-center gap-1">
                <InstagramIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Instagram</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <TikTokIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">TikTok</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <YoutubeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center">YouTube Shorts</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <FacebookIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Facebook</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Websites</span>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Share Directly Accordion */}
      {!url && (
        <Accordion variant="surface" className="w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden" defaultExpandedKeys={['share']}>
          <Accordion.Item className="border-none" id="share">
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center justify-between text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  {t('form.helpShareTitle')}
                </span>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-3 text-xs text-gray-600 dark:text-gray-400 flex flex-col gap-4 border-t border-black/5 dark:border-white/5">
                <p className="leading-relaxed">{t('form.helpShareDesc')}</p>
                
                {/* Visual Step-by-Step Guide */}
                <div className="flex flex-col gap-3 pt-1">
                  {/* Step 1 */}
                  <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between">
                    <div className="flex-1 flex flex-col gap-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {t('form.helpShareStep1Title')}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                        {t('form.helpShareStep1Desc')}
                      </p>
                    </div>
                    <ShareStep1Mockup />
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between">
                    <div className="flex-1 flex flex-col gap-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {t('form.helpShareStep2Title')}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                        {t('form.helpShareStep2Desc')}
                      </p>
                    </div>
                    <ShareStep2Mockup />
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 items-center justify-between">
                    <div className="flex-1 flex flex-col gap-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {t('form.helpShareStep3Title')}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                        {t('form.helpShareStep3Desc')}
                      </p>
                    </div>
                    <ShareStep3Mockup />
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center italic mt-1 leading-normal">
                  {t('form.helpShareStep')}
                </p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Help / Instructions Accordion */}
      {!url && (
        <Accordion variant="surface" className="w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
          <Accordion.Item className="border-none">
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center justify-between text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  {t('form.helpTitle')}
                </span>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-1 text-xs text-gray-600 dark:text-gray-400 flex flex-col gap-3.5 border-t border-black/5 dark:border-white/5">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 shrink-0">
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Instagram Reel</h4>
                    <p>{t('form.helpSteps.instagram')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200 shrink-0">
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">TikTok Video</h4>
                    <p>{t('form.helpSteps.tiktok')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                    <YoutubeIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">YouTube Shorts</h4>
                    <p>{t('form.helpSteps.youtube')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <FacebookIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Facebook Video</h4>
                    <p>{t('form.helpSteps.facebook')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Recipe Website</h4>
                    <p>{t('form.helpSteps.website')}</p>
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Demo Recipes Card */}
      {!url && (
        <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-md flex flex-col gap-3">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('form.demoTitle')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_RECIPES.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDemoClick(demo.url)}
                disabled={isPending}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all text-center gap-1.5 group"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${demo.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  {demo.icon}
                </div>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  {demo.name}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

