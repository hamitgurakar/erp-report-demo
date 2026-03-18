import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Cell as ScatterCell,
  ComposedChart, ReferenceLine,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../../types';
import {
  catRevData, catMonthlyTrend, stockHealthData, mkCatAlerts,
  productMarginData, stockValueEventsData, salesVelocityData, pricingDiscountData,
  productDecisionData, topBottom5Data,
} from '../../../constants/categoryData';
import { KPICard } from '../../kpi/KPICard';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChartContainer } from '../../ui/ChartContainer';
import { Icon } from '../../ui/Icon';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  dark: boolean;
}

const ICON_MAP: Record<string, string> = { danger: 'alertCircle', warning: 'alertTriangle', info: 'trendUp' };

// Color for product net margin bar
const pctColor = (v: number) => v > 35 ? '#059669' : v > 20 ? '#D97706' : '#DC2626';

// Quadrant color for product decision matrix
const quadrantLabel = (devirHizi: number, marj: number, l: LangStrings, lang: string) => {
  const avgDevir = 5.5; const avgMarj = 28;
  if (devirHizi >= avgDevir && marj >= avgMarj) return lang === 'tr' ? l.olcekle : l.olcekle;
  if (devirHizi < avgDevir && marj >= avgMarj) return lang === 'tr' ? l.fiyatRevize : l.fiyatRevize;
  if (devirHizi >= avgDevir && marj < avgMarj) return lang === 'tr' ? l.promosyon : l.promosyon;
  return lang === 'tr' ? l.tasfiye : l.tasfiye;
};
const decisionColor = (devirHizi: number, marj: number, t: Theme) => {
  const avgDevir = 5.5; const avgMarj = 28;
  if (devirHizi >= avgDevir && marj >= avgMarj) return t.gn;
  if (devirHizi < avgDevir && marj >= avgMarj) return t.c1;
  if (devirHizi >= avgDevir && marj < avgMarj) return t.am;
  return t.rd;
};

