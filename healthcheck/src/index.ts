import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_SOCIAL_HOST = process.env.RAPIDAPI_SOCIAL_HOST || 'social-download-all-in-one.p.rapidapi.com';
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const HEALTHCHECK_BACKEND_URL = process.env.HEALTHCHECK_BACKEND_URL || '';
const HEALTHCHECK_WEBSITE_URL = process.env.HEALTHCHECK_WEBSITE_URL || '';
const NTFY_TOPIC = process.env.NTFY_TOPIC || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface ServiceStatus {
  status: 'up' | 'down';
  lastChecked: string;
  lastChanged: string;
  error?: string;
}

interface HealthCheckState {
  [serviceName: string]: ServiceStatus;
}

// Initialize Supabase Client if credentials are provided
const supabase = (SUPABASE_URL && SUPABASE_SECRET_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
  : null;

/**
 * Fetches the last known healthcheck states from the database.
 */
async function getLastStates(): Promise<HealthCheckState> {
  if (!supabase) {
    console.warn('[healthcheck] Supabase credentials missing; state persistence disabled.');
    return {};
  }
  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'health_check_status')
      .maybeSingle();

    if (!error && data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err: any) {
    console.warn('[healthcheck] Could not load health check state from DB:', err.message);
  }
  return {};
}

/**
 * Saves current healthcheck states to the database.
 */
async function saveStates(states: HealthCheckState) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('global_settings')
      .upsert({
        key: 'health_check_status',
        value: JSON.stringify(states),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (err: any) {
    console.error('[healthcheck] Failed to update health check state in database:', err.message);
  }
}

/**
 * Sends a notification via ntfy.sh and/or Telegram Bot when configured.
 */
async function sendNotification(message: string, isDown: boolean, serviceName: string) {
  const promises: Promise<any>[] = [];

  // 1. ntfy.sh notification
  if (NTFY_TOPIC) {
    const title = isDown ? `🔴 Service Alert: ${serviceName} is DOWN` : `🟢 Service Recovery: ${serviceName} is UP`;
    const priority = isDown ? 4 : 3;
    const tags = isDown ? ['warning', 'skull'] : ['white_check_mark', 'partying_face'];

    promises.push(
      fetch('https://ntfy.sh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: NTFY_TOPIC,
          message: message,
          title: title,
          priority: priority,
          tags: tags,
        }),
      }).then(res => {
        if (!res.ok) console.error(`[healthcheck] ntfy alert failed with status ${res.status}`);
      }).catch(err => {
        console.error('[healthcheck] ntfy alert network error:', err.message || err);
      })
    );
  }

  // 2. Telegram Bot notification
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const formattedText = isDown
      ? `🔴 <b>[Cookbook Alert]</b> Service <b>${serviceName}</b> is <b>DOWN</b>!\n\nReason: <code>${message}</code>\nTime: <code>${new Date().toISOString()}</code>`
      : `🟢 <b>[Cookbook Alert]</b> Service <b>${serviceName}</b> is back <b>UP</b>!\n\nTime: <code>${new Date().toISOString()}</code>`;

    promises.push(
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
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
 * Main execution logic.
 */
async function run() {
  const isTestMode = process.argv.includes('test') || process.argv.includes('--test');

  if (isTestMode) {
    console.log('[healthcheck] Running in TEST mode. Sending test notifications...');
    if (!NTFY_TOPIC && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
      console.warn('[healthcheck] No notification channels configured (NTFY_TOPIC or TELEGRAM credentials missing).');
      process.exit(0);
    }

    await sendNotification(
      'This is a test notification from the Cookbook healthcheck service!',
      true,
      'test-service'
    );
    console.log('[healthcheck] Test notifications sent successfully.');
    process.exit(0);
  }

  console.log('[healthcheck] Starting health checks...');

  const lastStates = await getLastStates();
  const now = new Date().toISOString();
  const currentStates: HealthCheckState = {};

  const checks = [
    {
      name: 'backend',
      isEnabled: !!HEALTHCHECK_BACKEND_URL,
      run: async () => {
        const res = await fetch(HEALTHCHECK_BACKEND_URL, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        const data = (await res.json()) as any;
        if (data.status !== 'OK' && !data.dbConnected) {
          throw new Error(`Degraded status: ${data.status || 'unknown'}`);
        }
      },
    },
    {
      name: 'website',
      isEnabled: !!HEALTHCHECK_WEBSITE_URL,
      run: async () => {
        const res = await fetch(HEALTHCHECK_WEBSITE_URL, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      },
    },
    {
      name: 'rapidapi',
      isEnabled: !!RAPIDAPI_KEY,
      run: async () => {
        // Perform a lightweight POST with a dummy URL to check API key and routing
        const res = await fetch(`https://${RAPIDAPI_SOCIAL_HOST}/v1/social/autolink`, {
          method: 'POST',
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_SOCIAL_HOST,
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
      isEnabled: !!APIFY_TOKEN && APIFY_TOKEN !== 'your_apify_api_token',
      run: async () => {
        const client = new ApifyClient({ token: APIFY_TOKEN });
        await client.actors().list({ limit: 1 });
      },
    },
    {
      name: 'gemini',
      isEnabled: !!GEMINI_API_KEY,
      run: async () => {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent('Ping');
        const text = result.response.text();
        if (!text) throw new Error('Empty response received');
      },
    },
  ];

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
        console.log(`[healthcheck] Service "${check.name}" transitioned from ${prev.status} to ${status}`);
        lastChanged = now;

        const alertMessage = status === 'down'
          ? `Service "${check.name}" went down. Error: ${errorMsg}`
          : `Service "${check.name}" recovered and is back up.`;

        await sendNotification(alertMessage, status === 'down', check.name);
      }
    } else {
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

  // Update states in Supabase
  const mergedStates = { ...lastStates, ...currentStates };
  await saveStates(mergedStates);

  console.log('[healthcheck] Standalone health checks completed.');
  console.table(
    Object.entries(currentStates).map(([name, data]) => ({
      Service: name,
      Status: data.status.toUpperCase(),
      'Last Checked': data.lastChecked,
      Error: data.error || '-',
    }))
  );
  process.exit(0);
}

run().catch((err) => {
  console.error('[healthcheck] Critical failure in health check service:', err);
  process.exit(1);
});
