import type { Alert } from '../types';
import type { LangStrings } from '../types';

// ─── Overview: Treemap / Top10 data ───────────────────────────────────────────
export const catRevData = [
  { name: 'Elektronik', value: 520, margin: 38 },
  { name: 'Kozmetik', value: 310, margin: 44 },
  { name: 'Ev & Yaşam', value: 280, margin: 35 },
  { name: 'Gıda', value: 245, margin: 12 },
  { name: 'Tekstil', value: 198, margin: 22 },
  { name: 'Spor', value: 142, margin: 30 },
  { name: 'Kırtasiye', value: 88, margin: 28 },
  { name: 'Oyuncak', value: 76, margin: 32 },
  { name: 'Bahçe', value: 65, margin: 29 },
  { name: 'Diğer', value: 96, margin: 18 },
];

// ─── Monthly stacked area trend ───────────────────────────────────────────────
export const catMonthlyTrend = [
  { month: 'Mar', elektronik: 62, kozmetik: 28, evYasam: 24, gida: 20, tekstil: 18, diger: 15 },
  { month: 'Nis', elektronik: 65, kozmetik: 30, evYasam: 25, gida: 21, tekstil: 17, diger: 14 },
  { month: 'May', elektronik: 70, kozmetik: 32, evYasam: 28, gida: 22, tekstil: 16, diger: 15 },
  { month: 'Haz', elektronik: 74, kozmetik: 34, evYasam: 29, gida: 23, tekstil: 15, diger: 16 },
  { month: 'Tem', elektronik: 78, kozmetik: 36, evYasam: 30, gida: 24, tekstil: 14, diger: 14 },
  { month: 'Ağu', elektronik: 80, kozmetik: 38, evYasam: 32, gida: 25, tekstil: 14, diger: 15 },
  { month: 'Eyl', elektronik: 84, kozmetik: 40, evYasam: 34, gida: 24, tekstil: 13, diger: 16 },
  { month: 'Eki', elektronik: 88, kozmetik: 42, evYasam: 35, gida: 23, tekstil: 13, diger: 16 },
  { month: 'Kas', elektronik: 92, kozmetik: 44, evYasam: 36, gida: 22, tekstil: 12, diger: 16 },
  { month: 'Ara', elektronik: 96, kozmetik: 46, evYasam: 38, gida: 24, tekstil: 12, diger: 16 },
  { month: 'Oca', elektronik: 94, kozmetik: 48, evYasam: 36, gida: 23, tekstil: 14, diger: 17 },
  { month: 'Şub', elektronik: 98, kozmetik: 50, evYasam: 38, gida: 24, tekstil: 15, diger: 17 },
];

// ─── Stock health donut ───────────────────────────────────────────────────────
export const stockHealthData = [
  { name: 'saglikli', value: 62, color: '#059669' },
  { name: 'fazla', value: 18, color: '#D97706' },
  { name: 'kritik', value: 12, color: '#DC2626' },
  { name: 'olu', value: 8, color: '#94A3B8' },
];

// ─── Category alerts ──────────────────────────────────────────────────────────
export const mkCatAlerts = (l: LangStrings): Alert[] => [
  { type: 'warning', title: l.katAlert1, desc: l.katAlert1D, action: l.katAlert1A },
  { type: 'danger', title: l.katAlert2, desc: l.katAlert2D, action: l.katAlert2A },
  { type: 'warning', title: l.katAlert3, desc: l.katAlert3D, action: l.katAlert3A },
  { type: 'info', title: l.katAlert4, desc: l.katAlert4D, action: l.katAlert4A },
];

// ─── Performance: scatter (profitability matrix) ──────────────────────────────
export const catScatterData = [
  { name: 'Elektronik', ciro: 520, brutMarj: 38, skuSayisi: 280 },
  { name: 'Kozmetik', ciro: 310, brutMarj: 44, skuSayisi: 180 },
  { name: 'Ev & Yaşam', ciro: 280, brutMarj: 35, skuSayisi: 220 },
  { name: 'Gıda', ciro: 245, brutMarj: 12, skuSayisi: 95 },
  { name: 'Tekstil', ciro: 198, brutMarj: 22, skuSayisi: 160 },
  { name: 'Spor', ciro: 142, brutMarj: 30, skuSayisi: 110 },
  { name: 'Kırtasiye', ciro: 88, brutMarj: 28, skuSayisi: 70 },
  { name: 'Oyuncak', ciro: 76, brutMarj: 32, skuSayisi: 55 },
  { name: 'Bahçe', ciro: 65, brutMarj: 29, skuSayisi: 77 },
];

