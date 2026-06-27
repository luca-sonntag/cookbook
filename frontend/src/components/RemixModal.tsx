import { useState, useEffect, useRef } from 'react';
import { Button, Card } from '@heroui/react';
import { Sparkles, Wand2, X } from 'lucide-react';
import { useRecipeRemix } from '../hooks/useRecipeRemix';
import { useI18n } from '../context/I18nContext';
import type { Recipe } from '../types';

interface RemixModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipeId: string;
  onRemixSuccess: (newRecipe: Recipe) => void;
}

export default function RemixModal({ isOpen, onOpenChange, recipeId, onRemixSuccess }: RemixModalProps) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickChips = [
    { label: t('remix.chips.vegan.label'), prompt: t('remix.chips.vegan.prompt') },
    { label: t('remix.chips.highProtein.label'), prompt: t('remix.chips.highProtein.prompt') },
    { label: t('remix.chips.lowCalorie.label'), prompt: t('remix.chips.lowCalorie.prompt') },
    { label: t('remix.chips.budget.label'), prompt: t('remix.chips.budget.prompt') },
    { label: t('remix.chips.glutenFree.label'), prompt: t('remix.chips.glutenFree.prompt') }
  ];

  const handleSuccess = (newRecipe: Recipe) => {
    onOpenChange(false);
    onRemixSuccess(newRecipe);
  };

  const { isPending, triggerRemix, jobStatus, jobError } = useRecipeRemix(handleSuccess);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isPending, onOpenChange]);

  const handleChipClick = (chipPrompt: string) => {
    if (prompt === chipPrompt) {
      setPrompt('');
    } else {
      setPrompt(chipPrompt);
    }
  };

  const handleSubmit = () => {
    triggerRemix(recipeId, prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isPending && prompt.trim()) {
        handleSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isPending && onOpenChange(false)}
      />

      {/* Modal Container */}
      <Card className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-2xl bg-white dark:bg-gray-900 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 z-10">
        
        {!isPending && (
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label={t('dialog.closeAria')}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col gap-1 pr-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            {t('remix.title')}
          </h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {t('remix.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, idx) => {
              const isActive = prompt === chip.prompt;
              return (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip.prompt)}
                  disabled={isPending}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                    isActive 
                      ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500' 
                      : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 250))}
              onKeyDown={handleKeyDown}
              placeholder={t('remix.placeholder')}
              rows={3}
              maxLength={250}
              disabled={isPending}
              aria-label={t('remix.placeholder')}
              className="w-full text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 pb-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white resize-none"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 dark:text-gray-500 font-semibold pointer-events-none select-none">
              {prompt.length}/250
            </div>
          </div>
          
          {isPending && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-pulse flex flex-col gap-1">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {t('remix.generating')}
              </p>
              {jobStatus && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`job.status.${jobStatus}.text`)}
                </p>
              )}
            </div>
          )}

          {jobError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {jobError}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 mt-2">
          <Button 
            variant="ghost" 
            onPress={() => onOpenChange(false)}
            isDisabled={isPending}
            className="font-semibold text-gray-600 dark:text-gray-300"
          >
            {t('remix.btnCancel')}
          </Button>
          <Button
            onPress={handleSubmit}
            isDisabled={isPending || !prompt.trim()}
            className="bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 flex items-center gap-2"
          >
            {t('remix.btnStart')}
            {!isPending && <Wand2 className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
