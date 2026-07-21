// Kredi vergi oran konfigürasyonu — HARDCODE DEĞİL, configurable sabit.
// Dayanak: BSMV faiz payı üzerinden %5 (Hesapkurdu); KKDF ticari TL %0, ticari döviz %1,
// tüketici (bireysel/taşıt) %15 (Logo Blog 2026; 88/12944 Karar + KKDF Tebliği Sıra No:6 md.2).
import type { KrediTuru, ParaBirimi } from '../types/loans';

export interface TaxProfile { kkdf: number; bsmv: number }

export const taxConfig: Record<'ticariTL' | 'ticariDoviz' | 'tuketici', TaxProfile> = {
  ticariTL: { kkdf: 0.00, bsmv: 0.05 },   // Muhiku'nun ana durumu
  ticariDoviz: { kkdf: 0.01, bsmv: 0.05 },
  tuketici: { kkdf: 0.15, bsmv: 0.15 },
};

/** Taşıt kredisi tüketici (bireysel) sayılır → KKDF/BSMV %15. Diğer türler ticari. */
export const isConsumerLoan = (krediTuru: KrediTuru): boolean => krediTuru === 'Taşıt';

/** krediTuru + paraBirimi'ne göre doğru vergi profilini seçer. */
export const resolveTaxProfile = (krediTuru: KrediTuru, paraBirimi: ParaBirimi): TaxProfile => {
  if (isConsumerLoan(krediTuru)) return taxConfig.tuketici;
  return paraBirimi === 'USD' ? taxConfig.ticariDoviz : taxConfig.ticariTL;
};
