# Muhiku ERP — Satın Alma (Procurement) Departmanı Raporlama/Dashboard BRIEF

## TL;DR
- **Satın Alma departmanı 6 sayfalı bir yapıyla kurulmalı:** Yönetici Özeti (Executive Summary), Tedarikçi (Suppliers), Stok & İkmal (Stock & Replenishment), Maliyet (Cost), Karlılık (Profitability), Borçluluk (Payables) — hepsi mevcut tasarım diliyle (KPI kartları + trend badge + sparkline, Recharts grafikler, sıralanabilir + Excel export + ColumnManager tablolar, Acil/Uyarı/İzle rozetleri, "AI önerileri" bölümleri).
- **En kritik KPI'lar** (5-7 KPI/sayfa kuralıyla seçilmiş): Spend Under Management, Maverick Spend, PPV (Purchase Price Variance), OTIF, tedarikçi yoğunlaşma (HHI/Top-1 pay), DPO ve kur riski (USD/EUR alım payı) — hepsi kırmızı/sarı/yeşil eşik kodlu ve drill-down'lı.
- **Çakışma önleme:** Category>Envanter & Stok sayfası "ne kadar stok var / ürün nasıl performans veriyor" sorularına (stok yaşlanma, kritik stok, ABC) cevap verir; Satın Alma>Stok yalnızca **tedarik tetikleme** perspektifine (reorder point, açık PO, days of supply, gelen teslimatlar) odaklanır. Envanter değerleme ve yaşlanma tek yerde (Category) kalır.

## Ana Bulgular (Key Findings)
KPI tanımları ve best-practice kaynakları: Ivalua, APQC Open Standards Benchmarking, Hackett Group, Ardent Partners (CPO Rising 2025), NetSuite, Odoo, Coupa, SAP Ariba, ISM/CIPS, LeanLinking, Sievo, Atradius, TBB Risk Merkezi, GİB.

1. **Tek kitle + 5-7 KPI kuralı:** Her dashboard tek bir kitleye ve 5-7 KPI'ya odaklanmalı; tutarlı kırmızı/sarı/yeşil eşik kodu, drill-down ve otomatik eşik-aşımı uyarıları şart (DataBrain, Ivalua). Colab91/Hackett rehberi: "pick three to five high-impact KPIs tied to your current business priorities." Konuşlandırılan dashboard'ların %30'undan azı 90 gün sonra hâlâ kullanılıyor — başarısızlığın nedeni veri değil, iş akışı sürtünmesidir; bu yüzden AI-özet widget'ı benimsemeyi artırır.
2. **Spend Under Management (SUM):** Ardent Partners CPO Rising 2025 (326 satın alma yöneticisi): ortalama SUM **%71** ("the highest in Ardent's 20-year research history—up from 66% last year"); Best-in-Class **%91.7**, diğerleri %61.1. Hedef: >%80.
3. **Maverick spend** eşiği: iyi yönetilen <%10, olgun organizasyon <%5 (Mercanis).
4. **OTIF** dünya standardı ≥%95; PPM defect <500 (otomotiv/hassas imalat) (LeanLinking). APQC medyan tedarikçi zamanında teslimat oranı **%90.0** ("across 4,648+ companies").
5. **DPO** = (Ortalama Ticari Borç ÷ SMM) × gün sayısı (Wall Street Prep, CFI). Yüksek DPO likidite lehine ama tedarikçi ilişkisi aleyhine — dengeli tutulmalı.
6. **PPV** = (fiili fiyat − standart fiyat) × miktar; negatif PPV tasarruf, ±%3 tolerans yaygın (Sievo, Ramp). Doğrudan malzeme, imalat maliyetlerinin %70'ine kadar çıkabilir.
7. **Tedarikçi yoğunlaşma:** HHI = Σ(payᵢ²)×10.000 (<1.500 düşük, 1.500-2.500 orta, >2.500 yüksek); CR4; Effective Number of Suppliers = 1/Σ(payᵢ²). Tek tedarikçi >%15-20 inceleme, >%30 kritik risk (Umbrex, Stampli).
8. **APQC benchmark'ları:** PO işleme maliyeti "$14 to more than $54" arası (medyan $55.00, 4.622 şirket); PO cycle time medyan 1.0 gün (1.145+ şirket, hizmet satın alma). Hackett: Digital World Class ekipler requisition-to-PO süresini "58% faster than average peers."
9. **Türkiye bağlamı (Atradius Payment Practices Barometer Türkiye 2025):** vadeler tipik olarak "capping them at 30 days from invoicing"; **geç ödeme B2B faturaların ortalama %61'ini etkiliyor** ("an increase on the previous year"); şüpheli alacaklar ~%10. Çek hâlâ ağır bir B2B aracı: TBB Risk Merkezi verisiyle 2025'te (Oca-Kas) ~13,5 milyon çek, ~8,6 trilyon TL ibraz; karşılıksız oran adette ~%2. KDV: standart **%20**, indirimli **%10** ve **%1** (7346 sayılı Karar, 2023'ten beri). USD/TRY ~43, EUR/TRY ~50,5 (2025 sonu); TRY 12 ayda USD'ye karşı ~%21, EUR'ya karşı ~%27-38 değer kaybetti. BA/BS eşiği KDV hariç **5.000 TL**; e-Fatura zorunlu ciro eşiği **3M TL** (elektronik faturalar BA/BS'ye dahil değil).

---

## (a) Departman Bilgi Mimarisi (Information Architecture)

| # | Sayfa (TR) | Page (EN) | Tek Cümlelik Amaç | İlham / Best Practice |
|---|-----------|-----------|-------------------|----------------------|
| 1 | **Yönetici Özeti** | Executive Summary | Alt sayfaların en kritik KPI ve uyarılarını tek ekranda toplayan, health-score'lu komuta merkezi | STARS "5 CPO dashboards", Fanruan "Health Score" (QCD), mevcut Management Overview |
| 2 | **Tedarikçi** | Suppliers | Tedarikçi performansı (OTIF, defect, lead time), scorecard, yoğunlaşma & risk skorlaması | NetSuite Vendor Scorecard, SAP Ariba SPM/KPI Library, ISM/CIPS |
| 3 | **Stok & İkmal** | Stock & Replenishment | Yeniden sipariş tetikleme, açık PO takibi, stockout riski, days of supply, gelen teslimatlar | Odoo Purchase & Vendor Analysis dashboard, NetSuite Procurement Dashboard |
| 4 | **Maliyet** | Cost | Spend analizi (kategori/tedarikçi), PPV, tasarruf/avoidance, landed cost, kur riski | Coupa/Sievo spend analytics, JAGGAER, NetSuite Procurement Workbook |
| 5 | **Karlılık** | Profitability | Satın almanın brüt marja katkısı, SMM trendi, tedarikçi/kategori marjı, purchase-to-margin bridge | LineNow gross margin, Cleverence "list-to-realized" margin waterfall |
| 6 | **Borçluluk** | Payables | DPO, borç yaşlandırma, vade takvimi, gecikmiş ödeme, nakit planlama, BA-BS mutabakat | Coupa working-capital, Odoo Aged Payable, Türkiye e-mutabakat pratiği |

