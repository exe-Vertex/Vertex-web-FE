import React, { createContext, useContext, useEffect, useState } from 'react';
import { Lang, translations, Translations } from '../i18n';

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const savedLanguage = localStorage.getItem('vertex.language');
    return savedLanguage === 'en' || savedLanguage === 'vi' ? savedLanguage : 'vi';
  });
  const t = translations[lang] as Translations;
  const toggle = () => setLang(current => current === 'vi' ? 'en' : 'vi');

  useEffect(() => {
    localStorage.setItem('vertex.language', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};
