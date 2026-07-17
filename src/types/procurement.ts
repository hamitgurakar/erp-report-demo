// Satın Alma (Procurement) departmanı veri modeli — PROCUREMENT_BRIEF.md ADDENDUM v2 (A2).
// Funnel: Quote (Fiyatlama Projesi) → PR (Satınalma Talebi) → PO (Satınalma Siparişi) → Teslim.
// Her Quote/PR/PO'da kaynak alanı global hesap filtresiyle (Muhiku Total / B2B / B2C) uyumludur.

export type ProcSource = 'B2B' | 'B2C';
export type Currency = 'TRY' | 'USD' | 'EUR';

/** Tedarikçi durum rozeti (mevcut Acil/Uyarı/İzle dili + İyi). */
export type SupplierStatus = 'acil' | 'uyari' | 'izle' | 'iyi';

export interface Supplier {
  id: string;              // SUP01..
  name: string;
  category: string;
  annualSpend: number;     // ₺ (yıllık)
  spendShare: number;      // toplam harcama içindeki pay %
  otif: number;            // On-Time In-Full %
  otd: number;             // On-Time Delivery %
  leadTime: number;        // ort. tedarik süresi (gün)
  leadTimeVariance: number;// lead time sapması %
  defectPPM: number;       // kusur/iade PPM
  poAccuracy: number;      // sipariş doğruluğu %
  ppv: number;             // fiyat sapması % (negatif = tasarruf)
  spiScore: number;        // Supplier Performance Index 0-100
  avgPaymentDays: number;  // A6: ort. ödeme süresi (gün)
  totalPayable: number;    // A6: bu tedarikçiye toplam borç (₺)
  overdueDays: number;     // A6: ort. gecikme (gün)
  singleSource: boolean;   // tek kaynak kritik kalem içeriyor mu
  currency: Currency;      // baskın fatura para birimi
  status: SupplierStatus;
}

export interface Buyer {
  id: string;              // BUY01..
  name: string;            // A2: jenerik mock isim (gerçek çalışan değil)
  totalSpend: number;      // ₺
  prCount: number;
  poCount: number;
  avgCompletionDays: number;
  onTimePct: number;       // zamanında tamamlama %
  openWork: number;        // açık PR + PO
  avgPaymentDays: number;  // ort. ödeme süresi (gün)
}

export type PRStatus =
  | 'Taslak' | 'Beklemede' | 'Tedarik Edilebilir' | 'İşleniyor' | 'Tamamlandı' | 'İptal';

export interface PurchaseRequest {
  id: string;              // PR26xx
  title: string;
  source: ProcSource;
  status: PRStatus;
  createdDate: string;     // YYYY-MM-DD
  completedDate: string | null;
  buyerId: string;
  poIds: string[];         // bağlı PO id'leri (0-4)
  quoteId: string | null;  // dönüştüğü fiyatlama projesi (varsa)
  ageDays: number;         // açık talep yaşı (gün)
}

export type POStatus = 'Açık' | 'Teslim Alındı' | 'Gecikmiş' | 'İptal';

export interface PurchaseOrder {
  id: string;              // PO-xxxx
  prId: string | null;     // bağlı PR (A2: bir PR'a 0-4 PO)
  supplierId: string;
  buyerId: string;
  source: ProcSource;
  orderedDate: string;     // YYYY-MM-DD
  expectedDate: string;    // beklenen teslim
  completedDate: string | null;
  amount: number;          // sipariş tutarı (₺ karşılığı)
  currency: Currency;
  lateDays: number;        // gecikme (gün, 0 = zamanında)
  status: POStatus;
}

export type QuoteStatus =
  | 'Fiyatlanacak' | 'TDR Cevap Bekleniyor' | 'Eksik Bilgi' | 'Fiyatlandı' | 'İptal' | 'Arşiv';

export interface Quote {
  id: string;              // Q26xx
  projectName: string;     // jenerik firma/proje adı
  source: ProcSource;
  status: QuoteStatus;
  openedDate: string;      // kart açılış (YYYY-MM-DD)
  pricedDate: string | null; // son fiyatlama
  pricingHours: number;    // fiyatlama süresi (saat, 2-72)
  customPrint: boolean;    // özel baskı
  buyerId: string;
  salesRep: string;        // satış sorumlusu (mock)
  converted: boolean;      // PR'a dönüştü mü
}