**Yapı gerekçesi:** User'ın orijinal önerisi (Tedarikçi / Stok / Maliyet) korunup **Yönetici Özeti + Karlılık + Borçluluk** eklenerek genişletildi. Bu, STARS'ın "her CPO'nun ihtiyaç duyduğu 5 dashboard" modelini (spend, supplier performance, savings/cost, compliance, operational/inventory) Muhiku'nun mevcut departman kalıbına (her departmanda bir Yönetici Özeti) uyarlar. Sözleşme/uyum (contract compliance) mid-market ölçek için ayrı sayfa yerine Tedarikçi (uyum skoru) + Borçluluk (BA-BS, vade uyumu) içine gömülür. Sonuç: satın almanın dört ana sorumluluk alanını (maliyet, tedarikçi, süreç/ikmal, nakit/karlılık) kapsayan 6 sayfa.

---

## (b) Sayfa Bazında Detaylı Spesifikasyon

### SAYFA 2 — TEDARİKÇİ (Suppliers)

**KPI Kartları (12):**
| KPI (TR / EN) | Formül / Tanım | İyi Yön |
|---|---|---|
| Aktif Tedarikçi Sayısı / Active Suppliers | Dönemde ≥1 PO'lu benzersiz tedarikçi | Bağlam (çok=parçalı, az=risk) |
| OTIF / On-Time In-Full | Zamanında VE tam gelen sipariş ÷ toplam sipariş | ↑ (≥%95) |
| Zamanında Teslimat / On-Time Delivery (OTD) | Zamanında teslimat ÷ toplam teslimat | ↑ (≥%90) |
| Ortalama Tedarik Süresi / Avg Lead Time | Sipariş → teslim ortalama gün | ↓ |
| Lead Time Sapması / Lead Time Variance | (Fiili − taahhüt lead time) ortalaması | ↓ (<%10) |
| Kusur/İade Oranı / Defect Rate (PPM) | Kusurlu birim ÷ teslim birim × 1.000.000 | ↓ (<500 PPM) |
| Sipariş Doğruluğu / PO Accuracy | Hatasız PO ÷ toplam PO | ↑ (≥%98) |
| Tedarikçi Skoru / Supplier Score (SPI) | Σ(ağırlık × normalize skor); kalite+teslim+maliyet+uyum, 0-100 | ↑ |
| İlk 1 Tedarikçi Payı / Top-1 Supplier Share | En büyük tedarikçi harcaması ÷ toplam | ↓ (<%20-30) |
| Yoğunlaşma İndeksi / Concentration (HHI) | Σ(payᵢ²)×10.000 | ↓ (<2.500) |
| Tek Kaynak Kalem % / Single-Source Items % | Tek tedarikçili kritik kalem ÷ toplam kritik kalem | ↓ |
| Riskli Tedarikçi Sayısı / At-Risk Suppliers | SPI eşik altı VEYA finansal/teslimat kırmızı | ↓ |

**Grafik/Görselleştirmeler (6):**
1. **Tedarikçi Scorecard ısı-haritası tablosu** — satır=tedarikçi, sütun=OTIF/defect/lead time/PPV/uyum, hücre renk kodlu. *Neden: SAP Ariba/ISM scorecard standardı, tek bakışta karşılaştırma.*
2. **Bar chart — Tedarikçiye göre OTIF %**, hedef %95 referans çizgisi. *Neden: performans açığı görünürlüğü.*
3. **Scatter — Harcama (x) vs Risk Skoru (y), balon boyutu=lead time.** *Neden: Umbrex konsantrasyon-risk görseli; yüksek harcama + yüksek risk çeyreği kritik aksiyon alanı.*
4. **Pareto/donut — Tedarikçi harcama payı** (Top-N + kuyruk). *Neden: yoğunlaşma ve pazarlık gücü görünürlüğü.*
5. **Line — Aylık ortalama lead time trendi** (Top-5 tedarikçi). *Neden: Odoo "top vendors by lead time" kalıbı.*
6. **Line — Aylık defect/iade oranı trendi** (kategori bazında). *Neden: kalite bozulması erken uyarısı.*

**Tablo Spesifikasyonları (2):**
- **Tedarikçi Scorecard tablosu** — Sütunlar: Tedarikçi | Kategori | Harcama (₺) | OTIF% | OTD% | Lead Time | Defect PPM | PPV% | SPI Skor | Durum rozeti. Varsayılan sıralama: **SPI artan** (en kötü üstte). Rozetler: Acil/Uyarı/İzle/İyi. Satır aksiyonları: "Detay", "Aksiyon planı aç", "Excel'e aktar".
- **Tek-kaynak riski tablosu** — Kalem/SKU | Kategori | Tek tedarikçi | Yıllık harcama (₺) | Alternatif var mı? | Nitelendirme durumu. Sıralama: harcama azalan.

**AI Öneri/Uyarı Örnekleri (4):**
- "⚠️ ATLAS Tekstil son 3 ayda OTIF %97→%86'ya düştü; lead time %14 arttı. Yedek tedarikçi devreye alınmalı."
- "🔴 Toplam harcamanın %34'ü tek tedarikçide (HHI 2.850). Yoğunlaşma riski yüksek — ikinci kaynak nitelendir."
- "📉 3 kritik kalemde tek kaynak bağımlılığı var, alternatif nitelendirilmemiş. Tedarik kesintisi riski."
- "✅ MERİDYEN Promosyon defect oranını 620→310 PPM'e indirdi; hacim artışı değerlendirilebilir."

---

### SAYFA 3 — STOK & İKMAL (Stock & Replenishment)

