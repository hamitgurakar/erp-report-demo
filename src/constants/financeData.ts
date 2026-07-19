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
  domesticSales: { tr: 'Yurt İçi Satışlar', en: 'Domestic Sales' },
  foreignSales: { tr: 'Yurt Dışı Satışlar', en: 'Foreign Sales' },
  cogs: { tr: 'SMM', en: 'COGS' },
  grossProfit: { tr: 'Brüt Kâr', en: 'Gross Profit' },
  opex: { tr: 'Faaliyet Giderleri', en: 'Operating Expenses' },
  marketingSales: { tr: 'Pazarlama / Satış / Dağıtım', en: 'Marketing / Selling / Distribution' },
  generalAdmin: { tr: 'Genel Yönetim', en: 'General & Administrative' },
  rnd: { tr: 'Ar-Ge', en: 'R&D' },
  ebit: { tr: 'Esas Faaliyet Kârı (EBIT)', en: 'Operating Income (EBIT)' },
  da: { tr: 'Amortisman', en: 'Depreciation & Amortization' },
  ebitda: { tr: 'FAVÖK', en: 'EBITDA' },
  nonOp: { tr: 'Faaliyet Dışı Gelir/Gider', en: 'Non-operating Income/Expense' },
  interestIncome: { tr: 'Faiz ve Yatırım Geliri', en: 'Interest & Investment Income' },
  interestExpense: { tr: 'Faiz Gideri', en: 'Interest Expense' },
  netInterest: { tr: 'Net Faiz', en: 'Net Interest' },
  netMonetary: { tr: 'Net Parasal Pozisyon Kazanç/(Kayıp)', en: 'Net Monetary Position Gain/(Loss)' },
  pretax: { tr: 'Vergi Öncesi Kâr', en: 'Pre-tax Profit' },
  tax: { tr: 'Vergi', en: 'Tax' },
  netIncome: { tr: 'Net Kâr', en: 'Net Income' },
  normalizedNet: { tr: 'Normalize Net Kâr', en: 'Normalized Net Income' },
  revenuePerShare: { tr: 'Hisse Başına Hasılat', en: 'Revenue per Share' },
  interestPaid: { tr: 'Ödenen Faiz (dipnot)', en: 'Interest Paid (footnote)' },
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
  stInvest: { tr: 'Kısa Vadeli Finansal Yatırımlar', en: 'Short-term Investments' },
  totalCashSTInvest: { tr: 'Toplam Nakit & KV Yatırım', en: 'Total Cash & ST Investments' },
  ar: { tr: 'Ticari Alacaklar', en: 'Accounts Receivable' },
  inventory: { tr: 'Stoklar', en: 'Inventory' },
  otherCA: { tr: 'Diğer Dönen Varlıklar', en: 'Other Current Assets' },
  nonCurrentAssets: { tr: 'Duran Varlıklar', en: 'Non-current Assets' },
  grossPPE: { tr: 'Brüt Maddi Duran Varlık', en: 'Gross PP&E' },
  accumDep: { tr: 'Birikmiş Amortisman (−)', en: 'Accumulated Depreciation (−)' },
  netPPE: { tr: 'Net Maddi Duran Varlık', en: 'Net PP&E' },
  intangibles: { tr: 'Maddi Olmayan Duran Varlıklar', en: 'Intangible Assets' },
  goodwill: { tr: 'Şerefiye', en: 'Goodwill' },
  ltInvest: { tr: 'Uzun Vadeli Finansal Yatırımlar', en: 'Long-term Investments' },
  deferredTaxAsset: { tr: 'Ertelenmiş Vergi Varlığı', en: 'Deferred Tax Asset' },
  otherNCA: { tr: 'Diğer Duran Varlıklar', en: 'Other Non-current Assets' },
  totalAssets: { tr: 'Toplam Varlıklar', en: 'Total Assets' },
  currentLiab: { tr: 'Kısa Vadeli Yükümlülükler', en: 'Current Liabilities' },
  ap: { tr: 'Ticari Borçlar', en: 'Accounts Payable' },
  stDebt: { tr: 'Finansal Borçlar (KV)', en: 'Short-term Debt' },
  employeePayables: { tr: 'Çalışanlara Borçlar', en: 'Payables to Employees' },
  deferredRevenue: { tr: 'Ertelenmiş Gelir', en: 'Deferred Revenue' },
  currentTaxPayable: { tr: 'Dönem Vergi Borcu', en: 'Current Tax Payable' },
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
  totalCash: { tr: 'Toplam Nakit', en: 'Total Cash' },
  netDebt: { tr: 'Net Borç', en: 'Net Debt' },
  bvps: { tr: 'Hisse Başına Defter Değeri', en: 'Book Value per Share' },
  cashPerShare: { tr: 'Hisse Başına Nakit', en: 'Cash per Share' },
  tangibleBVPS: { tr: 'Hisse Başına Maddi Defter Değeri', en: 'Tangible Book Value per Share' },
  // cashflow
  cfNet: { tr: 'Net Kâr', en: 'Net Income' },
  cfDA: { tr: 'Amortisman', en: 'Depreciation & Amortization' },
  impairment: { tr: 'Değer Düşüklüğü / Karşılık Düzeltmeleri', en: 'Impairment / Provision Adjustments' },
  cfWC: { tr: 'İşletme Sermayesi Değişimi', en: 'Change in Working Capital' },
  arChange: { tr: 'Ticari Alacak Değişimi', en: 'Change in Receivables' },
  invChange: { tr: 'Stok Değişimi', en: 'Change in Inventory' },
  apChange: { tr: 'Ticari Borç Değişimi', en: 'Change in Payables' },
  otherWCChange: { tr: 'Diğer İşl. Sermayesi Değişimi', en: 'Other Working Capital Change' },
  operatingCF: { tr: 'İşletme Nakit Akışı', en: 'Operating Cash Flow' },
  capex: { tr: 'Yatırım Harcaması (CapEx)', en: 'Capital Expenditure' },
  invPurchaseSale: { tr: 'Yatırım Alım/Satım (net)', en: 'Investment Purchase/Sale (net)' },
  otherInvest: { tr: 'Diğer Yatırım Faaliyetleri', en: 'Other Investing Activities' },
  investingCF: { tr: 'Yatırım Nakit Akışı', en: 'Investing Cash Flow' },
  borrowIn: { tr: 'Borçlanma Girişi', en: 'Debt Issued' },
  debtRepay: { tr: 'Borç Ödemesi', en: 'Debt Repayment' },
  interestPaidCF: { tr: 'Ödenen Faiz', en: 'Interest Paid' },
  cfDiv: { tr: 'Ödenen Temettü', en: 'Dividends Paid' },
  financingCF: { tr: 'Finansman Nakit Akışı', en: 'Financing Cash Flow' },
  fxEffect: { tr: 'Kur Farkı Etkisi (net)', en: 'FX Effect (net)' },
  fcf: { tr: 'Serbest Nakit Akışı', en: 'Free Cash Flow' },
  leveredFcf: { tr: 'Kaldıraçlı FCF', en: 'Levered FCF' },
  unleveredFcf: { tr: 'Kaldıraçsız FCF', en: 'Unlevered FCF' },
  netChange: { tr: 'Net Nakit Değişimi', en: 'Net Change in Cash' },
  beginCash: { tr: 'Dönem Başı Nakit', en: 'Beginning Cash' },
  endCash: { tr: 'Dönem Sonu Nakit', en: 'Ending Cash' },
  fcfMargin: { tr: 'FCF Marjı %', en: 'FCF Margin %' },
  fcfPerShare: { tr: 'Hisse Başına FCF', en: 'FCF per Share' },
  taxPaid: { tr: 'Ödenen Vergi (dipnot)', en: 'Tax Paid (footnote)' },
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
    const domesticSales = r1(rev * 0.72);
    const foreignSales = rev - domesticSales;
    const cogs = -r1(rev * 0.56);
    const marketingSales = -r1(rev * 0.12);
    const generalAdmin = -r1(rev * 0.075);
    const rnd = -r1(rev * 0.04);
    const da = r1(rev * 0.03);
    const nonOp = r1(rev * 0.006);
    const interestIncome = r1(rev * 0.008);
    const interestExpense = -r1(rev * 0.05);
    const netMonetary = r1(rev * 0.015); // IAS 29 mock kazanç
    const gross = rev + cogs;
    const ebit = gross + marketingSales + generalAdmin + rnd;
    const pretax = ebit + nonOp + interestIncome + interestExpense;
    const tax = -r1(Math.max(0, pretax) * 0.22);
    out[id] = { revenue: rev, domesticSales, foreignSales, cogs, marketingSales, generalAdmin, rnd, da, nonOp, interestIncome, interestExpense, tax, netMonetary };
  }
  out['2026/Q2'].nonOp = null; // Manuel boş demo
  return out;
};
export const incomeRaw: Store = buildIncome();

