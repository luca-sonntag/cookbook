import { Card } from '@heroui/react';

// Skeleton placeholder shown while the saved recipes are being fetched,
// so the "empty catalog" message doesn't flash before data arrives.
export default function CatalogLoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" aria-busy="true" aria-label="Loading recipes">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="glass-panel rounded-2xl overflow-hidden border border-black/5 dark:border-white/5"
        >
          {/* Image placeholder */}
          <div className="w-full aspect-[4/3] bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="p-4 flex flex-col gap-3">
            {/* Title lines */}
            <div className="h-4 w-3/4 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
            {/* Meta row */}
            <div className="flex gap-2 mt-1">
              <div className="h-5 w-16 rounded-full bg-black/5 dark:bg-white/5 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-black/5 dark:bg-white/5 animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
