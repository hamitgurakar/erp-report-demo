// Finans — Katman A mock verisi (docs/finance-brief.md). Deterministik.
// Değerler TRY tabanında; USD = değer / period.fxRate. Çok-dönem: 6 yıl (annual) + 8 çeyrek.
import type {
  FinancialPeriod, FinSource, DividendEvent, Partner, PartnerId,
} from '../types/finance';

// ── Ortaklar / Cap table (§1) ───────────────────────────────────────────────
export const PARTNERS: Partner[] = [
  { id: 'abdulhamit', name: 'Abdülhamit Gürakar', pct: 35 },
  { id: 'ahmet', name: 'Ahmet Üreme', pct: 35 },
  { id: 'hasan', name: 'Hasan Topalakcı', pct: 30 },
];
export const TOTAL_SHARES = 20_000_000;
export const REGISTERED_CAPITAL = 20_000_000;

// ── Dönemler (6 yıl annual + 8 çeyrek) ──────────────────────────────────────
const A = (label: string, fxRate: number, sharePrice: number): FinancialPeriod =>
  ({ id: label, type: 'annual', label, fxRate, sharePrice, inflation: 'nominal' });
const Q = (label: string, fxRate: number, sharePrice: number): FinancialPeriod =>
  ({ id: label, type: 'quarter', label, fxRate, sharePrice, inflation: 'nominal' });

export const PERIODS_ANNUAL: FinancialPeriod[] = [
  A('2020', 7.0, 1.2), A('2021', 10.5, 1.8), A('2022', 18.6, 2.6),
  A('2023', 29.0, 3.4), A('2024', 35.0, 4.6), A('2025', 42.9, 5.4),
];
export const PERIODS_QUARTER: FinancialPeriod[] = [
  Q('2024/Q3', 33.5, 4.1), Q('2024/Q4', 34.9, 4.6), Q('2025/Q1', 37.8, 4.8), Q('2025/Q2', 38.9, 5.0),
  Q('2025/Q3', 40.5, 5.2), Q('2025/Q4', 42.9, 5.4), Q('2026/Q1', 43.8, 5.6), Q('2026/Q2', 44.9, 5.8),
];
export const ALL_PERIODS: FinancialPeriod[] = [...PERIODS_ANNUAL, ...PERIODS_QUARTER];

// ── Hasılat çapa değerleri ──────────────────────────────────────────────────
const REV: Record<string, number> = {
  '2020': 9_200_000, '2021': 13_400_000, '2022': 19_100_000, '2023': 24_300_000, '2024': 29_000_000, '2025': 34_200_000,
  '2024/Q3': 7_600_000, '2024/Q4': 7_900_000, '2025/Q1': 8_000_000, '2025/Q2': 8_300_000,
  '2025/Q3': 8_500_000, '2025/Q4': 9_200_000, '2026/Q1': 8_900_000, '2026/Q2': 9_300_000,
};
const r1 = (n: number) => Math.round(n / 1000) * 1000;
const isAnnual = (id: string) => !id.includes('/');

