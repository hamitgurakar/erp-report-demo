import { useMemo, useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode, ComputeCtx } from '../../../types/finance';
import {
  PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw, BALANCE_ROWS, INCOME_ROWS,
  netIncomeOf, TOTAL_SHARES, divSumInPeriod, dividendEventsSeed, PARTNERS,
} from '../../../constants/financeData';
import { partnerReturns, capTableEvolution, dupontFactors } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  Dropdown, Waterfall, type FinAlert,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

const WACC_REAL = 17; // reel bazlı WACC (nominal %36 Borçluluk sayfasında); reel ROIC ile kıyas için

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

// Temettü dağıtımları (beyan) — distributionId bazında yeniden kur
const DISTS = (() => {
  const m: Record<string, { id: string; date: string; total: number; byPartner: Record<string, number> }> = {};
  dividendEventsSeed.filter((e) => e.type === 'beyan').forEach((e) => {
    if (!m[e.distributionId]) m[e.distributionId] = { id: e.distributionId, date: e.date, total: 0, byPartner: {} };
    m[e.distributionId].total += e.amountTRY;
    m[e.distributionId].byPartner[e.partnerId] = (m[e.distributionId].byPartner[e.partnerId] ?? 0) + e.amountTRY;
  });
  return Object.values(m).sort((a, b) => b.date.localeCompare(a.date));
})();

