# Muhiku Finans & Muhasebe Raporlama Suite — Tasarım Dokümanı (v1.0)

*(DESIGN/SPEC deliverable — Türkçe; teknik terimler İngilizce. Demo veriler örnektir. Mevcut "Satınalma brief" formatı birebir yansıtılmıştır: her sayfa = KPI Kartları (N) + Grafik/Görselleştirmeler (N, "Neden:" ile) + Tablo Spesifikasyonları (N) + AI Öneri/Uyarı Örnekleri.)*

## TL;DR
- **10 rapor sayfası + Yönetici Özeti (CFO Kokpiti) + Çapraz Bağlantı/Çakışma-Önleme Matrisi** tasarlandı; her sayfa KPI Kartları / Grafikler+"Neden:" / Tablo Spesifikasyonları / AI Öneri-Uyarı bloklarıyla, doğrudan Claude Code prompt'una dönüştürülebilir yapıdadır.
- Mevcut **"Finansal Veriler" grid'i kaynak-of-truth olarak kalır**; yeni sayfalar bu grid'in üstüne analiz/görselleştirme/uyarı katmanı ekler — çakışma önleme matrisi Sales/Procurement/Category modülleriyle sınırları netleştirir.
- **Türkiye 2026 mevzuatı entegre:** Kurumlar Vergisi %25 (banka/finans %30), KDV genel %20 (indirimli %1/%10), Geçici Vergi 17'si — **4. dönem 7566 sayılı Kanun ile yeniden yürürlükte**, MUHSGK/Damga 26'sı, e-Defter berat 14'ü, **Ba/Bs formları 25.09.2024 tarihli 565 sıra no.lu VUK Tebliği ile Eylül 2024'ten itibaren kaldırıldı**, Türkiye ERP %9.30 (Damodaran Temmuz 2026).

## Key Findings
Tasarım, jenerik tavsiye değil **gerçek platform desenlerine** dayandırıldı ve her grafik "Neden:" satırıyla referans gösterir: NetSuite AP/AR aging portletleri, Odoo Aged Payable, Seeking Alpha 5-faktör harf notu (A+–F, diskalifiye eşiği), Fintables Karne (karlılık/büyüme/borçluluk puanı), Damodaran Türkiye %9.30 ERP (Temmuz 2026 country-risk workbook, mature-market %4.17 / ABD %4.45'e karşı), WallStreetPrep/FE Training football-field, Vendavo Margin Bridge Analyzer + Zebra BI PVM waterfall, Morgan Stanley TSR decomposition, Stock Rover Altman-Z gauge, Klipfolio net-debt/covenants, Paraşüt/Mikro cari yaşlandırma. Mid-market TR e-ticaret/hediyelik bağlamına (peer'lar: Moonpig, 1-800-Flowers, Card Factory, Notonthehighstreet) uyarlandı.

---

# SAYFA 1 — GELİR & KÂRLILIK (Income & Profitability)

## KPI Kartları (8)
1. **Hasılat Büyümesi / Revenue Growth (YoY %)** — (Cari Hasılat − Önceki Hasılat) / Önceki Hasılat. ↑ iyi.
2. **Brüt Kâr Marjı / Gross Margin %** — Brüt Kâr / Hasılat. ↑ iyi.
3. **FAVÖK Marjı / EBITDA Margin %** — FAVÖK / Hasılat. ↑ iyi.
4. **Net Kâr Marjı / Net Margin %** — Net Kâr / Hasılat. ↑ iyi.
5. **Faaliyet Gideri Oranı / OpEx Ratio %** — Faaliyet Giderleri / Hasılat. ↓ iyi.
6. **Hasılat Kalite Skoru / Revenue Quality** — Tekrarlayan/organik hasılat payı + tahsilat oranı bileşimi (0-100). ↑ iyi.
7. **Yurt Dışı Hasılat Payı / Export Revenue %** — Yurt Dışı Hasılat / Toplam Hasılat. ↑ iyi (kur çeşitlendirmesi).
8. **Normalize Net Kâr Marjı** — Tek seferlik kalemler hariç Net Kâr / Hasılat. ↑ iyi.

## Grafik/Görselleştirmeler (6)
1. **Gelir Tablosu Şelalesi (Waterfall):** Hasılat→SMM→Brüt Kâr→OpEx→EBIT→Amortisman→Vergi→Net Kâr köprüsü. **Neden:** Bloomberg income-statement bridge deseni; marjı aşındıran kalemi tek bakışta gösterir.
2. **Brüt Marj Köprüsü / Margin Bridge (PVM Waterfall):** Önceki dönem marjı → Fiyat (Price) + Hacim (Volume) + Miks (Mix) + Maliyet (Cost) etkisi → cari marj. **Neden:** Vendavo Margin Bridge Analyzer / Zebra BI PVM template deseni; marj değişiminin sürücülerini kapalı-form formülle ayrıştırır (her sürücü yeşil↑/kırmızı↓ bar).
3. **Marj Trend Çoklu-Çizgi (Brüt/FAVÖK/Net):** son 10 dönem 3 marj çizgisi. **Neden:** Fintables oran analizi trend grafiği.
4. **Hasılat Kırılımı Stacked-Area (Yurt İçi/Yurt Dışı):** zaman içinde segment payı. **Neden:** Seeking Alpha revenue-by-segment stacked deseni.
5. **Gider Ağacı Pareto:** Pazarlama/G&A/Ar-Ge kalemleri büyükten küçüğe + kümülatif % çizgisi. **Neden:** Pareto 80/20 maliyet-önceliklendirme deseni.
6. **EPS & Normalize Kâr (Bar+Çizgi):** EPS bar (/20M hisse), normalize net kâr çizgi. **Neden:** TradingView earnings-overlay deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Karlılık Özeti (dönemsel):** Metrik | Cari Dönem | Önceki Dönem | YoY Δ (pp/%) | 4-dönem sparkline | Kaynak badge (ERP/Paraşüt/Manuel/Hesaplanan). Varsayılan sıralama: gelir tablosu sırası. Badge: yeşil(+)/kırmızı(−), oran satırlarında pp. Row aksiyonları: mini-grafik popup (son 10 dönem, tutar=bar/oran=çizgi), terms.ts tooltip, grid'e drill-down.
**Tablo 2 — Segment Karlılığı:** Segment | Hasılat | Brüt Kâr | Brüt Marj % | Hasılat Payı % | YoY. Sıralama: hasılata göre azalan.

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Brüt marj son 2 çeyrekte %41→%36'ya düştü; PVM köprüsü maliyet etkisinin −3.8pp katkı yaptığını gösteriyor. SMM tedarikçi fiyatları incelenmeli."
- 🟠 **Uyarı:** "Pazarlama gideri hasılattan hızlı büyüyor (+%34 vs +%18); müşteri edinme verimliliği düşüyor olabilir."
- 🔵 **İzle:** "Yurt dışı hasılat payı %12→%19'a çıktı; kur riski Borçluluk sayfasında izlenmeli."
- ✅ "Normalize net kâr marjı 4 dönemdir istikrarlı %11; kâr kalitesi sağlam."

