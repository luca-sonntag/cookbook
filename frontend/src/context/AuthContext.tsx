import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '../supabase';
import { apiUrl } from '../api';

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;

// Set after an explicit sign-out so the app doesn't immediately silent-sign-in
// again with the same on-device Google account on the next cold start.
// Cleared again once the user signs in (any method) of their own accord.
const AUTO_SIGNIN_DISABLED_KEY = 'kb_auto_signin_disabled';

// Lazily initialize the native Google Sign-In plugin exactly once. Safe to call
// repeatedly; only the first call hits the plugin.
let socialLoginInitialized: Promise<void> | null = null;
function ensureSocialLoginInitialized() {
  if (!socialLoginInitialized) {
    socialLoginInitialized = SocialLogin.initialize({
      google: { webClientId: GOOGLE_WEB_CLIENT_ID },
    });
  }
  return socialLoginInitialized;
}

// Best-effort silent sign-in with an on-device Google account (Android only —
// this app has no iOS platform, and the plugin's silent-selection options are
// documented as Android-only). Any failure (no account, ambiguous accounts,
// user dismissal) is expected and swallowed: the caller falls back to the
// normal AuthForm with no visible error.
async function attemptSilentGoogleSignIn(): Promise<{ success: boolean; error?: string }> {
  if (Capacitor.getPlatform() !== 'android') return { success: false };
  if (!GOOGLE_WEB_CLIENT_ID) return { success: false };
  if (localStorage.getItem(AUTO_SIGNIN_DISABLED_KEY)) return { success: false };

  try {
    console.log('attemptSilentGoogleSignIn: Initializing social login');
    await ensureSocialLoginInitialized();
    console.log('attemptSilentGoogleSignIn: Calling SocialLogin.login');
    const { result } = await SocialLogin.login({
      provider: 'google',
      options: {
        style: 'bottom',
        filterByAuthorizedAccounts: false,
        autoSelectEnabled: true,
      },
    });
    console.log('attemptSilentGoogleSignIn: SocialLogin.login completed', result);
    const idToken = 'idToken' in result ? result.idToken : null;
    if (!idToken) {
      console.warn('attemptSilentGoogleSignIn: No ID token returned from Google login');
      return { success: false, error: 'Google sign-in did not return an ID token.' };
    }

    console.log('attemptSilentGoogleSignIn: Signing in to Supabase with ID token');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) {
      console.error('attemptSilentGoogleSignIn: Supabase sign-in failed', error);
      return { success: false, error: error.message };
    }
    console.log('attemptSilentGoogleSignIn: Supabase sign-in successful');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('attemptSilentGoogleSignIn: Error caught during silent login', message, e);
    // User dismissing the account picker / no account is not an error worth surfacing.
    if (/cancel/i.test(message)) {
      return { success: false };
    }
    return { success: false, error: message };
  }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // True when the current session was established by the silent on-device
  // Google sign-in (not an explicit user action). Used to hide the logout
  // button — the user never chose to log in, and signing out would just get
  // undone by the next silent sign-in.
  autoSignedIn: boolean;
  authError: string | null;
  isPremium: boolean;
  isPremiumOverride: boolean;
  isAdmin: boolean;
  setIsPremiumOverride: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  refreshSession: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSignedIn, setAutoSignedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Development-only Premium simulator state
  const [isPremiumOverride, setIsPremiumOverrideState] = useState<boolean>(() => {
    if (import.meta.env.DEV) {
      return localStorage.getItem('kb_simulate_premium') === 'true';
    }
    return false;
  });

  const setIsPremiumOverride = useCallback((value: boolean) => {
    if (import.meta.env.DEV) {
      if (value) {
        localStorage.setItem('kb_simulate_premium', 'true');
      } else {
        localStorage.removeItem('kb_simulate_premium');
      }
      setIsPremiumOverrideState(value);
    }
  }, []);

  const isPremium = isPremiumOverride || user?.app_metadata?.tier === 'premium' || user?.app_metadata?.tier === 'beta';

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error.message);
      return { error: error.message };
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }
    return {};
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // No active session on cold start: try to sign in silently with an
        // on-device Google account before falling back to the login form.
        // On success, the onAuthStateChange listener below already applied
        // the new session — don't overwrite it with the stale `session`
        // (still null here) captured before the silent attempt ran.
        const res = await attemptSilentGoogleSignIn();
        if (res.success) {
          setAutoSignedIn(true);
          setAuthError(null);
          return;
        } else if (res.error) {
          setAuthError(res.error);
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = useCallback(async (token: string | null) => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/admin/check'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(!!data.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.warn('Failed to check admin status:', e);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    checkAdminStatus(session.access_token);
  }, [session, checkAdminStatus]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
    setAutoSignedIn(false);
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If user is immediately confirmed (no email confirmation), session is available
    if (data.session) {
      localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
      setAutoSignedIn(false);
      return {};
    }
    return { needsConfirmation: true };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    // Native (Capacitor): use the OS account-picker dialog to get a Google ID
    // token, then exchange it for a Supabase session — no browser redirect.
    if (Capacitor.isNativePlatform()) {
      if (!GOOGLE_WEB_CLIENT_ID) {
        return { error: 'Google sign-in is not configured (missing VITE_GOOGLE_WEB_CLIENT_ID).' };
      }
      try {
        console.log('signInWithGoogle: Initializing social login');
        await ensureSocialLoginInitialized();
        console.log('signInWithGoogle: Calling SocialLogin.login');
        const { result } = await SocialLogin.login({
          provider: 'google',
          options: {},
        });
        console.log('signInWithGoogle: SocialLogin.login completed', result);
        // Online-mode Google response carries the OpenID Connect ID token.
        const idToken = 'idToken' in result ? result.idToken : null;
        if (!idToken) {
          console.warn('signInWithGoogle: No ID token returned from Google login');
          return { error: 'Google sign-in did not return an ID token.' };
        }

        console.log('signInWithGoogle: Signing in to Supabase with ID token');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) {
          console.error('signInWithGoogle: Supabase sign-in failed', error);
          return { error: error.message };
        }
        console.log('signInWithGoogle: Supabase sign-in successful');
        localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
        setAutoSignedIn(false);
        return {};
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('signInWithGoogle: Error caught during manual login', message, e);
        // User dismissing the account picker is not an error worth surfacing.
        if (/cancel/i.test(message)) return {};
        return { error: message };
      }
    }

    // Web: the redirect-based OAuth flow (opens the provider in the browser).
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    // Set before signing out so a cold restart won't silently sign the user
    // right back in with the same on-device Google account.
    localStorage.setItem(AUTO_SIGNIN_DISABLED_KEY, '1');
    if (Capacitor.getPlatform() === 'android') {
      // Best effort: clears Credential Manager's cached state. Harmlessly
      // rejects if the user never signed in via Google.
      await SocialLogin.logout({ provider: 'google' }).catch(() => {});
    }
    await supabase.auth.signOut();
    setAutoSignedIn(false);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const updateUserMetadata = useCallback(async (metadata: Record<string, any>) => {
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) return { error: error.message };
    if (data.user) {
      setUser(data.user);
    }
    return {};
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'Not authenticated' };

      const response = await fetch(apiUrl('/api/users/me'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Failed to delete account' };
      }

      await signOut();
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }, [getAccessToken, signOut]);

  return (
    <AuthContext.Provider value={{ user, session, loading, autoSignedIn, authError, isPremium, isPremiumOverride, isAdmin, setIsPremiumOverride, signIn, signUp, signInWithGoogle, signOut, getAccessToken, updateUserMetadata, deleteAccount, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}