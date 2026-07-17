import type { Lang } from '../types';

// Aktif locale LanguageProvider tarafından set edilir; TR: 1.234,5 — EN: 1,234.5
let locale: 'tr-TR' | 'en-US' = 'tr-TR';

export const setFormatLocale = (lang: Lang) => {
  locale = lang === 'en' ? 'en-US' : 'tr-TR';
};

export const getFormatLocale = () => locale;

export const fmtNumber = (n: number, digits = 0): string =>
  n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// ₺ ve $ sembolleri her iki dilde aynı kalır; sadece sayı biçimi locale'e uyar.
// ₺ sonek (1.248,64 ₺), $ önek ($1,248.64) — mevcut UI konvansiyonu.
export const fmtCurrency = (n: number, symbol: '₺' | '$' = '₺', digits = 0): string =>
  symbol === '$' ? `$${fmtNumber(n, digits)}` : `${fmtNumber(n, digits)} ₺`;

// TR: %34,7 — EN: 34.7%
export const fmtPercent = (n: number, digits = 1): string =>
  locale === 'tr-TR' ? `%${fmtNumber(n, digits)}` : `${fmtNumber(n, digits)}%`;

const MOS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MOS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Chart eksenlerindeki TR ay etiketlerini EN locale'de çevirir ("Oca" → "Jan", "Ağu '25" → "Aug '25").
export const fmtMonth = (m: string): string => {
  if (locale !== 'en-US' || typeof m !== 'string') return m;
  for (let i = 0; i < 12; i++) {
    if (m.startsWith(MOS_TR[i])) return MOS_EN[i] + m.slice(MOS_TR[i].length);
  }
  return m;
};

// TR: "12 gün önce" — EN: "12 days ago"
export const fmtRelativeDays = (n: number | string): string =>
  locale === 'en-US' ? `${n} days ago` : `${n} gün önce`;

// Kompakt ₺ gösterimi (locale ondalık ayracı): 5.040.000 → "5,0M ₺" (TR) / "5.0M ₺" (EN).
// ₺ sembolü her iki dilde sabit (ana para birimi TRY).
export const fmtCompactTRY = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${fmtNumber(n / 1_000_000, 1)}M ₺`;
  if (abs >= 1_000) return `${fmtNumber(n / 1_000, 0)}K ₺`;
  return `${fmtNumber(n, 0)} ₺`;
};
