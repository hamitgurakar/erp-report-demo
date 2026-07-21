// Nakit Akışı besleme hook'u (stub) — docs/cashflow-brief.md SECTION A.3.
// Onaylı kredi taksitleri + çek vadeleri → kategori bazlı "scheduled outflow".
// Faz 2 (Nakit Akışı sayfası) bu fonksiyonu tüketecek. UI YOK.
import type { Loan, Check } from '../../types/loans';
import { loansSeed, checksSeed } from '../../constants/loansData';
import { generateAmortization } from './loanEngine';

export interface ScheduledOutflow {
  tarih: string;               // ISO vade tarihi
  kategori: 'Kredi' | 'Çek';
  tutar: number;               // kredinin/çekin kendi para biriminde
  paraBirimi: 'TRY' | 'USD';
  kaynak: 'Manuel';
  ref: string;                 // kredi no / çek no
  aciklama?: string;
}

export interface DateRange { from: string; to: string }

const inRange = (d: string, r: DateRange) => d >= r.from && d <= r.to;

/**
 * Verilen tarih aralığındaki planlı nakit çıkışlarını döndürür:
 * - Kredi: ödenmemiş (Ödenecek/Gecikti) taksitlerin vade+tutarı
 * - Çek: verilen ve henüz ödenmemiş çek/senetlerin vadesi (nakit çıkışı)
 * Tarihe göre artan sıralı.
 */
export const getScheduledOutflows = (
  range: DateRange,
  loans: Loan[] = loansSeed,
  checks: Check[] = checksSeed,
): ScheduledOutflow[] => {
  const out: ScheduledOutflow[] = [];

  for (const loan of loans) {
    for (const inst of generateAmortization(loan)) {
      if (inst.durum === 'Ödendi') continue;
      if (!inRange(inst.vadeTarihi, range)) continue;
      out.push({
        tarih: inst.vadeTarihi, kategori: 'Kredi', tutar: inst.taksitTutari,
        paraBirimi: loan.paraBirimi, kaynak: 'Manuel', ref: `${loan.krediNo} · ${inst.taksitNo}`,
        aciklama: `${loan.banka} · ${loan.sirket}`,
      });
    }
  }

  for (const c of checks) {
    if (c.yon !== 'Verilen' || c.durum === 'Ödendi') continue; // yalnız çıkış (verilen) ve açık
    if (!inRange(c.vade, range)) continue;
    out.push({
      tarih: c.vade, kategori: 'Çek', tutar: c.tutar,
      paraBirimi: 'TRY', kaynak: 'Manuel', ref: c.cekNo,
      aciklama: `${c.odemeTipi} · ${c.banka} · ${c.sirket}`,
    });
  }

  return out.sort((a, b) => a.tarih.localeCompare(b.tarih));
};

/** Alınan çekler → alacak tarafı (nakit girişi) — Faz 2 için yardımcı. */
export const getScheduledInflows = (range: DateRange, checks: Check[] = checksSeed): ScheduledOutflow[] =>
  checks
    .filter((c) => c.yon === 'Alınan' && c.durum !== 'Ödendi' && inRange(c.vade, range))
    .map((c) => ({ tarih: c.vade, kategori: 'Çek' as const, tutar: c.tutar, paraBirimi: 'TRY' as const, kaynak: 'Manuel' as const, ref: c.cekNo, aciklama: `${c.odemeTipi} · ${c.banka} · ${c.sirket}` }))
    .sort((a, b) => a.tarih.localeCompare(b.tarih));