// ═══════════════════════════════════════════════════════════════════════════
// ETİKETLER (labelKey → TR/EN) + kaynak
// ═══════════════════════════════════════════════════════════════════════════
export const LINE_LABELS: Record<string, { tr: string; en: string }> = {
  // income
  revenue: { tr: 'Hasılat', en: 'Revenue' },
  cogs: { tr: 'SMM', en: 'COGS' },
  grossProfit: { tr: 'Brüt Kâr', en: 'Gross Profit' },
  opex: { tr: 'Faaliyet Giderleri', en: 'Operating Expenses' },
  ebit: { tr: 'Esas Faaliyet Kârı', en: 'Operating Income' },
  da: { tr: 'Amortisman', en: 'Depreciation & Amortization' },
  ebitda: { tr: 'FAVÖK', en: 'EBITDA' },
  nonOp: { tr: 'Faaliyet Dışı Gelir/Gider', en: 'Non-operating Income/Expense' },
  netFin: { tr: 'Finansman Giderleri (net)', en: 'Net Financial Expenses' },
  pretax: { tr: 'Vergi Öncesi Kâr', en: 'Pre-tax Profit' },
  tax: { tr: 'Vergi', en: 'Tax' },
  netIncome: { tr: 'Net Kâr', en: 'Net Income' },
  grossMargin: { tr: 'Brüt Marj %', en: 'Gross Margin %' },
  ebitdaMargin: { tr: 'FAVÖK Marjı %', en: 'EBITDA Margin %' },
  netMargin: { tr: 'Net Marj %', en: 'Net Margin %' },
  effTax: { tr: 'Efektif Vergi Oranı %', en: 'Effective Tax Rate %' },
  eps: { tr: 'Hisse Başına Kâr (EPS)', en: 'Earnings per Share (EPS)' },
  dps: { tr: 'Hisse Başına Temettü', en: 'Dividend per Share' },
  payout: { tr: 'Temettü Dağıtım Oranı %', en: 'Dividend Payout Ratio %' },
  // balance
  currentAssets: { tr: 'Dönen Varlıklar', en: 'Current Assets' },
  cash: { tr: 'Nakit ve Nakit Benzerleri', en: 'Cash & Equivalents' },
  ar: { tr: 'Ticari Alacaklar', en: 'Accounts Receivable' },
  inventory: { tr: 'Stoklar', en: 'Inventory' },
  otherCA: { tr: 'Diğer Dönen Varlıklar', en: 'Other Current Assets' },
  nonCurrentAssets: { tr: 'Duran Varlıklar', en: 'Non-current Assets' },
  ppe: { tr: 'Maddi Duran Varlıklar', en: 'Property, Plant & Equipment' },
  intangibles: { tr: 'Maddi Olmayan Duran Varlıklar', en: 'Intangible Assets' },
  otherNCA: { tr: 'Diğer Duran Varlıklar', en: 'Other Non-current Assets' },
  totalAssets: { tr: 'Toplam Varlıklar', en: 'Total Assets' },
  currentLiab: { tr: 'Kısa Vadeli Yükümlülükler', en: 'Current Liabilities' },
  ap: { tr: 'Ticari Borçlar', en: 'Accounts Payable' },
  stDebt: { tr: 'Finansal Borçlar (KV)', en: 'Short-term Debt' },
  otherCL: { tr: 'Diğer KV Yükümlülükler', en: 'Other Current Liabilities' },
  nonCurrentLiab: { tr: 'Uzun Vadeli Yükümlülükler', en: 'Non-current Liabilities' },
  ltDebt: { tr: 'Finansal Borçlar (UV)', en: 'Long-term Debt' },
  otherNCL: { tr: 'Diğer UV Yükümlülükler', en: 'Other Non-current Liabilities' },
  totalLiab: { tr: 'Toplam Yükümlülükler', en: 'Total Liabilities' },
  equity: { tr: 'Toplam Özkaynaklar', en: 'Total Equity' },
  paidCapital: { tr: 'Ödenmiş Sermaye', en: 'Paid-in Capital' },
  retained: { tr: 'Geçmiş Yıllar Kârları', en: 'Retained Earnings' },
  periodNet: { tr: 'Dönem Net Kârı', en: 'Net Income for Period' },
  totalResources: { tr: 'Toplam Kaynaklar', en: 'Total Resources' },
  netWorkingCapital: { tr: 'Net İşletme Sermayesi', en: 'Net Working Capital' },
  totalDebt: { tr: 'Toplam Borç', en: 'Total Debt' },
  netDebt: { tr: 'Net Borç', en: 'Net Debt' },
  bvps: { tr: 'Hisse Başına Defter Değeri', en: 'Book Value per Share' },
  // cashflow
  cfNet: { tr: 'Net Kâr', en: 'Net Income' },
  cfDA: { tr: 'Amortisman', en: 'Depreciation & Amortization' },
  cfWC: { tr: 'İşletme Sermayesi Değişimi', en: 'Change in Working Capital' },
  operatingCF: { tr: 'İşletme Nakit Akışı', en: 'Operating Cash Flow' },
  capex: { tr: 'Yatırım Harcaması (CapEx)', en: 'Capital Expenditure' },
  investingCF: { tr: 'Yatırım Nakit Akışı', en: 'Investing Cash Flow' },
  cfDebt: { tr: 'Net Kredi Hareketi', en: 'Net Borrowing' },
  cfDiv: { tr: 'Temettü Ödemesi', en: 'Dividends Paid' },
  financingCF: { tr: 'Finansman Nakit Akışı', en: 'Financing Cash Flow' },
  fcf: { tr: 'Serbest Nakit Akışı', en: 'Free Cash Flow' },
  netChange: { tr: 'Net Nakit Değişimi', en: 'Net Change in Cash' },
  beginCash: { tr: 'Dönem Başı Nakit', en: 'Beginning Cash' },
  endCash: { tr: 'Dönem Sonu Nakit', en: 'Ending Cash' },
  fcfMargin: { tr: 'FCF Marjı %', en: 'FCF Margin %' },
  fcfPerShare: { tr: 'Hisse Başına FCF', en: 'FCF per Share' },
  // expense categories
  personnel: { tr: 'Personel Giderleri', en: 'Personnel Expenses' },
  marketing: { tr: 'Pazarlama & Reklam', en: 'Marketing & Advertising' },
  ga: { tr: 'Genel Yönetim (G&A)', en: 'General & Admin (G&A)' },
  operations: { tr: 'Operasyon', en: 'Operations' },
  expFinancing: { tr: 'Finansman Giderleri', en: 'Financing Expenses' },
  taxLegal: { tr: 'Vergi & Yasal', en: 'Tax & Legal' },
  totalOpex: { tr: 'Toplam OPEX', en: 'Total OPEX' },
  // expense items
  salaries: { tr: 'Maaşlar', en: 'Salaries' }, sgk: { tr: 'SGK Primleri', en: 'Social Security' },
  severance: { tr: 'Kıdem / İhbar Tazminatı', en: 'Severance' }, benefits: { tr: 'Yan Haklar', en: 'Fringe Benefits' },
  overtime: { tr: 'Ek Mesai', en: 'Overtime' },
  metaAds: { tr: 'Meta Ads', en: 'Meta Ads' }, googleAds: { tr: 'Google Ads', en: 'Google Ads' },
  criteo: { tr: 'Criteo', en: 'Criteo' }, taboola: { tr: 'Taboola', en: 'Taboola' },
  xads: { tr: 'X (Twitter) Ads', en: 'X (Twitter) Ads' }, outdoor: { tr: 'Outdoor', en: 'Outdoor' },
  rent: { tr: 'Kira', en: 'Rent' }, office: { tr: 'Ofis Giderleri', en: 'Office Expenses' },
  consulting: { tr: 'Danışmanlık', en: 'Consulting' }, saas: { tr: 'Yazılım / SaaS', en: 'Software / SaaS' },
  accounting: { tr: 'Muhasebe / Hukuk', en: 'Accounting / Legal' },
  shipping: { tr: 'Kargo / Lojistik', en: 'Shipping / Logistics' }, warehouse: { tr: 'Depo', en: 'Warehouse' },
  packaging: { tr: 'Paketleme', en: 'Packaging' }, psp: { tr: 'Ödeme Komisyonları', en: 'Payment Fees' },
  loanInterest: { tr: 'Kredi Faizi', en: 'Loan Interest' }, chequeNote: { tr: 'Çek / Senet', en: 'Cheque / Note' },
  fxLoss: { tr: 'Kur Farkı', en: 'FX Loss' },
  vat: { tr: 'KDV', en: 'VAT' }, corpTax: { tr: 'Kurumlar Vergisi', en: 'Corporate Tax' },
  withholding: { tr: 'Stopaj', en: 'Withholding' }, employerSgk: { tr: 'SGK İşveren', en: 'Employer SSI' },
};

