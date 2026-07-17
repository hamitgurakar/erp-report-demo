import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Lang } from '../types';
import { tr, type Dict } from './tr';
import { en } from './en';
import { setFormatLocale } from '../utils/format';
import { setTermsLang } from './terms';

const DICTS: Record<Lang, Dict> = { tr, en };
const LS_KEY = 'muhiku-lang';

interface LanguageCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dict: Dict;
  t: (key: string) => string;
  /** Mock data'daki TR rozet değerini ('RİSK', 'Acil'…) aktif dile çevirir; eşleşme yoksa olduğu gibi döner. */
  tBadge: (value: string) => string;
}

// Mock data rozet değerleri TR string olarak enum görevi görür; render'da bu haritayla çevrilir.
const BADGE_KEYS: Record<string, string> = {
  'RİSK': 'badges.risk',
  'DİKKAT': 'badges.dikkat',
  'HEDEFTE': 'badges.hedefte',
  'Acil': 'badges.acil',
  'Uyarı': 'badges.uyari',
  'İzle': 'badges.izle',
  'İzleniyor': 'badges.izleniyor',
  'Aktif': 'badges.aktif',
  'Yeni': 'badges.yeni',
  'Devam': 'badges.devam',
  'Tamamlandı': 'badges.tamamlandi',
};

const Ctx = createContext<LanguageCtx | null>(null);

const resolve = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    obj,
  );

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'en' ? 'en' : 'tr';
    } catch {
      return 'tr';
    }
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      // localStorage kapalıysa dil yine de session içinde değişir
    }
  };

  // Render gövdesinde senkron set: EN persist edilmişken ilk boyamada da doğru locale/terim kullanılır.
  setFormatLocale(lang);
  setTermsLang(lang);

  const dict = DICTS[lang];

  // Eksik anahtar TR'ye düşer; TR'de de yoksa anahtarın kendisi döner.
  const t = (key: string): string => {
    const v = resolve(dict, key) ?? resolve(tr, key);
    return typeof v === 'string' ? v : key;
  };

  const tBadge = (value: string): string => (BADGE_KEYS[value] ? t(BADGE_KEYS[value]) : value);

  return <Ctx.Provider value={{ lang, setLang, dict, t, tBadge }}>{children}</Ctx.Provider>;
};

export const useTranslation = (): LanguageCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
};
