import { useState } from 'react';
import { Card, Button } from '@heroui/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { resolveErrorCode } from '../i18n';
import { isRetryableError } from '../errorCodes';
import type { ErrorParams } from '../errorCodes';
import PremiumHint from './PremiumHint';
import PremiumModal from './PremiumModal';

interface ErrorBannerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  jobError: string | null;
  jobErrorCode?: string | null;
  jobErrorParams?: ErrorParams | null;
  triggerExtraction: (url: string) => void;
  url: string;
}

export default function ErrorBanner({
  isPending,
  jobStatus,
  jobError,
  jobErrorCode,
  jobErrorParams,
  triggerExtraction,
  url
}: ErrorBannerProps) {
  const { t, language } = useI18n();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  if (isPending || jobStatus !== 'failed') return null;

  if (jobErrorCode === 'RATE_LIMIT_EXCEEDED') {
    return (
      <>
        <PremiumHint
          variant="banner"
          onClick={() => setIsPremiumModalOpen(true)}
          label={t('premium.hint.extractUnlimited')}
          cta={t('premium.hint.upgrade')}
        />
        <PremiumModal isOpen={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} />
      </>
    );
  }

  const canRetry = isRetryableError(jobErrorCode, jobError);

  return (
    <Card className="glass-panel p-4 rounded-2xl border border-red-500/15 bg-red-50/70 dark:bg-red-950/20">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('error.title')}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {resolveErrorCode(jobErrorCode, jobErrorParams ?? undefined, jobError, language) || t('error.default')}
          </p>
          {canRetry && (
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => triggerExtraction(url)}
              className="mt-3 h-8 gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-xs font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t('error.retry')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}