// ═══════════════════════════════════════════════════════════════════════════
// RAW DEĞER STORE'LARI (periodId → key → TRY)
// ═══════════════════════════════════════════════════════════════════════════
type Store = Record<string, Record<string, number | null>>;

const buildIncome = (): Store => {
  const out: Store = {};
  for (const id of Object.keys(REV)) {
    const rev = REV[id];
    const cogs = -r1(rev * 0.56);
    const opex = -r1(rev * 0.235);
    const da = r1(rev * 0.03);
    const nonOp = r1(rev * 0.006);
    const netFin = -r1(rev * 0.042);
    const gross = rev + cogs;
    const ebit = gross + opex;
    const pretax = ebit + nonOp + netFin;
    const tax = -r1(Math.max(0, pretax) * 0.22);
    out[id] = { revenue: rev, cogs, opex, da, nonOp, netFin, tax };
  }
  out['2026/Q2'].nonOp = null; // Manuel boş demo
  return out;
};
export const incomeRaw: Store = buildIncome();

export const netIncomeOf = (id: string): number => {
  const v = incomeRaw[id];
  const gross = (v.revenue ?? 0) + (v.cogs ?? 0);
  const ebit = gross + (v.opex ?? 0);
  const pretax = ebit + (v.nonOp ?? 0) + (v.netFin ?? 0);
  return pretax + (v.tax ?? 0);
};

