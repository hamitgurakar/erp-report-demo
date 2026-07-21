// Kredi motoru — saf fonksiyonlar, UI'dan bağımsız. docs/cashflow-brief.md SECTION A.2
import type { Loan, LoanInstallment, LoanSummary, EarlyPayoff, KrediTuru } from '../../types/loans';
import { resolveTaxProfile, isConsumerLoan } from '../../constants/taxConfig';

const round2 = (x: number) => Math.round(x * 100) / 100;

/** ISO tarihe ay ekler (gün taşmasına dayanıklı). */
export const addMonths = (iso: string, months: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const base = new Date(Date.UTC(y, (m - 1) + months, 1));
  const daysInTarget = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, daysInTarget));
  return base.toISOString().slice(0, 10);
};

/** İki ISO tarih arası gün farkı (b − a). */
export const daysBetween = (a: string, b: string): number => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
};

const monthsPerPeriodOf = (loan: Loan) => (loan.odemeSikligi === '3 Aylık' ? 3 : 1);
/** Dönemsel faiz: aylık ödemede aylık oran; 3 aylıkta bileşik 3-aylık oran (plan sıfıra kapanır). */
const periodicRateOf = (loan: Loan) => (loan.odemeSikligi === '3 Aylık' ? Math.pow(1 + loan.faizOraniAylik, 3) - 1 : loan.faizOraniAylik);

/** Anüite taksit tutarı: P·[r(1+r)^n]/[(1+r)^n−1]. */
export const annuityInstallment = (P: number, r: number, n: number): number => {
  if (n <= 0) return 0;
  if (r === 0) return P / n;
  const f = Math.pow(1 + r, n);
  return P * (r * f) / (f - 1);
};

/**
 * Amortisman planı üretir. Her taksit sabit; faiz front-loaded; son taksitte kalanAnapara ≈ 0.
 * Vergiler faiz payı üzerinden (BSMV/KKDF) — krediTuru + paraBirimi profilinden.
 */
export const generateAmortization = (loan: Loan): LoanInstallment[] => {
  const n = loan.vadeAy;
  const r = periodicRateOf(loan);
  const mpp = monthsPerPeriodOf(loan);
  const { bsmv, kkdf } = resolveTaxProfile(loan.krediTuru, loan.paraBirimi);
  const taksit = annuityInstallment(loan.anapara, r, n);

  const rows: LoanInstallment[] = [];
  let bal = loan.anapara; // tam hassasiyetle taşınır (drift önlemi)
  for (let k = 1; k <= n; k++) {
    const faiz = bal * r;
    let anaparaPayi = taksit - faiz;
    // Son taksit: kalan anaparayı tam kapat (yuvarlama artığı ±kuruş).
    if (k === n) anaparaPayi = bal;
    bal -= anaparaPayi;
    const faizPayi = round2(faiz);
    rows.push({
      loanId: loan.id,
      taksitNo: `${k}/${n}`,
      index: k,
      vadeTarihi: addMonths(loan.kullandirimTarihi, k * mpp),
      taksitTutari: round2(k === n ? anaparaPayi + faiz : taksit),
      anaparaPayi: round2(anaparaPayi),
      faizPayi,
      bsmvPayi: round2(faizPayi * bsmv),
      kkdfPayi: round2(faizPayi * kkdf),
      kalanAnapara: round2(Math.max(0, bal)),
      durum: k <= loan.odenenTaksitSayisi ? 'Ödendi' : 'Ödenecek',
    });
  }
  return rows;
};

