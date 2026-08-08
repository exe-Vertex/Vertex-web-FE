import React, { createContext, useContext, useEffect } from 'react';
import { Lang, translations, Translations } from '../i18n';

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lang: Lang = 'en';
  const t = translations.en as Translations;

  useEffect(() => {
    localStorage.removeItem('vertex.language');
    document.documentElement.lang = 'en';
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};