export type PaymentMethod = 'Havale' | 'Çek' | 'Senet' | 'Açık Hesap';
export type PayableStatus = 'Açık' | 'Gecikmiş' | 'Ödendi';

export interface PayableInvoice {
  id: string;              // INV26xx
  supplierId: string;
  amount: number;          // ₺ karşılığı
  currency: Currency;
  issueDate: string;       // YYYY-MM-DD
  dueDate: string;         // vade
  daysRemaining: number;   // kalan gün (negatif = vadesi geçmiş)
  paymentMethod: PaymentMethod;
  status: PayableStatus;
  reconciled: boolean;     // BA-BS mutabakat durumu
}

export interface SpendRecord {
  month: string;           // 'Oca' .. 'Ara' (12 aylık)
  category: string;
  brand: string;           // A2: marka boyutu (jenerik)
  source: ProcSource;
  amount: number;          // ₺
  currency: Currency;
}

export interface FxRate {
  month: string;           // 'Oca' .. 'Ara'
  usdTry: number;
  eurTry: number;
  isPrediction: boolean;   // 2026 tahminleri "prediction" olarak işaretli (gerçek değil)
}

// ── Stok & İkmal (Stock & Replenishment) — SADECE tedarik tetikleme perspektifi.
// Çakışma kuralı (brief d): envanter değerleme/yaşlanma Category>Stok'ta kalır;
// burada yalnızca ROP / days of supply / açık PO / gelen teslimat gösterilir.
export type ReplenishStatus = 'acil' | 'uyari' | 'izle' | 'iyi';

export interface StockItem {
  sku: string;              // SKU-xxxx
  name: string;             // ürün adı
  category: string;
  supplierId: string;
  supplierName: string;
  onHand: number;           // eldeki adet
  reorderPoint: number;     // ROP = (ort. günlük satış × lead time) + emniyet stoğu
  safetyStock: number;      // emniyet stoğu (adet)
  avgDailyUsage: number;    // ort. günlük tüketim (adet/gün)
  leadTime: number;         // tedarik süresi (gün)
  daysOfSupply: number;     // eldeki ÷ ort. günlük tüketim
  eoq: number;              // önerilen sipariş miktarı (EOQ, adet)
  landedUnitCost: number;   // tahmini landed cost (₺/adet)
  status: ReplenishStatus;
}

// Bekleyen teslimat haftalık timeline (gelen inbound planlama)
export interface WeekDelivery {
  week: string;             // 'H1'..'H8' (yaklaşan 8 hafta)
  label: string;            // '14 Tem' gibi hafta başlangıcı etiketi
  poCount: number;          // o hafta beklenen PO adedi
  value: number;            // ₺ karşılığı beklenen giriş değeri
  isThisWeek: boolean;      // bu hafta (7 günlük pencere)
}

// ── Karlılık (Profitability) — SATIN ALMANIN brüt marja katkısı perspektifi.
// Çakışma kuralı (brief d): ürün satış karlılığı Category'de kalır; burada
// alım maliyeti / landed cost / kur → marj köprüsü ve SMM tarafı gösterilir.
export type NegMarginReason = 'Kur' | 'Navlun' | 'Zam';

export interface CategoryMargin {
  category: string;
  purchaseCost: number;     // alım maliyeti (₺)
  revenue: number;          // satış geliri (₺)
  grossMargin: number;      // brüt marj %
  landedImpactBps: number;  // landed cost marj etkisi (bps, negatif = aşınma)
  volume: number;           // hacim (adet) — scatter balon boyutu
  trend: number[];          // son 6 ay marj % sparkline
}

export interface SupplierMargin {
  supplier: string;
  category: string;
  marginContribution: number; // brüt marj katkısı (₺)
  grossMargin: number;        // brüt marj %
}

export interface NegativeMarginSku {
  sku: string;
  name: string;
  fullCost: number;         // tam maliyet (₺/adet)
  salePrice: number;        // satış fiyatı (₺/adet)
  margin: number;           // marj % (negatif)
  reason: NegMarginReason;  // kur / navlun / zam
}

// Tek-kaynak riski (Tedarikçi sayfası tablo 2)
export interface SingleSourceItem {
  item: string;
  category: string;
  supplierId: string;
  supplierName: string;
  annualSpend: number;     // ₺
  hasAlternative: boolean;
  qualified: boolean;      // alternatif nitelendirildi mi
}
