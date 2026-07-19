// ═══════════════════════════════════════════════════════════════════════════
// Finans Suite — sayfa-özel demo veri (P0 seed).
// financeData.ts (multi-period) ve temettü dataset'i KAYNAK-of-truth'tur; burada
// yalnızca sayfaların türetemediği ek demo alanlar mock'lanır. Deterministik,
// gerçekçi TR isim/tutarları. Değerler TRY tabanında; USD = değer / fxRate.
// ═══════════════════════════════════════════════════════════════════════════
import type { FinSource } from '../types/finance';

type Bi = { tr: string; en: string };

// ── SAYFA 1 — Gelir & Karlılık ──────────────────────────────────────────────
export interface SegmentProfit {
  segment: Bi; revenue: number; grossProfit: number; grossMargin: number; revShare: number; yoy: number;
}
export const segmentProfitability: SegmentProfit[] = [
  { segment: { tr: 'Yurt İçi B2B', en: 'Domestic B2B' }, revenue: 18_600_000, grossProfit: 6_510_000, grossMargin: 35.0, revShare: 54.4, yoy: 14.2 },
  { segment: { tr: 'Yurt İçi B2C', en: 'Domestic B2C' }, revenue: 9_100_000, grossProfit: 3_367_000, grossMargin: 37.0, revShare: 26.6, yoy: 9.8 },
  { segment: { tr: 'Yurt Dışı İhracat', en: 'Export' }, revenue: 4_800_000, grossProfit: 1_872_000, grossMargin: 39.0, revShare: 14.0, yoy: 41.3 },
  { segment: { tr: 'Pazaryeri', en: 'Marketplace' }, revenue: 1_700_000, grossProfit: 493_000, grossMargin: 29.0, revShare: 5.0, yoy: 22.6 },
];

/** Brüt marj köprüsü (PVM): önceki marj → fiyat/hacim/miks/maliyet → cari marj (pp). */
export interface PVMDriver { key: Bi; pp: number }
export const marginBridgePVM: { start: number; drivers: PVMDriver[]; end: number } = {
  start: 39.4,
  drivers: [
    { key: { tr: 'Fiyat', en: 'Price' }, pp: 2.1 },
    { key: { tr: 'Hacim', en: 'Volume' }, pp: 0.8 },
    { key: { tr: 'Miks', en: 'Mix' }, pp: -1.3 },
    { key: { tr: 'Maliyet (SMM)', en: 'Cost (COGS)' }, pp: -3.8 },
  ],
  end: 37.2,
};

// ── SAYFA 2 — Nakit & Likidite ──────────────────────────────────────────────
export interface BankAccount {
  bank: string; currency: 'TRY' | 'USD' | 'EUR'; balanceTRY: number; balanceOrig: number; lastTx: string; status: 'active' | 'blocked';
}
export const bankAccounts: BankAccount[] = [
  { bank: 'Ziraat Bankası — Vadesiz', currency: 'TRY', balanceTRY: 5_240_000, balanceOrig: 5_240_000, lastTx: '2026-07-18', status: 'active' },
  { bank: 'İş Bankası — Ticari', currency: 'TRY', balanceTRY: 3_180_000, balanceOrig: 3_180_000, lastTx: '2026-07-17', status: 'active' },
  { bank: 'Garanti BBVA — Döviz', currency: 'USD', balanceTRY: 2_695_000, balanceOrig: 60_000, lastTx: '2026-07-15', status: 'active' },
  { bank: 'Yapı Kredi — EUR', currency: 'EUR', balanceTRY: 1_420_000, balanceOrig: 29_000, lastTx: '2026-07-12', status: 'active' },
  { bank: 'Akbank — Teminat/Bloke', currency: 'TRY', balanceTRY: 850_000, balanceOrig: 850_000, lastTx: '2026-06-30', status: 'blocked' },
];

