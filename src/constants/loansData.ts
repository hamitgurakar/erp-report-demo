// Çek/Kredi demo seed — docs/cashflow-brief.md SECTION A.4 büyüklüklerine yakın.
// 14 aktif kredi (TRY toplam ≈ 31,8M + 1 USD kredi), 3 şirket × 7 banka; ~16 çek/senet.
// Deterministik, gerçekçi TR tutar/tarih. Kaynak: tümü Manuel giriş.
import type { Loan, Check } from '../types/loans';

const SORGU = '2026-07-20';

export const loansSeed: Loan[] = [
  { id: 'L01', sirket: 'Muhiku Limited', banka: 'İş Bankası', krediNo: 'ISB-2024-88140', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 5_000_000, kullandirimTarihi: '2024-11-05', sorguTarihi: SORGU, vadeAy: 36, faizOraniAylik: 0.042, odemeSikligi: 'Aylık', odenenTaksitSayisi: 20, kaynak: 'Manuel' },
  { id: 'L02', sirket: 'Muhiku Limited', banka: 'Ziraat', krediNo: 'ZRT-2025-10233', krediTuru: 'Taşıt', paraBirimi: 'TRY', anapara: 1_200_000, kullandirimTarihi: '2025-02-10', sorguTarihi: SORGU, vadeAy: 24, faizOraniAylik: 0.039, odemeSikligi: 'Aylık', odenenTaksitSayisi: 17, kaynak: 'Manuel' },
  { id: 'L03', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'Garanti BBVA', krediNo: 'GRN-2025-45501', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 4_500_000, kullandirimTarihi: '2025-06-01', sorguTarihi: SORGU, vadeAy: 24, faizOraniAylik: 0.044, odemeSikligi: 'Aylık', odenenTaksitSayisi: 13, kaynak: 'Manuel' },
  { id: 'L04', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'Yapı Kredi', krediNo: 'YKB-2025-77120', krediTuru: 'Spot', paraBirimi: 'TRY', anapara: 3_000_000, kullandirimTarihi: '2025-09-15', sorguTarihi: SORGU, vadeAy: 12, faizOraniAylik: 0.046, odemeSikligi: 'Aylık', odenenTaksitSayisi: 10, kaynak: 'Manuel' },
  { id: 'L05', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'Halkbank', krediNo: 'HLK-2024-33098', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 2_800_000, kullandirimTarihi: '2024-07-20', sorguTarihi: SORGU, vadeAy: 36, faizOraniAylik: 0.040, odemeSikligi: 'Aylık', odenenTaksitSayisi: 24, kaynak: 'Manuel' },
  { id: 'L06', sirket: 'Ahmet Üreme Şahsi', banka: 'Vakıfbank', krediNo: 'VKB-2023-90411', krediTuru: 'Taşıt', paraBirimi: 'TRY', anapara: 900_000, kullandirimTarihi: '2023-12-01', sorguTarihi: SORGU, vadeAy: 48, faizOraniAylik: 0.038, odemeSikligi: 'Aylık', odenenTaksitSayisi: 31, kaynak: 'Manuel' },
  { id: 'L07', sirket: 'Muhiku Limited', banka: 'Garanti BBVA', krediNo: 'GRN-2026-11875', krediTuru: 'Rotatif', paraBirimi: 'TRY', anapara: 1_500_000, kullandirimTarihi: '2026-01-10', sorguTarihi: SORGU, vadeAy: 12, faizOraniAylik: 0.048, odemeSikligi: 'Aylık', odenenTaksitSayisi: 6, kaynak: 'Manuel' },
  { id: 'L08', sirket: 'Muhiku Limited', banka: 'Vakıf Katılım', krediNo: 'VKF-2025-20517', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 3_200_000, kullandirimTarihi: '2025-03-01', sorguTarihi: SORGU, vadeAy: 8, faizOraniAylik: 0.041, odemeSikligi: '3 Aylık', odenenTaksitSayisi: 5, kaynak: 'Manuel' },
  { id: 'L09', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'İş Bankası', krediNo: 'ISB-2025-64230', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 3_500_000, kullandirimTarihi: '2025-08-01', sorguTarihi: SORGU, vadeAy: 36, faizOraniAylik: 0.043, odemeSikligi: 'Aylık', odenenTaksitSayisi: 11, kaynak: 'Manuel' },
  { id: 'L10', sirket: 'Ahmet Üreme Şahsi', banka: 'Ziraat', krediNo: 'ZRT-2025-71844', krediTuru: 'Diğer', paraBirimi: 'TRY', anapara: 600_000, kullandirimTarihi: '2025-10-05', sorguTarihi: SORGU, vadeAy: 12, faizOraniAylik: 0.045, odemeSikligi: 'Aylık', odenenTaksitSayisi: 9, kaynak: 'Manuel' },
  { id: 'L11', sirket: 'Muhiku Limited', banka: 'Halkbank', krediNo: 'HLK-2025-50129', krediTuru: 'İşletme', paraBirimi: 'TRY', anapara: 2_400_000, kullandirimTarihi: '2025-01-15', sorguTarihi: SORGU, vadeAy: 24, faizOraniAylik: 0.040, odemeSikligi: 'Aylık', odenenTaksitSayisi: 18, kaynak: 'Manuel' },
  { id: 'L12', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'Vakıfbank', krediNo: 'VKB-2025-38260', krediTuru: 'Spot', paraBirimi: 'TRY', anapara: 1_800_000, kullandirimTarihi: '2025-07-01', sorguTarihi: SORGU, vadeAy: 18, faizOraniAylik: 0.047, odemeSikligi: 'Aylık', odenenTaksitSayisi: 12, kaynak: 'Manuel' },
  { id: 'L13', sirket: 'Muhiku Limited', banka: 'Garanti BBVA', krediNo: 'GRN-2026-14902', krediTuru: 'Taşıt', paraBirimi: 'TRY', anapara: 1_400_000, kullandirimTarihi: '2026-02-01', sorguTarihi: SORGU, vadeAy: 36, faizOraniAylik: 0.038, odemeSikligi: 'Aylık', odenenTaksitSayisi: 5, kaynak: 'Manuel' },
  // USD ticari kredi — anapara USD cinsinden (KKDF %1 profili).
  { id: 'L14', sirket: 'Muhiku Kurumsal A.Ş.', banka: 'Garanti BBVA', krediNo: 'GRN-2025-USD-337', krediTuru: 'İşletme', paraBirimi: 'USD', anapara: 300_000, kullandirimTarihi: '2025-05-20', sorguTarihi: SORGU, vadeAy: 24, faizOraniAylik: 0.011, odemeSikligi: 'Aylık', odenenTaksitSayisi: 14, kaynak: 'Manuel' },
];