export const netIncomeOf = (id: string): number => {
  const v = incomeRaw[id];
  const gross = (v.revenue ?? 0) + (v.cogs ?? 0);
  const ebit = gross + (v.marketingSales ?? 0) + (v.generalAdmin ?? 0) + (v.rnd ?? 0);
  const pretax = ebit + (v.nonOp ?? 0) + (v.interestIncome ?? 0) + (v.interestExpense ?? 0);
  return pretax + (v.tax ?? 0);
};

const buildBalance = (): Store => {
  const out: Store = {};
  for (const id of Object.keys(REV)) {
    const bs = isAnnual(id) ? REV[id] / 4 : REV[id];
    const cash = r1(bs * 0.35), stInvest = r1(bs * 0.10);
    const ar = r1(bs * 0.62), inventory = r1(bs * 0.85), otherCA = r1(bs * 0.15);
    const grossPPE = r1(bs * 1.70), accumDep = -r1(bs * 0.35); // netPPE ≈ 1.35
    const intangibles = r1(bs * 0.35), goodwill = r1(bs * 0.20), ltInvest = r1(bs * 0.15), deferredTaxAsset = r1(bs * 0.08), otherNCA = r1(bs * 0.07);
    const ap = r1(bs * 0.48), stDebt = r1(bs * 0.30), employeePayables = r1(bs * 0.06), deferredRevenue = r1(bs * 0.05), currentTaxPayable = r1(bs * 0.04), otherCL = r1(bs * 0.13);
    const ltDebt = r1(bs * 0.40), otherNCL = r1(bs * 0.10);
    const paidCapital = REGISTERED_CAPITAL;
    const periodNet = netIncomeOf(id);
    const netPPE = grossPPE + accumDep;
    const totalAssets = cash + stInvest + ar + inventory + otherCA + netPPE + intangibles + goodwill + ltInvest + deferredTaxAsset + otherNCA;
    const totalLiab = ap + stDebt + employeePayables + deferredRevenue + currentTaxPayable + otherCL + ltDebt + otherNCL;
    const retained = totalAssets - totalLiab - paidCapital - periodNet; // denge plug (raw)
    out[id] = { cash, stInvest, ar, inventory, otherCA, grossPPE, accumDep, intangibles, goodwill, ltInvest, deferredTaxAsset, otherNCA, ap, stDebt, employeePayables, deferredRevenue, currentTaxPayable, otherCL, ltDebt, otherNCL, paidCapital, retained, periodNet };
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
    const impairment = r1(rev * 0.004);
    const arChange = -r1(rev * 0.03), invChange = -r1(rev * 0.025), apChange = r1(rev * 0.02), otherWCChange = -r1(rev * 0.015);
    const cfWC = arChange + invChange + apChange + otherWCChange;
    const capex = -r1(rev * 0.06), invPurchaseSale = -r1(rev * 0.01), otherInvest = -r1(rev * 0.005);
    const borrowIn = r1(rev * 0.04), debtRepay = -r1(rev * 0.02), interestPaidCF = -r1(rev * 0.05);
    const cfDivDefault = -divSumInPeriod(dividendEventsSeed, p, 'odeme');
    const fxEffect = r1(rev * 0.003);
    const taxPaid = incomeRaw[id].tax ?? 0;
    const operating = cfNet + cfDA + impairment + cfWC;
    const investing = capex + invPurchaseSale + otherInvest;
    const financing = borrowIn + debtRepay + interestPaidCF + cfDivDefault;
    const netChange = operating + investing + financing + fxEffect;
    const beginCash = (balanceRaw[id].cash ?? 0) - netChange;
    out[id] = { cfDA, impairment, arChange, invChange, apChange, otherWCChange, capex, invPurchaseSale, otherInvest, borrowIn, debtRepay, interestPaidCF, fxEffect, taxPaid, beginCash };
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
  iasOnly?: boolean;   // yalnızca IAS 29 seçiliyken görünür
  memo?: boolean;      // dipnot satırı (soluk)
  compute?: (c: ComputeCtx) => number | null;
}
const g = (c: ComputeCtx, k: string) => c.get(k) ?? 0;
const rw = (c: ComputeCtx, k: string) => c.raw[k] ?? 0;
const pct = (num: number, den: number | null): number | null => (den && den !== 0 ? (num / den) * 100 : null);

export const INCOME_ROWS: RowSpec[] = [
  { key: 'revenue', source: 'erp' },
  { key: 'domesticSales', source: 'erp', group: 'revenue' },
  { key: 'foreignSales', source: 'erp', group: 'revenue' },
  { key: 'cogs', source: 'erp' },
  { key: 'grossProfit', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'revenue') + g(c, 'cogs') },
  { key: 'opex', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'opex', compute: (c) => rw(c, 'marketingSales') + rw(c, 'generalAdmin') + rw(c, 'rnd') },
  { key: 'marketingSales', source: 'erp', group: 'opex' },
  { key: 'generalAdmin', source: 'erp', group: 'opex' },
  { key: 'rnd', source: 'manual', group: 'opex' },
  { key: 'ebit', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'grossProfit') + g(c, 'opex') },
  { key: 'da', source: 'erp' },
  { key: 'ebitda', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'ebit') + g(c, 'da') },
  { key: 'nonOp', source: 'manual' },
  { key: 'interestIncome', source: 'erp' },
  { key: 'interestExpense', source: 'parasut' },
  { key: 'netInterest', source: 'computed', compute: (c) => g(c, 'interestIncome') + g(c, 'interestExpense') },
  { key: 'netMonetary', source: 'computed', iasOnly: true },
  { key: 'pretax', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'ebit') + g(c, 'nonOp') + g(c, 'netInterest') },
  { key: 'tax', source: 'parasut' },
  { key: 'netIncome', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'pretax') + g(c, 'tax') },
  { key: 'normalizedNet', source: 'computed', compute: (c) => g(c, 'netIncome') },
  { key: 'grossMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'grossProfit'), c.revenue) },
  { key: 'ebitdaMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'ebitda'), c.revenue) },
  { key: 'netMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'netIncome'), c.revenue) },
  { key: 'effTax', source: 'computed', isMargin: true, compute: (c) => { const p = g(c, 'pretax'); return p ? (-g(c, 'tax') / p) * 100 : null; } },
  { key: 'eps', source: 'computed', compute: (c) => g(c, 'netIncome') / c.shares },
  { key: 'revenuePerShare', source: 'computed', compute: (c) => (c.revenue ?? 0) / c.shares },
  { key: 'dps', source: 'computed', compute: (c) => c.divDeclared / c.shares },
  { key: 'payout', source: 'computed', isMargin: true, compute: (c) => pct(c.divDeclared, g(c, 'netIncome')) },
  { key: 'interestPaid', source: 'computed', memo: true, compute: (c) => g(c, 'interestExpense') },
];

export const BALANCE_ROWS: RowSpec[] = [
  { key: 'currentAssets', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'currentAssets', compute: (c) => rw(c, 'cash') + rw(c, 'stInvest') + rw(c, 'ar') + rw(c, 'inventory') + rw(c, 'otherCA') },
  { key: 'cash', source: 'erp', group: 'currentAssets' },
  { key: 'stInvest', source: 'parasut', group: 'currentAssets' },
  { key: 'totalCashSTInvest', source: 'computed', group: 'currentAssets', compute: (c) => rw(c, 'cash') + rw(c, 'stInvest') },
  { key: 'ar', source: 'erp', group: 'currentAssets' },
  { key: 'inventory', source: 'erp', group: 'currentAssets' },
  { key: 'otherCA', source: 'manual', group: 'currentAssets' },
  { key: 'nonCurrentAssets', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'nonCurrentAssets', compute: (c) => rw(c, 'grossPPE') + rw(c, 'accumDep') + rw(c, 'intangibles') + rw(c, 'goodwill') + rw(c, 'ltInvest') + rw(c, 'deferredTaxAsset') + rw(c, 'otherNCA') },
  { key: 'grossPPE', source: 'erp', group: 'nonCurrentAssets' },
  { key: 'accumDep', source: 'erp', group: 'nonCurrentAssets' },
  { key: 'netPPE', source: 'computed', group: 'nonCurrentAssets', compute: (c) => rw(c, 'grossPPE') + rw(c, 'accumDep') },
  { key: 'intangibles', source: 'parasut', group: 'nonCurrentAssets' },
  { key: 'goodwill', source: 'parasut', group: 'nonCurrentAssets' },
  { key: 'ltInvest', source: 'parasut', group: 'nonCurrentAssets' },
  { key: 'deferredTaxAsset', source: 'parasut', group: 'nonCurrentAssets' },
  { key: 'otherNCA', source: 'manual', group: 'nonCurrentAssets' },
  { key: 'totalAssets', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'currentAssets') + g(c, 'nonCurrentAssets') },
  { key: 'currentLiab', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'currentLiab', compute: (c) => rw(c, 'ap') + rw(c, 'stDebt') + rw(c, 'employeePayables') + rw(c, 'deferredRevenue') + rw(c, 'currentTaxPayable') + rw(c, 'otherCL') },
  { key: 'ap', source: 'erp', group: 'currentLiab' },
  { key: 'stDebt', source: 'parasut', group: 'currentLiab' },
  { key: 'employeePayables', source: 'erp', group: 'currentLiab' },
  { key: 'deferredRevenue', source: 'parasut', group: 'currentLiab' },
  { key: 'currentTaxPayable', source: 'parasut', group: 'currentLiab' },
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
  { key: 'totalCash', source: 'computed', compute: (c) => rw(c, 'cash') + rw(c, 'stInvest') + rw(c, 'ltInvest') },
  { key: 'netDebt', source: 'computed', compute: (c) => g(c, 'totalDebt') - rw(c, 'cash') - rw(c, 'stInvest') },
  { key: 'bvps', source: 'computed', compute: (c) => g(c, 'equity') / c.shares },
  { key: 'cashPerShare', source: 'computed', compute: (c) => g(c, 'totalCash') / c.shares },
  { key: 'tangibleBVPS', source: 'computed', compute: (c) => (g(c, 'equity') - rw(c, 'intangibles') - rw(c, 'goodwill')) / c.shares },
];

export const CASHFLOW_ROWS: RowSpec[] = [
  { key: 'cfNet', source: 'computed', compute: (c) => c.netIncome },
  { key: 'cfDA', source: 'erp' },
  { key: 'impairment', source: 'manual' },
  { key: 'cfWC', source: 'computed', isSubtotal: true, isGroupHeader: true, group: 'wc', compute: (c) => rw(c, 'arChange') + rw(c, 'invChange') + rw(c, 'apChange') + rw(c, 'otherWCChange') },
  { key: 'arChange', source: 'erp', group: 'wc' },
  { key: 'invChange', source: 'erp', group: 'wc' },
  { key: 'apChange', source: 'erp', group: 'wc' },
  { key: 'otherWCChange', source: 'manual', group: 'wc' },
  { key: 'operatingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'cfNet') + g(c, 'cfDA') + g(c, 'impairment') + g(c, 'cfWC') },
  { key: 'capex', source: 'erp' },
  { key: 'invPurchaseSale', source: 'parasut' },
  { key: 'otherInvest', source: 'manual' },
  { key: 'investingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'capex') + g(c, 'invPurchaseSale') + g(c, 'otherInvest') },
  { key: 'borrowIn', source: 'parasut' },
  { key: 'debtRepay', source: 'parasut' },
  { key: 'interestPaidCF', source: 'parasut' },
  { key: 'cfDiv', source: 'computed', compute: (c) => -c.divPaid },  // temettü dataset'inden türetilir
  { key: 'financingCF', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'borrowIn') + g(c, 'debtRepay') + g(c, 'interestPaidCF') + g(c, 'cfDiv') },
  { key: 'fxEffect', source: 'manual' },
  { key: 'netChange', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'operatingCF') + g(c, 'investingCF') + g(c, 'financingCF') + g(c, 'fxEffect') },
  { key: 'beginCash', source: 'erp' },
  { key: 'endCash', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'beginCash') + g(c, 'netChange') },
  { key: 'fcf', source: 'computed', isSubtotal: true, compute: (c) => g(c, 'operatingCF') + g(c, 'capex') },
  { key: 'leveredFcf', source: 'computed', compute: (c) => g(c, 'fcf') },
  { key: 'unleveredFcf', source: 'computed', compute: (c) => g(c, 'fcf') - g(c, 'interestPaidCF') },
  { key: 'fcfMargin', source: 'computed', isMargin: true, compute: (c) => pct(g(c, 'fcf'), c.revenue) },
  { key: 'fcfPerShare', source: 'computed', compute: (c) => g(c, 'fcf') / c.shares },
  { key: 'taxPaid', source: 'parasut', memo: true },
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
