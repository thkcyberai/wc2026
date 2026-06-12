'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LANGS, LOCALE, translate, type Lang } from '@/lib/i18n';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wc2026.lang') as Lang | null;
      if (saved && ['en', 'pt', 'es'].includes(saved)) setLangState(saved);
    } catch { /* private mode etc. */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('wc2026.lang', l); } catch { /* ignore */ }
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

/** Hook: current language, locale string and translate function. */
export function useI18n() {
  const { lang, setLang } = useContext(Ctx);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );
  return { lang, setLang, t, locale: LOCALE[lang] };
}

/** Flag-based language switcher: 🇺🇸 → 🇧🇷 → 🇪🇸 */
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          aria-label={l.label}
          className={`rounded-lg p-1 transition ${
            lang === l.code ? 'bg-accent/25 ring-1 ring-accent' : 'opacity-60 hover:opacity-100'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${l.flag}.png`}
            srcSet={`https://flagcdn.com/w80/${l.flag}.png 2x`}
            width={26}
            height={18}
            alt={l.label}
            className="h-[18px] w-[26px] rounded-[3px] object-cover"
          />
        </button>
      ))}
    </div>
  );
}