// ─── Performance: revenue & margin trend (dual axis) ─────────────────────────
export const catRevMarjTrend = [
  { month: 'Mar', ciro: 148, marj: 31.2 },
  { month: 'Nis', marj: 30.8, ciro: 155 },
  { month: 'May', ciro: 163, marj: 32.1 },
  { month: 'Haz', ciro: 170, marj: 33.0 },
  { month: 'Tem', ciro: 175, marj: 32.4 },
  { month: 'Ağu', ciro: 182, marj: 32.4 },
];

// ─── Performance: YoY comparison ─────────────────────────────────────────────
export const catYoyData = [
  { month: 'Mar', buYil: 148, gecenYil: 122 },
  { month: 'Nis', buYil: 155, gecenYil: 130 },
  { month: 'May', buYil: 163, gecenYil: 135 },
  { month: 'Haz', buYil: 170, gecenYil: 140 },
  { month: 'Tem', buYil: 175, gecenYil: 148 },
  { month: 'Ağu', buYil: 182, gecenYil: 152 },
];

// ─── Performance: 100% stacked share ─────────────────────────────────────────
export const catShareData = [
  { month: 'Mar', elektronik: 42, kozmetik: 19, evYasam: 16, gida: 14, tekstil: 9 },
  { month: 'Nis', elektronik: 43, kozmetik: 20, evYasam: 16, gida: 13, tekstil: 8 },
  { month: 'May', elektronik: 43, kozmetik: 20, evYasam: 17, gida: 13, tekstil: 7 },
  { month: 'Haz', elektronik: 44, kozmetik: 20, evYasam: 17, gida: 13, tekstil: 6 },
  { month: 'Tem', elektronik: 45, kozmetik: 21, evYasam: 17, gida: 13, tekstil: 4 },
  { month: 'Ağu', elektronik: 45, kozmetik: 21, evYasam: 18, gida: 13, tekstil: 3 },
];

// ─── Performance: expandable table rows ──────────────────────────────────────
export interface PerfRow {
  id: string;
  name: string;
  level: number;
  satisAdedi: number;
  ciroNet: number;
  ciroPay: number;
  cogs: number;
  cogsOrani: number;
  brutKar: number;
  brutMarj: number;
  netKar: number;
  netMarj: number;
  ortFiyat: number;
  iadeOrani: number;
  stokDevir: number;
  stokAdedi: number;
  stokDegeri: number;
  sparkTrend: 'up' | 'down' | 'flat';
  children?: PerfRow[];
}