/** 13-haftalık rolling nakit tahmini (beklenen vs gerçekleşen, K ₺). */
export interface CashWeek { week: string; expected: number; actual: number | null }
export const weeklyCashForecast: CashWeek[] = Array.from({ length: 13 }, (_, i) => {
  const base = 13_000 + i * 180;
  const seasonal = Math.round(Math.sin(i / 2) * 900);
  return {
    week: `H${i + 1}`,
    expected: base + seasonal,
    actual: i < 6 ? base + seasonal + (i % 2 === 0 ? -420 : 310) : null,
  };
});

export interface CCCComponent { key: Bi; days: number }
export const cccComponents: CCCComponent[] = [
  { key: { tr: 'DSO (Alacak)', en: 'DSO' }, days: 58 },
  { key: { tr: 'DIO (Stok)', en: 'DIO' }, days: 47 },
  { key: { tr: 'DPO (Borç)', en: 'DPO' }, days: -52 },
];

// ── SAYFA 3 — Alacak Yönetimi ───────────────────────────────────────────────
export interface ARCustomer {
  customer: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number;
  oldestInvoice: string; riskScore: number; status: 'current' | 'overdue' | 'doubtful';
}
export const arAgingByCustomer: ARCustomer[] = [
  { customer: 'Yıldız Hediyelik A.Ş.', total: 1_240_000, current: 120_000, d1_30: 80_000, d31_60: 90_000, d61_90: 110_000, d90plus: 840_000, oldestInvoice: '2026-02-11', riskScore: 88, status: 'doubtful' },
  { customer: 'Ada Mağazacılık Ltd.', total: 960_000, current: 420_000, d1_30: 310_000, d31_60: 150_000, d61_90: 80_000, d90plus: 0, oldestInvoice: '2026-05-02', riskScore: 42, status: 'overdue' },
  { customer: 'Marmara Perakende', total: 720_000, current: 500_000, d1_30: 160_000, d31_60: 60_000, d61_90: 0, d90plus: 0, oldestInvoice: '2026-06-01', riskScore: 28, status: 'current' },
  { customer: 'Ege Toptan Dağıtım', total: 640_000, current: 210_000, d1_30: 180_000, d31_60: 120_000, d61_90: 90_000, d90plus: 40_000, oldestInvoice: '2026-03-20', riskScore: 61, status: 'overdue' },
  { customer: 'Anadolu Zincir Market', total: 540_000, current: 400_000, d1_30: 90_000, d31_60: 50_000, d61_90: 0, d90plus: 0, oldestInvoice: '2026-06-10', riskScore: 22, status: 'current' },
  { customer: 'Bosphorus Retail Group', total: 480_000, current: 150_000, d1_30: 120_000, d31_60: 110_000, d61_90: 70_000, d90plus: 30_000, oldestInvoice: '2026-04-05', riskScore: 55, status: 'overdue' },
];

export interface CollectionTask {
  customer: string; overdueAmount: number; days: number; lastContact: string; promisedPayment: string | null; assignee: string; status: Bi;
}
export const collectionWorklist: CollectionTask[] = [
  { customer: 'Yıldız Hediyelik A.Ş.', overdueAmount: 1_120_000, days: 92, lastContact: '2026-07-10', promisedPayment: null, assignee: 'Selin Aktaş', status: { tr: 'Yasal takip', en: 'Legal action' } },
  { customer: 'Ege Toptan Dağıtım', overdueAmount: 430_000, days: 44, lastContact: '2026-07-15', promisedPayment: '2026-07-28', assignee: 'Burak Yıldırım', status: { tr: 'Söz alındı', en: 'Promise to pay' } },
  { customer: 'Bosphorus Retail Group', overdueAmount: 330_000, days: 38, lastContact: '2026-07-14', promisedPayment: null, assignee: 'Selin Aktaş', status: { tr: 'Hatırlatıldı', en: 'Reminded' } },
  { customer: 'Ada Mağazacılık Ltd.', overdueAmount: 540_000, days: 22, lastContact: '2026-07-16', promisedPayment: '2026-07-25', assignee: 'Burak Yıldırım', status: { tr: 'İzleniyor', en: 'Monitoring' } },
];

