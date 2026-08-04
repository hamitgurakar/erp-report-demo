import { useMemo, type CSSProperties } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { FinancialPeriod, ComputeCtx } from '../../../types/finance';
import {
  PERIODS_ANNUAL, incomeRaw, balanceRaw, cashflowRaw, BALANCE_ROWS, INCOME_ROWS, CASHFLOW_ROWS,
  netIncomeOf, TOTAL_SHARES, divSumInPeriod, dividendEventsSeed,
} from '../../../constants/financeData';
import { scorecardCategories, riskModels } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  StatusBadge, GaugeCard, type FinAlert,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

// ── Skorlama tanımı (tek yer) ──
const gradeOf = (s: number) => (s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F');
const CRITICAL = ['Nakit-Likidite', 'Finansal Sağlık'];
const compositeScore = (() => {
  const wSum = scorecardCategories.reduce((s, c) => s + c.weight, 0);
  let comp = scorecardCategories.reduce((s, c) => s + c.score * c.weight, 0) / wSum;
  const critF = scorecardCategories.some((c) => CRITICAL.includes(c.key.tr) && c.score < 40);
  if (critF) comp = Math.min(comp, 69);
  return comp;
})();

// Drill-down eşlemesi
const DRILL: Record<string, string> = {
  'Değerleme': 'muhasebe__6', 'Büyüme': 'muhasebe__0', 'Karlılık': 'muhasebe__0', 'Finansal Sağlık': 'muhasebe__5',
  'Nakit-Likidite': 'muhasebe__1', 'Sermaye Verimliliği': 'muhasebe__1', 'Ortak Getirisi': 'yonetim__6', 'Yönetim Kalitesi': 'muhasebe__0',
};
const SUBMETRIC: Record<string, { tr: string; en: string; bench: string }> = {
  'Değerleme': { tr: 'EV/EBITDA, F/K peer’a göre', en: 'EV/EBITDA, P/E vs peers', bench: 'Peer medyan' },
  'Büyüme': { tr: 'Hasılat/FAVÖK/FCF CAGR (3y)', en: 'Revenue/EBITDA/FCF CAGR (3y)', bench: '>%15' },
  'Karlılık': { tr: 'Marjlar + ROE/ROA', en: 'Margins + ROE/ROA', bench: 'Sektör üstü' },
  'Finansal Sağlık': { tr: 'Kaldıraç + likidite + Altman Z', en: 'Leverage + liquidity + Altman Z', bench: 'Z>2.99' },
  'Nakit-Likidite': { tr: 'FCF marjı, cari/quick, runway', en: 'FCF margin, current/quick, runway', bench: 'Quick≥1.0' },
  'Sermaye Verimliliği': { tr: 'ROIC, CCC, aktif devir', en: 'ROIC, CCC, asset turnover', bench: 'ROIC>WACC' },
  'Ortak Getirisi': { tr: 'TSR, temettü karşılama, EVA', en: 'TSR, dividend coverage, EVA', bench: 'EVA>0' },
  'Yönetim Kalitesi': { tr: 'Kâr kalitesi, Piotroski F, Beneish M', en: 'Earnings quality, Piotroski F, Beneish M', bench: 'F≥7' },
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

export const Scorecard = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const periods = PERIODS_ANNUAL;
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];

  const B = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(BALANCE_ROWS, balanceRaw, p)])), [periods]);
  const I = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(INCOME_ROWS, incomeRaw, p)])), [periods]);
  const CF = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, resolveRows(CASHFLOW_ROWS, cashflowRaw, p)])), [periods]);

  // ── Altman Z (cari) ──
  const altmanZ = (() => {
    const b = B[curr.id], id = curr.id;
    const TA = b.totalAssets ?? 1;
    const WC = (b.currentAssets ?? 0) - (b.currentLiab ?? 0);
    const RE = balanceRaw[id].retained ?? 0;
    const EBIT = I[id].ebit ?? 0;
    const mktEq = curr.sharePrice * TOTAL_SHARES;
    const TL = b.totalLiab ?? 1;
    const REV = incomeRaw[id].revenue ?? 0;
    return 1.2 * (WC / TA) + 1.4 * (RE / TA) + 3.3 * (EBIT / TA) + 0.6 * (mktEq / TL) + 1.0 * (REV / TA);
  })();

  // ── Piotroski F (cari vs önceki) ──
  const piotroskiF = (() => {
    const bc = B[curr.id], bp = B[prev.id], ic = I[curr.id], ip = I[prev.id];
    const niC = netIncomeOf(curr.id), niP = netIncomeOf(prev.id);
    const cfoC = CF[curr.id].operatingCF ?? 0;
    const roaC = niC / (bc.totalAssets ?? 1), roaP = niP / (bp.totalAssets ?? 1);
    const levC = (balanceRaw[curr.id].ltDebt ?? 0) / (bc.totalAssets ?? 1), levP = (balanceRaw[prev.id].ltDebt ?? 0) / (bp.totalAssets ?? 1);
    const crC = (bc.currentAssets ?? 0) / (bc.currentLiab ?? 1), crP = (bp.currentAssets ?? 0) / (bp.currentLiab ?? 1);
    const gmC = ic.grossMargin ?? 0, gmP = ip.grossMargin ?? 0;
    const atC = (incomeRaw[curr.id].revenue ?? 0) / (bc.totalAssets ?? 1), atP = (incomeRaw[prev.id].revenue ?? 0) / (bp.totalAssets ?? 1);
    const crit = [niC > 0, cfoC > 0, roaC > roaP, cfoC > niC, levC < levP, crC > crP, true /* pay ihracı yok */, gmC > gmP, atC > atP];
    return crit.filter(Boolean).length;
  })();

  const beneishM = riskModels.find((r) => r.model.tr.includes('Beneish'))?.value ?? -1.9;

  // ── KPI: 8 kategori ──
  const gradeColor = (g: string) => (g === 'A' ? t.gn : g === 'B' ? t.pr : g === 'C' ? t.am : g === 'D' ? t.co : t.rd);
  const kpis = scorecardCategories.map((c) => ({
    title: c.key[en ? 'en' : 'tr'], value: `${c.score} · ${gradeOf(c.score)}`,
    goodDir: 'up' as const, spark: periods.map((_, i) => c.score * (0.9 + 0.1 * (i / (periods.length - 1)))),
    color: gradeColor(gradeOf(c.score)), trend: { value: c.trend === 'up' ? 2 : c.trend === 'down' ? -2 : 0, isRatio: true },
  }));

  // ── radar ──
  const radar = scorecardCategories.map((c) => ({ cat: c.key[en ? 'en' : 'tr'].split(' ')[0], score: c.score }));

  // ── Piotroski bar (kriter kırılımı) ──
  const fBars = Array.from({ length: 9 }, (_, i) => ({ n: `${i + 1}`, v: i < piotroskiF ? 1 : 0 }));

  // ── kategori yatay bar ──
  const catBars = [...scorecardCategories].sort((a, b) => b.score - a.score).map((c) => ({ name: c.key[en ? 'en' : 'tr'], score: c.score, grade: gradeOf(c.score) }));

  // ── kompozit trend ──
  const compTrend = periods.map((p, i) => ({ period: p.label, comp: compositeScore * (0.92 + 0.08 * (i / (periods.length - 1))) }));

  const risks = [
    { model: en ? 'Altman Z-Score' : 'Altman Z-Score', value: altmanZ, fmt: altmanZ.toFixed(2), zone: altmanZ > 2.99 ? (en ? 'Safe' : 'Güvenli') : altmanZ >= 1.81 ? (en ? 'Grey' : 'Gri') : (en ? 'Distress' : 'Tehlike'), tone: (altmanZ > 2.99 ? 'green' : altmanZ >= 1.81 ? 'amber' : 'red') as const, term: 'altmanZ' },
    { model: 'Piotroski F-Score', value: piotroskiF, fmt: `${piotroskiF}/9`, zone: piotroskiF >= 8 ? (en ? 'Strong' : 'Güçlü') : piotroskiF >= 5 ? (en ? 'Moderate' : 'Orta') : (en ? 'Weak' : 'Zayıf'), tone: (piotroskiF >= 8 ? 'green' : piotroskiF >= 5 ? 'amber' : 'red') as const, term: 'piotroskiF' },
    { model: 'Beneish M-Score', value: beneishM, fmt: beneishM.toFixed(2), zone: beneishM < -2.22 ? (en ? 'Low risk' : 'Düşük risk') : (en ? 'Above threshold' : 'Eşik üstü'), tone: (beneishM < -2.22 ? 'green' : 'amber') as const, term: 'beneishM' },
  ];

  const alerts: FinAlert[] = [
    { severity: 'good', text: en
      ? `Altman Z ${altmanZ.toFixed(1)} (${altmanZ > 2.99 ? 'Safe zone' : 'Grey zone'}); bankruptcy risk is low.`
      : `Altman Z ${altmanZ.toFixed(1)} (${altmanZ > 2.99 ? 'Güvenli bölge' : 'Gri bölge'}); iflas riski düşük.` },
    { severity: 'watch', text: en
      ? `Piotroski F ${piotroskiF}/9; operating cash flow exceeds net income (+1) but leverage rose (−1).`
      : `Piotroski F ${piotroskiF}/9; operasyonel nakit akışı net kârı aşıyor (+1) ama kaldıraç arttı (−1).` },
    { severity: 'warning', text: en
      ? `Beneish M ${beneishM.toFixed(1)} (above the −2.22 threshold); accruals rising — review earnings quality.`
      : `Beneish M ${beneishM.toFixed(1)} (eşik −2.22 üstünde); tahakkuklarda artış — kâr kalitesi gözden geçirilmeli.` },
    { severity: 'tip', text: en
      ? `Weakest category Valuation (C); strongest Profitability (A−). Weighted composite ${compositeScore.toFixed(0)}/100 = ${gradeOf(compositeScore)}.`
      : `En düşük kategori Değerleme (C); en güçlü Karlılık (A−). Kompozit ağırlıklı skor ${compositeScore.toFixed(0)}/100 = ${gradeOf(compositeScore)}.` },
  ];

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const trendIcon = (tr: string) => tr === 'up' ? <Icon name="arrowUp" size={12} color={t.gn} /> : tr === 'down' ? <Icon name="arrowDown" size={12} color={t.rd} /> : <span style={{ color: t.tx3 }}>—</span>;

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin8}
      subtitle={en ? 'Composite health from 8 categories fed by pages P1–P8; the scoring definition lives here (single source).' : '8 kategoriden kompozit sağlık — P1–P8’den beslenir; hesaplama tanımı burada (tek yer).'}
      crossLink={{ label: en ? 'CFO Cockpit →' : 'CFO Kokpiti →', onClick: () => onSelectRep?.('muhasebe__9') }}
    >
      {/* Kompozit skor başlık */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 4, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 20, flex: '1 1 320px' }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <GaugeCard t={t} value={compositeScore} min={0} max={100} format={(v) => `${Math.round(v)}`} centerText={gradeOf(compositeScore)} label={en ? 'Composite' : 'Kompozit'}
              thresholds={[{ limit: 40, color: t.rd }, { limit: 55, color: t.co }, { limit: 70, color: t.am }, { limit: 85, color: t.pr }, { limit: 100, color: t.gn }]} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: t.tx2, display: 'flex', alignItems: 'center' }}>{en ? 'Composite Health Score' : 'Kompozit Finansal Sağlık Skoru'}<InfoTip t={t} lang={lang} termKey="healthComposite" /></div>
            <div style={{ fontSize: 44, fontWeight: 800, color: gradeColor(gradeOf(compositeScore)), lineHeight: 1.1 }}>{gradeOf(compositeScore)}</div>
            <div style={{ fontSize: 12, color: t.tx3 }}>{compositeScore.toFixed(1)} / 100</div>
          </div>
        </div>
      </div>

      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} />
        ))}
      </KPIBand>

      {/* Row: Radar + Altman gauge */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? '8-Category Radar' : '8-Kategori Radar'}
          why={en ? 'Fintables Karne + Seeking Alpha factor-grade radar pattern.' : 'Fintables Karne + Seeking Alpha factor-grade radar deseni.'}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radar} outerRadius={95}>
              <PolarGrid stroke={t.bd} />
              <PolarAngleAxis dataKey="cat" tick={{ fontSize: 10, fill: t.tx2 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} />
              <Radar dataKey="score" stroke={t.pr} fill={t.pr} fillOpacity={0.35} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v}/100`} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? 'Altman Z-Score' : 'Altman Z-Score'}
          right={<InfoTip t={t} lang={lang} termKey="altmanZ" />}
          why={en ? 'Stock Rover Altman-Z gauge (Altman 1968): >2.99 Safe, 1.81-2.99 Grey, <1.81 Distress.' : 'Stock Rover Altman-Z gauge (Altman 1968): Z>2.99 Güvenli, 1.81-2.99 Gri, <1.81 Tehlike.'}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
            <GaugeCard t={t} value={altmanZ} min={0} max={6} format={(v) => v.toFixed(2)} label={en ? 'Z-Score' : 'Z-Skoru'}
              thresholds={[{ limit: 1.81, color: t.rd }, { limit: 2.99, color: t.am }, { limit: 6, color: t.gn }]} />
          </div>
        </ChartCard>
      </div>

      {/* Row: Piotroski + Beneish */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? `Piotroski F-Score — ${piotroskiF}/9` : `Piotroski F-Score — ${piotroskiF}/9`}
          right={<InfoTip t={t} lang={lang} termKey="piotroskiF" />}
          why={en ? 'Stockopedia/Quant-Investing F-score pattern; 8-9 strong.' : 'Stockopedia/Quant-Investing F-score deseni; 8-9 güçlü.'}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={fBars} margin={{ top: 12, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="n" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => (v ? (en ? 'Pass' : 'Geçti') : (en ? 'Fail' : 'Kaldı'))} labelFormatter={(lb) => `${en ? 'Criterion' : 'Kriter'} ${lb}`} />
              <Bar dataKey="v" radius={[3, 3, 0, 0]} barSize={26}>
                {fBars.map((b, i) => <Cell key={i} fill={b.v ? t.gn : t.bd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title="Beneish M-Score"
          right={<InfoTip t={t} lang={lang} termKey="beneishM" />}
          why={en ? 'Earnings-manipulation forensic (Beneish 1999); < −2.22 low risk.' : 'earnings-manipulation forensic (Beneish 1999); < −2.22 düşük risk.'}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 210, gap: 16, padding: '0 12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: beneishM < -2.22 ? t.gn : t.am }}>{beneishM.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: t.tx3 }}>{beneishM < -2.22 ? (en ? 'Low manipulation risk' : 'Düşük manipülasyon riski') : (en ? 'Above threshold — monitor' : 'Eşik üstü — izle')}</div>
            </div>
            {/* eşik göstergesi */}
            <div style={{ position: 'relative', height: 10, background: `linear-gradient(90deg, ${t.gn}, ${t.am}, ${t.rd})`, borderRadius: 5 }}>
              {(() => { const lo = -4, hi = 0; const f = Math.max(0, Math.min(1, (beneishM - lo) / (hi - lo))); const thr = (-2.22 - lo) / (hi - lo);
                return (<>
                  <div style={{ position: 'absolute', left: `${thr * 100}%`, top: -4, bottom: -4, width: 2, background: t.tx }} />
                  <div style={{ position: 'absolute', left: `calc(${f * 100}% - 6px)`, top: -3, width: 12, height: 12, borderRadius: 6, background: t.cd, border: `2px solid ${t.tx}` }} />
                </>); })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.tx3 }}><span>-4</span><span>{en ? 'threshold −2.22' : 'eşik −2.22'}</span><span>0</span></div>
          </div>
        </ChartCard>
      </div>

      {/* Row: Kategori yatay bar + Kompozit trend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'Category Scores' : 'Kategori Skorları'}
          why={en ? 'Seeking Alpha A+–F factor-grade pattern (color-coded).' : 'Seeking Alpha A+–F factor-grade deseni (renk kodlu).'}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={catBars} layout="vertical" margin={{ top: 6, right: 24, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, _n, p) => [`${v}/100 · ${(p?.payload as { grade: string }).grade}`, en ? 'Score' : 'Skor']} />
              <Bar dataKey="score" radius={[0, 3, 3, 0]} barSize={18}>
                {catBars.map((c, i) => <Cell key={i} fill={gradeColor(c.grade)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? 'Composite Score Trend' : 'Kompozit Skor Trendi'}
          why={en ? 'StockTitan financial-health-score trend pattern.' : 'StockTitan financial-health-score trend deseni.'}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={compTrend} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <ReferenceLine y={70} stroke={t.tx3} strokeDasharray="5 3" label={{ value: 'B', fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(0)}/100`} />
              <Line type="monotone" dataKey="comp" name={en ? 'Composite' : 'Kompozit'} stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Skorkart Detayı */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Scorecard Detail' : 'Skorkart Detayı'}
          <InfoTip t={t} lang={lang} termKey="healthComposite" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Category' : 'Kategori'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Sub-metrics' : 'Alt-metrikler'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Benchmark' : 'Benchmark'}</th>
                <th style={th}>{en ? 'Score' : 'Skor'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Grade' : 'Harf'}</th>
                <th style={th}>{en ? 'Weight' : 'Ağırlık'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Trend' : 'Trend'}</th>
                <th style={{ ...th, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {[...scorecardCategories].sort((a, b) => b.weight - a.weight).map((c) => {
                const sm = SUBMETRIC[c.key.tr];
                const g = gradeOf(c.score);
                return (
                  <tr key={c.key.tr}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 600, color: CRITICAL.includes(c.key.tr) ? t.tx : t.tx }}>
                      {c.key[en ? 'en' : 'tr']}{CRITICAL.includes(c.key.tr) && <span style={{ color: t.rd, marginLeft: 4 }} title={en ? 'Critical category' : 'Kritik kategori'}>*</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2, fontSize: 11.5 }}>{sm?.[en ? 'en' : 'tr']}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{sm?.bench}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{c.score}</td>
                    <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} dot={false} tone={g === 'A' ? 'green' : g === 'B' ? 'blue' : g === 'C' ? 'amber' : 'red'} label={g} /></td>
                    <td style={{ ...td, color: t.tx2 }}>{c.weight}%</td>
                    <td style={{ ...td, textAlign: 'center' }}>{trendIcon(c.trend)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button title={en ? 'Drill down' : 'Detaya git'} onClick={() => onSelectRep?.(DRILL[c.key.tr])} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}>
                        <Icon name="externalLink" size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '9px 16px', borderTop: `1px solid ${t.bd}` }}>
          {en ? '* Critical category (Financial Health / Cash-Liquidity): if F, the composite is capped at C. Missing category = 0.' : '* Kritik kategori (Finansal Sağlık / Nakit-Likidite): F ise kompozit en fazla C ile sınırlanır. Eksik veri kategorisi = 0.'}
        </div>
      </div>

      {/* Tablo 2: Risk Skorları */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Risk Scores' : 'Risk Skorları'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Model' : 'Model'}</th>
                <th style={th}>{en ? 'Value' : 'Değer'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Zone / Comment' : 'Bölge / Yorum'}</th>
                <th style={{ ...th, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.model}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{r.model}<InfoTip t={t} lang={lang} termKey={r.term} /></td>
                  <td style={{ ...td, fontWeight: 600 }}>{r.fmt}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={r.tone} label={r.zone} /></td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{en ? 'computed' : 'hesaplanan'}</td>
                </tr>
              ))}
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