export const perfTableData: PerfRow[] = [
  {
    id: 'elektronik', name: 'Elektronik', level: 0,
    satisAdedi: 4820, ciroNet: 520, ciroPay: 28.6, cogs: 322, cogsOrani: 61.9, brutKar: 198, brutMarj: 38.1,
    netKar: 114, netMarj: 21.9, ortFiyat: 1078, iadeOrani: 4.2, stokDevir: 5.8,
    stokAdedi: 3240, stokDegeri: 780, sparkTrend: 'up',
    children: [
      {
        id: 'laptop', name: 'Laptop', level: 1,
        satisAdedi: 1240, ciroNet: 210, ciroPay: 11.5, cogs: 128, cogsOrani: 61.0, brutKar: 82, brutMarj: 39.0,
        netKar: 48, netMarj: 22.9, ortFiyat: 1694, iadeOrani: 3.1, stokDevir: 6.2,
        stokAdedi: 820, stokDegeri: 312, sparkTrend: 'up',
        children: [
          { id: 'laptop-gaming', name: 'Gaming Laptop', level: 2, satisAdedi: 540, ciroNet: 95, ciroPay: 5.2, cogs: 57, cogsOrani: 60.0, brutKar: 38, brutMarj: 40.0, netKar: 22, netMarj: 23.2, ortFiyat: 1759, iadeOrani: 2.8, stokDevir: 7.1, stokAdedi: 340, stokDegeri: 142, sparkTrend: 'up' },
          { id: 'laptop-biz', name: 'İş Laptopu', level: 2, satisAdedi: 700, ciroNet: 115, ciroPay: 6.3, cogs: 71, cogsOrani: 61.7, brutKar: 44, brutMarj: 38.3, netKar: 26, netMarj: 22.6, ortFiyat: 1643, iadeOrani: 3.3, stokDevir: 5.5, stokAdedi: 480, stokDegeri: 170, sparkTrend: 'up' },
        ],
      },
      {
        id: 'telefon', name: 'Telefon & Aksesuar', level: 1,
        satisAdedi: 2180, ciroNet: 180, ciroPay: 9.9, cogs: 112, cogsOrani: 62.2, brutKar: 68, brutMarj: 37.8,
        netKar: 38, netMarj: 21.1, ortFiyat: 826, iadeOrani: 5.1, stokDevir: 5.4,
        stokAdedi: 1540, stokDegeri: 280, sparkTrend: 'up',
      },
      {
        id: 'tv-ev', name: 'TV & Ev Elektroniği', level: 1,
        satisAdedi: 1400, ciroNet: 130, ciroPay: 7.1, cogs: 82, cogsOrani: 63.1, brutKar: 48, brutMarj: 36.9,
        netKar: 28, netMarj: 21.5, ortFiyat: 929, iadeOrani: 4.8, stokDevir: 5.1,
        stokAdedi: 880, stokDegeri: 188, sparkTrend: 'flat',
      },
    ],
  },
  {
    id: 'kozmetik', name: 'Kozmetik', level: 0,
    satisAdedi: 6240, ciroNet: 310, ciroPay: 17.0, cogs: 174, cogsOrani: 56.1, brutKar: 136, brutMarj: 43.9,
    netKar: 78, netMarj: 25.2, ortFiyat: 497, iadeOrani: 2.8, stokDevir: 7.2,
    stokAdedi: 4100, stokDegeri: 210, sparkTrend: 'up',
    children: [
      {
        id: 'cilt', name: 'Cilt Bakımı', level: 1,
        satisAdedi: 2800, ciroNet: 140, ciroPay: 7.7, cogs: 78, cogsOrani: 55.7, brutKar: 62, brutMarj: 44.3,
        netKar: 36, netMarj: 25.7, ortFiyat: 500, iadeOrani: 2.2, stokDevir: 7.8,
        stokAdedi: 1840, stokDegeri: 92, sparkTrend: 'up',
      },
      {
        id: 'makyaj', name: 'Makyaj', level: 1,
        satisAdedi: 3440, ciroNet: 170, ciroPay: 9.3, cogs: 96, cogsOrani: 56.5, brutKar: 74, brutMarj: 43.5,
        netKar: 42, netMarj: 24.7, ortFiyat: 494, iadeOrani: 3.2, stokDevir: 6.8,
        stokAdedi: 2260, stokDegeri: 118, sparkTrend: 'up',
      },
    ],
  },
  {
    id: 'evyasam', name: 'Ev & Yaşam', level: 0,
    satisAdedi: 5120, ciroNet: 280, ciroPay: 15.4, cogs: 182, cogsOrani: 65.0, brutKar: 98, brutMarj: 35.0,
    netKar: 50, netMarj: 17.9, ortFiyat: 547, iadeOrani: 3.5, stokDevir: 4.9,
    stokAdedi: 3480, stokDegeri: 310, sparkTrend: 'flat',
  },
  {
    id: 'gida', name: 'Gıda', level: 0,
    satisAdedi: 8900, ciroNet: 245, ciroPay: 13.5, cogs: 216, cogsOrani: 88.2, brutKar: 29, brutMarj: 11.8,
    netKar: 12, netMarj: 4.9, ortFiyat: 275, iadeOrani: 1.1, stokDevir: 12.4,
    stokAdedi: 5600, stokDegeri: 98, sparkTrend: 'down',
  },
  {
    id: 'tekstil', name: 'Tekstil', level: 0,
    satisAdedi: 3840, ciroNet: 198, ciroPay: 10.9, cogs: 154, cogsOrani: 77.8, brutKar: 44, brutMarj: 22.2,
    netKar: 18, netMarj: 9.1, ortFiyat: 516, iadeOrani: 7.8, stokDevir: 3.1,
    stokAdedi: 3680, stokDegeri: 368, sparkTrend: 'down',
  },
];

// ─── Stock: aging analysis (10 categories) ────────────────────────────────────
export const stockAgingData = [
  { name: 'Elektronik', d0_30: 45, d31_60: 28, d61_90: 18, d90plus: 9 },
  { name: 'Kozmetik', d0_30: 60, d31_60: 22, d61_90: 12, d90plus: 6 },
  { name: 'Ev & Yaşam', d0_30: 42, d31_60: 30, d61_90: 20, d90plus: 8 },
  { name: 'Gıda', d0_30: 72, d31_60: 18, d61_90: 7, d90plus: 3 },
  { name: 'Tekstil', d0_30: 30, d31_60: 28, d61_90: 25, d90plus: 17 },
  { name: 'Spor', d0_30: 52, d31_60: 24, d61_90: 16, d90plus: 8 },
  { name: 'Kırtasiye', d0_30: 55, d31_60: 25, d61_90: 14, d90plus: 6 },
  { name: 'Aksesuar', d0_30: 38, d31_60: 32, d61_90: 22, d90plus: 8 },
  { name: 'Mutfak', d0_30: 48, d31_60: 28, d61_90: 17, d90plus: 7 },
  { name: 'Sağlık & Bakım', d0_30: 65, d31_60: 20, d61_90: 10, d90plus: 5 },
];

