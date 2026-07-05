import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '../supabase';

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;

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
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If user is immediately confirmed (no email confirmation), session is available
    if (data.session) {
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
        const { result } = await SocialLogin.login({
          provider: 'google',
          options: { scopes: ['email', 'profile'] },
        });
        // Online-mode Google response carries the OpenID Connect ID token.
        const idToken = 'idToken' in result ? result.idToken : null;
        if (!idToken) return { error: 'Google sign-in did not return an ID token.' };

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) return { error: error.message };
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

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, getAccessToken, updateUserMetadata }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}