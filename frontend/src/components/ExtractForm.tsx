import React, { useState, useEffect } from 'react';
import { Card, TextField, Label, Input, Button, FieldError, Spinner, Accordion } from '@heroui/react';
import { BookOpen, Clipboard, Globe, HelpCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

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

interface ExtractFormProps {
  url: string;
  setUrl: (url: string) => void;
  urlError: string;
  validateUrl: (url: string) => boolean;
  isPending: boolean;
  handleFormSubmit: (e: React.FormEvent) => void;
}

export default function ExtractForm({
  url,
  setUrl,
  urlError,
  validateUrl,
  isPending,
  handleFormSubmit
}: ExtractFormProps) {
  const { t } = useI18n();
  const [canPaste, setCanPaste] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      setCanPaste(true);
    }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (urlError) validateUrl(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleDemoClick = (demoUrl: string) => {
    if (isPending) return;
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
      url: 'https://www.instagram.com/reel/C8qV_0yIm2q/',
      color: 'from-pink-500 to-rose-500',
      icon: <InstagramIcon className="w-4 h-4 text-white" />
    },
    {
      name: 'TikTok Video',
      url: 'https://www.tiktok.com/@gordonramsayofficial/video/7312345678901234567',
      color: 'from-gray-900 to-black dark:from-gray-800 dark:to-gray-900',
      icon: <TikTokIcon className="w-4 h-4 text-white" />
    },
    {
      name: 'Web Recipe',
      url: 'https://www.seriouseats.com/easy-pan-pizza-recipe',
      color: 'from-emerald-500 to-teal-500',
      icon: <Globe className="w-4 h-4 text-white" />
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Input Card */}
      <Card className="glass-panel p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl">
        {/* Supported Platforms */}
        <div className="flex flex-col gap-2 mb-4">
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
              <span className="text-[10px] text-gray-400 dark:text-gray-500">YouTube</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Websites</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
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
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-3 pr-20 py-3.5 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
            className={`py-3.5 h-12 text-sm rounded-xl font-semibold shadow-lg text-white ${
              isPending 
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
        </form>
      </Card>

      {/* Demo Recipes Card */}
      {!url && (
        <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-md flex flex-col gap-3">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('form.demoTitle')}
          </span>
          <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}

