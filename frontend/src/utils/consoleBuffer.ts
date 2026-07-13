// Lightweight in-memory console ring buffer.
//
// Patches the global console methods once at app startup to keep the last N
// entries so they can be attached to in-app bug reports (see feedbackContext).
// There is no centralized logger in this app, so this is our source of recent
// diagnostic output. Each entry is safely stringified and truncated to keep
// memory bounded and the eventual feedback payload well under the body cap.

export interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  ts: string;
  text: string;
}

const MAX_ENTRIES = 50;
const MAX_TEXT_LENGTH = 1000;

const buffer: LogEntry[] = [];
let installed = false;

/** Safely turn console arguments into a single truncated string. */
function serialize(args: unknown[]): string {
  const parts = args.map((arg) => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  });
  const text = parts.join(' ');
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}…` : text;
}

/**
 * Patch console.log/info/warn/error to record entries into the ring buffer,
 * then delegate to the original implementation. Idempotent.
 */
export function installConsoleBuffer(): void {
  if (installed || typeof console === 'undefined') return;
  installed = true;

  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        buffer.push({ level, ts: new Date().toISOString(), text: serialize(args) });
        if (buffer.length > MAX_ENTRIES) buffer.shift();
      } catch {
        // Never let logging instrumentation break the app.
      }
      original(...args);
    };
  });
}

/** Return a snapshot of the most recent captured console entries. */
export function getRecentLogs(): LogEntry[] {
  return buffer.slice();
}
