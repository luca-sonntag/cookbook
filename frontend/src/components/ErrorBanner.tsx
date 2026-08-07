import { Button } from '@heroui/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { resolveErrorCode } from '../i18n';
import { isRetryableError } from '../errorCodes';
import type { ErrorParams } from '../errorCodes';

interface ErrorBannerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  jobError: string | null;
  jobErrorCode?: string | null;
  jobErrorParams?: ErrorParams | null;
  /** Re-runs the failed import. The caller decides what "again" means per input
   *  channel — resubmitting the URL, or re-uploading the selected photos. */
  onRetry: () => void;
}

export default function ErrorBanner({
  isPending,
  jobStatus,
  jobError,
  jobErrorCode,
  jobErrorParams,
  onRetry
}: ErrorBannerProps) {
  const { t, language } = useI18n();

  if (isPending || jobStatus !== 'failed') return null;

  if (jobErrorCode === 'RATE_LIMIT_EXCEEDED') {
    return null;
  }

  const canRetry = isRetryableError(jobErrorCode, jobError);

  return (
    <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">{t('error.title')}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-700 dark:text-rose-300 font-medium">
            {resolveErrorCode(jobErrorCode, jobErrorParams ?? undefined, jobError, language) || t('error.default')}
          </p>
          {canRetry && (
            <Button
              size="sm"
              variant="tertiary"
              onPress={onRetry}
              className="mt-3 h-8 gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 px-3 text-xs font-bold text-rose-600 dark:text-rose-300 border-none outline-none"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t('error.retry')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