// ── SAYFA 4 — Borç Yönetimi / Ödemeler ──────────────────────────────────────
export interface APInvoice {
  supplier: string; invoiceNo: string; amount: number; dueDate: string; daysLeft: number;
  discountWindow: string | null; discountAmount: number; status: 'upcoming' | 'approaching' | 'overdue' | 'paid';
}
export const apInvoices: APInvoice[] = [
  { supplier: 'Anadolu Ambalaj San.', invoiceNo: 'AA-2026-4471', amount: 320_000, dueDate: '2026-07-07', daysLeft: -12, discountWindow: null, discountAmount: 0, status: 'overdue' },
  { supplier: 'Doğu Tekstil Ltd.', invoiceNo: 'DT-2026-0912', amount: 185_000, dueDate: '2026-07-21', daysLeft: 2, discountWindow: '2/10 net 30', discountAmount: 3_700, status: 'approaching' },
  { supplier: 'Mavi Plastik A.Ş.', invoiceNo: 'MP-2026-1180', amount: 240_000, dueDate: '2026-07-22', daysLeft: 3, discountWindow: '2/10 net 30', discountAmount: 4_800, status: 'approaching' },
  { supplier: 'Kuzey Lojistik', invoiceNo: 'KL-2026-3320', amount: 96_000, dueDate: '2026-08-04', daysLeft: 16, discountWindow: null, discountAmount: 0, status: 'upcoming' },
  { supplier: 'Star Baskı & Etiket', invoiceNo: 'SB-2026-0755', amount: 142_000, dueDate: '2026-07-19', daysLeft: 0, discountWindow: '3/10 net 45', discountAmount: 4_260, status: 'approaching' },
  { supplier: 'Ege Kimya', invoiceNo: 'EK-2026-2201', amount: 210_000, dueDate: '2026-07-02', daysLeft: 0, discountWindow: null, discountAmount: 0, status: 'paid' },
];

export interface APSupplier {
  supplier: string; totalDebt: number; overdue: number; avgPayDays: number; annualVolume: number; ebelgeMatch: number;
}
export const apAgingBySupplier: APSupplier[] = [
  { supplier: 'Anadolu Ambalaj San.', totalDebt: 640_000, overdue: 320_000, avgPayDays: 58, annualVolume: 3_900_000, ebelgeMatch: 94 },
  { supplier: 'Doğu Tekstil Ltd.', totalDebt: 420_000, overdue: 0, avgPayDays: 41, annualVolume: 2_600_000, ebelgeMatch: 100 },
  { supplier: 'Mavi Plastik A.Ş.', totalDebt: 380_000, overdue: 60_000, avgPayDays: 47, annualVolume: 2_100_000, ebelgeMatch: 97 },
  { supplier: 'Star Baskı & Etiket', totalDebt: 260_000, overdue: 0, avgPayDays: 35, annualVolume: 1_400_000, ebelgeMatch: 89 },
  { supplier: 'Kuzey Lojistik', totalDebt: 180_000, overdue: 0, avgPayDays: 39, annualVolume: 980_000, ebelgeMatch: 92 },
];

/** e-Belge mutabakatı (eşleşen / eşleşmeyen alış belgesi). */
export const ebelgeReconciliation = { matched: 1_243, unmatched: 7 };

