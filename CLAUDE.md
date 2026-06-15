# Muhiku ERP Raporlama Modülü

## Proje Nedir?
Muhiku, mid-market / SME+ segmentine hizmet veren all-in-one SaaS platformudur (ERP + CRM + CMS). Bu proje, ERP'nin raporlama modülünün frontend demo'sudur. Vercel'de yayında: https://erp-report-demo.vercel.app/

## Tech Stack
- **Vite + React** (TypeScript ağırlıklı, bazı dosyalar JSX)
- **Recharts** — tüm grafikler
- **React Router** — sayfa navigasyonu
- **Lucide React** — ikonlar
- **CSS Modules veya inline styles** — stil yönetimi
- **Deploy:** GitHub → Vercel (otomatik)

## Dosya Yapısı (33 dosya)
```
src/
├── App.jsx                    # Router + ana layout
├── main.jsx                   # Entry point
├── Dashboard.tsx              # Ana dashboard wrapper
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # MUHIKU mega menü + Ara + TL/$ + refresh + Son 30 gün
│   │   ├── Sidebar.tsx        # Sol tree navigasyon (Favori/Özel/Raporlar)
│   │   └── Toolbar.tsx        # Sayfa başlığı + filtre barı
│   ├── ui/
│   │   ├── KPICard.tsx        # Metrik kartı (sparkline + trend + TL/% toggle)
│   │   ├── PinMenu.tsx        # Panolarıma ekle hover menüsü
│   │   ├── Spark.tsx          # Mini sparkline grafiği
│   │   ├── Icon.tsx           # İkon wrapper
│   │   ├── FilterBar.tsx      # Kategori/Alt Kategori/Ürün/Kanal + Filtre Uygula
│   │   ├── ChartContainer.tsx # Chart wrapper (hover pin + export)
│   │   ├── SectionHeader.tsx  # Teal bar + uppercase başlık + sağa uzanan gri çizgi
│   │   ├── ExpandableTable.tsx# Sıralama + pagination + Excel export
│   │   ├── ColumnManager.tsx  # Tablo kolon yönetimi
│   │   └── ColumnPresetDropdown.tsx # Sütunlar: Varsayılan/Performans
│   ├── charts/
│   │   ├── WaterfallChart.tsx # P&L waterfall
│   │   ├── HealthScore.tsx    # Sağlık skoru gauge
│   │   └── AlertsPanel.tsx    # Uyarı kartları
│   ├── sections/              # Yönetim dashboard section'ları
│   │   ├── GeneralSection.tsx
│   │   ├── RevenueSection.tsx
│   │   ├── StrategicSection.tsx
│   │   ├── DepartmentSection.tsx
│   │   ├── CashFlowSection.tsx
│   │   └── DebtSection.tsx
│   ├── kategori/              # Kategori departmanı sayfaları
│   │   ├── CategoryOverview.tsx
│   │   ├── CategoryPerformance.tsx
│   │   ├── CategoryStock.tsx
│   │   ├── CategoryBrand.tsx
│   │   └── CategoryABC.tsx
│   └── shared/
│       ├── ChatAssistant.tsx  # AI FAB + sağ slide-over panel
│       ├── PanelView.tsx      # Panel görünüm wrapper
│       └── DatePicker.tsx     # Tarih seçici (preset + takvim)
```

## Tasarım Sistemi (Muhiku DNA)

### Renkler
- **Primary:** Indigo #4F46E5 (butonlar, aktif durumlar)
- **Section Accent:** Teal #0D9488 (section header sol bar, badge'ler)
- **Başarı/Pozitif:** Green #16A34A
- **Hata/Negatif:** Red #DC2626
- **Uyarı:** Amber #D97706
- **Arka plan:** White #FFFFFF (light), #F8FAFC (secondary)
- **Metin:** #1E293B (primary), #475569 (secondary), #94A3B8 (tertiary)
- **Border:** #E2E8F0 (normal), #CBD5E1 (hover)

### Layout Kuralları
- Sol sidebar: Collapsible tree navigasyon (expanded ~220px, collapsed ~56px)
- Header: MUHIKU logo + mega menü (Ürün, CMS, Satış, Satınalma, Operasyon, Destek, Marketing, Muhasebe, Raporlar) + sağda Ara, 🇹🇷/$, TL/$ toggle, refresh, ⭐, 🔔, avatar
- İçerik: Scrollable, padding 24px
- Section header: Sol 4px teal bar + uppercase başlık + sağa uzanan gri çizgi
- Global filtreler: Muhiku Total dropdown + $/₺ toggle + refresh + Son 30 gün datepicker

### KPI Kart Standartı
- Üst: Label (12px, secondary) + opsiyonel info tooltip (ⓘ)
- Orta: Büyük değer (22-24px, bold) + trend ok + yüzde (yeşil/kırmızı)
- Alt: Sparkline (thin, pastel, hoverable)
- Sağ üst: Opsiyonel TL/% toggle pill
- Hover: Pin butonu (+ ikonu → Panolarıma Ekle dropdown)

### Chart Card Standartı
- Başlık + opsiyonel sağ üst toggle/filtre
- Hover: Pin butonu + Export menüsü (CSV, XLSX, PNG)
- Border radius: 10px, border: 1px solid #E2E8F0
- Padding: 18px

### Tablo Standartı
- Sağ üst: "Sütunlar: Varsayılan ▾" preset dropdown + "Excel ↓" export butonu
- Sıralama: Kolon başlığına tıkla
- Renk kodlama: Marj >%30 yeşil, %20-30 mavi, <%20 kırmızı
- Trend kolonu: Mini sparkline
- Pagination: Sayfa başına 25 satır

