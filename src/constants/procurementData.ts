// Satın Alma (Procurement) mock verisi — PROCUREMENT_BRIEF.md (e) + ADDENDUM v2 (A2).
// Tüm Satın Alma sayfaları SADECE bu dosyadan beslenir. Deterministik (seeded) üretim:
// her build'de aynı değerler çıkar. Firma/marka/kişi adları jeneriktir (gerçek değil).
import type {
  Supplier, Buyer, PurchaseRequest, PurchaseOrder, Quote,
  PayableInvoice, SpendRecord, FxRate, ProcSource, Currency,
  PRStatus, QuoteStatus, PaymentMethod, SupplierStatus, SingleSourceItem,
  StockItem, ReplenishStatus, WeekDelivery,
  CategoryMargin, SupplierMargin, NegativeMarginSku, NegMarginReason,
} from '../types/procurement';

// ── Deterministik PRNG (LCG) ────────────────────────────────────────────────
let _seed = 20260717;
const rnd = (): number => {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
};
const rint = (min: number, max: number): number => Math.floor(min + rnd() * (max - min + 1));
const rfloat = (min: number, max: number, dec = 1): number => {
  const p = Math.pow(10, dec);
  return Math.round((min + rnd() * (max - min)) * p) / p;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const weighted = <T,>(items: readonly [T, number][]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) { if ((r -= w) <= 0) return v; }
  return items[items.length - 1][0];
};
const pad2 = (n: number): string => String(n).padStart(2, '0');
const dateStr = (y: number, m: number, d: number): string => `${y}-${pad2(m)}-${pad2(d)}`;

// ── Sabit tanımlar ──────────────────────────────────────────────────────────
export const PROC_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;

export const PROC_CATEGORIES = [
  'Tekstil', 'Deri', 'Metal', 'Cam & Porselen', 'Ambalaj & Kutu', 'Baskı & Promosyon', 'Kırtasiye',
] as const;

// A2: 10 jenerik marka + kategori eşlemesi
export const PROC_BRANDS: { name: string; category: string }[] = [
  { name: 'VeraTex', category: 'Tekstil' },
  { name: 'PrimoBag', category: 'Deri' },
  { name: 'MetalWorks', category: 'Metal' },
  { name: 'LumoGlass', category: 'Cam & Porselen' },
  { name: 'CeramiCo', category: 'Cam & Porselen' },
  { name: 'PackPro', category: 'Ambalaj & Kutu' },
  { name: 'OakCraft', category: 'Ambalaj & Kutu' },
  { name: 'InkLine', category: 'Baskı & Promosyon' },
  { name: 'NordPen', category: 'Kırtasiye' },
  { name: 'PenElite', category: 'Kırtasiye' },
];

// A2: 5 mock buyer ismi (gerçek çalışan değil)
const BUYER_NAMES = ['Deniz Aksoy', 'Kerem Yıldız', 'Selin Acar', 'Baran Koç', 'İpek Duman'] as const;

const SALES_REPS = ['Ayşe K.', 'Mehmet D.', 'Can Y.', 'Elif S.', 'Burak A.'] as const;

// Jenerik proje/firma adları (fiyatlama projeleri için)
const PROJECT_NAMES = [
  'Yıllık Kurumsal Set', 'Bayram Hediye Kutusu', 'Çalışan Welcome Kit', 'VIP Müşteri Seti',
  'Fuar Promosyon Paketi', 'Yılbaşı Özel Kutu', 'Motivasyon Ödül Seti', 'Konferans Çantası',
  'Marka Lansman Kiti', 'Sadakat Programı Hediyesi', 'Ajanda & Kalem Seti', 'Termos & Kupa Seti',
];

// Tedarikçi harcama tabanları (Top-1 ~%23, HHI orta seviye tutulur) — brief (e)
// Harcama tabanları HHI ~1.800 (orta yoğunlaşma) + Top-1 ~%28 hedefiyle kalibre (brief e).
const SUPPLIER_SEED: { name: string; category: string; spend: number; currency: Currency }[] = [
  { name: 'ATLAS Tekstil', category: 'Tekstil', spend: 5_040_000, currency: 'TRY' },
  { name: 'ORİON Metal', category: 'Metal', spend: 4_500_000, currency: 'USD' },
  { name: 'ANADOLU Cam', category: 'Cam & Porselen', spend: 2_610_000, currency: 'EUR' },
  { name: 'EGE Deri', category: 'Deri', spend: 1_620_000, currency: 'USD' },
  { name: 'ARMONİ Ambalaj', category: 'Ambalaj & Kutu', spend: 1_080_000, currency: 'TRY' },
  { name: 'MERİDYEN Promosyon', category: 'Baskı & Promosyon', spend: 720_000, currency: 'TRY' },
  { name: 'MARMARA Baskı', category: 'Baskı & Promosyon', spend: 520_000, currency: 'TRY' },
  { name: 'DENİZ Porselen', category: 'Cam & Porselen', spend: 430_000, currency: 'EUR' },
  { name: 'VİZYON Hediyelik', category: 'Baskı & Promosyon', spend: 360_000, currency: 'TRY' },
  { name: 'TREND Tekstil', category: 'Tekstil', spend: 300_000, currency: 'TRY' },
  { name: 'ZİRVE Kırtasiye', category: 'Kırtasiye', spend: 260_000, currency: 'TRY' },
  { name: 'KURUMSAL Kalem', category: 'Kırtasiye', spend: 220_000, currency: 'USD' },
  { name: 'PARS Metal', category: 'Metal', spend: 180_000, currency: 'USD' },
  { name: 'SERAMİK Dünyası', category: 'Cam & Porselen', spend: 160_000, currency: 'EUR' },
];

const statusFromSpi = (spi: number): SupplierStatus =>
  spi >= 85 ? 'iyi' : spi >= 72 ? 'izle' : spi >= 60 ? 'uyari' : 'acil';

// ── Tedarikçiler (14) ───────────────────────────────────────────────────────
const buildSuppliers = (): Supplier[] => {
  const total = SUPPLIER_SEED.reduce((s, x) => s + x.spend, 0);
  return SUPPLIER_SEED.map((s, i) => {
    const otif = rfloat(82, 98);
    const spi = Math.round(
      0.35 * otif + 0.25 * (100 - rfloat(0, 8) * 8) + 0.2 * rfloat(70, 99) + 0.2 * rfloat(65, 98),
    );
    const spiClamped = Math.max(52, Math.min(97, spi));
    const totalPayable = Math.round((s.spend / 12) * rfloat(0.6, 1.4) / 1000) * 1000;
    const overdueDays = rint(0, 18);
    return {
      id: `SUP${pad2(i + 1)}`,
      name: s.name,
      category: s.category,
      annualSpend: s.spend,
      spendShare: Math.round((s.spend / total) * 1000) / 10,
      otif,
      otd: Math.min(99, otif + rfloat(1, 5)),
      leadTime: rint(7, 30),
      leadTimeVariance: rfloat(2, 18),
      defectPPM: rint(150, 800),
      poAccuracy: rfloat(94, 99.5),
      ppv: rfloat(-4, 7),
      spiScore: spiClamped,
      avgPaymentDays: rint(30, 65),
      totalPayable,
      overdueDays,
      singleSource: rnd() < 0.28,
      currency: s.currency,
      status: statusFromSpi(spiClamped),
    };
  });
};
export const suppliers: Supplier[] = buildSuppliers();

