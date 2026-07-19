import { useMemo, useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode, ComputeCtx, FinSource } from '../../../types/finance';
import {
  PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw, cashflowRaw, BALANCE_ROWS, CASHFLOW_ROWS,
  netIncomeOf, TOTAL_SHARES, divSumInPeriod, dividendEventsSeed, LINE_LABELS,
} from '../../../constants/financeData';
import { bankAccounts, weeklyCashForecast } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, SourceBadge, InfoTip,
  ChangePct, StatusBadge, Dropdown, Waterfall, Gauge, type FinAlert,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

const BAL_SRC = Object.fromEntries(BALANCE_ROWS.map((r) => [r.key, r.source])) as Record<string, FinSource>;
const CF_SRC = Object.fromEntries(CASHFLOW_ROWS.map((r) => [r.key, r.source])) as Record<string, FinSource>;

const resolveRows = (rows: typeof BALANCE_ROWS, store: Record<string, Record<string, number | null>>, p: FinancialPeriod) => {
  const raw = store[p.id] ?? {};
  const resolved: Record<string, number | null> = {};
  const ctx: ComputeCtx = {
    get: (k) => resolved[k] ?? null, raw,
    revenue: incomeRaw[p.id]?.revenue ?? null, netIncome: netIncomeOf(p.id), shares: TOTAL_SHARES,
    divDeclared: divSumInPeriod(dividendEventsSeed, p, 'beyan'), divPaid: divSumInPeriod(dividendEventsSeed, p, 'odeme'),
  };
  for (const row of rows) resolved[row.key] = row.compute ? row.compute(ctx) : (raw[row.key] ?? null);
  return resolved;
};

const daysOf = (p: FinancialPeriod) => (p.type === 'annual' ? 365 : 90);
const cccOf = (p: FinancialPeriod) => {
  const b = balanceRaw[p.id], inc = incomeRaw[p.id];
  const rev = inc.revenue ?? 0, cogs = Math.abs(inc.cogs ?? 0), d = daysOf(p);
  const dso = rev ? ((b.ar ?? 0) / rev) * d : 0;
  const dio = cogs ? ((b.inventory ?? 0) / cogs) * d : 0;
  const dpo = cogs ? ((b.ap ?? 0) / cogs) * d : 0;
  return { dso, dio, dpo, ccc: dso + dio - dpo };
};