const buildBalance = (): Store => {
  const out: Store = {};
  for (const id of Object.keys(REV)) {
    const bs = isAnnual(id) ? REV[id] / 4 : REV[id];
    const cash = r1(bs * 0.45), ar = r1(bs * 0.62), inventory = r1(bs * 0.85), otherCA = r1(bs * 0.15);
    const ppe = r1(bs * 1.35), intangibles = r1(bs * 0.55), otherNCA = r1(bs * 0.30);
    const ap = r1(bs * 0.48), stDebt = r1(bs * 0.30), otherCL = r1(bs * 0.13), ltDebt = r1(bs * 0.40), otherNCL = r1(bs * 0.10);
    const paidCapital = REGISTERED_CAPITAL;
    const periodNet = netIncomeOf(id);
    const totalAssets = cash + ar + inventory + otherCA + ppe + intangibles + otherNCA;
    const totalLiab = ap + stDebt + otherCL + ltDebt + otherNCL;
    const retained = totalAssets - totalLiab - paidCapital - periodNet; // denge plug (raw)
    out[id] = { cash, ar, inventory, otherCA, ppe, intangibles, otherNCA, ap, stDebt, otherCL, ltDebt, otherNCL, paidCapital, retained, periodNet };
  }
  out['2026/Q2'].otherCL = null; // Manuel boş demo
  return out;
};
export const balanceRaw: Store = buildBalance();

// ── Temettü olayları (§7) — gerçek beyan kayıtları + tam ödeme event'leri ────
type DivRow = { date: string; rate: number; ahmet: number; hasan: number; abdulhamit: number };
const DIV_ROWS: DivRow[] = [
  { date: '2020-12-31', rate: 7.36, ahmet: 233450, hasan: 200100, abdulhamit: 233450 },
  { date: '2021-12-31', rate: 13.28, ahmet: 262500, hasan: 225000, abdulhamit: 262500 },
  { date: '2022-12-31', rate: 18.70, ahmet: 1100000, hasan: 942900, abdulhamit: 1100000 },
  { date: '2023-12-31', rate: 29.42, ahmet: 233000, hasan: 200000, abdulhamit: 233000 },
  { date: '2024-04-01', rate: 32.21, ahmet: 490000, hasan: 400000, abdulhamit: 490000 },
  { date: '2024-05-13', rate: 32.21, ahmet: 350000, hasan: 300000, abdulhamit: 350000 },
  { date: '2024-12-31', rate: 35.27, ahmet: 3500000, hasan: 3000000, abdulhamit: 3500000 },
  { date: '2025-01-03', rate: 35.36, ahmet: 385000, hasan: 330000, abdulhamit: 385000 },
  { date: '2025-12-31', rate: 42.85, ahmet: 1166900, hasan: 1000000, abdulhamit: 1166900 },
];
const buildDividends = (): DividendEvent[] => {
  const out: DividendEvent[] = [];
  DIV_ROWS.forEach((row, i) => {
    const distId = `D${String(i + 1).padStart(2, '0')}`;
    (['ahmet', 'hasan', 'abdulhamit'] as PartnerId[]).forEach((pid) => {
      const amt = row[pid];
      out.push({ id: `${distId}-${pid}-b`, partnerId: pid, type: 'beyan', date: row.date, amountTRY: amt, fxRate: row.rate, distributionId: distId });
      // geçmiş beyanlar tam ödenmiş (aynı tarih/kur)
      out.push({ id: `${distId}-${pid}-o`, partnerId: pid, type: 'odeme', date: row.date, amountTRY: amt, fxRate: row.rate, distributionId: distId });
    });
  });
  return out;
};
export const dividendEventsSeed: DividendEvent[] = buildDividends();