// ── SAYFA 5 — Vergi & Yasal Uyum (Türkiye 2026) ─────────────────────────────
export interface TaxDeadline {
  declaration: Bi; period: string; fileBy: string; payBy: string; amount: number; status: 'filed' | 'approaching' | 'late';
}
export const taxCalendar2026: TaxDeadline[] = [
  { declaration: { tr: 'KDV-1', en: 'VAT-1' }, period: '2026/06', fileBy: '2026-07-28', payBy: '2026-07-28', amount: 780_000, status: 'approaching' },
  { declaration: { tr: 'Muhtasar (MUHSGK)', en: 'Withholding (MUHSGK)' }, period: '2026/06', fileBy: '2026-07-26', payBy: '2026-07-26', amount: 410_000, status: 'approaching' },
  { declaration: { tr: 'Geçici Vergi Q2', en: 'Provisional Tax Q2' }, period: '2026/Q2', fileBy: '2026-08-17', payBy: '2026-08-17', amount: 1_240_000, status: 'approaching' },
  { declaration: { tr: 'Damga Vergisi', en: 'Stamp Tax' }, period: '2026/06', fileBy: '2026-07-26', payBy: '2026-07-26', amount: 34_000, status: 'approaching' },
  { declaration: { tr: 'e-Defter Berat (Nisan)', en: 'e-Ledger Berat (Apr)' }, period: '2026/04', fileBy: '2026-08-14', payBy: '—', amount: 0, status: 'approaching' },
  { declaration: { tr: 'SGK Prim', en: 'Social Security' }, period: '2026/06', fileBy: '2026-07-26', payBy: '2026-07-31', amount: 520_000, status: 'approaching' },
  { declaration: { tr: 'KDV-1', en: 'VAT-1' }, period: '2026/05', fileBy: '2026-06-28', payBy: '2026-06-28', amount: 710_000, status: 'filed' },
];

export interface EbelgeStatus {
  app: Bi; status: 'active' | 'pending' | 'exempt'; migratedOn: string; threshold: string; lastAction: string;
}
export const ebelgeStatus: EbelgeStatus[] = [
  { app: { tr: 'e-Fatura', en: 'e-Invoice' }, status: 'active', migratedOn: '2022-01-01', threshold: '3M ₺', lastAction: '2026-07-18' },
  { app: { tr: 'e-Arşiv', en: 'e-Archive' }, status: 'active', migratedOn: '2022-01-01', threshold: '3M ₺ / 500K (e-tic.)', lastAction: '2026-07-18' },
  { app: { tr: 'e-İrsaliye', en: 'e-Waybill' }, status: 'pending', migratedOn: '—', threshold: '10M ₺ · 01.07.2026', lastAction: '—' },
  { app: { tr: 'e-Defter', en: 'e-Ledger' }, status: 'active', migratedOn: '2022-01-01', threshold: 'Bilanço esası', lastAction: '2026-06-14' },
  { app: { tr: 'e-SMM', en: 'e-SMM' }, status: 'exempt', migratedOn: '—', threshold: 'Serbest meslek', lastAction: '—' },
];

// ── SAYFA 6 — Borçluluk & Sermaye Yapısı ────────────────────────────────────
export interface DebtItem {
  creditor: string; amount: number; currency: 'TRY' | 'USD' | 'EUR'; rateType: Bi; maturity: string; remainingPrincipal: number; collateral: Bi;
}
export const debtInventory: DebtItem[] = [
  { creditor: 'İş Bankası — Yatırım Kredisi', amount: 8_000_000, currency: 'TRY', rateType: { tr: 'Sabit %48', en: 'Fixed 48%' }, maturity: '2028-03-01', remainingPrincipal: 6_400_000, collateral: { tr: 'İpotek', en: 'Mortgage' } },
  { creditor: 'Ziraat — İşletme Kredisi', amount: 4_500_000, currency: 'TRY', rateType: { tr: 'Değişken', en: 'Variable' }, maturity: '2027-01-15', remainingPrincipal: 3_100_000, collateral: { tr: 'Senet', en: 'Note' } },
  { creditor: 'Garanti — Döviz Kredisi', amount: 2_695_000, currency: 'USD', rateType: { tr: 'Sabit %9', en: 'Fixed 9%' }, maturity: '2026-12-01', remainingPrincipal: 2_695_000, collateral: { tr: 'Teminatsız', en: 'Unsecured' } },
  { creditor: 'Finansal Kiralama (Leasing)', amount: 1_800_000, currency: 'TRY', rateType: { tr: 'Sabit', en: 'Fixed' }, maturity: '2029-06-01', remainingPrincipal: 1_260_000, collateral: { tr: 'Ekipman', en: 'Equipment' } },
];

