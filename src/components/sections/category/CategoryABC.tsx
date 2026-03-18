import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../../types';
import { abcParetoData, abcTransitionData, lifecycleData, abcActionData } from '../../../constants/categoryData';
import type { AksiyonType } from '../../../constants/categoryData';
import { KPICard } from '../../kpi/KPICard';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChartContainer } from '../../ui/ChartContainer';
import { Icon } from '../../ui/Icon';
import { ColumnManager, type ColDef } from '../../ui/ColumnManager';
import { Spark } from '../../ui/Spark';
import { mkSpk } from '../../../constants/data';

const ABC_COLS: ColDef[] = [
  { key: 'urun', label: 'Ürün' },
  { key: 'abc', label: 'ABC Grubu' },
  { key: 'ciro', label: 'Ciro (K ₺)' },
  { key: 'marj', label: 'Marj %' },
  { key: 'stokGun', label: 'Stok Gün' },
  { key: 'satisHizi', label: 'Satış Hızı' },
  { key: 'trend', label: 'Trend' },
  { key: 'aksiyon', label: 'Önerilen Aksiyon' },
];

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const CategoryABC = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [visibleCols, setVisibleCols] = useState<string[]>(ABC_COLS.map((c) => c.key));

  const abcColor: Record<string, string> = { A: t.gn, B: t.am, C: t.rd };
  const abcBg: Record<string, string> = { A: t.gnL, B: t.amL, C: t.rdL };

  const aksiyonConfig: Record<AksiyonType, { label: string; color: string; bg: string }> = {
    stokArtir: { label: l.aksStokArtir, color: t.gn, bg: t.gnL },
    kampanya: { label: l.aksCampaign, color: t.am, bg: t.amL },
    bundle: { label: l.aksBundle, color: t.c1, bg: t.gnL },
    listeden: { label: l.aksListedenCikar, color: t.rd, bg: t.rdL },
    fiyat: { label: l.aksFiyatRevize, color: t.pu, bg: t.puL },
  };

  const segColors: Record<string, string> = {
    yeni: t.pr,
    buyuyen: t.gn,
    olgun: t.tl,
    dususte: t.rd,
  };

  const segLabels: Record<string, string> = {
    yeni: l.segYeni,
    buyuyen: l.segBuyuyen,
    olgun: l.segOlgun,
    dususte: l.segDususte,
  };

  // Build transition heatmap data
  const transitionMax = Math.max(...abcTransitionData.map((d) => d.value));

  return (
    <>
      <SectionHeader title={l.katABC} t={t} />

      {/* 3 big ABC group KPIs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {[
          { id: 'kat-abc-a', title: l.katAGrubu, value: '1.42M ₺', pct: '%78', sku: '142 SKU', color: 'gn', sparkTrend: 'up' as const },
          { id: 'kat-abc-b', title: l.katBGrubu, value: '309K ₺', pct: '%17', sku: '318 SKU', color: 'am', sparkTrend: 'flat' as const },
          { id: 'kat-abc-c', title: l.katCGrubu, value: '91K ₺', pct: '%5', sku: '787 SKU', color: 'rd', sparkTrend: 'down' as const },
        ].map((g) => (
          <div key={g.id} style={{ flex: 1 }}>
            <KPICard
              id={g.id}
              title={`${g.title} · ${g.sku}`}
              value={g.value}
              trendValue={g.pct + ' ciro'}
              sparkTrend={g.sparkTrend}
              color={g.color}
              unit="K ₺"
              big
              info={l.katAbcInfo}
              {...kp}
            />
          </div>
        ))}
      </div>

      {/* 4 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kat-abc-ayab" title={l.katAyaB} value="8 SKU" trendValue="Bu ay" sparkTrend="down" color="rd" unit="SKU" {...kp} />
        <KPICard id="kat-abc-baya" title={l.katBayA} value="12 SKU" trendValue="Bu ay" sparkTrend="up" color="gn" unit="SKU" {...kp} />
        <KPICard id="kat-abc-cstok" title={l.katCGrubuStok} value="245K ₺" trendValue="-18K" sparkTrend="down" color="am" unit="K ₺" {...kp} />
        <KPICard id="kat-abc-eleme" title={l.katElemeAdayi} value="124 SKU" trendValue="+12" sparkTrend="up" color="rd" unit="SKU" {...kp} />
      </div>

      {/* Charts: pareto + transition matrix (2-col) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* ABC Pareto */}
        <ChartContainer t={t} l={l} title={l.katAbcPareto} id="kat-abc-chart-pareto" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={abcParetoData.slice(0, 20)} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Ciro' : 'Revenue'}: {payload[0].payload.ciro.toFixed(0)}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Kümülatif' : 'Cumulative'}: {payload[0].payload.kumulatif}%</div>
                    </div>
                  ) : null
                }
              />
              {/* A/B/C zone reference lines */}
              <ReferenceLine yAxisId="right" y={80} stroke={t.gn} strokeDasharray="4 3" />
              <ReferenceLine yAxisId="right" y={95} stroke={t.am} strokeDasharray="4 3" />
              <Bar yAxisId="left" dataKey="ciro" fill={t.pr} radius={[2, 2, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="kumulatif" stroke={t.rd} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6 }}>
            {[{ label: 'A (%80)', color: t.gn }, { label: 'B (%15)', color: t.am }, { label: 'C (%5)', color: t.rd }].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: t.tx2 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* ABC Transition Matrix */}
        <ChartContainer t={t} l={l} title={l.katAbcGecisMatris} id="kat-abc-chart-gecis" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header row */}
            <div style={{ display: 'flex', gap: 4, paddingLeft: 80, marginBottom: 4 }}>
              {['A', 'B', 'C'].map((g) => (
                <div key={g} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: abcColor[g] }}>
                  {lang === 'tr' ? 'Mevcut' : 'Current'} {g}
                </div>
              ))}
            </div>
            {['A', 'B', 'C'].map((prev) => (
              <div key={prev} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: abcColor[prev], textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>
                  {lang === 'tr' ? 'Önceki' : 'Previous'} {prev}
                </div>
                {['A', 'B', 'C'].map((curr) => {
                  const cell = abcTransitionData.find((d) => d.onceki === prev && d.mevcut === curr);
                  const val = cell?.value ?? 0;
                  const intensity = val / transitionMax;
                  const isDiag = prev === curr;
                  const isUp = curr < prev; // e.g. B→A
                  const isDown = curr > prev; // e.g. A→B
                  const bg = isDiag
                    ? `${t.tl}${Math.round(intensity * 80 + 20).toString(16).padStart(2, '0')}`
                    : isDown
                    ? `${t.rd}${Math.min(Math.round(intensity * 100 + 15), 99).toString(16).padStart(2, '0')}`
                    : isUp
                    ? `${t.gn}${Math.min(Math.round(intensity * 100 + 15), 99).toString(16).padStart(2, '0')}`
                    : t.bg2;
                  return (
                    <div
                      key={curr}
                      style={{
                        flex: 1, height: 56, borderRadius: 8, background: bg,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${t.bd}`,
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700, color: t.tx }}>{val}</div>
                      <div style={{ fontSize: 9, color: t.tx3 }}>SKU</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ChartContainer>

      </div>

      {/* E1: Product lifecycle scatter — full-width single row */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.katUrunHayatDongusu} id="kat-abc-chart-lifecycle" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} info={l.katLifecycleInfo}>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 30, right: 40, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis
                type="number" dataKey="yas" name={lang === 'tr' ? 'Ürün Yaşı (gün)' : 'Product Age (days)'}
                tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                label={{ value: lang === 'tr' ? 'Ürün Yaşı (gün)' : 'Product Age (days)', position: 'insideBottom', offset: -10, fontSize: 10, fill: t.tx3 }}
              />
              <YAxis
                type="number" dataKey="satisHizi" name={lang === 'tr' ? 'Satış Hızı' : 'Sales Velocity'}
                tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                label={{ value: lang === 'tr' ? 'Satış Hızı' : 'Sales Velocity', angle: -90, position: 'insideLeft', fontSize: 10, fill: t.tx3 }}
              />
              <ZAxis type="number" dataKey="stokDeg" range={[40, 280]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                      <div style={{ color: segColors[payload[0].payload.segment], fontWeight: 600 }}>
                        {segLabels[payload[0].payload.segment]}
                      </div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Yaş' : 'Age'}: {payload[0].payload.yas} {lang === 'tr' ? 'gün' : 'days'}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Satış Hızı' : 'Velocity'}: {payload[0].payload.satisHizi}</div>
                    </div>
                  ) : null
                }
              />
              {/* Per-segment Scatter with custom shape that shows product name label */}
              {Object.keys(segColors).map((seg) => (
                <Scatter
                  key={seg}
                  data={lifecycleData.filter((d) => d.segment === seg)}
                  fill={segColors[seg]}
                  opacity={0.85}
                  name={segLabels[seg]}
                  shape={(props: { cx?: number; cy?: number; r?: number; fill?: string; payload?: { name: string } }) => {
                    const { cx = 0, cy = 0, r = 8, fill, payload } = props;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.85} stroke={fill} strokeWidth={1} />
                        <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={10} fill={t.tx} fontWeight={500}>
                          {payload?.name}
                        </text>
                      </g>
                    );
                  }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6 }}>
            {Object.entries(segColors).map(([seg, color]) => (
              <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 10, color: t.tx2 }}>{segLabels[seg]}</span>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* Action recommendations table */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.katAksiyonTablo}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={ABC_COLS} visibleKeys={visibleCols} onChange={setVisibleCols} />
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
                {ABC_COLS.filter((c) => visibleCols.includes(c.key)).map((col) => (
                  <th key={col.key} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: col.key === 'urun' || col.key === 'aksiyon' ? 'left' : 'right', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abcActionData.map((row) => {
                const aksiyon = aksiyonConfig[row.aksiyon];
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: `1px solid ${t.bd}` }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {visibleCols.includes('urun') && <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx, textAlign: 'left' }}>{row.urun}</td>}
                    {visibleCols.includes('abc') && (
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: abcColor[row.abc], background: abcBg[row.abc], borderRadius: 5, padding: '2px 8px' }}>
                          {row.abc}
                        </span>
                      </td>
                    )}
                    {visibleCols.includes('ciro') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.ciro}K</td>}
                    {visibleCols.includes('marj') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.marj >= 30 ? t.gn : row.marj >= 15 ? t.am : t.rd, fontWeight: 600 }}>{row.marj.toFixed(1)}%</td>}
                    {visibleCols.includes('stokGun') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.stokGun > 180 ? t.rd : row.stokGun > 90 ? t.am : t.gn, fontWeight: 600 }}>{row.stokGun} gün</td>}
                    {visibleCols.includes('satisHizi') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.satisHizi}</td>}
                    {visibleCols.includes('trend') && (
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        <Spark data={mkSpk(row.sparkTrend, 'K ₺', lang)} color={row.sparkTrend === 'up' ? t.gn : row.sparkTrend === 'down' ? t.rd : t.am} t={t} compact />
                      </td>
                    )}
                    {visibleCols.includes('aksiyon') && (
                      <td style={{ padding: '9px 14px', textAlign: 'left' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: aksiyon.color, background: aksiyon.bg, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                          {aksiyon.label}
                        </span>
                      </td>
                    )}
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