// Dönem içi temettü toplamları (beyan/ödeme) — nakit akışı türetmesi için
export const periodContainsDate = (p: FinancialPeriod, iso: string): boolean => {
  const [y, m] = iso.split('-').map(Number);
  if (p.type === 'annual') return String(y) === p.label;
  const [py, pq] = p.label.split('/');
  const q = Number(pq.replace('Q', ''));
  return String(y) === py && Math.ceil(m / 3) === q;
};
export const divSumInPeriod = (events: DividendEvent[], p: FinancialPeriod, type: 'beyan' | 'odeme'): number =>
  events.filter((e) => e.type === type && periodContainsDate(p, e.date)).reduce((s, e) => s + e.amountTRY, 0);

const buildCashflow = (): Store => {
  const out: Store = {};
  for (const p of ALL_PERIODS) {
    const id = p.id, rev = REV[id];
    const cfNet = netIncomeOf(id);
    const cfDA = incomeRaw[id].da ?? 0;
    const cfWC = -r1(rev * 0.05);
    const capex = -r1(rev * 0.06);
    const cfDebt = r1(rev * 0.02);
    const cfDivDefault = -divSumInPeriod(dividendEventsSeed, p, 'odeme');
    const netChange = (cfNet + cfDA + cfWC) + capex + (cfDebt + cfDivDefault);
    const beginCash = (balanceRaw[id].cash ?? 0) - netChange;
    out[id] = { cfNet, cfDA, cfWC, capex, cfDebt, beginCash };
  }
  return out;
};
export const cashflowRaw: Store = buildCashflow();

// ═══════════════════════════════════════════════════════════════════════════
// GİDER AĞACI (§3)
// ═══════════════════════════════════════════════════════════════════════════
export interface ExpenseItemDef { key: string; source: FinSource }
export interface ExpenseCategoryDef { id: string; items: ExpenseItemDef[] }
export const EXPENSE_TREE: ExpenseCategoryDef[] = [
  { id: 'personnel', items: [
    { key: 'salaries', source: 'erp' }, { key: 'sgk', source: 'erp' }, { key: 'severance', source: 'parasut' },
    { key: 'benefits', source: 'manual' }, { key: 'overtime', source: 'manual' } ] },
  { id: 'marketing', items: [
    { key: 'metaAds', source: 'erp' }, { key: 'googleAds', source: 'erp' }, { key: 'criteo', source: 'manual' },
    { key: 'taboola', source: 'manual' }, { key: 'xads', source: 'manual' }, { key: 'outdoor', source: 'manual' } ] },
  { id: 'ga', items: [
    { key: 'rent', source: 'erp' }, { key: 'office', source: 'manual' }, { key: 'consulting', source: 'parasut' },
    { key: 'saas', source: 'erp' }, { key: 'accounting', source: 'parasut' } ] },
  { id: 'operations', items: [
    { key: 'shipping', source: 'erp' }, { key: 'warehouse', source: 'erp' }, { key: 'packaging', source: 'erp' },
    { key: 'psp', source: 'erp' } ] },
  { id: 'expFinancing', items: [
    { key: 'loanInterest', source: 'parasut' }, { key: 'chequeNote', source: 'manual' }, { key: 'fxLoss', source: 'erp' } ] },
  { id: 'taxLegal', items: [
    { key: 'vat', source: 'parasut' }, { key: 'corpTax', source: 'parasut' }, { key: 'withholding', source: 'parasut' },
    { key: 'employerSgk', source: 'erp' } ] },
];
const EXP_BASE: Record<string, number> = {
  salaries: 1_350_000, sgk: 310_000, severance: 90_000, benefits: 70_000, overtime: 45_000,
  metaAds: 520_000, googleAds: 430_000, criteo: 95_000, taboola: 60_000, xads: 40_000, outdoor: 120_000,
  rent: 180_000, office: 60_000, consulting: 110_000, saas: 145_000, accounting: 55_000,
  shipping: 380_000, warehouse: 130_000, packaging: 95_000, psp: 210_000,
  loanInterest: 240_000, chequeNote: 70_000, fxLoss: 160_000,
  corpTax: 320_000, withholding: 85_000, employerSgk: 260_000, vat: 0,
};
const buildExpense = (): Store => {
  const out: Store = {};
  for (const p of ALL_PERIODS) {
    const factor = (REV[p.id] / 8_300_000) * (p.type === 'annual' ? 4 : 1);
    const row: Record<string, number | null> = {};
    for (const cat of EXPENSE_TREE) for (const it of cat.items) row[it.key] = r1((EXP_BASE[it.key] ?? 0) * factor);
    out[p.id] = row;
  }
  out['2026/Q2'].outdoor = null; // Manuel boş demo
  return out;
};
export const expenseRaw: Store = buildExpense();

