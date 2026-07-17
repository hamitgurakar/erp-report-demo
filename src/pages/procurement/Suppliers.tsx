import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell, LineChart, Line, Legend,
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
  suppliers, supplierHHI, singleSourceItems,
  supplierLeadTimeTrend, leadTimeTrendSuppliers,
  defectTrendByCategory, defectTrendCategories,
  PROC_CATEGORIES,
} from '../../constants/procurementData';
import type { Supplier } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

const short = (name: string) => name.split(' ')[0];
const avg = (f: (s: Supplier) => number) => suppliers.reduce((s, x) => s + f(x), 0) / suppliers.length;

// ── Eşik renk yardımcıları ──────────────────────────────────────────────────
const otifClr = (v: number, t: Theme) => (v >= 95 ? t.gn : v >= 90 ? t.am : t.rd);
const defectClr = (v: number, t: Theme) => (v < 300 ? t.gn : v < 500 ? t.am : t.rd);
const leadClr = (v: number, t: Theme) => (v <= 12 ? t.gn : v <= 20 ? t.am : t.rd);
const ppvClr = (v: number, t: Theme) => (v <= 0 ? t.gn : v <= 3 ? t.am : t.rd);
const spiClr = (v: number, t: Theme) => (v >= 85 ? t.gn : v >= 72 ? t.tl : v >= 60 ? t.am : t.rd);

const STATUS_COLOR: Record<Supplier['status'], { c: keyof Theme; bg: string }> = {
  iyi: { c: 'gn', bg: '#DCFCE7' },
  izle: { c: 'tl', bg: '#CCFBF1' },
  uyari: { c: 'am', bg: '#FEF3C7' },
  acil: { c: 'rd', bg: '#FEE2E2' },
};

const DONUT_COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#0D9488', '#14B8A6', '#F59E0B', '#EC4899', '#94A3B8'];