export const ShareholderReturns = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const B = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(BALANCE_ROWS, balanceRaw, p)])), [periods]);
  const I = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(INCOME_ROWS, incomeRaw, p)])), [periods]);
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];
  const currIdx = periods.length - 1;

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod = curr) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const fmtPS = (vTRY: number) => `${sym}${conv(vTRY).toFixed(3)}`;
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');
  const ordered = order === 'newestRight' ? periods : [...periods].reverse();
  const ann = (p: FinancialPeriod) => (p.type === 'annual' ? 1 : 4);

  // ── metrikler ──
  const niAnnual = (p: FinancialPeriod) => netIncomeOf(p.id) * ann(p);
  const roeOf = (p: FinancialPeriod) => { const e = B[p.id].equity ?? 0; return e ? (niAnnual(p) / e) * 100 : 0; };
  const roaOf = (p: FinancialPeriod) => { const a = B[p.id].totalAssets ?? 0; return a ? (niAnnual(p) / a) * 100 : 0; };
  const tangICof = (p: FinancialPeriod) => (B[p.id].equity ?? 0) + (B[p.id].netDebt ?? 0) - (balanceRaw[p.id].goodwill ?? 0) - (balanceRaw[p.id].intangibles ?? 0);
  const roicOf = (p: FinancialPeriod) => { const ic = tangICof(p); const nopat = (I[p.id].ebit ?? 0) * ann(p) * 0.75; return ic ? (nopat / ic) * 100 : 0; };
  const evaOf = (p: FinancialPeriod) => ((roicOf(p) - WACC_REAL) / 100) * tangICof(p);
  const divBeyanOf = (p: FinancialPeriod) => divSumInPeriod(dividendEventsSeed, p, 'beyan');
  const payoutOf = (p: FinancialPeriod) => { const ni = netIncomeOf(p.id); return ni ? (divBeyanOf(p) / ni) * 100 : 0; };
  const coverageOf = (p: FinancialPeriod) => { const d = divBeyanOf(p); return d ? netIncomeOf(p.id) / d : 0; };
  const dpsOf = (p: FinancialPeriod) => divBeyanOf(p) / TOTAL_SHARES;
  const tsrOf = (p: FinancialPeriod, idx: number) => { if (idx < 1) return 0; const p0 = periods[idx - 1].sharePrice, p1 = p.sharePrice; return p0 ? ((p1 - p0 + dpsOf(p)) / p0) * 100 : 0; };

  const kpis = [
    { title: 'ROE', term: 'roe', goodDir: 'up' as const, value: `${roeOf(curr).toFixed(1)}%`, trend: { value: roeOf(curr) - roeOf(prev), isRatio: true }, spark: periods.map(roeOf), color: t.pr },
    { title: 'ROIC', term: 'roic', goodDir: 'up' as const, value: `${roicOf(curr).toFixed(1)}%`, trend: { value: roicOf(curr) - roicOf(prev), isRatio: true }, spark: periods.map(roicOf), color: t.tl },
    { title: 'ROA', term: 'roa', goodDir: 'up' as const, value: `${roaOf(curr).toFixed(1)}%`, trend: { value: roaOf(curr) - roaOf(prev), isRatio: true }, spark: periods.map(roaOf), color: t.pu },
    { title: en ? 'Payout Ratio' : 'Dağıtım Oranı', term: 'payout', goodDir: 'up' as const, value: `${payoutOf(curr).toFixed(0)}%`, trend: { value: payoutOf(curr) - payoutOf(prev), isRatio: true }, spark: periods.map(payoutOf), color: t.am },
    { title: en ? 'Dividend Coverage' : 'Temettü Karşılama', term: 'dividendCoverage', goodDir: 'up' as const, value: `${coverageOf(curr).toFixed(2)}x`, trend: { value: coverageOf(curr) - coverageOf(prev), isRatio: true }, spark: periods.map(coverageOf), color: t.gn },
    { title: 'DPS', term: 'dps', goodDir: 'up' as const, value: fmtPS(dpsOf(curr)), trend: { value: 0 }, spark: periods.map((p) => conv(dpsOf(p), p)), color: t.c1 },
    { title: 'TSR', term: 'tsr', goodDir: 'up' as const, value: `${tsrOf(curr, currIdx).toFixed(1)}%`, trend: { value: tsrOf(curr, currIdx) - tsrOf(prev, currIdx - 1), isRatio: true }, spark: periods.map((p, i) => tsrOf(p, i)), color: t.co },
    { title: 'EVA', term: 'eva', goodDir: 'up' as const, value: fmtC(conv(evaOf(curr), curr)), trend: { value: roicOf(curr) - WACC_REAL, isRatio: true }, spark: periods.map((p) => conv(evaOf(p), p)), color: t.c2 },
  ];

  // ── Chart 2: Temettü geçmişi bar + karşılama çizgi ──
  const divHist = ordered.map((p) => ({ period: pl(p), div: conv(divBeyanOf(p), p), coverage: coverageOf(p) }));

  // ── Chart 3: TSR köprüsü ──
  const priceRet = currIdx >= 1 ? ((curr.sharePrice - periods[currIdx - 1].sharePrice) / periods[currIdx - 1].sharePrice) * 100 : 0;
  const earningsGrowth = currIdx >= 1 ? ((netIncomeOf(curr.id) - netIncomeOf(periods[currIdx - 1].id)) / (Math.abs(netIncomeOf(periods[currIdx - 1].id)) || 1)) * 100 : 0;
  const divYield = currIdx >= 1 ? (dpsOf(curr) / periods[currIdx - 1].sharePrice) * 100 : 0;
  const multipleChange = priceRet - earningsGrowth;
  const tsrSteps = [
    { label: en ? 'Earnings Growth' : 'Kâr Büyümesi', value: earningsGrowth, isTotal: false },
    { label: en ? 'Multiple Change' : 'Çarpan Değişimi', value: multipleChange, isTotal: false },
    { label: en ? 'Dividend Yield' : 'Temettü Getirisi', value: divYield, isTotal: false },
    { label: 'TSR', value: earningsGrowth + multipleChange + divYield, isTotal: true },
  ];

  // ── Chart 4: Ortak bazında getiri stacked-bar ──
  const partnerBars = partnerReturns.map((pr) => ({ name: pr.name.split(' ')[0], cumulative: conv(pr.cumulativeDiv - pr.thisPeriod), thisPeriod: conv(pr.thisPeriod), pct: pr.pct }));

  // ── Chart 5: Cap table evrimi ──
  const capEvo = capTableEvolution.map((c) => ({ period: c.period, ...c }));

  // ── Chart 6: ROIC vs WACC trend ──
  const roicTrend = ordered.map((p) => ({ period: pl(p), roic: roicOf(p), wacc: WACC_REAL, spread: roicOf(p) - WACC_REAL }));

  // ── DuPont ──
  const roeDuPont = dupontFactors.reduce((acc, f) => acc * (f.unit === '%' ? f.value / 100 : f.value), 1) * 100;

  const alerts: FinAlert[] = [
    { severity: 'good', text: en
      ? `ROIC ${roicOf(curr).toFixed(0)}% > WACC ${WACC_REAL}% (real); the company creates value with a ~${(roicOf(curr) - WACC_REAL).toFixed(0)}pp positive spread (positive EVA).`
      : `ROIC %${roicOf(curr).toFixed(0)} > WACC %${WACC_REAL} (reel); şirket ~${(roicOf(curr) - WACC_REAL).toFixed(0)}pp pozitif spread ile değer yaratıyor (pozitif EVA).` },
    { severity: 'watch', text: en
      ? 'DuPont: most of the ROE uplift comes from the equity multiplier (leverage), not margin — durability should be questioned.'
      : 'DuPont: ROE artışının çoğu özkaynak çarpanından (kaldıraç) geliyor, marjdan değil — kalıcılığı sorgulanmalı.' },
    { severity: 'warning', text: en
      ? `Payout ${payoutOf(curr).toFixed(0)}%; FCF coverage fell to ~1.1x — dividend sustainability is under pressure.`
      : `Dağıtım oranı %${payoutOf(curr).toFixed(0)}; FCF karşılaması ~1.1x’e düştü, temettü sürdürülebilirliği baskı altında.` },
    { severity: 'tip', text: en
      ? 'Hasan Topalakcı has received ₺3.2M cumulative dividends (30% stake); distribution is consistent with the cap table.'
      : 'Hasan Topalakcı kümülatif ₺3.2M temettü aldı (%30 pay); dağıtım cap table ile tutarlı.' },
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
  const partnerName = (id: string) => PARTNERS.find((p) => p.id === id)?.name ?? id;

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin7}
      subtitle={en ? 'Returns, DuPont and shareholder distributions. Dividend records are kept in one place (Financial Data › Shareholder Returns).' : 'Getiri, DuPont ve ortak dağıtımları. Temettü kaydı tek yerde tutulur (Finansal Veriler › Ortak Getirisi).'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Dividend register: Financial Data →' : 'Temettü kaydı: Finansal Veriler →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* DuPont ROE ağacı (5-faktör) */}
      <ChartCard t={t} lang={lang} title={en ? 'DuPont ROE Decomposition (5-factor)' : 'DuPont ROE Ayrıştırması (5-faktör)'}
        right={<InfoTip t={t} lang={lang} termKey="dupont" />}
        why={en ? 'Wall Street Prep/Umbrex DuPont-tree standard — splits ROE into operating & leverage drivers.' : 'Wall Street Prep/Umbrex DuPont-tree standardı; ROE’yi operasyon/kaldıraç sürücülerine ayrıştırır.'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
          {dupontFactors.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ border: `1px solid ${t.bd}`, borderRadius: 8, padding: '10px 14px', background: t.bg2, textAlign: 'center', minWidth: 110 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.tx }}>{f.value}{f.unit}</div>
                <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 2 }}>{f.key[en ? 'en' : 'tr']}</div>
              </div>
              <span style={{ fontSize: 16, color: t.tx3, fontWeight: 600 }}>×</span>
            </div>
          ))}
          <div style={{ border: `2px solid ${t.pr}`, borderRadius: 8, padding: '10px 16px', background: t.prL, textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.pr }}>{roeDuPont.toFixed(1)}%</div>
            <div style={{ fontSize: 10.5, color: t.pr, marginTop: 2 }}>ROE</div>
          </div>
        </div>
      </ChartCard>

      {/* Row: Temettü geçmişi + TSR köprüsü */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'Dividend History + Coverage' : 'Temettü Geçmişi + Karşılama'}
          why={en ? 'Seeking Alpha dividend-history-with-coverage pattern.' : 'Seeking Alpha dividend-history-with-coverage deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={divHist} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}x`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'coverage' ? `${v.toFixed(2)}x` : fmtC(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="div" name={en ? 'Dividend' : 'Temettü'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={26} />
              <Line yAxisId="r" type="monotone" dataKey="coverage" name={en ? 'Coverage' : 'Karşılama'} stroke={t.gn} strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? `TSR Bridge — ${pl(curr)}` : `TSR Köprüsü — ${pl(curr)}`}
          why={en ? 'Morgan Stanley/Umbrex TSR-decomposition pattern (earnings + multiple + yield).' : 'Morgan Stanley/Umbrex TSR-decomposition deseni (kâr + çarpan + getiri).'}>
          <Waterfall steps={tsrSteps} t={t} fmt={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp`} pp />
        </ChartCard>
      </div>

      {/* Row: Ortak getiri + Cap table evrimi */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Return by Partner' : 'Ortak Bazında Getiri'}
          why={en ? 'Cap-table per-partner return pattern (35% / 35% / 30%).' : 'cap-table per-partner return deseni (%35 / %35 / %30).'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={partnerBars} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="cumulative" name={en ? 'Prior Cumulative' : 'Önceki Kümülatif'} stackId="a" fill={t.tl} radius={[0, 0, 0, 0]} barSize={44} />
              <Bar dataKey="thisPeriod" name={en ? 'This Period' : 'Bu Dönem'} stackId="a" fill={t.pr} radius={[3, 3, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Cap Table Evolution' : 'Cap Table Evrimi'}
          why={en ? 'Carta cap-table-evolution pattern (20,000,000 shares).' : 'Carta cap-table-evolution deseni (20.000.000 hisse).'}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={capEvo} margin={{ top: 6, right: 8, bottom: 0, left: -8 }} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="abdulhamit" name="Abdülhamit" stackId="1" stroke={t.pr} fill={t.pr} fillOpacity={0.55} />
              <Area type="monotone" dataKey="ahmet" name="Ahmet" stackId="1" stroke={t.tl} fill={t.tl} fillOpacity={0.55} />
              <Area type="monotone" dataKey="hasan" name="Hasan" stackId="1" stroke={t.am} fill={t.am} fillOpacity={0.55} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ROIC vs WACC trend */}
      <div style={{ marginTop: 14 }}>
        <ChartCard t={t} lang={lang} title={en ? 'ROIC vs WACC (spread)' : 'ROIC vs WACC (spread)'}
          why={en ? 'Value-creation / EVA pattern; ROIC above WACC (real) creates economic value.' : 'value-creation/EVA deseni; ROIC, WACC’ın (reel) üstündeyse ekonomik değer yaratır.'}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={roicTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={WACC_REAL} stroke={t.rd} strokeDasharray="5 3" label={{ value: `WACC ${WACC_REAL}%`, fontSize: 10, fill: t.rd, position: 'insideTopRight' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Line type="monotone" dataKey="roic" name="ROIC" stroke={t.gn} strokeWidth={2.5} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Temettü Defteri */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Dividend Register' : 'Temettü Defteri'}
          <button onClick={() => onSelectRep?.('yonetim__4')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: `1px solid ${t.pr}`, background: t.pr, color: '#fff', cursor: 'pointer' }}>
            <Icon name="plus" size={13} color="#fff" />{en ? 'Add Dividend Record' : 'Temettü Kaydı Ekle'}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Date' : 'Tarih'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Period' : 'Dönem'}</th>
                <th style={th}>{en ? 'Total Dividend' : 'Toplam Temettü'}</th>
                <th style={th}>DPS</th>
                <th style={th}>{en ? 'Payout' : 'Payout'}</th>
                <th style={th}>{en ? 'Coverage' : 'Karşılama'}</th>
                {PARTNERS.map((pt) => <th key={pt.id} style={th}>{pt.name.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {DISTS.map((d) => {
                const year = d.date.slice(0, 4);
                const ni = netIncomeOf(year);
                const payout = ni ? (d.total / ni) * 100 : 0;
                const cov = d.total ? ni / d.total : 0;
                return (
                  <tr key={d.id}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{d.date}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{year}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(d.total))}</td>
                    <td style={td}>{fmtPS(d.total / TOTAL_SHARES)}</td>
                    <td style={{ ...td, color: payout > 90 ? t.am : t.tx }}>{payout.toFixed(0)}%</td>
                    <td style={{ ...td, color: cov >= 1.5 ? t.gn : cov >= 1 ? t.am : t.rd }}>{cov.toFixed(2)}x</td>
                    {PARTNERS.map((pt) => <td key={pt.id} style={{ ...td, color: t.tx2 }}>{fmtC(conv(d.byPartner[pt.id] ?? 0))}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Ortak Getiri Özeti */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Partner Return Summary' : 'Ortak Getiri Özeti'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Partner' : 'Ortak'}</th>
                <th style={th}>{en ? 'Stake %' : 'Pay %'}</th>
                <th style={th}>{en ? 'Shares' : 'Pay Adedi'}</th>
                <th style={th}>{en ? 'Cumulative Div.' : 'Kümülatif Temettü'}</th>
                <th style={th}>{en ? 'This Period' : 'Bu Dönem'}</th>
                <th style={th}>TSR</th>
              </tr>
            </thead>
            <tbody>
              {partnerReturns.map((pr) => (
                <tr key={pr.partnerId}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{partnerName(pr.partnerId)}</td>
                  <td style={td}>{pr.pct}%</td>
                  <td style={{ ...td, color: t.tx2 }}>{(pr.shares / 1e6).toFixed(1)}M</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(pr.cumulativeDiv))}</td>
                  <td style={{ ...td, color: t.tx2 }}>{fmtC(conv(pr.thisPeriod))}</td>
                  <td style={td}>{pr.tsr.toFixed(1)}%</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>{en ? 'Total' : 'Toplam'}</td>
                <td style={{ ...td, fontWeight: 700 }}>100%</td>
                <td style={{ ...td, fontWeight: 700 }}>{(TOTAL_SHARES / 1e6).toFixed(0)}M</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(partnerReturns.reduce((s, p) => s + p.cumulativeDiv, 0)))}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtC(conv(partnerReturns.reduce((s, p) => s + p.thisPeriod, 0)))}</td>
                <td style={td} />
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
