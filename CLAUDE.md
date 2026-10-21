# Muhiku ERP Raporlama Modülü

## Proje Nedir?
Muhiku, mid-market / SME+ segmentine hizmet veren all-in-one SaaS platformudur (ERP + CRM + CMS). Bu proje, ERP'nin raporlama modülünün frontend demo'sudur.
- **Canlı:** https://lab.mhkapp.com/erp (Vite `base: '/erp/'`, rewrite'lar `vercel.json`'da)
- **Deploy:** Vercel — `main`'e push → otomatik prod deploy
- **Portal:** Login ve oturum `muhiku-portal` tarafında; bu repo aynı Supabase projesini kullanır ve oturumu aynı origin üzerinden paylaşır. Kardeş projelere geçiş `ProjectSwitcher` ile.

## Tech Stack
- **React 19 + TypeScript + Vite** (giriş: `src/main.jsx`, `src/App.jsx`; geri kalanı `.tsx`)
- **Recharts** — tüm grafikler
- **react-gauge-component** — gauge'lar (`GaugeCard`)
- **Supabase** (`@supabase/supabase-js`) — auth oturumu + rol + hassas veriler (`src/lib/supabase.ts`, env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, bkz. `.env.example`)
- **Stil:** inline styles + tema objesi (`src/constants/theme.ts`, light/dark)
- **İkonlar:** kendi `Icon` wrapper'ı (`src/components/ui/Icon.tsx`)
- **i18n:** TR/EN (`src/i18n/` — `LanguageContext`, `tr.ts`, `en.ts`; eski `src/constants/i18n.ts` de hâlâ kullanılıyor)
- **Navigasyon: state-tabanlı nav (React Router YOK).**
  - Aktif rapor anahtarı `activeRep` (`<dept>__<index>`, örn. `satis__2`) → `src/hooks/useDashboard.ts`
  - Departman/rapor listesi → `mkDeptReports` (`src/constants/data.ts`), rapor adları → `src/i18n/tr.ts` / `en.ts` (`sidebar.reports`)
  - Anahtar → sayfa eşlemesi → `src/pages/Dashboard.tsx` içindeki render zinciri

## Dosya Yapısı (üst düzey)
```
src/
├── App.jsx / main.jsx        # Giriş; App.jsx Dashboard + (yalnız DEV) DevAuthGate
├── pages/
│   ├── Dashboard.tsx         # Ana layout + activeRep → sayfa render zinciri + admin gate
│   ├── management/           # Yönetim: DcfCalculator, AdminSettings
│   ├── finance/              # Muhasebe/Finans suite (her sayfa kendi klasöründe) + FinancialData, LoansTab
│   ├── procurement/          # Satın Alma sayfaları
│   └── support/              # Destek sayfaları
├── components/
│   ├── finance/              # Finans suite shared component'leri (index.ts'ten import edilir)
│   ├── ui/                   # Genel UI: SectionHeader, ExpandableTable, FilterBar, ChartContainer, AccessGate…
│   ├── kpi/                  # Eski KPICard + PinMenu (Yönetim Özet Rapor / Satış / Kategori)
│   ├── layout/               # Header, Sidebar, Toolbar
│   ├── sections/             # Yönetim Özet Rapor section'ları + category/ (Kategori sayfaları)
│   ├── satis/                # Satış sayfaları
│   ├── yonetim/              # ManagementTargets
│   ├── charts/ chat/ panels/ # Waterfall/HealthScore/AlertsPanel, ChatAssistant, PanelView/DatePicker
│   └── ProjectSwitcher.tsx
├── constants/                # Mock data (*Data.ts), theme, IMPLEMENTED_REPORTS, taxConfig…
├── lib/                      # supabase.ts + finance/ hesap motorları (cashflow, dcf, loan, recurring)
├── auth/                     # RoleContext (rol/admin), DevAuthGate (yalnız DEV)
├── context/ hooks/ i18n/ types/ utils/format.ts
docs/                         # Departman brief'leri (finance, finance-suite, cashflow, PROCUREMENT, support-suite)
supabase/migrations/          # RLS'li tablo migration'ları (Supabase'de elle çalıştırılır)
```
`hamit-erp-report.tsx` (repo kökü) eski tek-dosya prototiptir; build'e dahil değil, dokunma.

## Shared Component'ler
**Finans suite seti — `src/components/finance` (`import { … } from '../../components/finance'`)** — yeni sayfalarda öncelikli:
`ReportPageLayout`, `KPIBand`, `KPICard`, `ChartCard`, `AIAlertPanel`, `StatusBadge`, `SourceBadge`, `ChangePct`, `InfoTip`, `MiniChartPopover`, `Dropdown`, `CurrencyToggle`, `Waterfall`, `GaugeCard`, `TahsilatTrendChart`, `RecurringModal`, `OccurrenceDialog`

**Genel UI — `src/components/ui`:** `SectionHeader`, `ChartContainer`, `ExpandableTable`, `ColumnManager`, `ColumnPresetDropdown`, `FilterBar`, `Spark`, `Icon`, `AccessGate` (`RoleLoading`, `AccessDenied`)