export const CategoryOverview = ({ t, l, lang, panels, onAddPanel, onPinTo, dark: _dark }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const alerts = mkCatAlerts(l);

  const colorMap = { danger: t.rd, warning: t.am, info: t.gn };
  const bgMap = { danger: t.rdL, warning: t.amL, info: t.gnL };

  const stockHealthLabels: Record<string, string> = {
    saglikli: l.stokSaglikli,
    fazla: l.stokFazla,
    kritik: l.stokKritik,
    olu: l.stokOlu,
  };

  const top10Sorted = [...catRevData].sort((a, b) => b.value - a.value).slice(0, 10);

  // Product margin bar colors
  const productMarginColored = productMarginData.map((d) => ({ ...d, fill: pctColor(d.netMarj) }));

  // Decision matrix quadrant reference lines at averages
  const avgDevir = 5.5;
  const avgMarj = 28;

  return (
    <>
      {/* Section header */}
      <SectionHeader title={l.katOzet} t={t} />

      {/* A1: 6 big KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="kat-kpi-netsatis" title={l.netSatisCirosu} value="2.48M ₺" trendValue="+12.4%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kat-kpi-cogs" title={l.cogs} value="1.62M ₺" trendValue="+4.2%" sparkTrend="up" color="am" unit="K ₺" big info={l.cogsInfo} {...kp} />
        <KPICard id="kat-kpi-brutkar" title={l.brutKarDeger} value="860K ₺" trendValue="+8.1%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kat-kpi-netkar" title={l.netKarDeger} value="425K ₺" trendValue="+15.2%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kat-kpi-brutmarj" title={l.katBrutMarj} value="%34.7" trendValue="-0.4%" sparkTrend="down" color="am" unit="%" big info={l.katBrutMarjInfo} {...kp} />
        <KPICard id="kat-kpi-netmarj" title={l.katNetMarj} value="%17.1" trendValue="+2.1%" sparkTrend="up" color="gn" unit="%" big info={l.katNetMarjInfo} {...kp} />
      </div>

      {/* 6 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kat-kpi-katSayisi" title={l.katKategoriSayisi} value="24" trendValue="+2" sparkTrend="up" color="c2" unit="adet" info={l.katKategoriSayisiInfo} {...kp} />
        <KPICard id="kat-kpi-altkat" title={l.katAltKategori} value="156" trendValue="+8" sparkTrend="up" color="c2" unit="adet" info={l.katAltKategoriInfo} {...kp} />
        <KPICard id="kat-kpi-ortsepet" title={l.katOrtSepet} value="487 ₺" trendValue="+6.2%" sparkTrend="up" color="gn" unit="₺" info={l.katOrtSepetInfo} {...kp} />
        <KPICard id="kat-kpi-ortfiyat" title={l.katOrtUrunFiyat} value="342 ₺" trendValue="+4.7%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="kat-kpi-iade" title={l.katIadeOrani} value="%3.8" trendValue="-0.4%" sparkTrend="down" color="rd" unit="%" info={l.katIadeOraniInfo} {...kp} />
        <KPICard id="kat-kpi-stoksatis" title={l.katStokSatis} value="2.1 ay" trendValue="-0.2 ay" sparkTrend="down" color="co" unit="ay" info={l.katStokSatisInfo} {...kp} />
      </div>

      {/* Charts row 1: Category revenue + Monthly trend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.katCiroDagilim} id="kat-chart-ciro" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10Sorted} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                cursor={{ fill: t.hoverBg }}
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Ciro' : 'Revenue'}: <b>{payload[0].value}K ₺</b></div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Marj' : 'Margin'}: <b>{payload[0].payload.margin}%</b></div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" fill={t.pr} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.katAylikTrend} id="kat-chart-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ flex: 1.2 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={catMonthlyTrend}>
              <defs>
                {[t.pr, t.tl, t.gn, t.am, t.rd, t.tx3].map((color, i) => (
                  <linearGradient key={i} id={`kat-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip cursor={{ stroke: t.bd }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="elektronik" name="Elektronik" stroke={t.pr} fill={`url(#kat-grad-0)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Area type="monotone" dataKey="kozmetik" name="Kozmetik" stroke={t.tl} fill={`url(#kat-grad-1)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Area type="monotone" dataKey="evYasam" name="Ev & Yaşam" stroke={t.gn} fill={`url(#kat-grad-2)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Area type="monotone" dataKey="gida" name="Gıda" stroke={t.am} fill={`url(#kat-grad-3)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Area type="monotone" dataKey="tekstil" name="Tekstil" stroke={t.rd} fill={`url(#kat-grad-4)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Area type="monotone" dataKey="diger" name="Diğer" stroke={t.tx3} fill={`url(#kat-grad-5)`} strokeWidth={1.8} dot={false} stackId="s" />
              <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts row 2: Stock health + ABC summary + Alerts */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {/* Stock health donut */}
        <ChartContainer t={t} l={l} title={l.katStokSaglik} id="kat-chart-stoksaglik" info={l.katStokSaglikInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={stockHealthData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                    {stockHealthData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.tx }}>1,247</div>
                <div style={{ fontSize: 10, color: t.tx2 }}>SKU</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stockHealthData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.tx2 }}>{stockHealthLabels[d.name]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginLeft: 'auto' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>

        {/* ABC summary — A3: detailed info tooltip */}
        <ChartContainer t={t} l={l} title={l.katAbcOzet} id="kat-chart-abc" info={l.katAbcInfoDetay} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: l.katAGrubu, sku: '142 SKU', pct: '%78', val: '1.42M ₺', color: t.gn, bg: t.gnL },
              { label: l.katBGrubu, sku: '318 SKU', pct: '%17', val: '309K ₺', color: t.am, bg: t.amL },
              { label: l.katCGrubu, sku: '787 SKU', pct: '%5', val: '91K ₺', color: t.rd, bg: t.rdL },
            ].map((g) => (
              <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: g.bg, border: `1px solid ${g.color}22` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: g.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: g.color, flexShrink: 0 }}>
                  {g.label[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.tx2, marginBottom: 2 }}>{g.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.tx }}>{g.val}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: g.color }}>{g.pct}</div>
                  <div style={{ fontSize: 10, color: t.tx3 }}>{g.sku}</div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Category alerts */}
        <div style={{ flex: 1.2, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: t.tx, marginBottom: 12 }}>{l.katUyarilar}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => {
              const c = colorMap[a.type];
              const bg = bgMap[a.type];
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 11px', borderRadius: 8, background: bg, border: `1px solid ${c}22` }}>
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    <Icon name={ICON_MAP[a.type]} size={14} color={c} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: t.tx2, lineHeight: 1.4 }}>{a.desc}</div>
                    <button style={{ marginTop: 5, fontSize: 10, color: c, background: 'transparent', border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 500 }}>
                      {a.action} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* A2: New charts row 1 — Product Margin + Stok Segmentler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Ürün Bazlı Net Marj % */}
        <ChartContainer t={t} l={l} title={l.urunBazliNetMarj} id="kat-chart-urunmarj" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            {[{ label: '>35%', color: '#059669' }, { label: '20–35%', color: '#D97706' }, { label: '<20%', color: '#DC2626' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: t.tx2 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={productMarginColored} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 50]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, lang === 'tr' ? 'Net Marj' : 'Net Margin']} />
              <Bar dataKey="netMarj" radius={[0, 4, 4, 0]}>
                {productMarginColored.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stok Sağlığı & Segmentler */}
        <ChartContainer t={t} l={l} title={l.stokSagligiSegment} id="kat-chart-stoksegment" info={l.stokSagligiSegmentInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          {/* 5 mini KPI strip */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {[
              { label: lang === 'tr' ? 'Toplam' : 'Total', value: '18,420' },
              { label: lang === 'tr' ? 'Kullanılabilir' : 'Available', value: '11,205', color: '#059669' },
              { label: lang === 'tr' ? 'Rezerve' : 'Reserved', value: '5,410', color: t.c1 },
              { label: lang === 'tr' ? 'Güvenlik' : 'Safety', value: '1,805', color: t.am },
              { label: lang === 'tr' ? 'Değer' : 'Value', value: '1.8M ₺', color: t.pr },
            ].map((item) => (
              <div key={item.label} style={{ flex: 1, minWidth: 60, background: t.bg2, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: t.tx2 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color ?? t.tx }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* Segmentation bar */}
          <div style={{ height: 20, borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
            <div style={{ flex: 60.8, background: '#059669' }} title={`${lang === 'tr' ? 'Kullanılabilir' : 'Available'}: 11,205`} />
            <div style={{ flex: 29.4, background: t.c1 }} title={`${lang === 'tr' ? 'Rezerve' : 'Reserved'}: 5,410`} />
            <div style={{ flex: 9.8, background: t.am }} title={`${lang === 'tr' ? 'Güvenlik' : 'Safety'}: 1,805`} />
          </div>
          <div style={{ display: 'flex', gap: 6, fontSize: 10, color: t.tx2, marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#059669' }} />{lang === 'tr' ? 'Kullanılabilir' : 'Available'} 60.8%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: t.c1 }} />{lang === 'tr' ? 'Rezerve' : 'Reserved'} 29.4%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: t.am }} />{lang === 'tr' ? 'Güvenlik' : 'Safety'} 9.8%</span>
          </div>
          {/* Warehouse utilization */}
          {[{ label: 'Depo A', pct: 85, color: t.gn }, { label: 'Depo B', pct: 42, color: t.am }].map((depo) => (
            <div key={depo.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: t.tx2, minWidth: 52 }}>{depo.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: t.bg2, overflow: 'hidden' }}>
                <div style={{ width: `${depo.pct}%`, height: '100%', background: depo.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: depo.color }}>{depo.pct}% {lang === 'tr' ? 'Kul.' : 'Used'}</span>
            </div>
          ))}
        </ChartContainer>
      </div>

      {/* A2: New charts row 2 — Stok Değeri & Olaylar + Verimlilik */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Stok Değeri & Olaylar */}
        <ChartContainer t={t} l={l} title={l.stokDegeriOlaylar} id="kat-chart-stokdeg" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stockValueEventsData}>
              <defs>
                <linearGradient id="kat-stokdeg-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.tl} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={t.tl} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="deger" name={lang === 'tr' ? 'Stok Değeri (K ₺)' : 'Stock Value (K ₺)'} stroke={t.tl} fill="url(#kat-stokdeg-grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: t.am, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="trendUp" size={12} color={t.am} />
            {l.stokDegeriOlaylarInsight}
          </div>
        </ChartContainer>

        {/* Verimlilik: Devir & DOH */}
        <ChartContainer t={t} l={l} title={l.verimlilikDevirDOH} id="kat-chart-devirdoh" info={l.verimlilikInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', height: 140 }}>
            {/* Stok Devir Gauge-like bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.gn }}>6.2x</div>
              <div style={{ fontSize: 10, color: t.tx2 }}>{lang === 'tr' ? 'Stok Devir' : 'Turnover'}</div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: t.bg2, overflow: 'hidden' }}>
                <div style={{ width: `${(6.2 / 12) * 100}%`, height: '100%', background: t.gn, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Hedef 6x' : 'Target 6x'}</div>
            </div>
            <div style={{ width: 1, background: t.bd }} />
            {/* DOH bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.am }}>43</div>
              <div style={{ fontSize: 10, color: t.tx2 }}>{lang === 'tr' ? 'Elde Tutma Günü' : 'Days on Hand'}</div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: t.bg2, overflow: 'hidden' }}>
                <div style={{ width: `${(43 / 90) * 100}%`, height: '100%', background: t.am, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Hedef <30 gün' : 'Target <30 days'}</div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* A2: New charts row 3 — Fiyatlama & İskonto + Kanal Performans */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Fiyatlama & İskonto Bütünlüğü */}
        <ChartContainer t={t} l={l} title={l.fiyatlamaIskonto} id="kat-chart-fiyat" info={l.fiyatlamaInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={pricingDiscountData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[8, 16]} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="listeFiyat" name={l.listeFiyati} fill={t.pr} opacity={0.5} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="gerceklesen" name={l.gerceklesenFiyat} fill={t.tl} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="iskonto" name={lang === 'tr' ? 'İskonto %' : 'Discount %'} stroke={t.rd} strokeWidth={2} dot={{ r: 3, fill: t.rd }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Kanal Performans Kırılımı */}
        <ChartContainer t={t} l={l} title={l.kanalPerfKirilimi} id="kat-chart-kanal" info={l.kanalPerfKirilimInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', gap: 12, height: 140 }}>
            {[
              { label: 'B2B Direkt', value: '1.42M ₺', trend: '+18.2%', color: t.pr, bg: t.prL ?? t.bg2 },
              { label: 'B2C Perakende', value: '1.06M ₺', trend: '+2.4%', color: t.tl, bg: t.gnL },
            ].map((ch) => (
              <div key={ch.label} style={{ flex: 1, background: ch.bg, border: `1px solid ${ch.color}22`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: t.tx2 }}>{ch.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: ch.color }}>{ch.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.gn, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="trendUp" size={12} color={t.gn} />
                  {ch.trend}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* A2: Satış Hız Endeksi (full-width) */}
      <ChartContainer t={t} l={l} title={l.satisHizEndeksi} id="kat-chart-satishiz" info={l.satisHizInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={salesVelocityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="ciro" name={lang === 'tr' ? 'Ciro (K ₺)' : 'Revenue (K ₺)'} stroke={t.pr} strokeWidth={2.5} dot={{ r: 4, fill: t.pr }} />
            <Line yAxisId="right" type="monotone" dataKey="adet" name={lang === 'tr' ? 'Satış Adedi (B)' : 'Sales Volume (K)'} stroke={t.tl} strokeWidth={2.5} dot={{ r: 4, fill: t.tl }} strokeDasharray="5 3" />
            <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* A2: Kategori Karar Matrisi (full-width) */}
      <ChartContainer t={t} l={l} title={l.urunKararMatrisi} id="kat-chart-kararmatris" info={l.urunKararMatrisInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          {/* Quadrant labels — inside chart plot area, margin-aware */}
          <div style={{ position: 'absolute', top: 6, right: 36, fontSize: 10, color: t.gn, fontWeight: 600, opacity: 0.7 }}>{lang === 'tr' ? '★ Ölçekle' : '★ Scale'}</div>
          <div style={{ position: 'absolute', top: 6, left: 56, fontSize: 10, color: t.c1, fontWeight: 600, opacity: 0.7 }}>{lang === 'tr' ? '◆ Fiyat Revize' : '◆ Reprice'}</div>
          <div style={{ position: 'absolute', bottom: 40, right: 36, fontSize: 10, color: t.am, fontWeight: 600, opacity: 0.7 }}>{lang === 'tr' ? '▲ Promosyon' : '▲ Promote'}</div>
          <div style={{ position: 'absolute', bottom: 40, left: 56, fontSize: 10, color: t.rd, fontWeight: 600, opacity: 0.7 }}>{lang === 'tr' ? '▼ Tasfiye' : '▼ Liquidate'}</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 30, right: 40, bottom: 36, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis
                type="number" dataKey="devirHizi" name={lang === 'tr' ? 'Devir Hızı (x)' : 'Turnover (x)'}
                tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                label={{ value: lang === 'tr' ? 'Devir Hızı (x)' : 'Turnover (x)', position: 'insideBottom', offset: -12, fontSize: 10, fill: t.tx3 }}
              />
              <YAxis
                type="number" dataKey="marj" name="Marj %"
                tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false}
                label={{ value: 'Marj %', angle: -90, position: 'insideLeft', fontSize: 10, fill: t.tx3 }}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Devir' : 'Turnover'}: <b>{payload[0].payload.devirHizi}x</b></div>
                      <div style={{ color: t.tx2 }}>Marj: <b>{payload[0].payload.marj}%</b></div>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine x={avgDevir} stroke={t.tx3} strokeDasharray="4 3" strokeWidth={1} />
              <ReferenceLine y={avgMarj} stroke={t.tx3} strokeDasharray="4 3" strokeWidth={1} />
              {/* Single Scatter with custom shape: per-point color + name label above */}
              <Scatter
                data={productDecisionData}
                shape={(props: { cx?: number; cy?: number; payload?: { name: string; devirHizi: number; marj: number } }) => {
                  const { cx = 0, cy = 0, payload } = props;
                  if (!payload) return <g />;
                  const fill = decisionColor(payload.devirHizi, payload.marj, t);
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.85} />
                      <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fill={t.tx} fontWeight={500}>
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

      {/* A2: Top/Bottom 5 + Kritik Riskler */}
      <ChartContainer t={t} l={l} title={l.topBottomPerformans} id="kat-chart-topbottom" info={l.topBottomInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Top 5 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.gn, marginBottom: 8 }}>Top 5</div>
            {topBottom5Data.top5.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: t.gn, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: t.tx, flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.gn }}>{item.marj.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div style={{ width: 1, background: t.bd }} />
          {/* Bottom 5 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.rd, marginBottom: 8 }}>Bottom 5</div>
            {topBottom5Data.bottom5.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: t.rd, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: t.tx, flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.rd }}>{item.marj.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div style={{ width: 1, background: t.bd }} />
          {/* Critical risks */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>{l.kritikRiskler}</div>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: t.rdL, border: `1px solid ${t.rd}22`, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.rd }}>{l.stokTukenmeUyarisi}</div>
              <div style={{ fontSize: 10, color: t.tx2, marginTop: 2 }}>{lang === 'tr' ? 'Gaming Laptop X500 — 2 gün kaldı' : 'Gaming Laptop X500 — 2 days left'}</div>
            </div>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: t.amL, border: `1px solid ${t.am}22` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.am }}>{l.marjErozyonu}</div>
              <div style={{ fontSize: 10, color: t.tx2, marginTop: 2 }}>{lang === 'tr' ? 'Gıda kategorisi -3.2pp marj kaybı' : 'Food category -3.2pp margin loss'}</div>
            </div>
          </div>
        </div>
      </ChartContainer>
    </>
  );
};
