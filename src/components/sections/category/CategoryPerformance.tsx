import { useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  LineChart, Legend,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../../types';
import {
  catScatterData, catRevMarjTrend, catMonthlyTrend, perfTableData, revenueShareTableData,
} from '../../../constants/categoryData';
import type { RevShareRow } from '../../../constants/categoryData';
import { KPICard } from '../../kpi/KPICard';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChartContainer } from '../../ui/ChartContainer';
import { FilterBar, type FilterOption } from '../../ui/FilterBar';
import { ExpandableTable } from '../../ui/ExpandableTable';
import { Spark } from '../../ui/Spark';
import { Icon } from '../../ui/Icon';
import { mkSpk } from '../../../constants/data';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// Avg ciro & brutMarj for quadrant lines
const AVG_CIRO = Math.round(catScatterData.reduce((s, d) => s + d.ciro, 0) / catScatterData.length);
const AVG_MARJ = Math.round(catScatterData.reduce((s, d) => s + d.brutMarj, 0) / catScatterData.length);

// Category keys and display labels for interactive trend chart
const CAT_KEYS = ['elektronik', 'kozmetik', 'evYasam', 'gida', 'tekstil', 'diger'] as const;
type CatKey = typeof CAT_KEYS[number];

const CAT_LABELS: Record<CatKey, string> = {
  elektronik: 'Elektronik',
  kozmetik: 'Kozmetik',
  evYasam: 'Ev & Yaşam',
  gida: 'Gıda',
  tekstil: 'Tekstil',
  diger: 'Diğer',
};

const catColorFn = (key: CatKey, t: Theme): string => {
  const map: Record<CatKey, string> = {
    elektronik: t.pr,
    kozmetik: t.tl,
    evYasam: t.gn,
    gida: t.am,
    tekstil: t.rd,
    diger: t.tx3,
  };
  return map[key];
};

// Determine trend direction of a category (last 2 months)
const catTrendDir = (key: CatKey): 'up' | 'down' => {
  const last = catMonthlyTrend[catMonthlyTrend.length - 1] as Record<string, number>;
  const prev = catMonthlyTrend[catMonthlyTrend.length - 2] as Record<string, number>;
  return last[key] > prev[key] ? 'up' : 'down';
};

// Sort state type
interface SortState { key: keyof RevShareRow; dir: 'asc' | 'desc' }

// Scatter quadrant color
const scatterFill = (ciro: number, brutMarj: number, t: Theme): string => {
  if (ciro >= AVG_CIRO && brutMarj >= AVG_MARJ) return t.gn;
  if (ciro < AVG_CIRO && brutMarj >= AVG_MARJ) return t.tl;
  if (ciro >= AVG_CIRO && brutMarj < AVG_MARJ) return t.am;
  return t.rd;
};