---

# SAYFA 2 — NAKİT & LİKİDİTE (Cash & Liquidity)

## KPI Kartları (8)
1. **Nakit Pozisyonu / Cash Position** — Kasa + Banka + Nakit benzeri. ↑ iyi.
2. **Serbest Nakit Akışı / FCF** — İşletme Nakit Akışı − CapEx. ↑ iyi.
3. **FCF Marjı %** — FCF / Hasılat. ↑ iyi.
4. **Cari Oran / Current Ratio** — Dönen Varlıklar / KV Yükümlülükler. 1.2–2.0 sağlıklı.
5. **Asit-Test / Quick Ratio** — (Dönen Varlıklar − Stok) / KV Yükümlülükler. ≥1.0 iyi.
6. **Nakit Dönüşüm Süresi / CCC (gün)** — DSO + DIO − DPO. ↓ iyi.
7. **Nakit Runway (ay)** — Nakit / Aylık net nakit yakımı. ↑ iyi (pozitif nakit üretimde ∞).
8. **İşletme Nakit Akışı Oranı** — İşletme NA / KV Yükümlülükler. >1.0 iyi.

## Grafik/Görselleştirmeler (6)
1. **13-Haftalık Rolling Nakit Tahmini (Çizgi: beklenen vs gerçekleşen):** **Neden:** CloudZero/insightsoftware CFO 13-week cash-forecast standardı; likidite krizini haftalar önce yakalar.
2. **Nakit Köprüsü Waterfall (Dönem Başı→İşletme→Yatırım→Finansman→Kur Farkı→Dönem Sonu):** **Neden:** Klipfolio cash-walkthrough deseni.
3. **CCC Bileşen Bar (DSO+DIO−DPO):** **Neden:** HighRadius/NetSuite working-capital deseni.
4. **Likidite Oranları Gauge (Cari/Quick):** eşik bantlı (<1.0 kırmızı). **Neden:** insightsoftware Quick-Ratio "front-and-center" deseni.
5. **Runway Gauge + Nakit Trend:** **Neden:** Mosaic/Drivetrain runway-gauge above-the-fold deseni.
6. **FCF Trend Bar (son 10 dönem):** **Neden:** Paraşüt nakit akışı tablosu deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Nakit Akış Özeti:** Faaliyet | Tutar | YoY | % Toplam | Kaynak badge. Sıralama: İşletme/Yatırım/Finansman.
**Tablo 2 — Banka Hesapları:** Hesap | Para Birimi | Bakiye (TRY) | Bakiye (orijinal) | Son Hareket | Durum badge (Aktif/Bloke). Row aksiyon: ekstre indir/paylaş.

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Quick ratio 0.82'ye düştü (eşik 1.0); önümüzdeki 45 günde ₺2.4M ödeme var, tahsilat hızlandırılmalı."
- 🟠 **Uyarı:** "CCC 68→81 güne çıktı; artış tamamen DSO kaynaklı (Alacak sayfasına bakınız)."
- 🔵 **İzle:** "Runway 14 ay; sektör benchmark 18–24 ay (J.P. Morgan). Nakit yakımı 2 çeyrektir sabit."
- 💡 "Vadesiz ₺5.2M atıl nakit gecelik mevduatta değerlendirilebilir."

---

# SAYFA 3 — ALACAK YÖNETİMİ / TAHSİLAT (Receivables & Collections)

## KPI Kartları (8)
1. **DSO / Days Sales Outstanding** — (Toplam Alacak / Kredili Satış) × Gün. ↓ iyi.
2. **En İyi Olası DSO (BPDSO)** — (Vadesi Gelmemiş Alacak / Kredili Satış) × Gün. Referans alt sınır.
3. **CEI / Tahsilat Etkinlik Endeksi %** — (Dönem Başı Alacak + Kredili Satış − Dönem Sonu Alacak) / (Dönem Başı Alacak + Kredili Satış − Dönem Sonu Vadesi Gelmemiş) × 100. ≥%90 iyi.
4. **Ortalama Gecikme Günü (ADD)** — Vade sonrası ortalama gecikme. ↓ iyi.
5. **Vadesi Geçmiş Alacak Oranı %** — Vadesi Geçmiş / Toplam Alacak. ↓ iyi.
6. **Şüpheli Alacak Oranı / Bad-Debt %** — Karşılık ayrılan / Kredili Satış. ↓ iyi (90+ gün genelde şüpheli sayılır).
7. **Alacak Devir Hızı / AR Turnover** — Kredili Satış / Ort. Alacak. ↑ iyi.
8. **Müşteri Konsantrasyonu (İlk-5 %)** — İlk 5 müşteri alacağı / Toplam Alacak. ↓ iyi (risk).