export const Suppliers = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  const [tableSort, setTableSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'spiScore', dir: 'asc' });
  const [ssSort, setSsSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'annualSpend', dir: 'desc' });

  // ── Aggregate KPIs ────────────────────────────────────────────────────────
  const activeSuppliers = suppliers.length;
  const avgOtif = avg((s) => s.otif);
  const avgOtd = avg((s) => s.otd);
  const avgLead = avg((s) => s.leadTime);
  const avgLtVar = avg((s) => s.leadTimeVariance);
  const avgDefect = avg((s) => s.defectPPM);
  const avgPoAcc = avg((s) => s.poAccuracy);
  const avgSpi = avg((s) => s.spiScore);
  const top1 = suppliers.reduce((m, s) => Math.max(m, s.spendShare), 0);
  const singleSrcPct = (suppliers.filter((s) => s.singleSource).length / activeSuppliers) * 100;
  const atRisk = suppliers.filter((s) => s.status === 'acil' || s.status === 'uyari').length;
  const avgDelay = avg((s) => s.overdueDays);
  const lateItems = suppliers.filter((s) => s.overdueDays > 0).length;
  const dl = i18n.t('common.daysLower');

  const bestSupplier = [...suppliers].sort((a, b) => b.spiScore - a.spiScore)[0];
  const topSpender = [...suppliers].sort((a, b) => b.annualSpend - a.annualSpend)[0];
  const unqualifiedSS = singleSourceItems.filter((x) => !x.hasAlternative || !x.qualified).length;

  // ── KPI tanımları (12 brief + A6: avgDelay + lateItems = 14) ──────────────
  const kpis: { id: string; title: string; value: string; trend: string; st: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'sup-active', title: tp('kpi.activeSuppliers'), value: fmtNumber(activeSuppliers), trend: '+2', st: 'up', color: 'tl', unit: '' },
    { id: 'sup-otif', title: tp('kpi.otif'), value: fmtPercent(avgOtif, 1), trend: '-1,2pp', st: 'down', color: avgOtif >= 95 ? 'gn' : 'am', unit: '%' },
    { id: 'sup-otd', title: tp('kpi.otd'), value: fmtPercent(avgOtd, 1), trend: '+0,8pp', st: 'up', color: 'gn', unit: '%' },
    { id: 'sup-lead', title: tp('kpi.leadTime'), value: `${fmtNumber(avgLead, 0)} ${dl}`, trend: '-1', st: 'down', color: 'tl', unit: dl },
    { id: 'sup-ltvar', title: tp('kpi.leadTimeVariance'), value: fmtPercent(avgLtVar, 1), trend: '+1,4pp', st: 'up', color: avgLtVar <= 10 ? 'gn' : 'am', unit: '%' },
    { id: 'sup-defect', title: tp('kpi.defectRate'), value: `${fmtNumber(avgDefect, 0)} PPM`, trend: '-40', st: 'down', color: avgDefect < 500 ? 'gn' : 'rd', unit: 'PPM' },
    { id: 'sup-poacc', title: tp('kpi.poAccuracy'), value: fmtPercent(avgPoAcc, 1), trend: '+0,3pp', st: 'up', color: 'gn', unit: '%' },
    { id: 'sup-spi', title: tp('kpi.supplierScore'), value: fmtNumber(avgSpi, 0), trend: '+2', st: 'up', color: 'pu', unit: '' },
    { id: 'sup-top1', title: tp('kpi.top1Share'), value: fmtPercent(top1, 1), trend: '+1,1pp', st: 'up', color: top1 > 30 ? 'rd' : 'am', unit: '%' },
    { id: 'sup-hhi', title: tp('kpi.concentrationIndex'), value: fmtNumber(supplierHHI), trend: '+60', st: 'up', color: supplierHHI > 2500 ? 'rd' : 'am', unit: '' },
    { id: 'sup-single', title: tp('kpi.singleSourcePct'), value: fmtPercent(singleSrcPct, 0), trend: '-3pp', st: 'down', color: 'am', unit: '%' },
    { id: 'sup-atrisk', title: tp('kpi.atRiskSuppliers'), value: fmtNumber(atRisk), trend: '+1', st: 'up', color: atRisk > 0 ? 'rd' : 'gn', unit: '' },
    // A6
    { id: 'sup-delay', title: tp('kpi.avgDelay'), value: `${fmtNumber(avgDelay, 1)} ${dl}`, trend: '-0,5', st: 'down', color: 'am', unit: dl },
    { id: 'sup-lateitems', title: tp('kpi.lateItems'), value: fmtNumber(lateItems), trend: '-2', st: 'down', color: lateItems > 5 ? 'rd' : 'am', unit: '' },
  ];

  // ── Chart data ────────────────────────────────────────────────────────────
  const otifBarData = [...suppliers].sort((a, b) => b.otif - a.otif).map((s) => ({ name: short(s.name), otif: s.otif }));
  const scatterData = suppliers.map((s) => ({ x: Math.round(s.annualSpend / 1000), y: Math.round(100 - s.spiScore), z: s.leadTime, name: s.name }));
  const donutData = (() => {
    const sorted = [...suppliers].sort((a, b) => b.annualSpend - a.annualSpend);
    const top = sorted.slice(0, 8).map((s) => ({ name: short(s.name), value: s.annualSpend }));
    const rest = sorted.slice(8).reduce((sum, s) => sum + s.annualSpend, 0);
    if (rest > 0) top.push({ name: lang === 'tr' ? 'Diğer' : 'Other', value: rest });
    return top;
  })();

  // ── Scorecard tablo kolonları ─────────────────────────────────────────────
  const COLS: { key: string; label: string; align: 'left' | 'right' | 'center'; type: 'text' | 'num' | 'badge' }[] = [
    { key: 'name', label: tp('cols.supplier'), align: 'left', type: 'text' },
    { key: 'category', label: tp('cols.category'), align: 'left', type: 'text' },
    { key: 'annualSpend', label: tp('cols.spend'), align: 'right', type: 'num' },
    { key: 'otif', label: 'OTIF %', align: 'right', type: 'num' },
    { key: 'otd', label: 'OTD %', align: 'right', type: 'num' },
    { key: 'leadTime', label: tp('kpi.leadTime'), align: 'right', type: 'num' },
    { key: 'defectPPM', label: 'Defect PPM', align: 'right', type: 'num' },
    { key: 'ppv', label: 'PPV %', align: 'right', type: 'num' },
    { key: 'avgPaymentDays', label: tp('kpi.avgPaymentPeriod'), align: 'right', type: 'num' }, // A6
    { key: 'totalPayable', label: tp('cols.totalPayable'), align: 'right', type: 'num' },       // A6
    { key: 'spiScore', label: tp('cols.spi'), align: 'right', type: 'num' },
    { key: 'status', label: tp('cols.status'), align: 'center', type: 'badge' },
  ];
  const colDefs: ColDef[] = COLS.map((c) => ({ key: c.key, label: c.label }));
  const [visibleCols, setVisibleCols] = useState<string[]>(COLS.map((c) => c.key));

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[tableSort.key];
    const bv = (b as unknown as Record<string, unknown>)[tableSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return tableSort.dir === 'asc' ? av - bv : bv - av;
    return tableSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const sortedSS = [...singleSourceItems].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[ssSort.key];
    const bv = (b as unknown as Record<string, unknown>)[ssSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return ssSort.dir === 'asc' ? av - bv : bv - av;
    return ssSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const handleSort = (setter: typeof setTableSort, key: string) =>
    setter((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));

  const SortIcon = ({ colKey, s }: { colKey: string; s: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon name={s.key === colKey ? (s.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={s.key === colKey ? t.pr : t.tx3} />
  );

  const statusBadge = (st: Supplier['status']) => {
    const cfg = STATUS_COLOR[st];
    const clr = t[cfg.c] as string;
    const label = i18n.t(`badges.${st === 'acil' ? 'acil' : st === 'uyari' ? 'uyari' : st === 'izle' ? 'izle' : 'iyi'}`);
    return <span style={{ fontSize: 10, fontWeight: 600, color: clr, background: cfg.bg, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{label}</span>;
  };

  const renderCell = (key: string, s: Supplier) => {
    switch (key) {
      case 'name': return <span style={{ fontWeight: 600, color: t.tx }}>{s.name}</span>;
      case 'category': return <span style={{ color: t.tx2 }}>{s.category}</span>;
      case 'annualSpend': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(s.annualSpend)}</span>;
      case 'otif': return <span style={{ fontWeight: 600, color: otifClr(s.otif, t) }}>{fmtPercent(s.otif, 1)}</span>;
      case 'otd': return <span style={{ color: t.tx }}>{fmtPercent(s.otd, 1)}</span>;
      case 'leadTime': return <span style={{ fontWeight: 600, color: leadClr(s.leadTime, t) }}>{s.leadTime} {dl}</span>;
      case 'defectPPM': return <span style={{ fontWeight: 600, color: defectClr(s.defectPPM, t) }}>{fmtNumber(s.defectPPM)}</span>;
      case 'ppv': return <span style={{ fontWeight: 600, color: ppvClr(s.ppv, t) }}>{fmtPercent(s.ppv, 1)}</span>;
      case 'avgPaymentDays': return <span style={{ color: t.tx }}>{s.avgPaymentDays} {dl}</span>;
      case 'totalPayable': return <span style={{ color: t.tx }}>{fmtCompactTRY(s.totalPayable)}</span>;
      case 'spiScore': return <span style={{ fontWeight: 700, color: spiClr(s.spiScore, t) }}>{s.spiScore}</span>;
      case 'status': return statusBadge(s.status);
      default: return null;
    }
  };

  // ── Filtre barı ───────────────────────────────────────────────────────────
  const filters: FilterOption[] = [
    { key: 'category', label: tp('cols.category'), options: [...PROC_CATEGORIES] },
    { key: 'supplier', label: tp('cols.supplier'), options: suppliers.map((s) => s.name) },
    { key: 'period', label: tp('filters.period'), options: i18n.dict.common.datePresets.slice(2, 8) },
  ];

  // ── AI uyarıları ──────────────────────────────────────────────────────────
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '🔴', border: t.rd,
      text: lang === 'tr'
        ? `Toplam harcamanın %${fmtNumber(topSpender.spendShare, 1)}'i tek tedarikçide (${topSpender.name}, HHI ${fmtNumber(supplierHHI)}). Yoğunlaşma riski — ikinci kaynak nitelendir.`
        : `${fmtNumber(topSpender.spendShare, 1)}% of total spend sits with a single supplier (${topSpender.name}, HHI ${fmtNumber(supplierHHI)}). Concentration risk — qualify a second source.`,
    },
    {
      icon: '⚠️', border: t.am,
      text: lang === 'tr'
        ? `${atRisk} tedarikçi SPI eşik altında veya teslimat/finansal olarak riskli. Aksiyon planı açılmalı.`
        : `${atRisk} suppliers are below the SPI threshold or flagged as delivery/financial risk. Open an action plan.`,
    },
    {
      icon: '📉', border: t.rd,
      text: lang === 'tr'
        ? `${unqualifiedSS} kritik kalemde tek kaynak bağımlılığı var, alternatif nitelendirilmemiş. Tedarik kesintisi riski.`
        : `${unqualifiedSS} critical items depend on a single source with no qualified alternative. Supply disruption risk.`,
    },
    {
      icon: '✅', border: t.gn,
      text: lang === 'tr'
        ? `${bestSupplier.name} en yüksek SPI skoruna sahip (${bestSupplier.spiScore}); defect ${fmtNumber(bestSupplier.defectPPM)} PPM. Hacim artışı değerlendirilebilir.`
        : `${bestSupplier.name} holds the highest SPI (${bestSupplier.spiScore}); defect ${fmtNumber(bestSupplier.defectPPM)} PPM. Consider shifting more volume.`,
    },
  ];

  const heatCols: { key: keyof Supplier; label: string; clr: (v: number, t: Theme) => string; fmt: (v: number) => string }[] = [
    { key: 'otif', label: 'OTIF', clr: otifClr, fmt: (v) => fmtPercent(v, 0) },
    { key: 'defectPPM', label: 'Defect', clr: defectClr, fmt: (v) => fmtNumber(v) },
    { key: 'leadTime', label: tp('kpi.leadTime'), clr: leadClr, fmt: (v) => `${v}` },
    { key: 'ppv', label: 'PPV', clr: ppvClr, fmt: (v) => fmtPercent(v, 1) },
    { key: 'spiScore', label: 'SPI', clr: spiClr, fmt: (v) => `${v}` },
  ];

  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );

  return (
    <>
      <FilterBar t={t} l={l} filters={filters} />

      {/* ── KPI BANDI (14) ─────────────────────────────────────────────────── */}
      <SectionHeader title={tp('sections.supplierScorecard')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1: Scorecard Isı Haritası ───────────────────────────────── */}
      <SectionHeader title={tp('charts.scorecardHeatmap')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{tp('cols.supplier')}</th>
                {heatCols.map((h) => (
                  <th key={h.key} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${t.bd}` }}>
                  <td style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: t.tx, whiteSpace: 'nowrap' }}>{s.name}</td>
                  {heatCols.map((h) => {
                    const v = s[h.key] as number;
                    const clr = h.clr(v, t);
                    return (
                      <td key={h.key} style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <div style={{ background: `${clr}1F`, color: clr, fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '4px 0' }}>{h.fmt(v)}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GÖRSEL 2 & 3 ───────────────────────────────────────────────────── */}
      <SectionHeader title={tp('sections.concentrationRisk')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.otifBySupplier')} id="sup-chart-otif" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={otifBarData} margin={{ top: 15, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: t.tx2, angle: -35, textAnchor: 'end' }} interval={0} height={60} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtPercent(v, 1)}`, 'OTIF']} />
              <ReferenceLine y={95} stroke={t.gn} strokeDasharray="5 3" label={{ value: lang === 'tr' ? 'Hedef %95' : 'Target 95%', fontSize: 10, fill: t.gn, position: 'insideTopRight' }} />
              <Bar dataKey="otif" radius={[3, 3, 0, 0]}>
                {otifBarData.map((d, i) => <Cell key={i} fill={otifClr(d.otif, t)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={tp('charts.spendVsRisk')} id="sup-chart-scatter" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="spend" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${fmtNumber(v / 1000, 1)}M`} />
              <YAxis type="number" dataKey="y" name="risk" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[0, 50]} />
              <ZAxis type="number" dataKey="z" range={[60, 420]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { x: number; y: number; z: number; name: string };
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: t.tx, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: t.tx2 }}>{tp('cols.spend')}: {fmtCompactTRY(d.x * 1000)}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Risk' : 'Risk'}: {d.y}</div>
                      <div style={{ color: t.tx2 }}>{tp('kpi.leadTime')}: {d.z} {dl}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill={t.pr} fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 4: Harcama payı donut ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.spendShare')} id="sup-chart-donut" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={1}>
                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={tp('charts.leadTimeTrend')} id="sup-chart-leadtrend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={supplierLeadTimeTrend} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${dl}`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} ${dl}`, '']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              {leadTimeTrendSuppliers.map((s, i) => (
                <Line key={s.id} type="monotone" dataKey={s.id} name={short(s.name)} stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 6: Defect trend ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <ChartContainer t={t} l={l} title={tp('charts.defectTrend')} id="sup-chart-defect" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={defectTrendByCategory} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [`${fmtNumber(v)} PPM`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={500} stroke={t.rd} strokeDasharray="5 3" label={{ value: '500 PPM', fontSize: 10, fill: t.rd, position: 'insideTopRight' }} />
              {defectTrendCategories.map((cat, i) => (
                <Line key={cat} type="monotone" dataKey={cat} name={cat} stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── TABLO 1: Scorecard (ColumnManager + Excel, SPI artan) ──────────── */}
      <SectionHeader title={tp('charts.scorecardTable')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tp('charts.scorecardTable')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={colDefs} visibleKeys={visibleCols} onChange={setVisibleCols} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(setTableSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: tableSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}
                      <SortIcon colKey={c.key} s={tableSort} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSuppliers.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderCell(c.key, s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: Tek-kaynak riski ──────────────────────────────────────── */}
      <SectionHeader title={tp('charts.singleSourceTable')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{excelBtn}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'item', label: tp('cols.item'), align: 'left' as const },
                  { key: 'category', label: tp('cols.category'), align: 'left' as const },
                  { key: 'supplierName', label: tp('cols.soleSupplier'), align: 'left' as const },
                  { key: 'annualSpend', label: tp('cols.annualSpend'), align: 'right' as const },
                  { key: 'hasAlternative', label: tp('cols.alternative'), align: 'center' as const },
                  { key: 'qualified', label: tp('cols.qualification'), align: 'center' as const },
                ].map((c) => (
                  <th key={c.key} onClick={() => handleSort(setSsSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: ssSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}<SortIcon colKey={c.key} s={ssSort} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSS.map((x, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.bd}` }}>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{x.item}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{x.category}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx }}>{x.supplierName}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtCompactTRY(x.annualSpend)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'center', color: x.hasAlternative ? t.gn : t.rd, fontWeight: 600 }}>{x.hasAlternative ? tp('yes') : tp('no')}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: x.qualified ? t.gn : t.am, background: x.qualified ? '#DCFCE7' : '#FEF3C7', borderRadius: 5, padding: '2px 8px' }}>
                      {x.qualified ? tp('qualified') : tp('notQualified')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI ÖNERİLERİ ───────────────────────────────────────────────────── */}
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

export default Suppliers;
