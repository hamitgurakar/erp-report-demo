# Muhiku ERP — Müşteri Destek Raporlama Suite Brief (docs/support-suite-brief.md)

**Sürüm:** v1.0 (Verimor + Crisp birleşik). Bu doküman tüm Destek prompt'larının (P1–P7) referansıdır; spec prompt'larda tekrar edilmez.
**Bağlam:** Muhiku ERP raporlama demo — React 19 + TS + Vite + Recharts + react-gauge-component, base `/erp/`, TR i18n, mock data, state-tabanlı nav. B2B kurumsal hediye, ~2,5M ₺/ay. Departman: **Destek** (🎧). Finance suite'in shared component'leri (KPICard, KPIBand, ChartCard, AIAlertPanel, ReportPageLayout) birebir yeniden kullanılır.
**Kaynaklar:** Ses = Verimor Bulut Santral (CDR + kuyruk/dahili/saatlik istatistik). Dijital = Crisp (Overview/Chart/Operators/Rating/Channels/SLAs/Segments/Heatmap/Map/Articles). Tüm kaynakların API'si mevcut; türev metrikler başka kaynaklarla beslenir → tasarım kaynak kısıtına takılmaz.

---

## 0. Tasarım İlkeleri
- Omnichannel tek model: ses (Verimor) + dijital (Crisp) → tek `SupportInteraction`. Kanal-atlayan tek müşteri = tek etkileşim (çift-sayım yok).
- Progressive disclosure: L1 (özet, Müdür) → 6 L2 (detay). Her L1 KPI/grafik → ilgili L2'ye drill-down.
- Hız metrikleri kanal başına (FRT/ASA/AHT/kaçan); deneyim metrikleri hem genel hem kanal-kırılımlı (CSAT/FCR).
- Her KPI'da hedef + MoM + renk durumu. Ham sayı bağlamsız gösterilmez.
- Cognitive load: L1'de ~6 KPI + 5 grafik + AI panel. TR etiketler, EN teknik terim + "i" tooltip (React Portal pattern).

---

## 1. Birleşik Veri Modeli (mock)

```typescript
export type Channel = 'phone' | 'chat' | 'email' | 'whatsapp' | 'messenger' | 'instagram';
export type Direction = 'inbound' | 'outbound';
export type Result = 'agent_answered' | 'ivr_answered' | 'abandoned' | 'voicemail'
                   | 'resolved' | 'bot_contained';
export type Reason = 'WISMO' | 'Teslimat' | 'Fatura/İrsaliye' | 'Ürün Kalite/Hasar'
                   | 'Kişiselleştirme/Baskı' | 'İade/Değişim' | 'Toplu/Kurumsal Talep' | 'Diğer';

export interface SupportInteraction {
  id: string;
  channel: Channel;
  direction: Direction;
  customerRef: string;            // norm. telefon / crisp session
  customerName?: string;          // JENERİK mock (gerçek isim YOK)
  segment: 'Kurumsal' | 'Bireysel';
  agentId: string | null;         // IVR/bot ise null
  agentName?: string;
  queue: string;                  // 'Müşteri Destek'
  startAt: string;                // ISO
  firstResponseAt?: string;
  resolvedAt?: string;
  endAt: string;
  waitSec: number;                // kuyruk beklemesi
  talkSec: number;                // ses: konuşma (IVR+kuyruk HARİÇ) / dijital: aktif işlem
  frtSec?: number;                // dijital ilk yanıt
  resolutionSec?: number;         // ilk mesaj→çözüm
  handleSec: number;              // TÜRETİLMİŞ AHT = waitSec + talkSec (+acw)
  result: Result;
  abandoned: boolean;
  recovered: boolean;             // kaçan sonrası dönülen (B2B recovery)
  reopened: boolean;
  botContained?: boolean;
  hasRecording?: boolean;
  reason: Reason;
  csat?: number;                  // 1–5
  csatComment?: string;
  city?: string;                  // TR il (map için)
  linkedOrderId?: string;         // L2.6 cross-module
}
```

**Verimor→model eşlemesi (ses):** Kayıt No→id; Yön→direction; Arayan/Aranan→customerRef; parantez `(1000)`→agentId; Kuyruk 200→queue; Süre→endAt-startAt; Konuşma Süresi→talkSec; Kaçan mı→abandoned; Dönülen→recovered; Ses Kaydı→hasRecording.
**Crisp→model eşlemesi (dijital):** conversation→id; channel; operator→agentId; first response→frtSec; resolution→resolutionSec; rating→csat; rating comment→csatComment; segment/tag→reason/segment; country→city.

