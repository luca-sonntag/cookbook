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
async function attemptSilentGoogleSignIn(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  if (!GOOGLE_WEB_CLIENT_ID) return;
  if (localStorage.getItem(AUTO_SIGNIN_DISABLED_KEY)) return;

  try {
    await ensureSocialLoginInitialized();
    const { result } = await SocialLogin.login({
      provider: 'google',
      options: {
        style: 'bottom',
        filterByAuthorizedAccounts: false,
        autoSelectEnabled: true,
      },
    });
    const idToken = 'idToken' in result ? result.idToken : null;
    if (!idToken) return;

    await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  } catch {
    // No account available / user dismissed the prompt / anything else —
    // silently fall back to the manual login form.
  }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  updateUserMetadata: (metadata: Record<string, any>) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // No active session on cold start: try to sign in silently with an
        // on-device Google account before falling back to the login form.
        await attemptSilentGoogleSignIn();
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If user is immediately confirmed (no email confirmation), session is available
    if (data.session) {
      localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
      return {};
    }
    return { needsConfirmation: true };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Native (Capacitor): use the OS account-picker dialog to get a Google ID
    // token, then exchange it for a Supabase session — no browser redirect.
    if (Capacitor.isNativePlatform()) {
      if (!GOOGLE_WEB_CLIENT_ID) {
        return { error: 'Google sign-in is not configured (missing VITE_GOOGLE_WEB_CLIENT_ID).' };
      }
      try {
        await ensureSocialLoginInitialized();
        // Don't pass `scopes`: the plugin already requests email/profile/openid
        // by default, and supplying a custom scopes array switches Android into
        // an extended-authorization flow that requires modifying MainActivity.
        const { result } = await SocialLogin.login({
          provider: 'google',
          options: {},
        });
        // Online-mode Google response carries the OpenID Connect ID token.
        const idToken = 'idToken' in result ? result.idToken : null;
        if (!idToken) return { error: 'Google sign-in did not return an ID token.' };

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) return { error: error.message };
        localStorage.removeItem(AUTO_SIGNIN_DISABLED_KEY);
        return {};
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
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
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, getAccessToken, updateUserMetadata, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}