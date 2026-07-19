# Muhiku ERP — FİNANS Departmanı Brief

> Bu doküman `docs/finance-brief.md` olarak repoya konur. F1–F6 prompt'ları bu brief'e referans verir; spec tekrar yapıştırılmaz.
> Stack: React 19 + Recharts + TS + Vite, base:'/erp/', TR/EN i18n, mock data. Canlı: lab.mhkapp.com/erp

---

## 0. Felsefe & Temel Kararlar

1. **NON-GAAP (yönetim) BİRİNCİL, resmi (Paraşüt) ikincil.** Yönetim rakamı ana; resmi rakam opsiyonel mutabakat köprüsü katmanı. İleride manuel edit alanları v2'de gelecek.
2. **Tek gerçek kaynak = ERP.** Paraşüt, Finekra, Sheet, Coupler (marketing) — hepsi günün sonunda ERP'ye raporlar. ERP'de olmayan veriyi kullanıcı **Manuel alanlar**dan doldurur.
3. **Global para birimi toggle: TRY / USD.** Fintables'taki gibi sayfanın tamamında geçerli tek bir `currency` seçici (üst barda). TRY girişleri çeyrek/dönem kuru ile USD'ye çevrilir. **İstisna: Peers/Rakip Analizi sadece USD** (peer'lar farklı ülke borsalarında, kafa karışmasın).
4. **Ölçek referansı:** ~2,5M ₺ aylık gelir bandı (demo geneli).
5. **Mock isim politikası:** gerçek çalışan/müşteri adı YOK, jenerik kullan. İstisna: 3 ortak gerçek isim (aşağıda).
6. **Kullanıcının dağınık Sheet yapısı kopyalanmaz.** Sıfırdan doğru veri modeli, temiz satır/sütun, doğru gösterim tasarlanır.

## 1. Sermaye Yapısı (Cap Table)

- **20.000.000 hisse**, **20.000.000 ₺ kayıtlı sermaye** (1 ₺ nominal/hisse).
- 3 ortak:
  - **Abdülhamit Gürakar** — 7.000.000 hisse — **%35**
  - **Ahmet Üreme** — 7.000.000 hisse — **%35**
  - **Hasan Topalakcı** — 6.000.000 hisse — **%30**
- Her çeyrek sonu kullanıcı **1 hisse fiyatı** girer → market cap, tüm çarpanlar, ortak-bazlı değer otomatik hesaplanır.

## 2. Üç Katmanlı Mimari

### Katman A — Giriş & Veri: "Yönetim > Finansal Veriler"
Kullanıcının her çeyrek dolduracağı yer. Tab'lar (global currency toggle'a tabi):

| Tab | İçerik |
|---|---|
| Gelir Tablosu (Income Statement) | Hasılat → SMM → brüt kâr → faaliyet giderleri → FAVÖK → net kâr |
| Bilanço (Balance Sheet) | Dönen/duran varlıklar, KV/UV yükümlülükler, özkaynak, net borç |
| Nakit Akışı (Cash Flow) | İşletme / yatırım / finansman faaliyetleri, FCF |
| Gider Ağacı (Expense Tree) | Toggle ile açılan kalemler — aşağıda detay |
| Ortak Getirisi (Temettü) | Kişi × Tarih × Ödenecek × Kur × Ödenen × Bakiye |
| Meta / Ayarlar | Dönem kuru (USD/TRY), enflasyon düzeltme yöntemi (nominal / IAS 29), **1 hisse fiyatı** |

**Kaynak rozetleri** (her satır/alan):
- `ERP` (yeşil) — otomatik, salt-okunur/kilitli
- `Paraşüt` (gri) — resmi kayıt, opsiyonel mutabakat
- `Manuel` (amber) — kullanıcı doldurur; boşsa **"doldurulmadı" sarı badge**

**Versiyonlama:** çeyrek bazlı (2026/Q1, Q2…). Her kayıt bir **audit log** üretir; değişiklik geçmişi görüntülenir ve **eski versiyona geri dönülebilir** (revert).

### Katman B — Analiz & Görselleştirme (Yatırımcı-gözü)
Doldurulan veri buraya akar. Alt sayfalar:

1. **Özet / Genel Bakış** — fair value gauge (girilen fiyat vs AI adil değer, upside %), 8-kategori scorecard, cap table donut (Abdülhamit %35 / Ahmet %35 / Hasan %30)
2. **Finansallar** — gelir tablosu waterfall/Sankey, çeyreklik trend barlar, detaylı tablolar (income statement / balance sheet / cash flow)
3. **Değerleme** — çarpanlar (F/K, PD/DD, FD/FAVÖK, FD/Satış, PEG) tarihsel bant + AI senaryo (Ayı %25 / Baz %50 / Boğa %25) + WACC×büyüme duyarlılık matrisi + revizyon geçmişi
4. **Peers / Rakip Analizi** — 4 peer + metrik heatmap (**SADECE USD**)
5. **Rasyo Analizi** — karlılık / likidite / kaldıraç / faaliyet etkinlik tarihsel çizgiler