// HHI (yoğunlaşma) — Σ(payᵢ²), pages doğrudan kullanabilir
export const supplierHHI = Math.round(suppliers.reduce((s, x) => s + x.spendShare * x.spendShare, 0));

// ── Buyer'lar (5) ───────────────────────────────────────────────────────────
export const buyers: Buyer[] = BUYER_NAMES.map((name, i) => {
  const prCount = rint(10, 20);
  const poCount = rint(5, 12);
  return {
    id: `BUY${pad2(i + 1)}`,
    name,
    totalSpend: rint(1_800, 4_600) * 1000,
    prCount,
    poCount,
    avgCompletionDays: rfloat(3, 11),
    onTimePct: rfloat(78, 96),
    openWork: rint(2, 9),
    avgPaymentDays: rint(32, 58),
  };
});
const BUYER_IDS = buyers.map((b) => b.id);

const srcPick = (): ProcSource => (rnd() < 0.7 ? 'B2B' : 'B2C');

// ── Satınalma Talepleri / PR (~70, son 6 ay artan hacim) ────────────────────
const PR_MONTHS: [number, number, number][] = [
  // [yıl, ay, adet] — Şub→Tem 2026, artan
  [2026, 2, 8], [2026, 3, 9], [2026, 4, 11], [2026, 5, 12], [2026, 6, 14], [2026, 7, 16],
];
const PR_STATUS_OLD: [PRStatus, number][] = [
  ['Tamamlandı', 60], ['İptal', 8], ['İşleniyor', 12], ['Tedarik Edilebilir', 12], ['Beklemede', 6], ['Taslak', 2],
];
const PR_STATUS_NEW: [PRStatus, number][] = [
  ['Taslak', 14], ['Beklemede', 26], ['Tedarik Edilebilir', 24], ['İşleniyor', 20], ['Tamamlandı', 12], ['İptal', 4],
];
const PR_TITLES = [
  'Tekstil hammadde alımı', 'Promosyon kalem siparişi', 'Kurumsal kupa seti', 'Deri cüzdan partisi',
  'Ambalaj kutusu ikmali', 'Baskılı çanta üretimi', 'Metal anahtarlık alımı', 'Porselen bardak seti',
  'Ajanda baskı işi', 'Yılbaşı hediye kutusu', 'Termos üretim siparişi', 'Kırtasiye toplu alım',
];

const CUR_TODAY = { y: 2026, m: 7, d: 17 };
const daysBetween = (a: { y: number; m: number; d: number }, b: { y: number; m: number; d: number }): number =>
  Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);

const buildPRs = (): PurchaseRequest[] => {
  const out: PurchaseRequest[] = [];
  let n = 1;
  for (const [y, m, count] of PR_MONTHS) {
    const isRecent = m >= 6;
    for (let i = 0; i < count; i++) {
      const day = rint(1, 28);
      const status = weighted(isRecent ? PR_STATUS_NEW : PR_STATUS_OLD);
      const done = status === 'Tamamlandı' || status === 'İptal';
      const completedDate = done ? dateStr(y, m, Math.min(28, day + rint(2, 15))) : null;
      const ageDays = done ? 0 : Math.max(0, daysBetween({ y, m, d: day }, CUR_TODAY));
      out.push({
        id: `PR26${pad2(n)}`,
        title: pick(PR_TITLES),
        source: srcPick(),
        status,
        createdDate: dateStr(y, m, day),
        completedDate,
        buyerId: pick(BUYER_IDS),
        poIds: [],
        quoteId: null,
        ageDays,
      });
      n++;
    }
  }
  return out;
};
export const purchaseRequests: PurchaseRequest[] = buildPRs();

// ── Satınalma Siparişleri / PO (~35, PR'lara bağlı) ─────────────────────────
const buildPOs = (): PurchaseOrder[] => {
  const out: PurchaseOrder[] = [];
  // PO'ya uygun PR'lar: işlenen/tedarik edilebilir/tamamlanan
  const eligible = purchaseRequests.filter((p) =>
    ['Tedarik Edilebilir', 'İşleniyor', 'Tamamlandı'].includes(p.status));
  let n = 1;
  const targetPOs = 35;
  while (out.length < targetPOs && eligible.length > 0) {
    const pr = pick(eligible);
    if (pr.poIds.length >= 4) continue;
    const sup = pick(suppliers);
    const [oy, om, od] = pr.createdDate.split('-').map(Number);
    const orderDay = Math.min(28, od + rint(1, 6));
    const leadDays = sup.leadTime;
    const expDate = new Date(Date.UTC(oy, om - 1, orderDay + leadDays));
    const expectedDate = dateStr(expDate.getUTCFullYear(), expDate.getUTCMonth() + 1, expDate.getUTCDate());
    const prDone = pr.status === 'Tamamlandı';
    const overdue = !prDone && rnd() < 0.3;
    const lateDays = overdue ? rint(1, 18) : 0;
    const status: PurchaseOrder['status'] = prDone
      ? 'Teslim Alındı'
      : overdue ? 'Gecikmiş' : 'Açık';
    const amount = rint(40, 620) * 1000;
    const id = `PO-${2400 + n}`;
    pr.poIds.push(id);
    out.push({
      id,
      prId: pr.id,
      supplierId: sup.id,
      buyerId: pr.buyerId,
      source: pr.source,
      orderedDate: dateStr(oy, om, orderDay),
      expectedDate,
      completedDate: prDone ? expectedDate : null,
      amount,
      currency: sup.currency,
      lateDays,
      status,
    });
    n++;
  }
  return out;
};
export const purchaseOrders: PurchaseOrder[] = buildPOs();