// ─── Stock: turnover trend ────────────────────────────────────────────────────
export const stockTurnoverTrend = [
  { month: 'Mar', devir: 4.2 },
  { month: 'Nis', devir: 4.4 },
  { month: 'May', devir: 4.5 },
  { month: 'Haz', devir: 4.6 },
  { month: 'Tem', devir: 4.7 },
  { month: 'Ağu', devir: 4.8 },
];

// ─── Stock: scatter (stock value vs sales velocity) with color coding ─────────
// color: 'green' = high velocity + low stock, 'red' = low velocity + high stock, 'amber' = mid
export const stockVsSalesData = [
  { name: 'Laptop', stokDeg: 312, satisHizi: 42, color: 'amber' },
  { name: 'Telefon', stokDeg: 280, satisHizi: 72, color: 'green' },
  { name: 'Cilt Bakımı', stokDeg: 92, satisHizi: 93, color: 'green' },
  { name: 'Makyaj', stokDeg: 118, satisHizi: 88, color: 'green' },
  { name: 'Tekstil A', stokDeg: 180, satisHizi: 22, color: 'red' },
  { name: 'Tekstil B', stokDeg: 140, satisHizi: 18, color: 'red' },
  { name: 'Ev Dekor', stokDeg: 220, satisHizi: 35, color: 'amber' },
  { name: 'Gıda Konserve', stokDeg: 45, satisHizi: 110, color: 'green' },
  { name: 'Spor Ekip.', stokDeg: 160, satisHizi: 45, color: 'amber' },
  { name: 'Oyuncak', stokDeg: 85, satisHizi: 28, color: 'red' },
];

// ─── Stock: critical stock table ──────────────────────────────────────────────
export interface CriticalStockRow {
  id: string;
  urun: string;
  kategori: string;
  mevcutStok: number;
  gunlukSatisHizi: number;
  tahminTukenme: number;
  tedarikSuresi: number;
  durum: 'acil' | 'uyari' | 'izle';
}

export const criticalStockData: CriticalStockRow[] = [
  { id: 'cs-1', urun: 'Gaming Laptop X500', kategori: 'Elektronik', mevcutStok: 8, gunlukSatisHizi: 3.2, tahminTukenme: 2, tedarikSuresi: 14, durum: 'acil' },
  { id: 'cs-2', urun: 'Cilt Serumu A+', kategori: 'Kozmetik', mevcutStok: 24, gunlukSatisHizi: 4.8, tahminTukenme: 5, tedarikSuresi: 7, durum: 'acil' },
  { id: 'cs-3', urun: 'Akıllı Saat Pro', kategori: 'Elektronik', mevcutStok: 15, gunlukSatisHizi: 2.1, tahminTukenme: 7, tedarikSuresi: 10, durum: 'uyari' },
  { id: 'cs-4', urun: 'Yoga Matı Premium', kategori: 'Spor', mevcutStok: 32, gunlukSatisHizi: 4.0, tahminTukenme: 8, tedarikSuresi: 5, durum: 'uyari' },
  { id: 'cs-5', urun: 'Kahve Makinesi X', kategori: 'Ev & Yaşam', mevcutStok: 18, gunlukSatisHizi: 1.8, tahminTukenme: 10, tedarikSuresi: 8, durum: 'uyari' },
  { id: 'cs-6', urun: 'Koşu Ayakkabısı M', kategori: 'Spor', mevcutStok: 45, gunlukSatisHizi: 3.5, tahminTukenme: 13, tedarikSuresi: 10, durum: 'izle' },
  { id: 'cs-7', urun: 'Masaüstü Kulaklık', kategori: 'Elektronik', mevcutStok: 28, gunlukSatisHizi: 1.9, tahminTukenme: 14, tedarikSuresi: 12, durum: 'izle' },
];

// ─── Brand: top 20 horizontal bar ────────────────────────────────────────────
export const brandTop20Data = [
  { name: 'Samsung', ciro: 185, marj: 34.2 },
  { name: 'Apple', ciro: 162, marj: 38.1 },
  { name: 'Maybelline', ciro: 94, marj: 46.8 },
  { name: 'L\'Oreal', ciro: 88, marj: 44.2 },
  { name: 'IKEA', ciro: 76, marj: 32.5 },
  { name: 'Nike', ciro: 68, marj: 29.8 },
  { name: 'Xiaomi', ciro: 62, marj: 28.4 },
  { name: 'Dyson', ciro: 58, marj: 36.7 },
  { name: 'Tefal', ciro: 52, marj: 30.1 },
  { name: 'Adidas', ciro: 48, marj: 27.9 },
  { name: 'Lenovo', ciro: 44, marj: 31.5 },
  { name: 'HP', ciro: 40, marj: 29.8 },
  { name: 'Garnier', ciro: 38, marj: 42.3 },
  { name: 'Sony', ciro: 36, marj: 33.4 },
  { name: 'Bosch', ciro: 34, marj: 28.6 },
  { name: 'Lego', ciro: 32, marj: 38.9 },
  { name: 'Puma', ciro: 30, marj: 25.4 },
  { name: 'Philips', ciro: 28, marj: 27.1 },
  { name: 'Under Armour', ciro: 24, marj: 23.8 },
  { name: 'Oral-B', ciro: 22, marj: 35.2 },
];

