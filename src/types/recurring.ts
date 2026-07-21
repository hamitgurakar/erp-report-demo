// Recurring işlem motoru — iCalendar RFC 5545 (RRULE + RDATE/EXDATE + RECURRENCE-ID override).
// docs/cashflow-brief.md SECTION C. Yalnız manuel gelir/gider; kredi/çek Section A motorundan gelir.

export type TxTip = 'Gelir' | 'Gider';
export type OccurrenceDurum = 'planned' | 'moved' | 'cancelled' | 'paid' | 'skipped';
export type RecCurrency = 'TRY' | 'USD';
export type EditScope = 'this' | 'thisAndFuture' | 'all';
export type CancelScope = 'this' | 'all';
export type WeekendShift = 'none' | 'onceki' | 'sonraki';

export interface RecurringSeries {
  id: string;
  tip: TxTip;
  kategori: string;
  isim: string;
  tutar: number;
  paraBirimi: RecCurrency;
  dtstart: string;                 // ilk oluşum (ISO)
  rrule: string;                   // 'FREQ=MONTHLY;BYMONTHDAY=1' | 'BYMONTHDAY=-1' (ayın son günü) | '' (tek seferlik)
  rdate?: string[];                // ekstra tarihler
  exdate?: string[];               // atlanan tarihler
  bitis?: { until?: string; count?: number };
  haftaSonuKaydir?: WeekendShift;  // hafta sonuna denk gelirse taşı
}

export interface OccurrenceOverride {
  seriesId: string;
  recurrenceId: string;            // ORİJİNAL oluşum tarihi = kimlik (RECURRENCE-ID)
  yeniTarih?: string;
  yeniTutar?: number;
  durum: OccurrenceDurum;
  gerceklesenTutar?: number;
  gerceklesenTarih?: string;
}

export interface Occurrence {
  seriesId: string;
  recurrenceId: string;            // orijinal (kural) tarih
  tarih: string;                   // efektif tarih (override/hafta-sonu sonrası)
  tip: TxTip;
  kategori: string;
  isim: string;
  tutar: number;
  paraBirimi: RecCurrency;
  durum: OccurrenceDurum;
  gerceklesenTutar?: number;
  gerceklesenTarih?: string;
}

export interface RecurringForecastItem {
  tarih: string;
  kategori: string;
  tip: TxTip;
  tutar: number;
  paraBirimi: RecCurrency;
  isForecast: boolean;             // planlı → true; paid → false (actual)
  seriesId: string;
  recurrenceId: string;
  isim: string;
}

export interface EditChanges {
  yeniTarih?: string;
  yeniTutar?: number;
  isim?: string;
  kategori?: string;
}