// ── Fiyatlama Projeleri / Quote (~90, haftalık sezonsal, Kas-Ara tepe) ──────
// Aylık ağırlık: yaz (Haz-Ağu) dip, Kas-Ara tepe.
const QUOTE_MONTH_WEIGHTS: [number, number][] = [
  [1, 6], [2, 6], [3, 7], [4, 8], [5, 7], [6, 5], [7, 5], [8, 5], [9, 8], [10, 10], [11, 14], [12, 13],
];
const QUOTE_STATUS: [QuoteStatus, number][] = [
  ['Fiyatlandı', 42], ['Arşiv', 14], ['TDR Cevap Bekleniyor', 12],
  ['Eksik Bilgi', 10], ['Fiyatlanacak', 14], ['İptal', 8],
];
const buildQuotes = (): Quote[] => {
  const out: Quote[] = [];
  const totalW = QUOTE_MONTH_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const target = 90;
  let n = 1;
  for (const [m, w] of QUOTE_MONTH_WEIGHTS) {
    const count = Math.round((w / totalW) * target);
    for (let i = 0; i < count; i++) {
      const status = weighted(QUOTE_STATUS);
      const priced = status === 'Fiyatlandı' || status === 'Arşiv';
      const customPrint = rnd() < 0.4;
      // özel baskılılarda fiyatlama süresi daha uzun
      const pricingHours = customPrint ? rfloat(12, 72) : rfloat(2, 36);
      const day = rint(1, 28);
      const y = 2026;
      const pricedDate = priced ? dateStr(y, m, Math.min(28, day + rint(0, 4))) : null;
      const converted = status === 'Fiyatlandı' && rnd() < 0.45;
      out.push({
        id: `Q26${pad2(n)}`,
        projectName: pick(PROJECT_NAMES),
        source: srcPick(),
        status,
        openedDate: dateStr(y, m, day),
        pricedDate,
        pricingHours,
        customPrint,
        buyerId: pick(BUYER_IDS),
        salesRep: pick(SALES_REPS),
        converted,
      });
      n++;
    }
  }
  return out;
};
export const quotes: Quote[] = buildQuotes();

// Bazı dönüşen quote'ları PR'lara bağla (funnel bütünlüğü)
(() => {
  const convertedQuotes = quotes.filter((q) => q.converted).map((q) => q.id);
  const linkablePRs = purchaseRequests.filter((p) => p.source && p.status !== 'Taslak');
  let qi = 0;
  for (const pr of linkablePRs) {
    if (qi >= convertedQuotes.length) break;
    if (rnd() < 0.5) { pr.quoteId = convertedQuotes[qi]; qi++; }
  }
})();

// ── Borç Faturaları / PayableInvoice (~40) ──────────────────────────────────
// Türkiye B2B: çek+senet ödemelerin ~%30'u (brief e)
const PAYMENT_METHODS: [PaymentMethod, number][] = [
  ['Havale', 44], ['Açık Hesap', 24], ['Çek', 24], ['Senet', 8],
];
const buildPayables = (): PayableInvoice[] => {
  const out: PayableInvoice[] = [];
  const target = 40;
  for (let n = 1; n <= target; n++) {
    const sup = pick(suppliers);
    // vade dağılımı: bir kısmı geçmiş (overdue ~%5-9), çoğu gelecek
    const daysRemaining = weighted<number>([
      [-rint(1, 40), 6], [rint(0, 7), 14], [rint(8, 30), 42], [rint(31, 60), 30], [rint(61, 90), 8],
    ]);
    const issueOffset = rint(20, 60);
    const issue = new Date(Date.UTC(CUR_TODAY.y, CUR_TODAY.m - 1, CUR_TODAY.d - issueOffset));
    const due = new Date(Date.UTC(CUR_TODAY.y, CUR_TODAY.m - 1, CUR_TODAY.d + daysRemaining));
    const method = weighted(PAYMENT_METHODS);
    const status: PayableStatusLocal = daysRemaining < 0 ? 'Gecikmiş' : 'Açık';
    out.push({
      id: `INV26${pad2(n)}`,
      supplierId: sup.id,
      amount: rint(25, 480) * 1000,
      currency: sup.currency,
      issueDate: dateStr(issue.getUTCFullYear(), issue.getUTCMonth() + 1, issue.getUTCDate()),
      dueDate: dateStr(due.getUTCFullYear(), due.getUTCMonth() + 1, due.getUTCDate()),
      daysRemaining,
      paymentMethod: method,
      status,
      reconciled: rnd() > 0.18, // 12-20 tedarikçiden birkaçında uyumsuzluk
    });
  }
  return out;
};
type PayableStatusLocal = PayableInvoice['status'];
export const payableInvoices: PayableInvoice[] = buildPayables();

// ── Aylık Harcama (12 ay × 10 marka, marka boyutlu) ─────────────────────────
// Sezonsal: yıl sonu (Kas-Ara) satın alma tepe.
const MONTH_SPEND_FACTOR = [0.9, 0.85, 0.95, 1.0, 1.05, 0.9, 0.85, 0.85, 1.05, 1.15, 1.35, 1.3];
const brandCurrency = (cat: string): Currency =>
  cat === 'Cam & Porselen' ? 'EUR' : cat === 'Deri' || cat === 'Metal' ? 'USD' : 'TRY';
const buildSpend = (): SpendRecord[] => {
  const out: SpendRecord[] = [];
  PROC_MONTHS.forEach((month, mi) => {
    const factor = MONTH_SPEND_FACTOR[mi];
    for (const brand of PROC_BRANDS) {
      const base = rint(45, 210) * 1000;
      out.push({
        month,
        category: brand.category,
        brand: brand.name,
        source: srcPick(),
        amount: Math.round((base * factor) / 1000) * 1000,
        currency: brandCurrency(brand.category),
      });
    }
  });
  return out;
};
export const spendRecords: SpendRecord[] = buildSpend();

// ── Kur Verileri (12 ay; 2026 gelecek aylar prediction) ─────────────────────
// USD/TRY ~43, EUR/TRY ~50,5 (2025 sonu seviyeleri). Ağu'26+ = tahmin.
const buildFx = (): FxRate[] =>
  PROC_MONTHS.map((month, i) => ({
    month,
    usdTry: Math.round((40.5 + i * 0.32 + rfloat(-0.2, 0.2)) * 100) / 100,
    eurTry: Math.round((47.8 + i * 0.42 + rfloat(-0.25, 0.25)) * 100) / 100,
    isPrediction: i >= 7, // Ağu (index 7) ve sonrası: gelecek = tahmin
  }));
export const fxRates: FxRate[] = buildFx();

// ── Tedarikçi sayfası türetilmiş serileri ───────────────────────────────────
// Son 6 ay penceresi (Tedarikçi trend grafikleri).
const TREND_MONTHS = ['Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'] as const;

// Top-5 tedarikçi aylık lead time trendi (görsel 5)
export const leadTimeTrendSuppliers = suppliers.slice(0, 5).map((s) => ({ id: s.id, name: s.name }));
export const supplierLeadTimeTrend: Record<string, number | string>[] = TREND_MONTHS.map((month, mi) => {
  const row: Record<string, number | string> = { month };
  suppliers.slice(0, 5).forEach((s) => {
    row[s.id] = Math.max(4, Math.round(s.leadTime + Math.sin(mi + s.leadTime) * 2 + rfloat(-1.5, 1.5)));
  });
  return row;
});

// Kategori bazında aylık defect (PPM) trendi (görsel 6)
export const defectTrendCategories = ['Tekstil', 'Deri', 'Cam & Porselen', 'Metal'] as const;
export const defectTrendByCategory: Record<string, number | string>[] = TREND_MONTHS.map((month, mi) => {
  const row: Record<string, number | string> = { month };
  defectTrendCategories.forEach((cat, ci) => {
    const base = 300 + ci * 80;
    row[cat] = Math.max(120, Math.round(base + Math.sin(mi + ci) * 60 + rfloat(-30, 30)));
  });
  return row;
});