### Sayı Formatı
- Türkçe: Bindelik = NOKTA, Ondalık = VİRGÜL → 1.248,64 ₺
- Dolar: Amerikan formatı → $1,248.64
- Para birimi header'daki $/₺ toggle'a göre değişir

### Filtre Barı Standartı (Sayfa-özel)
- Dropdown'lar yan yana: Kategori, Alt Kategori, Ürün, Kanal (hierarchical cascade)
- Sağda: "Filtre Uygula" mor buton + "Temizle" link
- Chip'ler: Aktif filtreler chip olarak gösterilir

## Tamamlanan Sayfalar

### 1. Yönetim (Özet Rapor) ✅
- Genel Performans (10 KPI kart)
- Satış Geliri ve Karlılık (grouped bar + donut + area chart)
- P&L Waterfall
- Stratejik Sağlık & Uyarılar (health score gauge + alert kartları)
- Departman Özeti (6 kart sparkline'lı)
- Nakit Akış Özeti (grouped bar + tahsilat line chart)
- Borçluluk (KPI'lar + borç dağılımı + nakit detay)

### 2. Yönetim > Finansal Sağlık ✅
### 3. Yönetim > Büyüme Analizi ✅

### 4. Kategori > Kategori Özeti ✅
- 12 KPI kart + Kategori Bazlı Ciro (horizontal bar) + Aylık Ciro Trendi
- Stok Sağlığı Dağılımı (donut) + ABC Özet + Kategori Uyarıları
- Ürün Bazlı Net Marj % (stacked bar) + Stok Sağlığı Segmentleri
- Stok Değeri & Olaylar + Verimlilik: Devir & Elde Tutma
- Fiyatlama & İskonto Bütünlüğü + Kanal Performans Kırılımı
- Satış Hız Endeksi + Kategori Karar Matrisi (bubble chart)
- Top/Bottom 5 Performans & Kritik Riskler

### 5. Kategori > Performans Analizi ✅
- Filtre barı (Kategori > Alt Kategori > Ürün > Kanal)
- Performans tablosu (siralama + renk kodlama + sparkline trend)
- Kategori Karlılık Matrisi (bubble chart)
- Ciro & Marj Trendi (combo chart) + Ciro Payı Değişim Tablosu
- Aylık Ciro Trendi (multi-line, kategori bazlı)

### 6. Kategori > Stok & Envanter ✅
- Stok Sağlığı Dağılımı + Stok Devir Trendi
- Stok Yaşlanma Analizi (stacked bar) + Stok vs Satış Hızı (scatter)
- Kritik Stok Tablosu (durum badge + aksiyon butonları)
- Stok Verimsizlik Analizi + Verimsiz Ürünler Tablosu

### 7. Kategori > Marka Analizi ✅
- Top 20 Marka (horizontal bar) + Marka Büyüme Matrisi (bubble)
- Marka Performans Tablosu (sıralama + Excel export)

### 8. Kategori > ABC / Portföy Analizi ✅
- ABC Pareto chart + ABC Geçiş Matrisi (3x3 grid, renkli)
- Ürün Hayat Döngüsü (bubble: Yeni → Büyüyen → Olgun → Düşüşte)
- Aksiyon Önerileri Tablosu

## Sidebar Navigasyon Yapısı
```
⭐ FAVORİ RAPORLAR
  📊 Özet Rapor (yıldız ile favorilenen)
  📊 Pipeline Analizi

📋 ÖZEL RAPORLAR
  📊 Haftalık Kontrolüm (düzenlenebilir)
  📊 CFO Görünümü

📁 RAPORLAR
  📂 Yönetim
    ├── Özet Rapor ⭐
    ├── Finansal Sağlık
    └── Büyüme Analizi
  📂 Satış (SIRADAKI — BU DEPARTMANI OLUŞTURACAĞIZ)
    ├── Kategori
    │   ├── Kategori Özeti
    │   ├── Performans Analizi
    │   ├── Stok & Envanter
    │   ├── Marka Analizi
    │   └── ABC / Portföy Analizi
    ├── (Satış Executive Overview — YENİ)
    ├── (Gelir & Karlılık — YENİ)
    ├── (Pipeline & Deal — YENİ)
    ├── ...
  📂 Satın Alma
  📂 Operasyon
  📂 Muhasebe
  📂 Pazarlama
  📂 Müşteri Destek
```

## Geliştirme Kuralları
1. **Mevcut component'ları kullan:** KPICard, SectionHeader, ChartContainer, ExpandableTable, FilterBar, Spark — bunlar zaten var, yeniden yazma.
2. **Aynı tasarım dilini koru:** Teal section bar, mor butonlar, yeşil/kırmızı trend renkleri.
3. **Recharts kullan:** Tüm grafikler Recharts ile. D3 veya Chart.js kullanma.
4. **Mock data:** Gerçekçi Türkçe veriler kullan (firma isimleri, TL para birimi, Türkiye bağlamı).
5. **Responsive değil:** Desktop-first, 1440px genişlik optimize.
6. **Dosya isimlendirme:** PascalCase, .tsx uzantısı.
7. **Her sayfa tek dosya:** Section'ları ayrı component yapma (Kategori'de yaptığımız gibi).
8. **Sidebar'a otomatik ekle:** Yeni sayfa oluşturulunca Sidebar.tsx'e ve App.jsx router'a ekle.