**Not:** Category>Envanter (stok yaşlanma, kritik stok, ABC) ile çakışmamak için bu sayfa **tedarik tetikleme** perspektifine odaklanır.

**KPI Kartları (12):**
| KPI (TR / EN) | Formül / Tanım | İyi Yön |
|---|---|---|
| ROP Altı SKU / SKUs Below Reorder Point | ROP = (ort. günlük satış × lead time) + emniyet stoğu | ↓ |
| Açık PO Sayısı / Open POs | Onaylı, henüz teslim alınmamış PO | Bağlam |
| Açık PO Değeri / Open PO Value (₺) | Açık PO'ların toplam tutarı (NetSuite "Spend Committed & Unreceived") | Bağlam |
| Bekleyen Teslimat (7g) / Expected Deliveries | 7 gün içinde beklenen giriş | Bağlam |
| Geciken PO / Late POs | Beklenen teslim tarihi geçmiş açık PO | ↓ |
| Ortalama İkmal Süresi / Avg Days to Receive | Sipariş → teslim ortalama gün (Odoo) | ↓ |
| Stockout Riski SKU / Stockout Risk SKUs | Days of supply < lead time olan SKU | ↓ |
| Ortalama Days of Supply | Eldeki stok ÷ ort. günlük tüketim | Hedef bant |
| Emniyet Stoğu Karşılama / Safety Stock Coverage | Eldeki ÷ emniyet stoğu | ≥1 |
| Onay Süresi / Days to Confirm | RFQ → PO onay ortalama gün | ↓ |
| Acil Sipariş Oranı / Expedited Order % | Acil/plansız sipariş ÷ toplam | ↓ |
| Fazla Stok Uyarısı / Overstock Alerts | Days of supply > üst eşik SKU sayısı | ↓ |

**Grafik/Görselleştirmeler (6):**
1. **Kritik ikmal tablosu (heatmap-style)** — eldeki stok vs ROP vs emniyet stoğu renk kodlu. *Neden: NetSuite reorder-threshold görseli.*
2. **Bar — Açık PO değeri kategoriye/tedarikçiye göre.** *Neden: gelecek nakit yükümlülüğü görünürlüğü.*
3. **Gantt/timeline — Bekleyen teslimatlar takvimi** (haftalık). *Neden: inbound planlama.*
4. **Area — Days of supply trendi** (kategori bazında).
5. **Bar — SKU başına stockout gün riski** (Top-20 riskli). *Neden: reorder-point aciliyet sıralaması.*
6. **Scatter — Lead time (x) vs lead time sapması (y)** tedarikçi bazında. *Neden: hem yavaş hem değişken tedarikçilerin ayıklanması.*

**Tablo Spesifikasyonları (2):**
- **İkmal aksiyon tablosu** — SKU | Ürün | Eldeki | ROP | Emniyet stoğu | Days of supply | Önerilen sipariş miktarı (EOQ) | Tedarikçi | Lead time | Durum. Sıralama: **days of supply artan**. Rozet: Acil (stockout < lead time) / Uyarı / İzle. Aksiyon: "PO oluştur", "Tedarikçiye sor".
- **Açık PO takip tablosu** — PO No | Tedarikçi | Sipariş tarihi | Beklenen teslim | Tutar (₺) | Gecikme (gün) | Durum. Sıralama: gecikme azalan.

**AI Öneri/Uyarı Örnekleri (4):**
- "🔴 8 SKU stockout riskinde (days of supply < lead time). Öncelikli: seramik kupa seti (3 gün kaldı, lead 12 gün)."
- "⚠️ ORİON Metal PO-2451 5 gün gecikmiş; kurumsal hediye kampanyası teslimatını riske atıyor."
- "📦 Deri cüzdan hattı ROP altında; önerilen EOQ 480 adet, tahmini landed cost ₺62/adet."
- "💡 12 SKU'da fazla stok (>90 gün); yeni sipariş ertelenerek ~₺180K nakit serbest bırakılabilir."

---

### SAYFA 4 — MALİYET (Cost)

**KPI Kartları (13):**
| KPI (TR / EN) | Formül / Tanım | İyi Yön |
|---|---|---|
| Toplam Satın Alma / Total Spend (₺) | Dönem toplam alım tutarı | Bağlam |
| Yönetilen Harcama / Spend Under Management | Yönetilen ÷ toplam adreslenebilir harcama | ↑ (>%80) |
| Serbest Harcama / Maverick Spend % | Sözleşme dışı ÷ toplam harcama | ↓ (<%10) |
| Fiyat Sapması / Purchase Price Variance | (fiili − standart fiyat) × miktar | ↓ / negatif iyi |
| Gerçekleşen Tasarruf / Realized Savings (₺) | (eski fiyat − yeni fiyat) × hacim | ↑ |
| Maliyet Kaçınma / Cost Avoidance (₺) | Önlenen fiyat artışı değeri | ↑ |
| Tasarruf Gerçekleşme / Savings Realization % | Gerçekleşen ÷ hedeflenen tasarruf | ↑ |
| Ortalama Landed Cost | Birim fiyat + navlun + gümrük + elleçleme | ↓ |
| USD Alım Payı / USD Purchase Mix % | USD faturalı alım ÷ toplam | Bağlam (kur riski) |
| EUR Alım Payı / EUR Purchase Mix % | EUR faturalı alım ÷ toplam | Bağlam |
| Kur Etkisi / FX Impact (₺) | Kur değişiminin alım maliyetine etkisi | ↓ |
| Kategori Yoğunlaşma / Category Spend Concentration | Top kategori ÷ toplam | Bağlam |
| PO Başına Maliyet / Cost per PO | Satın alma süreç maliyeti ÷ PO sayısı | ↓ |

**Grafik/Görselleştirmeler (7):**
1. **Waterfall — Standart maliyet → PPV → landed cost → kur etkisi → fiili maliyet.** *Neden: mevcut P&L waterfall diliyle uyumlu; maliyet artışının kaynaklarını ayrıştırır.*
2. **Treemap/bar — Kategori bazında harcama** (spend analysis). *Neden: Coupa/Sievo, konsolidasyon fırsatı.*
3. **Donut — Para birimi dağılımı** (TRY/USD/EUR alım). *Neden: kur riski görünürlüğü.*
4. **Line (dual axis) — Aylık harcama + ortalama birim fiyat trendi.** *Neden: NetSuite "avg purchase price by item".*
5. **Bar — PPV kategoriye/tedarikçiye göre** (favorable/unfavorable renkli).
6. **Line — USD/TRY & EUR/TRY kur trendi vs alım maliyeti.** *Neden: kur riski izleme.*
7. **Stacked bar — Tasarruf vs kaçınma (hedef vs gerçekleşen)** aylık.

