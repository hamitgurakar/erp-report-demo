import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
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

const trendData = [
  { month: 'Oca', gelir: 780, brutKar: 215, netKar: 125 },
  { month: 'Şub', gelir: 820, brutKar: 228, netKar: 132 },
  { month: 'Mar', gelir: 910, brutKar: 252, netKar: 148 },
  { month: 'Nis', gelir: 850, brutKar: 235, netKar: 138 },
  { month: 'May', gelir: 920, brutKar: 258, netKar: 152 },
  { month: 'Haz', gelir: 880, brutKar: 245, netKar: 142 },
  { month: 'Tem', gelir: 950, brutKar: 268, netKar: 158 },
  { month: 'Ağu', gelir: 860, brutKar: 240, netKar: 140 },
];

// Percentage mode data
const trendPctData = trendData.map((d) => ({
  month: d.month,
  gelir: 100,
  brutKar: +((d.brutKar / d.gelir) * 100).toFixed(1),
  netKar: +((d.netKar / d.gelir) * 100).toFixed(1),
}));

const customerTypeTrend = [
  { month: 'Oca', eski: 480, yeni: 95 },
  { month: 'Şub', eski: 510, yeni: 108 },
  { month: 'Mar', eski: 565, yeni: 148 },
  { month: 'Nis', eski: 520, yeni: 135 },
  { month: 'May', eski: 575, yeni: 152 },
  { month: 'Haz', eski: 540, yeni: 142 },
  { month: 'Tem', eski: 590, yeni: 165 },
  { month: 'Ağu', eski: 525, yeni: 138 },
];

const segmentQuarterly = [
  { quarter: 'Q1 2025', enterprise: 520, midMarket: 290, small: 130 },
  { quarter: 'Q2 2025', enterprise: 580, midMarket: 310, small: 140 },
  { quarter: 'Q3 2025', enterprise: 560, midMarket: 300, small: 135 },
  { quarter: 'Q4 2025', enterprise: 610, midMarket: 320, small: 148 },
];

const segmentCards = [
  { name: 'Enterprise', ciro: '3.830K ₺', musteri: 42, ortSiparis: '91.190 ₺', trend: '+18%', color: '#4F46E5' },
  { name: 'Mid-Market', ciro: '2.091K ₺', musteri: 128, ortSiparis: '16.336 ₺', trend: '+8%', color: '#818CF8' },
  { name: 'Small Business', ciro: '1.048K ₺', musteri: 312, ortSiparis: '3.359 ₺', trend: '+3%', color: '#C7D2FE' },
];