// Tek-kaynak riski kalemleri (tablo 2) — kritik SKU'lar tek tedarikçiye bağlı
const SS_ITEM_NAMES = [
  'Premium deri cüzdan', 'İthal kristal kupa', 'Metal anahtarlık gövde', 'Özel dokuma çanta',
  'Porselen kupa seti', 'Alüminyum roller kalem', 'Cam bardak seti',
];
export const singleSourceItems: SingleSourceItem[] = SS_ITEM_NAMES
  .map((item, i) => {
    const s = suppliers[i];
    return {
      item,
      category: s.category,
      supplierId: s.id,
      supplierName: s.name,
      annualSpend: Math.round((s.annualSpend * rfloat(0.12, 0.35)) / 1000) * 1000,
      hasAlternative: rnd() < 0.4,
      qualified: rnd() < 0.35,
    };
  })
  .sort((a, b) => b.annualSpend - a.annualSpend);

// ═══════════════════════════════════════════════════════════════════════════
// MALİYET (Cost) sayfası türetilmiş serileri — BRIEF SAYFA 4 + ADDENDUM A6
// ═══════════════════════════════════════════════════════════════════════════

// Güncel kur (son gerçekleşen ay, Tem 2026) — FX risk hesapları için baz.
const _realFx = fxRates.filter((f) => !f.isPrediction);
export const CUR_USD = _realFx[_realFx.length - 1].usdTry;
export const CUR_EUR = _realFx[_realFx.length - 1].eurTry;

// Toplam yıllık satın alma (₺) — 12 ay × 10 marka.
export const totalSpend = spendRecords.reduce((s, r) => s + r.amount, 0);

// Para birimi dağılımı (donut) — spendRecords currency bazında.
export const currencyMix = (() => {
  const m: Record<Currency, number> = { TRY: 0, USD: 0, EUR: 0 };
  spendRecords.forEach((r) => { m[r.currency] += r.amount; });
  return (['TRY', 'USD', 'EUR'] as Currency[]).map((c) => ({
    currency: c, amount: m[c], share: Math.round((m[c] / totalSpend) * 1000) / 10,
  }));
})();

// Alt kategori kırılımları (drill-down) — A6 decomposition tree karşılığı.
const SUBCATEGORIES: Record<string, string[]> = {
  'Tekstil': ['Tişört', 'Çanta', 'Havlu', 'Şapka'],
  'Deri': ['Cüzdan', 'Ajanda', 'Kartlık', 'Kemer'],
  'Metal': ['Kalem', 'Anahtarlık', 'Rozet'],
  'Cam & Porselen': ['Kupa', 'Bardak', 'Vazo'],
  'Ambalaj & Kutu': ['Karton Kutu', 'Kraft Torba', 'Hediye Kutusu'],
  'Baskı & Promosyon': ['Dijital Baskı', 'Serigrafi', 'Etiket'],
  'Kırtasiye': ['Defter', 'Kalem Seti', 'Bloknot'],
};

export interface CategorySpend {
  category: string;
  amount: number;       // ₺
  share: number;        // toplam içindeki pay %
  yoy: number;          // YoY değişim %
  supplierCount: number;
  avgPpv: number;       // ort. PPV %
  savingsOpp: number;   // tasarruf fırsatı ₺
  subcategories: { name: string; amount: number }[];
}

export const categorySpend: CategorySpend[] = (() => {
  const byCat: Record<string, number> = {};
  spendRecords.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + r.amount; });
  return PROC_CATEGORIES.map((cat) => {
    const amount = byCat[cat] || 0;
    const catSuppliers = suppliers.filter((s) => s.category === cat);
    const supplierCount = catSuppliers.length || rint(1, 3);
    const avgPpv = catSuppliers.length
      ? Math.round((catSuppliers.reduce((s, x) => s + x.ppv, 0) / catSuppliers.length) * 10) / 10
      : rfloat(-2, 6);
    const subs = SUBCATEGORIES[cat] || ['Genel'];
    const weights = subs.map(() => rfloat(0.5, 1.5));
    const wsum = weights.reduce((s, w) => s + w, 0);
    const subcategories = subs.map((name, i) => ({
      name, amount: Math.round((amount * weights[i] / wsum) / 1000) * 1000,
    }));
    return {
      category: cat,
      amount,
      share: Math.round((amount / totalSpend) * 1000) / 10,
      yoy: rfloat(-8, 22),
      supplierCount,
      avgPpv,
      savingsOpp: Math.round((amount * rfloat(0.03, 0.09)) / 1000) * 1000,
      subcategories,
    };
  }).sort((a, b) => b.amount - a.amount);
})();

// Yıl & çeyrek bazlı alım tutarı + adet (A6 ana combo grafiği) — artan trend.
export interface QuarterSpend { period: string; amount: number; count: number }
export const spendByQuarter: QuarterSpend[] = (() => {
  const periods = ['2025 Ç1', '2025 Ç2', '2025 Ç3', '2025 Ç4', '2026 Ç1', '2026 Ç2'];
  return periods.map((period, i) => ({
    period,
    amount: Math.round((3_100_000 + i * 340_000 + rfloat(-0.15, 0.15) * 700_000) / 1000) * 1000,
    count: rint(78, 92) + i * 9,
  }));
})();

// PPV kategoriye göre (favorable/unfavorable bar) — categorySpend avgPpv üzerinden.
export const ppvByCategory = categorySpend
  .map((c) => ({ category: c.category, ppv: c.avgPpv }))
  .sort((a, b) => a.ppv - b.ppv);

// Aylık tasarruf vs kaçınma (stacked bar; hedef vs gerçekleşen).
export interface SavingsMonth { month: string; realized: number; avoidance: number; target: number }
export const savingsMonthly: SavingsMonth[] = PROC_MONTHS.map((month) => {
  const realized = rint(60, 180) * 1000;
  const avoidance = rint(30, 110) * 1000;
  const target = Math.round(((realized + avoidance) * rfloat(0.85, 1.25)) / 1000) * 1000;
  return { month, realized, avoidance, target };
});

// USD/TRY & EUR/TRY kur trendi vs alım maliyet endeksi (line).
export const fxVsCostTrend = fxRates.map((f, i) => ({
  month: f.month,
  usdTry: f.usdTry,
  eurTry: f.eurTry,
  costIndex: Math.round((100 + i * 1.9 + rfloat(-1.5, 1.5)) * 10) / 10,
  isPrediction: f.isPrediction,
}));