// ═══════════════════════════════════════════════════════════════════════════
// SATIR ŞEMALARI (compute closures) — Paket C
// ═══════════════════════════════════════════════════════════════════════════
export interface ComputeCtx {
  get: (key: string) => number | null;   // aynı tabloda çözülmüş değer
  raw: Record<string, number | null>;    // dönemin raw satırları
  revenue: number | null;
  netIncome: number;
  shares: number;
  divDeclared: number;
  divPaid: number;
}
export interface RowSpec {
  key: string;
  source: FinSource;
  isSubtotal?: boolean;
  isMargin?: boolean;
  group?: string;
  isGroupHeader?: boolean;
  compute?: (c: ComputeCtx) => number | null;
}
const g = (c: ComputeCtx, k: string) => c.get(k) ?? 0;
const rw = (c: ComputeCtx, k: string) => c.raw[k] ?? 0;
const pct = (num: number, den: number | null): number | null => (den && den !== 0 ? (num / den) * 100 : null);

export const INCOME_ROWS: RowSpec[] = [
  { key: 'revenue', source: 'erp' },
  { key: 'cogs', source: 'erp' },
  { key: 'grossProfit', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'revenue') + g(c, 'cogs') },
  { key: 'opex', source: 'erp' },
  { key: 'ebit', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'grossProfit') + g(c, 'opex') },
  { key: 'da', source: 'erp' },
  { key: 'ebitda', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'ebit') + g(c, 'da') },
  { key: 'nonOp', source: 'manual' },
  { key: 'netFin', source: 'parasut' },
  { key: 'pretax', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'ebit') + g(c, 'nonOp') + g(c, 'netFin') },
  { key: 'tax', source: 'parasut' },
  { key: 'netIncome', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'pretax') + g(c, 'tax') },
  { key: 'grossMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'grossProfit'), c.revenue) },
  { key: 'ebitdaMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'ebitda'), c.revenue) },
  { key: 'netMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'netIncome'), c.revenue) },
  { key: 'effTax', source: 'computed', isMargin: true, compute: (c) => { const p = g(c, 'pretax'); return p ? (-g(c, 'tax') / p) * 100 : null; } },
  { key: 'eps', source: 'computed', compute: (c) => g(c, 'netIncome') / c.shares },
  { key: 'dps', source: 'computed', compute: (c) => c.divDeclared / c.shares },
  { key: 'payout', source: 'computed', isMargin: true, compute: (c) => pct(c.divDeclared, g(c, 'netIncome')) },
];

export const BALANCE_ROWS: RowSpec[] = [
  { key: 'currentAssets', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'currentAssets', compute: (c) => rw(c, 'cash') + rw(c, 'ar') + rw(c, 'inventory') + rw(c, 'otherCA') },
  { key: 'cash', source: 'erp', group: 'currentAssets' },
  { key: 'ar', source: 'erp', group: 'currentAssets' },
  { key: 'inventory', source: 'erp', group: 'currentAssets' },
  { key: 'otherCA', source: 'manual', group: 'currentAssets' },
  { key: 'nonCurrentAssets', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'nonCurrentAssets', compute: (c) => rw(c, 'ppe') + rw(c, 'intangibles') + rw(c, 'otherNCA') },
  { key: 'ppe', source: 'erp', group: 'nonCurrentAssets' },
  { key: 'intangibles', source: 'parasut', group: 'nonCurrentAssets' },
  { key: 'otherNCA', source: 'manual', group: 'nonCurrentAssets' },
  { key: 'totalAssets', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'currentAssets') + g(c, 'nonCurrentAssets') },
  { key: 'currentLiab', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'currentLiab', compute: (c) => rw(c, 'ap') + rw(c, 'stDebt') + rw(c, 'otherCL') },
  { key: 'ap', source: 'erp', group: 'currentLiab' },
  { key: 'stDebt', source: 'parasut', group: 'currentLiab' },
  { key: 'otherCL', source: 'manual', group: 'currentLiab' },
  { key: 'nonCurrentLiab', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'nonCurrentLiab', compute: (c) => rw(c, 'ltDebt') + rw(c, 'otherNCL') },
  { key: 'ltDebt', source: 'parasut', group: 'nonCurrentLiab' },
  { key: 'otherNCL', source: 'manual', group: 'nonCurrentLiab' },
  { key: 'totalLiab', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'currentLiab') + g(c, 'nonCurrentLiab') },
  { key: 'equity', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'equity', compute: (c) => rw(c, 'paidCapital') + rw(c, 'retained') + rw(c, 'periodNet') },
  { key: 'paidCapital', source: 'erp', group: 'equity' },
  { key: 'retained', source: 'erp', group: 'equity' },
  { key: 'periodNet', source: 'computed', group: 'equity' },
  { key: 'totalResources', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'totalLiab') + g(c, 'equity') },
  { key: 'netWorkingCapital', source: 'computed', compute: (c) => g(c, 'currentAssets') - g(c, 'currentLiab') },
  { key: 'totalDebt', source: 'computed', compute: (c) => rw(c, 'stDebt') + rw(c, 'ltDebt') },
  { key: 'netDebt', source: 'computed', compute: (c) => g(c, 'totalDebt') - rw(c, 'cash') },
  { key: 'bvps', source: 'computed', compute: (c) => g(c, 'equity') / c.shares },
];