**Tablo Spesifikasyonları (2):**
- **Kategori spend analizi tablosu** — Kategori | Harcama (₺) | Pay % | YoY değişim | Tedarikçi sayısı | Ort. PPV% | Tasarruf fırsatı. Sıralama: harcama azalan. Rozet: yüksek PPV kırmızı.
- **Kur riski tablosu** — Tedarikçi | Para birimi | Açık PO (döviz) | ₺ karşılığı | Kur @sipariş | Güncel kur | Kur farkı (₺). Sıralama: kur farkı azalan.

**AI Öneri/Uyarı Örnekleri (4):**
- "🔴 USD alımların payı %38; USD/TRY son 12 ayda ~%21 arttı. Açık USD PO'larda ~₺240K kur maliyeti oluştu — vadeli/forward değerlendir."
- "⚠️ Deri kategorisinde PPV %+6.2 (unfavorable); 2 tedarikçide fiyat sözleşme üstü. Yeniden müzakere."
- "💰 Ambalaj kategorisinde 3 tedarikçi konsolide edilirse ~₺95K/yıl tasarruf (spend analizi %5-15 fırsat kuralı)."
- "📊 Maverick spend %14 (hedef <%10); sözleşme dışı alımların %60'ı promosyon kategorisinde."

---

### SAYFA 5 — KARLILIK (Profitability)

**Not:** Satış tarafı karlılığı değil, **satın almanın brüt marja katkısı** perspektifi.

**KPI Kartları (11):**
| KPI (TR / EN) | Formül / Tanım | İyi Yön |
|---|---|---|
| Brüt Marj / Gross Margin % | (Gelir − SMM) ÷ Gelir | ↑ |
| SMM Trendi / COGS Trend (₺) | Dönem SMM (birim maliyet + inbound navlun + gümrük) | Bağlam |
| SMM/Gelir Oranı / COGS-to-Revenue % | SMM ÷ Gelir | ↓ |
| Satın Alma Marj Etkisi / Purchasing Margin Impact (bps) | PPV + landed cost değişiminin marja bps etkisi | ↑ |
| Tedarikçi Bazında Marj / Margin by Supplier | (Satış fiyatı − alım maliyeti) ÷ satış | ↑ |
| Kategori Bazında Marj / Margin by Category | Kategori brüt marj % | ↑ |
| Landed Cost Marj Aşınması / Landed Cost Erosion (bps) | Navlun+gümrük+kur marjı ne kadar düşürdü | ↓ |
| En Yüksek Marjlı Tedarikçi / Top-Margin Supplier | En yüksek katkı sağlayan tedarikçi | — |
| Negatif Marjlı SKU / Negative-Margin SKUs | Tam maliyette zarar eden kalem sayısı | ↓ |
| Fiyat Artışı Emilim / Price Increase Absorption % | Tedarikçi zamlarının satışa yansıtılamayan kısmı | ↓ |
| GMROI (opsiyonel) | Brüt marj ÷ ort. stok maliyeti | ↑ |

**Grafik/Görselleştirmeler (5):**
1. **Waterfall — Liste fiyatı → iskonto → landed cost → kur → SMM → brüt kar** (purchase-to-margin bridge). *Neden: Cleverence "list-to-realized margin" waterfall; nerede marj sızdığını gösterir.*
2. **Scatter — Kategori: harcama (x) vs brüt marj % (y), balon=hacim.** *Neden: yüksek harcama/düşük marj çeyreği aksiyon alanı.*
3. **Bar — Tedarikçi bazında brüt marj katkısı** (Top/bottom 10).
4. **Line (dual axis) — Aylık brüt marj % vs SMM trendi.**
5. **Heatmap tablo — Kategori × ay marj %** (bozulma erken uyarısı).

**Tablo Spesifikasyonları (2):**
- **Tedarikçi/kategori karlılık tablosu** — Tedarikçi/Kategori | Alım maliyeti (₺) | Satış geliri (₺) | Brüt marj % | Landed cost etkisi | Marj trendi (sparkline). Sıralama: **marj artan** (en kötü üstte).
- **Negatif marj SKU tablosu** — SKU | Tam maliyet | Satış fiyatı | Marj % | Neden (kur/navlun/zam). Aksiyon: "Fiyat gözden geçir", "Tedarikçi değiştir".

**AI Öneri/Uyarı Örnekleri (3):**
- "🔴 İthal cam kategorisinde brüt marj 12 ayda %42→%34; kur ve navlun kaynaklı SMM artışı fiyata yansıtılmamış."
- "⚠️ 6 SKU tam maliyette negatif marjda; toplam ~₺48K değer aşınması. Fiyat/tedarikçi revizyonu."
- "✅ ARMONİ Ambalaj'a geçiş kategori marjını +180 bps artırdı; hacim kaydırma önerilir."

---

### SAYFA 6 — BORÇLULUK (Payables)

**KPI Kartları (12):**
| KPI (TR / EN) | Formül / Tanım | İyi Yön |
|---|---|---|
| DPO / Days Payable Outstanding | (Ort. ticari borç ÷ SMM) × gün | ↑ (dengeli) |
| Toplam Ticari Borç / Total Payables (₺) | Açık tedarikçi borçları | Bağlam |
| Gecikmiş Borç / Overdue Payables (₺) | Vadesi geçmiş ödenmemiş | ↓ |
| Gecikmiş Borç % / Overdue % | Gecikmiş ÷ toplam borç | ↓ |
| Ortalama Vade / Avg Payment Term (gün) | Ağırlıklı ortalama vade | Bağlam (~30-60g) |
| Yaklaşan Ödeme (7/30g) / Upcoming Payments | Vadesi 7/30 günde dolan tutar | Bağlam |
| Ticari Borç Devri / AP Turnover | Toplam alım ÷ ort. ticari borç | Bağlam |
| Erken Ödeme İskonto Fırsatı / Early-Pay Discount (₺) | Yakalanabilir iskonto değeri | ↑ yakalama |
| Vadesi Geçen Tedarikçi Sayısı / Overdue Suppliers | Gecikmiş borcu olan tedarikçi | ↓ |
| Çek/Senet Yükü / Cheque-Note Payable (₺) | Vadeli çek + senet toplamı | Bağlam |
| BA-BS Mutabakat Durumu / Reconciliation Status % | Mutabık ÷ toplam tedarikçi (aylık) | ↑ (%100) |
| Nakit Çıkış Tahmini (30g) / Cash Outflow Forecast | Önümüzdeki 30 gün ödeme yükümlülüğü | Bağlam |

