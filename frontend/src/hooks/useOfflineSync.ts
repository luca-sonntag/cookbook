import { useEffect, useState, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useAuth } from '../context/AuthContext';
import { flush, subscribe, type OutboxAuth, type OutboxStatus } from '../utils/outbox';

/**
 * Drives the write-outbox: registers the flush triggers (app start, reconnect,
 * app resume) and exposes the pending/failed counts for a subtle sync status
 * indicator. Mount once, near the app root.
 */
export function useOfflineSync() {
  const { user, getAccessToken, refreshSession } = useAuth();
  const [status, setStatus] = useState<OutboxStatus>({ pendingCount: 0, failedCount: 0 });

  // Keep the auth accessors in a ref so the flush trigger stays stable while
  // always calling the freshest token/refresh functions.
  const authRef = useRef<OutboxAuth>({ getAccessToken, refreshSession });
  useEffect(() => {
    authRef.current = { getAccessToken, refreshSession };
  }, [getAccessToken, refreshSession]);

  const triggerFlush = useCallback(() => {
    if (!navigator.onLine) return;
    void flush(authRef.current);
  }, []);

  // Reflect outbox status (pending/failed) into React for the UI.
  useEffect(() => subscribe(setStatus), []);

  // Flush triggers, active only while signed in.
  useEffect(() => {
    if (!user) return;

    triggerFlush(); // on start / login

    const onOnline = () => triggerFlush();
    window.addEventListener('online', onOnline);

    // App resume (foreground) — the plugin's web shim maps this to visibility.
    let removeResume: (() => void) | undefined;
    CapApp.addListener('appStateChange', state => {
      if (state.isActive) triggerFlush();
    })
      .then(handle => { removeResume = () => void handle.remove(); })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', onOnline);
      removeResume?.();
    };
  }, [user, triggerFlush]);

  return { ...status, flush: triggerFlush };
}