### Katman C — Treasury / Nakit Akışı (Finekra köprüsü)
Operasyonel nakit yönetimi — yatırımcı-gözünden ayrı alt-modül. Kapsam:

- Günlük / haftalık nakit akışı (gelen/giden)
- Gelecek hafta ödeme takvimi (payment calendar)
- Çek / senet / kredi listesi + vade takibi
- Borçluluk (yaşlandırma kovaları / aging buckets)
- Gelecek gelir + tahsilat beklentisine göre nakit projeksiyonu
- Banka hesap agregasyonu (17 hesap, TRY/EUR/USD)
- Plan vs Gerçekleşen tahsilat/ödeme

> **Kaynak çakışması notu:** Finekra (-380K, bağlı banka hesapları) ≠ Paraşüt (-56M, resmi kayıt). Kapsam farkı; ikisi de ERP'ye ayrı kalem akar, valuation ERP konsolide rakamı kullanır.

## 3. Gider Ağacı (Expense Tree) — editable + audit log

Gelir ve gider = tüm mali tabloların çatısı. "Finansal Veriler > Gider Ağacı"nda toggle ile alt alta açılan hiyerarşi. Örnek kalemler (kullanıcı ekler/çıkarır):

- **Personel Giderleri**: Maaşlar, SGK primleri, Kıdem/İhbar Tazminatı, Yan haklar, Ek mesai
- **Pazarlama & Reklam**: Meta Ads, Google Ads, Criteo, Taboola, X, Outdoor, diğer (B2C/B2B kırılımı Coupler'dan)
- **Genel Yönetim (G&A)**: Kira, Ofis, Danışmanlık, Yazılım/SaaS, Muhasebe/hukuk
- **Operasyon**: Kargo/lojistik, Depo, Paketleme, Ödeme komisyonları (POS/iyzico/PayTR)
- **Finansman Giderleri**: Kredi faizi, Çek/senet, Kur farkı
- **Vergi & Yasal**: KDV, Kurumlar vergisi, Stopaj, SGK işveren

Her kalem: değer girilebilir/editlenebilir, **Kaydet** butonu, değişiklik logu, log'a geri dönüş. Global currency toggle'a tabi.

## 4. 8-Kategori Scorecard (Yatırımcı-gözü)

Her kategori peer setine göre **A–F harf notu** (Seeking Alpha mantığı; sektör yerine seçili peer grubu):

1. **Değerleme** (Valuation) — F/K, FD/FAVÖK, PEG vs peer medyanı
2. **Büyüme** (Growth) — gelir/FAVÖK/EPS YoY + CAGR
3. **Karlılık** (Profitability) — brüt/FAVÖK/net marj
4. **Finansal Sağlık** (Financial Health) — net borç, kaldıraç, borç/FAVÖK
5. **Nakit / Likidite** (Cash & Liquidity) — FCF, cari oran, nakit dönüşüm
6. **Sermaye Verimliliği** (Capital Efficiency) — ROE, ROIC, ROA
7. **Ortak Getirisi** (Shareholder Return) — temettü, kâr payı
8. **Yönetim Kalitesi** (Management Quality) — marj tutarlılığı, öngörü isabeti

> Not: 6, 7, 8 ayrı ayrı — kullanıcının açık tercihi ("bizimki farklı olsun"). Momentum yok (private company, çeyrekte tek fiyat).

## 5. Peers / Rakip Analizi (SADECE USD)

4 core peer — ülke bayrağı + hizmet verdiği pazarlar etiketi:

| Peer | Ülke | Not |
|---|---|---|
| Moonpig Group (MOON) | 🇬🇧 UK | Online hediye+tebrik kartı, en yakın comp |
| 1-800-Flowers (FLWS) | 🇺🇸 US | Çiçek+gurme hediye e-ticaret (zararda → P/S kullan) |
| Card Factory (CARD) | 🇬🇧 UK | Value hediye/kart perakende |
| Notonthehighstreet | 🇬🇧 UK | Private, kişiselleştirilmiş hediye pazaryeri (zararda) |

- İkincil aday (onaya tabi): Cricut, Build-A-Bear, Cimpress.
- Peer verileri mock JSON'da tutulur; F5'te kullanıcı güncelleyebilir (Google Finance'den elle iletilecek).
- Metrik satırında **en iyi değeri renklendir** (heatmap): gelir, büyüme, marjlar, F/K, P/S, FD/FAVÖK, FD/Satış, ROE.
- Üstte peer medyanı vs Muhiku implied satırı.

## 6. Değerleme Metodolojisi

- **3 yöntem stack:** (a) trading comps (peer medyan FD/Satış, FD/FAVÖK, F/K), (b) DCF (Türkiye ülke risk primi ~%9,3 dahil USD WACC), (c) senaryo-ağırlıklı adil değer = %25 Ayı + %50 Baz + %25 Boğa.
- **Private-company iskontosu:** ~%25 (illikidite + boyut), ayarlanabilir slider.
- **AI adil değer:** tüm veri kaydedilince adil değer bandı + tek ağırlıklı nokta + fiyat hedefi + upside % + model durumu ("iskontolu/pahalı") + yazılı gerekçe (somut rakam: PEG, sektör F/K iskontosu, ROIC). Her çıktıda "yatırım tavsiyesi değildir" ibaresi.
- **Duyarlılık matrisi:** WACC × büyüme, heatmap, mevcut varsayım hücresi vurgulu.
- **Revizyon geçmişi:** çeyrek bazlı adil değer değişim timeline'ı.

## 7. Temettü / Ortak Getirisi

Muhiku Temettü Sheet yapısı → temiz tabloya dönüştürülür:
- Kişi (3 ortak) × Tarih × Ödenecek Tutar × Dönem Kuru × USD Tutar × Ödenen × Bakiye.
- Raporda: ortak-bazlı temettü akışı, kümülatif bakiye, USD karşılık, ödeme geçmişi.

## 8. Nakit Akışı — Tam Kapsam (Katman C detay)

Aklına gelen tüm faydalı görünümler dahil:
- Günlük/haftalık gelen-giden nakit (bar + çizgi)
- Gelecek hafta ödeme takvimi (kim, ne kadar, hangi vade)
- Gelecek haftalar gelir + tahsilat beklentisi → nakit projeksiyon eğrisi
- Borçluluk / alacak yaşlandırma (aging buckets: 0-30, 31-60, 61-90, 90+)
- Çek/senet/kredi vade takibi + erken kapama tasarrufu
- Plan vs Gerçekleşen (tahsilat/ödeme)
- Kuruma göre ödenecekler
- Banka bazlı hareket + konsolide bakiye

## 9. Terminoloji İlkesi (KRİTİK)

**İngilizce orijinal terim → düz çeviri DEĞİL → Türkiye'deki yerleşik finansal karşılık.**

| İngilizce | ❌ Düz çeviri | ✅ Türkiye karşılığı |
|---|---|---|
| Revenue | Gelir | Hasılat |
| EBITDA | — | FAVÖK |
| Cost of Goods Sold | — | SMM (Satılan Malın Maliyeti) |
| Gross Profit | — | Brüt Kâr |
| Operating Income | — | Esas Faaliyet Kârı |
| Accounts Receivable | — | Ticari Alacaklar |
| Accrued Expenses | — | Gider Tahakkukları |
| Retained Earnings | Elde Tutulan Kazançlar | Geçmiş Yıllar Kârları |
| P/E | — | F/K |
| P/B | — | PD/DD |
| EV/EBITDA | — | FD/FAVÖK |
| EV/Sales | — | FD/Satış |
| Current Ratio | — | Cari Oran |
| DLOM | — | Pazarlanabilirlik Kısıtı İskontosu |
| Net Debt | — | Net Borç |
| Working Capital | — | İşletme Sermayesi |

**Kural:**
- Başlık/etiket: **aktif dile göre TEK dil** (TR veya EN, global i18n toggle'a tabi). İkisi birden gösterme.
- Her metrik/başlık yanında küçük **"i" tooltip** (hover pop-up): orijinal İngilizce terim + Türkçe karşılık + kısa açıklama. TradingView'dan daha iyi.

## 10. Kaldırılanlar / Uyarılar

- Finans sayfasındaki sağ üst **B2C/B2B toggle KALDIRILIR** (raporlamada kullanılmıyor).
- Enflasyon düzeltmesi: TRY girişi nominal veya IAS 29 düzeltilmiş olabilir; meta alanında yöntem seçilir. Valuation USD üstünden (dönem-ortalama kur P&L, dönem-sonu kur bilanço).

## 11. Tasarım Referansları

- **Fintables** — global TRY/USD toggle, karne 3'lü skor, çeyreklik trend, enflasyon düzeltme rozeti, rasyo tarihsel çizgi, rakip analizi tablosu
- **Seeking Alpha** — factor grade renklendirme, peer karşılaştırma, A–F not
- **TradingView** — detaylı finansal tablo, metrik tooltip, revenue by source/country
- **Finvest** — fair value senaryo haritası, duyarlılık matrisi, value-driver bar, revizyon timeline, Sankey gelir akışı
- **Stock Unlock** — score card, renk-kodlu metrik grade, valuation warning

## 12. Prompt Sırası (Claude Code)

Her prompt sonrası: commit + `/clear` + `npm run build`.

| # | Kapsam | Bağımlılık |
|---|---|---|
| F1 | Finansal Veriler giriş katmanı (3 tab + gider ağacı + temettü + meta + kaynak rozet + audit log + versiyonlama + global currency toggle) | — |
| F2 | Özet + 8-kategori scorecard + fair value gauge + cap table donut | F1 |
| F3 | Finansallar (waterfall/Sankey + çeyreklik trend + detaylı tablolar + tooltip) | F1 |
| F4 | Değerleme + AI adil değer + senaryo + duyarlılık matrisi + revizyon | F1, F3 |
| F5 | Peers / Rakip Analizi (SADECE USD, heatmap) | F4 |
| F6 | Rasyo Analizi (tarihsel çizgiler) | F1 |
| C1 | Treasury / Nakit Akışı (Finekra köprüsü) | F1 |