export const checksSeed: Check[] = [
  // Verilen (borç tarafı) — toplam ≈ 2,72M
  { id: 'C01', cekNo: 'ÇK-880141', banka: 'İş Bankası', sirket: 'Muhiku Limited', tutar: 320_000, duzenlemeTarihi: '2026-06-05', vade: '2026-08-05', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Anadolu Ambalaj' },
  { id: 'C02', cekNo: 'ÇK-880142', banka: 'Garanti BBVA', sirket: 'Muhiku Limited', tutar: 185_000, duzenlemeTarihi: '2026-06-20', vade: '2026-08-20', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Doğu Tekstil' },
  { id: 'C03', cekNo: 'SN-4471', banka: 'Yapı Kredi', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 240_000, duzenlemeTarihi: '2026-06-10', vade: '2026-09-10', odemeTipi: 'Senet', durum: 'Ödenecek', yon: 'Verilen', not: 'Mavi Plastik' },
  { id: 'C04', cekNo: 'ÇK-880143', banka: 'Ziraat', sirket: 'Muhiku Limited', tutar: 142_000, duzenlemeTarihi: '2026-05-01', vade: '2026-07-01', odemeTipi: 'Çek', durum: 'Ödendi', yon: 'Verilen', not: 'Star Baskı & Etiket' },
  { id: 'C05', cekNo: 'ÇK-880144', banka: 'Halkbank', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 96_000, duzenlemeTarihi: '2026-06-30', vade: '2026-08-30', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Kuzey Lojistik' },
  { id: 'C06', cekNo: 'ÇK-880145', banka: 'İş Bankası', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 210_000, duzenlemeTarihi: '2026-04-15', vade: '2026-06-15', odemeTipi: 'Çek', durum: 'Ödendi', yon: 'Verilen', not: 'Ege Kimya' },
  { id: 'C07', cekNo: 'SN-4472', banka: 'Vakıfbank', sirket: 'Ahmet Üreme Şahsi', tutar: 175_000, duzenlemeTarihi: '2026-07-01', vade: '2026-10-01', odemeTipi: 'Senet', durum: 'Ödenecek', yon: 'Verilen', not: 'Mermer Nakliyat' },
  { id: 'C08', cekNo: 'ÇK-880146', banka: 'Garanti BBVA', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 410_000, duzenlemeTarihi: '2026-07-25', vade: '2026-09-25', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Bursa Metal' },
  { id: 'C09', cekNo: 'ÇK-880147', banka: 'Halkbank', sirket: 'Muhiku Limited', tutar: 128_000, duzenlemeTarihi: '2026-05-10', vade: '2026-07-10', odemeTipi: 'Çek', durum: 'Karşılıksız', yon: 'Verilen', karsiliksizMi: true, not: 'Akdeniz Gıda — karşılıksız' },
  { id: 'C10', cekNo: 'ÇK-880148', banka: 'Vakıf Katılım', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 265_000, duzenlemeTarihi: '2026-09-05', vade: '2026-11-05', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Trakya Cam' },
  { id: 'C11', cekNo: 'ÇK-880149', banka: 'İş Bankası', sirket: 'Muhiku Limited', tutar: 550_000, duzenlemeTarihi: '2026-10-01', vade: '2026-12-01', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Verilen', not: 'Marmara Ambalaj' },
  // Alınan (alacak tarafı)
  { id: 'C12', cekNo: 'ÇK-991201', banka: 'Garanti BBVA', sirket: 'Muhiku Limited', tutar: 480_000, duzenlemeTarihi: '2026-06-15', vade: '2026-08-15', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Alınan', not: 'Yıldız Hediyelik' },
  { id: 'C13', cekNo: 'ÇK-991202', banka: 'Ziraat', sirket: 'Muhiku Limited', tutar: 320_000, duzenlemeTarihi: '2026-05-05', vade: '2026-07-05', odemeTipi: 'Çek', durum: 'Ödendi', yon: 'Alınan', ciroEdildiMi: true, not: 'Ada Mağazacılık' },
  { id: 'C14', cekNo: 'SN-7781', banka: 'Yapı Kredi', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 210_000, duzenlemeTarihi: '2026-06-01', vade: '2026-09-01', odemeTipi: 'Senet', durum: 'Ödenecek', yon: 'Alınan', not: 'Ege Toptan Dağıtım' },
  { id: 'C15', cekNo: 'ÇK-991203', banka: 'Halkbank', sirket: 'Muhiku Kurumsal A.Ş.', tutar: 165_000, duzenlemeTarihi: '2026-05-12', vade: '2026-07-12', odemeTipi: 'Çek', durum: 'Karşılıksız', yon: 'Alınan', karsiliksizMi: true, not: 'Bosphorus Retail — karşılıksız' },
  { id: 'C16', cekNo: 'ÇK-991204', banka: 'Garanti BBVA', sirket: 'Muhiku Limited', tutar: 290_000, duzenlemeTarihi: '2026-08-20', vade: '2026-10-20', odemeTipi: 'Çek', durum: 'Ödenecek', yon: 'Alınan', not: 'Marmara Perakende' },
];