// Kur riski tablosu — döviz faturalı tedarikçilerin açık PO'ları.
export interface FxRiskRow {
  supplier: string;
  currency: Currency;
  openPoFx: number;     // açık PO (döviz cinsi)
  openPoTry: number;    // ₺ karşılığı (güncel kur)
  rateAtOrder: number;  // kur @sipariş
  currentRate: number;  // güncel kur
  fxDiff: number;       // kur farkı (₺)
}
export const fxRiskRows: FxRiskRow[] = suppliers
  .filter((s) => s.currency !== 'TRY')
  .map((s) => {
    const cur = s.currency === 'USD' ? CUR_USD : CUR_EUR;
    const rateAtOrder = Math.round(cur * rfloat(0.90, 0.97) * 100) / 100;
    const openPoFx = rint(20, 180) * 1000;
    const openPoTry = Math.round(openPoFx * cur);
    const fxDiff = Math.round(openPoFx * (cur - rateAtOrder));
    return { supplier: s.name, currency: s.currency, openPoFx, openPoTry, rateAtOrder, currentRate: cur, fxDiff };
  })
  .sort((a, b) => b.fxDiff - a.fxDiff);

// Marka performansı (A6: top 10 marka bar + tablo) — spendRecords brand bazında.
export interface BrandPerf {
  brand: string;
  category: string;
  spend: number;
  share: number;
  yoy: number;
  ppv: number;
  trend: number[];      // sparkline (son 6 ay)
}
export const brandPerformance: BrandPerf[] = (() => {
  const byBrand: Record<string, number> = {};
  spendRecords.forEach((r) => { byBrand[r.brand] = (byBrand[r.brand] || 0) + r.amount; });
  return PROC_BRANDS.map((b) => {
    const spend = byBrand[b.name] || 0;
    return {
      brand: b.name,
      category: b.category,
      spend,
      share: Math.round((spend / totalSpend) * 1000) / 10,
      yoy: rfloat(-12, 28),
      ppv: rfloat(-4, 7),
      trend: Array.from({ length: 6 }, () => rint(60, 200)),
    };
  }).sort((a, b) => b.spend - a.spend);
})();

// Maliyet waterfall — Standart maliyet → PPV → navlun/gümrük → kur etkisi → fiili.
// (Management P&L waterfall diliyle; değerler ₺.)
export interface CostWaterfallStep { name: string; nameEN: string; val: number; isTotal?: boolean }
export const costWaterfall: CostWaterfallStep[] = (() => {
  const standard = Math.round((totalSpend * 0.88) / 1000) * 1000;
  const ppv = Math.round((totalSpend * 0.028) / 1000) * 1000;
  const freight = Math.round((totalSpend * 0.045) / 1000) * 1000;
  const fx = Math.round((totalSpend * 0.047) / 1000) * 1000;
  const actual = standard + ppv + freight + fx;
  return [
    { name: 'Standart Maliyet', nameEN: 'Standard Cost', val: standard, isTotal: true },
    { name: 'Fiyat Sapması (PPV)', nameEN: 'Price Variance (PPV)', val: ppv },
    { name: 'Navlun & Gümrük', nameEN: 'Freight & Duty', val: freight },
    { name: 'Kur Etkisi', nameEN: 'FX Impact', val: fx },
    { name: 'Fiili Maliyet', nameEN: 'Actual Cost', val: actual, isTotal: true },
  ];
})();

// Maliyet KPI özet değerleri (13 KPI).
export const costSummary = (() => {
  const realizedSavings = savingsMonthly.reduce((s, m) => s + m.realized, 0);
  const costAvoidance = savingsMonthly.reduce((s, m) => s + m.avoidance, 0);
  const targetSavings = savingsMonthly.reduce((s, m) => s + m.target, 0);
  const avgPpv = Math.round((categorySpend.reduce((s, c) => s + c.avgPpv * c.amount, 0) / totalSpend) * 10) / 10;
  const fxImpact = fxRiskRows.reduce((s, r) => s + r.fxDiff, 0);
  return {
    totalSpend,
    spendUnderMgmt: 78.4,      // yönetilen harcama % (hedef >80)
    maverickSpend: 13.6,       // serbest harcama % (hedef <10)
    avgPpv,
    realizedSavings,
    costAvoidance,
    savingsRealization: Math.round((realizedSavings / targetSavings) * 1000) / 10,
    landedCostIndex: 117.5,    // landed cost endeksi (baz 100)
    usdMix: currencyMix.find((c) => c.currency === 'USD')!.share,
    eurMix: currencyMix.find((c) => c.currency === 'EUR')!.share,
    fxImpact,
    categoryConcentration: categorySpend[0].share,
    costPerPo: 4820,           // PO başına süreç maliyeti (₺)
  };
})();

// ═══════════════════════════════════════════════════════════════════════════
// SATIN ALMA OPERASYONU (Procurement Operations) türetilmiş serileri — ADDENDUM A3
// ═══════════════════════════════════════════════════════════════════════════

// Haftalık gelen talep (52 hafta) — sezonsal: yaz dip, Kas-Ara tepe (görsel 4).
// PR kayıtları yalnızca son 6 ayı kapsadığından yıllık akış deterministik türetilir.
export interface PRWeekInflow { week: number; label: string; b2b: number; b2c: number; total: number; isPeak: boolean }
export const prWeeklyInflow: PRWeekInflow[] = (() => {
  const monthFactor = [0.8, 0.8, 0.9, 1.0, 1.05, 0.75, 0.7, 0.72, 1.05, 1.2, 1.5, 1.4]; // Oca..Ara
  const out: PRWeekInflow[] = [];
  for (let w = 1; w <= 52; w++) {
    const mi = Math.min(11, Math.floor((w - 1) / (52 / 12)));
    const f = monthFactor[mi];
    const total = Math.max(2, Math.round(6 * f + Math.sin(w / 2) * 1.4 + rfloat(-1, 1.5)));
    const b2b = Math.max(1, Math.round(total * rfloat(0.6, 0.78)));
    const b2c = Math.max(0, total - b2b);
    out.push({ week: w, label: `H${w}`, b2b, b2c, total: b2b + b2c, isPeak: false });
  }
  const peak = out.reduce((m, x) => (x.total > m.total ? x : m), out[0]);
  out.forEach((x) => { x.isPeak = x.week === peak.week; });
  return out;
})();

// ═══════════════════════════════════════════════════════════════════════════
// UZMAN PERFORMANS (Buyer Performance) türetilmiş serileri — ADDENDUM A4
// ═══════════════════════════════════════════════════════════════════════════

const BUYER_TREND_MONTHS = ['Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'] as const;

// Aylık ort. tamamlama süresi trendi (gün) — uzman bazlı (görsel 4).
export const buyerCompletionTrend: Record<string, number | string>[] = BUYER_TREND_MONTHS.map((month, mi) => {
  const row: Record<string, number | string> = { month };
  buyers.forEach((b, bi) => {
    row[b.id] = Math.max(2, Math.round((b.avgCompletionDays + Math.sin(mi + bi) * 1.5 + rfloat(-0.8, 0.8)) * 10) / 10);
  });
  return row;
});

