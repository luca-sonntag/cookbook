import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimerEntry {
  id: string;
  label: string;
  durationSeconds: number;
  endAt: number; // ms timestamp when timer expires
  isFinished: boolean;
}

interface TimerContextValue {
  timers: TimerEntry[];
  addTimer: (durationSeconds: number, label: string) => string;
  removeTimer: (id: string) => void;
  dismissFinished: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerContext must be used within TimerProvider');
  return ctx;
}

// ─── Audio Alarm ──────────────────────────────────────────────────────────────

function playAlarm(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const beepCount = 3;
    const beepDuration = 0.15;
    const beepGap = 0.12;

    for (let i = 0; i < beepCount; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;

      const startTime = ctx.currentTime + i * (beepDuration + beepGap);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + beepDuration + 0.05);
    }

    // Auto-close context after alarm is done
    setTimeout(() => ctx.close(), (beepDuration + beepGap) * beepCount * 1000 + 500);
  } catch {
    // Silently ignore if audio not available
  }
}

function vibrate(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch {
    // Silently ignore
  }
}

async function sendNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return;

  try {
    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: 'cooking-timer',
      });
      // Auto-close after 8 seconds
      setTimeout(() => notification.close(), 8000);
    }
  } catch {
    // Silently ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId(): string {
  return `timer-${Date.now()}-${++idCounter}`;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<TimerEntry[]>([]);
  const alreadyFiredRef = useRef<Set<string>>(new Set());

  // Request notification permission upfront when provider mounts (lazy: only if there's a timer)
  // We'll request permission on first addTimer call instead.

  // Global 1-second ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimers(prev => {
        let changed = false;
        const next = prev.map(timer => {
          if (!timer.isFinished && now >= timer.endAt) {
            // Fire alarm only once per timer
            if (!alreadyFiredRef.current.has(timer.id)) {
              alreadyFiredRef.current.add(timer.id);
              playAlarm();
              vibrate();
              sendNotification(timer.label, '🍳 Dein Koch-Timer ist abgelaufen. / Your cooking timer finished.');
            }
            changed = true;
            return { ...timer, isFinished: true };
          }
          return timer;
        });
        return changed ? next : prev;
      });
    }, 500); // 500ms for snappier countdown display

    return () => clearInterval(interval);
  }, []);

  const addTimer = useCallback((durationSeconds: number, label: string): string => {
    const id = generateId();
    const endAt = Date.now() + durationSeconds * 1000;
    const entry: TimerEntry = {
      id,
      label,
      durationSeconds,
      endAt,
      isFinished: false,
    };

    // Pre-request notification permission on first timer start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {/* ignore */});
    }

    setTimers(prev => [...prev, entry]);
    return id;
  }, []);

  const removeTimer = useCallback((id: string) => {
    alreadyFiredRef.current.delete(id);
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissFinished = useCallback((id: string) => {
    alreadyFiredRef.current.delete(id);
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <TimerContext.Provider value={{ timers, addTimer, removeTimer, dismissFinished }}>
      {children}
    </TimerContext.Provider>
  );
}
