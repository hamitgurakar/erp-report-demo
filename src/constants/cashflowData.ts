// Nakit Akışı demo seed — docs/cashflow-brief.md SECTION B.
// Deterministik. Geçmiş ~30 gün ACTUAL (+ saklı forecast → variance), gelecek ~90 gün FORECAST.
// Kredi/Çek satırları cashflowEngine tarafından cashflowFeed'den birleştirilir (burada 0).
import type { CashLine, BankAccount, CashScenario } from '../types/cashflow';
import { daysBetween } from '../lib/finance/loanEngine';

export const REF_DATE = '2026-07-21'; // "bugün" — bu tarihten önce actual, sonrası forecast

// ── Banka hesapları (~13M TRY) ──
export const bankAccounts: BankAccount[] = [
  { id: 'B1', banka: 'Ziraat', ad: 'Ziraat — Vadesiz', paraBirimi: 'TRY', bakiyeTRY: 5_240_000, sonHareket: '2026-07-20', durum: 'Aktif' },
  { id: 'B2', banka: 'İş Bankası', ad: 'İş — Ticari', paraBirimi: 'TRY', bakiyeTRY: 3_180_000, sonHareket: '2026-07-19', durum: 'Aktif' },
  { id: 'B3', banka: 'Garanti BBVA', ad: 'Garanti — Döviz', paraBirimi: 'USD', bakiyeTRY: 2_695_000, bakiyeOrijinal: 60_000, sonHareket: '2026-07-15', durum: 'Aktif' },
  { id: 'B4', banka: 'Yapı Kredi', ad: 'Yapı Kredi — EUR', paraBirimi: 'EUR', bakiyeTRY: 1_420_000, bakiyeOrijinal: 29_000, sonHareket: '2026-07-12', durum: 'Aktif' },
  { id: 'B5', banka: 'Akbank', ad: 'Akbank — Teminat/Bloke', paraBirimi: 'TRY', bakiyeTRY: 850_000, sonHareket: '2026-06-30', durum: 'Bloke' },
];
export const totalPosition = bankAccounts.reduce((s, a) => s + a.bakiyeTRY, 0);            // ~13.4M
export const openingBalance = bankAccounts.filter((a) => a.durum === 'Aktif').reduce((s, a) => s + a.bakiyeTRY, 0); // kullanılabilir

// ── Senaryolar ──
export const scenarios: CashScenario[] = [
  { key: 'best', label: { tr: 'İyimser', en: 'Best' }, multipliers: { inflow: 1.10, outflow: 0.95 } },
  { key: 'base', label: { tr: 'Baz', en: 'Base' }, multipliers: { inflow: 1.0, outflow: 1.0 } },
  { key: 'worst', label: { tr: 'Kötümser', en: 'Worst' }, multipliers: { inflow: 0.85, outflow: 1.10 } },
];