export interface WACCInput { component: Bi; value: string; source: string; note: Bi }
export const waccInputs: WACCInput[] = [
  { component: { tr: 'Risksiz Oran', en: 'Risk-free Rate' }, value: '%28.0', source: 'TCMB 10Y', note: { tr: 'TL gösterge', en: 'TRY benchmark' } },
  { component: { tr: 'Türkiye ERP', en: 'Turkey ERP' }, value: '%9.30', source: 'Damodaran 07/2026', note: { tr: 'Olgun piyasa %4.17', en: 'Mature market 4.17%' } },
  { component: { tr: 'Beta', en: 'Beta' }, value: '1.15', source: 'Sektör / Sector', note: { tr: 'Perakende/e-tic.', en: 'Retail/e-comm' } },
  { component: { tr: 'Borç Maliyeti', en: 'Cost of Debt' }, value: '%42.0', source: 'Ağırlıklı / Weighted', note: { tr: 'Vergi öncesi', en: 'Pre-tax' } },
  { component: { tr: 'Vergi Oranı', en: 'Tax Rate' }, value: '%25', source: 'Kurumlar / Corporate', note: { tr: '2026', en: '2026' } },
  { component: { tr: 'E/V — D/V', en: 'E/V — D/V' }, value: '62% / 38%', source: 'Bilanço / Balance', note: { tr: 'Defter+PD', en: 'Book+market' } },
];

export interface FXExposure { currency: string; assets: number; liabilities: number }
export const fxPosition: FXExposure[] = [
  { currency: 'USD', assets: 60_000, liabilities: 120_000 },
  { currency: 'EUR', assets: 29_000, liabilities: 41_000 },
];

// ── SAYFA 7 — Değerleme ─────────────────────────────────────────────────────
export interface CompRow { company: string; evEbitda: number; evRevenue: number; pe: number; ebitdaMargin: number; revGrowth: number; note: Bi }
export const compsSet: CompRow[] = [
  { company: 'Moonpig Group', evEbitda: 9.2, evRevenue: 2.4, pe: 14.1, ebitdaMargin: 28, revGrowth: 8, note: { tr: 'Halka açık', en: 'Public' } },
  { company: '1-800-Flowers', evEbitda: 10.0, evRevenue: 0.9, pe: 18.5, ebitdaMargin: 9, revGrowth: 3, note: { tr: 'Halka açık', en: 'Public' } },
  { company: 'Card Factory', evEbitda: 5.8, evRevenue: 1.1, pe: 6.5, ebitdaMargin: 19, revGrowth: 6, note: { tr: 'Halka açık', en: 'Public' } },
  { company: 'Notonthehighstreet', evEbitda: 8.5, evRevenue: 1.9, pe: 0, ebitdaMargin: 15, revGrowth: 12, note: { tr: 'Özel — tahmini', en: 'Private — est.' } },
  { company: 'Medyan / Median', evEbitda: 8.9, evRevenue: 1.5, pe: 14.1, ebitdaMargin: 17, revGrowth: 7, note: { tr: 'Peer medyan', en: 'Peer median' } },
  { company: 'Muhiku', evEbitda: 7.4, evRevenue: 1.3, pe: 11.8, ebitdaMargin: 19, revGrowth: 18, note: { tr: 'Değerlenen', en: 'Subject' } },
];

