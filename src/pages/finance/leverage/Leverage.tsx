import { useMemo, useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode, ComputeCtx } from '../../../types/finance';
import {
  PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw, BALANCE_ROWS, INCOME_ROWS,
  netIncomeOf, TOTAL_SHARES, divSumInPeriod, dividendEventsSeed,
} from '../../../constants/financeData';
import { waccInputs, fxPosition } from '../../../constants/financeReportsData';
import { loansSeed } from '../../../constants/loansData';
import { generateAmortization, computeEarlyPayoff, addMonths } from '../../../lib/finance/loanEngine';
import type { ParaBirimi } from '../../../types/loans';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  StatusBadge, Dropdown, GaugeCard, type FinAlert,
} from '../../../components/finance';
import type { FinancePageProps } from '../_Placeholder';

// WACC girdileri (seed ile tutarlı)
const RF = 28, ERP = 9.30, BETA = 1.15, KD = 42, TAX = 25, EV = 0.62, DV = 0.38;
const KE = RF + BETA * ERP;
const KD_AT = KD * (1 - TAX / 100);
const WACC = EV * KE + DV * KD_AT;

// Kredi verisi tek kaynak (loansData) → TRY birleştirme
const USD_TRY = 44.9;
const toTRY = (v: number, cur: ParaBirimi) => (cur === 'USD' ? v * USD_TRY : v);
const loanMoney = (v: number, cur: ParaBirimi) => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
  return cur === 'USD' ? `$${s}` : `${s} ₺`;
};

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