**Diğer:** `kpi/KPICard` + `kpi/PinMenu` (eski KPI kartı), `charts/` (`WaterfallChart`, `HealthScore`, `AlertsPanel`), `chat/ChatAssistant`, `panels/` (`PanelView`, `DatePicker`), `layout/` (`Header`, `Sidebar`, `Toolbar`)

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
- **Yönetim (5, admin-only):** Özet Rapor, Toplam Hedefler, Finansal Veriler, DCF Calculator, Ayarlar (admin e-posta yönetimi)
- **Satış (12):** Yönetici Özeti, Gelir & Karlılık, Pipeline & Deal, Uzman Performans, Müşteri & Segment, Ürün & Kategori, Sezonsal & Zaman, AI Sales Coach, İletişim & Aktivite, Forecasting, Hedefler, Tahsilat
- **Kategori (5):** Kategori Özeti, Performans Analizi, Stok & Envanter, Marka Analizi, ABC / Portföy Analizi
- **Satın Alma (9):** Yönetici Özeti, Tedarikçi, Satın Alma Operasyonu, Uzman Performans, Proje Fiyatlama, Maliyet, Karlılık, Borçluluk, Stok & İkmal
- **Muhasebe (10):** Gelir & Karlılık, Nakit & Likidite, Alacak Yönetimi, Borç Yönetimi, Vergi & Uyum, Borçluluk & Sermaye, Değerleme, Finansal Skorkart, CFO Kokpiti, Nakit Akışı
- **Destek (7):** Destek Genel Bakış, Ticket Analizi, SLA Performansı, Ekip Raporu, Çağrı Merkezi, Kanal Raporu, Nedenler

Henüz yok (Yakında): Yönetim > Finansal Sağlık, Büyüme Analizi; Operasyon (tümü); Pazarlama (tümü).

## Sidebar Yapısı
Tanım: `src/components/layout/Sidebar.tsx` (render), `mkDeptReports` + `IMPLEMENTED_REPORTS` + `isAdminOnlyReport` (`src/constants/data.ts`), rapor adları `src/i18n/tr.ts` / `en.ts`.
```
⭐ FAVORİ RAPORLAR     # favs state'i (useDashboard), yıldızla eklenir
📋 ÖZEL RAPORLAR       # panels state'i (Haftalık Kontrolüm, CFO Görünümü…), PanelView ile açılır
📁 RAPORLAR
  Yönetim      (yalnız admin)
  Satış
  Kategori
  Satın Alma
  Operasyon    (Yakında)
  Muhasebe
  Pazarlama    (Yakında)
  Destek
```
**"Yakında" rozeti kuralı:** Veri/sayfa karşılığı olmayan her link "Yakında" rozetiyle, tıklanamaz ve soluk gösterilir. Bu otomatiktir: `IMPLEMENTED_REPORTS`'ta olmayan her anahtar Yakında'dır. Yeni sayfa bağlanınca anahtarını bu set'e ekle; boş/placeholder sayfaya link açma.

## Veri & Yetki
- **Varsayılan: mock data** (`src/constants/*Data.ts`). Gerçekçi Türkçe bağlam (TL, Türk firmaları).
- **Hassas veri** (ortaklık/pay bilgisi, isim–pay eşleşmesi, gerçek finansal tutarlar) mock, seed, migration veya koda **ASLA hardcode edilmez**; Supabase'den RLS ile okunur. Migration'lar yalnız şema + RLS policy içerir, veri içermez.
- **Admin yetkisi:** `admin_emails` allowlist tablosu + `public.is_admin()` (RLS policy'lerinde) ve `public.is_current_user_admin()` (client RPC, `src/auth/RoleContext.tsx`).
- **Yönetim yalnız admin'e görünür, FAIL-CLOSED:** oturum yok / RPC hata / rol yüklenmedi → admin değil. Menü yalnız `roleLoaded && isAdmin` iken gösterilir; admin-only sayfa için `RoleLoading` / `AccessDenied` (`Dashboard.tsx`).
- **RLS asıl kilittir; client gate sadece UX'tir.** Client tarafı gizlemeye güvenip RLS'siz tablo/veri ekleme.
- **Login:** Prod login akışı portal'dadır — dokunma. Localhost'ta yalnız DEV modda `DevAuthGate` (`import.meta.env.DEV` guard'ı, prod bundle'a girmez) ile dev-login yapılır.

## Geliştirme Kuralları
1. **Önce brief'i oku:** İş bir brief'e referans veriyorsa (veya ilgili departmanın brief'i varsa) önce `docs/` altındaki brief'i oku; spec'i oradan al.
2. **Mevcut component'ları kullan:** Yeni sayfalarda `components/finance` setini (ReportPageLayout, KPIBand, ChartCard, AIAlertPanel…) ve `components/ui`'ı kullan — yeniden yazma.
3. **Aynı tasarım dilini koru:** Teal section bar, mor butonlar, yeşil/kırmızı trend renkleri.
4. **Recharts kullan:** Tüm grafikler Recharts ile (gauge hariç: react-gauge-component). D3 veya Chart.js kullanma.
5. **Mock data:** Gerçekçi Türkçe veriler; hassas veri için "Veri & Yetki" kurallarına uy.
6. **Responsive değil:** Desktop-first, 1440px genişlik optimize (sayfalar sabit kolonlu grid kullanır).
7. **Dosya isimlendirme:** PascalCase, .tsx uzantısı.
8. **Her sayfa tek dosya:** Section'ları ayrı component yapma.
9. **Yeni sayfa bağlama:** rapor adı → `src/i18n/tr.ts` + `en.ts` (`sidebar.reports`); render dalı + başlık (`repTitles`) → `src/pages/Dashboard.tsx`; anahtar → `IMPLEMENTED_REPORTS` (`src/constants/data.ts`).
10. **Kapsam dışına dokunma:** Yalnız istenen dosya/sayfa üzerinde çalış; ilgisiz refactor, format veya "iyileştirme" yapma.
11. **Build temiz:** Her iş sonunda `npm run build` hatasız geçmeli.
12. **Belirsizlikte sor:** Spec, veri kaynağı veya kapsam net değilse varsayım yapmadan sor.
13. **Commit/push'u kullanıcı yapar:** Commit veya push atma (main push = prod deploy).
