import { useMemo, useState, type CSSProperties } from 'react';
import {
  LineChart, Line, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, ViewMode, OrderMode, ComputeCtx, FinSource } from '../../../types/finance';
import {
  PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, INCOME_ROWS, netIncomeOf, TOTAL_SHARES,
  divSumInPeriod, dividendEventsSeed, LINE_LABELS, expenseRaw, EXPENSE_TREE,
} from '../../../constants/financeData';
import { segmentProfitability, marginBridgePVM } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, SourceBadge, InfoTip,
  MiniChartPopover, ChangePct, StatusBadge, Dropdown, Waterfall, type FinAlert,
} from '../../../components/finance';
import type { FinancePageProps } from '../_Placeholder';

const SRC = Object.fromEntries(INCOME_ROWS.map((r) => [r.key, r.source])) as Record<string, FinSource>;
const MARGIN_KEYS = new Set(INCOME_ROWS.filter((r) => r.isMargin).map((r) => r.key));

// Aynı çeyrek/yıl bir önceki yıl (YoY karşılaştırma)
const yoyLabel = (label: string) => (label.includes('/') ? `${Number(label.split('/')[0]) - 1}/${label.split('/')[1]}` : String(Number(label) - 1));

// Bir dönemin gelir tablosu satırlarını RowSpec compute closure'larıyla çöz
const resolveIncome = (p: FinancialPeriod): Record<string, number | null> => {
  const raw = incomeRaw[p.id] ?? {};
  const resolved: Record<string, number | null> = {};
  const ctx: ComputeCtx = {
    get: (k) => resolved[k] ?? null,
    raw,
    revenue: raw.revenue ?? null,
    netIncome: netIncomeOf(p.id),
    shares: TOTAL_SHARES,
    divDeclared: divSumInPeriod(dividendEventsSeed, p, 'beyan'),
    divPaid: divSumInPeriod(dividendEventsSeed, p, 'odeme'),
  };
  for (const row of INCOME_ROWS) resolved[row.key] = row.compute ? row.compute(ctx) : (raw[row.key] ?? null);
  return resolved;
};