// ─── Brand: growth matrix scatter ────────────────────────────────────────────
export const brandGrowthData = [
  { name: 'Samsung', buyume: 12, marjDeg: 1.2 },
  { name: 'Apple', buyume: 18, marjDeg: 0.8 },
  { name: 'Maybelline', buyume: 24, marjDeg: 2.1 },
  { name: 'L\'Oreal', buyume: 22, marjDeg: 1.5 },
  { name: 'IKEA', buyume: 6, marjDeg: -0.4 },
  { name: 'Nike', buyume: 8, marjDeg: -0.8 },
  { name: 'Xiaomi', buyume: -2, marjDeg: -1.2 },
  { name: 'Dyson', buyume: 15, marjDeg: 1.8 },
  { name: 'Tefal', buyume: 4, marjDeg: -0.2 },
  { name: 'Adidas', buyume: -8, marjDeg: -2.1 },
  { name: 'Lenovo', buyume: 3, marjDeg: 0.4 },
  { name: 'HP', buyume: -4, marjDeg: -0.6 },
  { name: 'Garnier', buyume: 19, marjDeg: 1.9 },
  { name: 'Sony', buyume: 2, marjDeg: -0.1 },
];

// ─── Brand: performance table ─────────────────────────────────────────────────
export interface BrandRow {
  id: string;
  marka: string;
  ciro: number;
  pay: number;
  marj: number;
  sku: number;
  satisAdedi: number;
  stok: number;
  iade: number;
  buyume: number;
}

export const brandTableData: BrandRow[] = brandTop20Data.slice(0, 15).map((b, i) => ({
  id: `brand-${i}`,
  marka: b.name,
  ciro: b.ciro,
  pay: Math.round((b.ciro / 1820) * 1000) / 10,
  marj: b.marj,
  sku: Math.floor(Math.random() * 80) + 20,
  satisAdedi: Math.floor(b.ciro * 12 + Math.random() * 500),
  stok: Math.floor(b.ciro * 2.4 + Math.random() * 100),
  iade: Math.round((2 + Math.random() * 5) * 10) / 10,
  buyume: Math.round((-10 + Math.random() * 30) * 10) / 10,
}));

// ─── ABC: pareto data ─────────────────────────────────────────────────────────
export const abcParetoData = (() => {
  const items = [
    { name: 'Gaming Laptop', ciro: 95 },
    { name: 'iPhone 15 Pro', ciro: 88 },
    { name: 'Samsung Galaxy', ciro: 76 },
    { name: 'Cilt Serumu A+', ciro: 68 },
    { name: 'Akıllı TV 55"', ciro: 62 },
    { name: 'MacBook Air', ciro: 58 },
    { name: 'Makyaj Seti', ciro: 52 },
    { name: 'Kahve Makinesi', ciro: 46 },
    { name: 'Yoga Matı Pro', ciro: 42 },
    { name: 'Kulaklık Elite', ciro: 38 },
    ...Array.from({ length: 132 }, (_, i) => ({ name: `SKU-${i + 11}`, ciro: Math.max(1, 35 - i * 0.25) })),
  ];
  let cumulative = 0;
  const total = items.reduce((s, x) => s + x.ciro, 0);
  return items.slice(0, 50).map((item) => {
    cumulative += item.ciro;
    return { ...item, kumulatif: Math.round((cumulative / total) * 1000) / 10 };
  });
})();

// ─── ABC: transition matrix ───────────────────────────────────────────────────
export const abcTransitionData = [
  { onceki: 'A', mevcut: 'A', value: 134 },
  { onceki: 'A', mevcut: 'B', value: 8 },
  { onceki: 'A', mevcut: 'C', value: 0 },
  { onceki: 'B', mevcut: 'A', value: 12 },
  { onceki: 'B', mevcut: 'B', value: 298 },
  { onceki: 'B', mevcut: 'C', value: 8 },
  { onceki: 'C', mevcut: 'A', value: 0 },
  { onceki: 'C', mevcut: 'B', value: 14 },
  { onceki: 'C', mevcut: 'C', value: 773 },
];

