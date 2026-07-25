import { Folder } from 'lucide-react';
import type { Collection, Job } from '../../types';
import CachedImage from '../CachedImage';
import { useI18n } from '../../context/I18nContext';

interface CollectionTileProps {
  collection: Collection;
  /** Members of this collection, newest first — the first four form the cover. */
  jobs: Job[];
  onClick: () => void;
}

/**
 * Collection tile with a cover built from its recipes: a 2x2 mosaic once the
 * collection holds four or more recipes, a single full-bleed image below that,
 * and the collection emoji on a gradient while it is still empty.
 */
export default function CollectionTile({ collection, jobs, onClick }: CollectionTileProps) {
  const { t } = useI18n();
  const covers = jobs.slice(0, 4);
  const emoji = collection.emoji || null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[6.5rem] shrink-0 flex flex-col gap-1.5 text-left active:scale-[0.97] transition-transform cursor-pointer"
    >
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10">
        {covers.length >= 4 ? (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-px">
            {covers.map(job => (
              <CachedImage
                key={job.id}
                src={job.recipe?.imageUrl}
                emoji={job.recipe?.emoji}
                alt=""
                className="w-full h-full object-cover object-center pointer-events-none select-none"
              />
            ))}
          </div>
        ) : covers.length > 0 ? (
          <CachedImage
            src={covers[0].recipe?.imageUrl}
            emoji={covers[0].recipe?.emoji}
            alt=""
            className="w-full h-full object-cover object-center pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {emoji ? (
              <span className="text-3xl select-none" role="img" aria-hidden="true">{emoji}</span>
            ) : (
              <Folder className="w-7 h-7 text-emerald-500/40" />
            )}
          </div>
        )}

        {/* Emoji chip so the collection stays recognisable over the mosaic */}
        {emoji && covers.length > 0 && (
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-lg bg-black/55 backdrop-blur-sm border border-white/15 flex items-center justify-center text-sm select-none">
            {emoji}
          </span>
        )}
      </div>

      <div className="flex flex-col px-0.5">
        <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
          {collection.name}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {t('catalog.recipeCount', { count: jobs.length })}
        </span>
      </div>
    </button>
  );
}
