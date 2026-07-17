import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line, ReferenceLine,
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
  categorySpend, spendByQuarter, currencyMix, ppvByCategory, savingsMonthly,
  fxVsCostTrend, fxRiskRows, brandPerformance, costWaterfall, costSummary,
  CUR_USD, CUR_EUR, fxRates, PROC_CATEGORIES,
  type CategorySpend, type FxRiskRow, type BrandPerf,
} from '../../constants/procurementData';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

const DONUT_COLORS = ['#4F46E5', '#0D9488', '#F59E0B', '#6366F1', '#14B8A6', '#EC4899', '#94A3B8'];
const CUR_COLORS: Record<string, string> = { TRY: '#4F46E5', USD: '#0D9488', EUR: '#F59E0B' };

const ppvClr = (v: number, t: Theme) => (v <= 0 ? t.gn : v <= 3 ? t.am : t.rd);
const yoyClr = (v: number, t: Theme) => (v >= 0 ? t.gn : t.rd);

export const Cost = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  const [drill, setDrill] = useState<string | null>(null);
  const [catSort, setCatSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'amount', dir: 'desc' });
  const [fxSort, setFxSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'fxDiff', dir: 'desc' });
  const [brandSort, setBrandSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'spend', dir: 'desc' });

  const cs = costSummary;

  // ── KPI tanımları (13) ──────────────────────────────────────────────────────
  const kpis: { id: string; title: string; value: string; trend: string; st: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'cost-total', title: tp('kpi.totalSpend'), value: fmtCompactTRY(cs.totalSpend), trend: '+8,4%', st: 'up', color: 'pu', unit: '₺' },
    { id: 'cost-sum', title: tp('kpi.spendUnderManagement'), value: fmtPercent(cs.spendUnderMgmt, 1), trend: '+3,2pp', st: 'up', color: cs.spendUnderMgmt >= 80 ? 'gn' : 'am', unit: '%' },
    { id: 'cost-maverick', title: tp('kpi.maverickSpend'), value: fmtPercent(cs.maverickSpend, 1), trend: '-1,4pp', st: 'down', color: cs.maverickSpend < 10 ? 'gn' : 'rd', unit: '%' },
    { id: 'cost-ppv', title: tp('kpi.ppv'), value: fmtPercent(cs.avgPpv, 1), trend: '+0,6pp', st: 'up', color: ppvClr(cs.avgPpv, t) === t.gn ? 'gn' : cs.avgPpv <= 3 ? 'am' : 'rd', unit: '%' },
    { id: 'cost-savings', title: tp('kpi.realizedSavings'), value: fmtCompactTRY(cs.realizedSavings), trend: '+12,1%', st: 'up', color: 'gn', unit: '₺' },
    { id: 'cost-avoid', title: tp('kpi.costAvoidance'), value: fmtCompactTRY(cs.costAvoidance), trend: '+6,7%', st: 'up', color: 'tl', unit: '₺' },
    { id: 'cost-savreal', title: tp('kpi.savingsRealization'), value: fmtPercent(cs.savingsRealization, 1), trend: '+4,3pp', st: 'up', color: cs.savingsRealization >= 90 ? 'gn' : 'am', unit: '%' },
    { id: 'cost-landed', title: tp('kpi.landedCost'), value: fmtNumber(cs.landedCostIndex, 1), trend: '+2,5', st: 'up', color: 'am', unit: '' },
    { id: 'cost-usd', title: tp('kpi.usdMix'), value: fmtPercent(cs.usdMix, 1), trend: '+1,8pp', st: 'up', color: 'c1', unit: '%' },
    { id: 'cost-eur', title: tp('kpi.eurMix'), value: fmtPercent(cs.eurMix, 1), trend: '+0,5pp', st: 'up', color: 'c2', unit: '%' },
    { id: 'cost-fx', title: tp('kpi.fxImpact'), value: fmtCompactTRY(cs.fxImpact), trend: '+9,2%', st: 'up', color: 'rd', unit: '₺' },
    { id: 'cost-conc', title: tp('kpi.categoryConcentration'), value: fmtPercent(cs.categoryConcentration, 1), trend: '+0,9pp', st: 'up', color: 'am', unit: '%' },
    { id: 'cost-perpo', title: tp('kpi.costPerPo'), value: fmtCompactTRY(cs.costPerPo), trend: '-3,1%', st: 'down', color: 'tl', unit: '₺' },
  ];

  // ── Filtre barı ─────────────────────────────────────────────────────────────
  const filters: FilterOption[] = [
    { key: 'category', label: tp('cols.category'), options: [...PROC_CATEGORIES] },
    { key: 'currency', label: tp('cols.currency'), options: ['TRY', 'USD', 'EUR'] },
    { key: 'period', label: tp('filters.period'), options: i18n.dict.common.datePresets.slice(2, 8) },
  ];

  // ── Drill-down (kategori → alt kategori) ─────────────────────────────────────
  const drilled = drill ? categorySpend.find((c) => c.category === drill) : null;
  const spendBarData = drilled
    ? drilled.subcategories.map((s) => ({ name: s.name, amount: s.amount }))
    : [...categorySpend].sort((a, b) => b.amount - a.amount).map((c) => ({ name: c.category, amount: c.amount }));

  // ── Waterfall (Standart → Fiili) — Management P&L dili ──────────────────────
  const waterfall = (() => {
    let running = 0;
    return costWaterfall.map((d) => {
      const nm = lang === 'en' ? d.nameEN : d.name;
      if (d.isTotal) { running = d.val; return { nm, val: d.val, base: 0, h: d.val, isTotal: true }; }
      const base = running; running += d.val;
      return { nm, val: d.val, base: d.val > 0 ? base : base + d.val, h: Math.abs(d.val), isTotal: false };
    });
  })();
  const wfRun = (() => {
    // her bar sonrası çalışan toplam (connector çizgileri için)
    const runs: number[] = [];
    let r = 0;
    costWaterfall.forEach((d) => { r = d.isTotal ? d.val : r + d.val; runs.push(r); });
    return runs;
  })();
  const wfMax = Math.max(...waterfall.map((b) => b.base + b.h)) * 1.1;
  // Ölçek token'ları Management Overview P&L Waterfall ile aynı (bar 48, gap 12, alan 150, viewBox 210).
  const WF_H = 210;
  const wfBarW = 48;
  const wfGap = 12;
  const wfChartW = waterfall.length * (wfBarW + wfGap) + 20;
  const wfScale = (v: number) => 20 + ((wfMax - v) / wfMax) * 150;

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

  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );

  // ── Kategori spend tablosu ──────────────────────────────────────────────────
  const CAT_COLS: { key: string; label: string; align: 'left' | 'right' }[] = [
    { key: 'category', label: tp('cols.category'), align: 'left' },
    { key: 'amount', label: tp('cols.spend'), align: 'right' },
    { key: 'share', label: tp('cols.share'), align: 'right' },
    { key: 'yoy', label: tp('cols.yoy'), align: 'right' },
    { key: 'supplierCount', label: tp('cols.supplierCount'), align: 'right' },
    { key: 'avgPpv', label: tp('cols.avgPpv'), align: 'right' },
    { key: 'savingsOpp', label: tp('cols.savingsOpp'), align: 'right' },
  ];
  const catColDefs: ColDef[] = CAT_COLS.map((c) => ({ key: c.key, label: c.label }));
  const [catVisible, setCatVisible] = useState<string[]>(CAT_COLS.map((c) => c.key));
  const sortedCats = sortRows(categorySpend, catSort);

  const renderCatCell = (key: string, c: CategorySpend) => {
    switch (key) {
      case 'category': return <span style={{ fontWeight: 600, color: t.tx }}>{c.category}</span>;
      case 'amount': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(c.amount)}</span>;
      case 'share': return <span style={{ color: t.tx }}>{fmtPercent(c.share, 1)}</span>;
      case 'yoy': return <span style={{ fontWeight: 600, color: yoyClr(c.yoy, t) }}>{c.yoy >= 0 ? '+' : ''}{fmtPercent(c.yoy, 1)}</span>;
      case 'supplierCount': return <span style={{ color: t.tx }}>{fmtNumber(c.supplierCount)}</span>;
      case 'avgPpv': return (
        <span style={{ fontSize: 10, fontWeight: 600, color: ppvClr(c.avgPpv, t), background: `${ppvClr(c.avgPpv, t)}1F`, borderRadius: 5, padding: '2px 8px' }}>
          {c.avgPpv >= 0 ? '+' : ''}{fmtPercent(c.avgPpv, 1)}
        </span>
      );
      case 'savingsOpp': return <span style={{ fontWeight: 500, color: t.tl }}>{fmtCompactTRY(c.savingsOpp)}</span>;
      default: return null;
    }
  };

  // ── Marka performans tablosu ────────────────────────────────────────────────
  const top10Brands = brandPerformance.slice(0, 10);
  const sortedBrands = sortRows(brandPerformance, brandSort);
  const BRAND_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'brand', label: tp('cols.brand'), align: 'left' },
    { key: 'category', label: tp('cols.category'), align: 'left' },
    { key: 'spend', label: tp('cols.spend'), align: 'right' },
    { key: 'share', label: tp('cols.share'), align: 'right' },
    { key: 'yoy', label: tp('cols.yoy'), align: 'right' },
    { key: 'ppv', label: 'PPV %', align: 'right' },
    { key: 'trend', label: tp('cols.trend'), align: 'center' },
  ];

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

  const renderBrandCell = (key: string, b: BrandPerf) => {
    switch (key) {
      case 'brand': return <span style={{ fontWeight: 600, color: t.tx }}>{b.brand}</span>;
      case 'category': return <span style={{ color: t.tx2 }}>{b.category}</span>;
      case 'spend': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(b.spend)}</span>;
      case 'share': return <span style={{ color: t.tx }}>{fmtPercent(b.share, 1)}</span>;
      case 'yoy': return <span style={{ fontWeight: 600, color: yoyClr(b.yoy, t) }}>{b.yoy >= 0 ? '+' : ''}{fmtPercent(b.yoy, 1)}</span>;
      case 'ppv': return <span style={{ fontWeight: 600, color: ppvClr(b.ppv, t) }}>{b.ppv >= 0 ? '+' : ''}{fmtPercent(b.ppv, 1)}</span>;
      case 'trend': return miniSpark(b.trend, b.yoy >= 0 ? t.gn : t.rd);
      default: return null;
    }
  };

  // ── FX riski tablosu ────────────────────────────────────────────────────────
  const sortedFx = sortRows(fxRiskRows, fxSort);
  const FX_COLS: { key: string; label: string; align: 'left' | 'right' }[] = [
    { key: 'supplier', label: tp('cols.supplier'), align: 'left' },
    { key: 'currency', label: tp('cols.currency'), align: 'left' },
    { key: 'openPoFx', label: tp('cols.openPoFx'), align: 'right' },
    { key: 'openPoTry', label: tp('cols.openPoTry'), align: 'right' },
    { key: 'rateAtOrder', label: tp('cols.rateAtOrder'), align: 'right' },
    { key: 'currentRate', label: tp('cols.currentRate'), align: 'right' },
    { key: 'fxDiff', label: tp('cols.fxDiff'), align: 'right' },
  ];
  const fxSym = (c: string) => (c === 'USD' ? '$' : c === 'EUR' ? '€' : '₺');

  // ── AI uyarıları (4) ────────────────────────────────────────────────────────
  const worstFx = fxRiskRows[0];
  const worstPpvCat = [...categorySpend].sort((a, b) => b.avgPpv - a.avgPpv)[0];
  const topSavingsCat = [...categorySpend].sort((a, b) => b.savingsOpp - a.savingsOpp)[0];
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '🔴', border: t.rd,
      text: lang === 'tr'
        ? `USD alımların payı %${fmtNumber(cs.usdMix, 1)}; USD/TRY son 12 ayda ~%21 arttı. Açık USD PO'larda ~${fmtCompactTRY(cs.fxImpact)} kur maliyeti oluştu — vadeli/forward değerlendir.`
        : `USD purchases are ${fmtNumber(cs.usdMix, 1)}% of spend; USD/TRY rose ~21% over 12 months. Open USD POs carry ~${fmtCompactTRY(cs.fxImpact)} of FX cost — consider forward cover.`,
    },
    {
      icon: '⚠️', border: t.am,
      text: lang === 'tr'
        ? `${worstPpvCat.category} kategorisinde PPV %${fmtNumber(worstPpvCat.avgPpv, 1)} (aleyhte); fiyat sözleşme üstü. Yeniden müzakere önerilir.`
        : `${worstPpvCat.category} shows PPV ${fmtNumber(worstPpvCat.avgPpv, 1)}% (unfavorable); prices above contract. Renegotiation recommended.`,
    },
    {
      icon: '💰', border: t.tl,
      text: lang === 'tr'
        ? `${topSavingsCat.category} kategorisinde tedarikçi konsolidasyonu ile ~${fmtCompactTRY(topSavingsCat.savingsOpp)}/yıl tasarruf fırsatı (spend analizi %5-15 kuralı).`
        : `Supplier consolidation in ${topSavingsCat.category} unlocks ~${fmtCompactTRY(topSavingsCat.savingsOpp)}/yr in savings (spend-analysis 5-15% rule).`,
    },
    {
      icon: '📊', border: t.am,
      text: lang === 'tr'
        ? `Maverick spend %${fmtNumber(cs.maverickSpend, 1)} (hedef <%10); sözleşme dışı alımların çoğu promosyon kategorisinde yoğunlaşıyor.`
        : `Maverick spend is ${fmtNumber(cs.maverickSpend, 1)}% (target <10%); most off-contract buying is concentrated in promotions.`,
    },
  ];

  return (
    <>
      <FilterBar t={t} l={l} filters={filters} />

      {/* ── KPI BANDI (13) ─────────────────────────────────────────────────── */}
      <SectionHeader title={tp('sections.spendAnalysis')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1 & 3: Maliyet waterfall + Para birimi donut ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.costWaterfall')} id="cost-waterfall" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            <svg width="100%" viewBox={`0 0 ${wfChartW} ${WF_H}`} style={{ maxWidth: wfChartW, overflow: 'visible' }}>
              {waterfall.map((b, i) => {
                const x = 10 + i * (wfBarW + wfGap);
                const y = wfScale(b.base + b.h);
                const h = (b.h / wfMax) * 150;
                const fill = b.isTotal ? (i === 0 ? t.c1 : t.pr) : b.val > 0 ? t.rdP : t.gn;
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

        <ChartContainer t={t} l={l} title={tp('charts.currencyMix')} id="cost-currency" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={currencyMix} dataKey="amount" nameKey="currency" cx="50%" cy="50%" innerRadius={62} outerRadius={100} paddingAngle={2}>
                {currencyMix.map((c) => <Cell key={c.currency} fill={CUR_COLORS[c.currency]} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 2: Kategori bazında harcama (drill-down) ─────────────────── */}
      <SectionHeader title={tp('charts.spendByCategory')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18, marginBottom: 12 }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12 }}>
          <span
            onClick={() => setDrill(null)}
            style={{ color: drill ? t.pr : t.tx2, fontWeight: drill ? 600 : 500, cursor: drill ? 'pointer' : 'default' }}
          >
            {tp('cost.allCategories')}
          </span>
          {drill && (
            <>
              <Icon name="chevRight" size={12} color={t.tx3} />
              <span style={{ color: t.tx, fontWeight: 600 }}>{drill}</span>
            </>
          )}
          {!drill && <span style={{ color: t.tx3, fontStyle: 'italic', marginLeft: 6 }}>({tp('cost.drillHint')})</span>}
          {drill && (
            <button
              onClick={() => setDrill(null)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 11, cursor: 'pointer' }}
            >
              <Icon name="chevLeft" size={11} color={t.tx3} />{tp('cost.allCategories')}
            </button>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendBarData} margin={{ top: 15, right: 20, bottom: 40, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: t.tx2, angle: -25, textAnchor: 'end' }} interval={0} height={60} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
            <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), tp('cols.spend')]} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]} cursor={drill ? 'default' : 'pointer'}
              onClick={(d: { name?: string }) => { if (!drill && d?.name) setDrill(d.name); }}>
              {spendBarData.map((_, i) => <Cell key={i} fill={drill ? t.tl : DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── GÖRSEL A6: Yıl & Çeyrek alım (tutar + adet combo) ───────────────── */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.spendByQuarter')} id="cost-quarter" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={spendByQuarter} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, n: string) => n === tp('cost.count') ? [`${fmtNumber(v)}`, n] : [fmtCompactTRY(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="amount" name={tp('cost.amount')} fill={t.c1} radius={[3, 3, 0, 0]} barSize={38} opacity={0.9} />
              <Line yAxisId="right" type="monotone" dataKey="count" name={tp('cost.count')} stroke={t.pu} strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 5 & 6: PPV bar + Kur trendi ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.ppvByCategory')} id="cost-ppv" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={ppvByCategory} layout="vertical" margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: t.tx2 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtPercent(v, 1), 'PPV']} />
              <ReferenceLine x={0} stroke={t.tx3} strokeWidth={1.2} />
              <Bar dataKey="ppv" radius={[0, 3, 3, 0]}>
                {ppvByCategory.map((d, i) => <Cell key={i} fill={d.ppv <= 0 ? t.gn : t.rd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 6, fontSize: 11, color: t.tx2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.gn }} />{tp('cost.favorable')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.rd }} />{tp('cost.unfavorable')}</span>
          </div>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={tp('charts.fxTrend')} id="cost-fx" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={fxVsCostTrend} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth} formatter={(v: number, n: string) => [fmtNumber(v, 1), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine x={fxRates.find((f) => f.isPrediction)?.month} yAxisId="left" stroke={t.tx3} strokeDasharray="4 3" label={{ value: tp('cost.prediction'), fontSize: 9, fill: t.tx3, position: 'insideTopLeft' }} />
              <Line yAxisId="left" type="monotone" dataKey="usdTry" name="USD/TRY" stroke={t.tl} strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="eurTry" name="EUR/TRY" stroke={t.am} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="costIndex" name={tp('cost.costIndex')} stroke={t.pr} strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 7: Tasarruf vs Kaçınma (stacked bar + hedef line) ────────── */}
      <SectionHeader title={tp('sections.savingsAvoidance')} t={t} />
      <div style={{ marginBottom: 14 }}>
        <ChartContainer t={t} l={l} title={tp('charts.savingsVsAvoidance')} id="cost-savings" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={savingsMonthly} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth} formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="realized" name={tp('kpi.realizedSavings')} stackId="s" fill={t.gn} radius={[0, 0, 0, 0]} />
              <Bar dataKey="avoidance" name={tp('kpi.costAvoidance')} stackId="s" fill={t.tl} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="target" name={tp('cost.target')} stroke={t.pu} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── MARKA ANALİZİ: Top 10 bar + tablo ──────────────────────────────── */}
      <SectionHeader title={tp('sections.brandAnalysis')} t={t} />
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('charts.topBrands')} id="cost-topbrands" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10Brands} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <YAxis type="category" dataKey="brand" tick={{ fontSize: 11, fill: t.tx2 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), tp('cols.spend')]} />
              <Bar dataKey="spend" radius={[0, 3, 3, 0]} fill={t.pr} opacity={0.85} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tp('charts.brandTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {BRAND_COLS.map((c) => (
                  <th key={c.key} onClick={() => c.key !== 'trend' && handleSort(setBrandSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: brandSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'trend' ? 'default' : 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}{c.key !== 'trend' && <SortIcon colKey={c.key} s={brandSort} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBrands.map((b) => (
                <tr key={b.brand} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {BRAND_COLS.map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderBrandCell(c.key, b)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 1: Kategori harcama analizi (ColumnManager + Excel) ───────── */}
      <SectionHeader title={tp('charts.categorySpendTable')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tp('charts.categorySpendTable')}</span>
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
                  <th key={c.key} onClick={() => handleSort(setCatSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: catSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : 'flex-end', gap: 4 }}>
                      {c.label}<SortIcon colKey={c.key} s={catSort} />
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

      {/* ── TABLO 2: Kur riski (kur farkı azalan) ───────────────────────────── */}
      <SectionHeader title={tp('sections.fxExposure')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{tp('charts.fxRiskTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {FX_COLS.map((c) => (
                  <th key={c.key} onClick={() => handleSort(setFxSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: fxSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : 'flex-end', gap: 4 }}>
                      {c.label}<SortIcon colKey={c.key} s={fxSort} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFx.map((r: FxRiskRow, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: t.tx }}>{r.supplier}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: CUR_COLORS[r.currency], background: `${CUR_COLORS[r.currency]}1F`, borderRadius: 5, padding: '2px 8px' }}>{r.currency}</span>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fxSym(r.currency)}{fmtNumber(r.openPoFx)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtCompactTRY(r.openPoTry)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtNumber(r.rateAtOrder, 2)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtNumber(r.currentRate, 2)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: r.fxDiff > 0 ? t.rd : t.gn }}>
                    {r.fxDiff > 0 ? '+' : ''}{fmtCompactTRY(r.fxDiff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 16px', fontSize: 10.5, color: t.tx3, fontStyle: 'italic', borderTop: `1px solid ${t.bd}` }}>
          {lang === 'tr'
            ? `Güncel kur: USD/TRY ${fmtNumber(CUR_USD, 2)} · EUR/TRY ${fmtNumber(CUR_EUR, 2)} (2026 sonrası aylar tahmindir, gerçek değildir).`
            : `Current rates: USD/TRY ${fmtNumber(CUR_USD, 2)} · EUR/TRY ${fmtNumber(CUR_EUR, 2)} (months beyond 2026 are forecasts, not actuals).`}
        </div>
      </div>

      {/* ── AI ÖNERİLERİ (4) ───────────────────────────────────────────────── */}
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

export default Cost;