// ─── ABC: product lifecycle scatter ──────────────────────────────────────────
export const lifecycleData = [
  { name: 'Gaming Laptop', yas: 45, satisHizi: 92, stokDeg: 95, segment: 'yeni' },
  { name: 'Cilt Serumu A+', yas: 180, satisHizi: 88, stokDeg: 68, segment: 'buyuyen' },
  { name: 'Samsung Galaxy', yas: 360, satisHizi: 76, stokDeg: 76, segment: 'olgun' },
  { name: 'iPhone 14', yas: 540, satisHizi: 55, stokDeg: 58, segment: 'olgun' },
  { name: 'Akıllı TV 55"', yas: 280, satisHizi: 64, stokDeg: 62, segment: 'olgun' },
  { name: 'Eski Model A', yas: 720, satisHizi: 22, stokDeg: 42, segment: 'dususte' },
  { name: 'Eski Model B', yas: 860, satisHizi: 14, stokDeg: 38, segment: 'dususte' },
  { name: 'Yeni Kozmetik', yas: 30, satisHizi: 78, stokDeg: 52, segment: 'yeni' },
  { name: 'Spor Saat Pro', yas: 120, satisHizi: 68, stokDeg: 46, segment: 'buyuyen' },
  { name: 'Klasik Kulaklık', yas: 480, satisHizi: 58, stokDeg: 38, segment: 'olgun' },
  { name: 'Eski Tekstil', yas: 650, satisHizi: 18, stokDeg: 45, segment: 'dususte' },
  { name: 'Yeni Oyuncak', yas: 60, satisHizi: 48, stokDeg: 28, segment: 'yeni' },
];

// ─── ABC: action table ────────────────────────────────────────────────────────
export type AksiyonType = 'stokArtir' | 'kampanya' | 'bundle' | 'listeden' | 'fiyat';

export interface AbcActionRow {
  id: string;
  urun: string;
  abc: 'A' | 'B' | 'C';
  ciro: number;
  marj: number;
  stokGun: number;
  satisHizi: number;
  sparkTrend: 'up' | 'down' | 'flat';
  aksiyon: AksiyonType;
}

export const abcActionData: AbcActionRow[] = [
  { id: 'abc-1', urun: 'Gaming Laptop X500', abc: 'A', ciro: 95, marj: 40.0, stokGun: 2, satisHizi: 92, sparkTrend: 'up', aksiyon: 'stokArtir' },
  { id: 'abc-2', urun: 'Tekstil Yaz Koleks.', abc: 'B', ciro: 28, marj: 18.5, stokGun: 120, satisHizi: 15, sparkTrend: 'down', aksiyon: 'kampanya' },
  { id: 'abc-3', urun: 'Eski Model Kulaklık', abc: 'C', ciro: 8, marj: 12.0, stokGun: 210, satisHizi: 4, sparkTrend: 'down', aksiyon: 'bundle' },
  { id: 'abc-4', urun: 'Sezon Dışı Kıyafet', abc: 'C', ciro: 3, marj: 8.0, stokGun: 380, satisHizi: 1, sparkTrend: 'down', aksiyon: 'listeden' },
  { id: 'abc-5', urun: 'B2B Laptop Modeli', abc: 'A', ciro: 115, marj: 38.3, stokGun: 45, satisHizi: 68, sparkTrend: 'up', aksiyon: 'stokArtir' },
  { id: 'abc-6', urun: 'Cilt Serumu A+', abc: 'A', ciro: 68, marj: 44.3, stokGun: 5, satisHizi: 88, sparkTrend: 'up', aksiyon: 'stokArtir' },
  { id: 'abc-7', urun: 'Orta Segment Spor', abc: 'B', ciro: 32, marj: 22.4, stokGun: 85, satisHizi: 28, sparkTrend: 'flat', aksiyon: 'fiyat' },
  { id: 'abc-8', urun: 'Kırtasiye Seti X', abc: 'C', ciro: 5, marj: 24.0, stokGun: 160, satisHizi: 8, sparkTrend: 'flat', aksiyon: 'kampanya' },
];

// ─── Overview: product net margin % horizontal bar ───────────────────────────
export const productMarginData = [
  { name: 'USB-C Hub', netMarj: 8.4 },
  { name: 'Standart Monitör', netMarj: 15.2 },
  { name: 'Mech Klavye', netMarj: 28.5 },
  { name: 'Pro Mouse', netMarj: 38.2 },
  { name: 'Premium Laptop', netMarj: 42.1 },
];

// ─── Overview: stock value & events area ─────────────────────────────────────
export const stockValueEventsData = [
  { month: 'Mar', deger: 1420 },
  { month: 'Nis', deger: 1480 },
  { month: 'May', deger: 1510, event: 'Kampanya Başlangıcı' },
  { month: 'Haz', deger: 1780 },
  { month: 'Tem', deger: 1820 },
  { month: 'Ağu', deger: 1760 },
  { month: 'Eyl', deger: 1680 },
  { month: 'Eki', deger: 1750 },
  { month: 'Kas', deger: 1800 },
  { month: 'Ara', deger: 1920, event: 'Yılbaşı Kampanyası' },
  { month: 'Oca', deger: 1850 },
  { month: 'Şub', deger: 1800 },
];

