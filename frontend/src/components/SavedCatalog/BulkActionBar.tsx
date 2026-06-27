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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-slide-up border-emerald-500/30">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {t('catalog.itemsSelected', { count: selectedCount })}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onPress={onCancel}
          className="text-xs border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-semibold"
        >
          {t('dialog.cancelDefault')}
        </Button>

        <Button
          size="sm"
          onPress={onBulkAdd}
          isDisabled={selectedCount === 0}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{language === 'de' ? 'Einkaufsliste' : 'Cart'}</span>
        </Button>

        <Button
          size="sm"
          onPress={onBulkDelete}
          isDisabled={selectedCount === 0}
          className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/10 active:scale-95 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'de' ? 'Löschen' : 'Delete'}</span>
        </Button>
      </div>
    </div>
  );
}