**Ses tuzakları (L1'de yanlış KPI'ı önle):**
1. `talkSec` ≠ AHT (IVR+kuyruk hariç) → `handleSec = waitSec+talkSec`.
2. "Cevaplandı + Kaçan=Evet" = IVR-answered, agent değil. **Cevaplanan = agent_answered** (talkSec>0, abandoned=false).
3. SL hedefi **30 sn** (Verimor config). Mevcut ~%62,5 → hedef altı.
4. Bekletme yalnızca cevaplananlarda → dipnot.
5. **Dönülen (recovered)** kaçan ile yan yana gösterilir (B2B kurtarma).

---

## 2. Mock Veri Ölçeği (B2B hediye, TR)
- Hacim: ~2.500–3.500 etkileşim/ay. Kanal mix: whatsapp %30, phone %25, chat %25, email %15, messenger/instagram %5.
- Yön: %88 inbound. Segment: %70 Kurumsal / %30 Bireysel. Şehir: ağırlık İstanbul/Ankara/İzmir/Bursa (TR).
- Neden dağılımı: WISMO %20 · Teslimat %15 · Ürün Kalite/Hasar %15 · Fatura/İrsaliye %13 · Kişiselleştirme/Baskı %12 · İade/Değişim %10 · Toplu/Kurumsal %10 · Diğer %5.
- Sezon zirveleri: yılbaşı (Ara–Oca), Sevgililer (Şub), bayramlar, kurumsal hediye dönemleri → trend/heatmap'te görünür.
- Referans gerçek değerler (korunacak oranlar): ses SL %62,5 / kaçan %37,5 / ort. konuşma 1:52 / ort. bekletme 0:10; dijital CSAT ~4,1/5; SLA compliance ~83; time-to-resolution ~2 saat; avg response ~6 dk (dijital).
- Ajanlar: 1000 Batuhan, 1001 Ahmet, 1004 Benan, 1005 Çisem (Verimor) + Crisp operatörleri (jenerik). Rozet: **Top performer / Dikkat gerekli**.

---

## 3. Eşikler / Renk-Kodlama (kaynaklı)
| Metrik | Yeşil | Sarı | Kırmızı | Not |
|--------|-------|------|---------|-----|
| CSAT (/5) | ≥4,25 | 3,75–4,25 | <3,75 | ~%85 = 4,25 (Klaus 2023) |
| SLA Uyum % (dijital) | ≥90 | 75–90 | <75 | Crisp 83 = sarı |
| Servis Seviyesi % (ses, 30sn) | ≥80 | 60–80 | <60 | Verimor 62,5 = sarı |
| Kaçan % (ses) | ≤10 | 10–25 | >25 | Dönülen ile oku |
| FRT | chat<90sn / email<24h / ses ASA<30sn | — | — | kanal başına |
| Time to Resolution | ≤2h | 2–6h | >6h | Crisp ~2h |
| Reopen % | <10 | 10–20 | >20 | — |
| FCR % | ≥80 | 70–80 | <70 | SQM 2025 dünya std ≥80 |

---

## 4. Sayfa Envanteri (IA)

### L1 — Destek Genel Bakış  *(P1, ilk odak, Müdür)*
**KPIBand (6):**
1. Toplam Etkileşim (birleşik, MoM, sparkline)
2. CSAT (birleşik ağırlıklı, /5, hedef ≥4,25)
3. Ort. İlk Yanıt (FRT, kanal-ağırlıklı)
4. Ort. Çözüm Süresi (dijital resolution + ses AHT)
5. SLA Uyum % (dijital, ≥90)
6. Servis Seviyesi % + Kaçan/Dönülen (ses, 30sn)