/** Kredi türev alanlarını döndürür (SECTION A.1 Hesaplanan alanlar). */
export const summarize = (loan: Loan): LoanSummary => {
  const sched = generateAmortization(loan);
  const paid = Math.min(loan.odenenTaksitSayisi, sched.length);
  const taksitTutari = round2(annuityInstallment(loan.anapara, periodicRateOf(loan), loan.vadeAy));
  const krediToplamOdeme = round2(sched.reduce((s, i) => s + i.taksitTutari, 0));
  const odenenTaksitTutari = round2(sched.slice(0, paid).reduce((s, i) => s + i.taksitTutari, 0));
  const odenenFaizVeMasraflar = round2(sched.slice(0, paid).reduce((s, i) => s + i.faizPayi + i.bsmvPayi + i.kkdfPayi, 0));
  const kalanAnapara = paid > 0 ? sched[paid - 1].kalanAnapara : loan.anapara;
  return {
    taksitTutari,
    krediToplamOdeme,
    odenenTaksitSayisi: paid,
    odenenTaksitTutari,
    kalanTaksitSayisi: loan.vadeAy - paid,
    kalanOdemeTutari: round2(krediToplamOdeme - odenenTaksitTutari),
    odenenFaizVeMasraflar,
    kalanAnapara,
  };
};

const isVariableRate = (krediTuru: KrediTuru) => krediTuru === 'Rotatif' || krediTuru === 'Spot';

/**
 * Erken kapama hesaplayıcı. asOfDate motora dışarıdan verilir (deterministik).
 * Erken ödeme ücreti sadece ticari kredide (tüketici → 0), TCMB tavanı — "yaklaşık".
 */
export const computeEarlyPayoff = (loan: Loan, asOfDate: string): EarlyPayoff => {
  const sched = generateAmortization(loan);
  const paid = Math.min(loan.odenenTaksitSayisi, sched.length);
  const taksit = annuityInstallment(loan.anapara, periodicRateOf(loan), loan.vadeAy);
  const kalanAnapara = paid > 0 ? sched[paid - 1].kalanAnapara : loan.anapara;
  const kalanTaksitSayisi = loan.vadeAy - paid;
  const kalanOdemeTutari = round2(kalanTaksitSayisi * taksit);

  // Birikmiş günlük faiz: son ödenen taksitten (yoksa kullandırımdan) asOfDate'e.
  const lastPaidDate = paid > 0 ? sched[paid - 1].vadeTarihi : loan.kullandirimTarihi;
  const gecenGun = Math.max(0, daysBetween(lastPaidDate, asOfDate));
  const birikmisGunlukFaiz = round2(kalanAnapara * loan.faizOraniAylik / 30 * gecenGun);

  // Erken ödeme ücreti — mevzuat tavanı (yaklaşık).
  let erkenOdemeUcreti = 0;
  if (!isConsumerLoan(loan.krediTuru)) {
    if (isVariableRate(loan.krediTuru)) {
      erkenOdemeUcreti = kalanAnapara * 0.02;                       // değişken: azami %2
    } else if (loan.paraBirimi === 'TRY') {
      const yillikBilesik = Math.pow(1 + loan.faizOraniAylik, 12) - 1;
      // Kalan ağırlıklı ortalama vade (ay), anapara payına göre ağırlıklı.
      const remaining = sched.slice(paid);
      const wSum = remaining.reduce((s, i) => s + i.anaparaPayi, 0) || 1;
      const agirlikliVadeAy = remaining.reduce((s, i) => s + i.anaparaPayi * (i.index - paid) * monthsPerPeriodOf(loan), 0) / wSum;
      erkenOdemeUcreti = kalanAnapara * (yillikBilesik * 0.05 + agirlikliVadeAy * 0.0020);
    } else {
      erkenOdemeUcreti = kalanAnapara * 0.02;                       // döviz ticari → %2 tavan
    }
  }
  erkenOdemeUcreti = round2(erkenOdemeUcreti);

  const erkenKapamaTutari = round2(kalanAnapara + birikmisGunlukFaiz + erkenOdemeUcreti);
  const tasarruf = round2(kalanOdemeTutari - erkenKapamaTutari);
  const tasarrufYuzdesi = kalanOdemeTutari ? tasarruf / kalanOdemeTutari : 0;

  return { kalanAnapara, birikmisGunlukFaiz, erkenOdemeUcreti, erkenKapamaTutari, kalanOdemeTutari, tasarruf, tasarrufYuzdesi, yaklasik: true };
};