export interface DCFAssumption { assumption: Bi; value: string; note: Bi }
export const dcfAssumptions: DCFAssumption[] = [
  { assumption: { tr: 'WACC', en: 'WACC' }, value: '%38.5', note: { tr: 'TL nominal', en: 'TRY nominal' } },
  { assumption: { tr: 'Türkiye ERP', en: 'Turkey ERP' }, value: '%9.30', note: { tr: 'Damodaran 07/2026', en: 'Damodaran 07/2026' } },
  { assumption: { tr: 'Terminal Büyüme', en: 'Terminal Growth' }, value: '%25', note: { tr: '≈GSYİH, WACC altında', en: '≈GDP, below WACC' } },
  { assumption: { tr: 'Projeksiyon', en: 'Projection' }, value: '5 yıl / 5 yr', note: { tr: 'Açık dönem', en: 'Explicit period' } },
  { assumption: { tr: 'Senaryo Ağırlığı', en: 'Scenario Weight' }, value: '25 / 50 / 25', note: { tr: 'Kötü/Baz/İyi', en: 'Bear/Base/Bull' } },
  { assumption: { tr: 'DLOM', en: 'DLOM' }, value: '%25', note: { tr: 'Pazarlanabilirlik iskontosu', en: 'Marketability discount' } },
];

/** Football-field: yöntem bazında değer aralıkları (hisse başı ₺). */
export interface FFRange { method: Bi; low: number; high: number }
export const footballField: { ranges: FFRange[]; current: number; aiFairValue: number } = {
  ranges: [
    { method: { tr: 'Comps (EV/EBITDA)', en: 'Comps (EV/EBITDA)' }, low: 5.8, high: 7.9 },
    { method: { tr: 'Comps (EV/Hasılat)', en: 'Comps (EV/Revenue)' }, low: 6.2, high: 8.4 },
    { method: { tr: 'DCF', en: 'DCF' }, low: 6.5, high: 9.6 },
    { method: { tr: 'DCF (DLOM sonrası)', en: 'DCF (post-DLOM)' }, low: 4.9, high: 7.2 },
  ],
  current: 5.8,
  aiFairValue: 7.1,
};

// ── SAYFA 8 — Yatırım & Ortak Getirisi ──────────────────────────────────────
export interface PartnerReturn { partnerId: string; name: string; pct: number; shares: number; cumulativeDiv: number; thisPeriod: number; tsr: number }
export const partnerReturns: PartnerReturn[] = [
  { partnerId: 'abdulhamit', name: 'Abdülhamit Gürakar', pct: 35, shares: 7_000_000, cumulativeDiv: 7_720_850, thisPeriod: 1_120_000, tsr: 24.5 },
  { partnerId: 'ahmet', name: 'Ahmet Üreme', pct: 35, shares: 7_000_000, cumulativeDiv: 7_720_850, thisPeriod: 1_120_000, tsr: 24.5 },
  { partnerId: 'hasan', name: 'Hasan Topalakcı', pct: 30, shares: 6_000_000, cumulativeDiv: 6_598_000, thisPeriod: 960_000, tsr: 23.8 },
];

/** Cap table evrimi — pay dağılımı zaman içinde (%) . */
export interface CapTableSnapshot { period: string; abdulhamit: number; ahmet: number; hasan: number }
export const capTableEvolution: CapTableSnapshot[] = [
  { period: '2022', abdulhamit: 40, ahmet: 40, hasan: 20 },
  { period: '2023', abdulhamit: 38, ahmet: 37, hasan: 25 },
  { period: '2024', abdulhamit: 36, ahmet: 36, hasan: 28 },
  { period: '2025', abdulhamit: 35, ahmet: 35, hasan: 30 },
  { period: '2026', abdulhamit: 35, ahmet: 35, hasan: 30 },
];

