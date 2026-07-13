import { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Card, CardBody, Input, Switch, Button, Spinner } from '@heroui/react';
import { Shield, ArrowLeft, Save, MessageSquare, Settings, AlertCircle, Bug, Lightbulb, X, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api';
import { useI18n } from '../context/I18nContext';

interface GlobalSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

interface FeedbackItem {
  id: string;
  type: 'bug' | 'idea';
  message: string;
  context: any;
  screenshot_urls: string[] | null;
  created_at: string;
}

interface AdminViewProps {
  onBack: () => void;
}

export default function AdminView({ onBack }: AdminViewProps) {
  const { getAccessToken } = useAuth();
  const { language } = useI18n();

  const [activeTab, setActiveTab] = useState<'settings' | 'feedback'>('settings');
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isDe = language === 'de';

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl('/api/admin/settings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        const mapped = data.settings.reduce((acc: Record<string, string>, curr: GlobalSetting) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        setLocalSettings(mapped);
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (err: any) {
      console.error(err);
      setError(isDe ? 'Einstellungen konnten nicht geladen werden.' : 'Failed to load settings.');
    }
  }, [getAccessToken, isDe]);

  const fetchFeedback = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl('/api/admin/feedback'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(data.feedback);
      } else {
        throw new Error(data.error || 'Failed to fetch feedback');
      }
    } catch (err: any) {
      console.error(err);
      setError(isDe ? 'Feedback konnte nicht geladen werden.' : 'Failed to load feedback.');
    }
  }, [getAccessToken, isDe]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'settings') {
      await fetchSettings();
    } else {
      await fetchFeedback();
    }
    setLoading(false);
  }, [activeTab, fetchSettings, fetchFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: localSettings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(isDe ? 'Einstellungen gespeichert!' : 'Settings saved successfully!');
        await fetchSettings();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error(err);
      setError(isDe ? 'Speichern fehlgeschlagen.' : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleFeedbackExpand = (id: string) => {
    setExpandedFeedbackId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(isDe ? 'de-DE' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out font-sans pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3 px-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Administration
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">
            {isDe ? 'Admin-Bereich' : 'Admin Panel'}
          </h2>
        </div>
      </div>

      {/* Tabs Switch */}
      <div className="mx-2">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            setError(null);
            setActiveTab(key as 'settings' | 'feedback');
          }}
          className="w-full"
          variant="solid"
          color="emerald"
        >
          <Tab
            key="settings"
            title={
              <div className="flex items-center gap-2 font-semibold">
                <Settings className="w-4 h-4" />
                <span>{isDe ? 'Einstellungen' : 'Settings'}</span>
              </div>
            }
          />
          <Tab
            key="feedback"
            title={
              <div className="flex items-center gap-2 font-semibold">
                <MessageSquare className="w-4 h-4" />
                <span>Feedback</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Alert / Notification Area */}
      {error && (
        <div className="mx-2 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mx-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-start gap-3">
          <Shield className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Data loading spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner color="emerald" label={isDe ? 'Lade Daten...' : 'Loading data...'} size="lg" />
        </div>
      ) : (
        <>
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 mx-2">
              <Card className="border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 rounded-3xl shadow-sm">
                <CardBody className="p-5 flex flex-col gap-5">
                  {settings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {isDe ? 'Keine Einstellungen vorhanden.' : 'No settings available.'}
                    </p>
                  ) : (
                    settings.map((setting) => {
                      const isBoolean = setting.value === 'true' || setting.value === 'false';
                      const isNumber = !isBoolean && !isNaN(Number(setting.value));
                      const currentValue = localSettings[setting.key] ?? setting.value;

                      return (
                        <div key={setting.key} className="flex flex-col gap-2 pb-4 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {setting.key}
                            </label>
                            {isBoolean ? (
                              <Switch
                                isSelected={currentValue === 'true'}
                                onValueChange={(checked) => handleSettingChange(setting.key, checked ? 'true' : 'false')}
                                color="emerald"
                                size="sm"
                                aria-label={setting.key}
                              />
                            ) : null}
                          </div>

                          {setting.description && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                              {setting.description}
                            </span>
                          )}

                          {!isBoolean && (
                            <Input
                              type={isNumber ? 'number' : 'text'}
                              value={currentValue}
                              onValueChange={(val) => handleSettingChange(setting.key, val)}
                              className="w-full"
                              size="sm"
                              variant="bordered"
                              color="emerald"
                              aria-label={setting.key}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>

              {settings.length > 0 && (
                <Button
                  onPress={handleSaveSettings}
                  isLoading={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-12 rounded-2xl shadow-lg shadow-emerald-600/10 active:scale-95 transition-all w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isDe ? 'Änderungen speichern' : 'Save Changes'}
                </Button>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="flex flex-col gap-4 mx-2">
              {feedback.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
                  {isDe ? 'Bisher kein Feedback eingegangen.' : 'No feedback submissions received yet.'}
                </p>
              ) : (
                feedback.map((item) => {
                  const isBug = item.type === 'bug';
                  const email = item.context?.email || (isDe ? 'Unbekannter Benutzer' : 'Unknown User');
                  const isExpanded = expandedFeedbackId === item.id;

                  return (
                    <Card key={item.id} className="border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden">
                      <CardBody className="p-5 flex flex-col gap-3">
                        {/* Feed Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              {isBug ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                  <Bug className="w-3 h-3 text-rose-500" />
                                  Bug
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20 uppercase tracking-wider">
                                  <Lightbulb className="w-3 h-3 text-teal-500" />
                                  Idea
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-mono">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {email}
                            </span>
                          </div>
                        </div>

                        {/* Feedback Message */}
                        <div className="p-3.5 bg-gray-50 dark:bg-gray-950 border border-black/5 dark:border-white/5 rounded-2xl">
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {item.message}
                          </p>
                        </div>

                        {/* Screenshots Carousel */}
                        {item.screenshot_urls && item.screenshot_urls.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              {isDe ? 'Screenshots / Anhänge:' : 'Screenshots / Attachments:'}
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                              {item.screenshot_urls.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setLightboxImage(url)}
                                  className="w-16 h-16 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden shrink-0 active:scale-95 hover:brightness-95 transition-all cursor-pointer bg-gray-100 dark:bg-gray-800"
                                >
                                  <img src={url} alt={`Screenshot ${idx}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Diagnostics Context */}
                        {item.context && (
                          <div className="mt-1">
                            <button
                              onClick={() => toggleFeedbackExpand(item.id)}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer outline-none"
                            >
                              <span>
                                {isExpanded 
                                  ? (isDe ? 'Details ausblenden' : 'Hide Details') 
                                  : (isDe ? 'Geräte- & Diagnosedaten anzeigen' : 'Show Device & Diagnostic Data')
                                }
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2.5 font-mono text-[10px] text-gray-600 dark:text-gray-400 overflow-x-auto animate-in fade-in duration-200">
                                <div>
                                  <span className="font-bold text-gray-400">{isDe ? 'Plattform' : 'Platform'}:</span> {item.context.platform} ({item.context.isNative ? 'Native' : 'Web'})
                                </div>
                                <div>
                                  <span className="font-bold text-gray-400">{isDe ? 'App-Version' : 'App Version'}:</span> v{item.context.appVersion} (Build {item.context.appBuild})
                                </div>
                                <div>
                                  <span className="font-bold text-gray-400">{isDe ? 'Maßsystem / Einheit' : 'Language / Tier'}:</span> lang: {item.context.language} | tier: {item.context.tier}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-400">Viewport:</span> {item.context.viewport}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-400">Route:</span> {item.context.route}
                                </div>
                                <div className="break-all whitespace-pre-wrap max-w-full">
                                  <span className="font-bold text-gray-400">User Agent:</span> {item.context.userAgent}
                                </div>

                                {/* Recent Logs section */}
                                {item.context.logs && item.context.logs.length > 0 && (
                                  <div className="mt-2 border-t border-black/5 dark:border-white/5 pt-2 flex flex-col gap-1.5">
                                    <div className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 text-[9px] mb-1">
                                      <Terminal className="w-3.5 h-3.5" />
                                      {isDe ? 'Konsolen-Protokoll:' : 'Console Logs:'}
                                    </div>
                                    <div className="max-h-48 overflow-y-auto bg-black text-gray-300 p-2.5 rounded-xl text-[9px] leading-tight space-y-1 font-mono">
                                      {item.context.logs.map((log: any, idx: number) => {
                                        const isErrLog = log.level === 'error' || log.level === 'warn';
                                        return (
                                          <div key={idx} className={isErrLog ? 'text-rose-400' : 'text-emerald-400'}>
                                            <span className="text-gray-500 font-semibold">[{log.level.toUpperCase()}]</span> {log.message}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Lightbox for screenshots */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Feedback Enlarged Attachment"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
