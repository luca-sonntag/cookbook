import { Button } from '@heroui/react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface BulkActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onBulkAdd: () => void;
  onBulkDelete: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onCancel,
  onBulkAdd,
  onBulkDelete
}: BulkActionBarProps) {
  const { t, language } = useI18n();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border shadow-2xl rounded-2xl p-3 flex flex-col gap-2 animate-slide-up border-emerald-500/30">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {t('catalog.itemsSelected', { count: selectedCount })}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant="outline"
          onPress={onCancel}
          className="text-sm h-11 px-4 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-semibold active:scale-95 transition-all"
        >
          {t('dialog.cancelDefault')}
        </Button>

        <Button
          onPress={onBulkAdd}
          isDisabled={selectedCount === 0}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-11 px-4 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{language === 'de' ? 'Einkaufsliste' : 'Cart'}</span>
        </Button>

        <Button
          onPress={onBulkDelete}
          isDisabled={selectedCount === 0}
          className="bg-red-500 hover:bg-red-400 text-white text-sm h-11 px-4 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>{language === 'de' ? 'Löschen' : 'Delete'}</span>
        </Button>
      </div>
    </div>
  );
}
