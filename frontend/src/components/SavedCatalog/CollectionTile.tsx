import type { Collection, Job } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface CollectionTileProps {
  collection: Collection;
  /** Members of this collection, newest first — the first four provide the emojis. */
  jobs: Job[];
  onClick: () => void;
}

const DEFAULT_EMOJIS = ['🍕', '🧀', '🍔', '🍝'];

/**
 * Collection tile displaying a 2x2 emoji mosaic over a uniform gradient background
 * derived from the collection's recipes, and the collection badge emoji at the bottom left.
 */
export default function CollectionTile({ collection, jobs, onClick }: CollectionTileProps) {
  const { t } = useI18n();
  const collectionEmoji = collection.emoji || null;

  // Gather first 4 emojis from collection recipes, fallback to standard food emojis if fewer than 4
  const displayEmojis = jobs.slice(0, 4).map((j, i) => j.recipe?.emoji || DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length]);
  while (displayEmojis.length < 4) {
    displayEmojis.push(DEFAULT_EMOJIS[displayEmojis.length % DEFAULT_EMOJIS.length]);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[6.5rem] shrink-0 flex flex-col gap-1.5 text-left active:scale-[0.97] transition-transform cursor-pointer group"
    >
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {displayEmojis.map((em, idx) => (
            <div
              key={idx}
              className="w-full h-full flex items-center justify-center"
            >
              <span className="text-2xl select-none transition-transform group-hover:scale-110 duration-200" role="img" aria-hidden="true">
                {em}
              </span>
            </div>
          ))}
        </div>

        {/* Collection badge emoji in bottom-left */}
        {collectionEmoji && (
          <span className="absolute bottom-1 left-1 w-6 h-6 rounded-lg bg-black/60 dark:bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs select-none shadow-sm">
            {collectionEmoji}
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