export const IncomeProfitability = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [view, setView] = useState<ViewMode>('absolute');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const R = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveIncome(p)])), [periods]);
  const curr = periods[periods.length - 1];
  const prev = periods.find((p) => p.label === yoyLabel(curr.label)) ?? periods[periods.length - 2];
  const rc = R[curr.id];
  const rp = R[prev.id];

  // ── biçimlendirme ──
  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const fmtPS = (v: number) => `${sym}${v.toFixed(2)}`;
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');

  // sıralamalı dönem dizisi (grafik x ekseni)
  const ordered = order === 'newestRight' ? periods : [...periods].reverse();

  // ── KPI hesaplamaları ──
  const rev = (r: Record<string, number | null>) => r.revenue ?? 0;
  const growthOf = (i: number) => {
    if (i < 1) return 0;
    const a = rev(R[periods[i].id]), b = rev(R[periods[i - 1].id]);
    return b ? ((a - b) / b) * 100 : 0;
  };
  const opexRatioOf = (r: Record<string, number | null>) => (r.revenue ? (Math.abs(r.opex ?? 0) / r.revenue) * 100 : 0);
  const exportOf = (r: Record<string, number | null>) => (r.revenue ? ((r.foreignSales ?? 0) / r.revenue) * 100 : 0);
  const qualityOf = (r: Record<string, number | null>) => Math.round(63 + (r.netMargin ?? 0) * 0.55 + exportOf(r) * 0.12);
  const normNetMarginOf = (r: Record<string, number | null>) => (r.revenue ? (((r.netIncome ?? 0) - (r.nonOp ?? 0)) / r.revenue) * 100 : 0);

  const currIdx = periods.length - 1;
  const revGrowth = ((rev(rc) - rev(rp)) / (rev(rp) || 1)) * 100;
  const revGrowthPrev = growthOf(currIdx - 1);

  const kpis = [
    {
      title: en ? 'Revenue Growth (YoY)' : 'Hasılat Büyümesi (YoY)', term: 'revenueGrowth', goodDir: 'up' as const,
      value: `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}%`, trend: { value: revGrowth - revGrowthPrev, isRatio: true },
      spark: periods.map((_, i) => growthOf(i)), color: t.pr,
    },
    {
      title: en ? 'Gross Margin' : 'Brüt Marj', term: 'grossMargin', goodDir: 'up' as const,
      value: `${(rc.grossMargin ?? 0).toFixed(1)}%`, trend: { value: (rc.grossMargin ?? 0) - (rp.grossMargin ?? 0), isRatio: true },
      spark: periods.map((p) => R[p.id].grossMargin ?? 0), color: t.tl,
    },
    {
      title: en ? 'EBITDA Margin' : 'FAVÖK Marjı', term: 'ebitdaMargin', goodDir: 'up' as const,
      value: `${(rc.ebitdaMargin ?? 0).toFixed(1)}%`, trend: { value: (rc.ebitdaMargin ?? 0) - (rp.ebitdaMargin ?? 0), isRatio: true },
      spark: periods.map((p) => R[p.id].ebitdaMargin ?? 0), color: t.pu,
    },
    {
      title: en ? 'Net Margin' : 'Net Marj', term: 'netMargin', goodDir: 'up' as const,
      value: `${(rc.netMargin ?? 0).toFixed(1)}%`, trend: { value: (rc.netMargin ?? 0) - (rp.netMargin ?? 0), isRatio: true },
      spark: periods.map((p) => R[p.id].netMargin ?? 0), color: t.gn,
    },
    {
      title: en ? 'OpEx Ratio' : 'Faaliyet Gideri Oranı', term: 'opexRatio', goodDir: 'down' as const,
      value: `${opexRatioOf(rc).toFixed(1)}%`, trend: { value: opexRatioOf(rc) - opexRatioOf(rp), isRatio: true },
      spark: periods.map((p) => opexRatioOf(R[p.id])), color: t.am,
    },
    {
      title: en ? 'Revenue Quality' : 'Hasılat Kalite Skoru', term: 'revenueQuality', goodDir: 'up' as const,
      value: `${qualityOf(rc)}/100`, trend: { value: qualityOf(rc) - qualityOf(rp), isRatio: true },
      spark: periods.map((p) => qualityOf(R[p.id])), color: t.c1,
    },
    {
      title: en ? 'Export Revenue' : 'Yurt Dışı Hasılat Payı', term: 'exportRevenue', goodDir: 'up' as const,
      value: `${exportOf(rc).toFixed(1)}%`, trend: { value: exportOf(rc) - exportOf(rp), isRatio: true },
      spark: periods.map((p) => exportOf(R[p.id])), color: t.c2,
    },
    {
      title: en ? 'Normalized Net Margin' : 'Normalize Net Kâr Marjı', term: 'normalizedNetMargin', goodDir: 'up' as const,
      value: `${normNetMarginOf(rc).toFixed(1)}%`, trend: { value: normNetMarginOf(rc) - normNetMarginOf(rp), isRatio: true },
      spark: periods.map((p) => normNetMarginOf(R[p.id])), color: t.c3,
    },
  ];

  // ── Chart 1: Gelir Tablosu Waterfall (cari dönem) ──
  const wfSteps = [
    { label: en ? 'Revenue' : 'Hasılat', value: conv(rc.revenue ?? 0, curr), isTotal: true },
    { label: en ? 'COGS' : 'SMM', value: conv(rc.cogs ?? 0, curr), isTotal: false },
    { label: en ? 'Gross Profit' : 'Brüt Kâr', value: conv(rc.grossProfit ?? 0, curr), isTotal: true },
    { label: 'OpEx', value: conv(rc.opex ?? 0, curr), isTotal: false },
    { label: 'EBIT', value: conv(rc.ebit ?? 0, curr), isTotal: true },
    { label: en ? 'Net Int.&Other' : 'Net Faiz+Diğer', value: conv((rc.netInterest ?? 0) + (rc.nonOp ?? 0), curr), isTotal: false },
    { label: en ? 'Tax' : 'Vergi', value: conv(rc.tax ?? 0, curr), isTotal: false },
    { label: en ? 'Net Income' : 'Net Kâr', value: conv(rc.netIncome ?? 0, curr), isTotal: true },
  ];

  // ── Chart 2: Margin Bridge PVM ──
  const mbSteps = [
    { label: en ? 'Prior' : 'Önceki', value: marginBridgePVM.start, isTotal: true },
    ...marginBridgePVM.drivers.map((d) => ({ label: d.key[en ? 'en' : 'tr'], value: d.pp, isTotal: false })),
    { label: en ? 'Current' : 'Cari', value: marginBridgePVM.end, isTotal: true },
  ];

  // ── Chart 3: Marj trend ──
  const marginTrend = ordered.map((p) => ({
    period: pl(p), gross: R[p.id].grossMargin ?? 0, ebitda: R[p.id].ebitdaMargin ?? 0, net: R[p.id].netMargin ?? 0,
  }));

  // ── Chart 4: Hasılat stacked-area ──
  const revStack = ordered.map((p) => ({
    period: pl(p), domestic: conv(R[p.id].domesticSales ?? 0, p), foreign: conv(R[p.id].foreignSales ?? 0, p),
  }));

  // ── Chart 5: Gider Pareto (cari dönem) ──
  const expRow = expenseRaw[curr.id] ?? {};
  const paretoRaw = EXPENSE_TREE.map((cat) => ({
    key: cat.id,
    label: LINE_LABELS[cat.id]?.[en ? 'en' : 'tr'] ?? cat.id,
    amount: conv(cat.items.reduce((s, it) => s + (expRow[it.key] ?? 0), 0), curr),
  })).sort((a, b) => b.amount - a.amount);
  const paretoTotal = paretoRaw.reduce((s, d) => s + d.amount, 0) || 1;
  let cum = 0;
  const pareto = paretoRaw.map((d) => { cum += d.amount; return { ...d, cumulative: (cum / paretoTotal) * 100 }; });

  // ── Chart 6: EPS bar + normalize net line ──
  const epsData = ordered.map((p) => ({
    period: pl(p),
    eps: conv((R[p.id].netIncome ?? 0) / TOTAL_SHARES, p),
    normNet: conv((R[p.id].netIncome ?? 0) - (R[p.id].nonOp ?? 0), p),
  }));

  // ── Tablo 1: Karlılık Özeti ──
  const t1Rows = ['revenue', 'cogs', 'grossProfit', 'grossMargin', 'opex', 'ebit', 'ebitda', 'ebitdaMargin', 'netInterest', 'tax', 'netIncome', 'netMargin', 'eps'];
  const cellVal = (key: string, p: FinancialPeriod) => {
    const v = R[p.id][key];
    if (v == null) return '—';
    if (MARGIN_KEYS.has(key)) return `${v.toFixed(1)}%`;
    if (key === 'eps') return fmtPS(conv(v, p));
    if (view === 'pct') { const rv = R[p.id].revenue; return rv ? `${((v / rv) * 100).toFixed(1)}%` : '—'; }
    return fmtC(conv(v, p));
  };
  const yoyDelta = (key: string) => {
    const a = R[curr.id][key], b = R[prev.id][key];
    if (a == null || b == null) return null;
    if (MARGIN_KEYS.has(key)) return { value: a - b, isRatio: true };
    return { value: b ? ((a - b) / Math.abs(b)) * 100 : 0, isRatio: false };
  };

  // ── AI uyarıları (brief SAYFA 1) ──
  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Gross margin fell from 41% to 36% over 2 quarters; the PVM bridge attributes −3.8pp to cost. Review COGS/supplier prices.'
      : 'Brüt marj son 2 çeyrekte %41→%36’ya düştü; PVM köprüsü maliyet etkisinin −3.8pp katkı yaptığını gösteriyor. SMM/tedarikçi fiyatları incelenmeli.' },
    { severity: 'warning', text: en
      ? 'Marketing spend growing faster than revenue (+34% vs +18%); customer-acquisition efficiency may be deteriorating.'
      : 'Pazarlama gideri hasılattan hızlı büyüyor (+%34 vs +%18); müşteri edinme verimliliği düşüyor olabilir.' },
    { severity: 'watch', text: en
      ? 'Export revenue share rose 12%→19%; FX risk should be monitored on the Leverage page.'
      : 'Yurt dışı hasılat payı %12→%19’a çıktı; kur riski Borçluluk sayfasında izlenmeli.',
      linkLabel: en ? 'Leverage' : 'Borçluluk', onLink: () => onSelectRep?.('muhasebe__5') },
    { severity: 'good', text: en
      ? 'Normalized net margin has held steady at 11% for 4 periods; earnings quality is solid.'
      : 'Normalize net kâr marjı 4 dönemdir istikrarlı %11; kâr kalitesi sağlam.' },
  ];

  // ── kontroller ──
  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={(v) => setDonem(v)} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'View' : 'Görünüm'} value={view} onChange={(v) => setView(v)} t={t} width={140}
        options={[{ value: 'absolute', label: en ? 'Absolute' : 'Mutlak' }, { value: 'pct', label: en ? '% of Revenue' : '% Hasılat' }, { value: 'yoy', label: en ? 'YoY Growth' : 'YoY Büyüme' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={(v) => setOrder(v)} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12.5, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin0}
      subtitle={en ? 'Profitability analysis layered on the Financial Data grid — no raw editing here.' : 'Finansal Veriler grid’i üzerine kurulu kârlılık analizi — ham düzenleme burada yok.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Raw table: Financial Data →' : 'Ham tablo: Finansal Veriler →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      {/* KPI Band */}
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Row: Waterfall + Margin Bridge */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? `Income Statement Waterfall — ${pl(curr)}` : `Gelir Tablosu Şelalesi — ${pl(curr)}`}
          why={en ? 'Bloomberg income-statement bridge — shows at a glance which line erodes margin.' : 'Bloomberg gelir tablosu köprüsü — marjı aşındıran kalemi tek bakışta gösterir.'}>
          <Waterfall steps={wfSteps} t={t} fmt={fmtC} />
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Gross Margin Bridge (PVM)' : 'Brüt Marj Köprüsü (PVM)'}
          right={<InfoTip t={t} lang={lang} termKey="marginBridge" />}
          why={en ? 'Vendavo / Zebra BI PVM template — splits margin change into Price, Volume, Mix, Cost drivers.' : 'Vendavo / Zebra BI PVM şablonu — marj değişimini Fiyat, Hacim, Miks, Maliyet sürücülerine ayrıştırır.'}>
          <Waterfall steps={mbSteps} t={t} fmt={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp`} pp />
        </ChartCard>
      </div>

      {/* Row: Margin trend + Revenue stacked area */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Margin Trend (Gross / EBITDA / Net)' : 'Marj Trendi (Brüt / FAVÖK / Net)'}
          why={en ? 'Fintables ratio-trend pattern.' : 'Fintables oran analizi trend grafiği.'}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={marginTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="gross" name={en ? 'Gross' : 'Brüt'} stroke={t.tl} strokeWidth={2} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={t.pu} strokeWidth={2} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="net" name={en ? 'Net' : 'Net'} stroke={t.gn} strokeWidth={2} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Revenue Split (Domestic / Export)' : 'Hasılat Kırılımı (Yurt İçi / Yurt Dışı)'}
          why={en ? 'Seeking Alpha revenue-by-segment stacked pattern.' : 'Seeking Alpha revenue-by-segment stacked deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={revStack} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="ipDom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.pr} stopOpacity={0.5} /><stop offset="100%" stopColor={t.pr} stopOpacity={0.05} /></linearGradient>
                <linearGradient id="ipFor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.tl} stopOpacity={0.5} /><stop offset="100%" stopColor={t.tl} stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="domestic" stackId="1" name={en ? 'Domestic' : 'Yurt İçi'} stroke={t.pr} fill="url(#ipDom)" strokeWidth={2} />
              <Area type="monotone" dataKey="foreign" stackId="1" name={en ? 'Export' : 'Yurt Dışı'} stroke={t.tl} fill="url(#ipFor)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Pareto + EPS */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? `Expense Pareto — ${pl(curr)}` : `Gider Ağacı Pareto — ${pl(curr)}`}
          why={en ? 'Pareto 80/20 cost-prioritization pattern.' : 'Pareto 80/20 maliyet-önceliklendirme deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={pareto} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={44} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'cumulative' ? `${v.toFixed(0)}%` : fmtC(v))} />
              <Bar yAxisId="l" dataKey="amount" name={en ? 'Amount' : 'Tutar'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={30} />
              <Line yAxisId="r" type="monotone" dataKey="cumulative" name={en ? 'Cumulative' : 'Kümülatif'} stroke={t.am} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'EPS & Normalized Net Income' : 'EPS & Normalize Net Kâr'}
          why={en ? 'TradingView earnings-overlay pattern (EPS = Net Income / 20M shares).' : 'TradingView earnings-overlay deseni (EPS = Net Kâr / 20M hisse).'}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={epsData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtPS} width={48} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'eps' ? fmtPS(v) : fmtC(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="eps" name="EPS" fill={t.c1} radius={[3, 3, 0, 0]} barSize={26} />
              <Line yAxisId="r" type="monotone" dataKey="normNet" name={en ? 'Norm. Net' : 'Norm. Net Kâr'} stroke={t.gn} strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Karlılık Özeti */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Profitability Summary' : 'Karlılık Özeti'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Metric' : 'Metrik'}</th>
                <th style={th}>{pl(curr)}</th>
                <th style={th}>{pl(prev)}</th>
                <th style={th}>{en ? 'YoY Δ' : 'YoY Δ'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Trend' : 'Trend'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Source' : 'Kaynak'}</th>
              </tr>
            </thead>
            <tbody>
              {t1Rows.map((key) => {
                const d = yoyDelta(key);
                const isM = MARGIN_KEYS.has(key);
                const series = periods.map((p) => {
                  const raw = R[p.id][key] ?? 0; // eps satırı zaten hisse başına çözülmüş
                  return { label: pl(p), value: isM ? raw : (currency === 'USD' ? raw / p.fxRate : raw) };
                });
                return (
                  <tr key={key}>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2, display: 'flex', alignItems: 'center' }}>
                      {LINE_LABELS[key]?.[en ? 'en' : 'tr'] ?? key}
                      <InfoTip t={t} lang={lang} termKey={key} />
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{cellVal(key, curr)}</td>
                    <td style={{ ...td, color: t.tx2 }}>{cellVal(key, prev)}</td>
                    <td style={td}>{d ? <ChangePct value={d.value} t={t} isRatio={d.isRatio} goodDir={key === 'cogs' || key === 'opex' || key === 'tax' ? 'down' : 'up'} /> : '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <MiniChartPopover data={series} t={t} lang={lang} mode={isM ? 'line' : 'bar'} currency={currency} isCurrency={!isM && key !== 'eps' ? true : key === 'eps'} title={LINE_LABELS[key]?.[en ? 'en' : 'tr'] ?? key} />
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}><SourceBadge source={SRC[key] ?? 'computed'} t={t} lang={lang} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Segment Karlılığı */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Segment Profitability' : 'Segment Karlılığı'}
          <InfoTip t={t} lang={lang} termKey="segmentMargin" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Segment' : 'Segment'}</th>
                <th style={th}>{en ? 'Revenue' : 'Hasılat'}</th>
                <th style={th}>{en ? 'Gross Profit' : 'Brüt Kâr'}</th>
                <th style={th}>{en ? 'Gross Margin' : 'Brüt Marj'}</th>
                <th style={th}>{en ? 'Rev. Share' : 'Hasılat Payı'}</th>
                <th style={th}>YoY</th>
              </tr>
            </thead>
            <tbody>
              {[...segmentProfitability].sort((a, b) => b.revenue - a.revenue).map((s) => (
                <tr key={s.segment.tr}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{s.segment[en ? 'en' : 'tr']}</td>
                  <td style={td}>{fmtC(conv(s.revenue, curr))}</td>
                  <td style={td}>{fmtC(conv(s.grossProfit, curr))}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <StatusBadge t={t} dot={false} tone={s.grossMargin >= 30 ? 'green' : s.grossMargin >= 20 ? 'blue' : 'red'} label={`${s.grossMargin.toFixed(1)}%`} />
                  </td>
                  <td style={{ ...td, color: t.tx2 }}>{s.revShare.toFixed(1)}%</td>
                  <td style={td}><ChangePct value={s.yoy} t={t} goodDir="up" /></td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, textAlign: 'left', fontWeight: 700, color: t.tx }}>{en ? 'Total' : 'Toplam'}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(segmentProfitability.reduce((a, s) => a + s.revenue, 0), curr))}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(segmentProfitability.reduce((a, s) => a + s.grossProfit, 0), curr))}</td>
                <td style={td} /><td style={td} /><td style={td} />
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '8px 16px', borderTop: `1px solid ${t.bd}` }}>
          {en ? 'Product-level margin lives in Category; Finance stays at segment/total level.' : 'Ürün-bazlı marj Category modülünde; Finans segment/toplam seviyesinde kalır.'}
          <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer', marginLeft: 6 }} onClick={() => onSelectRep?.('kategori__1')}>{en ? 'Category →' : 'Category →'}</span>
        </div>
      </div>

      {/* AI Panel */}
      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} />
      </div>
    </ReportPageLayout>
  );
};