**ChartCard (5) + AI panel + Ekip snapshot:**
1. **Etkileşim Trendi** — stacked area, kanal kırılımlı; gelen vs çözülen çizgisi overlay. Event annotation desteği (örn. "AI yönlendirme devreye girdi").
2. **Kanal Kırılımı** — yatay bar (volume) + her kanalın CSAT'ı yan mikro-gösterge (pie DEĞİL).
3. **SL & Kaçan→Dönülen** — SL gauge (react-gauge-component, 30sn eşik bantları) + kaçan→dönülen funnel. [ses]
4. **Yoğunluk Heatmap** — gün(Pzt–Paz) × saat(00–23h, 3'er saat kova), etkileşim yoğunluğu (personel planlama).
5. **Top Nedenler** — yatay bar (WISMO/Teslimat/Ürün/Fatura/Kişiselleştirme/İade/Kurumsal).
6. **AIAlertPanel** — Operasyon→Destek→Satış korelasyonu ("Teslimat kaynaklı temas 7 günde %X↑, Y kurumsal müşteri, Operasyon kargo SL düşüşüyle korele") + anomali/bottleneck (kaçan spike, SL düşüş).
7. **Ekip Snapshot (mini)** — Top performer + Dikkat gerekli 2–3 ajan (→ L2.3).

### L2.1 — Ticket & Konuşma Analizi  *(P3)*
Yeni açılan vs çözülen (Crisp "new requests" bar+line), backlog, reopen %, konuşma hacmi trend, segment (Kurumsal/Bireysel) kırılımı, **Talep Coğrafyası** (TR il bazlı — dünya haritası DEĞİL). **Uygulama:** inline SVG Türkiye il haritası (81 il path, yoğunluğa göre fill/choropleth, hover'da il + etkileşim sayısı Portal tooltip) — yeni bağımlılık yok, mevcut inline SVG ikon desenine uyumlu. Yanında "Top 10 İl" yatay bar destekleyici.

### L2.2 — SLA & Yanıt Performansı  *(P4)*
FRT & resolution dağılımı (histogram), **CSAT + SLA dual-area + bottleneck detection** (kırmızı bant anotasyonu, Crisp deseni), SLA uyum trend, office-hours filtresi, ihlal drill-down tablosu. Event annotation ("AI Routing").

### L2.3 — Ekip & Temsilci  *(P5)*
Operator leaderboard: ajan, konuşma/çağrı adedi, ort. yanıt, CSAT, **Top performer/Dikkat gerekli rozeti** (Crisp deseni). Satisfaction per operator bar. Ses agent tablosu (Verimor: cevaplanan/kaçan/başarılı%/konuşma). Workload dengesi + canlı Meşguliyet (Çevrimdışı/Müsait/Çağrıda).

### L2.4 — Kanal & Memnuniyet (Rating)  *(P6)*
Conversation volume by channel + trend% (Crisp), **CSAT by channel** (0–5 yatay bar, ses dahil), rating dağılımı 1–5 (63/11/2/4/14 deseni) + mean, rating yorum akışı (jenerik), kanal trend.

### L2.5 — Çağrı Merkezi (Verimor)  *(P2, %100 ses, bağımsız)*
Üst KPI (5): Toplam Çağrı (gelen/giden) · Cevaplama % · Kaçan %+Dönülen % · SL (30sn) · Ort. Bekletme + AHT.
Grafikler: (1) Saatlik heatmap 00–23 cevaplanan/kaçan; (2) Günlük çağrı+dakika (bar+line); (3) Bekleme kovası histogram 0-10/…/61+ + 30sn çizgi + dipnot; (4) Kaçan→Dönülen funnel; (5) Dahili performans tablosu (Kuyruk+Genel Dahili); (6) Canlı kuyruk paneli (auto-refresh, opsiyonel). Alt: CDR detay tablo (filtrelenebilir, satır→sipariş linki).

### L2.6 — Nedenler & Operasyon Kesişimi + Self-Service  *(P7, en yüksek katma değer)*
Neden kırılımı derin, **WISMO/Teslimat ↔ Operasyon kargo SL korelasyon overlay**, çağrı/ticket→sipariş cross-link, **deflection/self-service**: Articles feedback (helpful/unhelpful, Crisp), bot containment/otomasyon etkisi ("AI - Overall Impact"), KB arama→ticket düşüşü.

---

## 5. Grafik Kütüphanesi Notları
- Recharts: AreaChart (stacked/trend), BarChart (yatay kırılım), ComposedChart (bar+line dual-axis), custom heatmap (grid + renk skalası).
- Gauge: **react-gauge-component** (RadialBarChart DEĞİL) — SL, SLA compliance, CSAT gauge. Eşik bantları Bölüm 3'ten.
- Funnel: Recharts FunnelChart veya custom kademeli bar (Gelen→Cevaplanan→Kaçan→Dönülen→Kayıp).
- Tooltip: React Portal → document.body (z-index/overflow fix, Finance pattern).
- Event annotation: ReferenceLine + custom label ("AI yönlendirme", "Kampanya").
- **TR il haritası (L2.1):** inline SVG Türkiye il haritası (Recharts harita çizmez). 81 il `<path>` + yoğunluğa göre fill skalası + Portal tooltip. Yeni bağımlılık yok; il path verisi standart açık TR-il SVG'sinden alınır. react-simple-maps yalnızca fallback.

---

## 6. Prompt Sırası
- **P1** = Destek modülü scaffolding + birleşik mock data + **L1 Destek Genel Bakış** (bu commit'te "Yakında" rozeti yalnız L1'den kalkar).
- **P2** = L2.5 Çağrı Merkezi (Verimor, bağımsız).
- **P3** = L2.1 Ticket & Konuşma.
- **P4** = L2.2 SLA & Yanıt.
- **P5** = L2.3 Ekip.
- **P6** = L2.4 Kanal & Rating.
- **P7** = L2.6 Nedenler & Operasyon kesişimi + self-service.
Her prompt bu brief'e referans verir; her prompt sonrası commit + /clear + `npm run build`.
