import { Button } from '@heroui/react';
import { ShoppingCart, Trash2, Folder } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface BulkActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onBulkAdd: () => void;
  onBulkDelete: () => void;
  onBulkAddToCollection: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onCancel,
  onBulkAdd,
  onBulkDelete,
  onBulkAddToCollection
}: BulkActionBarProps) {
  const { t, language } = useI18n();

  return (
    <div className="fixed bottom-[calc(1.5rem_+_var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg bg-white dark:bg-gray-900 border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl p-4 flex flex-col gap-2.5 animate-slide-up">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {t('catalog.itemsSelected', { count: selectedCount })}
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full mt-1">
        {/* Row 1: Abbrechen & Sammlung */}
        <div className="flex gap-2 w-full">
          <Button
            onPress={onCancel}
            className="flex-1 text-sm h-11 border-none bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/15 rounded-xl font-semibold active:scale-95 transition-all min-w-0"
          >
            <span className="truncate">{t('dialog.cancelDefault')}</span>
          </Button>

          <Button
            onPress={onBulkAddToCollection}
            isDisabled={selectedCount === 0}
            className="flex-1 bg-black/5 dark:bg-white/10 border-none text-gray-700 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/15 text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all min-w-0"
          >
            <Folder className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="truncate">{language === 'de' ? 'Sammlung' : 'Collection'}</span>
          </Button>
        </div>

        {/* Row 2: Einkaufsliste & Löschen */}
        <div className="flex gap-2 w-full">
          <Button
            onPress={onBulkAdd}
            isDisabled={selectedCount === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-none active:scale-95 transition-all min-w-0"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'de' ? 'Einkaufsliste' : 'Cart'}</span>
          </Button>

          <Button
            onPress={onBulkDelete}
            isDisabled={selectedCount === 0}
            className="flex-1 bg-rose-500 hover:bg-rose-400 text-white text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-none active:scale-95 transition-all min-w-0"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'de' ? 'Löschen' : 'Delete'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
