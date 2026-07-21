// Nakit Akışı (direkt yöntem) veri modeli — docs/cashflow-brief.md SECTION B.
// Sadece operasyonel forecasting; oran/likidite analizi "Nakit & Likidite" sayfasında.

export type CashPeriodMode = 'daily' | 'weekly' | 'monthly';
export type CashDirection = 'inflow' | 'outflow';
export type CashSource = 'ERP' | 'Paraşüt' | 'Manuel' | 'Hesaplanan' | 'Forecast';

export interface CashLine {
  key: string;
  label: { tr: string; en: string };
  direction: CashDirection;
  kategori: string;
  source: CashSource;
}

export interface CashCell {
  date: string;          // bucket etiketi (gün/hafta başı/ay)
  amount: number;        // planlanan (forecast) tutar
  isForecast: boolean;   // true → gelecek/tahmin; false → gerçekleşmiş dönem
  actual?: number;       // gerçekleşen (yalnız geçmiş) — varsa gösterimde/varyansta kullanılır
}

export interface CashRow {
  line: CashLine;
  cells: CashCell[];
  total: number;         // dönem içi toplam (gösterim değeri)
}

export interface CashGrid {
  mode: CashPeriodMode;
  dates: string[];       // kolon etiketleri
  isForecast: boolean[]; // kolon bazında tahmin mi
  income: CashRow[];
  expense: CashRow[];
  totalIncome: number[]; // kolon bazında
  totalExpense: number[];
  net: number[];
  balance: number[];     // running/kümülatif
  openingBalance: number;
}

export interface BankAccount {
  id: string;
  banka: string;
  ad: string;
  paraBirimi: 'TRY' | 'USD' | 'EUR';
  bakiyeTRY: number;
  bakiyeOrijinal?: number;
  sonHareket: string;
  durum: 'Aktif' | 'Bloke';
}

export interface CashScenario {
  key: 'best' | 'base' | 'worst';
  label: { tr: string; en: string };
  multipliers: { inflow: number; outflow: number };
}

export interface VarianceRow {
  label: string;
  forecast: number;
  actual: number;
  variancePct: number;      // (actual − forecast) / forecast
  cumForecast: number;
  cumActual: number;
  cumVariancePct: number;
  horizonDays: number;      // dönem başından itibaren gün
  band: number;             // eşik (0.05 ≤30g, 0.15 ≤90g)
  withinBand: boolean;
}

export interface WeekPoint {
  week: number;
  weekStart: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulativeBalance: number;
}
