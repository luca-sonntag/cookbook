import { Card } from '@heroui/react';
import { Utensils } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function CatalogEmptyState() {
  const { t } = useI18n();

  return (
    <Card className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
      <Utensils className="w-8 h-8 text-gray-500 mb-3 animate-pulse-slow" />
      <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{t('catalog.emptyTitle')}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-normal">
        {t('catalog.emptyDesc')}
      </p>
    </Card>
  );
}
