// Çek/Kredi motoru veri modeli — docs/cashflow-brief.md SECTION A.1
// Banka otomatik beslemesi YOK; tümü manuel giriş. UI'dan bağımsız saf tipler.

export type LoanSirket = 'Muhiku Limited' | 'Muhiku Kurumsal A.Ş.' | 'Ahmet Üreme Şahsi';
export type LoanBanka = 'Ziraat' | 'İş Bankası' | 'Garanti BBVA' | 'Yapı Kredi' | 'Halkbank' | 'Vakıf Katılım' | 'Vakıfbank';
export type KrediTuru = 'İşletme' | 'Spot' | 'Rotatif' | 'Taşıt' | 'Diğer';
export type ParaBirimi = 'TRY' | 'USD';
export type OdemeSikligi = 'Aylık' | '3 Aylık';
export type InstallmentDurum = 'Ödendi' | 'Ödenecek' | 'Gecikti';
export type CheckDurum = 'Ödendi' | 'Ödenecek' | 'Karşılıksız';
export type OdemeTipi = 'Çek' | 'Senet' | 'Kredi';
export type CheckYon = 'Verilen' | 'Alınan';

/** Kredi entity — "Erken Kapama" sheet'in yapılandırılmış hali. */
export interface Loan {
  id: string;
  sirket: LoanSirket;
  banka: LoanBanka;
  krediNo: string;
  krediTuru: KrediTuru;
  paraBirimi: ParaBirimi;
  /** Kullanılan finansman (kredinin para biriminde). */
  anapara: number;
  kullandirimTarihi: string; // ISO YYYY-MM-DD
  sorguTarihi: string;
  /** Taksit sayısı (adet). */
  vadeAy: number;
  /** Aylık faiz oranı (ondalık, ör. 0.042 = %4,2). */
  faizOraniAylik: number;
  odemeSikligi: OdemeSikligi;
  /** Ödenmiş taksit sayısı (giriş). */
  odenenTaksitSayisi: number;
  /** Ortalama taksit tutarı — türev; motor doldurur (opsiyonel giriş). */
  taksitTutari?: number;
  kaynak: 'Manuel';
}

/** Amortisman satırı — motor tarafından otomatik üretilir. */
export interface LoanInstallment {
  loanId: string;
  taksitNo: string;   // "3/12"
  index: number;      // 1-tabanlı
  vadeTarihi: string; // ISO
  taksitTutari: number;
  anaparaPayi: number;
  faizPayi: number;
  bsmvPayi: number;   // faiz payı × bsmv
  kkdfPayi: number;   // faiz payı × kkdf (ticari TL → 0)
  kalanAnapara: number;
  durum: InstallmentDurum;
}

/** Çek/Senet entity — "Çek/Kredi Ödeme Listesi" sheet mantığı. */
export interface Check {
  id: string;
  cekNo: string;
  banka: LoanBanka | string;
  sirket: LoanSirket;
  tutar: number;
  duzenlemeTarihi: string; // Kullanım tarihi
  vade: string;
  odemeTipi: OdemeTipi;
  durum: CheckDurum;
  yon: CheckYon;
  taksit?: string;
  anapara?: number;
  faiz?: number;
  bsmv?: number;
  finansmanTutari?: number;
  faizOrani?: number;
  toplamMaliyet?: number;
  ciroEdildiMi?: boolean;
  karsiliksizMi?: boolean;
  not?: string;
}

/** Kredi türev/hesaplanan alanları (Kaynak: Hesaplanan). */
export interface LoanSummary {
  taksitTutari: number;
  krediToplamOdeme: number;
  odenenTaksitSayisi: number;
  odenenTaksitTutari: number;
  kalanTaksitSayisi: number;
  kalanOdemeTutari: number;
  odenenFaizVeMasraflar: number;
  kalanAnapara: number;
}

/** Erken kapama hesap çıktısı. */
export interface EarlyPayoff {
  kalanAnapara: number;
  birikmisGunlukFaiz: number;
  erkenOdemeUcreti: number;
  erkenKapamaTutari: number;
  kalanOdemeTutari: number;
  tasarruf: number;
  tasarrufYuzdesi: number;
  /** Ücret mevzuat tavanına göre "yaklaşık" hesaplandı. */
  yaklasik: boolean;
}