export const Leverage = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const B = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(BALANCE_ROWS, balanceRaw, p)])), [periods]);
  const I = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(INCOME_ROWS, incomeRaw, p)])), [periods]);
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod = curr) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');
  const ordered = order === 'newestRight' ? periods : [...periods].reverse();
  const ann = (p: FinancialPeriod) => (p.type === 'annual' ? 1 : 4);

  // ── Kredi verisinden türev borç (tek kaynak: loansData) ──
  const loanData = useMemo(() => {
    const per = loansSeed.map((ln) => {
      const ep = computeEarlyPayoff(ln, ln.sorguTarihi);
      const remaining = generateAmortization(ln).filter((r) => r.durum !== 'Ödendi');
      return { ln, ep, remaining, kalanTRY: toTRY(ep.kalanAnapara, ln.paraBirimi) };
    });
    const total = per.reduce((s, x) => s + x.kalanTRY, 0);
    const st = per.reduce((s, x) => {
      const cut = addMonths(x.ln.sorguTarihi, 12);
      const stOrig = x.remaining.filter((r) => r.vadeTarihi <= cut).reduce((a, r) => a + r.anaparaPayi, 0);
      return s + toTRY(stOrig, x.ln.paraBirimi);
    }, 0);
    const ladder: Record<string, number> = {};
    per.forEach((x) => x.remaining.forEach((r) => { const y = r.vadeTarihi.slice(0, 4); ladder[y] = (ladder[y] ?? 0) + toTRY(r.anaparaPayi, x.ln.paraBirimi); }));
    const wCost = total ? per.reduce((s, x) => s + x.kalanTRY * (x.ln.faizOraniAylik * 12), 0) / total * 100 : 0;
    return { per, total, st, lt: total - st, ladder, wCost };
  }, []);

  // ── türetilen metrikler (borç kısmı kredi verisine dayanır) ──
  const ebitdaAnnual = (p: FinancialPeriod) => (I[p.id].ebitda ?? 0) * ann(p);
  const balDebt = (p: FinancialPeriod) => (balanceRaw[p.id].stDebt ?? 0) + (balanceRaw[p.id].ltDebt ?? 0);
  const debtRatio = (p: FinancialPeriod) => { const b = balDebt(curr); return b ? balDebt(p) / b : 1; }; // dönem şekli
  const totalDebtOf = (p: FinancialPeriod) => loanData.total * debtRatio(p);
  const netDebtOf = (p: FinancialPeriod) => totalDebtOf(p) - (balanceRaw[p.id].cash ?? 0) - (balanceRaw[p.id].stInvest ?? 0);
  const ndEbitdaOf = (p: FinancialPeriod) => { const e = ebitdaAnnual(p); return e ? netDebtOf(p) / e : 0; };
  const deOf = (p: FinancialPeriod) => { const eq = B[p.id].equity ?? 0; return eq ? totalDebtOf(p) / eq : 0; };
  const coverageOf = (p: FinancialPeriod) => { const ni = Math.abs(I[p.id].netInterest ?? 0); return ni ? (I[p.id].ebit ?? 0) / ni : 0; };
  const equityRatioOf = (p: FinancialPeriod) => { const ta = B[p.id].totalAssets ?? 0; return ta ? ((B[p.id].equity ?? 0) / ta) * 100 : 0; };
  const stRatioOf = (_p: FinancialPeriod) => (loanData.total ? (loanData.st / loanData.total) * 100 : 0);
  const costOfDebtOf = (_p: FinancialPeriod) => loanData.wCost;
  const fxShortTRY = (p: FinancialPeriod) => {
    const usd = (fxPosition[0].liabilities - fxPosition[0].assets) * p.fxRate;
    const eur = (fxPosition[1].liabilities - fxPosition[1].assets) * p.fxRate * 1.08;
    return usd + eur;
  };

  const kpis = [
    { title: en ? 'Net Debt / EBITDA' : 'Net Borç / FAVÖK', term: 'netDebtEbitda', goodDir: 'down' as const, value: `${ndEbitdaOf(curr).toFixed(2)}x`,
      trend: { value: ndEbitdaOf(curr) - ndEbitdaOf(prev), isRatio: true }, spark: periods.map(ndEbitdaOf), color: t.pr },
    { title: 'D/E', term: 'debtEquity', goodDir: 'down' as const, value: `${deOf(curr).toFixed(2)}x`,
      trend: { value: deOf(curr) - deOf(prev), isRatio: true }, spark: periods.map(deOf), color: t.tl },
    { title: en ? 'Interest Coverage' : 'Faiz Karşılama', term: 'interestCoverage', goodDir: 'up' as const, value: `${coverageOf(curr).toFixed(1)}x`,
      trend: { value: coverageOf(curr) - coverageOf(prev), isRatio: true }, spark: periods.map(coverageOf), color: t.gn },
    { title: en ? 'Net Debt' : 'Net Borç', term: 'leverageNetDebt', goodDir: 'down' as const, value: fmtC(conv(netDebtOf(curr), curr)),
      trend: { value: ((netDebtOf(curr) - netDebtOf(prev)) / (Math.abs(netDebtOf(prev)) || 1)) * 100 }, spark: periods.map((p) => conv(netDebtOf(p), p)), color: t.co },
    { title: en ? 'Equity Ratio' : 'Özkaynak Oranı', term: 'equityRatio', goodDir: 'up' as const, value: `${equityRatioOf(curr).toFixed(1)}%`,
      trend: { value: equityRatioOf(curr) - equityRatioOf(prev), isRatio: true }, spark: periods.map(equityRatioOf), color: t.pu },
    { title: en ? 'ST Debt / Total' : 'KV Borç / Toplam', term: 'stDebtRatio', goodDir: 'down' as const, value: `${stRatioOf(curr).toFixed(0)}%`,
      trend: { value: stRatioOf(curr) - stRatioOf(prev), isRatio: true }, spark: periods.map(stRatioOf), color: t.c1 },
    { title: en ? 'Cost of Debt' : 'Borç Maliyeti', term: 'costOfDebt', goodDir: 'down' as const, value: `${costOfDebtOf(curr).toFixed(1)}%`,
      trend: { value: costOfDebtOf(curr) - costOfDebtOf(prev), isRatio: true }, spark: periods.map(costOfDebtOf), color: t.am },
    { title: en ? 'FX Exposure' : 'Döviz Açık Pozisyon', term: 'fxExposure', goodDir: 'down' as const, value: fmtC(conv(fxShortTRY(curr), curr)),
      trend: { value: 0 }, spark: periods.map((p) => conv(fxShortTRY(p), p)), color: t.rd },
  ];

  // ── Chart 1: Borç vade merdiveni (kredi kalan anaparasının yıllara dağılımı) ──
  const ladder = Object.keys(loanData.ladder).sort().map((y) => ({ year: y, principal: conv(loanData.ladder[y]) }));

  // ── Chart 2: Net Borç/EBITDA trend + kovenant ──
  const ndTrend = ordered.map((p) => ({ period: pl(p), nd: ndEbitdaOf(p) }));

  // ── Chart 3: Sermaye yapısı donut ──
  const capStruct = [
    { name: en ? 'Equity' : 'Özkaynak', value: B[curr.id].equity ?? 0, color: t.pr },
    { name: en ? 'LT Debt' : 'UV Borç', value: loanData.lt, color: t.tl },
    { name: en ? 'ST Debt' : 'KV Borç', value: loanData.st, color: t.am },
  ];

  // ── Chart 5: Döviz pozisyon bar ──
  const fxBars = fxPosition.map((f) => ({ currency: f.currency, assets: f.assets, liabilities: f.liabilities }));

  // ── Chart 6: WACC bileşen bar ──
  const waccBars = [
    { name: en ? 'Cost of Equity' : 'Özkaynak Maliyeti', value: KE, color: t.pr },
    { name: en ? 'After-tax Cost of Debt' : 'Vergi Sonrası Borç Mal.', value: KD_AT, color: t.tl },
    { name: 'WACC', value: WACC, color: t.gn },
  ];

  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Net Debt/EBITDA rose to 3.4x; a ₺8M loan matures within 6 months — a refinancing plan is needed.'
      : 'Net Borç/EBITDA 3.4x’e çıktı; ₺8M kredi 6 ay içinde vadeli, yeniden finansman planı gerekli.' },
    { severity: 'warning', text: en
      ? 'Interest coverage dropped to 2.1x; a small EBIT contraction would risk a covenant breach.'
      : 'Faiz karşılama 2.1x’e düştü; EBIT’in ufak daralması kovenant ihlali riski doğurur.' },
    { severity: 'watch', text: en
      ? 'FX short position $420K; a 10% currency move creates ~₺1.4M of FX expense.'
      : 'Döviz açık pozisyon $420K; %10 kur artışı ~₺1.4M kur farkı gideri yaratır.' },
    { severity: 'good', text: en
      ? '78% of debt is long-term; the maturity profile is healthy.'
      : 'Borcun %78’i uzun vadeli; vade profili sağlıklı.' },
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
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin5}
      subtitle={en ? 'Leverage, maturity profile and capital cost on the Financial Data balance sheet.' : 'Finansal Veriler bilançosu üzerine borçluluk, vade profili ve sermaye maliyeti.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Source: Financial Data grid →' : 'Kaynak: Finansal Veriler grid →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Row: Maturity ladder + Net Debt/EBITDA trend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Debt Maturity Ladder' : 'Borç Vade Merdiveni'}
          why={en ? 'Bloomberg/credit-analysis debt-maturity-ladder standard — shows refinancing concentration.' : 'Bloomberg/kredi analizi debt-maturity-ladder standardı; yeniden finansman yoğunluğunu gösterir.'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ladder} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Bar dataKey="principal" name={en ? 'Remaining Principal' : 'Kalan Anapara'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Net Debt/EBITDA + Covenant' : 'Net Borç/FAVÖK + Kovenant'}
          why={en ? 'Klipfolio net-debt & covenants dashboard (covenant band at 3.0x).' : 'Klipfolio net-debt & covenants dashboard (kovenant bandı 3.0x).'}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={ndTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
              <ReferenceLine y={3} stroke={t.rd} strokeDasharray="5 3" label={{ value: en ? 'Covenant 3.0x' : 'Kovenant 3.0x', fontSize: 10, fill: t.rd, position: 'insideTopRight' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(2)}x`} />
              <Line type="monotone" dataKey="nd" name="Net Debt/EBITDA" stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Capital structure donut + Interest coverage gauge */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Capital Structure' : 'Sermaye Yapısı'}
          why={en ? 'Capital-structure composition pattern (Equity/LT Debt/ST Debt).' : 'capital-structure composition deseni (Özkaynak/UV Borç/KV Borç).'}>
          <div style={{ position: 'relative', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={capStruct} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={2}>
                  {capStruct.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(conv(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.tx }}>{equityRatioOf(curr).toFixed(0)}%</div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{en ? 'equity' : 'özkaynak'}</div>
            </div>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Interest Coverage' : 'Faiz Karşılama'}
          why={en ? 'insightsoftware coverage-ratio gauge with threshold bands.' : 'insightsoftware coverage-ratio deseni; eşik bantlı.'}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}>
            <GaugeCard t={t} value={coverageOf(curr)} min={0} max={10} format={(v) => `${v.toFixed(1)}x`} label={en ? 'EBIT / Net Interest' : 'EBIT / Net Faiz'}
              thresholds={[{ limit: 2, color: t.rd }, { limit: 3, color: t.am }, { limit: 10, color: t.gn }]} />
          </div>
        </ChartCard>
      </div>

      {/* Row: FX position + WACC */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'FX Position (assets vs liabilities)' : 'Döviz Pozisyon (varlık vs yükümlülük)'}
          why={en ? 'FX balance-sheet channel / currency-risk pattern for TR firms.' : 'TR firmaları için FX balance-sheet channel/kur riski deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={fxBars} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="currency" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => v.toLocaleString('en-US')} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="assets" name={en ? 'Assets' : 'Varlık'} fill={t.gn} radius={[3, 3, 0, 0]} barSize={30} />
              <Bar dataKey="liabilities" name={en ? 'Liabilities' : 'Yükümlülük'} fill={t.rd} radius={[3, 3, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'WACC Components' : 'WACC Bileşenleri'}
          why={en ? 'WACC-input visualization consistent with the Valuation page (Turkey ERP 9.30%).' : 'Değerleme sayfasıyla tutarlı WACC girdi görselleştirmesi (Türkiye ERP %9.30).'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={waccBars} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: t.tx2 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={54}>
                {waccBars.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Borç Envanteri */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Debt Inventory' : 'Borç Envanteri'}
          <InfoTip t={t} lang={lang} termKey="leverageNetDebt" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Creditor' : 'Kreditör'}</th>
                <th style={th}>{en ? 'Amount' : 'Tutar'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Currency' : 'Para Birimi'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Rate' : 'Faiz'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Maturity' : 'Vade'}</th>
                <th style={th}>{en ? 'Remaining' : 'Kalan Anapara'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Type' : 'Tür'}</th>
              </tr>
            </thead>
            <tbody>
              {[...loanData.per]
                .map((x) => ({ ...x, maturity: addMonths(x.ln.kullandirimTarihi, x.ln.vadeAy * (x.ln.odemeSikligi === '3 Aylık' ? 3 : 1)) }))
                .sort((a, b) => a.maturity.localeCompare(b.maturity))
                .map(({ ln, ep, maturity }) => (
                  <tr key={ln.id}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{ln.banka} <span style={{ color: t.tx3, fontSize: 11 }}>· {ln.krediNo}</span></td>
                    <td style={{ ...td, fontWeight: 600 }}>{loanMoney(ln.anapara, ln.paraBirimi)}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{ln.paraBirimi}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11.5 }}>%{(ln.faizOraniAylik * 100).toFixed(1)}/{en ? 'mo' : 'ay'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{maturity}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{loanMoney(ep.kalanAnapara, ln.paraBirimi)}</td>
                    <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} dot={false} tone="neutral" label={ln.krediTuru} /></td>
                  </tr>
                ))}
              <tr>
                <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>{en ? 'Total (TRY-eq.)' : 'Toplam (TL-eş.)'}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(loanData.per.reduce((s, x) => s + toTRY(x.ln.anapara, x.ln.paraBirimi), 0)))}</td>
                <td style={td} /><td style={td} /><td style={td} />
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(loanData.total))}</td>
                <td style={td} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: WACC Girdileri */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'WACC Inputs' : 'WACC Girdileri'}
          <InfoTip t={t} lang={lang} termKey="wacc" />
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: t.gn }}>WACC ≈ {WACC.toFixed(1)}%</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Component' : 'Bileşen'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Value' : 'Değer'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Source' : 'Kaynak'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Note' : 'Not'}</th>
              </tr>
            </thead>
            <tbody>
              {waccInputs.map((w, i) => {
                const isERP = w.component.tr.includes('ERP');
                return (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                      {w.component[en ? 'en' : 'tr']}
                      {isERP && <InfoTip t={t} lang={lang} termKey="turkeyERP" />}
                    </td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{w.value}</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2, fontSize: 11.5 }}>{w.source}</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11.5 }}>{w.note[en ? 'en' : 'tr']}</td>
                  </tr>
                );
              })}
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
