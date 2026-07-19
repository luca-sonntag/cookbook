import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { getTranslation, translateCategory as translateCategoryUtil } from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { useAuth } from './AuthContext';

// Map any locale/language code to a supported language.
// German (de, de-DE, de-AT, …) → 'de', everything else → 'en'.
function normalizeLanguage(code: string | null | undefined): SupportedLanguage {
  return (code || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

interface I18nContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  translateCategory: (category: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserMetadata } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('recipe_language');
    if (saved === 'de' || saved === 'en') {
      return saved as SupportedLanguage;
    }
    // Synchronous first guess from the WebView locale; refined below via
    // the native device language for accuracy on Android/iOS.
    return normalizeLanguage(navigator.language);
  });

  // On first launch (no explicit choice yet) detect the real OS/system
  // language via the native device API, which is more reliable than
  // navigator.language inside the WebView. Any non-German locale → English.
  // Runs once on mount and is intentionally NOT tied to `user`: the metadata
  // sync effect below owns the logged-in case. The localStorage re-check on
  // resolution guarantees this late async result never overrides an explicit
  // choice (manual selection or user metadata) that arrived while detecting.
  useEffect(() => {
    if (localStorage.getItem('recipe_language')) return; // already chosen
    let cancelled = false;
    Device.getLanguageCode()
      .then(({ value }) => {
        if (cancelled || localStorage.getItem('recipe_language')) return;
        setLanguageState(normalizeLanguage(value));
      })
      .catch(() => {
        // Keep the navigator.language-based guess on failure.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state if user metadata has a language
  useEffect(() => {
    if (user?.user_metadata?.language) {
      const metaLang = user.user_metadata.language;
      if ((metaLang === 'de' || metaLang === 'en') && metaLang !== language) {
        setLanguageState(metaLang as SupportedLanguage);
        localStorage.setItem('recipe_language', metaLang);
      }
    }
  }, [user, language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('recipe_language', lang);
    if (user) {
      updateUserMetadata({ language: lang });
    }
  }, [user, updateUserMetadata]);

  const t = useCallback((key: string, variables?: Record<string, string | number>) => {
    return getTranslation(key, language, variables);
  }, [language]);

  const translateCategory = useCallback((category: string) => {
    return translateCategoryUtil(category, language);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translateCategory }}>
      {children}
    </I18nContext.Provider>
  );
}
