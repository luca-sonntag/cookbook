import { useState } from 'react';
import { Button } from '@heroui/react';
import { LogOut, Globe, Moon, Sun, MonitorSmartphone, ChevronDown, Thermometer, Scale } from 'lucide-react';
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
        <div className={`mx-2 px-4 py-2.5 text-xs text-center rounded-xl font-semibold border ${
          saveMessage === t('app.settings.saved')
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
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
              className="appearance-none bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg outline-none cursor-pointer text-center"
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
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
          <div className="relative">
            <select
              value={preferredTempUnit}
              onChange={(e) => handleUpdateSetting('preferred_temperature_unit', e.target.value)}
              className="appearance-none bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg outline-none cursor-pointer text-center"
              disabled={isSaving}
            >
              <option value="Celsius">{t('app.settings.tempUnitCelsius') || 'Celsius (°C)'}</option>
              <option value="Fahrenheit">{t('app.settings.tempUnitFahrenheit') || 'Fahrenheit (°F)'}</option>
              <option value="both">{t('app.settings.tempUnitBoth') || 'Both (°C & °F)'}</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
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
          <div className="relative">
            <select
              value={preferredUnitSystem}
              onChange={(e) => handleUpdateSetting('preferred_unit_system', e.target.value)}
              className="appearance-none bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg outline-none cursor-pointer text-center"
              disabled={isSaving}
            >
              <option value="metric">{t('app.settings.unitSystemMetric') || 'Metric (g, ml, kg)'}</option>
              <option value="imperial">{t('app.settings.unitSystemImperial') || 'Imperial (oz, cups, lbs)'}</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                theme === 'light' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                theme === 'dark' 
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
