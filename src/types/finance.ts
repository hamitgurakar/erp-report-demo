// Finans — Katman A (Yönetim > Finansal Veriler) veri modeli.
// docs/finance-brief.md §2/§3/§7/§9. Değerler TRY tabanında; USD = değer / period.fxRate.

export type FinCurrency = 'TRY' | 'USD';
export type FinSource = 'erp' | 'parasut' | 'manual' | 'computed';
export type PeriodType = 'annual' | 'quarter';
export type ViewMode = 'absolute' | 'yoy' | 'pct';
export type OrderMode = 'newestLeft' | 'newestRight';
export type InflationMethod = 'nominal' | 'ias29';
export type PartnerId = 'abdulhamit' | 'ahmet' | 'hasan';

export interface FinancialPeriod {
  id: string;          // 'A2025' benzeri benzersiz kimlik
  type: PeriodType;
  label: string;       // '2025' | '2026/Ç2'
  fxRate: number;      // USD/TRY (dönem)
  sharePrice: number;  // 1 hisse fiyatı (TRY) — EPS/PD hesabı için
  inflation: InflationMethod;
}

/** Bir mali tablo satırı. values: periodId → TRY (raw). computed satırlar render'da türetilir. */
export interface StatementLine {
  key: string;
  labelKey: string;        // etiket + "i" tooltip term anahtarı
  source: FinSource;
  isSubtotal?: boolean;
  isMargin?: boolean;      // oran satırı (değişim pp cinsinden)
  group?: string;          // grup/kategori kimliği (toggle)
  values: Record<string, number | null>;  // yalnızca raw satırlarda dolu
}

/** Toggle ile açılan grup başlığı (Bilanço / Nakit Akışı / Gider Ağacı). */
export interface StatementGroup {
  id: string;
  labelKey: string;
  lines: StatementLine[];
}

/** Temettü olayı (§7) — beyan / ödeme; distributionId ile gruplu. */
export interface DividendEvent {
  id: string;
  partnerId: PartnerId;
  type: 'beyan' | 'odeme';
  date: string;            // ISO YYYY-MM-DD
  amountTRY: number;
  fxRate?: number;
  distributionId?: string;
  note?: string;
}

export interface Partner {
  id: PartnerId;
  name: string;            // 3 ortak (gerçek isim — brief §1 istisnası)
  pct: number;
}

/** Audit / değişiklik geçmişi girişi (§2). */
export interface AuditEntry {
  id: string;
  ts: number;
  user: string;
  tab: string;
  itemKey: string;
  itemLabel: string;
  periodId: string;
  periodLabel: string;
  oldValue: number | null;
  newValue: number | null;
  sourceNote?: string;     // 'ERP→düzenlendi' gibi
}