// Uzman sparkline (tablo trend kolonu) — aylık alım endeksi (son 6 ay, K₺).
export const buyerSpendSpark: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  buyers.forEach((b, bi) => {
    const base = b.totalSpend / 6 / 1000;
    out[b.id] = BUYER_TREND_MONTHS.map((_, mi) =>
      Math.max(1, Math.round(base * (0.85 + Math.sin(mi + bi) * 0.12 + rfloat(-0.05, 0.1)))));
  });
  return out;
})();

// ═══════════════════════════════════════════════════════════════════════════
// PROJE FİYATLAMA (Project Pricing) türetilmiş serileri — ADDENDUM A5
// Kaynak: quotes (Notion B2B Proje Fiyatlama). Not: fiyatlama süresi/bekleme
// takvim değil pricingHours (saat) üzerinden hesaplanır — deterministik kalır.
// ═══════════════════════════════════════════════════════════════════════════

// Görsel 1: Yığılma ısı-haritası — hafta (satır) × gün (sütun) gelen talep yoğunluğu.
// Son 8 hafta; hafta içi (Sal-Per) yoğun, hafta sonu seyrek; son haftalara doğru artan yığılma.
export const PRICING_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
export interface PricingBacklogWeek { label: string; days: number[]; total: number }
export const pricingBacklog: PricingBacklogWeek[] = (() => {
  const WEEKS = 8;
  const dayWeight = [1.05, 1.25, 1.35, 1.2, 0.95, 0.3, 0.12]; // Pzt..Paz
  const out: PricingBacklogWeek[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const weekBoost = 0.75 + (w / (WEEKS - 1)) * 0.95; // eskiden yeniye artan
    const days = dayWeight.map((d) => Math.max(0, Math.round(d * weekBoost * rfloat(1.4, 3.4))));
    out.push({ label: `H-${WEEKS - w}`, days, total: days.reduce((a, b) => a + b, 0) });
  }
  return out;
})();
export const pricingBacklogMax = Math.max(...pricingBacklog.flatMap((w) => w.days), 1);

// Görsel 3: Haftalık gelen talep (gerçekleşen) + 4 haftalık forecast (kesikli, Q4'e doğru yükseliş).
export interface QuoteWeekPoint {
  label: string; actual: number | null; forecast: number | null; isForecast: boolean;
}
export const quoteWeeklyForecast: QuoteWeekPoint[] = (() => {
  const ACTUAL = 12, FC = 4;
  const out: QuoteWeekPoint[] = [];
  const vals: number[] = [];
  for (let i = 0; i < ACTUAL + FC; i++) {
    const trend = 4 + i * 0.55; // sezonsal yükseliş (Q4'e doğru)
    vals.push(Math.max(2, Math.round(trend + Math.sin(i / 2) * 1.7 + rfloat(-1, 1.3))));
  }
  for (let i = 0; i < ACTUAL + FC; i++) {
    const isForecast = i >= ACTUAL;
    out.push({
      label: `H${i + 1}`,
      actual: isForecast ? null : vals[i],
      // forecast çizgisini son gerçekleşen noktadan başlat (kesintisiz bağlantı)
      forecast: isForecast || i === ACTUAL - 1 ? vals[i] : null,
      isForecast,
    });
  }
  return out;
})();
export const quoteForecastNextWeek = quoteWeeklyForecast.find((p) => p.isForecast)?.forecast ?? 0;

// ═══════════════════════════════════════════════════════════════════════════
// BORÇLULUK (Payables) türetilmiş serileri — BRIEF SAYFA 6 + ADDENDUM A6
// Ana para birimi TRY; döviz tutarları ikincil. Deterministik.
// ═══════════════════════════════════════════════════════════════════════════

// DPO aylık trendi (gün) — hedef bant 30-60. Son ay = güncel DPO.
export interface DpoPoint { month: string; dpo: number }
export const payablesDpoTrend: DpoPoint[] = PROC_MONTHS.map((month, i) => ({
  month,
  dpo: Math.round(46 + Math.sin(i / 1.7) * 6 + rfloat(-2.5, 2.5)),
}));
export const currentDpo = payablesDpoTrend[payablesDpoTrend.length - 1].dpo;

// BA-BS mutabakat satırları — 12-20 tedarikçiden 2-4'ünde küçük bakiye farkı (brief e).
// Not: yalnızca kağıt/cari bakiye teyidi bağlamında (e-Fatura Ba/Bs dışı — caveat).
export interface ReconRow {
  supplier: string; ourBalance: number; theirBalance: number; diff: number;
  reconciled: boolean; lastDate: string;
}
export const reconciliationRows: ReconRow[] = suppliers.map((s, i) => {
  const mismatch = i === 2 || i === 6 || i === 11; // deterministik 3 uyumsuz tedarikçi (brief: 2-4)
  const diff = mismatch ? rint(4, 24) * 1000 * (rnd() < 0.5 ? -1 : 1) : 0;
  const our = s.totalPayable;
  const their = our - diff; // diff = bizim − karşı
  const day = rint(1, 15);
  return { supplier: s.name, ourBalance: our, theirBalance: their, diff, reconciled: !mismatch, lastDate: dateStr(2026, 7, day) };
});

// ═══════════════════════════════════════════════════════════════════════════
// STOK & İKMAL (Stock & Replenishment) — brief SAYFA 3 + çakışma kuralı (d).
// SADECE tedarik tetikleme metrikleri: ROP, days of supply, açık PO, gelen teslimat.
// Envanter değerleme/yaşlanma Category>Stok'ta kalır (burada YOK).
// ═══════════════════════════════════════════════════════════════════════════

// Jenerik ürün adları (kurumsal hediye/promosyon bağlamı) + kategori.
const STOCK_SEED: { name: string; category: string }[] = [
  { name: 'Seramik Kupa Seti', category: 'Cam & Porselen' },
  { name: 'Cam Bardak Seti', category: 'Cam & Porselen' },
  { name: 'Porselen Fincan', category: 'Cam & Porselen' },
  { name: 'Deri Cüzdan', category: 'Deri' },
  { name: 'Deri Ajanda', category: 'Deri' },
  { name: 'Deri Kartlık', category: 'Deri' },
  { name: 'Pamuklu Tişört', category: 'Tekstil' },
  { name: 'Kanvas Çanta', category: 'Tekstil' },
  { name: 'Polar Battaniye', category: 'Tekstil' },
  { name: 'Kurumsal Şapka', category: 'Tekstil' },
  { name: 'Metal Tükenmez Kalem', category: 'Metal' },
  { name: 'Metal Anahtarlık', category: 'Metal' },
  { name: 'Çelik Termos', category: 'Metal' },
  { name: 'USB Bellek 32GB', category: 'Metal' },
  { name: 'Hediye Kutusu (Orta)', category: 'Ambalaj & Kutu' },
  { name: 'Kraft Karton Kutu', category: 'Ambalaj & Kutu' },
  { name: 'Kurdele & Poşet Set', category: 'Ambalaj & Kutu' },
  { name: 'Emaye Rozet', category: 'Baskı & Promosyon' },
  { name: 'Sticker Set (100lü)', category: 'Baskı & Promosyon' },
  { name: 'Kurumsal Kartvizit', category: 'Baskı & Promosyon' },
  { name: 'Spiralli Defter A5', category: 'Kırtasiye' },
  { name: 'Kalem Seti (3lü)', category: 'Kırtasiye' },
  { name: 'Yapışkanlı Not Bloğu', category: 'Kırtasiye' },
  { name: 'Masaüstü Ajanda 2026', category: 'Kırtasiye' },
];

