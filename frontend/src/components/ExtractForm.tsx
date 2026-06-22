import React from 'react';
import { Card, TextField, Label, Input, Button, FieldError, Spinner } from '@heroui/react';
import { BookOpen } from 'lucide-react';
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

  return (
    <Card className="glass-panel p-6 rounded-2xl">
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
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-3 pr-10 py-3 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              disabled={isPending}
            />
            {url && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setUrl('')}
                disabled={isPending}
              >
                ×
              </button>
            )}
          </div>
          {urlError && <FieldError className="text-xs text-red-500 mt-1">{urlError}</FieldError>}
        </TextField>

        <Button
          type="submit"
          fullWidth
          isPending={isPending}
          className={`py-3 rounded-xl font-semibold shadow-lg text-white ${
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
  );
}

