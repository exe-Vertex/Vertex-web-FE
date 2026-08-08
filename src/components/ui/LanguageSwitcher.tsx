import React from 'react';
import { Languages } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false, className = '' }) => {
  const { lang, setLang, t } = useLang();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        title={t.lang.language}
        aria-label={`${t.lang.language}: ${lang === 'vi' ? t.lang.vi : t.lang.en}`}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#22C55E]/15 bg-[#0F1A2A]/80 px-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-[#22C55E]/35 hover:text-white ${className}`}
      >
        <Languages size={15} />
        {t.lang.current}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex rounded-lg border border-[#22C55E]/15 bg-[#0F1A2A] p-1 ${className}`}
      role="group"
      aria-label={t.lang.language}
    >
      {(['vi', 'en'] as const).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`min-w-24 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            lang === option
              ? 'bg-[#22C55E] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {option === 'vi' ? t.lang.vi : t.lang.en}
        </button>
      ))}
    </div>
  );
};
