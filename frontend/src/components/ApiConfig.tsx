import { Card, TextField, Label, Input, Button } from '@heroui/react';
import { useI18n } from '../context/I18nContext';

interface ApiConfigProps {
  apiKey: string;
  saveApiKey: (newKey: string) => void;
  setShowApiConfig: (show: boolean) => void;
}

export default function ApiConfig({ apiKey, saveApiKey, setShowApiConfig }: ApiConfigProps) {
  const { t } = useI18n();
  return (
    <Card className="glass-panel p-5 rounded-2xl">
      <Card.Header className="p-0 pb-3 flex justify-between items-center border-b border-black/5 dark:border-white/5">
        <Card.Title className="text-sm font-semibold text-gray-950 dark:text-white">{t('api.title')}</Card.Title>
      </Card.Header>
      <Card.Content className="p-0 pt-4 flex flex-col gap-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('api.desc')}
        </p>
        <TextField fullWidth name="apiKey" value={apiKey} onChange={saveApiKey}>
          <Label className="text-xs text-gray-500 dark:text-gray-400">{t('api.keyLabel')}</Label>
          <Input 
            type="password"
            placeholder={t('api.keyPlaceholder')} 
            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
          />
        </TextField>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" className="text-xs" onPress={() => setShowApiConfig(false)}>
            {t('api.close')}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