// ─── Overview: sales velocity index (ciro vs units dual line) ─────────────────
export const salesVelocityData = [
  { month: 'Mar', ciro: 148, adet: 28 },
  { month: 'Nis', ciro: 155, adet: 30 },
  { month: 'May', ciro: 163, adet: 31 },
  { month: 'Haz', ciro: 170, adet: 32 },
  { month: 'Tem', ciro: 175, adet: 31 },
  { month: 'Ağu', ciro: 182, adet: 30 },
];

// ─── Overview: pricing & discount integrity ───────────────────────────────────
export const pricingDiscountData = [
  { month: 'Mar', listeFiyat: 180, gerceklesen: 162, iskonto: 10 },
  { month: 'Nis', listeFiyat: 182, gerceklesen: 160, iskonto: 12 },
  { month: 'May', listeFiyat: 185, gerceklesen: 163, iskonto: 11.9 },
  { month: 'Haz', listeFiyat: 188, gerceklesen: 165, iskonto: 12.2 },
  { month: 'Tem', listeFiyat: 190, gerceklesen: 168, iskonto: 11.6 },
  { month: 'Ağu', listeFiyat: 192, gerceklesen: 170, iskonto: 11.5 },
];

// ─── Overview: product decision matrix scatter ────────────────────────────────
export const productDecisionData = [
  { name: 'Gaming Laptop', devirHizi: 7.1, marj: 40.0 },
  { name: 'Cilt Serumu', devirHizi: 7.8, marj: 44.3 },
  { name: 'Akıllı TV', devirHizi: 5.1, marj: 36.9 },
  { name: 'Makyaj Seti', devirHizi: 6.8, marj: 43.5 },
  { name: 'Tekstil A', devirHizi: 3.1, marj: 22.2 },
  { name: 'Gıda Ürünü', devirHizi: 12.4, marj: 11.8 },
  { name: 'Ev Dekor', devirHizi: 4.9, marj: 35.0 },
  { name: 'Spor Ekip.', devirHizi: 4.2, marj: 30.0 },
  { name: 'Oyuncak', devirHizi: 3.8, marj: 32.0 },
  { name: 'Kırtasiye', devirHizi: 2.8, marj: 12.5 },
];

// ─── Overview: top/bottom 5 products by margin ───────────────────────────────
export const topBottom5Data = {
  top5: [
    { name: 'Cilt Serumu A+', marj: 44.3, trend: 'up' as const },
    { name: 'Makyaj Seti Premium', marj: 43.5, trend: 'up' as const },
    { name: 'Gaming Laptop X500', marj: 40.0, trend: 'up' as const },
    { name: 'Organik Kozmetik', marj: 38.5, trend: 'flat' as const },
    { name: 'Pro Mouse Elite', marj: 38.2, trend: 'up' as const },
  ],
  bottom5: [
    { name: 'USB-C Hub Basic', marj: 8.4, trend: 'down' as const },
    { name: 'Gıda Konserve X', marj: 9.2, trend: 'down' as const },
    { name: 'Tekstil Sezon Sonu', marj: 10.1, trend: 'down' as const },
    { name: 'Eski Model Klavye', marj: 11.4, trend: 'down' as const },
    { name: 'Standart Monitör', marj: 15.2, trend: 'flat' as const },
  ],
};

// ─── Stock: inefficient products table ───────────────────────────────────────
export interface IneffRow {
  id: string;
  urun: string;
  kategori: string;
  stokDeg: number;
  stokYas: number;
  son30Gun: number;
  son90Gun: number;
  stokDevir: number;
  brutMarj: number;
  durum: 'olu' | 'yavas' | 'fazla';
  aksiyon: 'kampanya' | 'bundle' | 'fiyat' | 'listeden';
}