/** DuPont 5-faktör (ROE ayrıştırması). */
export interface DuPontFactor { key: Bi; value: number; unit: string }
export const dupontFactors: DuPontFactor[] = [
  { key: { tr: 'Vergi Yükü', en: 'Tax Burden' }, value: 0.75, unit: 'x' },
  { key: { tr: 'Faiz Yükü', en: 'Interest Burden' }, value: 0.82, unit: 'x' },
  { key: { tr: 'Faaliyet Marjı', en: 'Operating Margin' }, value: 14.2, unit: '%' },
  { key: { tr: 'Aktif Devir', en: 'Asset Turnover' }, value: 1.35, unit: 'x' },
  { key: { tr: 'Özkaynak Çarpanı', en: 'Equity Multiplier' }, value: 2.10, unit: 'x' },
];

// ── SAYFA 9 — Finansal Sağlık Skorkartı ─────────────────────────────────────
export interface ScoreCategory { key: Bi; score: number; grade: string; weight: number; trend: 'up' | 'down' | 'flat' }
export const scorecardCategories: ScoreCategory[] = [
  { key: { tr: 'Nakit-Likidite', en: 'Cash-Liquidity' }, score: 68, grade: 'C', weight: 18, trend: 'down' },
  { key: { tr: 'Karlılık', en: 'Profitability' }, score: 86, grade: 'A', weight: 16, trend: 'up' },
  { key: { tr: 'Finansal Sağlık', en: 'Financial Health' }, score: 74, grade: 'B', weight: 15, trend: 'flat' },
  { key: { tr: 'Sermaye Verimliliği', en: 'Capital Efficiency' }, score: 81, grade: 'A', weight: 13, trend: 'up' },
  { key: { tr: 'Büyüme', en: 'Growth' }, score: 79, grade: 'B', weight: 12, trend: 'up' },
  { key: { tr: 'Ortak Getirisi', en: 'Shareholder Returns' }, score: 72, grade: 'B', weight: 10, trend: 'flat' },
  { key: { tr: 'Değerleme', en: 'Valuation' }, score: 58, grade: 'C', weight: 8, trend: 'down' },
  { key: { tr: 'Yönetim Kalitesi', en: 'Management Quality' }, score: 70, grade: 'B', weight: 8, trend: 'flat' },
];
export const compositeScore = { score: 74, grade: 'B' };

export interface RiskModel { model: Bi; value: number; zone: Bi; trend: 'up' | 'down' | 'flat' }
export const riskModels: RiskModel[] = [
  { model: { tr: 'Altman Z-Score', en: 'Altman Z-Score' }, value: 3.4, zone: { tr: 'Güvenli', en: 'Safe' }, trend: 'up' },
  { model: { tr: 'Piotroski F-Score', en: 'Piotroski F-Score' }, value: 6, zone: { tr: 'Orta-güçlü', en: 'Moderate' }, trend: 'flat' },
  { model: { tr: 'Beneish M-Score', en: 'Beneish M-Score' }, value: -1.9, zone: { tr: 'Eşik üstü — izle', en: 'Above threshold' }, trend: 'down' },
];

// ── SAYFA 10 — CFO Kokpiti (roll-up) ────────────────────────────────────────
export interface ModuleHealth { moduleKey: string; module: Bi; score: number; grade: string; trend: 'up' | 'down' | 'flat'; openAlerts: number; repKey: string }
export const moduleHealth: ModuleHealth[] = [
  { moduleKey: 'income', module: { tr: 'Gelir & Karlılık', en: 'Income & Profitability' }, score: 86, grade: 'A', trend: 'up', openAlerts: 1, repKey: 'muhasebe__0' },
  { moduleKey: 'cash', module: { tr: 'Nakit & Likidite', en: 'Cash & Liquidity' }, score: 68, grade: 'C', trend: 'down', openAlerts: 2, repKey: 'muhasebe__1' },
  { moduleKey: 'ar', module: { tr: 'Alacak', en: 'Receivables' }, score: 64, grade: 'C', trend: 'down', openAlerts: 2, repKey: 'muhasebe__2' },
  { moduleKey: 'ap', module: { tr: 'Borç/Ödeme', en: 'Payables' }, score: 76, grade: 'B', trend: 'flat', openAlerts: 1, repKey: 'muhasebe__3' },
  { moduleKey: 'tax', module: { tr: 'Vergi & Uyum', en: 'Tax & Compliance' }, score: 71, grade: 'B', trend: 'flat', openAlerts: 1, repKey: 'muhasebe__4' },
  { moduleKey: 'leverage', module: { tr: 'Borçluluk', en: 'Leverage' }, score: 73, grade: 'B', trend: 'down', openAlerts: 1, repKey: 'muhasebe__5' },
  { moduleKey: 'valuation', module: { tr: 'Değerleme', en: 'Valuation' }, score: 58, grade: 'C', trend: 'flat', openAlerts: 0, repKey: 'muhasebe__6' },
  { moduleKey: 'returns', module: { tr: 'Ortak Getirisi', en: 'Shareholder Returns' }, score: 72, grade: 'B', trend: 'flat', openAlerts: 0, repKey: 'muhasebe__7' },
];

