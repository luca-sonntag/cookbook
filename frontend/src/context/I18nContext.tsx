import React, { createContext, useContext, useState, useCallback } from 'react';
import { getTranslation, translateCategory as translateCategoryUtil } from '../i18n';
import type { SupportedLanguage } from '../i18n';

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
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('recipe_language');
    if (saved === 'de' || saved === 'en') {
      return saved as SupportedLanguage;
    }
    // Fallback to browser language
    const browserLang = navigator.language || '';
    if (browserLang.toLowerCase().startsWith('de')) {
      return 'de';
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('recipe_language', lang);
  }, []);

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