## Grafik/Görselleştirmeler (6)
1. **Alacak Yaşlandırma Stacked-Bar (Cari / 1-30 / 31-60 / 61-90 / 90+):** **Neden:** NetSuite AR Aging + Paraşüt/Mikro cari yaşlandırma standardı; tahsilat önceliklendirme.
2. **DSO vs BPDSO Trend Çizgi:** **Neden:** Tesorio/Smyyth DSO-to-BPDSO gap deseni (hedef: DSO'yu BPDSO'ya yaklaştır).
3. **CEI Gauge:** **Neden:** Tratta/HighRadius CEI gauge deseni; DSO'yu bağlamlayan tahsilat-disiplini metriği.
4. **Müşteri Konsantrasyon Pareto:** en yüksek borçlu müşteriler + kümülatif %. **Neden:** NetSuite "Top delinquent accounts" deseni.
5. **Tahsilat Isı Haritası (müşteri × gecikme bucket):** **Neden:** Vertaccount customer-risk/dispute heatmap.
6. **Beklenen Tahsilat Projeksiyonu (çizgi):** yaşlandırmaya dayalı. **Neden:** Intuit AR-to-cash-forecast deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Yaşlandırma Detayı (müşteri bazında):** Müşteri | Toplam Alacak | Cari | 1-30 | 31-60 | 61-90 | 90+ | En Eski Fatura | Risk Skoru | Durum badge (🟢Güncel/🟠Gecikmiş/🔴Şüpheli). Sıralama: 90+ azalan. Row aksiyon: ekstre, tahsilat hatırlatma e-postası, söz-verilen-ödeme (P2P) kaydı, yasal takip başlat, cari karta git.
**Tablo 2 — Tahsilat Aksiyon Listesi:** Müşteri | Vadesi Geçen Tutar | Gün | Son Temas | Söz Verilen Ödeme | Atanan | Durum. Sıralama: tutar × gün (worklist önceliklendirme).

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Yıldız Hediyelik ₺840K, 90+ gün; 3 aydır ödeme yok. Şüpheli alacak karşılığı ve yasal takip değerlendirilmeli."
- 🟠 **Uyarı:** "İlk-5 müşteri toplam alacağın %58'i; tek müşteri temerrüdü likiditeyi ciddi etkiler."
- 🔵 **İzle:** "Güvenilir ödeyen Ada Mağazacılık bu ay 22 gün geç ödedi; davranış değişimi erken sinyal olabilir."
- ✅ "CEI %93; tahsilat disiplini sektör ortalamasının üstünde."

---

# SAYFA 4 — BORÇ YÖNETİMİ / ÖDEMELER (Payables)

