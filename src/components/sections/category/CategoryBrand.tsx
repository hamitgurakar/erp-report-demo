import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../../types';
import { brandTop20Data, brandGrowthData, brandTableData } from '../../../constants/categoryData';
import { KPICard } from '../../kpi/KPICard';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChartContainer } from '../../ui/ChartContainer';
import { FilterBar, type FilterOption } from '../../ui/FilterBar';
import { Icon } from '../../ui/Icon';
import { type ColDef } from '../../ui/ColumnManager';
import { ColumnPresetDropdown } from '../../ui/ColumnPresetDropdown';

const BRAND_COLS: ColDef[] = [
  { key: 'marka', label: 'Marka' },
  { key: 'ciro', label: 'Ciro (K ₺)' },
  { key: 'pay', label: 'Payı %' },
  { key: 'marj', label: 'Marj %' },
  { key: 'sku', label: 'SKU' },
  { key: 'satisAdedi', label: 'Satış Adedi' },
  { key: 'stok', label: 'Stok (K ₺)' },
  { key: 'iade', label: 'İade %' },
  { key: 'buyume', label: 'Büyüme %' },
];

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const CategoryBrand = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [visibleCols, setVisibleCols] = useState<string[]>(BRAND_COLS.map((c) => c.key));

  const growthColor = (v: number) => v > 10 ? t.gn : v > 0 ? t.am : t.rd;
  const marjColor = (v: number) => v >= 35 ? t.gn : v >= 20 ? t.am : t.rd;

  // Scatter quadrant color per point
  const quadrantColor = (d: { buyume: number; marjDeg: number }): string => {
    if (d.buyume > 0 && d.marjDeg > 0) return t.gn;
    if (d.buyume > 0 && d.marjDeg <= 0) return t.am;
    if (d.buyume <= 0 && d.marjDeg > 0) return t.c1;
    return t.rd;
  };

  // D1: Filter options
  const filters: FilterOption[] = [
    { key: 'marka', label: l.filtreMarka, options: ['Samsung', 'Apple', 'Maybelline', 'L\'Oreal', 'Nike', 'Adidas', 'Dyson', 'Lenovo'] },
    { key: 'kategori', label: l.filtreKategori, options: ['Elektronik', 'Kozmetik', 'Ev & Yaşam', 'Spor', 'Tekstil'] },
    { key: 'kanal', label: l.filtreKanal, options: ['B2B', 'B2C'] },
  ];

  return (
    <>
      <SectionHeader title={l.katMarka} t={t} />

      {/* D1: Filter bar */}
      <FilterBar t={t} l={l} filters={filters} />

      {/* 4 big KPIs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <KPICard id="kat-marka-ciro" title={l.katToplamMarkaCiro} value="1.82M ₺" trendValue="+11.3%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kat-marka-top10pay" title={l.katTop10MarkaPayi} value="%68" trendValue="+2%" sparkTrend="up" color="am" unit="%" big info={l.katTop10MarkaInfo} {...kp} />
        <KPICard id="kat-marka-ortmarj" title={l.katOrtMarkaMarj} value="%31.5" trendValue="-0.8%" sparkTrend="down" color="am" unit="%" big {...kp} />
        <KPICard id="kat-marka-sepet" title={l.katOrtSepet} value="487 ₺" trendValue="+6.2%" sparkTrend="up" color="gn" unit="₺" big {...kp} />
      </div>

      {/* D2: 6 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kat-marka-satisadedi" title={l.katMarkaSatisAdedi} value="48.2K" trendValue="+9.4%" sparkTrend="up" color="gn" unit="adet" {...kp} />
        <KPICard id="kat-marka-ortfiyat" title={l.katMarkaOrtFiyat} value="342 ₺" trendValue="+4.7%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="kat-marka-iade" title={l.katMarkaIadeOrani} value="%3.2" trendValue="-0.3%" sparkTrend="down" color="rd" unit="%" info={l.katMarkaIadeOraniInfo} {...kp} />
        <KPICard id="kat-marka-stokdeg" title={l.katMarkaStokDeg} value="4.8M ₺" trendValue="+2.1%" sparkTrend="up" color="c2" unit="K ₺" {...kp} />
        <KPICard id="kat-marka-stokdevir" title={l.katMarkaStokDevir} value="5.8x" trendValue="+0.4x" sparkTrend="up" color="gn" unit="x" {...kp} />
        <KPICard id="kat-marka-kritiksku" title={l.katMarkaKritikSku} value="14" trendValue="+3" sparkTrend="down" color="rd" unit="adet" info={l.katMarkaKritikSkuInfo} {...kp} />
      </div>

      {/* Top 20 brands chart */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.katTop20Marka} id="kat-marka-chart-top20" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={brandTop20Data.slice(0, 12)} layout="vertical" barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="ciro" name={lang === 'tr' ? 'Ciro (K ₺)' : 'Revenue (K ₺)'} fill={t.pr} radius={[0, 3, 3, 0]} opacity={0.85} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* D3: Brand growth matrix — full-width single row */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.katMarkaBuyumeMatris} id="kat-marka-chart-matris" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} info={l.katMarkaBuyumeMatrisInfo}>
          <div style={{ position: 'relative' }}>
            {/* Quadrant labels */}
            <div style={{ position: 'absolute', top: 8, right: 32, fontSize: 10, color: t.gn, fontWeight: 600, opacity: 0.7 }}>{l.quadYildizlar}</div>
            <div style={{ position: 'absolute', top: 8, left: 60, fontSize: 10, color: t.am, fontWeight: 600, opacity: 0.7 }}>{l.quadBuyuyenler}</div>
            <div style={{ position: 'absolute', bottom: 24, right: 32, fontSize: 10, color: t.c1, fontWeight: 600, opacity: 0.7 }}>{l.quadDuraganlar}</div>
            <div style={{ position: 'absolute', bottom: 24, left: 60, fontSize: 10, color: t.rd, fontWeight: 600, opacity: 0.7 }}>{l.quadGerileyenler}</div>

            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 30, right: 40, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
                <XAxis
                  type="number" dataKey="buyume" name={lang === 'tr' ? 'Büyüme %' : 'Growth %'}
                  tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: lang === 'tr' ? 'Büyüme %' : 'Growth %', position: 'insideBottom', offset: -10, fontSize: 10, fill: t.tx3 }}
                />
                <YAxis
                  type="number" dataKey="marjDeg" name={lang === 'tr' ? 'Marj Değişimi' : 'Margin Change'}
                  tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                  label={{ value: lang === 'tr' ? 'Marj Δ' : 'Margin Δ', angle: -90, position: 'insideLeft', fontSize: 10, fill: t.tx3 }}
                />
                <ZAxis range={[60, 200]} />
                <ReferenceLine x={0} stroke={t.tx3} strokeWidth={1.5} strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke={t.tx3} strokeWidth={1.5} strokeDasharray="4 4" />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.name}</div>
                        <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Büyüme' : 'Growth'}: <b style={{ color: growthColor(payload[0].payload.buyume) }}>{payload[0].payload.buyume > 0 ? '+' : ''}{payload[0].payload.buyume}%</b></div>
                        <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Marj Δ' : 'Margin Δ'}: <b>{payload[0].payload.marjDeg > 0 ? '+' : ''}{payload[0].payload.marjDeg}</b></div>
                      </div>
                    ) : null
                  }
                />
                {/* Per-point color + brand name label via custom shape */}
                <Scatter
                  data={brandGrowthData}
                  shape={(props: { cx?: number; cy?: number; payload?: { name: string; buyume: number; marjDeg: number } }) => {
                    const { cx = 0, cy = 0, payload } = props;
                    if (!payload) return <g />;
                    const fill = quadrantColor(payload);
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={10} fill={fill} opacity={0.82} stroke={fill} strokeWidth={1} />
                        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={10} fill={t.tx} fontWeight={500}>
                          {payload.name}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Brand performance table */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.katMarkaPerfTablo}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnPresetDropdown t={t} l={l} tableType="brand" allColumns={BRAND_COLS} visibleKeys={visibleCols} onChange={setVisibleCols} />
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
                {BRAND_COLS.filter((c) => visibleCols.includes(c.key)).map((col) => (
                  <th key={col.key} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: col.key === 'marka' ? 'left' : 'right', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brandTableData.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {visibleCols.includes('marka') && <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx, textAlign: 'left' }}>{row.marka}</td>}
                  {visibleCols.includes('ciro') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.ciro}K</td>}
                  {visibleCols.includes('pay') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{row.pay.toFixed(1)}%</td>}
                  {visibleCols.includes('marj') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: marjColor(row.marj), fontWeight: 600 }}>{row.marj.toFixed(1)}%</td>}
                  {visibleCols.includes('sku') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{row.sku}</td>}
                  {visibleCols.includes('satisAdedi') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.satisAdedi.toLocaleString('tr-TR')}</td>}
                  {visibleCols.includes('stok') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{row.stok}K</td>}
                  {visibleCols.includes('iade') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.iade > 5 ? t.rd : t.tx2 }}>{row.iade.toFixed(1)}%</td>}
                  {visibleCols.includes('buyume') && (
                    <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: growthColor(row.buyume) }}>
                      {row.buyume > 0 ? '+' : ''}{row.buyume.toFixed(1)}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