**Grafik/Görselleştirmeler (6):**
1. **Borç yaşlandırma bar/tablo (aging)** — 0-30 / 31-60 / 61-90 / 90+ gün kovaları. *Neden: Odoo Aged Payable, standart AP görseli.*
2. **Line — DPO trendi** (aylık, hedef bant çizgili).
3. **Gantt/timeline — Ödeme takvimi** (yaklaşan vadeler, tutar). *Neden: nakit planlama.*
4. **Stacked area — Nakit çıkış projeksiyonu** (30/60/90 gün).
5. **Donut — Ödeme aracı dağılımı** (havale / çek / senet / açık hesap). *Neden: Türkiye'de çek/senet ağırlığı görünürlüğü.*
6. **Bar — Tedarikçi bazında gecikmiş borç** (Top-10).

**Tablo Spesifikasyonları (2):**
- **Ödeme takvimi/vade tablosu** — Tedarikçi | Fatura no | Vade tarihi | Tutar (₺) | Para birimi | Kalan gün | Ödeme aracı | Durum. Sıralama: **kalan gün artan**. Rozet: Acil (vadesi geçmiş) / Uyarı (≤7g) / İzle.
- **BA-BS mutabakat tablosu** — Tedarikçi | Bizim bakiye | Karşı bakiye | Fark (₺) | Mutabakat durumu | Son mutabakat tarihi. Rozet: Uyumsuz kırmızı.

**AI Öneri/Uyarı Örnekleri (4):**
- "🔴 ~₺320K borç vadesi geçmiş (toplamın %8'i); 3 tedarikçi ödeme bekliyor — tedarik kesintisi riski."
- "💡 ORİON Metal net-10 %2 erken ödeme iskontosu sunuyor; ~₺14K yakalanabilir (sermaye maliyetinin üstünde)."
- "⚠️ 4 tedarikçide BA-BS bakiye farkı var (toplam ~₺56K); ay sonu mutabakatı öncesi çözülmeli."
- "📅 Önümüzdeki 7 günde ~₺680K ödeme yükümlülüğü; nakit pozisyonu kontrol edilmeli."

---

## (c) Yönetici Özeti (Executive Summary) Sayfası

**Amaç:** Alt 5 sayfadan en kritik KPI ve uyarıları toplayan komuta merkezi; mevcut Management Overview'daki health-score kalıbıyla tutarlı.

**Roll-up eden öğeler:**
- **Tedarikçi'den:** OTIF, riskli tedarikçi sayısı, Top-1 pay / HHI.
- **Stok'tan:** stockout riski SKU sayısı, geciken PO, açık PO değeri.
- **Maliyet'ten:** Toplam harcama, SUM %, maverick spend %, gerçekleşen tasarruf, kur etkisi.
- **Karlılık'tan:** brüt marj %, satın alma marj etkisi (bps).
- **Borçluluk'tan:** DPO, gecikmiş borç %, 30 günlük nakit çıkışı.

**KPI kart bandı (üstte, 6-8 kart):** Toplam Satın Alma (₺) | SUM % | OTIF | Tasarruf (₺) | DPO | Brüt Marj % — her biri trend badge + sparkline ile.

**Satın Alma Sağlık Skoru (Procurement Health Score):** 0-100 ağırlıklı bileşik = Maliyet/Tasarruf (%25) + Tedarikçi performansı (%25) + İkmal/Stok sağlığı (%20) + Borçluluk/nakit (%15) + Karlılık katkısı (%15). Fanruan'ın QCD (Quality-Cost-Delivery) tek-not mantığıyla uyumlu. Görsel: donut/gauge + harf notu (A-F).

**Uyarı Taksonomisi (Alert Taxonomy)** — mevcut rozet dili (Acil/Uyarı/İzle):
- 🔴 **Acil (Critical):** stockout < lead time; gecikmiş borç tedarik riski; tek tedarikçi >%30; OTIF <%85.
- 🟠 **Uyarı (Warning):** maverick spend >%10; PPV unfavorable >%5; vade ≤7g yüksek tutar; BA-BS uyumsuzluk.
- 🔵 **İzle (Watch):** marj bozulma trendi; lead time artışı; fazla stok; kur payı yükseliyor.

**Grafikler (Yönetici Özeti):** (1) Health score gauge, (2) Harcama trendi + tasarruf area, (3) Top uyarılar listesi (ilgili sayfaya drill-down linkli), (4) Tedarikçi risk mini-scatter, (5) Nakit çıkış 30/60/90 mini-bar.

---

## (d) Mevcut Sayfalarla Çapraz Bağlantı & Çakışma Önleme

| Konu | Category'de kalır | Satın Alma'ya ait | Çapraz link |
|---|---|---|---|
| Stok seviyeleri / yaşlanma | ✅ Envanter & Stok (yaşlanma, kritik stok, ABC) | — | Satın Alma>Stok'ta "Envanter detayı için Category'ye git" linki |
| Yeniden sipariş / ikmal | — | ✅ Reorder point, açık PO, days of supply | Ortak SKU veri kaynağı |
| ABC / Portföy analizi | ✅ ABC geçiş matrisi, ürün yaşam döngüsü scatter | — | Tedarikçi sayfası kategori filtreleriyle bağlanır |
| Ürün karlılığı | ✅ Satış marjı (Category) | Satın alma marj katkısı / SMM tarafı | Karlılık'ta "satış marjı için Category'ye git" |
| Borç kartları | Management Overview (özet payables kartı) | ✅ Detaylı DPO / aging / vade / BA-BS | Overview payables kartı → Satın Alma>Borçluluk drill-down |
| P&L waterfall | ✅ Management Overview | Maliyet/Karlılık waterfall (satın alma dilimi) | Tutarlı waterfall görsel dili |