*(Procurement'in Aged Payable operasyon açısını değil, Finans/muhasebe/KDV/mutabakat açısını yansıtır — bkz. çakışma matrisi.)*

## KPI Kartları (8)
1. **DPO / Days Payable Outstanding** — (Ticari Borç / SMM) × Gün. Dengeli yüksek = nakit lehine, ama tedarikçi ilişki riski.
2. **Vadesi Geçmiş Borç Oranı %** — ↓ iyi.
3. **Erken Ödeme İskonto Yakalama %** — Yakalanan iskonto / Uygun toplam. ↑ iyi.
4. **Borç Devir Hızı / AP Turnover** — SMM / Ort. Ticari Borç.
5. **Ortalama Fatura İşleme Süresi (gün)** — ↓ iyi.
6. **Zamanında Ödeme Oranı %** — Vadesinde ödenen / Toplam. ↑ iyi.
7. **Tedarikçi Konsantrasyonu (İlk-5 %)** — Risk göstergesi.
8. **e-Belge Mutabakat Oranı %** — Eşleşen alış belgesi / Toplam (GİB e-belge çapraz kontrol uyumu). ↑ iyi.

## Grafik/Görselleştirmeler (6)
1. **Borç Yaşlandırma Stacked-Bar (Cari/1-30/31-60/61-90/90+):** **Neden:** NetSuite A/P Aging portlet + Odoo Aged Payable standardı.
2. **Ödeme Takvimi (Gantt/Takvim, vade bazlı nakit çıkışı):** **Neden:** NetSuite payment-scheduling + ReportingGuru cash-flow payment-forecast (haftalık bucket) deseni.
3. **Erken İskonto Penceresi Uyarı Bar:** 2/10 net-30 tipi kapanan pencereler. **Neden:** NetSuite/Zone & Co discount-window alert (2–5 gün eşik) deseni.
4. **DPO Trend Çizgi:** **Neden:** Zone & Co DPO trend deseni.
5. **Tedarikçi Ödeme Pareto:** **Neden:** NetSuite "Top Vendors" deseni.
6. **e-Belge Mutabakat Donut:** eşleşen/eşleşmeyen. **Neden:** Paraşüt fatura mutabakatı deseni. *(Not: Form Ba/Bs 25.09.2024 tarihli 32673 sayılı Resmî Gazete'de yayımlanan 565 sıra no.lu VUK Genel Tebliği ile Eylül 2024 döneminden itibaren kaldırıldı — "vergiye uyum maliyetleri ile bildirim verme yükümlülüğünün azaltılması amacıyla"; mutabakat artık e-belge çapraz kontrolüne dayanır.)*

## Tablo Spesifikasyonları (2)
**Tablo 1 — Ödenecek Faturalar:** Tedarikçi | Fatura No | Tutar | Vade | Kalan Gün | İskonto Penceresi | İskonto Tutarı | Durum badge (🔵Vadesi Gelmemiş/🟠Yaklaşıyor/🔴Gecikmiş/✅Ödendi). Sıralama: vade artan. Row aksiyon: ödeme planla, 3'lü eşleştirme (PO/irsaliye/fatura) gör, tedarikçi kartı.
**Tablo 2 — Tedarikçi Bakiye Özeti:** Tedarikçi | Toplam Borç | Vadesi Geçmiş | Ort. Ödeme Günü | Yıllık Hacim | e-Belge Uyumu.

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Anadolu Ambalaj ₺320K faturası 12 gün gecikmiş; tedarik kesintisi riski, öncelikli ödeme önerilir."
- 🟠 **Uyarı:** "3 faturada 2/10 iskonto penceresi 2 gün içinde kapanıyor (₺18K tasarruf kaçıyor)."
- 🔵 **İzle:** "DPO 38→52 güne çıktı; nakit lehine ama tedarikçi ilişkisi izlenmeli."
- 💡 "e-Belge mutabakatında 7 alış faturası sistemde eşleşmiyor; KDV indirimi ve özel usulsüzlük riski için kontrol edilmeli."

---

# SAYFA 5 — VERGİ & YASAL UYUM (Tax & Compliance, Türkiye)

## KPI Kartları (8)
1. **KDV Yükümlülüğü (net) / VAT Payable** — Hesaplanan KDV (391) − İndirilecek KDV (191). İzleme.
2. **Devreden KDV (190)** — Sonraki döneme devreden. İzleme.
3. **Efektif Vergi Oranı %** — Vergi / Vergi Öncesi Kâr. Kurumlar %25 (banka/finans %30) civarı beklenir.
4. **Tahakkuk Eden Kurumlar/Geçici Vergi** — Dönem yükümlülüğü (yurt içi asgari kurumlar vergisi: hesaplanan vergi, istisna öncesi kurum kazancının %10'undan az olamaz).
5. **Stopaj (Muhtasar) Yükümlülüğü** — MUHSGK tevkifat toplamı.
6. **SGK Prim Yükümlülüğü** — Aylık prim tutarı.
7. **Uyum Skoru / Compliance %** — Zamanında verilen beyanname + e-belge uyumu bileşimi. ↑ iyi.
8. **Yaklaşan Yükümlülük Sayısı (30 gün)** — ↓ iyi (yük dağılımı).

## Grafik/Görselleştirmeler (6)
1. **Vergi Takvimi (Takvim/Gantt, renk kodlu beyanname kartları):** KDV yeşil, MUHSGK mavi, Geçici turuncu. **Neden:** kdvhesaplama.org / GİB Vergi Takvimi kart deseni; hafta sonu/tatil kaydırma ve GİB süre uzatımı notlarıyla.
2. **KDV Trend Bar (Hesaplanan/İndirilecek/Net):** **Neden:** Paraşüt KDV raporu deseni.
3. **Vergi Yükü Stacked-Area (KDV/Kurumlar/Geçici/Stopaj/SGK/Damga):** zaman içinde. **Neden:** CFO tax-burden mix deseni.
4. **e-Dönüşüm Durum Panosu (e-Fatura/e-Arşiv/e-İrsaliye/e-Defter/e-SMM statü ikonları):** **Neden:** QNB eSolutions/GİB e-belge statü deseni.
5. **Efektif Vergi Oranı Gauge (mükellef vs %25 yasal):** **Neden:** Fintables efektif vergi trend.
6. **Beyanname Uyum Timeline (zamanında/geç/bekliyor):** **Neden:** compliance-calendar audit deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — 2026 Vergi/Beyanname Takvimi** (kolonlar: Beyanname | Dönem | Son Beyan | Son Ödeme | Tutar | Durum badge ✅Verildi/🟠Yaklaşıyor/🔴Gecikti; sıralama son tarih artan). Demo satırları (2026, GİB/mali müşavir kaynaklı):
- **KDV-1:** aylık, beyan+ödeme izleyen ayın **28'i** (23:59). *(Not: bazı kaynaklar ödeme gününü 24 olarak gösterir; genel standart 28; KDV-2/tevkifat 25'i. Nihai tarih GİB Vergi Takvimi'nden teyit.)*
- **MUHSGK (Muhtasar + Prim Hizmet):** aylık, beyan+ödeme izleyen ayın **26'sı**.
- **Geçici Vergi (Kurumlar, %25):** 3'er aylık, izleyen 2. ayın **17'si**. 2026 dönemleri: Q1→17 May (Pazar → 18 May), Q2→17 Ağu, Q3→17 Kas, **Q4→17 Şub 2027** (4. dönem, 7566 sayılı Kanun / Resmî Gazete 19.12.2025 ile 2025 yılından itibaren yeniden yürürlükte; her dönem kümülatif). Geçici vergi beyannamesinde sabit **damga vergisi 791,00 TL** (2026), sıfır beyanda dahi.
- **Yıllık Kurumlar Vergisi:** 1–30 Nisan, ödeme 30 Nisan.
- **Damga Vergisi (sürekli mükellef):** izleyen ayın **26'sı**.
- **e-Defter Berat:** aylık seçenekte ilgili ayı izleyen **4. ayın 14'ü** (ör. Nisan 2026 → 14 Ağustos 2026); geçici vergi dönemi (3 aylık) seçeneği de mevcut; yıl sonu (Aralık) → kurumlar beyanı izleyen ayın 14'ü. 2026 tercihi e-Defter uygulamasından 31.01.2026'ya kadar bildirilmeliydi; bildirilmezse aylık varsayılır.
- **SGK prim ödemesi:** izleyen ayın **son günü** (5510 s.K. md.88).
- **Not:** Ba/Bs formları 565 sıra no.lu VUK Tebliği ile Eylül 2024'ten itibaren **kaldırıldı**.

**Tablo 2 — e-Belge Statü:** Uygulama | Statü | Geçiş Tarihi | Ciro Eşiği | Son İşlem | Uyarı. Demo eşikler: e-Fatura/e-Arşiv 3M TL (e-ticaret/gayrimenkul/motorlu taşıt 500K TL); e-İrsaliye 10M TL — 1 Temmuz 2026'ya kadar; bilanço esasında tutar sınırsız e-Arşiv.

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Geçici Vergi Q1 beyanı 18 Mayıs'ta (17 Mayıs Pazar); tahakkuk ₺1.2M ve nakit yetersiz görünüyor. Vadesi gelen tahsilatlar öne çekilmeli."
- 🟠 **Uyarı:** "e-Defter Nisan berat yükleme son tarihi 14 Ağustos; henüz oluşturulmadı — 1. derece usulsüzlük cezası riski."
- 🔵 **İzle:** "Efektif vergi oranınız %31; yasal %25'in üstünde — KKEG kalemleri gözden geçirilmeli."
- 💡 "2025 cironuz e-İrsaliye 10M TL eşiğini aştı; 1 Temmuz 2026'ya kadar geçiş zorunlu."

---

# SAYFA 6 — BORÇLULUK & SERMAYE YAPISI (Leverage & Capital Structure)

## KPI Kartları (8)
1. **Net Borç / EBITDA** — (Toplam Borç − Nakit) / FAVÖK. <3x sağlıklı.
2. **Toplam Borç / Özkaynak (D/E)** — ↓ genelde iyi.
3. **Faiz Karşılama / Interest Coverage** — EBIT / Net Faiz Gideri. >3x iyi.
4. **Net Borç / Net Debt** — Toplam Borç − Nakit.
5. **Özkaynak Oranı %** — Özkaynak / Toplam Varlık. ↑ iyi.
6. **KV Borç / Toplam Borç %** — Vade profili göstergesi. ↓ iyi.
7. **Ağırlıklı Ort. Borç Maliyeti %** — Finansman gideri / Ort. Borç. ↓ iyi.
8. **Döviz Açık Pozisyon / FX Exposure** — Döviz yükümlülük − döviz varlık.

## Grafik/Görselleştirmeler (6)
1. **Borç Vade Merdiveni (Maturity Ladder Bar, yıllara göre):** **Neden:** Bloomberg/kredi analizi debt-maturity-ladder standardı; yeniden finansman yoğunluğunu gösterir.
2. **Net Borç/EBITDA Trend + Kovenant Bandı:** **Neden:** Klipfolio net-debt & covenants dashboard.
3. **Sermaye Yapısı Donut (Özkaynak/UV Borç/KV Borç):** **Neden:** capital-structure composition deseni.
4. **Faiz Karşılama Gauge:** eşik bantlı. **Neden:** insightsoftware coverage-ratio deseni.
5. **Döviz Pozisyon Bar (varlık vs yükümlülük, para birimi bazında):** **Neden:** TR firmaları için FX balance-sheet channel/kur riski deseni.
6. **WACC Bileşen Bar (özkaynak maliyeti/borç maliyeti/ağırlıklar):** **Neden:** Değerleme sayfasıyla tutarlı WACC girdi görselleştirmesi.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Borç Envanteri:** Kreditör | Tutar | Para Birimi | Faiz (sabit/değişken) | Vade | Kalan Anapara | Teminat | Durum. Sıralama: vade artan.
**Tablo 2 — WACC Girdileri:** Bileşen | Değer | Kaynak | Not. Satırlar: Risksiz oran, **Türkiye ERP %9.30 (Damodaran Temmuz 2026 country-risk workbook; mature-market %4.17 / ABD %4.45)**, Beta, Borç maliyeti, Vergi %25, E/V & D/V ağırlıkları.

## AI Öneri/Uyarı Örnekleri
- 🔴 **Acil:** "Net Borç/EBITDA 3.4x'e çıktı; ₺8M kredi 6 ay içinde vadeli, yeniden finansman planı gerekli."
- 🟠 **Uyarı:** "Faiz karşılama 2.1x'e düştü; EBIT'in ufak daralması kovenant ihlali riski doğurur."
- 🔵 **İzle:** "Döviz açık pozisyon $420K; %10 kur artışı ~₺1.4M kur farkı gideri yaratır."
- ✅ "Borcun %78'i uzun vadeli; vade profili sağlıklı."

---

# SAYFA 7 — DEĞERLEME (Valuation)

## KPI Kartları (8)
1. **AI Gerçeğe Uygun Değer / AI Fair Value (hisse başı)** — Comps+DCF ağırlıklı.
2. **Yükseliş/Düşüş Potansiyeli %** — (Fair Value − Mevcut) / Mevcut.
3. **Şirket Değeri / Enterprise Value (EV)** — Özkaynak Değeri + Net Borç.
4. **EV/EBITDA (mükellef)** — Peer medyan ile kıyas.
5. **EV/Hasılat** — Peer kıyas.
6. **F/K (P/E)** — Net Kâr çarpanı.
7. **DCF Baz Senaryo Değeri** — 25/50/25 ağırlıklı beklenen değer.
8. **DLOM Sonrası Değer** — ~%25 pazarlanabilirlik iskontosu (özel şirket) uygulanmış.

## Grafik/Görselleştirmeler (6)
1. **Football-Field (Floating Bar: Comps/Precedent/DCF/DCF-DLOM aralıkları + mevcut/AI değer çizgisi):** **Neden:** WallStreetPrep/FE Training football-field standardı; yöntemleri yan yana sanity-check eder (DCF barı duyarlılık tablosunun 25.–75. persentil aralığından).
2. **DCF Duyarlılık Matrisi (Heatmap: WACC × Terminal Büyüme):** baz hücre vurgulu. **Neden:** IB pitchbook 2-değişkenli sensitivity-table standardı (WACC 0.5% adım, g 0.25% adım).
3. **Senaryo Ağırlık Bar (Kötümser %25 / Baz %50 / İyimser %25):** **Neden:** IB base/bull/bear probability-weighted deseni (her senaryo çoklu değişkeni tutarlı hikâyeyle hareket ettirir).
4. **EV Köprüsü Waterfall (Özkaynak Değeri→+Net Borç→−Nakit→EV; veya tersi):** **Neden:** Ryan O'Connell EV-to-equity bridge deseni.
5. **Peer Comps Scatter (EV/EBITDA × EBITDA marjı):** Moonpig / 1-800-Flowers / Card Factory / Notonthehighstreet + Muhiku. **Neden:** Seeking Alpha peer-relative valuation deseni.
6. **Çarpan Trend Çizgi (EV/EBITDA tarihsel):** **Neden:** Fintables tarihsel çarpan deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Comps Seti:** Şirket | EV/EBITDA | EV/Hasılat | F/K | EBITDA Marjı | Hasılat Büyüme | Not. Demo satırlar (araştırma anlık değerleri, güncellenmeli): **Moonpig** (~9.2x TTM EV/EBITDA, ~2.4x EV/Rev, ~%28 FAVÖK marjı), **1-800-Flowers** (~10x EV/EBITDA), **Card Factory** (~6.5x F/K), **Notonthehighstreet** (özel — precedent/tahmini), **Medyan**, **Muhiku**. Sıralama: EV/EBITDA.
**Tablo 2 — DCF Varsayımları:** Varsayım | Değer | Not. Satırlar: WACC, **Türkiye ERP %9.30**, terminal büyüme (WACC altında, ~GSYİH), 5–10 yıl projeksiyon, senaryo 25/50/25, **DLOM ~%25** (International Glossary: "pazarlanabilirliğin göreli yokluğunu yansıtan iskonto").

## AI Öneri/Uyarı Örnekleri
- 🔵 **İzle:** "AI gerçeğe uygun değer hisse başı ₺X; comps medyanına göre %14 iskontolu."
- 🟠 **Uyarı:** "DCF çıktısının %72'si terminal değerden geliyor; terminal büyüme varsayımına aşırı duyarlı (IB standardı: TV genelde toplam DCF'in %60-80'i)."
- 💡 "Peer setinde Moonpig ~%28 FAVÖK marjıyla premium çarpan taşıyor; Muhiku ~%19, çarpan iskontosu bu marj farkıyla açıklanabilir."
- ✅ "3 yöntemin (comps/DCF/precedent) örtüşme bölgesi dar; değerleme aralığı savunulabilir."

---

# SAYFA 8 — YATIRIM & GETİRİ / ORTAK GETİRİSİ (Investment & Shareholder Returns)

## KPI Kartları (8)
1. **ROE / Özkaynak Kârlılığı %** — Net Kâr / Ort. Özkaynak. ↑ iyi.
2. **ROIC / Yatırılan Sermaye Getirisi %** — NOPAT / Yatırılan Sermaye; WACC ile kıyas. ↑ iyi.
3. **ROA / Aktif Kârlılığı %** — Net Kâr / Ort. Varlık. ↑ iyi.
4. **Temettü Dağıtım Oranı / Payout %** — Temettü / Net Kâr. Denge.
5. **Temettü Karşılama / Dividend Coverage** — Net Kâr (veya FCF) / Temettü. >1.5x iyi.
6. **Hisse Başına Temettü (DPS)** — ↑ iyi.
7. **TSR / Toplam Getiri %** — (Değer artışı + Temettü) / Başlangıç. ↑ iyi.
8. **EVA / Ekonomik Kâr** — (ROIC − WACC) × Yatırılan Sermaye. >0 değer yaratır.

## Grafik/Görselleştirmeler (6)
1. **DuPont ROE Ağacı (5-faktör: Vergi Yükü × Faiz Yükü × Faaliyet Marjı × Aktif Devir × Özkaynak Çarpanı):** **Neden:** Wall Street Prep/Umbrex DuPont-tree standardı; ROE'yi operasyon/kaldıraç sürücülerine ayrıştırır.
2. **Temettü Geçmişi Bar + Karşılama Çizgi:** **Neden:** Seeking Alpha dividend-history-with-coverage deseni.
3. **TSR Köprüsü Waterfall (Kâr Büyümesi + Çarpan Değişimi + Temettü/Net Payout Getirisi):** **Neden:** Morgan Stanley/Umbrex TSR-decomposition deseni.
4. **Ortak Bazında Getiri Stacked-Bar:** Abdülhamit Gürakar %35 / Ahmet Üreme %35 / Hasan Topalakcı %30. **Neden:** cap-table per-partner return deseni.
5. **Cap Table Evrimi Stacked-Area:** pay dağılımı zaman içinde (20.000.000 hisse). **Neden:** Carta cap-table-evolution deseni.
6. **ROIC vs WACC Trend Çizgi (spread):** **Neden:** value-creation/EVA deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Temettü Defteri:** Tarih | Dönem | Toplam Temettü | DPS | Payout % | Karşılama | Ortak Payları (₺). Row aksiyon: "Temettü Kaydı Ekle" modal (mevcut). Sıralama: tarih azalan.
**Tablo 2 — Ortak Getiri Özeti:** Ortak | Pay % | Pay Adedi | Kümülatif Temettü | Bu Dönem | Toplam Getiri. Satırlar: 3 ortak + toplam.

## AI Öneri/Uyarı Örnekleri
- ✅ "ROIC %21 > WACC %17; şirket 4 pp pozitif spread ile değer yaratıyor (pozitif EVA)."
- 🔵 **İzle:** "DuPont: ROE artışının çoğu özkaynak çarpanından (kaldıraç) geliyor, marjdan değil — kalıcılığı sorgulanmalı."
- 🟠 **Uyarı:** "Payout %85; FCF karşılaması 1.1x'e düştü, temettü sürdürülebilirliği baskı altında."
- 💡 "Hasan Topalakcı kümülatif ₺3.2M temettü aldı (%30 pay); dağıtım cap table ile tutarlı."

---

# SAYFA 9 — FİNANSAL SAĞLIK SKORKARTI (Financial Health Scorecard)

## KPI Kartları (8 kategori skoru; her biri 0-100 + harf notu A–F)
1. **Değerleme / Valuation** — çarpanlar peer'a göre; ucuz = yüksek skor.
2. **Büyüme / Growth** — hasılat/FAVÖK/FCF CAGR (3 yıl).
3. **Karlılık / Profitability** — marjlar + ROE/ROA.
4. **Finansal Sağlık / Financial Health** — kaldıraç + likidite + Altman Z.
5. **Nakit-Likidite / Cash-Liquidity** — FCF marjı, cari/quick, runway.
6. **Sermaye Verimliliği / Capital Efficiency** — ROIC, CCC, aktif devir.
7. **Ortak Getirisi / Shareholder Returns** — TSR, temettü karşılama, EVA.
8. **Yönetim Kalitesi / Management Quality** — kâr kalitesi, Piotroski F, Beneish M, tahakkuk oranı.

## Grafik/Görselleştirmeler (6)
1. **8-Kategori Radar/Örümcek (her eksen 0-100):** **Neden:** Fintables Karne + Seeking Alpha factor-grade radar deseni.
2. **Altman Z-Score Gauge (Güvenli/Gri/Tehlike bantlı):** Z = 1.2·(İşl.Serm/Aktif) + 1.4·(Dağıtılmamış Kâr/Aktif) + 3.3·(EBIT/Aktif) + 0.6·(Özkaynak PD/Toplam Borç) + 1.0·(Hasılat/Aktif). **Neden:** Stock Rover Altman-Z gauge standardı (Edward Altman, NYU 1968); **Z>2.99 Güvenli, 1.81–2.99 Gri, <1.81 Tehlike** — Altman tehlike bölgesindeki firmaların %70+'sının 2 yıl içinde battığını bulmuştur.
3. **Piotroski F-Score Bar (0-9, 9 kriter):** kârlılık(4)+kaldıraç/likidite(3)+operasyonel verim(2). **Neden:** Stockopedia/Quant-Investing F-score deseni; 8-9 güçlü.
4. **Beneish M-Score Göstergesi (< −2.22 düşük manipülasyon riski):** **Neden:** earnings-manipulation forensic (Beneish 1999) deseni.
5. **Kategori Skor Bar (8 kategori yatay, renk kodlu harf notu):** **Neden:** Seeking Alpha A+–F factor-grade deseni.
6. **Kompozit Skor Trend Çizgi (son 10 dönem):** **Neden:** StockTitan financial-health-score trend deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Skorkart Detayı:** Kategori | Alt-metrikler | Ham Değer | Peer/Benchmark | Skor (0-100) | Harf (A-F) | Ağırlık % | Trend. Sıralama: ağırlık azalan. Row aksiyon: ilgili detay sayfasına drill-down.
**Tablo 2 — Risk Skorları:** Model | Değer | Bölge/Yorum | Trend. Satırlar: Altman Z, Piotroski F, Beneish M.

## AI Öneri/Uyarı Örnekleri
- ✅ "Altman Z 3.4 (Güvenli bölge); iflas riski düşük."
- 🔵 **İzle:** "Piotroski F 6/9; operasyonel nakit akışı net kârı aşıyor (+1) ama kaldıraç arttı (−1)."
- 🟠 **Uyarı:** "Beneish M −1.9 (eşik −2.22 üstünde); tahakkuklarda artış — kâr kalitesi gözden geçirilmeli."
- 💡 "En düşük kategori Değerleme (C); en güçlü Karlılık (A−). Kompozit ağırlıklı skor 74/100 = B."

---

# SAYFA 10 — YÖNETİCİ ÖZETİ / CFO KOKPİTİ (Executive Summary)

Tüm alt sayfaların en kritik KPI+uyarılarını toplayan komuta merkezi. Kural: **4-6 KPI "above the fold", gerisi drill-down** (usedatabrain / Deloitte CFO Signals 2026 deseni; 25-KPI grid anti-pattern'inden kaçınılır).

## KPI Kartları (6, above-the-fold)
1. **Kompozit Finansal Sağlık Skoru (0-100 + harf A-F)** — 8 kategori ağırlıklı.
2. **Nakit Pozisyonu + Runway** — likidite.
3. **Hasılat Büyümesi & FAVÖK Marjı** — büyüme+kârlılık kombine kart.
4. **Net Borç/EBITDA** — kaldıraç.
5. **DSO / CCC** — işletme sermayesi.
6. **AI Gerçeğe Uygun Değer / Yükseliş %** — değerleme.

## Grafik/Görselleştirmeler (5)
1. **Kompozit Sağlık Skoru Gauge/Donut + Harf Notu:** **Neden:** Calqulate/StockTitan financial-health-index gauge (speedometer) deseni.
2. **13-Aylık Nakit Trend + 4 KPI kartı:** **Neden:** Mosaic/Pigment board-mode single-screen deseni.
3. **Alarm Taksonomisi Isı Listesi (severity × modül):** **Neden:** Orbit Analytics RAG-tile alert deseni.
4. **8-Kategori Mini Radar:** Skorkart özeti. **Neden:** yönetici radar deseni.
5. **KPI Trend Sparkline Grid:** tüm ana metrikler. **Neden:** insightsoftware sparkline-trend deseni.

## Tablo Spesifikasyonları (2)
**Tablo 1 — Kritik Uyarılar Roll-up:** Önem (🔴🟠🔵) | Modül | Uyarı | Metrik | Eşik | Aksiyon | Sorumlu. Sıralama: önem sonra tutar. Row aksiyon: kaynak sayfaya git.
**Tablo 2 — Modül Sağlık Özeti:** Modül | Skor | Harf | Trend | Açık Uyarı Sayısı | Durum.

## Alarm Taksonomisi
- 🔴 **Acil (Critical):** kovenant ihlali riski, likidite/runway <45 gün, vergi beyanname gecikmesi, 90+ gün büyük alacak, faiz karşılama <2x.
- 🟠 **Uyarı (Warning):** marj daralması, DSO/DPO sapması, iskonto penceresi kaçırma, eşik yaklaşma (e-belge/vergi).
- 🔵 **İzle (Watch):** trend değişimi, müşteri/tedarikçi konsantrasyonu, ödeme davranışı sinyali.
- ✅ **İyi / 💡 İpucu:** benchmark üstü performans, optimizasyon fırsatı (atıl nakit, vade yönetimi).

## Kompozit Finansal Sağlık Skoru Tasarımı
0-100 ağırlıklı kompozit. Önerilen ağırlıklar (mid-market TR e-ticaret/perakende, nakit-öncelikli bağlam): **Nakit-Likidite %18, Karlılık %16, Finansal Sağlık %15, Sermaye Verimliliği %13, Büyüme %12, Ortak Getirisi %10, Değerleme %8, Yönetim Kalitesi %8.** Harf skalası: **A ≥85, B 70-84, C 55-69, D 40-54, F <40.** Gösterim: donut+gauge, orta metin harf notu, altında 8 kategori mini-bar. **Diskalifiye kuralı (Seeking Alpha deseni):** herhangi kritik kategori (Finansal Sağlık veya Nakit-Likidite) F ise kompozit en fazla C ile sınırlanır. Eksik veri kategorisi 0 sayılır (veri boşluğunun skoru şişirmesini önler — StockTitan deseni).

## AI Öneri/Uyarı Örnekleri
- 🔴 "3 kritik alarm açık: Q1 geçici vergi nakit açığı, Yıldız Hediyelik 90+ alacak, faiz karşılama 2.1x. CFO onayı bekleniyor."
- 🟠 "Kompozit skor 74→71'e düştü; ana sürücü Nakit-Likidite kategorisi (CCC +13 gün)."
- ✅ "Karlılık ve Sermaye Verimliliği A bandında; değer yaratımı (ROIC>WACC) sürüyor."

---

# ÇAPRAZ BAĞLANTI & ÇAKIŞMA ÖNLEME MATRİSİ

| Yeni Sayfa | Kaynak-of-Truth (nerede kalır) | Çeker / Link | Çakışma Önleme Kuralı |
|---|---|---|---|
| Gelir/Karlılık | Finansal Veriler > Gelir Tablosu grid | Grid'den okur; sadece analiz/köprü katmanı | Ham tablo grid'de düzenlenir; burada "Düzenle" yok |
| Nakit & Likidite | Finansal Veriler > Nakit Akışı | FCF/nakit grid'den; banka ERP'den | Nakit akış kalemleri grid'de tanımlı |
| Alacak/Tahsilat | Sales modülü (fatura/müşteri) + Finans (cari) | Fatura+müşteri Sales'ten, yaşlandırma Finans | Müşteri kartı Sales'te; burada sadece yaşlandırma/tahsilat/DSO |
| Borç/Ödemeler | Procurement (PO/tedarikçi/fatura) | Tedarikçi+PO Procurement'tan | Aged Payable Procurement'ta da var → Finans **muhasebe/KDV/mutabakat** lensi; Procurement **operasyon/tedarik** lensi; aynı veri iki lens, karşılıklı link |
| Vergi & Uyum | Muhasebe / GİB & Paraşüt entegrasyonu | Gelir/Bilanço grid + e-belge statü | Tek vergi otoritesi bu sayfa; diğer sayfalar buraya link |
| Borçluluk/Sermaye | Finansal Veriler > Bilanço | Net Borç/özkaynak grid'den | Bilanço kalemleri grid'de |
| Değerleme | Finansal Veriler > Ayarlar (varsayımlar) | Tüm tablolar + comps seti | Comps/DCF varsayımları Ayarlar'da saklanır (tek yer) |
| Yatırım/Ortak Getirisi | Finansal Veriler > Ortak Getirisi | Temettü defteri + cap table (mevcut) | Temettü kaydı tek yerde (mevcut "Temettü Kaydı Ekle" modal) |
| Skorkart | Tüm sayfaları toplar | 8 kategori alt-sayfalardan besleme | Hesaplama tanımı tek yerde; sayfalar veri besler |
| CFO Kokpiti | Tüm sayfaların roll-up'ı | Skor + alarm + KPI | Sadece okur/link'ler; veri üretmez |
| Category modülü | Category (ürün/kategori maliyet) | Segment karlılığı için ürün maliyeti Category'den | Ürün-bazlı marj Category'de; Finans segment/toplam seviyede kalır |

## Recommendations
1. **Faz 1 — Temel (en hızlı değer):** Gelir/Karlılık, Nakit&Likidite, Alacak, Borç. Mevcut grid verisini kullanır. *Değişim eşiği:* grid API'si stabilse başla; değilse önce grid read-API'sini sabitle.
2. **Faz 2 — Uyum:** Vergi&Uyum + e-belge statü. GİB/Paraşüt entegrasyonu gerektirir; 2026 takvimi (özellikle Q4 geçici vergi ve e-Defter berat) kritik. *Eşik:* Paraşüt/GİB connector canlı olduğunda.
3. **Faz 3 — Analitik:** Borçluluk, Değerleme, Ortak Getirisi. Ayarlar'da varsayım altyapısı (WACC/ERP/DLOM/senaryo ağırlıkları) gerekir. *Eşik:* Ayarlar sekmesi varsayım şeması hazır olduğunda.
4. **Faz 4 — Üst katman:** Skorkart + CFO Kokpiti. Alt sayfalar bittiğinde besleme mantığıyla kurulur. *Eşik:* en az 6 alt sayfa canlı.
5. **Prompt üretimi:** Her Claude Code prompt'u sayfa başına bu dokümandan kopyalanır — KPI formülleri + tablo kolonları/sıralama/badge + chart tipi/"Neden" + AI uyarı şablonu (emoji severity) hazır blok halindedir.
6. **Kalibrasyon benchmark'ları (aksiyonu değiştirir):** Runway <12 ay → Faz 2'yi öne al (nakit kritik); Net Borç/EBITDA >3.5x → Borçluluk sayfası Faz 1'e çekilir; e-İrsaliye 10M TL eşiği aşıldıysa Vergi sayfası önceliklenir.

## Caveats
- **Demo veriler örnektir;** gerçek entegrasyonda ERP/Paraşüt alan eşlemesi (hesap kodları 190/191/391/360, cari kartlar) doğrulanmalı.
- **2026 vergi tarihleri** hafta sonu/tatil kaydırması (VUK md.18) ve GİB süre uzatımı sirkülerlerine tabidir; KDV ödeme günü için bazı kaynaklar 24, genel standart 28 gösterir — kesin tarih her dönem GİB Vergi Takvimi'nden teyit edilmeli. Q4 geçici vergi (17 Şub 2027) 7566 sayılı Kanun ile yenidir; eski takvimler hâlâ 3 dönem gösterebilir.
- **Comps çarpanları** (Moonpig ~9.2x, 1-800-Flowers ~10x, Card Factory ~6.5x F/K) araştırma-anı değerleridir ve piyasa koşullarıyla değişir; Ayarlar'dan periyodik güncellenmeli. Notonthehighstreet özel şirket olduğundan precedent/tahmini kullanılır.
- **Türkiye ERP %9.30** Damodaran'ın Temmuz 2026 güncellemesidir; yıllık revize edilir. DLOM %25 sektör/likidite koşuluna göre kalibre edilmelidir (BVR standart aralığı geniştir).
- **Skor ağırlıkları öneridir;** yönetim tercihiyle Ayarlar'dan kalibre edilebilir olmalı. VC-backed (likidite ağırlıklı) vs PE-backed (kârlılık ağırlıklı) profil farkı Deloitte CFO Signals'da doğrulanmıştır — Muhiku için nakit-öncelikli ağırlık seçilmiştir.