export const CashLiquidity = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const B = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(BALANCE_ROWS, balanceRaw, p)])), [periods]);
  const CF = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(CASHFLOW_ROWS, cashflowRaw, p)])), [periods]);
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');
  const ordered = order === 'newestRight' ? periods : [...periods].reverse();

  // ── KPI türetmeleri ──
  const cashPos = (p: FinancialPeriod) => (B[p.id].cash ?? 0) + (B[p.id].stInvest ?? 0);
  const currentRatio = (p: FinancialPeriod) => { const cl = B[p.id].currentLiab ?? 0; return cl ? (B[p.id].currentAssets ?? 0) / cl : 0; };
  const quickRatio = (p: FinancialPeriod) => { const cl = B[p.id].currentLiab ?? 0; return cl ? ((B[p.id].currentAssets ?? 0) - (balanceRaw[p.id].inventory ?? 0)) / cl : 0; };
  const fcfOf = (p: FinancialPeriod) => CF[p.id].fcf ?? 0;
  const fcfMarginOf = (p: FinancialPeriod) => { const r = incomeRaw[p.id].revenue ?? 0; return r ? (fcfOf(p) / r) * 100 : 0; };
  const opCFRatio = (p: FinancialPeriod) => { const cl = B[p.id].currentLiab ?? 0; return cl ? (CF[p.id].operatingCF ?? 0) / cl : 0; };
  const runwayOf = (p: FinancialPeriod) => {
    const annualRev = (incomeRaw[p.id].revenue ?? 0) * (p.type === 'annual' ? 1 : 4);
    const monthlyFixed = (annualRev * 0.10) / 12; // demo: aylık sabit gider ~ yıllık hasılatın %10'u
    return monthlyFixed ? cashPos(p) / monthlyFixed : 0;
  };

  const cc = cccOf(curr), cp = cccOf(prev);
  const kpis = [
    { title: en ? 'Cash Position' : 'Nakit Pozisyonu', term: 'cashPosition', goodDir: 'up' as const,
      value: fmtC(conv(cashPos(curr), curr)), trend: { value: ((cashPos(curr) - cashPos(prev)) / (cashPos(prev) || 1)) * 100 },
      spark: periods.map((p) => conv(cashPos(p), p)), color: t.pr },
    { title: 'FCF', term: 'freeCashFlow', goodDir: 'up' as const,
      value: fmtC(conv(fcfOf(curr), curr)), trend: { value: ((fcfOf(curr) - fcfOf(prev)) / (Math.abs(fcfOf(prev)) || 1)) * 100 },
      spark: periods.map((p) => conv(fcfOf(p), p)), color: t.tl },
    { title: en ? 'FCF Margin' : 'FCF Marjı', term: 'fcfMargin', goodDir: 'up' as const,
      value: `${fcfMarginOf(curr).toFixed(1)}%`, trend: { value: fcfMarginOf(curr) - fcfMarginOf(prev), isRatio: true },
      spark: periods.map((p) => fcfMarginOf(p)), color: t.gn },
    { title: en ? 'Current Ratio' : 'Cari Oran', term: 'currentRatio', goodDir: 'up' as const,
      value: `${currentRatio(curr).toFixed(2)}x`, trend: { value: currentRatio(curr) - currentRatio(prev), isRatio: true },
      spark: periods.map((p) => currentRatio(p)), color: t.pu },
    { title: en ? 'Quick Ratio' : 'Asit-Test', term: 'quickRatio', goodDir: 'up' as const,
      value: `${quickRatio(curr).toFixed(2)}x`, trend: { value: quickRatio(curr) - quickRatio(prev), isRatio: true },
      spark: periods.map((p) => quickRatio(p)), color: t.c1 },
    { title: en ? 'Cash Conversion Cycle' : 'Nakit Dönüşüm Süresi', term: 'ccc', goodDir: 'down' as const,
      value: `${cc.ccc.toFixed(0)} ${en ? 'd' : 'gün'}`, trend: { value: cc.ccc - cp.ccc, isRatio: true },
      spark: periods.map((p) => cccOf(p).ccc), color: t.am },
    { title: en ? 'Cash Runway' : 'Nakit Runway', term: 'runway', goodDir: 'up' as const,
      value: `${runwayOf(curr).toFixed(1)} ${en ? 'mo' : 'ay'}`, trend: { value: runwayOf(curr) - runwayOf(prev), isRatio: true },
      spark: periods.map((p) => runwayOf(p)), color: t.c2 },
    { title: en ? 'Operating CF Ratio' : 'İşletme NA Oranı', term: 'operatingCFRatio', goodDir: 'up' as const,
      value: `${opCFRatio(curr).toFixed(2)}x`, trend: { value: opCFRatio(curr) - opCFRatio(prev), isRatio: true },
      spark: periods.map((p) => opCFRatio(p)), color: t.c3 },
  ];

  // ── Chart 1: 13 haftalık rolling forecast ──
  const forecast = weeklyCashForecast.map((w) => ({
    week: w.week,
    expected: conv(w.expected * 1000, curr),
    actual: w.actual == null ? null : conv(w.actual * 1000, curr),
  }));

  // ── Chart 2: Nakit köprüsü waterfall ──
  const wfSteps = [
    { label: en ? 'Begin' : 'Dönem Başı', value: conv(CF[curr.id].beginCash ?? 0, curr), isTotal: true },
    { label: en ? 'Operating' : 'İşletme', value: conv(CF[curr.id].operatingCF ?? 0, curr), isTotal: false },
    { label: en ? 'Investing' : 'Yatırım', value: conv(CF[curr.id].investingCF ?? 0, curr), isTotal: false },
    { label: en ? 'Financing' : 'Finansman', value: conv(CF[curr.id].financingCF ?? 0, curr), isTotal: false },
    { label: en ? 'FX' : 'Kur Farkı', value: conv(CF[curr.id].fxEffect ?? 0, curr), isTotal: false },
    { label: en ? 'End' : 'Dönem Sonu', value: conv(CF[curr.id].endCash ?? 0, curr), isTotal: true },
  ];

  // ── Chart 3: CCC bileşen bar ──
  const cccBars = [
    { name: 'DSO', value: cc.dso, fill: t.pr },
    { name: 'DIO', value: cc.dio, fill: t.tl },
    { name: 'DPO', value: -cc.dpo, fill: t.rd },
    { name: 'CCC', value: cc.ccc, fill: t.am },
  ];

  // ── Chart 6: FCF trend + Runway trend ──
  const fcfTrend = ordered.map((p) => ({ period: pl(p), fcf: conv(fcfOf(p), p) }));
  const runwayTrend = ordered.map((p) => ({ period: pl(p), cash: conv(cashPos(p), p), runway: runwayOf(p) }));

  // ── Tablo 1: Nakit akış özeti ──
  const cfRows = ['operatingCF', 'investingCF', 'financingCF', 'fxEffect', 'netChange', 'fcf'];
  const denom = Math.abs(CF[curr.id].operatingCF ?? 0) + Math.abs(CF[curr.id].investingCF ?? 0) + Math.abs(CF[curr.id].financingCF ?? 0) || 1;

  // ── AI uyarıları (brief SAYFA 2) ──
  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Quick ratio dropped to 0.82 (threshold 1.0); ₺2.4M in payments due within 45 days — accelerate collections.'
      : 'Quick ratio 0.82’ye düştü (eşik 1.0); önümüzdeki 45 günde ₺2.4M ödeme var, tahsilat hızlandırılmalı.' },
    { severity: 'warning', text: en
      ? 'CCC rose from 68 to 81 days; the increase is entirely DSO-driven (see Receivables).'
      : 'CCC 68→81 güne çıktı; artış tamamen DSO kaynaklı (Alacak sayfasına bakınız).',
      linkLabel: en ? 'Receivables' : 'Alacak', onLink: () => onSelectRep?.('muhasebe__2') },
    { severity: 'watch', text: en
      ? 'Runway 14 months; sector benchmark 18–24 months (J.P. Morgan). Burn flat for 2 quarters.'
      : 'Runway 14 ay; sektör benchmark 18–24 ay (J.P. Morgan). Nakit yakımı 2 çeyrektir sabit.' },
    { severity: 'tip', text: en
      ? '₺5.2M idle cash in a non-interest account could be placed in overnight deposits.'
      : 'Vadesiz ₺5.2M atıl nakit gecelik mevduatta değerlendirilebilir.' },
  ];

  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={setOrder} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12.5, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin1}
      subtitle={en ? 'Liquidity, working capital and cash-flow analysis on the Financial Data grid.' : 'Finansal Veriler grid’i üzerine likidite, işletme sermayesi ve nakit akışı analizi.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Raw table: Financial Data →' : 'Ham tablo: Finansal Veriler →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Row: 13-week forecast + Cash bridge */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? '13-Week Rolling Cash Forecast' : '13-Haftalık Rolling Nakit Tahmini'}
          why={en ? 'CloudZero/insightsoftware CFO 13-week cash-forecast standard — catches a liquidity crunch weeks ahead.' : 'CloudZero/insightsoftware CFO 13-week cash-forecast standardı; likidite krizini haftalar önce yakalar.'}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={forecast} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="expected" name={en ? 'Expected' : 'Beklenen'} stroke={t.tx3} strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Line type="monotone" dataKey="actual" name={en ? 'Actual' : 'Gerçekleşen'} stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? `Cash Bridge — ${pl(curr)}` : `Nakit Köprüsü — ${pl(curr)}`}
          why={en ? 'Klipfolio cash-walkthrough pattern (Begin → Operating → Investing → Financing → FX → End).' : 'Klipfolio cash-walkthrough deseni (Başı → İşletme → Yatırım → Finansman → Kur → Sonu).'}>
          <Waterfall steps={wfSteps} t={t} fmt={fmtC} />
        </ChartCard>
      </div>

      {/* Row: CCC bar + Liquidity gauges */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? `CCC Components — ${pl(curr)}` : `CCC Bileşenleri — ${pl(curr)}`}
          why={en ? 'HighRadius/NetSuite working-capital pattern (DSO + DIO − DPO).' : 'HighRadius/NetSuite working-capital deseni (DSO + DIO − DPO).'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={cccBars} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <ReferenceLine y={0} stroke={t.bd} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(0)} ${en ? 'days' : 'gün'}`} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={48}>
                {cccBars.map((b, i) => <Cell key={i} fill={b.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Liquidity Ratios' : 'Likidite Oranları'}
          why={en ? 'insightsoftware Quick-Ratio "front-and-centre" pattern with threshold bands (<1.0 red).' : 'insightsoftware Quick-Ratio "front-and-center" deseni; eşik bantlı (<1.0 kırmızı).'}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 230, flexWrap: 'wrap' }}>
            <Gauge t={t} value={currentRatio(curr)} min={0} max={3} label={en ? 'Current Ratio' : 'Cari Oran'} display={`${currentRatio(curr).toFixed(2)}x`}
              bands={[{ to: 1, color: t.rd }, { to: 1.2, color: t.am }, { to: 2, color: t.gn }, { to: 3, color: t.pr }]} />
            <Gauge t={t} value={quickRatio(curr)} min={0} max={2} label={en ? 'Quick Ratio' : 'Asit-Test'} display={`${quickRatio(curr).toFixed(2)}x`}
              bands={[{ to: 1, color: t.rd }, { to: 1.5, color: t.gn }, { to: 2, color: t.pr }]} />
          </div>
        </ChartCard>
      </div>

      {/* Row: Runway gauge+trend + FCF trend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Runway & Cash Trend' : 'Runway & Nakit Trendi'}
          why={en ? 'Mosaic/Drivetrain runway-gauge above-the-fold pattern.' : 'Mosaic/Drivetrain runway-gauge above-the-fold deseni.'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 230 }}>
            <Gauge t={t} value={runwayOf(curr)} min={0} max={24} label={en ? 'Runway (mo)' : 'Runway (ay)'} display={`${runwayOf(curr).toFixed(1)}`}
              bands={[{ to: 6, color: t.rd }, { to: 12, color: t.am }, { to: 24, color: t.gn }]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={runwayTrend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <defs><linearGradient id="clCash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.c2} stopOpacity={0.4} /><stop offset="100%" stopColor={t.c2} stopOpacity={0.03} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={44} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
                  <Area type="monotone" dataKey="cash" name={en ? 'Cash' : 'Nakit'} stroke={t.c2} fill="url(#clCash)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Free Cash Flow Trend' : 'Serbest Nakit Akışı Trendi'}
          why={en ? 'Paraşüt cash-flow statement pattern.' : 'Paraşüt nakit akışı tablosu deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={fcfTrend} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <ReferenceLine y={0} stroke={t.bd} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Bar dataKey="fcf" name="FCF" radius={[3, 3, 0, 0]} barSize={30}>
                {fcfTrend.map((d, i) => <Cell key={i} fill={d.fcf >= 0 ? t.gn : t.rd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Nakit Akış Özeti */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Cash Flow Summary' : 'Nakit Akış Özeti'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Activity' : 'Faaliyet'}</th>
                <th style={th}>{en ? 'Amount' : 'Tutar'}</th>
                <th style={th}>YoY</th>
                <th style={th}>{en ? '% of Total' : '% Toplam'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Source' : 'Kaynak'}</th>
              </tr>
            </thead>
            <tbody>
              {cfRows.map((key) => {
                const v = CF[curr.id][key] ?? 0, pvv = CF[prev.id][key] ?? 0;
                const yoy = pvv ? ((v - pvv) / Math.abs(pvv)) * 100 : 0;
                const main = key === 'operatingCF' || key === 'investingCF' || key === 'financingCF';
                return (
                  <tr key={key}>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2, display: 'flex', alignItems: 'center' }}>
                      {LINE_LABELS[key]?.[en ? 'en' : 'tr'] ?? key}
                      <InfoTip t={t} lang={lang} termKey={key === 'fcf' ? 'freeCashFlow' : key} />
                    </td>
                    <td style={{ ...td, fontWeight: 600, color: v >= 0 ? t.tx : t.rd }}>{fmtC(conv(v, curr))}</td>
                    <td style={td}><ChangePct value={yoy} t={t} goodDir="up" /></td>
                    <td style={{ ...td, color: t.tx2 }}>{main ? `${((v / denom) * 100).toFixed(0)}%` : '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}><SourceBadge source={CF_SRC[key] ?? 'computed'} t={t} lang={lang} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Banka Hesapları */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Bank Accounts' : 'Banka Hesapları'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Account' : 'Hesap'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Currency' : 'Para Birimi'}</th>
                <th style={th}>{en ? 'Balance (TRY)' : 'Bakiye (TRY)'}</th>
                <th style={th}>{en ? 'Balance (orig.)' : 'Bakiye (orijinal)'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Last Tx' : 'Son Hareket'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Actions' : 'Aksiyon'}</th>
              </tr>
            </thead>
            <tbody>
              {[...bankAccounts].sort((a, b) => b.balanceTRY - a.balanceTRY).map((acc) => (
                <tr key={acc.bank}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{acc.bank}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{acc.currency}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{`₺${(acc.balanceTRY / 1e6).toFixed(2)}M`}</td>
                  <td style={{ ...td, color: t.tx2 }}>
                    {acc.currency === 'TRY' ? '—' : `${acc.currency === 'USD' ? '$' : '€'}${acc.balanceOrig.toLocaleString('en-US')}`}
                  </td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11.5 }}>{acc.lastTx}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <StatusBadge t={t} tone={acc.status === 'active' ? 'green' : 'red'} label={acc.status === 'active' ? (en ? 'Active' : 'Aktif') : (en ? 'Blocked' : 'Bloke')} />
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button title={en ? 'Download statement' : 'Ekstre indir'} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}>
                      <Icon name="download" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>{en ? 'Total' : 'Toplam'}</td>
                <td style={td} />
                <td style={{ ...td, fontWeight: 700 }}>{`₺${(bankAccounts.reduce((s, a) => s + a.balanceTRY, 0) / 1e6).toFixed(2)}M`}</td>
                <td style={td} /><td style={td} /><td style={td} /><td style={td} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} />
      </div>
    </ReportPageLayout>
  );
};
