import { useState, useEffect, useCallback } from 'react';
import { Tabs, Card, TextField, Label, Input, Button, Spinner } from '@heroui/react';
import { Shield, ArrowLeft, Save, MessageSquare, Settings, AlertCircle, Bug, Lightbulb, X, Terminal, BarChart3, Users, BookOpen, TrendingUp, Coins, HardDriveDownload } from 'lucide-react';
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

/** Format a download size given in megabytes into a compact human string (MB → GB). */
function formatDownloadSize(mb: number): string {
  if (!mb || mb <= 0) return '0 MB';
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

export default function AdminView({ onBack }: AdminViewProps) {
  const { getAccessToken } = useAuth();
  const { language } = useI18n();

  const [activeTab, setActiveTab] = useState<'settings' | 'feedback' | 'metrics' | 'users'>('settings');
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [metricsRange, setMetricsRange] = useState<'all' | 'today' | '3d' | '7d' | '30d'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [usersRange, setUsersRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isDe = language === 'de';

  const rangeLabel: Record<'all' | 'today' | '3d' | '7d' | '30d', string> = {
    all: isDe ? 'Gesamt' : 'All time',
    today: isDe ? 'Heute' : 'Today',
    '3d': isDe ? 'Letzte 3 Tage' : 'Last 3 days',
    '7d': isDe ? 'Letzte 7 Tage' : 'Last 7 days',
    '30d': isDe ? 'Letzte 30 Tage' : 'Last 30 days',
  };

  // Filter the (already-fetched) user list by registration date. Done
  // client-side since the users tab loads the full list in one request.
  const filteredUsers = (() => {
    if (usersRange === 'all') return users;
    const days = usersRange === 'today' ? 1 : usersRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return users.filter((u: any) => u.created_at && new Date(u.created_at) >= cutoff);
  })();

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

  const fetchMetrics = useCallback(async (range: string) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl(`/api/admin/metrics?range=${range}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data);
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      console.error(err);
      setError(isDe ? 'Metriken konnten nicht geladen werden.' : 'Failed to load metrics.');
    }
  }, [getAccessToken, isDe]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl('/api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error(err);
      setError(isDe ? 'Nutzer konnten nicht geladen werden.' : 'Failed to load users.');
    }
  }, [getAccessToken, isDe]);

  const loadData = useCallback(async () => {
    // The metrics tab manages its own loading via `metricsLoading` (see effect
    // below) so that changing the range filter refreshes only the chart area
    // instead of blanking the whole panel.
    if (activeTab === 'metrics') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    if (activeTab === 'settings') {
      await fetchSettings();
    } else if (activeTab === 'feedback') {
      await fetchFeedback();
    } else if (activeTab === 'users') {
      await fetchUsers();
    }
    setLoading(false);
  }, [activeTab, fetchSettings, fetchFeedback, fetchUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch metrics whenever the metrics tab is active and the selected range
  // changes. Keeps tabs + range filter visible; only the content area spins.
  useEffect(() => {
    if (activeTab !== 'metrics') return;
    let cancelled = false;
    setMetricsLoading(true);
    setError(null);
    fetchMetrics(metricsRange).finally(() => {
      if (!cancelled) setMetricsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, metricsRange, fetchMetrics]);

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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 font-sans pb-12">
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
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner color="success" size="lg" />
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {isDe ? 'Lade Daten...' : 'Loading data...'}
          </span>
        </div>
      </div>
    );
  }

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
        <Tabs selectedKey={activeTab} onSelectionChange={(key) => { setError(null); setActiveTab(key as 'settings' | 'feedback' | 'metrics' | 'users'); }} className="w-full">
          <Tabs.ListContainer className="w-full">
            <Tabs.List className="flex w-full mb-4 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
              {(
                [
                  { id: 'settings', icon: <Settings className="w-4 h-4" />, label: isDe ? 'Config' : 'Config' },
                  { id: 'feedback', icon: <MessageSquare className="w-4 h-4" />, label: 'Feedback' },
                  { id: 'metrics', icon: <BarChart3 className="w-4 h-4" />, label: isDe ? 'Metriken' : 'Metrics' },
                  { id: 'users', icon: <Users className="w-4 h-4" />, label: isDe ? 'Nutzer' : 'Users' },
                ] as const
              ).map(({ id, icon, label }) => (
                <Tabs.Tab
                  key={id}
                  id={id}
                  className="flex-1 px-1 py-2 text-center font-semibold transition-all cursor-pointer rounded-lg !text-gray-500 dark:!text-gray-400 data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-800 data-[selected=true]:!text-emerald-600 dark:data-[selected=true]:!text-emerald-400 hover:!text-gray-900 dark:hover:!text-white"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    {icon}
                    <span className="text-[10px] leading-none">{label}</span>
                  </div>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>

          {/* Alert / Notification Area */}
          {error && (
            <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">{successMessage}</span>
            </div>
          )}

          <Tabs.Panel id="settings">
            <div className="flex flex-col gap-6">
              <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-5">
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
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-sm font-bold text-gray-850 dark:text-gray-200">
                                {setting.key}
                              </label>
                              {setting.description && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                                  {setting.description}
                                </span>
                              )}
                            </div>

                            {isBoolean && (
                              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange(setting.key, 'true')}
                                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${currentValue === 'true'
                                      ? 'bg-white dark:bg-gray-850 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                  {isDe ? 'Ja' : 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange(setting.key, 'false')}
                                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${currentValue === 'false'
                                      ? 'bg-white dark:bg-gray-855 text-gray-700 dark:text-gray-300 shadow-sm'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                  {isDe ? 'Nein' : 'No'}
                                </button>
                              </div>
                            )}
                          </div>

                          {!isBoolean && (
                            <TextField
                              fullWidth
                              name={setting.key}
                              value={currentValue}
                              onChange={(val) => handleSettingChange(setting.key, val)}
                            >
                              <Label className="sr-only">{setting.key}</Label>
                              <Input
                                type={isNumber ? 'number' : 'text'}
                                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                aria-label={setting.key}
                              />
                            </TextField>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {settings.length > 0 && (
                <Button
                  type="button"
                  isDisabled={saving}
                  onPress={handleSaveSettings}
                  className={`py-3.5 h-12 text-sm rounded-2xl font-semibold shadow-md shadow-emerald-600/20 text-white ${saving
                      ? 'bg-emerald-800 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer'
                    } w-full`}
                >
                  <span className="flex items-center gap-2 justify-center">
                    {saving ? (
                      <>
                        <Spinner color="current" size="sm" />
                        <span>{isDe ? 'Wird gespeichert...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isDe ? 'Änderungen speichern' : 'Save Changes'}</span>
                      </>
                    )}
                  </span>
                </Button>
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel id="feedback">
            <div className="flex flex-col gap-4">
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
                    <Card key={item.id} className="border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 flex flex-col gap-3">
                        {/* Feed Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                  type="button"
                                  onClick={() => setLightboxImage(url)}
                                  className="w-16 h-16 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden shrink-0 active:scale-95 hover:brightness-95 transition-all cursor-pointer bg-gray-100 dark:bg-gray-800 bg-none border-none outline-none"
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
                              type="button"
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
                                            <span className="text-gray-500 font-semibold">[{log.level.toUpperCase()}]</span> {log.text}
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
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel id="metrics">
            <div className="flex flex-col gap-6">
              {/* Time range filter */}
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                {(
                  [
                    { id: 'all', label: isDe ? 'Alle' : 'All' },
                    { id: 'today', label: isDe ? 'Heute' : 'Today' },
                    { id: '3d', label: isDe ? '3 Tage' : 'Last 3 days' },
                    { id: '7d', label: isDe ? '7 Tage' : 'Last 7 days' },
                    { id: '30d', label: isDe ? '30 Tage' : 'Last 30 days' },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMetricsRange(id)}
                    className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${metricsRange === id
                        ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {metricsLoading && !metrics ? (
                <div className="flex justify-center py-16">
                  <Spinner color="success" size="md" />
                </div>
              ) : metrics ? (
              <div className={`flex flex-col gap-6 transition-opacity ${metricsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* 1. Top Level Metrics Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card
                    className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-2 cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all active:scale-95"
                    onClick={() => { setError(null); setActiveTab('users'); }}
                  >
                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {metricsRange === 'all' ? (isDe ? 'Nutzer' : 'Users') : (isDe ? 'Neue Nutzer' : 'New Users')}
                      </span>
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        {metricsRange === 'all' ? (metrics.users?.total ?? 0) : (metrics.users?.newInRange ?? 0)}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {metricsRange === 'all'
                          ? (isDe ? 'Registriert → Nutzer' : 'Registered → Users')
                          : (isDe ? `Neu · ${rangeLabel[metricsRange]}` : `New · ${rangeLabel[metricsRange]}`)}
                      </span>
                    </div>
                  </Card>

                  <Card className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isDe ? 'Rezepte' : 'Recipes'}</span>
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        {metrics.jobs?.total ?? 0}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{isDe ? 'Extraktionen' : 'Extractions'}</span>
                    </div>
                  </Card>

                  <Card className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isDe ? 'LLM Kosten' : 'LLM Costs'}</span>
                      <Coins className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        ${metrics.llm?.totalCostUsd?.toFixed(4) ?? '0.0000'}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{rangeLabel[metricsRange]}</span>
                    </div>
                  </Card>

                  <Card className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isDe ? 'Anfragen' : 'Requests'}</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        {metrics.llm?.count ?? 0}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Gemini Calls</span>
                    </div>
                  </Card>

                  <Card className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isDe ? 'Medien-Download' : 'Media Download'}</span>
                      <HardDriveDownload className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        {formatDownloadSize(metrics.jobs?.mediaMb ?? 0)}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {isDe ? `Heruntergeladen · ${rangeLabel[metricsRange]}` : `Downloaded · ${rangeLabel[metricsRange]}`}
                      </span>
                    </div>
                  </Card>
                </div>

                {/* 2. Job Status Queue breakdown card */}
                <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    Queue Status Breakdown
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/15 rounded-xl p-2.5 flex flex-col">
                      <span className="text-[10px] leading-tight text-emerald-500 dark:text-emerald-400/80 font-semibold truncate">{isDe ? 'Erfolgreich' : 'Succeeded'}</span>
                      <span className="text-lg font-bold text-emerald-500 dark:text-emerald-300 mt-0.5">{metrics.jobs?.completed ?? 0}</span>
                    </div>
                    <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/15 rounded-xl p-2.5 flex flex-col">
                      <span className="text-[10px] leading-tight text-rose-400 dark:text-rose-400/80 font-semibold truncate">{isDe ? 'Fehlgeschlagen' : 'Failed'}</span>
                      <span className="text-lg font-bold text-rose-500 dark:text-rose-300 mt-0.5">{metrics.jobs?.failed ?? 0}</span>
                    </div>
                    <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/15 rounded-xl p-2.5 flex flex-col">
                      <span className="text-[10px] leading-tight text-blue-400 dark:text-blue-400/80 font-semibold truncate">{isDe ? 'Aktiv' : 'Processing'}</span>
                      <span className="text-lg font-bold text-blue-500 dark:text-blue-300 mt-0.5">{metrics.jobs?.processing ?? 0}</span>
                    </div>
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/15 rounded-xl p-2.5 flex flex-col">
                      <span className="text-[10px] leading-tight text-amber-500 dark:text-amber-400/80 font-semibold truncate">{isDe ? 'Wartend' : 'Pending'}</span>
                      <span className="text-lg font-bold text-amber-500 dark:text-amber-300 mt-0.5">{metrics.jobs?.pending ?? 0}</span>
                    </div>
                  </div>
                </Card>

                {/* 3. LLM Breakdown Table */}
                <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-4 overflow-hidden">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                    {isDe ? 'LLM Kosten nach Funktion' : 'LLM Costs by Function'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-550 dark:text-gray-400 border-collapse">
                      <thead>
                        <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                          <th className="pb-2.5 font-bold">{isDe ? 'Funktion' : 'Function'}</th>
                          <th className="pb-2.5 text-right font-bold">{isDe ? 'Anfragen' : 'Requests'}</th>
                          <th className="pb-2.5 text-right font-bold">Tokens</th>
                          <th className="pb-2.5 text-right font-bold">{isDe ? 'Kosten (USD)' : 'Costs (USD)'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5 font-semibold">
                        {Object.entries(metrics.llm?.breakdown || {}).map(([key, value]: [string, any]) => (
                          <tr key={key} className="text-gray-800 dark:text-gray-200">
                            <td className="py-2.5 font-mono text-[11px] text-gray-500 dark:text-gray-450">{key}</td>
                            <td className="py-2.5 text-right">{value.count}</td>
                            <td className="py-2.5 text-right font-mono">{value.tokens.toLocaleString()}</td>
                            <td className="py-2.5 text-right font-mono text-amber-600 dark:text-amber-450">${value.cost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* 4. Daily stats list acting as elegant visual bar-charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Daily Extractions */}
                  <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                      {isDe ? 'Extraktionen' : 'Extractions'} ({rangeLabel[metricsRange]})
                    </h3>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                      {metrics.jobs?.dailyStats?.map((stat: any) => {
                        const maxCount = Math.max(...metrics.jobs.dailyStats.map((s: any) => s.count), 1);
                        const pct = (stat.count / maxCount) * 100;
                        return (
                          <div key={stat.date} className="flex items-center gap-3 text-[11px]">
                            <span className="w-20 text-gray-400 dark:text-gray-500 font-mono shrink-0">{stat.date.slice(5)}</span>
                            <div className="flex-1 bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 dark:bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-right font-bold text-gray-800 dark:text-white shrink-0">{stat.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Daily Costs */}
                  <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                      {isDe ? 'Gemini Kosten' : 'Gemini Costs'} ({rangeLabel[metricsRange]})
                    </h3>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                      {metrics.llm?.dailyCost?.filter((stat: any) => stat.cost > 0).map((stat: any) => {
                        const maxCost = Math.max(...metrics.llm.dailyCost.map((s: any) => s.cost), 0.0001);
                        const pct = (stat.cost / maxCost) * 100;
                        return (
                          <div key={stat.date} className="flex items-center gap-3 text-[11px]">
                            <span className="w-20 text-gray-400 dark:text-gray-500 font-mono shrink-0">{stat.date.slice(5)}</span>
                            <div className="flex-1 bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 dark:bg-amber-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-bold text-amber-600 dark:text-amber-450 shrink-0 font-mono">${stat.cost.toFixed(4)}</span>
                          </div>
                        );
                      })}
                      {metrics.llm?.dailyCost?.filter((stat: any) => stat.cost > 0).length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-12">
                          {isDe ? 'Keine Kosten im Zeitraum.' : 'No cost data in timeframe.'}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* 5. Extracted recipes per user (only users with >0 in range) */}
                <Card className="glass-panel p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                    {isDe ? 'Extrahierte Rezepte pro Nutzer' : 'Extracted Recipes per User'} ({rangeLabel[metricsRange]})
                  </h3>
                  {metrics.extractionsPerUser?.length ? (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                      {metrics.extractionsPerUser.map((entry: any) => {
                        const maxCount = Math.max(
                          ...metrics.extractionsPerUser.map((e: any) => e.count),
                          1,
                        );
                        const pct = (entry.count / maxCount) * 100;
                        return (
                          <div key={entry.userId} className="flex items-center gap-3 text-[11px]">
                            <span className="w-40 truncate text-gray-500 dark:text-gray-400 font-medium shrink-0" title={entry.email || entry.userId}>
                              {entry.email || entry.userId}
                            </span>
                            <div className="flex-1 bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 dark:bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-right font-bold text-gray-800 dark:text-white shrink-0">{entry.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-12">
                      {isDe ? 'Keine Extraktionen im Zeitraum.' : 'No extractions in timeframe.'}
                    </p>
                  )}
                </Card>
              </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
                  {isDe ? 'Keine Metriken verfügbar.' : 'No metrics available.'}
                </p>
              )}
            </div>
          </Tabs.Panel>

          {/* === USERS PANEL === */}
          <Tabs.Panel id="users" className="outline-none">
            {users.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Time range filter */}
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                  {(
                    [
                      { id: 'all', label: isDe ? 'Alle' : 'All' },
                      { id: 'today', label: isDe ? 'Heute' : 'Today' },
                      { id: '7d', label: isDe ? '7 Tage' : 'Last 7 days' },
                      { id: '30d', label: isDe ? '30 Tage' : 'Last 30 days' },
                    ] as const
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setUsersRange(id)}
                      className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${usersRange === id
                          ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {filteredUsers.length}{' '}
                    {usersRange === 'all'
                      ? (isDe ? 'registrierte Nutzer' : 'registered users')
                      : (isDe ? 'neue Nutzer' : 'new users')}
                  </p>
                </div>

                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
                    {isDe ? 'Keine neuen Nutzer im Zeitraum.' : 'No new users in this timeframe.'}
                  </p>
                ) : (
                /* User cards */
                <div className="flex flex-col gap-3">
                  {filteredUsers.map((user: any) => {
                    const tierColor =
                      user.tier === 'premium'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : user.tier === 'alpha'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

                    const fmt = (iso: string | null) => {
                      if (!iso) return '—';
                      const d = new Date(iso);
                      return d.toLocaleDateString(isDe ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                    };

                    return (
                      <Card key={user.id} className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-gray-900">
                        <div className="flex items-start gap-3">
                          {/* Avatar circle */}
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Email + tier badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {user.email}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${tierColor}`}>
                                {user.tier}
                              </span>
                              {user.custom_limit !== null && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                  limit: {user.custom_limit === -1 ? '∞' : user.custom_limit}
                                </span>
                              )}
                            </div>

                            {/* Dates */}
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                              <span>
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{isDe ? 'Registriert:' : 'Joined:'}</span>{' '}
                                {fmt(user.created_at)}
                              </span>
                              <span>
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{isDe ? 'Letzter Login:' : 'Last login:'}</span>{' '}
                                {fmt(user.last_sign_in_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                )}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="md" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
                {isDe ? 'Keine Nutzer gefunden.' : 'No users found.'}
              </p>
            )}
          </Tabs.Panel>
        </Tabs>
      </div>

      {/* Lightbox for screenshots */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border-none outline-none"
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