const accountsData = [
  { id: 1, name: 'Koç Holding', segment: 'Enterprise', gelir: 624, kar: 168, marj: 26.9, durum: 'active' },
  { id: 2, name: 'Arçelik A.Ş.', segment: 'Enterprise', gelir: 518, kar: 145, marj: 28.0, durum: 'active' },
  { id: 3, name: 'Turkcell İletişim', segment: 'Enterprise', gelir: 472, kar: 122, marj: 25.8, durum: 'active' },
  { id: 4, name: 'Sabancı Holding', segment: 'Enterprise', gelir: 398, kar: 110, marj: 27.6, durum: 'active' },
  { id: 5, name: 'THY Genel Müdürlük', segment: 'Mid-Market', gelir: 367, kar: 98, marj: 26.7, durum: 'active' },
  { id: 6, name: 'Eczacıbaşı Holding', segment: 'Enterprise', gelir: 312, kar: 84, marj: 26.9, durum: 'active' },
  { id: 7, name: 'Garanti BBVA', segment: 'Mid-Market', gelir: 298, kar: 78, marj: 26.2, durum: 'active' },
  { id: 8, name: 'Doğuş Otomotiv', segment: 'Mid-Market', gelir: 256, kar: 68, marj: 26.6, durum: 'idle' },
  { id: 9, name: 'Vestel Elektronik', segment: 'Mid-Market', gelir: 234, kar: 62, marj: 26.5, durum: 'active' },
  { id: 10, name: 'Pegasus Hava Yolları', segment: 'Small', gelir: 198, kar: 52, marj: 26.3, durum: 'active' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtK = (v: number) => `${v.toLocaleString('tr-TR')}K ₺`;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesRevenue = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [trendMode, setTrendMode] = useState<'TL' | '%'>('TL');
  const [sortKey, setSortKey] = useState<string>('gelir');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedAccounts = [...accountsData].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey] as number;
    const bv = (b as Record<string, unknown>)[sortKey] as number;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const marjColor = (v: number) => v >= 28 ? t.gn : v >= 25 ? t.am : t.rd;

  const segmentBadge = (seg: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Enterprise: { color: '#4F46E5', bg: '#EEF2FF' },
      'Mid-Market': { color: '#0D9488', bg: '#F0FDFA' },
      Small: { color: '#D97706', bg: '#FFFBEB' },
    };
    const c = cfg[seg] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{seg}</span>;
  };

  const durumBadge = (d: string) => {
    const isActive = d === 'active';
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? t.gn : t.am, background: isActive ? t.gnL : t.amL, borderRadius: 5, padding: '2px 8px' }}>
        {isActive ? 'Active' : 'Idle'}
      </span>
    );
  };

  return (
    <>
      {/* ── Section 1: GELİR & KARLILIK METRİKLERİ ──────────────────────────── */}
      <SectionHeader title={l.revGenelMetrik ?? 'GELİR & KARLILIK METRİKLERİ'} t={t} />

      {/* Row 1 — 3 big KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="rev-toplam-gelir" title={l.revToplamGelir ?? 'Toplam Gelir'} value="6.968.908 ₺" trendValue="+12,4%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="rev-brut-kar" title={l.revBrutKar ?? 'Brüt Kâr'} value="860.000 ₺" trendValue="+9,8%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState="TL" altValue="%25,3" {...kp} />
        <KPICard id="rev-net-kar" title={l.revNetKar ?? 'Net Kâr'} value="425.000 ₺" trendValue="+15,2%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState="TL" altValue="%17,1" {...kp} />
      </div>

      {/* Row 2 — 3 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="rev-brut-marj" title={l.revBrutMarj ?? 'Brüt Marj %'} value="%34,7" trendValue="-0,4pp" sparkTrend="flat" color="am" unit="%" {...kp} />
        <KPICard id="rev-net-marj" title={l.revNetMarj ?? 'Net Marj %'} value="%17,1" trendValue="+0,1pp" sparkTrend="up" color="gn" unit="%" {...kp} />
        <KPICard id="rev-yeniden-satis" title={l.revYenidenSatis ?? 'Yeniden Satış Geliri'} value="165.000 ₺" trendValue="+22,8%" sparkTrend="up" color="tl" unit="K ₺" info={l.revYenidenSatisInfo ?? 'Mevcut müşteriden tekrar satış'} {...kp} />
      </div>

      {/* ── Section 2: GELİR-BRÜT KÂR-NET KÂR TRENDİ ───────────────────────── */}
      <SectionHeader title={l.revGelirTrend ?? 'GELİR-BRÜT KÂR-NET KÂR TRENDİ'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.revGelirTrendChart ?? 'Gelir — Brüt Kâr — Net Kâr Trendi'} id="rev-chart-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          {/* TL/% toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ display: 'flex', borderRadius: 6, border: `1px solid ${t.bd}`, overflow: 'hidden' }}>
              {(['TL', '%'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTrendMode(m)}
                  style={{
                    padding: '4px 14px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: trendMode === m ? t.pr : t.bg2,
                    color: trendMode === m ? '#fff' : t.tx2,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendMode === 'TL' ? trendData : trendPctData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradGelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C7D2FE" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#C7D2FE" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradBrut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => trendMode === 'TL' ? `${v}K` : `${v}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const order = ['gelir', 'brutKar', 'netKar'];
                  const colors: Record<string, string> = { gelir: '#C7D2FE', brutKar: '#818CF8', netKar: '#4F46E5' };
                  const sorted = [...payload].sort((a, b) => order.indexOf(a.dataKey as string) - order.indexOf(b.dataKey as string));
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      {sorted.map((entry) => (
                        <div key={entry.dataKey as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[entry.dataKey as string] ?? t.tx2 }} />
                          <span style={{ color: t.tx2 }}>{entry.name}:</span>
                          <span style={{ fontWeight: 600, color: t.tx }}>{trendMode === 'TL' ? `${entry.value}K ₺` : `${entry.value}%`}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="gelir" name={lang === 'tr' ? 'Gelir' : 'Revenue'} stroke="#C7D2FE" fill="url(#gradGelir)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="brutKar" name={lang === 'tr' ? 'Brüt Kâr' : 'Gross Profit'} stroke="#818CF8" fill="url(#gradBrut)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="netKar" name={lang === 'tr' ? 'Net Kâr' : 'Net Profit'} stroke="#4F46E5" fill="url(#gradNet)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 3: AYLIK CİRO TRENDİ (MÜŞTERİ TİPİ KIRILIMLI) ──────────── */}
      <SectionHeader title={l.revMusteriTipi ?? 'AYLIK CİRO TRENDİ (MÜŞTERİ TİPİ KIRILIMLI)'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.revMusteriTipiChart ?? 'Aylık Ciro Trendi (Müşteri Tipi Kırılımlı)'} id="rev-chart-custtype" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={customerTypeTrend} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradEski" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gradYeni" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const eski = payload.find((p) => p.dataKey === 'eski')?.value as number ?? 0;
                  const yeni = payload.find((p) => p.dataKey === 'yeni')?.value as number ?? 0;
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} />
                        <span style={{ color: t.tx2 }}>{lang === 'tr' ? 'Eski Müşteri' : 'Existing'}:</span>
                        <span style={{ fontWeight: 600, color: t.tx }}>{eski}K ₺</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488' }} />
                        <span style={{ color: t.tx2 }}>{lang === 'tr' ? 'Yeni Müşteri' : 'New'}:</span>
                        <span style={{ fontWeight: 600, color: t.tx }}>{yeni}K ₺</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${t.bd}`, paddingTop: 4, marginTop: 4, fontWeight: 600, color: t.tx }}>
                        {lang === 'tr' ? 'Toplam' : 'Total'}: {eski + yeni}K ₺
                      </div>
                    </div>
                  );
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="eski" name={lang === 'tr' ? 'Eski Müşteri' : 'Existing Customer'} stackId="1" stroke="#4F46E5" fill="url(#gradEski)" strokeWidth={2} />
              <Area type="monotone" dataKey="yeni" name={lang === 'tr' ? 'Yeni Müşteri' : 'New Customer'} stackId="1" stroke="#0D9488" fill="url(#gradYeni)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 4: MÜŞTERİ SEGMENTİ BAZLI GELİR ────────────────────────── */}
      <SectionHeader title={l.revSegmentSection ?? 'MÜŞTERİ SEGMENTİ BAZLI GELİR'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Segment quarterly stacked bar */}
        <ChartContainer t={t} l={l} title={l.revSegmentDagilim ?? 'Müşteri Segmenti Gelir Dağılımı'} id="rev-chart-segment" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={segmentQuarterly} margin={{ top: 10, right: 20, bottom: 0, left: 0 }} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <YAxis type="category" dataKey="quarter" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value}K ₺`, name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill="#4F46E5" />
              <Bar dataKey="midMarket" name="Mid-Market" stackId="a" fill="#818CF8" />
              <Bar dataKey="small" name="Small Business" stackId="a" fill="#C7D2FE" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Segment performance cards */}
        <ChartContainer t={t} l={l} title={l.revSegmentPerf ?? 'Segment Performans'} id="rev-chart-segperf" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {segmentCards.map((seg) => (
              <div
                key={seg.name}
                style={{
                  background: t.bg2,
                  borderRadius: 8,
                  padding: '12px 14px',
                  borderLeft: `4px solid ${seg.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{seg.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.gn }}>{seg.trend}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.tx, marginBottom: 6 }}>{seg.ciro}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 10, color: t.tx2 }}>
                  <span>{seg.musteri} {lang === 'tr' ? 'müşteri' : 'customers'}</span>
                  <span>{lang === 'tr' ? 'Ort.' : 'Avg.'} {seg.ortSiparis}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 5: TOP PERFORMING ACCOUNTS ───────────────────────────────── */}
      <SectionHeader title={l.revTopAccounts ?? 'TOP PERFORMING ACCOUNTS'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.revTopAccountsTablo ?? 'Müşteri Performans Tablosu'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
              <Icon name="download" size={12} color={t.tx3} />
              Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'name', label: lang === 'tr' ? 'Müşteri Adı' : 'Customer', align: 'left' },
                  { key: 'segment', label: 'Segment', align: 'left' },
                  { key: 'gelir', label: lang === 'tr' ? 'Toplam Gelir' : 'Total Revenue', align: 'right' },
                  { key: 'kar', label: lang === 'tr' ? 'Kâr' : 'Profit', align: 'right' },
                  { key: 'marj', label: lang === 'tr' ? 'Marj %' : 'Margin %', align: 'right' },
                  { key: 'durum', label: lang === 'tr' ? 'Durum' : 'Status', align: 'center' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => !['segment', 'durum'].includes(col.key) && handleSort(col.key)}
                    style={{
                      padding: '8px 14px', fontSize: 11, fontWeight: 600,
                      color: sortKey === col.key ? t.pr : t.tx2,
                      textAlign: col.align as 'left' | 'right' | 'center',
                      whiteSpace: 'nowrap',
                      cursor: !['segment', 'durum'].includes(col.key) ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'left' ? 'flex-start' : col.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {col.label}
                      {!['segment', 'durum'].includes(col.key) && (
                        <Icon
                          name={sortKey === col.key ? (sortDir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'}
                          size={10}
                          color={sortKey === col.key ? t.pr : t.tx3}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{row.name}</td>
                  <td style={{ padding: '9px 14px' }}>{segmentBadge(row.segment)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx, fontWeight: 500 }}>{row.gelir.toLocaleString('tr-TR')}K ₺</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.kar.toLocaleString('tr-TR')}K ₺</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: marjColor(row.marj) }}>{row.marj.toFixed(1)}%</td>
                  <td style={{ padding: '9px 14px', textAlign: 'center' }}>{durumBadge(row.durum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>
          <button
            onClick={() => window.open('#', '_blank')}
            style={{ fontSize: 11, fontWeight: 500, color: t.pr, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {l.tumunuGor ?? 'Tümünü Gör'} →
          </button>
        </div>
      </div>
    </>
  );
};
