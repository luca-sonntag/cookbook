import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimerEntry {
  id: string;
  label: string;
  durationSeconds: number;
  endAt: number; // ms timestamp when timer expires
  isFinished: boolean;
  recipeId?: string;
  stepNum?: number;
}

export interface PendingTimerNavigation {
  recipeId: string;
  stepNum: number;
}

interface TimerContextValue {
  timers: TimerEntry[];
  addTimer: (durationSeconds: number, label: string, recipeId?: string, stepNum?: number) => string;
  removeTimer: (id: string) => void;
  dismissFinished: (id: string) => void;
  pendingNavigation: PendingTimerNavigation | null;
  setPendingNavigation: (nav: PendingTimerNavigation | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerContext must be used within TimerProvider');
  return ctx;
}

// ─── Audio Alarm ──────────────────────────────────────────────────────────────

// Global reference to the unlocked AudioContext
let globalAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (globalAudioContext) {
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().catch(() => {});
    }
    return globalAudioContext;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    globalAudioContext = new AudioContextClass();
    return globalAudioContext;
  } catch {
    return null;
  }
}

function playAlarm(): void {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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
  } catch (err) {
    console.error('Failed to play alarm:', err);
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
        vibrate: [200, 100, 200, 100, 400],
      } as any);
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
  const [pendingNavigation, setPendingNavigation] = useState<PendingTimerNavigation | null>(null);

  // Ref mirror of timers — always current, readable inside intervals without stale closure
  const timersRef = useRef<TimerEntry[]>([]);
  timersRef.current = timers;

  // Tracks which timer IDs have already had their alarm started
  const alreadyFiredRef = useRef<Set<string>>(new Set());
  // Repeating alarm interval per timer ID — cleared on dismiss/remove
  const alarmIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Global ticker: runs every 500 ms for smooth countdown display
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const current = timersRef.current;

      // ── Identify newly expired timers (outside setTimers — safe for side-effects) ──
      const newlyExpired = current.filter(
        t => !t.isFinished && now >= t.endAt && !alreadyFiredRef.current.has(t.id)
      );

      // ── Fire side-effects OUTSIDE state updater ──
      newlyExpired.forEach(timer => {
        alreadyFiredRef.current.add(timer.id);

        // First ring immediately
        playAlarm();
        vibrate();
        sendNotification(timer.label, '🍳 Dein Koch-Timer ist abgelaufen. / Your cooking timer finished.');

        // Repeat every 2.5 s until user dismisses
        const repeatInterval = setInterval(() => {
          // Only ring if timer is still in the list (not yet dismissed)
          if (timersRef.current.some(t => t.id === timer.id)) {
            playAlarm();
            vibrate();
          } else {
            clearInterval(repeatInterval);
          }
        }, 2500);
        alarmIntervalsRef.current.set(timer.id, repeatInterval);
      });

      // ── State update: mark expired timers as finished AND/OR force re-render for countdown ──
      const hasRunning = current.some(t => !t.isFinished);
      if (newlyExpired.length > 0) {
        const expiredIds = new Set(newlyExpired.map(t => t.id));
        setTimers(prev =>
          prev.map(t => expiredIds.has(t.id) ? { ...t, isFinished: true } : t)
        );
      } else if (hasRunning) {
        // Force re-render of context to update countdown times
        setTimers(prev => [...prev]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTimer = useCallback((durationSeconds: number, label: string, recipeId?: string, stepNum?: number): string => {
    // Unlock/instantiate AudioContext on user gesture
    const audioCtx = getSharedAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const id = generateId();
    const endAt = Date.now() + durationSeconds * 1000;
    const entry: TimerEntry = {
      id,
      label,
      durationSeconds,
      endAt,
      isFinished: false,
      recipeId,
      stepNum,
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
    const existing = alarmIntervalsRef.current.get(id);
    if (existing !== undefined) {
      clearInterval(existing);
      alarmIntervalsRef.current.delete(id);
    }
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissFinished = useCallback((id: string) => {
    alreadyFiredRef.current.delete(id);
    const existing = alarmIntervalsRef.current.get(id);
    if (existing !== undefined) {
      clearInterval(existing);
      alarmIntervalsRef.current.delete(id);
    }
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <TimerContext.Provider value={{ timers, addTimer, removeTimer, dismissFinished, pendingNavigation, setPendingNavigation }}>
      {children}
    </TimerContext.Provider>
  );
}