export const CASHFLOW_ROWS: RowSpec[] = [
  { key: 'cfNet', source: 'computed', compute: (c) => c.netIncome },
  { key: 'cfDA', source: 'erp' },
  { key: 'cfWC', source: 'manual' },
  { key: 'operatingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'cfNet') + g(c, 'cfDA') + g(c, 'cfWC') },
  { key: 'capex', source: 'erp' },
  { key: 'investingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'capex') },
  { key: 'cfDebt', source: 'parasut' },
  { key: 'cfDiv', source: 'computed', compute: (c) => -c.divPaid },  // temettü dataset'inden türetilir
  { key: 'financingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'cfDebt') + g(c, 'cfDiv') },
  { key: 'fcf', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'operatingCF') + g(c, 'capex') },
  { key: 'netChange', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'operatingCF') + g(c, 'investingCF') + g(c, 'financingCF') },
  { key: 'beginCash', source: 'erp' },
  { key: 'endCash', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'beginCash') + g(c, 'netChange') },
  { key: 'fcfMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'fcf'), c.revenue) },
  { key: 'fcfPerShare', source: 'computed', compute: (c) => g(c, 'fcf') / c.shares },
];

export const FIN_COUNTS = {
  periodsAnnual: PERIODS_ANNUAL.length,
  periodsQuarter: PERIODS_QUARTER.length,
  incomeRows: INCOME_ROWS.length,
  balanceRows: BALANCE_ROWS.length,
  cashflowRows: CASHFLOW_ROWS.length,
  expenseCats: EXPENSE_TREE.length,
  dividendEvents: dividendEventsSeed.length,
};
