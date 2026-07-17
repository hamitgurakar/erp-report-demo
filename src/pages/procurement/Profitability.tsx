import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ComposedChart, Line, ReferenceLine, Legend, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { Icon } from '../../components/ui/Icon';
import { FilterBar, type FilterOption } from '../../components/ui/FilterBar';
import { ColumnManager, type ColDef } from '../../components/ui/ColumnManager';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtCompactTRY, fmtMonth } from '../../utils/format';
import {
  categoryMargins, supplierMargins, marginCogsTrend, marginHeatmap,
  negativeMarginSkus, marginBridge, profitSummary, PROC_MONTHS, PROC_CATEGORIES,
} from '../../constants/procurementData';
import type { CategoryMargin, NegativeMarginSku } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  onSelectRep?: (rep: string) => void;
}

const short = (name: string) => name.split(' ')[0];

// Brüt marj % eşik renkleri
const marginClr = (v: number, t: Theme) => (v >= 42 ? t.gn : v >= 38 ? t.tl : v >= 34 ? t.am : t.rd);

export const Profitability = ({ t, l, lang, panels, onAddPanel, onPinTo, onSelectRep }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const tf = (k: string) => i18n.t(`procurement.profit.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  const [catSort, setCatSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'grossMargin', dir: 'asc' });
  const [negSort, setNegSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'margin', dir: 'asc' });

  const ps = profitSummary;
  const bps = tf('bps');

  // ── KPI tanımları (11) ──────────────────────────────────────────────────────
  const kpis: { id: string; title: string; value: string; trend: string; st: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'prof-gm', title: tf('kpi.grossMargin'), value: fmtPercent(ps.grossMargin, 1), trend: '-1,3pp', st: 'down', color: ps.grossMargin >= 35 ? 'gn' : 'am', unit: '%' },
    { id: 'prof-cogs', title: tf('kpi.cogsTrend'), value: fmtCompactTRY(ps.cogsTotal), trend: '+7,2%', st: 'up', color: 'am', unit: '₺' },
    { id: 'prof-cogsrev', title: tf('kpi.cogsToRevenue'), value: fmtPercent(ps.cogsToRevenue, 1), trend: '+1,1pp', st: 'up', color: ps.cogsToRevenue > 65 ? 'rd' : 'am', unit: '%' },
    { id: 'prof-impact', title: tf('kpi.purchasingImpact'), value: `+${fmtNumber(ps.purchasingImpactBps)} ${bps}`, trend: '+18', st: 'up', color: 'gn', unit: bps },
    { id: 'prof-supmargin', title: tf('kpi.marginBySupplier'), value: fmtPercent(ps.avgSupplierMargin, 1), trend: '+0,6pp', st: 'up', color: 'tl', unit: '%' },
    { id: 'prof-catmargin', title: tf('kpi.marginByCategory'), value: fmtPercent(ps.avgCategoryMargin, 1), trend: '-0,4pp', st: 'down', color: 'tl', unit: '%' },
    { id: 'prof-landed', title: tf('kpi.landedErosion'), value: `${fmtNumber(ps.landedErosionBps)} ${bps}`, trend: '-22', st: 'down', color: 'rd', unit: bps },
    { id: 'prof-topsup', title: tf('kpi.topMarginSupplier'), value: short(ps.topMarginSupplier), trend: `${fmtPercent(ps.topMarginValue, 0)}`, st: 'up', color: 'pu', unit: '' },
    { id: 'prof-negskus', title: tf('kpi.negativeMarginSkus'), value: fmtNumber(ps.negativeMarginCount), trend: '+2', st: 'up', color: ps.negativeMarginCount > 0 ? 'rd' : 'gn', unit: '' },
    { id: 'prof-absorb', title: tf('kpi.priceAbsorption'), value: fmtPercent(ps.priceAbsorption, 1), trend: '+2,4pp', st: 'up', color: ps.priceAbsorption > 25 ? 'rd' : 'am', unit: '%' },
    { id: 'prof-gmroi', title: tf('kpi.gmroi'), value: `${fmtNumber(ps.gmroi, 1)}×`, trend: '+0,2', st: 'up', color: 'gn', unit: '' },
  ];

  // ── Filtre barı ─────────────────────────────────────────────────────────────
  const filters: FilterOption[] = [
    { key: 'category', label: tp('cols.category'), options: [...PROC_CATEGORIES] },
    { key: 'supplier', label: tp('cols.supplier'), options: supplierMargins.map((s) => s.supplier) },
    { key: 'period', label: tp('filters.period'), options: i18n.dict.common.datePresets.slice(2, 8) },
  ];

  // ── GÖRSEL 1: Purchase-to-margin bridge waterfall (Cost.tsx SVG dili) ────────
  const waterfall = (() => {
    let running = 0;
    return marginBridge.map((d) => {
      const nm = lang === 'en' ? d.nameEN : d.name;
      if (d.isTotal) { running = d.val; return { nm, val: d.val, base: 0, h: d.val, isTotal: true }; }
      const base = running; running += d.val;
      return { nm, val: d.val, base: d.val > 0 ? base : base + d.val, h: Math.abs(d.val), isTotal: false };
    });
  })();
  const wfRun = (() => {
    const runs: number[] = [];
    let r = 0;
    marginBridge.forEach((d) => { r = d.isTotal ? d.val : r + d.val; runs.push(r); });
    return runs;
  })();
  const wfMax = Math.max(...waterfall.map((b) => b.base + b.h)) * 1.1;
  // Ölçek token'ları Management Overview P&L Waterfall ile aynı (bar 48, gap 12, alan 150, viewBox 210).
  const WF_H = 210;
  const wfBarW = 48;
  const wfGap = 12;
  const wfChartW = waterfall.length * (wfBarW + wfGap) + 20;
  const wfScale = (v: number) => 20 + ((wfMax - v) / wfMax) * 150;

  // ── GÖRSEL 2: Kategori harcama vs marj scatter ──────────────────────────────
  const scatterData = categoryMargins.map((c) => ({ x: Math.round(c.purchaseCost / 1000), y: c.grossMargin, z: c.volume, name: c.category }));

  // ── GÖRSEL 3: Tedarikçi marj katkısı (top/bottom, sorted desc) ──────────────
  const contribData = supplierMargins.map((s) => ({ name: short(s.supplier), value: Math.round(s.marginContribution / 1000), gm: s.grossMargin }));

  // ── Tablo sıralama yardımcıları ─────────────────────────────────────────────
  const sortRows = <T,>(rows: T[], s: { key: string; dir: 'asc' | 'desc' }) =>
    [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[s.key];
      const bv = (b as Record<string, unknown>)[s.key];
      if (typeof av === 'number' && typeof bv === 'number') return s.dir === 'asc' ? av - bv : bv - av;
      return s.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  const handleSort = (setter: typeof setCatSort, key: string) =>
    setter((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));
  const SortIcon = ({ colKey, s }: { colKey: string; s: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon name={s.key === colKey ? (s.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={s.key === colKey ? t.pr : t.tx3} />
  );

  const miniSpark = (vals: number[], color: string) => {
    const min = Math.min(...vals), max = Math.max(...vals);
    const rng = max - min || 1;
    const w = 64, h = 22;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / rng) * h}`).join(' ');
    return (
      <svg width={w} height={h} style={{ display: 'block', margin: '0 auto' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );

  // ── TABLO 1: Kategori karlılık (marj artan, ColumnManager + Excel) ──────────
  const CAT_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'category', label: tf('cols.category'), align: 'left' },
    { key: 'purchaseCost', label: tf('cols.purchaseCost'), align: 'right' },
    { key: 'revenue', label: tf('cols.revenue'), align: 'right' },
    { key: 'grossMargin', label: tf('cols.grossMargin'), align: 'right' },
    { key: 'landedImpactBps', label: tf('cols.landedImpact'), align: 'right' },
    { key: 'trend', label: tf('cols.trend'), align: 'center' },
  ];
  const catColDefs: ColDef[] = CAT_COLS.map((c) => ({ key: c.key, label: c.label }));
  const [catVisible, setCatVisible] = useState<string[]>(CAT_COLS.map((c) => c.key));
  const sortedCats = sortRows(categoryMargins, catSort);

  const renderCatCell = (key: string, c: CategoryMargin) => {
    switch (key) {
      case 'category': return <span style={{ fontWeight: 600, color: t.tx }}>{c.category}</span>;
      case 'purchaseCost': return <span style={{ color: t.tx }}>{fmtCompactTRY(c.purchaseCost)}</span>;
      case 'revenue': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(c.revenue)}</span>;
      case 'grossMargin': return (
        <span style={{ fontSize: 11, fontWeight: 700, color: marginClr(c.grossMargin, t), background: `${marginClr(c.grossMargin, t)}1F`, borderRadius: 5, padding: '2px 8px' }}>
          {fmtPercent(c.grossMargin, 1)}
        </span>
      );
      case 'landedImpactBps': return <span style={{ fontWeight: 600, color: t.rd }}>{fmtNumber(c.landedImpactBps)} {bps}</span>;
      case 'trend': return miniSpark(c.trend, c.trend[c.trend.length - 1] >= c.trend[0] ? t.gn : t.rd);
      default: return null;
    }
  };

  // ── TABLO 2: Negatif marj SKU ───────────────────────────────────────────────
  const sortedNeg = sortRows(negativeMarginSkus, negSort);
  const actionBtn = (label: string, primary?: boolean) => (
    <button style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', border: `1px solid ${primary ? t.pr : t.bd}`, background: primary ? t.pr : t.bg2, color: primary ? '#fff' : t.tx2 }}>{label}</button>
  );
  const NEG_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'sku', label: tf('cols.sku'), align: 'left' },
    { key: 'name', label: tf('cols.product'), align: 'left' },
    { key: 'fullCost', label: tf('cols.fullCost'), align: 'right' },
    { key: 'salePrice', label: tf('cols.salePrice'), align: 'right' },
    { key: 'margin', label: tf('cols.margin'), align: 'right' },
    { key: 'reason', label: tf('cols.reason'), align: 'center' },
    { key: 'action', label: tf('cols.action'), align: 'center' },
  ];
  const renderNegCell = (key: string, s: NegativeMarginSku) => {
    switch (key) {
      case 'sku': return <span style={{ fontWeight: 600, color: t.tx2, fontSize: 11 }}>{s.sku}</span>;
      case 'name': return <span style={{ fontWeight: 600, color: t.tx }}>{s.name}</span>;
      case 'fullCost': return <span style={{ color: t.tx }}>{fmtNumber(s.fullCost)} ₺</span>;
      case 'salePrice': return <span style={{ color: t.tx }}>{fmtNumber(s.salePrice)} ₺</span>;
      case 'margin': return <span style={{ fontWeight: 700, color: t.rd }}>{fmtPercent(s.margin, 1)}</span>;
      case 'reason': return <span style={{ fontSize: 10, fontWeight: 600, color: t.am, background: '#FEF3C7', borderRadius: 5, padding: '2px 8px' }}>{i18n.t(`procurement.profit.reason.${s.reason}`)}</span>;
      case 'action': return (
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
          {actionBtn(tf('reviewPrice'), true)}
          {actionBtn(tf('switchSupplier'))}
        </div>
      );
      default: return null;
    }
  };

  // ── AI uyarıları (3) ────────────────────────────────────────────────────────
  const worstCat = [...categoryMargins].sort((a, b) => a.grossMargin - b.grossMargin)[0];
  const worstNeg = [...negativeMarginSkus].sort((a, b) => a.margin - b.margin)[0];
  const topSup = [...supplierMargins].sort((a, b) => b.grossMargin - a.grossMargin)[0];
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '🔴', border: t.rd,
      text: lang === 'tr'
        ? `${worstCat.category} kategorisinde brüt marj %${fmtNumber(worstCat.grossMargin, 1)}; son 6 ayda %${fmtNumber(worstCat.trend[0], 0)}→%${fmtNumber(worstCat.trend[worstCat.trend.length - 1], 0)}. Kur ve navlun kaynaklı SMM artışı fiyata yansıtılmamış.`
        : `${worstCat.category} gross margin is ${fmtNumber(worstCat.grossMargin, 1)}%; over 6 months ${fmtNumber(worstCat.trend[0], 0)}%→${fmtNumber(worstCat.trend[worstCat.trend.length - 1], 0)}%. FX and freight-driven COGS increases have not been passed to prices.`,
    },
    {
      icon: '⚠️', border: t.am,
      text: lang === 'tr'
        ? `${ps.negativeMarginCount} SKU tam maliyette negatif marjda; en kötü ${worstNeg.name} (%${fmtNumber(worstNeg.margin, 1)}, ${i18n.t(`procurement.profit.reason.${worstNeg.reason}`)}). Fiyat/tedarikçi revizyonu gerekli.`
        : `${ps.negativeMarginCount} SKUs sit at negative margin on full cost; worst is ${worstNeg.name} (${fmtNumber(worstNeg.margin, 1)}%, ${i18n.t(`procurement.profit.reason.${worstNeg.reason}`)}). Price/supplier revision needed.`,
    },
    {
      icon: '✅', border: t.gn,
      text: lang === 'tr'
        ? `${topSup.supplier} en yüksek marj katkısını sağlıyor (%${fmtNumber(topSup.grossMargin, 1)} brüt marj); bu tedarikçiye hacim kaydırma kategori marjını artırabilir.`
        : `${topSup.supplier} delivers the highest margin contribution (${fmtNumber(topSup.grossMargin, 1)}% gross margin); shifting volume here could lift category margin.`,
    },
  ];

  // ── Heatmap renk (marj %) ────────────────────────────────────────────────────
  const heatBg = (v: number) => `${marginClr(v, t)}${v >= 42 ? '2E' : v >= 34 ? '24' : '33'}`;

  return (
    <>
      <FilterBar t={t} l={l} filters={filters} />

      {/* ── Satış marjı çapraz link (Category) ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.bg2, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
        <Icon name="tag" size={15} color={t.tl} />
        <button
          onClick={() => onSelectRep?.('kategori__1')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.pr, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {tf('salesMarginLink')}<Icon name="externalLink" size={12} color={t.pr} />
        </button>
        <span style={{ fontSize: 11.5, color: t.tx3, lineHeight: 1.4 }}>{tf('salesMarginNote')}</span>
      </div>

      {/* ── KPI BANDI (11) ──────────────────────────────────────────────────── */}
      <SectionHeader title={tf('overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1: Purchase-to-margin bridge ─────────────────────────────── */}
      <SectionHeader title={tf('sectionBridge')} t={t} />
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tf('charts.marginBridge')} id="prof-bridge" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            <svg width="100%" viewBox={`0 0 ${wfChartW} ${WF_H}`} style={{ maxWidth: wfChartW, overflow: 'visible' }}>
              {waterfall.map((b, i) => {
                const x = 10 + i * (wfBarW + wfGap);
                const y = wfScale(b.base + b.h);
                const h = (b.h / wfMax) * 150;
                const fill = b.isTotal ? (i === 0 ? t.c1 : t.pr) : b.val < 0 ? t.am : t.gn;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={wfBarW} height={Math.max(h, 2)} rx={4} fill={fill} opacity={b.isTotal ? 1 : 0.85} />
                    <text x={x + wfBarW / 2} y={y - 5} textAnchor="middle" fill={t.tx} fontSize={9} fontWeight={500}>
                      {b.val > 0 && !b.isTotal ? '+' : ''}{fmtCompactTRY(b.val)}
                    </text>
                    <text x={x + wfBarW / 2} y={200} textAnchor="middle" fill={t.tx2} fontSize={8}>
                      {b.nm.length > 16 ? b.nm.slice(0, 15) + '…' : b.nm}
                    </text>
                    {i < waterfall.length - 1 && (
                      <line x1={x + wfBarW} y1={wfScale(wfRun[i])} x2={x + wfBarW + wfGap} y2={wfScale(wfRun[i])} stroke={t.bd} strokeWidth={1} strokeDasharray="3 2" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 2 & 3: Scatter + Tedarikçi katkısı ───────────────────────── */}
      <SectionHeader title={tf('sectionContribution')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tf('charts.spendVsMargin')} id="prof-scatter" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="spend" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${fmtNumber(v / 1000, 1)}M`} label={{ value: tp('cols.spend'), position: 'insideBottom', offset: -8, fontSize: 11, fill: t.tx3 }} />
              <YAxis type="number" dataKey="y" name="margin" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ZAxis type="number" dataKey="z" range={[80, 480]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { x: number; y: number; z: number; name: string };
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: t.tx, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: t.tx2 }}>{tp('cols.spend')}: {fmtCompactTRY(d.x * 1000)}</div>
                      <div style={{ color: t.tx2 }}>{tf('cols.grossMargin')}: {fmtPercent(d.y, 1)}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => <Cell key={i} fill={marginClr(d.y, t)} fillOpacity={0.7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={tf('charts.supplierContribution')} id="prof-contrib" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contribData} layout="vertical" margin={{ top: 5, right: 26, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${fmtNumber(v)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} width={80} axisLine={false} tickLine={false} interval={0} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, _n, p) => [`${fmtCompactTRY(v * 1000)} · ${fmtPercent((p.payload as { gm: number }).gm, 1)}`, tf('kpi.marginBySupplier')]} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {contribData.map((d, i) => <Cell key={i} fill={marginClr(d.gm, t)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 4: Aylık marj% vs SMM dual-axis ──────────────────────────── */}
      <SectionHeader title={tf('sectionTrend')} t={t} />
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tf('charts.marginCogsTrend')} id="prof-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={marginCogsTrend} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth}
                formatter={(v: number, n: string) => n === tf('kpi.grossMargin') ? [fmtPercent(v, 1), n] : [fmtCompactTRY(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="right" dataKey="cogs" name={tf('kpi.cogsTrend')} fill={t.c1} radius={[3, 3, 0, 0]} barSize={30} opacity={0.85} />
              <Line yAxisId="left" type="monotone" dataKey="grossMargin" name={tf('kpi.grossMargin')} stroke={t.pr} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 5: Kategori × ay marj heatmap ────────────────────────────── */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, fontSize: 13, fontWeight: 500, color: t.tx }}>{tf('charts.marginHeatmap')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left', whiteSpace: 'nowrap' }}>{tf('cols.category')}</th>
                {PROC_MONTHS.map((m) => (
                  <th key={m} style={{ padding: '8px 6px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{fmtMonth(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marginHeatmap.map((row) => (
                <tr key={row.category} style={{ borderBottom: `1px solid ${t.bd}` }}>
                  <td style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, color: t.tx, whiteSpace: 'nowrap' }}>{row.category}</td>
                  {row.months.map((v, i) => (
                    <td key={i} style={{ padding: '3px 4px', textAlign: 'center' }}>
                      <div style={{ background: heatBg(v), color: marginClr(v, t), fontSize: 10.5, fontWeight: 600, borderRadius: 4, padding: '5px 0' }}>{fmtNumber(v, 0)}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 1: Kategori karlılık (marj artan) ─────────────────────────── */}
      <SectionHeader title={tf('sectionTables')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tf('charts.profitTable')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={catColDefs} visibleKeys={catVisible} onChange={setCatVisible} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {CAT_COLS.filter((c) => catVisible.includes(c.key)).map((c) => (
                  <th key={c.key} onClick={() => c.key !== 'trend' && handleSort(setCatSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: catSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'trend' ? 'default' : 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}{c.key !== 'trend' && <SortIcon colKey={c.key} s={catSort} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCats.map((c) => (
                <tr key={c.category} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {CAT_COLS.filter((col) => catVisible.includes(col.key)).map((col) => (
                    <td key={col.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: col.align }}>{renderCatCell(col.key, c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: Negatif marj SKU ───────────────────────────────────────── */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tf('charts.negMarginTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {NEG_COLS.map((c) => (
                  <th key={c.key} onClick={() => c.key !== 'action' && handleSort(setNegSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: negSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'action' ? 'default' : 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}{c.key !== 'action' && <SortIcon colKey={c.key} s={negSort} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedNeg.map((s) => (
                <tr key={s.sku} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {NEG_COLS.map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderNegCell(c.key, s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI ÖNERİLERİ (3) ────────────────────────────────────────────────── */}
      <SectionHeader title={tp('aiTitle')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderLeft: `3px solid ${a.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
            <span style={{ fontSize: 12.5, color: t.tx2, lineHeight: 1.5 }}>{a.text}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default Profitability;
