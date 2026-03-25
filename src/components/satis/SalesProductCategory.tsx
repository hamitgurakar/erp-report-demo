import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Treemap,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { FilterBar, type FilterOption } from '../ui/FilterBar';
import { Icon } from '../ui/Icon';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const treemapData = [
  { name: 'Employee Onboarding', size: 1200, marj: 22.4, deals: 145 },
  { name: 'Client Appreciation', size: 840, marj: 18.1, deals: 92 },
  { name: 'Performance Awards', size: 310, marj: 24.2, deals: 78 },
  { name: 'Wellness Kits', size: 420, marj: 8.2, deals: 56 },
  { name: 'Holiday Season', size: 290, marj: 15.3, deals: 120 },
];

const top10Products = [
  { name: 'Corporate Hamper XL', revenue: 482, profit: 125 },
  { name: 'Wellness Kit Premium', revenue: 378, profit: 98 },
  { name: 'Executive Gift Box', revenue: 340, profit: 92 },
  { name: 'Gourmet Selection Pack', revenue: 312, profit: 78 },
  { name: 'Tech Accessory Pack', revenue: 298, profit: 82 },
  { name: 'Premium Textile Set', revenue: 289, profit: 68 },
  { name: 'Organic Care Bundle', revenue: 267, profit: 72 },
  { name: 'Corporate Notebook Set', revenue: 234, profit: 58 },
  { name: 'Artisan Coffee Collection', revenue: 198, profit: 52 },
  { name: 'Holiday Special Box', revenue: 164, profit: 42 },
];

const marjHistogram = [
  { range: '0-10%', count: 12 },
  { range: '10-20%', count: 28 },
  { range: '20-30%', count: 45 },
  { range: '30-40%', count: 38 },
  { range: '40-50%', count: 22 },
  { range: '50%+', count: 11 },
];
const maxMarjCount = Math.max(...marjHistogram.map((d) => d.count));

// Heatmap: 7 days x 12 hours (08:00-19:00)
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const heatmapValues: number[][] = [
  [3, 8, 14, 18, 15, 12, 10, 8, 6, 4, 2, 1],   // Pzt
  [4, 12, 22, 28, 20, 15, 11, 9, 7, 5, 3, 1],   // Sal (peak)
  [5, 11, 20, 26, 19, 14, 12, 10, 8, 5, 3, 1],  // Çar
  [3, 9, 16, 20, 17, 13, 10, 8, 6, 4, 2, 1],    // Per
  [4, 10, 15, 18, 14, 11, 9, 7, 5, 3, 2, 1],    // Cum
  [1, 2, 4, 5, 4, 3, 2, 2, 1, 1, 0, 0],         // Cmt
  [0, 1, 2, 3, 2, 2, 1, 1, 0, 0, 0, 0],         // Paz
];
const heatmapMax = Math.max(...heatmapValues.flat());

const monthlySales = [
  { month: 'Oca', adet: 1800 },
  { month: 'Şub', adet: 2100 },
  { month: 'Mar', adet: 2400 },
  { month: 'Nis', adet: 1950 },
  { month: 'May', adet: 2200 },
  { month: 'Haz', adet: 2050 },
  { month: 'Tem', adet: 1700 },
  { month: 'Ağu', adet: 1600 },
  { month: 'Eyl', adet: 2300 },
  { month: 'Eki', adet: 2800 },
  { month: 'Kas', adet: 3200 },
  { month: 'Ara', adet: 3800 },
];
const maxMonthly = Math.max(...monthlySales.map((d) => d.adet));

interface CatRow {
  id: number;
  kategori: string;
  deal: number;
  adet: number;
  ortSiparis: number;
  gelir: number;
  marj: number;
  durum: 'Optimal' | 'Target' | 'Review';
}

const categoryTable: CatRow[] = [
  { id: 1, kategori: 'Welcome Kit Standard', deal: 452, adet: 12400, ortSiparis: 85, gelir: 1054000, marj: 22.1, durum: 'Optimal' },
  { id: 2, kategori: 'Milestone Recognition', deal: 312, adet: 5200, ortSiparis: 145, gelir: 754000, marj: 16.5, durum: 'Target' },
  { id: 3, kategori: 'Motivation Rewards', deal: 185, adet: 3100, ortSiparis: 210, gelir: 651000, marj: 8.9, durum: 'Review' },
  { id: 4, kategori: 'Event Swag Packs', deal: 94, adet: 8500, ortSiparis: 45, gelir: 382500, marj: 25.4, durum: 'Optimal' },
  { id: 5, kategori: 'Corporate Gifting', deal: 278, adet: 4200, ortSiparis: 285, gelir: 1197000, marj: 19.2, durum: 'Target' },
  { id: 6, kategori: 'Wellness Kits', deal: 156, adet: 2800, ortSiparis: 175, gelir: 490000, marj: 12.3, durum: 'Review' },
  { id: 7, kategori: 'Holiday Specials', deal: 320, adet: 6100, ortSiparis: 95, gelir: 579500, marj: 28.7, durum: 'Optimal' },
  { id: 8, kategori: 'New Hire Boxes', deal: 198, adet: 3400, ortSiparis: 120, gelir: 408000, marj: 21.8, durum: 'Optimal' },
];

