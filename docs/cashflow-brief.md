# Muhiku Finans Modülü — Nakit Akışı Komuta Merkezi, Çek/Kredi Giriş Sistemi ve Recurring İşlem Motoru: Tasarım & Spesifikasyon Dokümanı

> **Kapsam:** Bu doküman, mevcut Muhiku finans/muhasebe rapor paketini genişleten üç yeni yapı (Çek/Kredi Giriş, Nakit Akışı, Recurring motor) ile gauge chart düzeltme notunun tam tasarım blueprint'idir. React 19 + Recharts + TS + Vite mimarisine, Paraşüt+ERP ekosistemine ve Türk orta-ölçek e-ticaret/perakende/hediyelik bağlamına göre yazılmıştır. Teknik terimler İngilizce bırakılmıştır. Çıktı, sayfa-sayfa Claude Code prompt'larına dönüştürülmeye hazır olacak ayrıntıdadır. Demo veriler kullanılmıştır.

---

## TL;DR
- **Üç yeni yapı önerilir ve şu sırayla inşa edilmelidir:** (A) "Finansal Veriler" içinde manuel **Çek/Kredi Giriş** alanı (otomatik amortisman tablosu + erken kapama/tasarruf motoru); (B) "Muhasebe" altında **operasyonel Nakit Akışı komuta merkezi** (direkt yöntem 13-haftalık rolling TWCF + günlük/haftalık/aylık görünüm + best/base/worst senaryo + forecast-vs-actual varyans + banka bazlı pozisyon); (C) "Finansal Veriler"den açılan **Recurring gelir/gider motoru** (iCalendar RFC 5545 / RRULE tabanlı seri + EXDATE/override kayıtları, Google Calendar "bu/bu ve sonraki/tümü" düzenleme modeli).
- **Türk vergi bağlamı motorun kalbidir ve tüketici kredisinden kesinlikle ayrılmalıdır:** Muhiku'nun kullandığı **ticari TL kredilerde KKDF %0**'dır (dayanak: 88/12944 sayılı Karar ve KKDF Tebliği Sıra No:6 md.2 — Logo Blog 2026: *"ticari kredilerde... bu oran %0 olarak uygulanmaktadır"*), **BSMV ise faiz tutarı üzerinden %5**'tir. Tüketici kredisinde bu oranlar %15/%15 olurdu. Ticari döviz/altın kredilerde ise KKDF 18 Temmuz 2025'ten itibaren %1'dir (PwC Türkiye, RG No.32959).
- **Nakit Akışı sayfası mevcut "Nakit & Likidite" sayfasını tekrar etmemeli, tamamlamalıdır:** eski sayfa oran/likidite analizidir (CCC, likidite gauge'ları, runway); yeni sayfa operasyonel/forecasting motorudur. **Gauge chart'lar** RadialBarChart `startAngle=180 / endAngle=0` + SVG needle overlay ya da dedicated lib (MUI X Gauge / react-gauge-component / ApexCharts radialBar) ile düzeltilmelidir.

---

## Key Findings (Araştırma Temelli Kararlar)

1. **13-haftalık rolling direkt forecast (TWCF) sektör standardıdır ve Section B'nin omurgası olmalıdır.** 2024 AFP Liquidity Survey (Transformance aktarımı): *"71% of treasurers run a rolling 13-week forecast. It's the single most common short-term cash discipline in corporate finance."* 13 hafta tam bir mali çeyreğe denk gelir; yakın vadede işlem-düzeyi kesinlik (faturalar, taksitler, çek vadeleri) sunarken üç ay ötesi için yön verir (Ripple Treasury, Embat, Atlar). Direkt yöntem (receipts & disbursements) kısa vade için; indirect yöntem uzun vade/finansal-tablo türevi içindir (Trovata, GTreasury) — Muhiku'da indirect zaten başka yerde var, yeni sayfa **direkt operasyonel** olmalı.

2. **Forecast doğruluğu ölçülebilir bir KPI olmalı.** Nilus benchmark: *"±5% variance at 30 days and ±15% at 90 days"*; Transformance: *"should hit within 5-10% variance on weekly net cash flow by Week 4."* Bu eşikler AI uyarı motorunun tetikleyicisi olur.

3. **Erken kapama Türkiye'de gerçek bir tasarruf motorudur.** Tüketici kredisinde erken kapama cezasızdır (6502 sK); kalan taksitlerdeki tüm faiz+KKDF+BSMV tasarrufa döner. **Ticari kredilerde** ise TCMB tavanı uygulanır: 2020/4 sayılı Tebliğ'de 28 Haziran 2024 RG ile yapılan değişiklikle (1 Temmuz 2024'ten geçerli) sabit faizli TL/YP kredi türünü dikkate alan hesaplamaya geçilmiştir (ProCompliance: *"sabit oranlı Türk Lirası (TL) ve yabancı para (YP) kredi türünü dikkate alan bir hesaplamaya geçilmiştir"*). Değişken faizlide TCMB 2024 Faaliyet Raporu: *"Değişken faizli kredilerde ise erken ödeme ücreti azami yüzde 2 olarak düzenlenmiştir."*

4. **Türk muhasebe araçları çek/senet'i vade-bazlı portföy + rota (giriş/ciro/teminat/tahsil/karşılıksız) olarak yönetir.** Paraşüt çeki vade tarihine göre nakit akışına yansıtır ve akıllı hatırlatma verir; Logo/Mikro çek-senet bordro modülü ile müşteri çeki/kendi çekimiz ayrımı, ciro, bankaya tahsile/teminata çıkış rotalarını izler. Muhiku bu portföy + rota mantığını benimsemelidir.

5. **Recurring için iCalendar RFC 5545 modeli endüstri standardıdır.** RRULE (kural) + RDATE/EXDATE (istisna tarihleri) + RECURRENCE-ID (tek oluşum override). Google Calendar'ın "Bu etkinlik / Bu ve sonraki etkinlikler / Tüm etkinlikler" düzenleme modeli, QuickBooks'un "one time only / update for all" davranışı, Xero repeating invoice/bill, YNAB/Actual scheduled transactions bunun ürünleşmiş halleridir. Actual Budget "hafta sonuna denk gelirse taşı" ve "ayın son günü" gibi ince davranışları da destekler — Muhiku'nun kira/yazılım senaryoları için gereklidir.

---

## SECTION A — Çek/Kredi Giriş (Check/Loan Entry)
*Konum: "Finansal Veriler" içinde yeni bir alan/tab. Banka otomatik beslemesi YOK — tümü manuel giriş.*

### A.1 Veri Modeli

**`Loan` (Kredi) entity — "Erken Kapama" sheet'in yapılandırılmış hali:**
| Alan | Tip | Not |
|---|---|---|
| id | uuid | |
| sirket | enum | Muhiku Limited / Muhiku Kurumsal A.Ş. / Ahmet Üreme Şahsi |
| banka | enum | Ziraat, İş, Garanti BBVA, Yapı Kredi, Halkbank, Vakıf Katılım, Vakıfbank |
| krediNo | string | |
| krediTuru | enum | İşletme / Spot / Rotatif / Taşıt / Diğer (BSMV/KKDF muafiyeti bu alana bağlı) |
| paraBirimi | enum | TRY / USD (KKDF: TL ticari %0, döviz ticari %1) |
| anapara | number | Kullanılan Finansman |
| kullandirimTarihi | date | Kredi Kullandırım Tarihi |
| sorguTarihi | date | |
| vadeAy | int | Taksit Sayısı |
| faizOraniAylik | number | |
| odemeSikligi | enum | Aylık / 3 Aylık |
| taksitTutari | number | Ortalama Taksit Tutarı türev |
| kaynak | badge | Manuel (mevcut Kaynak badge sistemi) |

Türev/hesaplanan alanlar (Kaynak: **Hesaplanan** badge): `krediToplamOdeme`, `odenenTaksitSayisi`, `odenenTaksitTutari`, `kalanOdemeTutari`, `odenenFaizVeMasraflar`, `erkenKapamaTutari`, `kalanOdemedenTasarruf`, `tasarrufYuzdesi`.

**`LoanInstallment` (amortisman satırı — otomatik üretilir):**
`loanId`, `taksitNo` ("3/12" formatı), `vadeTarihi`, `taksitTutari`, `anaparaPayi`, `faizPayi`, `bsmvPayi`, `kkdfPayi` (ticari TL için 0), `kalanAnapara`, `durum` (Ödendi/Ödenecek/Gecikti).

**`Check` (Çek/Senet) entity — "Çek/Kredi Ödeme Listesi" sheet mantığı:**
`id`, `cekNo` / `senetNo`, `banka`, `sirket`, `tutar`, `duzenlemeTarihi` (Kullanım Tarihi), `vade`, `odemeTipi` (Çek/Senet/Kredi), `durum` (Ödendi/Ödenecek), `yon` (Verilen/Alınan), `taksit` ("3/12"), `anapara`, `faiz`, `bsmv`, `finansmanTutari`, `faizOrani`, `toplamMaliyet`, `ciroEdildiMi`, `karsiliksizMi`, `not`.

### A.2 Amortisman ve Erken Kapama Motoru

**Eşit taksit (anüite) formülü** — Türk bankalarının evrensel standardı:
```
Taksit = Anapara × [ r(1+r)^n ] / [ (1+r)^n − 1 ]
r = aylık faiz oranı, n = taksit sayısı
```

**Amortisman üretimi:** Her taksitte `faizPayi = kalanAnapara × r`; `anaparaPayi = taksit − faizPayi`; ilk taksitlerde faiz ağırlıklı, sona doğru anapara ağırlıklı (front-loaded interest).

**Vergi split (ticari TL kredi):** Her taksitin **faiz payı üzerinden BSMV %5** hesaplanır (ana para üzerinden değil — Hesapkurdu: *"Kredilerde BSMV, ana para üzerinden değil, kredi faizi üzerinden hesaplanır"*). **KKDF ticari TL kredide %0**'dır (Logo Blog 2026: *"2026 yılında da bireysel ihtiyaç ve taşıt kredilerinde uygulanan KKDF oranı %15... ticari kredilerde... bu oran %0 olarak uygulanmaktadır"*; dayanak 88/12944 sayılı Karar + KKDF Tebliği Sıra No:6 md.2). Motor `krediTuru`+`paraBirimi`'ne göre oranı seçmeli: ticari TL → KKDF %0/BSMV %5; ticari döviz → KKDF %1; tüketici → KKDF %15/BSMV %15.

**Erken kapama hesaplayıcı ("Erken Kapama" sheet çıktısını üretir):**
```
Erken Kapama Tutarı = Kalan Anapara
                    + Birikmiş Günlük Faiz (Kalan Anapara × aylık faiz ÷ 30 × geçen gün)
                    + Erken Ödeme Ücreti (sadece sabit faizli ticari kredi, TCMB tavanı)
Kalan Ödemeden Tasarruf = (Kalan Taksit Sayısı × Taksit) − Erken Kapama Tutarı
Tasarruf Yüzdesi = Tasarruf ÷ Kalan Ödeme Tutarı
```
**Erken ödeme ücreti tavanı (sabit faizli TL ticari, 1 Temmuz 2024'ten — TCMB 2020/4 Tebliği'nin 2024/16 ile değişik hali):** `(yıllık bileşik faiz × %5) + (kalan ağırlıklı ortalama vade [ay] × %0,20)`, kalan anapara üzerinden. Örnek (TeklifimGelsin): *"yıllık faiz oranı %18 ve kalan vade 30 ay ise, azami erken ödeme ücreti %6,9'dur. Bu oran, kalan anapara üzerinden hesaplanır."* **Değişken faizlide** TCMB 2024 Faaliyet Raporu: *"Değişken faizli kredilerde ise erken ödeme ücreti azami yüzde 2 olarak düzenlenmiştir."* UI, kredinin ilk çeyreğinde erken kapamanın en yüksek tasarrufu sağladığını (faiz front-loaded olduğu için) bir uyarı olarak göstermelidir.

### A.3 Akış Entegrasyonu (kritik — bu modül silo olmamalı)
- **→ Nakit Akışı modülü:** Onaylı taksitler ve çek vadeleri "scheduled outflow" olarak günlük/13-haftalık forecast'e `Kredi` ve `Çek` kategori satırlarında düşer.
- **→ Borçluluk & Sermaye sayfası:** Loan register → debt maturity ladder (vade merdiveni) + debt-by-bank envanteri; kalan anapara toplamı → net borç.
- **→ Alacak/Borç:** Alınan çekler alacak tarafına, verilen çekler/senetler borç tarafına.

### A.4 KPI Kartları, Grafikler, Tablolar
**KPI kartları (demo):** Toplam Finansman ≈ 32,6M TRY · Toplam Ödeme ≈ 54,5M · Kalan Ödeme ≈ 47,3M · Erken Kapama Tutarı ≈ 32,5M · Toplam Tasarruf Potansiyeli ≈ 14,8M · Kuruma göre borç: Çek 2,72M / Kredi 37,7M / Toplam 40,45M.

**Grafikler:**
- **Amortisman eğrisi** (stacked area: anapara payı vs faiz payı zaman içinde). *Neden:* Bankrate/HSH amortisman tablosu — erken dönemde faiz ağırlığı görselleştirilir.
- **Erken kapama tasarruf bar** (kredi bazında tasarruf tutarı + %). *Neden:* Total Mortgage/HSH prepayment savings calculator.
- **Banka bazlı borç donut** (7 banka).
- **Yaklaşan taksit timeline** (önümüzdeki 90 gün).

**Tablolar:**
- **Loan register:** Şirket · Banka · Kredi No · Anapara · Vade · Ödenen/Kalan Taksit · Kalan Ödeme · **Erken Kapama Tutarı · Tasarruf · Tasarruf %** · aksiyon (Erken Kapama Hesapla, Amortisman Gör).
- **Check register:** Çek No · Banka · Şirket · Tutar · Vade · Tip (Çek/Senet) · Yön (Verilen/Alınan) · Durum badge (Ödendi/Ödenecek/Karşılıksız) · Not.

**Neden (gerçek araç referansları):** QuickBooks kredi/kira ödemelerini "Scheduled" recurring template ile otomatik işler; Xero repeating bill ile tekrar eden borç ödemesi yönetir; **Paraşüt** çeki vade tarihine göre nakit akışı raporuna ve "Güncel Durum" ekranına yansıtır, portföy/tedarikçi ayrımı ve akıllı hatırlatma sunar; **Logo/Mikro** çek-senet bordro modülünde müşteri çeki/kendi çekimiz ayrımı, ciro, bankaya tahsile/teminata çıkış ve karşılıksız rotalarını izler; bankalar (QNB, Hesapkurdu) amortisman tablosunu KKDF+BSMV dahil üretir.

---

## SECTION B — Nakit Akışı (Cash Flow) Komuta Merkezi
*Konum: "Muhasebe" altında standalone sayfa. Kullanıcının deyişiyle "nakit akışı şirketin her şeyi" — bu en önemli modül.*

### B.1 Sınır Tanımı (mevcut "Nakit & Likidite" ile çakışmayı önle)
| | Mevcut "Nakit & Likidite" | Yeni "Nakit Akışı" |
|---|---|---|
| Doğa | Oran/likidite **analizi** | Operasyonel **forecasting & yönetim** |
| İçerik | CCC bileşenleri, likidite/runway gauge, FCF trend, likidite oranları | Direkt yöntem 13-haftalık TWCF, günlük/haftalık/aylık görünüm, senaryo, varyans, banka pozisyonu |
| Yöntem | Türev/ratio | Direkt (receipts & disbursements) |
| Soru | "Sağlıklı mıyım?" | "Önümüzdeki 13 hafta hangi gün ne kadar nakdim olacak?" |

*Neden:* Trovata/GTreasury — direkt yöntem kısa vadeli likidite, indirect uzun vadeli planlama içindir; Agicap kendini "FP&A'yı tamamlayan günlük nakit yönetimi" olarak konumlar. Indirect method (CFO/CFI/CFF) Muhiku'da zaten mevcut olduğundan bu sayfa **sadece direkt operasyonel** olmalıdır.

### B.2 KPI Kartları (formül + iyi yön)
| KPI | Formül | İyi yön |
|---|---|---|
| Bugünkü Nakit Pozisyonu | Σ tüm banka bakiyeleri | ↑ |
| Net Nakit Akışı (hafta/ay) | Toplam Gelir − Toplam Gider | ↑ |
| Cash Burn (aylık) | (Dönem başı nakit − Dönem sonu nakit) ÷ ay | ↓ |
| Net Burn | Aylık nakit çıkış − aylık nakit giriş | ↓ |
| Runway (ay) | Mevcut Nakit ÷ Aylık Net Burn | ↑ |
| 13-hafta sonu projekte bakiye | Açılış + Σ(net haftalık akış) | ↑ |
| Forecast Doğruluğu / Varyans % | (Gerçek − Tahmin) ÷ Tahmin | ↓ (hedef: 30 günde ±%5, 90 günde ±%15) |
| En düşük projekte bakiye (13 hafta) | min(haftalık bakiye) | ↑ (negatifse 🔴) |

*Neden (formüller):* Corporate Finance Institute / Geckoboard / Wall Street Prep runway=nakit÷burn; Ramp forecast variance=(gerçek−tahmin)/tahmin; varyans eşikleri Nilus (*"±5% variance at 30 days and ±15% at 90 days"*) ve Transformance.

### B.3 Grafikler / Görselleştirmeler
- **13-haftalık rolling forecast** (combo: haftalık giriş/çıkış bar + kümülatif bakiye line; her hafta kapanınca sona yeni hafta eklenir). *Neden:* treasury standardı — 2024 AFP Liquidity Survey: *"71% of treasurers run a rolling 13-week forecast";* Float ve Agicap 13-week + weekly/monthly toggle sunar.
- **Cash bridge / waterfall** (Açılış bakiye → +tahsilatlar → −tedarikçi/çek/kredi/kira/vergi → Kapanış). *Neden:* Agicap/mevcut Nakit&Likidite cash bridge deseni.
- **Senaryo çizgileri (best/base/worst)** aynı grafik üzerinde. *Neden:* Ripple Treasury *"at least three scenarios";* Agicap/Float scenario planning; Float "safety net threshold" tarihi.
- **Kategori kırılımı** (stacked bar/treemap: Tedarikçi, Çek, Kredi, Kira, Yazılım, Pazarlama, Lojistik, Yönetim, Yapılandırma&Vergi, Ek Hesap&K.Kartı, Diğer).
- **Banka bazlı nakit pozisyonu** (stacked bar: Ziraat, İş, Garanti BBVA, Yapı Kredi, Halkbank, Vakıf Katılım, Vakıfbank). *Neden:* Agicap multi-bank consolidated position; treasury "how much / where / when."
- **Forecast vs Actual varyans** (bar + hata çubuğu; hafta bazında sapma). *Neden:* Agicap/CashAnalytics variance analysis, Tesorio weekly reconciliation.
- **USD/TRY köprüsü** (aylık TRY tutar + USD karşılığı — mevcut "USD TRY Monthly" sheet).

### B.4 Tablo Spesifikasyonu (Günlük Nakit Akışı grid — mevcut sheet mantığı)
Kolonlar = tarihler (yatay, günlük→haftalık→aylık toggle). Satırlar:
- **Gelirler:** Muhiku LTD Pos · Muhiku Kurumsal · Finansal Kredi · **Toplam Gelirler**
- **Ödemeler:** Tedarikçi · Çek · Kredi · Kira · Yazılım · Pazarlama · Lojistik · Yönetim · Yapılandırma&Vergi · Diğer · Ek Hesap&K.Kartı · **Toplam Giderler**
- **Net Nakit Akışı** · **Bakiye (running/kümülatif)**

Özellikler: Kaynak badge (ERP/Paraşüt/Manuel/Hesaplanan/Forecast) · forecast hücreleri kesikli/gri, actual hücreleri dolu · period-over-period % change · negatif bakiye hücresi 🔴 · hücreye tıkla → o günün işlem drill-down · CSV export. *Neden:* Ripple/CashAnalytics weekly reporting grid; Paraşüt "12 hafta / 12 ay" tahsilat-ödeme filtresi.

### B.5 AI Öneri/Uyarı Örnekleri (plausible demo)
- 🔴 **"14. hafta bakiyesi −1,2M TRY'ye düşüyor:** İş Bankası kredi taksiti (850K) ile büyük tedarikçi ödemesi (2,1M) aynı haftaya denk geliyor. Öneri: tedarikçi ödemesini 15. haftaya kaydır veya Garanti atıl bakiyeden aktar."
- 🟠 **"Yazılım/SaaS gideri USD/TRY kaynaklı bu ay %8 arttı"** — 12 aboneliğin 5'i USD; bütçe sapması izlenmeli.
- 🔵 **"Garanti BBVA hesabında 3M TRY atıl duruyor;** önümüzdeki 3 haftada çıkış planı yok — kısa vadeli değerlendirilebilir."
- ✅ **"Bu hafta forecast varyansı %2 içinde"** — tahmin kalitesi hedef bandında (30 günde ±%5).
- 💡 **"Vadesi 3 hafta içindeki 2,72M TRY çek portföyünü tahsilat takvimiyle eşleştir;** Çek çıkışları 15. haftada yoğunlaşıyor."

---

## SECTION C — Recurring İşlem Motoru (Harcama Ekle / Tahsilat Ekle)
*Konum: "Finansal Veriler"deki "Harcama Ekle" / "Tahsilat Ekle" butonlarından açılan modal.*

### C.1 Veri Modeli (iCalendar RFC 5545 / RRULE tabanlı)
IETF RFC 5545, tekrar eden olayları RRULE (kural) + RDATE/EXDATE (istisna tarihleri) + RECURRENCE-ID (tek oluşum override) ile tanımlar — endüstri standardı bu modeldir.

**`RecurringSeries`:**
`id`, `tip` (Gelir/Gider), `kategori`, `isim`, `tutar`, `paraBirimi` (TRY/USD), `dtstart` (ilk oluşum), `rrule` (ör. `FREQ=MONTHLY;BYMONTHDAY=1` = her ayın 1'i; kira için `BYMONTHDAY=-1` = ayın son günü), `rdate[]` (ekstra tarihler), `exdate[]` (atlanan tarihler), `bitis` (UNTIL tarih / COUNT sayı / none), `hafta​SonuKaydir` (weekend ise önceye/sonraya taşı — Actual Budget deseni).

**`OccurrenceOverride` (istisna/override kaydı):**
`seriesId`, `recurrenceId` (orijinal oluşum tarihi — kimlik), `yeniTarih?`, `yeniTutar?`, `durum` (moved / cancelled / paid / skipped), `gerceklesenTutar?`, `gerceklesenTarih?`.

Motor, bir tarih aralığı için oluşumları RRULE'dan expand eder, EXDATE'leri çıkarır, override'ları uygular (RECURRENCE-ID eşleşmesiyle). *Neden:* RFC 5545 recurrence set algoritması (RRULE ∪ RDATE − EXDATE, sonra override); Nylas/dateutil rruleset pratiği.

### C.2 Modal Alan Spesifikasyonu (Harcama Ekle / Tahsilat Ekle)
1. **Tarih** (date picker) — ilk oluşum / tek seferlik tarih
2. **Kategori** (dropdown — C.5 taksonomisi)
3. **İsim/Açıklama** (text)
4. **Tutar** (number) + **Para Birimi** (TRY/USD toggle — mevcut sistem)
5. **Tekrar** (radio): **Tek seferlik** / **Tekrarlı**
6. *(Tekrarlı seçilirse)* **Frekans** (dropdown): Haftalık / Aylık / Özel (custom RRULE builder: her N ay/hafta, "ayın X'i" veya "ayın son günü")
7. **Bitiş** (radio): Süresiz / Belirli tarihe kadar (UNTIL) / N tekrar sonra (COUNT)
8. **Hafta sonuna denk gelirse** (opsiyonel): Aynı gün / Önceki iş günü / Sonraki iş günü

*Neden:* QuickBooks recurring template (Scheduled/Reminder/Unscheduled tipleri, interval, "days in advance to create"), Xero repeating invoice/bill (start date, "repeat every N week/month", end date opsiyonel), YNAB/Actual scheduled transactions (aylık/2. çarşamba/her 2 ay, "Last" gün, weekend taşıma).

### C.3 Occurrence-Edit Dialog Spesifikasyonu (kritik davranış)
Bir recurring ödeme tarihinde ödenemezse ve taşınması gerekirse, kullanıcı bir oluşumu düzenlediğinde **kapsam sorusu** çıkar (Google Calendar modeli):

**Düzenle/Taşı dialog:**
> "Bu değişikliği nasıl uygulamak istersiniz?"
> - ○ **Yalnızca bu oluşum** → yeni `OccurrenceOverride` (yeniTarih/yeniTutar) yazılır, seri kuralı değişmez
> - ○ **Bu ve sonraki tüm oluşumlar** → mevcut seri `UNTIL` ile bu tarihten önce bitirilir, yeni tarih/tutarla **yeni RecurringSeries** başlatılır (Google Calendar'ın seriyi ikiye bölme davranışı)
> - ○ **Tüm seri** → RecurringSeries kuralı/tutarı doğrudan güncellenir

**İptal dialog:**
> "Bu ödemeyi iptal et:"
> - ○ **Yalnızca bunu** → `exdate[]`'e eklenir (veya override durum=cancelled)
> - ○ **Tüm seriyi** → seri sonlandırılır (UNTIL=bugün) veya silinir

*Neden:* Google Calendar "Bu etkinlik / Bu ve sonraki etkinlikler / Tüm etkinlikler"; QuickBooks recurring "One time only / Update for all"; Xero "changes applied to all subsequent transactions"; Microsoft Graph "update this and following" seriyi bölme yaklaşımı. Muhiku'nun kira/çek senaryosunda "bu ay ödeyemedim, 5 gün sonraya taşı" tam bu "yalnızca bu oluşum → override" akışıdır.

### C.4 Forecast Entegrasyonu
Projekte oluşumlar (henüz tarihi gelmemiş) Nakit Akışı 13-haftalık/günlük forecast'te **forecast hücresi** (kesikli/gri) olarak görünür. Oluşum ödendiğinde (`durum=paid`, gerçekleşenTutar girilir) **actual**'a döner ve varyans hesabına girer. *Neden:* Float geçmiş işlemlerden recurring maliyetleri otomatik tespit edip forecast'e ekler (*"Float spots recurring costs from your transaction history"*); QuickBooks "days in advance to create" ile gelecek nakit görünürlüğü sağlar.

### C.5 Kategori Taksonomisi
`Kira` · `Yazılım/SaaS` · `Personel/Maaş` · `Tedarikçi` · `Pazarlama` · `Lojistik` · `Vergi` · `Kredi taksiti` · `Çek` · `Diğer`. Bu taksonomi Nakit Akışı grid satırlarıyla (Section B.4) ve mevcut sheet'lerdeki (Yazılım Ödemeleri, Kira Ödemeleri, Vergi-Yapılandırma) kalemlerle bire bir eşleşir. Kredi taksiti ve Çek kategorileri Section A'dan otomatik beslenir (recurring motor sadece manuel gelir/gider için; kredi/çek kendi motorundan gelir).

---

## SECTION D — Gauge/Radial Chart Düzeltme Notu

**Teşhis:** Mevcut gauge'lar (Likidite Oranları, Runway, CEI, Efektif Vergi, Faiz Karşılama, Altman Z, Kompozit Sağlık Skoru) Recharts'ta yarım/kırık render oluyor — arc kapanmıyor ve needle taşıyor. Kök neden: Recharts'ın **yerleşik bir gauge komponenti yoktur** (recharts#1456 hâlâ açık feature request); RadialBarChart yanlış açı konfigürasyonuyla tam daire çiziyor ve needle için hazır primitive yok.

**Önerilen doğru yaklaşım (üç seçenek, tercih sırasıyla):**

1. **Recharts'ta kalınacaksa — doğru semicircle config + SVG needle overlay:**
   - `RadialBarChart` (veya `PieChart`) ile `startAngle={180} endAngle={0}` (saat yönünde 180°→0° yarım daire), sabit `innerRadius`/`outerRadius` (%), `cy="100%"` pivot alt-orta.
   - Renk bantları için segment'li Pie (yeşil/sarı/kırmızı stop'lar).
   - **Needle'ı ayrı bir SVG overlay** olarak çiz: pivot (cx, cy) etrafında değeri açıya çevirip (`angle = 180 − (value/max)×180`), radyan hesabıyla `x2 = cx + L·cos(θ)`, `y2 = cy − L·sin(θ)` uç noktası. *Neden:* Medium "Re-Learning Trigonometry… React+Recharts gauge needle" ve emiloberg gist tam bu deseni gösterir.

2. **Dedicated React gauge lib (en hızlı/sağlam çözüm):** `react-gauge-component` veya **MUI X `Gauge`** (`startAngle`/`endAngle`, `valueMin`/`valueMax`, `referenceArc`/`valueArc` class'ları, child overlay) — needle ve arc kapanması hazır. *Neden:* MUI X Gauge dokümanı `startAngle={-110} endAngle={110}` semicircle örneğini verir; overflow/kapanma sorunları çözülmüştür.

3. **ApexCharts radialBar/gauge** — `plotOptions.radialBar.startAngle=-90 endAngle=90`, `min`/`max` ile keyfi domain, threshold bantları ve needle desteği. *Neden:* ApexCharts radialBar-gauge dokümanı 2 property ile daire→gauge dönüşümünü ve custom domain'i açıklar.

**Öneri:** Muhiku'nun 7 farklı gauge'u ve tutarlı görünüm ihtiyacı düşünüldüğünde **Seçenek 2 (MUI X Gauge veya react-gauge-component) ile tek bir `<GaugeCard>` wrapper** yazılması; her metrik için `value/min/max/thresholds` prop'ları geçilerek DRY çözüm. Recharts diğer chart'larda kalabilir.

---

## Recommendations (Kademeli, Aksiyon Alınabilir Yol Haritası)

**Faz 1 (temel — 2-3 hafta):** Section A veri modeli + anüite amortisman motoru + KKDF/BSMV oran seçici (krediTuru+paraBirimi'ne göre). Loan/Check register tabloları. Bu, kullanıcının manuel Google Sheets'ini birebir değiştirir ve en yüksek acil değeri verir.
> *Eşik:* Amortisman tablosu bir gerçek kredide bankanın ödeme planıyla ±1 TL uyuşuyorsa motor doğrudur.

**Faz 2 (en kritik):** Section B 13-haftalık direkt TWCF + günlük grid + banka bazlı pozisyon. Section A'dan taksit/çek beslemesi bağlanır.
> *Eşik:* 4. haftada forecast varyansı ±%5-10 içinde kalıyorsa (Transformance benchmark) sayfa üretime hazırdır; sürekli >%15 varyans varsa kategori tahmin mantığı gözden geçirilmeli.

**Faz 3:** Section C recurring motor (RRULE + override + occurrence-edit dialog). Forecast'e "projected→actual" bağlanır. Kira/yazılım/maaş recurring'leri Section B forecast'ini besler.

**Faz 4 (quick-win, paralel yürütülebilir):** Section D gauge fix — mevcut 7 gauge'u `<GaugeCard>` ile değiştir.

**Faz 5 (iyileştirme):** AI Öneri/Uyarı motoru (B.5) — eşik-tabanlı kurallar (negatif projekte bakiye 🔴, varyans bandı ✅/🟠, atıl nakit 🔵) ile başla; ileride pattern-tabanlı (Tesorio/Float tarzı) tahmine geç.

**Kararı değiştirecek benchmark'lar:** Forecast varyansı sürekli >%15 (90 gün) → veri kalitesi/kategori mantığı revizyonu. Erken kapama motoru banka planıyla uyuşmuyorsa → BSMV/KKDF/gün-sayımı formülü audit. Recurring override'lar forecast'i bozuyorsa → RECURRENCE-ID eşleşme mantığı gözden geçir.

---

## Caveats
- **Vergi oranları 2026 için geçerlidir ve Cumhurbaşkanı kararıyla değişebilir.** KKDF/BSMV oranları `krediTuru`+`paraBirimi`+istisna (konut, teşvikli, ihracat, KOBİ) durumuna göre değişir; motor oranları **konfigüre edilebilir sabitler** olarak tutmalı, hardcode etmemelidir. Ticari döviz/altın KKDF %1 değişikliği (18 Tem 2025) ve sabit-faizli FX erken ödeme formülü değişikliği (6 Oca 2025, 3% + %0,10) izlenmelidir.
- **Erken kapama ücretleri tahminidir; kesin tutar bankaya/sözleşmeye bağlıdır.** Ticari krediler 6502 sK tüketici koruması dışındadır; ücret sözleşme hükümlerine tabidir — motor "yaklaşık" etiketiyle göstermelidir.
- **13-haftalık forecast doğruluğu yakın vadede yüksek, uzakta düşüktür** (evrensel doğru); ilk 4 hafta operasyonel, son haftalar yönseldir — UI bunu görsel olarak (güven bandı) belirtmelidir.
- **Recurring "ayın son günü" ve 31 gün sorunu** (Xero'da bilinen şikayet): motor `BYMONTHDAY=-1` kullanmalı, "31" hardcode etmemelidir.
- **Anüite formülü kaynak güvenilirliği:** formül matematiksel standarttır ve çok sayıda Türk hesaplama sitesince teyit edilir, ancak tek bir bankanın birincil dokümanına değil aggregator sitelere dayanır — gerçek bir kredi planıyla doğrulama (Faz 1 eşiği) şarttır.
- **Tüm rakamlar (32,6M finansman, 47,3M kalan, 14,8M tasarruf, 40,45M kurum borcu vb.) kullanıcının kendi demo/gerçek verisidir**; sistem bu büyüklükleri kaldıracak şekilde (1000+ ödeme satırı, ~20 aktif kredi) performanslı tasarlanmalıdır (virtualized table).