export const CategoryPerformance = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  // ── C6: Interactive monthly trend state ──────────────────────────────────────
  const [activeCategories, setActiveCategories] = useState<CatKey[]>([...CAT_KEYS]);
  const [trendSearch, setTrendSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState<'all' | 'buyume' | 'kucülme'>('all');

  const toggleCategory = (key: CatKey) => {
    setActiveCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyTrendFilter = (filter: 'buyume' | 'kucülme') => {
    if (trendFilter === filter) {
      setTrendFilter('all');
      setActiveCategories([...CAT_KEYS]);
    } else {
      setTrendFilter(filter);
      setActiveCategories(
        CAT_KEYS.filter((k) => catTrendDir(k) === (filter === 'buyume' ? 'up' : 'down'))
      );
    }
  };

  const visibleChips = CAT_KEYS.filter((k) =>
    !trendSearch || CAT_LABELS[k].toLowerCase().includes(trendSearch.toLowerCase())
  );

  // ── C4: Revenue share table sort state ───────────────────────────────────────
  const [revSort, setRevSort] = useState<SortState | null>(null);

  const handleRevSort = (key: keyof RevShareRow) => {
    setRevSort((prev) =>
      prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' }
    );
  };

  const sortedRevData = revSort
    ? [...revenueShareTableData].sort((a, b) => {
        const av = a[revSort.key] as number;
        const bv = b[revSort.key] as number;
        return revSort.dir === 'asc' ? av - bv : bv - av;
      })
    : revenueShareTableData;

  const filters: FilterOption[] = [
    { key: 'kategori', label: l.filtreKategori, options: ['Elektronik', 'Kozmetik', 'Ev & Yaşam', 'Gıda', 'Tekstil', 'Spor'] },
    { key: 'altKategori', label: l.filtreAltKategori, options: ['Laptop', 'Telefon', 'Cilt Bakımı', 'Makyaj'] },
    { key: 'urun', label: l.filtreUrun, options: ['Tüm Ürünler'] },
    { key: 'kanal', label: l.filtreKanal, options: ['B2B', 'B2C'] },
  ];

  // ── Sort icon helper ──────────────────────────────────────────────────────────
  const SortIcon = ({ colKey }: { colKey: keyof RevShareRow }) => (
    <Icon
      name={revSort?.key === colKey ? (revSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'}
      size={10}
      color={revSort?.key === colKey ? t.pr : t.tx3}
    />
  );

  return (
    <>
      <SectionHeader title={l.katPerf} t={t} />

      {/* Filter bar */}
      <FilterBar t={t} l={l} filters={filters} />

      {/* C7: 6 big KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="perf-kpi-netsatis" title={l.netSatisCirosu} value="2.48M ₺" trendValue="+12.4%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="perf-kpi-cogs" title={l.cogs} value="1.62M ₺" trendValue="+4.2%" sparkTrend="up" color="am" unit="K ₺" big info={l.cogsInfo} {...kp} />
        <KPICard id="perf-kpi-brutkar" title={l.brutKarDeger} value="860K ₺" trendValue="+8.1%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="perf-kpi-netkar" title={l.netKarDeger} value="425K ₺" trendValue="+15.2%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="perf-kpi-brutmarj" title={l.katBrutMarj} value="%34.7" trendValue="-0.4%" sparkTrend="down" color="am" unit="%" big info={l.katBrutMarjInfo} {...kp} />
        <KPICard id="perf-kpi-netmarj" title={l.katNetMarj} value="%17.1" trendValue="+2.1%" sparkTrend="up" color="gn" unit="%" big info={l.katNetMarjInfo} {...kp} />
      </div>

      {/* C7: 6 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="perf-kpi-katSayisi" title={l.katKategoriSayisi} value="24" trendValue="+2" sparkTrend="up" color="c2" unit="adet" info={l.katKategoriSayisiInfo} {...kp} />
        <KPICard id="perf-kpi-altkat" title={l.katAltKategori} value="156" trendValue="+8" sparkTrend="up" color="c2" unit="adet" info={l.katAltKategoriInfo} {...kp} />
        <KPICard id="perf-kpi-ortsepet" title={l.katOrtSepet} value="487 ₺" trendValue="+6.2%" sparkTrend="up" color="gn" unit="₺" info={l.katOrtSepetInfo} {...kp} />
        <KPICard id="perf-kpi-ortfiyat" title={l.katOrtUrunFiyat} value="342 ₺" trendValue="+4.7%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="perf-kpi-iade" title={l.katIadeOrani} value="%3.8" trendValue="-0.4%" sparkTrend="down" color="rd" unit="%" info={l.katIadeOraniInfo} {...kp} />
        <KPICard id="perf-kpi-stoksatis" title={l.katStokSatis} value="2.1 ay" trendValue="-0.2 ay" sparkTrend="down" color="co" unit="ay" info={l.katStokSatisInfo} {...kp} />
      </div>

      {/* 4 big KPIs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <KPICard id="kat-perf-enkarli" title={l.katEnKarli} value="Elektronik" trendValue="%38.2 marj" sparkTrend="up" color="gn" unit="%" big {...kp} />
        <KPICard id="kat-perf-enhizli" title={l.katEnHizli} value="Kozmetik" trendValue="+24% MoM" sparkTrend="up" color="tl" unit="%" big {...kp} />
        <KPICard id="kat-perf-endusukmarj" title={l.katEnDusukMarj} value="Gıda" trendValue="%12.1 marj" sparkTrend="down" color="rd" unit="%" big {...kp} />
        <KPICard id="kat-perf-negbuyume" title={l.katNegatifBuyume} value="Tekstil" trendValue="-8.3%" sparkTrend="down" color="rd" unit="%" big {...kp} />
      </div>

      {/* Expandable hierarchical table */}
      <div style={{ marginBottom: 16 }}>
        <ExpandableTable t={t} l={l} data={perfTableData} lang={lang} />
      </div>

      {/* C3: Profitability matrix — full-width single row */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.katKarlilikMatris} id="kat-chart-matris" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} info={l.katKarlilikMatrisInfo}>
          {/* Quadrant labels */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
              <div style={{ position: 'absolute', top: 12, right: 32, fontSize: 10, color: t.gn, fontWeight: 600, opacity: 0.6 }}>
                {lang === 'tr' ? '★ Yıldız' : '★ Star'}
              </div>
              <div style={{ position: 'absolute', top: 12, left: 60, fontSize: 10, color: t.tl, fontWeight: 600, opacity: 0.6 }}>
                {lang === 'tr' ? '◆ Niş Yıldız' : '◆ Niche Star'}
              </div>
              <div style={{ position: 'absolute', bottom: 28, right: 32, fontSize: 10, color: t.am, fontWeight: 600, opacity: 0.6 }}>
                {lang === 'tr' ? '▲ Büyüme Fırsatı' : '▲ Growth Opp.'}
              </div>
              <div style={{ position: 'absolute', bottom: 28, left: 60, fontSize: 10, color: t.rd, fontWeight: 600, opacity: 0.6 }}>
                {lang === 'tr' ? '▼ Sorgulanabilir' : '▼ Questionable'}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 30, right: 40, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
                <XAxis
                  type="number" dataKey="ciro" name={lang === 'tr' ? 'Ciro' : 'Revenue'}
                  tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false}
                  label={{ value: lang === 'tr' ? 'Ciro (K ₺)' : 'Revenue (K ₺)', position: 'insideBottom', offset: -10, fontSize: 10, fill: t.tx3 }}
                />
                <YAxis
                  type="number" dataKey="brutMarj" name="Marj %"
                  tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false}
                  label={{ value: 'Marj %', angle: -90, position: 'insideLeft', fontSize: 10, fill: t.tx3 }}
                />
                <ZAxis type="number" dataKey="skuSayisi" range={[60, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.name}</div>
                        <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Ciro' : 'Revenue'}: <b>{payload[0].payload.ciro}K ₺</b></div>
                        <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Brüt Marj' : 'Gross Margin'}: <b>{payload[0].payload.brutMarj}%</b></div>
                        <div style={{ color: t.tx2 }}>SKU: <b>{payload[0].payload.skuSayisi}</b></div>
                      </div>
                    ) : null
                  }
                />
                {/* Quadrant reference lines */}
                <ReferenceLine x={AVG_CIRO} stroke={t.tx3} strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceLine y={AVG_MARJ} stroke={t.tx3} strokeDasharray="4 4" strokeWidth={1.5} />
                {/* Per-point color via custom shape + text label */}
                <Scatter
                  data={catScatterData}
                  shape={(props: { cx?: number; cy?: number; payload?: { name: string; ciro: number; brutMarj: number; skuSayisi: number } }) => {
                    const { cx = 0, cy = 0, payload } = props;
                    if (!payload) return <g />;
                    const fill = scatterFill(payload.ciro, payload.brutMarj, t);
                    const r = Math.sqrt(payload.skuSayisi) * 0.75 + 6;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.82} stroke={fill} strokeWidth={1} />
                        <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={10} fill={t.tx} fontWeight={500}>
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

      {/* Row: Revenue & Margin trend + C4 Revenue share change table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Revenue & margin trend (kept) */}
        <ChartContainer t={t} l={l} title={l.katCiroMarjTrend} id="kat-chart-ciromarj" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={catRevMarjTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[25, 40]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="ciro" name={lang === 'tr' ? 'Ciro (K ₺)' : 'Revenue (K ₺)'} fill={t.pr} radius={[3, 3, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="marj" name={lang === 'tr' ? 'Marj %' : 'Margin %'} stroke={t.tl} strokeWidth={2.2} dot={{ r: 4, fill: t.tl }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* C4: Revenue share change table */}
        <ChartContainer t={t} l={l} title={l.ciroPaylDegisim} id="kat-chart-pay" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} info={l.ciroPaylDegisimInfo}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.tx2, whiteSpace: 'nowrap' }}>
                    {lang === 'tr' ? 'Kategori' : 'Category'}
                  </th>
                  {([
                    { key: 'buAyCiro' as const, label: l.buyuAy + ' (K ₺)' },
                    { key: 'buAyPay' as const, label: l.buyuAy + ' %' },
                    { key: 'gecenAyCiro' as const, label: l.gecenAy + ' (K ₺)' },
                    { key: 'gecenAyPay' as const, label: l.gecenAy + ' %' },
                    { key: 'degisim' as const, label: l.degisimPp },
                  ] as { key: keyof RevShareRow; label: string }[]).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleRevSort(key)}
                      style={{ padding: '7px 10px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: revSort?.key === key ? t.pr : t.tx2, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        {label}
                        <SortIcon colKey={key} />
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: t.tx2, whiteSpace: 'nowrap' }}>
                    {lang === 'tr' ? 'Trend' : 'Trend'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRevData.map((row) => {
                  const degisimColor = row.degisim > 0 ? t.gn : row.degisim < 0 ? t.rd : t.am;
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: `1px solid ${t.bd}` }}
                      onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                      onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '8px 10px', color: t.tx, fontWeight: 500 }}>{row.kategori}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: t.tx }}>{row.buAyCiro.toLocaleString('tr-TR')} K</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: t.tx }}>{row.buAyPay.toFixed(1)}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: t.tx2 }}>{row.gecenAyCiro.toLocaleString('tr-TR')} K</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: t.tx2 }}>{row.gecenAyPay.toFixed(1)}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: degisimColor }}>
                        {row.degisim > 0 ? '+' : ''}{row.degisim.toFixed(1)} pp
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <Spark
                          data={mkSpk(row.sparkTrend, 'K ₺', lang)}
                          color={row.sparkTrend === 'up' ? t.gn : row.sparkTrend === 'down' ? t.rd : t.am}
                          t={t}
                          compact
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      </div>

      {/* C6: Interactive monthly revenue trend — full-width */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer
          t={t} l={l} title={l.katAylikCiroTrend ?? (lang === 'tr' ? 'Aylık Ciro Trendi' : 'Monthly Revenue Trend')}
          id="kat-chart-aylik" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}
        >
          {/* Toolbar: search + filter buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            {/* Search input */}
            <div style={{ position: 'relative', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', left: 8, pointerEvents: 'none', zIndex: 1 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={trendSearch}
                onChange={(e) => setTrendSearch(e.target.value)}
                placeholder={lang === 'tr' ? 'Kategori ara...' : 'Search category...'}
                style={{
                  paddingLeft: 28, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
                  borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2,
                  fontSize: 12, color: t.tx, outline: 'none', width: 150,
                }}
              />
            </div>
            {/* Filter buttons */}
            <button
              onClick={() => applyTrendFilter('buyume')}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                border: `1px solid ${trendFilter === 'buyume' ? t.gn : t.bd}`,
                background: trendFilter === 'buyume' ? t.gnL : t.bg2,
                color: trendFilter === 'buyume' ? t.gn : t.tx2,
              }}
            >
              ▲ {l.buyumeTrendi}
            </button>
            <button
              onClick={() => applyTrendFilter('kucülme')}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                border: `1px solid ${trendFilter === 'kucülme' ? t.rd : t.bd}`,
                background: trendFilter === 'kucülme' ? t.rdL : t.bg2,
                color: trendFilter === 'kucülme' ? t.rd : t.tx2,
              }}
            >
              ▼ {l.kuculmeTrendi}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={catMonthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {CAT_KEYS.filter((k) => activeCategories.includes(k)).map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={CAT_LABELS[k]}
                  stroke={catColorFn(k, t)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {visibleChips.map((k) => {
              const isActive = activeCategories.includes(k);
              const color = catColorFn(k, t);
              return (
                <button
                  key={k}
                  onClick={() => toggleCategory(k)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${isActive ? color : t.bd}`,
                    background: isActive ? color + '18' : t.bg2,
                    color: isActive ? color : t.tx3,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? color : t.tx3, display: 'inline-block', flexShrink: 0 }} />
                  {CAT_LABELS[k]}
                </button>
              );
            })}
          </div>
        </ChartContainer>
      </div>
    </>
  );
};