// Quarterly deal heatmap
const qDealRows = [
  { amaç: 'Onboarding', q1: 112, q2: 145, q3: 189, q4: 84 },
  { amaç: 'Appreciation', q1: 92, q2: 45, q3: 124, q4: 241 },
  { amaç: 'Holiday', q1: 12, q2: 8, q3: 45, q4: 512 },
  { amaç: 'Wellness', q1: 156, q2: 132, q3: 41, q4: 68 },
  { amaç: 'Motivation', q1: 78, q2: 95, q3: 68, q4: 42 },
];
const qMax = Math.max(...qDealRows.flatMap((r) => [r.q1, r.q2, r.q3, r.q4]));

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const treemapColor = (marj: number): string => {
  if (marj >= 22) return '#16A34A';
  if (marj >= 15) return '#D97706';
  return '#DC2626';
};

const heatColor = (val: number, max: number, base: string): string => {
  const ratio = max > 0 ? val / max : 0;
  const alpha = Math.round(ratio * 220 + 15).toString(16).padStart(2, '0');
  return `${base}${alpha}`;
};

// ── Treemap custom content ──────────────────────────────────────────────────────

const TreemapContent = (props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; size?: number; marj?: number; index?: number;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, name, size, marj, index } = props;
  if (width < 30 || height < 30) return null;
  const fill = treemapColor(marj ?? 0);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} opacity={0.82} stroke="#fff" strokeWidth={2} />
      {width > 60 && height > 40 && (
        <>
          {index === 0 && (
            <rect x={x + 6} y={y + 6} width={62} height={16} rx={3} fill="#fff" opacity={0.9} />
          )}
          {index === 0 && (
            <text x={x + 10} y={y + 18} fontSize={9} fontWeight={700} fill={fill}>TOP DRIVER</text>
          )}
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">
            {name && name.length > 18 ? name.slice(0, 17) + '…' : name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fontSize={10} fill="#ffffffcc">
            {size}K ₺ • %{marj}
          </text>
        </>
      )}
    </g>
  );
};

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesProductCategory = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [catSort, setCatSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'gelir', dir: 'desc' });

  const handleCatSort = (key: string) => {
    setCatSort((p) => p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const sortedCat = [...categoryTable].sort((a, b) => {
    const av = (a as Record<string, unknown>)[catSort.key];
    const bv = (b as Record<string, unknown>)[catSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return catSort.dir === 'asc' ? av - bv : bv - av;
    return catSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const filters: FilterOption[] = [
    { key: 'kategori', label: l.filtreKategori ?? 'Kategori', options: ['Employee Onboarding', 'Client Appreciation', 'Performance Awards', 'Wellness Kits', 'Holiday Season'] },
    { key: 'altKategori', label: l.filtreAltKategori ?? 'Alt Kategori', options: ['Standard', 'Premium', 'Custom'] },
    { key: 'urun', label: l.filtreUrun ?? 'Ürün', options: [l.filtreTumu ?? 'Tümü'] },
    { key: 'kanal', label: l.filtreKanal ?? 'Kanal', options: ['b2b.muhiku.com', 'B2B Project'] },
  ];

  const marjBarColor = (v: number) => v >= 20 ? t.gn : v >= 15 ? '#3B82F6' : t.rd;

  const durumBadge = (d: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Optimal: { color: '#059669', bg: '#D1FAE5' },
      Target: { color: '#3B82F6', bg: '#DBEAFE' },
      Review: { color: '#DC2626', bg: '#FEE2E2' },
    };
    const c = cfg[d] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{d}</span>;
  };

  return (
    <>
      {/* Filter Bar */}
      <FilterBar t={t} l={l} filters={filters} />

      {/* ── Section 1: ÜRÜN & KATEGORİ METRİKLERİ ───────────────────────────── */}
      <SectionHeader title={l.prdMetrikler ?? 'ÜRÜN & KATEGORİ METRİKLERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="prd-bestseller" title={l.prdBestSeller ?? 'En Çok Satan Ürün'} value="Corporate Hamper XL" trendValue="+12,4% vs LY" sparkTrend="up" color="gn" unit="" big {...kp} />
        <KPICard id="prd-topmarj" title={l.prdTopMarj ?? 'En Yüksek Marj %'} value="%48,2" trendValue="+2,1%" sparkTrend="up" color="tl" unit="%" big {...kp} />
        <KPICard id="prd-gelir" title={l.prdToplamGelir ?? 'Toplam Gelir'} value="1.420.000 ₺" trendValue="+8,7%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="prd-aov" title={l.prdAOV ?? 'Ort. Sipariş Değeri'} value="214,50 ₺" trendValue="-0,8%" sparkTrend="down" color="rd" unit="₺" big {...kp} />
      </div>

      {/* ── Section 2: TREEMAP & TOP ÜRÜNLER ─────────────────────────────────── */}
      <SectionHeader title={l.prdTreemapSection ?? 'KATEGORİ KATKI DAĞILIMI & TOP ÜRÜNLER'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Treemap */}
        <ChartContainer t={t} l={l} title={l.prdTreemap ?? 'Kategori Katkı Dağılımı'} id="prd-chart-treemap" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={treemapData}
              dataKey="size"
              stroke="#fff"
              content={<TreemapContent />}
            >
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>Gelir: <b>{payload[0].payload.size}K ₺</b></div>
                      <div style={{ color: t.tx2 }}>Marj: <b>%{payload[0].payload.marj}</b></div>
                      <div style={{ color: t.tx2 }}>Deal: <b>{payload[0].payload.deals}</b></div>
                    </div>
                  ) : null
                }
              />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top 10 Products — Horizontal Dual Bar */}
        <ChartContainer t={t} l={l} title={l.prdTop10 ?? 'Top 10 Ürün (Gelir & Kâr)'} id="prd-chart-top10" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10Products} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: t.tx2 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [`${v}K ₺`, n]} />
              <Bar dataKey="revenue" name={lang === 'tr' ? 'Gelir' : 'Revenue'} fill="#818CF8" radius={[0, 3, 3, 0]} barSize={10} />
              <Bar dataKey="profit" name={lang === 'tr' ? 'Kâr' : 'Profit'} fill="#C7D2FE" radius={[0, 3, 3, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 3: MARJ DAĞILIMI & HEATMAP ───────────────────────────────── */}
      <SectionHeader title={l.prdMarjHeatmap ?? 'MARJ DAĞILIMI & SATIŞ YOĞUNLUĞU'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Margin histogram */}
        <ChartContainer t={t} l={l} title={l.prdMarjDagilim ?? 'Ürün Marj Dağılımı'} id="prd-chart-marj" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={marjHistogram} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} ürün`, '']} />
              <ReferenceLine x="20-30%" stroke={t.pr} strokeDasharray="5 3" strokeWidth={1.5} label={{ value: 'Ort. %32,5', fontSize: 9, fill: t.pr, position: 'top' }} />
              <Bar dataKey="count" name="Ürün" radius={[4, 4, 0, 0]}>
                {marjHistogram.map((d, i) => (
                  <Cell key={i} fill={d.count === maxMarjCount ? t.pr : '#818CF8'} opacity={d.count === maxMarjCount ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx2, textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>
            {lang === 'tr' ? "Ürünlerin %60'ı %20-40 marj aralığında" : '60% of products fall in 20-40% margin range'}
          </div>
        </ChartContainer>

        {/* Sales heatmap (Day × Hour) */}
        <ChartContainer t={t} l={l} title={l.prdSatisYogunluk ?? 'Satış Yoğunluğu (Gün × Saat)'} id="prd-chart-heatmap" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            {/* Hour headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} style={{ fontSize: 8, color: t.tx3, textAlign: 'center' }}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {DAYS.map((day, di) => (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
                <div style={{ fontSize: 9, color: t.tx2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>{day}</div>
                {heatmapValues[di].map((val, hi) => (
                  <div
                    key={hi}
                    style={{
                      height: 22,
                      borderRadius: 3,
                      background: heatColor(val, heatmapMax, '#4F46E5'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title={`${day} ${HOURS[hi]}: ${val} sipariş`}
                  >
                    {val > 10 && <span style={{ fontSize: 8, color: '#fff', fontWeight: 600 }}>{val}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: t.tx2, textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
            {lang === 'tr' ? 'Peak B2B sipariş: 09:00-11:00, Salı & Çarşamba' : 'Peak B2B orders: 09:00-11:00, Tue & Wed'}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 4: AYLIK SATIŞ HACMİ ─────────────────────────────────────── */}
      <SectionHeader title={l.prdAylikHacim ?? 'AYLIK SATIŞ HACMİ & SEZONSAL'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.prdAylikChart ?? 'Aylık Satış Hacmi (Adet)'} id="prd-chart-aylik" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySales} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString('tr-TR')} adet`, '']} />
              <Bar dataKey="adet" name="Adet" radius={[4, 4, 0, 0]}>
                {monthlySales.map((d, i) => (
                  <Cell key={i} fill={d.adet === maxMonthly ? t.am : t.pr} opacity={d.adet === maxMonthly ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Peak label */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 30, marginTop: -14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.am, background: t.amL, padding: '2px 8px', borderRadius: 4 }}>
              Peak: Aralık — 3.800 adet
            </span>
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 5: KATEGORİ PERFORMANS TABLOSU ───────────────────────────── */}
      <SectionHeader title={l.prdKategoriTablo ?? 'KATEGORİ PERFORMANS TABLOSU'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.prdKategoriGrid ?? 'Kategori Performans Grid'}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} />
            Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'kategori', label: 'Kategori', align: 'left' },
                  { key: 'deal', label: 'Deal', align: 'right' },
                  { key: 'adet', label: 'Satış Adedi', align: 'right' },
                  { key: 'ortSiparis', label: 'Ort. Sipariş', align: 'right' },
                  { key: 'gelir', label: 'Gelir', align: 'right' },
                  { key: 'marj', label: 'Net Marj %', align: 'right' },
                  { key: 'durum', label: 'Durum', align: 'center' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleCatSort(col.key)}
                    style={{
                      padding: '8px 14px', fontSize: 11, fontWeight: 600,
                      color: catSort.key === col.key ? t.pr : t.tx2,
                      textAlign: col.align as 'left' | 'right' | 'center',
                      whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'left' ? 'flex-start' : col.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {col.label}
                      <Icon name={catSort.key === col.key ? (catSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={catSort.key === col.key ? t.pr : t.tx3} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCat.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{r.kategori}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.deal}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.adet.toLocaleString('tr-TR')}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.ortSiparis} ₺</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtTL(r.gelir)}</td>
                  <td style={{ padding: '9px 14px', width: 110 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: t.bg2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(r.marj / 35 * 100, 100)}%`, background: marjBarColor(r.marj), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: marjBarColor(r.marj), width: 32, textAlign: 'right' }}>{r.marj.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'center' }}>{durumBadge(r.durum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>
          <button onClick={() => window.open('#', '_blank')} style={{ fontSize: 11, fontWeight: 500, color: t.pr, background: 'none', border: 'none', cursor: 'pointer' }}>
            {l.tumunuGor ?? 'Tümünü Gör'} →
          </button>
        </div>
      </div>

      {/* ── Section 6: ÇEYREKLİK DEAL DAĞILIMI HEATMAP ──────────────────────── */}
      <SectionHeader title={l.prdQDealSection ?? 'YILLIK DEAL DAĞILIMI (AMAÇ BAZLI)'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.prdQDealTablo ?? 'Çeyreklik Deal Dağılımı (Amaç Bazlı)'}</span>
        </div>
        <div style={{ overflowX: 'auto', padding: '12px 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{lang === 'tr' ? 'Amaç' : 'Purpose'}</th>
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                  <th key={q} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{q}</th>
                ))}
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'right' }}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {qDealRows.map((row) => {
                const total = row.q1 + row.q2 + row.q3 + row.q4;
                return (
                  <tr key={row.amaç} style={{ borderTop: `1px solid ${t.bd}` }}>
                    <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{row.amaç}</td>
                    {[row.q1, row.q2, row.q3, row.q4].map((val, qi) => {
                      const ratio = qMax > 0 ? val / qMax : 0;
                      const alpha = Math.round(ratio * 200 + 20).toString(16).padStart(2, '0');
                      return (
                        <td key={qi} style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <div style={{
                            background: `#4F46E5${alpha}`,
                            color: ratio > 0.5 ? '#fff' : t.tx,
                            borderRadius: 4,
                            padding: '6px 8px',
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {val}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: t.tx, textAlign: 'right' }}>{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