const OVERSTOCK_DAYS = 90; // fazla stok üst eşiği (days of supply)

const replenishStatus = (dos: number, onHand: number, rop: number, leadTime: number): ReplenishStatus =>
  dos < leadTime ? 'acil' : onHand < rop ? 'uyari' : dos > OVERSTOCK_DAYS ? 'izle' : 'iyi';

const buildStockItems = (): StockItem[] => {
  const suppliersByCat = (cat: string) => suppliers.filter((s) => s.category === cat);
  return STOCK_SEED.map((s, i) => {
    const pool = suppliersByCat(s.category);
    const sup = pool.length ? pool[i % pool.length] : suppliers[i % suppliers.length];
    const avgDailyUsage = rint(3, 42);
    const leadTime = sup.leadTime;
    const safetyStock = Math.round(avgDailyUsage * rfloat(3, 8));
    const reorderPoint = Math.round(avgDailyUsage * leadTime + safetyStock);
    // Eldeki stok ROP'un 0,18–2,2 katı → doğal bir Acil/Uyarı/İzle/İyi dağılımı
    const onHand = Math.max(0, Math.round(reorderPoint * rfloat(0.18, 2.2)));
    const daysOfSupply = Math.round(onHand / avgDailyUsage);
    // EOQ ~ günlük kullanım × 20-45 gün, en yakın 10'a yuvarlı
    const eoq = Math.max(20, Math.round((avgDailyUsage * rint(20, 45)) / 10) * 10);
    const landedUnitCost = rfloat(8, 340, 0);
    return {
      sku: `SKU-${1000 + i + 1}`,
      name: s.name,
      category: s.category,
      supplierId: sup.id,
      supplierName: sup.name,
      onHand,
      reorderPoint,
      safetyStock,
      avgDailyUsage,
      leadTime,
      daysOfSupply,
      eoq,
      landedUnitCost,
      status: replenishStatus(daysOfSupply, onHand, reorderPoint, leadTime),
    };
  });
};
export const stockItems: StockItem[] = buildStockItems();

// Açık PO'lar (Açık + Gecikmiş) — açık PO takip tablosu & bar için.
export const openPurchaseOrders = purchaseOrders.filter(
  (p) => p.status === 'Açık' || p.status === 'Gecikmiş',
);

// Açık PO değeri — tedarikçiye göre (bar). Top tedarikçiler + kuyruk 'Diğer'.
export interface OpenPoBySupplier { supplier: string; value: number; count: number }
export const openPoBySupplier: OpenPoBySupplier[] = (() => {
  const map = new Map<string, { value: number; count: number }>();
  for (const po of openPurchaseOrders) {
    const sup = suppliers.find((s) => s.id === po.supplierId);
    const name = sup ? sup.name : po.supplierId;
    const cur = map.get(name) ?? { value: 0, count: 0 };
    cur.value += po.amount;
    cur.count += 1;
    map.set(name, cur);
  }
  return [...map.entries()]
    .map(([supplier, v]) => ({ supplier, value: v.value, count: v.count }))
    .sort((a, b) => b.value - a.value);
})();

// Bekleyen teslimat haftalık timeline (yaklaşan 8 hafta). Referans: "bu hafta" 14 Tem.
const WEEK_STARTS = ['14 Tem', '21 Tem', '28 Tem', '4 Ağu', '11 Ağu', '18 Ağu', '25 Ağu', '1 Eyl'];
export const weeklyDeliveries: WeekDelivery[] = WEEK_STARTS.map((label, i) => {
  // İlk haftalar yoğun, sonlar seyrekleşir (açık PO'lar teslim aldıkça)
  const poCount = Math.max(0, rint(2, 7) - (i > 4 ? i - 4 : 0));
  const value = poCount * rint(40, 180) * 1000;
  return { week: `H${i + 1}`, label, poCount, value, isThisWeek: i === 0 };
});

// Days of supply trendi (kategori bazında, son 6 ay) — area chart.
export const dosCategories = ['Cam & Porselen', 'Deri', 'Tekstil', 'Metal'] as const;
export const dosTrendByCategory: Record<string, number | string>[] = TREND_MONTHS.map((month, mi) => {
  const row: Record<string, number | string> = { month };
  dosCategories.forEach((cat, ci) => {
    const base = 34 + ci * 8;
    row[cat] = Math.round(base + Math.sin((mi + ci) / 1.6) * 9 + rfloat(-4, 4));
  });
  return row;
});

// Stok & İkmal ek KPI'lar (POlardan türetilemeyen mock süreç metrikleri).
export const daysToConfirm = rfloat(1.5, 4.5); // RFQ → PO onay ort. gün
export const expeditedOrderPct = rfloat(6, 16); // acil/plansız sipariş oranı %

// ═══════════════════════════════════════════════════════════════════════════
// KARLILIK (Profitability) — brief SAYFA 5 + çakışma kuralı (d).
// SATIN ALMANIN brüt marja katkısı: alım maliyeti + landed cost + kur → marj.
// Ürün satış karlılığı Category'de kalır (çapraz link ile).
// ═══════════════════════════════════════════════════════════════════════════

// Kategori bazlı hedef brüt marj % (ithal cam/deri daha düşük — kur/navlun baskısı).
const CAT_MARGIN_BASE: Record<string, number> = {
  'Tekstil': 42,
  'Deri': 34,
  'Metal': 38,
  'Cam & Porselen': 33,
  'Ambalaj & Kutu': 46,
  'Baskı & Promosyon': 48,
  'Kırtasiye': 40,
};

// Kategori karlılığı — alım maliyeti categorySpend'ten, gelir marj üzerinden türetilir.
export const categoryMargins: CategoryMargin[] = categorySpend.map((c) => {
  const base = CAT_MARGIN_BASE[c.category] ?? 40;
  const grossMargin = Math.round((base + rfloat(-3, 3)) * 10) / 10;
  const purchaseCost = c.amount;
  const revenue = Math.round(purchaseCost / (1 - grossMargin / 100) / 1000) * 1000;
  // İthal (döviz baskın) kategorilerde landed cost aşınması daha yüksek
  const imported = ['Cam & Porselen', 'Deri', 'Metal'].includes(c.category);
  const landedImpactBps = -rint(imported ? 90 : 30, imported ? 210 : 90);
  const volume = Math.round(purchaseCost / rint(45, 320));
  // Son 6 ay marj trendi — ithal kategorilerde hafif düşüş
  const trend = Array.from({ length: 6 }, (_, i) =>
    Math.round((grossMargin + (imported ? (i - 5) * 0.9 : rfloat(-1.2, 1.2))) * 10) / 10);
  return { category: c.category, purchaseCost, revenue, grossMargin, landedImpactBps, volume, trend };
});