export interface RollupAlert {
  severity: 'critical' | 'warning' | 'watch'; moduleKey: string; module: Bi; text: Bi; metric: string; threshold: string; action: Bi; owner: string; repKey: string;
}
export const rollupAlerts: RollupAlert[] = [
  { severity: 'critical', moduleKey: 'tax', module: { tr: 'Vergi', en: 'Tax' }, text: { tr: 'Geçici Vergi Q2 tahakkuku ₺1.24M; nakit yetersiz görünüyor.', en: 'Provisional tax Q2 ₺1.24M; cash looks short.' }, metric: '₺1.24M', threshold: '2026-08-17', action: { tr: 'Tahsilat öne çek', en: 'Accelerate collections' }, owner: 'Ahmet Üreme', repKey: 'muhasebe__4' },
  { severity: 'critical', moduleKey: 'ar', module: { tr: 'Alacak', en: 'Receivables' }, text: { tr: 'Yıldız Hediyelik ₺840K 90+ gün; şüpheli.', en: 'Yıldız Hediyelik ₺840K 90+ days; doubtful.' }, metric: '₺840K', threshold: '90+ gün', action: { tr: 'Yasal takip', en: 'Legal action' }, owner: 'Selin Aktaş', repKey: 'muhasebe__2' },
  { severity: 'warning', moduleKey: 'cash', module: { tr: 'Nakit', en: 'Cash' }, text: { tr: 'CCC 68→81 güne çıktı; DSO kaynaklı.', en: 'CCC rose 68→81 days; DSO-driven.' }, metric: '81 gün', threshold: '<70 gün', action: { tr: 'Alacak sayfası', en: 'Receivables page' }, owner: 'Selin Aktaş', repKey: 'muhasebe__1' },
  { severity: 'warning', moduleKey: 'ap', module: { tr: 'Ödeme', en: 'Payables' }, text: { tr: '3 faturada 2/10 iskonto penceresi kapanıyor (₺12.8K).', en: '3 invoices: 2/10 discount window closing (₺12.8K).' }, metric: '₺12.8K', threshold: '2 gün', action: { tr: 'Ödeme planla', en: 'Schedule payment' }, owner: 'Burak Yıldırım', repKey: 'muhasebe__3' },
  { severity: 'watch', moduleKey: 'leverage', module: { tr: 'Borçluluk', en: 'Leverage' }, text: { tr: 'Döviz açık pozisyon $60K + €12K; kur riski.', en: 'FX short position $60K + €12K; currency risk.' }, metric: '$72K', threshold: '—', action: { tr: 'Borçluluk sayfası', en: 'Leverage page' }, owner: 'Ahmet Üreme', repKey: 'muhasebe__5' },
];

// Yardımcı: kaynak dağılımı gösterimi için (badge demo)
export const DEMO_SOURCE_MIX: Record<string, FinSource> = {
  revenue: 'erp', cogs: 'erp', opex: 'parasut', tax: 'parasut', valuation: 'manual', score: 'computed',
};
