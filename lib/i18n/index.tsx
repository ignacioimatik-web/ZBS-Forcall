import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Lang, Dict } from './types';
import es from './es';
import ca from './ca';

const dicts: Record<Lang, Dict> = { es, ca };

function getNested(obj: Dict, path: string): string | undefined {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: 'es',
  setLang: () => {},
  t: (path, fb) => fb || path,
});

export { I18nContext };

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('zbs_lang');
    return (saved === 'es' || saved === 'ca') ? saved : 'es';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('zbs_lang', l);
  }, []);

  const t = useCallback((path: string, fallback?: string): string => {
    return getNested(dicts[lang], path) ?? getNested(dicts['es'], path) ?? fallback ?? path;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useT() {
  return useContext(I18nContext);
}
