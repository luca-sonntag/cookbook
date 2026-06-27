import { useState } from 'react';
import { Button, Select, ListBox } from '@heroui/react';
import { LogOut, Globe, Moon, Sun, MonitorSmartphone, Thermometer, Scale } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { usePwaInstall } from '../hooks/usePwaInstall';

export default function SettingsView() {
  const { t, language, setLanguage } = useI18n();
  const { signOut, user, updateUserMetadata } = useAuth();
  const [theme, setTheme] = useTheme();
  const { isInstallable, handleInstallClick } = usePwaInstall();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const preferredTempUnit = user?.user_metadata?.preferred_temperature_unit || 'Celsius';
  const preferredUnitSystem = user?.user_metadata?.preferred_unit_system || 'metric';

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSaving(true);
    setSaveMessage(null);
    const { error } = await updateUserMetadata({ [key]: value });
    setIsSaving(false);
    if (error) {
      setSaveMessage(error);
    } else {
      setSaveMessage(t('app.settings.saved') || 'Settings saved!');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="px-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
          {t('app.nav.settings') || 'Settings'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </p>
      </div>

      {saveMessage && (
        <div className={`mx-2 px-4 py-2.5 text-xs text-center rounded-xl font-semibold border ${saveMessage === t('app.settings.saved')
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}>
          {saveMessage}
        </div>
      )}

      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Language Option */}
        <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('app.settings.language') || 'Language'}
              </p>
            </div>
          </div>
          <Select
            variant="secondary"
            size="sm"
            selectedKey={language}
            onSelectionChange={(key) => setLanguage(key as 'en' | 'de')}
            className="w-20"
            aria-label="Language"
          >
            <Select.Trigger className="h-8 min-h-0 py-0 px-2 text-xs font-semibold">
              <Select.Value />
              <Select.Indicator className="size-3" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="en" textValue="EN">
                  EN
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="de" textValue="DE">
                  DE
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Temperature Unit Option */}
        <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('app.settings.tempUnit') || 'Temperature Unit'}
              </p>
            </div>
          </div>
          <Select
            variant="secondary"
            size="sm"
            selectedKey={preferredTempUnit}
            onSelectionChange={(key) => handleUpdateSetting('preferred_temperature_unit', key as string)}
            isDisabled={isSaving}
            className="w-36"
            aria-label="Temperature Unit"
          >
            <Select.Trigger className="h-8 min-h-0 py-0 px-2 text-xs font-semibold">
              <Select.Value />
              <Select.Indicator className="size-3" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="Celsius" textValue={t('app.settings.tempUnitCelsius') || 'Celsius (°C)'}>
                  {t('app.settings.tempUnitCelsius') || 'Celsius (°C)'}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="Fahrenheit" textValue={t('app.settings.tempUnitFahrenheit') || 'Fahrenheit (°F)'}>
                  {t('app.settings.tempUnitFahrenheit') || 'Fahrenheit (°F)'}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="both" textValue={t('app.settings.tempUnitBoth') || 'Both (°C & °F)'}>
                  {t('app.settings.tempUnitBoth') || 'Both (°C & °F)'}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Unit System Option */}
        <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('app.settings.unitSystem') || 'Unit System'}
              </p>
            </div>
          </div>
          <Select
            variant="secondary"
            size="sm"
            selectedKey={preferredUnitSystem}
            onSelectionChange={(key) => handleUpdateSetting('preferred_unit_system', key as string)}
            isDisabled={isSaving}
            className="w-40"
            aria-label="Unit System"
          >
            <Select.Trigger className="h-8 min-h-0 py-0 px-2 text-xs font-semibold">
              <Select.Value />
              <Select.Indicator className="size-3" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="metric" textValue={t('app.settings.unitSystemMetric') || 'Metric (g, ml, kg)'}>
                  {t('app.settings.unitSystemMetric') || 'Metric (g, ml, kg)'}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="imperial" textValue={t('app.settings.unitSystemImperial') || 'Imperial (oz, cups, lbs)'}>
                  {t('app.settings.unitSystemImperial') || 'Imperial (oz, cups, lbs)'}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Theme Option */}
        <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('app.settings.theme') || 'Appearance'}
              </p>
            </div>
          </div>
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${theme === 'light'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${theme === 'dark'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

        {/* PWA Install Option (If applicable) */}
        {isInstallable && (
          <div className="p-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {t('app.installBanner.title') || 'Install App'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 text-white font-semibold text-xs px-4"
              onPress={handleInstallClick}
            >
              Install
            </Button>
          </div>
        )}

        {/* Logout Option */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('auth.signOut') || 'Sign Out'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger-soft"
            className="font-semibold text-xs"
            onPress={() => signOut()}
          >
            {t('auth.signOut') || 'Sign Out'}
          </Button>
        </div>
      </div>

      <div className="flex justify-center mt-4 mb-8">
        <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
          CookBuddy v1.0.0
        </p>
      </div>
    </div>
  );
}