**Kural:** Category = "ne kadar stok var / ürün nasıl performans veriyor"; Satın Alma = "ne zaman, kimden, kaça sipariş verilmeli ve kime ne kadar borçluyuz". Envanter değerleme ve stok yaşlanma **tek yerde** (Category) tutulur; Satın Alma yalnızca tetikleyici/tedarik metriklerini (ROP, days of supply, açık PO) gösterir. Aynı SKU tablosu iki departmanda farklı sütun setleriyle sunulur (Category: değerleme/yaşlanma; Satın Alma: ROP/lead time/tedarikçi).

---

## (e) Mock Data Rehberi

**Ölçek:** ~2.5M ₺ aylık gelir → aylık satın alma ~₺1.3-1.6M (SMM ~%55-60 gelir). Yıllık ~₺16-19M satın alma.

**Tedarikçi isimleri (jenerik, gerçek marka değil):** ATLAS Tekstil, MERİDYEN Promosyon, ORİON Metal, ARMONİ Ambalaj, EGE Deri, ANADOLU Cam, MARMARA Baskı, VİZYON Hediyelik, ZİRVE Kırtasiye, DENİZ Porselen, KURUMSAL Kalem, TREND Tekstil (12-20 tedarikçi arası).

**Kategoriler:** Tekstil (tişört/çanta), Deri (cüzdan/ajanda), Metal (kalem/anahtarlık), Cam & Porselen (kupa/bardak), Ambalaj & Kutu, Baskı & Promosyon, Kırtasiye.

**Değer aralıkları:** Tedarikçi başına yıllık ₺400K-3M; Top-1 tedarikçi ~%18-28 pay (HHI ~1.800-2.400); OTIF %82-98; lead time 7-30 gün; defect 150-800 PPM; PPV %-4 ile %+7; DPO 35-65 gün; brüt marj %30-50 (kategori bazında).

**Para birimi karması:** TRY %55, USD %28, EUR %17 (ithal cam/deri/elektronik aksesuar döviz faturalı). Mock kurlar: USD/TRY ~43, EUR/TRY ~50,5 (2025 sonu seviyeleri). Kur @sipariş vs güncel farkı ~%3-8 gösterilerek kur riski canlandırılır. **Not:** 2026 kur tahminleri "prediction" olarak işaretlenmeli; bunlar gerçek değil, mock veridir.