// Tedarikçi bazlı brüt marj katkısı (top/bottom bar) — kategori marjı ± gürültü.
export const supplierMargins: SupplierMargin[] = suppliers.map((s) => {
  const catBase = CAT_MARGIN_BASE[s.category] ?? 40;
  const grossMargin = Math.round(Math.max(4, catBase + rfloat(-14, 12)) * 10) / 10;
  const revenue = s.annualSpend / (1 - grossMargin / 100);
  const marginContribution = Math.round((revenue - s.annualSpend) / 1000) * 1000;
  return { supplier: s.name, category: s.category, marginContribution, grossMargin };
}).sort((a, b) => b.marginContribution - a.marginContribution);

// Aylık brüt marj % vs SMM trendi (dual-axis line) — marj hafif düşüş, SMM artış.
export interface MarginCogsPoint { month: string; grossMargin: number; cogs: number }
export const marginCogsTrend: MarginCogsPoint[] = PROC_MONTHS.map((month, i) => ({
  month,
  grossMargin: Math.round((40 - i * 0.35 + Math.sin(i / 2.2) * 1.6 + rfloat(-0.8, 0.8)) * 10) / 10,
  cogs: Math.round((1_150_000 + i * 34_000 + rfloat(-0.08, 0.08) * 300_000) / 1000) * 1000,
}));

// Kategori × ay marj % ısı haritası (bozulma erken uyarısı) — 12 ay.
export interface MarginHeatRow { category: string; months: number[] }
export const marginHeatmap: MarginHeatRow[] = categoryMargins.map((cm) => {
  const imported = ['Cam & Porselen', 'Deri', 'Metal'].includes(cm.category);
  const months = PROC_MONTHS.map((_, i) =>
    Math.round((cm.grossMargin + (imported ? (i - 11) * 0.55 : Math.sin(i / 2.5) * 1.4) + rfloat(-1, 1)) * 10) / 10);
  return { category: cm.category, months };
});

// Negatif marj SKU tablosu — tam maliyette zarar eden kalemler (neden + aksiyon).
const NEG_REASONS: NegMarginReason[] = ['Kur', 'Navlun', 'Zam'];
export const negativeMarginSkus: NegativeMarginSku[] = stockItems
  .filter((_, i) => [1, 4, 8, 12, 15, 19].includes(i)) // deterministik 6 SKU
  .map((s, i) => {
    const fullCost = Math.round(s.landedUnitCost * rfloat(1.08, 1.22));
    const salePrice = Math.round(fullCost * rfloat(0.86, 0.985));
    const margin = Math.round(((salePrice - fullCost) / salePrice) * 1000) / 10;
    return { sku: s.sku, name: s.name, fullCost, salePrice, margin, reason: NEG_REASONS[i % NEG_REASONS.length] };
  });

// Purchase-to-margin bridge waterfall — Liste fiyatı → iskonto → landed → kur → SMM → brüt kar.
// (Management/Cost waterfall diliyle uyumlu; değerler yıllık ₺.)
export const marginBridge: CostWaterfallStep[] = (() => {
  const totalRevenue = categoryMargins.reduce((s, c) => s + c.revenue, 0);
  const totalCost = categoryMargins.reduce((s, c) => s + c.purchaseCost, 0);
  const listPrice = Math.round((totalRevenue * 1.14) / 1000) * 1000;   // liste (iskonto öncesi)
  const discount = -(listPrice - totalRevenue);                        // iskonto → net satışa iner
  const landed = -Math.round((totalCost * 0.10) / 1000) * 1000;        // navlun+gümrük
  const fx = -Math.round((totalCost * 0.07) / 1000) * 1000;            // kur etkisi
  const baseCogs = -(totalCost - (-landed) - (-fx));                   // temel alım maliyeti (SMM çekirdeği)
  const grossProfit = listPrice + discount + landed + fx + baseCogs;
  return [
    { name: 'Liste Fiyatı', nameEN: 'List Price', val: listPrice, isTotal: true },
    { name: 'İskonto', nameEN: 'Discount', val: discount },
    { name: 'Landed Cost', nameEN: 'Landed Cost', val: landed },
    { name: 'Kur Etkisi', nameEN: 'FX Impact', val: fx },
    { name: 'SMM', nameEN: 'COGS', val: baseCogs },
    { name: 'Brüt Kar', nameEN: 'Gross Profit', val: grossProfit, isTotal: true },
  ];
})();

// Karlılık özet metrikleri (KPI bandı).
export const profitSummary = (() => {
  const totalRevenue = categoryMargins.reduce((s, c) => s + c.revenue, 0);
  const totalCost = categoryMargins.reduce((s, c) => s + c.purchaseCost, 0);
  const grossMargin = Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10;
  const cogsToRevenue = Math.round((totalCost / totalRevenue) * 1000) / 10;
  const avgSupplierMargin = Math.round((supplierMargins.reduce((s, x) => s + x.grossMargin, 0) / supplierMargins.length) * 10) / 10;
  const avgCategoryMargin = Math.round((categoryMargins.reduce((s, x) => s + x.grossMargin, 0) / categoryMargins.length) * 10) / 10;
  const landedErosionBps = Math.round(categoryMargins.reduce((s, x) => s + x.landedImpactBps, 0) / categoryMargins.length);
  const topMargin = [...supplierMargins].sort((a, b) => b.grossMargin - a.grossMargin)[0];
  return {
    grossMargin,
    cogsTotal: totalCost,
    cogsToRevenue,
    purchasingImpactBps: rint(35, 120),      // satın alma marj etkisi (bps, + iyi)
    avgSupplierMargin,
    avgCategoryMargin,
    landedErosionBps,                        // negatif (aşınma)
    topMarginSupplier: topMargin.supplier,
    topMarginValue: topMargin.grossMargin,
    negativeMarginCount: negativeMarginSkus.length,
    priceAbsorption: rfloat(18, 34),         // fiyat artışı emilim % (yansıtılamayan)
    gmroi: rfloat(2.4, 4.2),                 // GMROI oranı
  };
})();

// ── Özet sayaçlar (rapor/doğrulama için) ────────────────────────────────────
export const PROC_COUNTS = {
  suppliers: suppliers.length,
  buyers: buyers.length,
  purchaseRequests: purchaseRequests.length,
  purchaseOrders: purchaseOrders.length,
  quotes: quotes.length,
  payableInvoices: payableInvoices.length,
  spendRecords: spendRecords.length,
  fxRates: fxRates.length,
  brands: PROC_BRANDS.length,
  stockItems: stockItems.length,
};
