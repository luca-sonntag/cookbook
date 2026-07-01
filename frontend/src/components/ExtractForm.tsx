import React, { useState, useEffect } from 'react';
import { Card, TextField, Label, Input, Button, FieldError, Spinner, Accordion } from '@heroui/react';
import { BookOpen, Clipboard, Instagram, Video, Globe, HelpCircle, Youtube } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

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
      icon: <Instagram className="w-4 h-4 text-white" />
    },
    {
      name: 'TikTok Video',
      url: 'https://www.tiktok.com/@gordonramsayofficial/video/7312345678901234567',
      color: 'from-gray-900 to-black dark:from-gray-800 dark:to-gray-900',
      icon: <Video className="w-4 h-4 text-white" />
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
        {/* Supported Platforms Badges */}
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('form.platformsTitle')}
          </span>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/15 rounded-full">
              <Instagram className="w-3.5 h-3.5" />
              Instagram
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 border border-black/10 dark:border-white/10 rounded-full">
              <Video className="w-3.5 h-3.5" />
              TikTok
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15 rounded-full">
              <Youtube className="w-3.5 h-3.5" />
              YouTube Shorts
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full">
              <Globe className="w-3.5 h-3.5" />
              Websites
            </span>
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
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">Instagram Reel</h4>
                    <p>{t('form.helpSteps.instagram')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200 shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">TikTok Video</h4>
                    <p>{t('form.helpSteps.tiktok')}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                    <Youtube className="w-3.5 h-3.5" />
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

