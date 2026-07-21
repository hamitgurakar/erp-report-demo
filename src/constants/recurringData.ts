// Recurring demo seed — docs/cashflow-brief.md SECTION C.5 taksonomisi.
// Yalnız manuel gelir/gider (kredi/çek Section A motorundan gelir).
import type { RecurringSeries, OccurrenceOverride } from '../types/recurring';

export const RECURRING_CATEGORIES = [
  'Kira', 'Yazılım/SaaS', 'Personel/Maaş', 'Tedarikçi', 'Pazarlama', 'Lojistik', 'Vergi', 'Kredi taksiti', 'Çek', 'Diğer',
] as const;

export const recurringSeed: RecurringSeries[] = [
  // Kira — aylık, ayın SON GÜNÜ (BYMONTHDAY=-1), hafta sonuysa önceki iş günü
  { id: 'R-KIRA', tip: 'Gider', kategori: 'Kira', isim: 'Ofis Kirası', tutar: 185_000, paraBirimi: 'TRY', dtstart: '2025-01-31', rrule: 'FREQ=MONTHLY;BYMONTHDAY=-1', haftaSonuKaydir: 'onceki' },
  // Maaş — aylık, ayın 1'i, hafta sonuysa sonraki iş günü
  { id: 'R-MAAS', tip: 'Gider', kategori: 'Personel/Maaş', isim: 'Maaş Bordrosu', tutar: 1_350_000, paraBirimi: 'TRY', dtstart: '2025-01-01', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1', haftaSonuKaydir: 'sonraki' },
  // Yazılım/SaaS — 5 abonelik (bazı USD)
  { id: 'R-GWS', tip: 'Gider', kategori: 'Yazılım/SaaS', isim: 'Google Workspace', tutar: 1_200, paraBirimi: 'USD', dtstart: '2025-01-05', rrule: 'FREQ=MONTHLY;BYMONTHDAY=5' },
  { id: 'R-AWS', tip: 'Gider', kategori: 'Yazılım/SaaS', isim: 'AWS', tutar: 3_400, paraBirimi: 'USD', dtstart: '2025-01-03', rrule: 'FREQ=MONTHLY;BYMONTHDAY=3' },
  { id: 'R-M365', tip: 'Gider', kategori: 'Yazılım/SaaS', isim: 'Microsoft 365', tutar: 42_000, paraBirimi: 'TRY', dtstart: '2025-01-10', rrule: 'FREQ=MONTHLY;BYMONTHDAY=10' },
  { id: 'R-ADOBE', tip: 'Gider', kategori: 'Yazılım/SaaS', isim: 'Adobe Creative Cloud', tutar: 800, paraBirimi: 'USD', dtstart: '2025-01-15', rrule: 'FREQ=MONTHLY;BYMONTHDAY=15' },
  { id: 'R-SLACK', tip: 'Gider', kategori: 'Yazılım/SaaS', isim: 'Slack', tutar: 18_000, paraBirimi: 'TRY', dtstart: '2025-01-20', rrule: 'FREQ=MONTHLY;BYMONTHDAY=20' },
  // Recurring gelir — bakım sözleşmesi
  { id: 'R-BAKIM', tip: 'Gelir', kategori: 'Diğer', isim: 'Bakım Sözleşmesi Geliri', tutar: 220_000, paraBirimi: 'TRY', dtstart: '2025-02-01', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' },
  // Tek seferlik gider / tahsilat
  { id: 'R-DANIS', tip: 'Gider', kategori: 'Diğer', isim: 'Hukuk Danışmanlık (tek sefer)', tutar: 120_000, paraBirimi: 'TRY', dtstart: '2026-08-10', rrule: '' },
  { id: 'R-PROJE', tip: 'Gelir', kategori: 'Diğer', isim: 'Proje Tahsilatı (tek sefer)', tutar: 500_000, paraBirimi: 'TRY', dtstart: '2026-08-15', rrule: '' },
];

export const recurringOverridesSeed: OccurrenceOverride[] = [
  // Kira Temmuz 2026 oluşumu ödenemedi → 5 gün ileri taşındı (moved)
  { seriesId: 'R-KIRA', recurrenceId: '2026-07-31', yeniTarih: '2026-08-05', durum: 'moved' },
  // AWS Haziran 2026 ödendi (actual)
  { seriesId: 'R-AWS', recurrenceId: '2026-06-03', durum: 'paid', gerceklesenTutar: 3_450, gerceklesenTarih: '2026-06-03' },
];
