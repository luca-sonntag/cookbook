import { Loader2, CheckCircle2, AlertCircle, ChefHat, X, ChevronRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { resolveErrorCode } from '../i18n';
import { useExtractionJobs, OPEN_RECIPE_EVENT } from '../context/ExtractionJobsContext';
import type { ProgressStage } from '../types';

const STAGE_KEY: Record<ProgressStage, string> = {
  queued: 'activeExtractions.stages.queued',
  scraping: 'activeExtractions.stages.scraping',
  downloading_media: 'activeExtractions.stages.downloading_media',
  extracting_frames: 'activeExtractions.stages.extracting_frames',
  reading_photos: 'activeExtractions.stages.reading_photos',
  extracting_recipe: 'activeExtractions.stages.extracting_recipe',
  finalizing: 'activeExtractions.stages.finalizing',
};

/**
 * Lists the current user's in-flight and just-finished background extractions.
 * Rendered ONLY on the Extract tab (the store itself is app-wide so progress
 * survives tab switches). Premium users can run several at once; a finished
 * card is tapped to open its recipe — nothing auto-navigates.
 */
export default function ActiveExtractions() {
  const { t, language } = useI18n();
  const { jobs, dismissJob } = useExtractionJobs();

  if (jobs.length === 0) return null;

  const anyRunning = jobs.some(j => j.status !== 'completed' && j.status !== 'failed');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
        {anyRunning ? t('activeExtractions.title') : t('activeExtractions.titleDone')}
      </span>

      {jobs.map(job => {
        const isDone = job.status === 'completed';
        const isFailed = job.status === 'failed';
        const isRunning = !isDone && !isFailed;
        const percent = job.progress?.percent ?? null;
        const stageLabel = job.progress?.stage
          ? t(STAGE_KEY[job.progress.stage])
          : t('activeExtractions.statusRunning');

        const open = () => {
          window.dispatchEvent(new CustomEvent(OPEN_RECIPE_EVENT, { detail: { jobId: job.id } }));
          dismissJob(job.id);
        };

        return (
          <div
            key={job.id}
            onClick={isDone ? open : undefined}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border overflow-hidden transition-all ${
              isDone
                ? 'cursor-pointer active:scale-[0.99] border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20'
                : isFailed
                  ? 'border-red-500/20 bg-red-50/70 dark:bg-red-950/20'
                  : 'border-black/5 dark:border-white/5 bg-white/60 dark:bg-gray-900/50'
            }`}
          >
            {/* Progress track (running only) */}
            {isRunning && percent !== null && (
              <div
                className="absolute inset-0 bg-emerald-500/10 origin-left transition-transform duration-500"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, percent / 100))})` }}
              />
            )}

            <div className={`relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
              isDone
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : isFailed
                  ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                  : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300'
            }`}>
              {isDone ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isFailed ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>

            <div className="relative min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {isDone
                  ? (job.title || t('activeExtractions.ready'))
                  : job.sourceLabel}
              </p>
              <p className={`text-[11px] leading-snug ${
                isFailed ? 'text-red-600 dark:text-red-400 whitespace-normal break-words' : 'text-gray-500 dark:text-gray-400 truncate'
              }`}>
                {isDone
                  ? t('activeExtractions.tapToOpen')
                  : isFailed
                    ? (resolveErrorCode(job.errorCode, job.errorParams ?? undefined, job.error, language) || t('error.default'))
                    : (percent !== null ? `${stageLabel} · ${Math.round(percent)}%` : stageLabel)}
              </p>
            </div>

            {isDone ? (
              <ChevronRight className="relative shrink-0 w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : isFailed ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); dismissJob(job.id); }}
                className="relative shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                aria-label={t('activeExtractions.dismiss')}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChefHat className="relative shrink-0 w-4 h-4 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}
