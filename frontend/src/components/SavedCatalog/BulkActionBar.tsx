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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border shadow-2xl rounded-2xl p-3 flex flex-col gap-2 animate-slide-up border-emerald-500/30">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {t('catalog.itemsSelected', { count: selectedCount })}
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full mt-1">
        {/* Row 1: Abbrechen & Sammlung */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onPress={onCancel}
            className="flex-1 text-sm h-11 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-semibold active:scale-95 transition-all min-w-0"
          >
            <span className="truncate">{t('dialog.cancelDefault')}</span>
          </Button>

          <Button
            onPress={onBulkAddToCollection}
            isDisabled={selectedCount === 0}
            className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all min-w-0"
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all min-w-0"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'de' ? 'Einkaufsliste' : 'Cart'}</span>
          </Button>

          <Button
            onPress={onBulkDelete}
            isDisabled={selectedCount === 0}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95 transition-all min-w-0"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{language === 'de' ? 'Löschen' : 'Delete'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