**Vade/ödeme:** ortalama vade 30-45 gün, bazı tedarikçi 60 gün (Atradius Türkiye 2025: tipik tavan ~30 gün); gecikmiş borç %5-9 (Türkiye B2B geç ödeme ~%61 fatura bağlamıyla uyumlu, ancak Muhiku'nun *kendi ödediği* borçlar için makul aralık); çek/senet payı ödemelerin ~%30'u (vadeli çek 60-120 gün); kalanı havale/açık hesap. BA-BS mutabakat: 12-20 tedarikçiden 2-4'ünde küçük bakiye farkı gösterilerek mutabakat akışı canlandırılır.

---

## (f) i18n Notu — EN Etiket Önerileri

Tüm etiketler mevcut i18n dictionary'ye **`procurement.*`** namespace altında eklenmeli.

**Sayfa adları:** Yönetici Özeti = Executive Summary; Tedarikçi = Suppliers; Stok & İkmal = Stock & Replenishment; Maliyet = Cost; Karlılık = Profitability; Borçluluk = Payables.

**Bölüm başlıkları:** Tedarikçi Scorecard = Supplier Scorecard; Yoğunlaşma & Risk = Concentration & Risk; İkmal Aksiyonları = Replenishment Actions; Açık Siparişler = Open POs; Harcama Analizi = Spend Analysis; Kur Riski = FX Exposure; Tasarruf & Kaçınma = Savings & Avoidance; Purchase-to-Margin Köprüsü = Purchase-to-Margin Bridge; Borç Yaşlandırma = Payables Aging; Ödeme Takvimi = Payment Schedule; BA-BS Mutabakat = BA-BS Reconciliation; Satın Alma Sağlık Skoru = Procurement Health Score; Kritik İkmal = Critical Replenishment.

**KPI / kolon örnekleri:** Yönetilen Harcama = Spend Under Management; Serbest/Sözleşme Dışı Harcama = Maverick Spend; Fiyat Sapması = Purchase Price Variance (PPV); Zamanında Tam Teslim = On-Time In-Full (OTIF); Zamanında Teslimat = On-Time Delivery; Tedarik Süresi = Lead Time; Lead Time Sapması = Lead Time Variance; Yeniden Sipariş Noktası = Reorder Point; Emniyet Stoğu = Safety Stock; Days of Supply = Days of Supply; Açık PO Değeri = Open PO Value; Ticari Borç = Payables; Vade = Payment Term; Gecikmiş = Overdue; Landed Cost = Landed Cost; Brüt Marj = Gross Margin; Yoğunlaşma İndeksi = Concentration Index (HHI); Tedarikçi Skoru = Supplier Score / SPI; Erken Ödeme İskontosu = Early-Payment Discount.

---

## (g) Now / Next / Later Build Sırası

**NOW (ilk sprint — çekirdek değer + hızlı kazanım):**
1. **Tedarikçi** sayfası (scorecard heatmap, OTIF bar, yoğunlaşma scatter/pareto) — en yüksek karar değeri; mevcut tablo + scatter + ColumnManager bileşenleri doğrudan yeniden kullanılır.
2. **Maliyet** sayfası (spend treemap, PPV, kur riski) — waterfall/treemap; mevcut Management P&L waterfall dilini genişletir.
3. **Yönetici Özeti** iskeleti (KPI bandı + health score gauge + uyarı listesi) — başlangıçta yalnızca Tedarikçi & Maliyet KPI'larını çekerek.

**NEXT (ikinci sprint):**
4. **Borçluluk** (DPO trend, aging bar, ödeme takvimi timeline, BA-BS tablo) — finans değeri yüksek; yeni aging/timeline bileşenleri gerektirir.
5. **Stok & İkmal** (kritik ikmal heatmap, açık PO, stockout riski) — Category>Envanter veri kaynağıyla entegre; (d)'deki çakışma kurallarına dikkat.
6. Yönetici Özeti'ni Borçluluk + Stok KPI'larıyla tamamla; health score ağırlıklarını kalibre et.

**LATER (üçüncü sprint — derinlik):**
7. **Karlılık** (purchase-to-margin bridge waterfall, tedarikçi/kategori marjı) — Category satış marjı verisiyle bağ gerektirir; en fazla çapraz-departman entegrasyon içerdiği için sona bırakılır.
8. AI öneri motorunu tüm sayfalara yay (mevcut "AI önerileri" kalıbı); eşik-aşımı otomatik uyarıları.
9. Excel export + ColumnManager tüm yeni tablolara; kur/vade forward senaryo simülasyonları.

**Gerekçe:** Tedarikçi + Maliyet en yüksek karar değerini mevcut bileşen yeniden kullanımıyla birleştirir (Fanruan "phased approach": önce spend görünürlük, sonra supplier scorecarding, sonra ileri risk/analitik). Borçluluk ve Stok operasyoneldir ve orta karmaşıklıktadır; Karlılık en fazla çapraz-departman veri entegrasyonu (satış marjı × alım maliyeti) gerektirdiği için en sona alınır.

---

## Caveats (Uyarılar)
- **Eşik değerler sektöre göre uyarlanmalı:** OTIF ≥%95, PPM defect <500 ve PO-başına maliyet benchmark'ları imalat/otomotiv referanslıdır (LeanLinking, APQC). Kurumsal hediye/perakende için hedefler yumuşatılmalı (ör. OTIF ≥%90 makul başlangıç).
- **Türkiye vade verisi tutarsız çerçeveleniyor:** Atradius'un güncel (2025) raporu "~30 gün politika tavanı" derken eski raporlar "42-55 gün ortalama" kullanıyor — bunlar doğrudan kıyaslanamaz; mock data 30-60 gün bandında tutulmalı.
- **FX rakamları:** USD/TRY ~43, EUR/TRY ~50,5 seviyeleri 2025 sonu spot değerleridir; 2026 kur tahminleri kaynaklarda "prediction/forecast" olarak geçer ve demo verisi olarak "gerçek değil" işaretlenmeli. EUR/TRY'deki %27-38 kayıp, EUR'nun 2025'te USD karşısında güçlenmesiyle şişmiştir.
- **"Her yönetilen 1$ = %6-12 tasarruf" iddiası** bu araştırma turunda birincil kaynakla teyit edilemedi (Ardent'in doğrulanmış 2025 rakamı ortalama SUM %71'dir); brief'te bu spesifik oran yerine "spend analizi tipik olarak %5-15 tasarruf fırsatı ortaya çıkarır" (Varisco/Mekari-Ardent) ifadesi kullanılmıştır.
- **BA-BS kapsamı:** Elektronik ortamda kesilen (e-Fatura/e-Arşiv) belgeler Temmuz 2021'den beri Ba/Bs bildirimine dahil değildir; demo'da BA-BS mutabakat özelliği yalnızca kağıt/cari bakiye teyidi bağlamında konumlandırılmalı.
- **Kapsam:** Bu brief demo (mock data) içindir; canlı ERP entegrasyonunda KPI formülleri gerçek veri sözlüğüne (SMM tanımı, landed cost bileşenleri, standart fiyat kaynağı) göre kalibre edilmelidir.

---
# ADDENDUM v2 — Yeni Sayfalar ve Power BI Entegrasyonu

## A1. Güncel Bilgi Mimarisi (9 sayfa)
1. Yönetici Özeti / Executive Summary
2. Tedarikçi / Suppliers
3. Satın Alma Operasyonu / Procurement Operations  ← YENİ
4. Uzman Performans / Buyer Performance  ← YENİ
5. Proje Fiyatlama / Project Pricing  ← YENİ
6. Maliyet / Cost
7. Karlılık / Profitability
8. Borçluluk / Payables
9. Stok & İkmal / Stock & Replenishment

## A2. Veri Modeli Ekleri (types + mock data)
Funnel: Fiyatlama Projesi (Quote) → onay → Satınalma Talebi (PR)
→ Satınalma Siparişi (PO) → Teslim. PR↔PO bağlı (bir PR'a 0-4 PO).
Her Quote/PR/PO'da kaynak alanı: 'B2B' | 'B2C' — mevcut global
hesap filtresi (Muhiku Total / B2B / B2C) bu sayfalarda da çalışır.

- Buyer (satın alma uzmanı): 5 mock isim — Deniz Aksoy, Kerem Yıldız,
  Selin Acar, Baran Koç, İpek Duman. GERÇEK çalışan adı KULLANMA.
- PurchaseRequest (PR): id (PR26xx), başlık, kaynak B2B/B2C, durum
  (Taslak/Beklemede/Tedarik Edilebilir/İşleniyor/Tamamlandı/İptal),
  oluşturma + tamamlanma tarihi, sorumlu buyer, bağlı PO id'leri,
  bağlı quote id (varsa). ~70 kayıt / son 6 ay, aylık artan hacim.
- PurchaseOrder (PO) mevcut tipe ek alanlar: prId, buyer, kaynak,
  siparişVerilme + tamamlanma tarihi, tedarikçi, tutar, para birimi.
- Quote (fiyatlama projesi): id, proje adı (jenerik firma), kaynak,
  durum (Fiyatlanacak/TDR Cevap Bekleniyor/Eksik Bilgi/Fiyatlandı/
  İptal/Arşiv), kartAçılış + sonFiyatlama tarihi, fiyatlamaSüresi
  (saat), özelBaskı boolean, sorumlu buyer, satış sorumlusu (mock),
  dönüştü mü (PR'a) boolean. ~90 kayıt; haftalık geliş yoğunluğu
  sezonsal (Kas-Ara tepe, yaz dip); fiyatlama süresi 2-72 saat,
  özel baskılılarda ortalama daha uzun.
- Marka boyutu: SpendRecord'a marka alanı (jenerik: NordPen, VeraTex,
  LumoGlass, OakCraft, PrimoBag vb. 10 marka).

## A3. YENİ SAYFA — Satın Alma Operasyonu (Procurement Operations)
Amaç: PR/PO hunisi, süreç hızı ve darboğazlar. (Kaynak: ERP
Satınalma Talepleri + Siparişleri ekranları.)
KPI (12): Aylık Gelen Talep; Açık Talep; Talep→Sipariş Dönüşüm %;
Ort. Talep Tamamlanma Süresi (gün); Ort. PR→PO Süresi; Ort. PO
Teslim Süresi; Zamanında Tamamlanan PR %; İptal Oranı %; PR Başına
Ort. PO; Geciken Sipariş Sayısı; B2B/B2C Talep Oranı; Bekleyen
Onay Sayısı.
Görseller (6): (1) Aylık PR hacmi stacked bar B2B/B2C + dönüşüm
line (dual axis); (2) Durum hunisi PR (Beklemede→…→Tamamlandı);
(3) Aşama süre analizi bar — her durumda ort. gün (Pipeline'daki
Stage Duration pattern'i); (4) Haftalık gelen talep line (52 hafta,
sezonsal tepe işaretli); (5) PR yaş dağılımı histogram (açık
talepler); (6) İptal nedeni/kaynak donut.
Tablolar (2): Açık PR tablosu (id, başlık, kaynak, durum, yaş gün,
buyer, bağlı PO, rozet: Acil>7g/Uyarı>3g); Geciken PO tablosu
(mevcut Stok sayfasındakiyle çakışmasın → burada sadece süreç
gecikmesi perspektifi, link ver).
AI uyarıları (3): talep yığılması haftası; Beklemede aşamasında
ort. süre artışı; iptal oranı sıçraması.

## A4. YENİ SAYFA — Uzman Performans (Buyer Performance)
Amaç: Satış>Uzman Performans sayfasının satın alma karşılığı;
aynı görsel kalıp. (Kaynak: Power BI "Satın Alma Sorumluları".)
KPI (8): Toplam Ekip Alımı (₺); Uzman Başına Ort. Alım; En Hızlı
Tamamlayan (isim+süre); En Yavaş (isim+süre); Ekip Ort. Tamamlama
Süresi; Ekip Zamanında Tamamlama %; Toplam Açık İş (PR+PO); Ort.
Ödeme Süresi (gün).
Görseller (4): (1) Uzman karşılaştırma tablosu — alım ₺, PR adedi,
PO adedi, ort. tamamlama süresi, zamanında %, açık iş, ort. ödeme
süresi, trend sparkline (Satış'taki ekip tablosu kalıbı);
(2) Uzman bazlı alım bar (aylık, top uzmanlar); (3) İş yükü dengesi
stacked bar (açık PR/PO uzman bazında); (4) Tamamlama süresi trendi
line (uzman bazlı).
AI uyarıları (3): iş yükü dengesizliği; bir uzmanda süre artış
trendi; pozitif performans örneği.

## A5. YENİ SAYFA — Proje Fiyatlama (Project Pricing)
Amaç: fiyat taleplerinin hız/SLA takibi, yığılma öngörüsü,
dönüşüm. (Kaynak: Notion B2B Proje Fiyatlama — gelecek ay ERP'ye
taşınacak; raporu şimdiden hazırlıyoruz.)
KPI (10): Aylık Gelen Fiyat Talebi; Bekleyen Fiyatlama; Ort.
Fiyatlama Süresi (saat); SLA Uyumu % (hedef ≤24s); En Uzun Bekleyen
(saat); Fiyatlandı→PR Dönüşüm % (win rate); Özel Baskılı Talep %;
TDR Cevap Bekleyen; Eksik Bilgi Bekleyen; Tahmini Gelecek Hafta
Talep (forecast).
Görseller (6): (1) Yığılma heatmap — hafta × gün gelen talep
yoğunluğu (İletişim sayfasındaki günlük aktivite pattern'i);
(2) Durum hunisi (Fiyatlanacak→TDR→Eksik Bilgi→Fiyatlandı→PR'a
dönüştü); (3) Haftalık gelen talep + 4 haftalık forecast (kesikli
çizgi — Satış Forecasting pattern'i, Q4 tepe); (4) Fiyatlama süresi
dağılımı histogram + SLA çizgisi; (5) Özel baskılı vs normal ort.
süre karşılaştırma bar; (6) Uzman bazlı ort. fiyatlama süresi bar.
Tablolar (2): Bekleyen fiyatlamalar (proje, kaynak, durum, bekleme
saati, özel baskı, buyer, rozet: Acil>48s/Uyarı>24s); Dönüşüm
tablosu — aylık fiyatlanan vs PR'a dönüşen vs oran.
AI uyarıları (4): gelecek hafta yığılma tahmini; SLA ihlal riski;
eksik bilgi darboğazı; dönüşüm oranı düşüşü.

## A6. Mevcut Sayfalara Power BI Kaynaklı Ekler
- Tedarikçi scorecard tablosuna 2 kolon: Ort. Ödeme Süresi (gün),
  Toplam Borç (₺). KPI ekle: Ort. Gecikme (gün) + Geciken Kalem
  sayısı (PBI'daki ham "gecikme süresi toplamı" yerine).
- Maliyet: (1) Yıl & Çeyrek bazlı alım tutarı + adet dual-axis
  combo chart (PBI ana grafiği); (2) Marka Analizi bölümü — top 10
  marka bar + marka performans tablosu (Kategori>Marka Analizi
  kalıbı); (3) kategori bar'ına tıklanınca alt kırılım (drill-down
  state) — PBI decomposition tree'nin modern karşılığı.
- Borçluluk KPI bandının başına PBI üçlüsü: Güncel Borç / Vadesi
  Gelecek Borç / Vadesi Geçmiş Borç (₺, renk: nötr/sarı/kırmızı).
- Para birimi: her yerde ana gösterim TRY; döviz tutarları ikincil.

## A7. Yönetici Özeti Roll-up Ekleri
Operasyon'dan: açık talep + dönüşüm %; Fiyatlama'dan: bekleyen
fiyatlama + SLA %; Uzman'dan: ekip zamanında tamamlama %.
Health Score yeni ağırlıklar: Maliyet %20, Tedarikçi %20,
Operasyon+Fiyatlama %20, Stok %15, Borçluluk %15, Karlılık %10.

## A8. i18n Ekleri (procurement.* namespace)
Satın Alma Operasyonu=Procurement Operations; Uzman Performans=
Buyer Performance; Proje Fiyatlama=Project Pricing; Talep=Request;
Sipariş=Order; Dönüşüm Oranı=Conversion Rate; Fiyatlama Süresi=
Pricing Turnaround; SLA Uyumu=SLA Compliance; Özel Baskı=Custom
Print; Bekleyen Fiyatlama=Pending Quotes; Yığılma=Backlog; Aşama
Süresi=Stage Duration; İş Yükü=Workload; Zamanında Tamamlama=
On-Time Completion; Ort. Ödeme Süresi=Avg Payment Period; Güncel
Borç=Current Payables; Vadesi Gelecek=Upcoming Due; Vadesi Geçmiş=
Overdue.