// ── Grid satırları (SECTION B.4) ──
export const CASH_ROWS: CashLine[] = [
  // Gelirler
  { key: 'muhikuLtdPos', label: { tr: 'Muhiku LTD POS', en: 'Muhiku LTD POS' }, direction: 'inflow', kategori: 'Satış', source: 'ERP' },
  { key: 'muhikuKurumsal', label: { tr: 'Muhiku Kurumsal', en: 'Muhiku Corporate' }, direction: 'inflow', kategori: 'Satış', source: 'ERP' },
  { key: 'finansalKredi', label: { tr: 'Finansal Kredi', en: 'Financial Loan' }, direction: 'inflow', kategori: 'Finansman', source: 'Manuel' },
  // Ödemeler
  { key: 'tedarikci', label: { tr: 'Tedarikçi', en: 'Suppliers' }, direction: 'outflow', kategori: 'Tedarik', source: 'ERP' },
  { key: 'cek', label: { tr: 'Çek', en: 'Cheque' }, direction: 'outflow', kategori: 'Çek', source: 'Manuel' },
  { key: 'kredi', label: { tr: 'Kredi', en: 'Loan' }, direction: 'outflow', kategori: 'Kredi', source: 'Hesaplanan' },
  { key: 'kira', label: { tr: 'Kira', en: 'Rent' }, direction: 'outflow', kategori: 'G&A', source: 'Manuel' },
  { key: 'yazilim', label: { tr: 'Yazılım', en: 'Software' }, direction: 'outflow', kategori: 'G&A', source: 'Paraşüt' },
  { key: 'pazarlama', label: { tr: 'Pazarlama', en: 'Marketing' }, direction: 'outflow', kategori: 'Pazarlama', source: 'ERP' },
  { key: 'lojistik', label: { tr: 'Lojistik', en: 'Logistics' }, direction: 'outflow', kategori: 'Operasyon', source: 'ERP' },
  { key: 'yonetim', label: { tr: 'Yönetim', en: 'Management' }, direction: 'outflow', kategori: 'G&A', source: 'Manuel' },
  { key: 'yapVergi', label: { tr: 'Yapılandırma & Vergi', en: 'Restructuring & Tax' }, direction: 'outflow', kategori: 'Vergi', source: 'Paraşüt' },
  { key: 'diger', label: { tr: 'Diğer', en: 'Other' }, direction: 'outflow', kategori: 'Diğer', source: 'Manuel' },
  { key: 'ekHesapKK', label: { tr: 'Ek Hesap & K.Kartı', en: 'Overdraft & Card' }, direction: 'outflow', kategori: 'Finansman', source: 'Paraşüt' },
];
export const DIRECTION: Record<string, 'inflow' | 'outflow'> = Object.fromEntries(CASH_ROWS.map((r) => [r.key, r.direction]));
export const FEED_ROWS = new Set(['kredi', 'cek']); // motor bunları cashflowFeed'den doldurur

// ── deterministik yardımcılar ──
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000; // [0,1)
};
const dow = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }; // 0=Paz
const dom = (iso: string) => Number(iso.split('-')[2]);

// Satır bazlı gün-içi taban tutar (TRY)
const dailyBase = (key: string, iso: string): number => {
  const wd = dow(iso); const isWeekend = wd === 0 || wd === 6; const d = dom(iso);
  switch (key) {
    case 'muhikuLtdPos': return wd === 0 ? 0 : wd === 6 ? 110_000 : 260_000;
    case 'muhikuKurumsal': return isWeekend ? 0 : 180_000;
    case 'finansalKredi': return 0;
    case 'tedarikci': return isWeekend ? 0 : 150_000;
    case 'kira': return d === 1 ? 185_000 : 0;
    case 'yazilim': return d === 5 ? 145_000 : 0;
    case 'pazarlama': return isWeekend ? 30_000 : 90_000;
    case 'lojistik': return isWeekend ? 20_000 : 55_000;
    case 'yonetim': return isWeekend ? 0 : 45_000;
    case 'yapVergi': return d === 26 ? 210_000 : 0;
    case 'diger': return isWeekend ? 10_000 : 28_000;
    case 'ekHesapKK': return isWeekend ? 0 : 38_000;
    default: return 0;
  }
};

/**
 * Bir satır-gün için forecast + (geçmişse) actual üretir. Deterministik.
 * Geçmişte gerçekleşen forecast'ten ±%5 sapar; bilinçli bir "kötü hafta"da (15-21 gün önce)
 * >%15 sapma → variance uyarısı tetiklenir.
 */
export const dailyForLine = (key: string, iso: string): { forecast: number; actual: number | null } => {
  if (FEED_ROWS.has(key)) return { forecast: 0, actual: 0 }; // motor feed'den dolduracak
  const base = dailyBase(key, iso);
  const forecast = Math.round(base * (0.9 + 0.2 * hash(key + iso)));
  const diff = daysBetween(REF_DATE, iso); // <0 geçmiş
  if (diff >= 0) return { forecast, actual: null };
  const badWeek = diff <= -15 && diff >= -21;
  let mult: number;
  if (badWeek) mult = DIRECTION[key] === 'inflow' ? 0.90 : 1.17; // gelir düşük / gider yüksek → sapma
  else mult = 1 + (hash(iso + key + 'a') - 0.5) * 0.10;          // ±%5
  return { forecast, actual: Math.round(forecast * mult) };
};
