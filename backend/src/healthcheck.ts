import { getClient, checkDbHealth, getGlobalSetting, updateGlobalSettings } from './db.js';
import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApifyClient } from 'apify-client';

interface ServiceStatus {
  status: 'up' | 'down';
  lastChecked: string;
  lastChanged: string;
  error?: string;
}

interface HealthCheckState {
  [serviceName: string]: ServiceStatus;
}

/**
 * Sends a notification via ntfy.sh and/or Telegram Bot when configured.
 */
async function sendNotification(message: string, isDown: boolean, serviceName: string) {
  const promises: Promise<any>[] = [];

  // 1. ntfy.sh notification
  if (config.NTFY_TOPIC) {
    const title = isDown ? `🔴 Service Alert: ${serviceName} is DOWN` : `🟢 Service Recovery: ${serviceName} is UP`;
    const priority = isDown ? 'high' : 'default';
    const tags = isDown ? 'warning,skull' : 'white_check_mark,partying_face';

    promises.push(
      fetch(`https://ntfy.sh/${config.NTFY_TOPIC}`, {
        method: 'POST',
        body: message,
        headers: {
          'Title': title,
          'Priority': priority,
          'Tags': tags,
        },
      }).then(res => {
        if (!res.ok) console.error(`[healthcheck] ntfy alert failed with status ${res.status}`);
      }).catch(err => {
        console.error('[healthcheck] ntfy alert network error:', err.message || err);
      })
    );
  }

  // 2. Telegram Bot notification
  if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID) {
    const formattedText = isDown
      ? `🔴 <b>[Cookbook Alert]</b> Service <b>${serviceName}</b> is <b>DOWN</b>!\n\nReason: <code>${message}</code>\nTime: <code>${new Date().toISOString()}</code>`
      : `🟢 <b>[Cookbook Alert]</b> Service <b>${serviceName}</b> is back <b>UP</b>!\n\nTime: <code>${new Date().toISOString()}</code>`;

    promises.push(
      fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.TELEGRAM_CHAT_ID,
          text: formattedText,
          parse_mode: 'HTML',
        }),
      }).then(res => {
        if (!res.ok) console.error(`[healthcheck] Telegram alert failed with status ${res.status}`);
      }).catch(err => {
        console.error('[healthcheck] Telegram alert network error:', err.message || err);
      })
    );
  }

  await Promise.all(promises);
}

/**
 * Runs health checks for all enabled services and notifies on state transitions.
 * @param isStandalone If true, runs from CLI and tests backend via public URL; otherwise tests DB directly.
 */
export async function runHealthChecks(isStandalone = false): Promise<HealthCheckState> {
  console.log(`[healthcheck] Starting health checks (standalone=${isStandalone})...`);

  // Load previous states from persistent database global settings
  let lastStates: HealthCheckState = {};
  try {
    const stateStr = await getGlobalSetting<string>('health_check_status', '{}');
    lastStates = JSON.parse(stateStr);
  } catch (err: any) {
    console.warn('[healthcheck] Could not load health check state from DB, using empty state:', err.message);
  }

  const checks = [
    {
      name: 'backend',
      isEnabled: isStandalone ? !!config.HEALTHCHECK_BACKEND_URL : true,
      run: async () => {
        if (isStandalone) {
          if (!config.HEALTHCHECK_BACKEND_URL) return;
          const res = await fetch(config.HEALTHCHECK_BACKEND_URL, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
          const data = (await res.json()) as any;
          if (data.status !== 'OK' && !data.dbConnected) {
            throw new Error(`Degraded status: ${data.status || 'unknown'}`);
          }
        } else {
          const dbHealthy = await checkDbHealth();
          if (!dbHealthy) throw new Error('Database connection failed');
        }
      },
    },
    {
      name: 'website',
      isEnabled: !!config.HEALTHCHECK_WEBSITE_URL,
      run: async () => {
        if (!config.HEALTHCHECK_WEBSITE_URL) return;
        const res = await fetch(config.HEALTHCHECK_WEBSITE_URL, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      },
    },
    {
      name: 'rapidapi',
      isEnabled: !!config.RAPIDAPI_KEY,
      run: async () => {
        const key = config.RAPIDAPI_KEY;
        const host = config.RAPIDAPI_SOCIAL_HOST;
        if (!key || !host) return;

        // Perform a lightweight POST with a dummy URL to check API key and routing
        const res = await fetch(`https://${host}/v1/social/autolink`, {
          method: 'POST',
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: 'https://instagram.com/p/healthcheck-dummy' }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error(`Unauthorized (HTTP ${res.status}). Verify RAPIDAPI_KEY.`);
        }
        if (res.status >= 500) {
          throw new Error(`Service degraded (HTTP ${res.status})`);
        }
      },
    },
    {
      name: 'apify',
      isEnabled: !!config.APIFY_TOKEN && config.APIFY_TOKEN !== 'your_apify_api_token',
      run: async () => {
        const token = config.APIFY_TOKEN;
        if (!token) return;
        const client = new ApifyClient({ token });
        await client.actors().list({ limit: 1 });
      },
    },
    {
      name: 'gemini',
      isEnabled: !!config.GEMINI_API_KEY,
      run: async () => {
        const key = config.GEMINI_API_KEY;
        if (!key) return;
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
        const result = await model.generateContent('Ping');
        const text = result.response.text();
        if (!text) throw new Error('Empty response received');
      },
    },
  ];

  const now = new Date().toISOString();
  const currentStates: HealthCheckState = {};

  for (const check of checks) {
    if (!check.isEnabled) continue;

    let status: 'up' | 'down' = 'up';
    let errorMsg: string | undefined;

    try {
      await check.run();
      console.log(`[healthcheck] Service "${check.name}" is UP`);
    } catch (err: any) {
      status = 'down';
      errorMsg = err?.message || String(err);
      console.warn(`[healthcheck] Service "${check.name}" is DOWN: ${errorMsg}`);
    }

    const prev = lastStates[check.name];
    let lastChanged = prev?.lastChanged || now;

    if (prev) {
      if (prev.status !== status) {
        // State transition detected!
        console.log(`[healthcheck] Service "${check.name}" transitioned from ${prev.status} to ${status}`);
        lastChanged = now;

        const alertMessage = status === 'down'
          ? `Service "${check.name}" went down. Error: ${errorMsg}`
          : `Service "${check.name}" recovered and is back up.`;

        // Send push alert
        await sendNotification(alertMessage, status === 'down', check.name);
      }
    } else {
      // First time running checks. Send alert if it starts in a 'down' state.
      if (status === 'down') {
        console.log(`[healthcheck] Service "${check.name}" is down on initial check.`);
        const alertMessage = `Service "${check.name}" went down. Error: ${errorMsg}`;
        await sendNotification(alertMessage, true, check.name);
      }
    }

    currentStates[check.name] = {
      status,
      lastChecked: now,
      lastChanged,
      error: errorMsg,
    };
  }

  // Update persistent state in database settings
  try {
    // Keep any services that weren't checked in this run (e.g. if config disabled them temporarily)
    const mergedStates = { ...lastStates, ...currentStates };
    await updateGlobalSettings({ health_check_status: JSON.stringify(mergedStates) });
  } catch (err: any) {
    console.error('[healthcheck] Failed to update health check state in database:', err.message);
  }

  return currentStates;
}