export const inefficientStockData: IneffRow[] = [
  { id: 'inef-1', urun: 'Sezon Dışı Kıyafet', kategori: 'Tekstil', stokDeg: 145, stokYas: 280, son30Gun: 2, son90Gun: 8, stokDevir: 0.8, brutMarj: 18.2, durum: 'olu', aksiyon: 'kampanya' },
  { id: 'inef-2', urun: 'Eski Model Kulaklık', kategori: 'Elektronik', stokDeg: 92, stokYas: 195, son30Gun: 4, son90Gun: 14, stokDevir: 1.2, brutMarj: 22.0, durum: 'yavas', aksiyon: 'bundle' },
  { id: 'inef-3', urun: 'Fazla Stok Tabak', kategori: 'Mutfak', stokDeg: 78, stokYas: 120, son30Gun: 8, son90Gun: 32, stokDevir: 1.8, brutMarj: 28.5, durum: 'fazla', aksiyon: 'fiyat' },
  { id: 'inef-4', urun: 'Eski Sezon Bahçe', kategori: 'Bahçe', stokDeg: 62, stokYas: 340, son30Gun: 1, son90Gun: 3, stokDevir: 0.4, brutMarj: 15.1, durum: 'olu', aksiyon: 'listeden' },
  { id: 'inef-5', urun: 'Standart Monitör', kategori: 'Elektronik', stokDeg: 185, stokYas: 160, son30Gun: 6, son90Gun: 22, stokDevir: 1.5, brutMarj: 15.2, durum: 'yavas', aksiyon: 'fiyat' },
  { id: 'inef-6', urun: 'Kışlık Spor Giysi', kategori: 'Spor', stokDeg: 55, stokYas: 220, son30Gun: 3, son90Gun: 10, stokDevir: 0.9, brutMarj: 20.4, durum: 'olu', aksiyon: 'kampanya' },
  { id: 'inef-7', urun: 'Aşırı Sipariş Masa', kategori: 'Ev & Yaşam', stokDeg: 210, stokYas: 95, son30Gun: 12, son90Gun: 45, stokDevir: 1.9, brutMarj: 32.0, durum: 'fazla', aksiyon: 'fiyat' },
];

// ─── Stock: stock age vs sales velocity scatter ───────────────────────────────
export const stockAgeVelocityData = [
  { name: 'Gaming Laptop', yas: 45, hiz: 42, stokDeg: 95, abc: 'A' },
  { name: 'Cilt Serumu', yas: 30, hiz: 88, stokDeg: 68, abc: 'A' },
  { name: 'Makyaj Set', yas: 60, hiz: 74, stokDeg: 52, abc: 'A' },
  { name: 'Akıllı Saat', yas: 90, hiz: 35, stokDeg: 46, abc: 'B' },
  { name: 'Ev Dekor', yas: 120, hiz: 28, stokDeg: 78, abc: 'B' },
  { name: 'Spor Ekip.', yas: 150, hiz: 22, stokDeg: 58, abc: 'B' },
  { name: 'Eski Kulaklık', yas: 210, hiz: 8, stokDeg: 42, abc: 'C' },
  { name: 'Sezon Kıyafet', yas: 280, hiz: 4, stokDeg: 38, abc: 'C' },
  { name: 'Bahçe Ürünü', yas: 340, hiz: 2, stokDeg: 32, abc: 'C' },
  { name: 'USB-C Hub', yas: 180, hiz: 12, stokDeg: 28, abc: 'C' },
];

// ─── Performance: revenue share change table ──────────────────────────────────
export interface RevShareRow {
  id: string;
  kategori: string;
  buAyCiro: number;
  buAyPay: number;
  gecenAyCiro: number;
  gecenAyPay: number;
  degisim: number;
  sparkTrend: 'up' | 'down' | 'flat';
}

export const revenueShareTableData: RevShareRow[] = [
  { id: 'rs-1', kategori: 'Elektronik', buAyCiro: 520, buAyPay: 28.6, gecenAyCiro: 488, gecenAyPay: 27.4, degisim: 1.2, sparkTrend: 'up' },
  { id: 'rs-2', kategori: 'Kozmetik', buAyCiro: 310, buAyPay: 17.0, gecenAyCiro: 282, gecenAyPay: 15.8, degisim: 1.2, sparkTrend: 'up' },
  { id: 'rs-3', kategori: 'Ev & Yaşam', buAyCiro: 280, buAyPay: 15.4, gecenAyCiro: 268, gecenAyPay: 15.0, degisim: 0.4, sparkTrend: 'up' },
  { id: 'rs-4', kategori: 'Gıda', buAyCiro: 245, buAyPay: 13.5, gecenAyCiro: 244, gecenAyPay: 13.7, degisim: -0.2, sparkTrend: 'flat' },
  { id: 'rs-5', kategori: 'Tekstil', buAyCiro: 198, buAyPay: 10.9, gecenAyCiro: 215, gecenAyPay: 12.0, degisim: -1.1, sparkTrend: 'down' },
  { id: 'rs-6', kategori: 'Spor', buAyCiro: 142, buAyPay: 7.8, gecenAyCiro: 135, gecenAyPay: 7.5, degisim: 0.3, sparkTrend: 'up' },
  { id: 'rs-7', kategori: 'Kırtasiye', buAyCiro: 88, buAyPay: 4.8, gecenAyCiro: 92, gecenAyPay: 5.1, degisim: -0.3, sparkTrend: 'down' },
  { id: 'rs-8', kategori: 'Oyuncak', buAyCiro: 76, buAyPay: 4.2, gecenAyCiro: 70, gecenAyPay: 3.9, degisim: 0.3, sparkTrend: 'up' },
];
