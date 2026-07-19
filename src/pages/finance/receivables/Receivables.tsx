import { useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode } from '../../../types/finance';
import { PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw } from '../../../constants/financeData';
import { arAgingByCustomer, collectionWorklist } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  StatusBadge, Dropdown, Gauge, type FinAlert,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

const daysOf = (p: FinancialPeriod) => (p.type === 'annual' ? 365 : 90);

// Yaşlandırma snapshot toplamları
const AG = arAgingByCustomer;
const totalAR = AG.reduce((s, c) => s + c.total, 0);
const currentAR = AG.reduce((s, c) => s + c.current, 0);
const overdueAR = totalAR - currentAR;
const d90AR = AG.reduce((s, c) => s + c.d90plus, 0);
const currentShare = currentAR / totalAR;
const overduePct = (overdueAR / totalAR) * 100;
const concTop5 = [...AG].sort((a, b) => b.total - a.total).slice(0, 5).reduce((s, c) => s + c.total, 0) / totalAR * 100;
// Ortalama gecikme (bucket orta noktaları)
const MID = { d1_30: 15, d31_60: 45, d61_90: 75, d90plus: 120 };
const addNum = AG.reduce((s, c) => s + c.d1_30 * MID.d1_30 + c.d31_60 * MID.d31_60 + c.d61_90 * MID.d61_90 + c.d90plus * MID.d90plus, 0);
const avgDelay = overdueAR ? addNum / overdueAR : 0;

export const Receivables = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
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

  // ── türetilen metrikler ──
  const dsoOf = (p: FinancialPeriod) => { const rev = incomeRaw[p.id].revenue ?? 0; return rev ? ((balanceRaw[p.id].ar ?? 0) / rev) * daysOf(p) : 0; };
  const bpdsoOf = (p: FinancialPeriod) => dsoOf(p) * currentShare;
  const turnoverOf = (p: FinancialPeriod) => { const ar = balanceRaw[p.id].ar ?? 0; const rev = (incomeRaw[p.id].revenue ?? 0) * (p.type === 'annual' ? 1 : 4); return ar ? rev / ar : 0; };
  const scale = (p: FinancialPeriod) => dsoOf(p) / (dsoOf(curr) || 1); // aging snapshot'ı DSO trendine bağla
  const ceiOf = (p: FinancialPeriod) => Math.min(99, 93 / (scale(p) || 1));
  const badDebtOf = (p: FinancialPeriod) => { const rev = (incomeRaw[p.id].revenue ?? 0) * (p.type === 'annual' ? 1 : 4); return rev ? (d90AR / rev) * 100 * scale(p) : 0; };

  const cei = ceiOf(curr);
  const kpis = [
    { title: 'DSO', term: 'dso', goodDir: 'down' as const, value: `${dsoOf(curr).toFixed(0)} ${en ? 'd' : 'gün'}`,
      trend: { value: dsoOf(curr) - dsoOf(prev), isRatio: true }, spark: periods.map(dsoOf), color: t.pr },
    { title: 'BPDSO', term: 'bpdso', goodDir: 'down' as const, value: `${bpdsoOf(curr).toFixed(0)} ${en ? 'd' : 'gün'}`,
      trend: { value: bpdsoOf(curr) - bpdsoOf(prev), isRatio: true }, spark: periods.map(bpdsoOf), color: t.tl },
    { title: 'CEI', term: 'cei', goodDir: 'up' as const, value: `${cei.toFixed(0)}%`,
      trend: { value: cei - ceiOf(prev), isRatio: true }, spark: periods.map(ceiOf), color: t.gn },
    { title: en ? 'Avg. Days Delinquent' : 'Ort. Gecikme Günü', term: 'avgDelay', goodDir: 'down' as const, value: `${(avgDelay * scale(curr)).toFixed(0)} ${en ? 'd' : 'gün'}`,
      trend: { value: avgDelay * scale(curr) - avgDelay * scale(prev), isRatio: true }, spark: periods.map((p) => avgDelay * scale(p)), color: t.am },
    { title: en ? 'Overdue %' : 'Vadesi Geçmiş %', term: 'overdueRatio', goodDir: 'down' as const, value: `${(overduePct * scale(curr)).toFixed(1)}%`,
      trend: { value: overduePct * scale(curr) - overduePct * scale(prev), isRatio: true }, spark: periods.map((p) => overduePct * scale(p)), color: t.rd },
    { title: en ? 'Bad-Debt %' : 'Şüpheli Alacak %', term: 'badDebt', goodDir: 'down' as const, value: `${badDebtOf(curr).toFixed(1)}%`,
      trend: { value: badDebtOf(curr) - badDebtOf(prev), isRatio: true }, spark: periods.map(badDebtOf), color: t.co },
    { title: en ? 'AR Turnover' : 'Alacak Devir Hızı', term: 'arTurnover', goodDir: 'up' as const, value: `${turnoverOf(curr).toFixed(1)}x`,
      trend: { value: turnoverOf(curr) - turnoverOf(prev), isRatio: true }, spark: periods.map(turnoverOf), color: t.pu },
    { title: en ? 'Top-5 Concentration' : 'Müşteri Konsantrasyon (İlk-5)', term: 'customerConcentration', goodDir: 'down' as const, value: `${concTop5.toFixed(0)}%`,
      trend: { value: 0, isRatio: true }, spark: periods.map(() => concTop5), color: t.c2 },
  ];

  // ── Chart 1: Yaşlandırma stacked-bar (müşteri) ──
  const agingData = [...AG].sort((a, b) => b.total - a.total).map((c) => ({
    name: c.customer.split(' ')[0], current: conv(c.current), d1_30: conv(c.d1_30), d31_60: conv(c.d31_60), d61_90: conv(c.d61_90), d90plus: conv(c.d90plus),
  }));
  const AGING_SERIES = [
    { key: 'current', label: en ? 'Current' : 'Cari', color: t.gn },
    { key: 'd1_30', label: '1-30', color: t.tl },
    { key: 'd31_60', label: '31-60', color: t.am },
    { key: 'd61_90', label: '61-90', color: t.co },
    { key: 'd90plus', label: '90+', color: t.rd },
  ];

  // ── Chart 2: DSO vs BPDSO trend ──
  const dsoTrend = ordered.map((p) => ({ period: pl(p), dso: dsoOf(p), bpdso: bpdsoOf(p) }));

  // ── Chart 4: Konsantrasyon Pareto ──
  const paretoRaw = [...AG].sort((a, b) => b.total - a.total);
  let cum = 0;
  const pareto = paretoRaw.map((c) => { cum += c.total; return { name: c.customer.split(' ')[0], amount: conv(c.total), cumulative: (cum / totalAR) * 100 }; });

  // ── Chart 6: Beklenen tahsilat projeksiyonu ──
  const monthsLbl = en ? ['M1', 'M2', 'M3', 'M4', 'M5'] : ['Ay1', 'Ay2', 'Ay3', 'Ay4', 'Ay5'];
  const projection = monthsLbl.map((m, i) => {
    // current+1-30 → Ay1, 31-60 → Ay2, 61-90 → Ay3, 90+ recovery haircut Ay4/5
    let amt = 0;
    if (i === 0) amt = currentAR + AG.reduce((s, c) => s + c.d1_30, 0);
    else if (i === 1) amt = AG.reduce((s, c) => s + c.d31_60, 0);
    else if (i === 2) amt = AG.reduce((s, c) => s + c.d61_90, 0);
    else if (i === 3) amt = d90AR * 0.45;
    else amt = d90AR * 0.25;
    return { month: m, expected: conv(amt) };
  });

  // ── ısı haritası ──
  const heatBuckets = AGING_SERIES;
  const heatMax = Math.max(...AG.flatMap((c) => [c.current, c.d1_30, c.d31_60, c.d61_90, c.d90plus]));
  const heatColor = (v: number, base: string) => { const a = Math.max(0.06, Math.min(0.92, v / heatMax)); return { background: base, opacity: a }; };

  const statusTone = (s: string) => (s === 'doubtful' ? 'red' : s === 'overdue' ? 'amber' : 'green') as const;
  const statusLabel = (s: string) => s === 'doubtful' ? (en ? 'Doubtful' : 'Şüpheli') : s === 'overdue' ? (en ? 'Overdue' : 'Gecikmiş') : (en ? 'Current' : 'Güncel');

  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Yıldız Hediyelik ₺840K at 90+ days; no payment for 3 months. Consider a bad-debt provision and legal action.'
      : 'Yıldız Hediyelik ₺840K, 90+ gün; 3 aydır ödeme yok. Şüpheli alacak karşılığı ve yasal takip değerlendirilmeli.' },
    { severity: 'warning', text: en
      ? 'Top-5 customers hold 58% of total receivables; a single default would materially hit liquidity.'
      : 'İlk-5 müşteri toplam alacağın %58’i; tek müşteri temerrüdü likiditeyi ciddi etkiler.' },
    { severity: 'watch', text: en
      ? 'Reliable payer Ada Mağazacılık paid 22 days late this month; a behavior shift may be an early signal.'
      : 'Güvenilir ödeyen Ada Mağazacılık bu ay 22 gün geç ödedi; davranış değişimi erken sinyal olabilir.' },
    { severity: 'good', text: en
      ? 'CEI at 93%; collection discipline above sector average.'
      : 'CEI %93; tahsilat disiplini sektör ortalamasının üstünde.' },
  ];

  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={setOrder} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 9px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 9px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const actBtn = (icon: string, title: string, onClick?: () => void) => (
    <button title={title} onClick={onClick} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={12} />
    </button>
  );

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin2}
      subtitle={en ? 'Aging, collection and DSO analysis — customer master lives in Sales.' : 'Yaşlandırma, tahsilat ve DSO analizi — müşteri kartı Sales modülünde.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Customer master: Sales →' : 'Müşteri kartı: Sales →', onClick: () => onSelectRep?.('satis__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Row: Aging stacked + DSO/BPDSO */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'Aging by Customer' : 'Müşteri Bazında Yaşlandırma'}
          why={en ? 'NetSuite AR Aging + Paraşüt/Mikro aging standard — prioritizes collections.' : 'NetSuite AR Aging + Paraşüt/Mikro cari yaşlandırma standardı; tahsilat önceliklendirme.'}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agingData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {AGING_SERIES.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title="DSO vs BPDSO"
          why={en ? 'Tesorio/Smyyth DSO-to-BPDSO gap pattern (close the gap).' : 'Tesorio/Smyyth DSO-to-BPDSO gap deseni (DSO’yu BPDSO’ya yaklaştır).'}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dsoTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(0)} ${en ? 'days' : 'gün'}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="dso" name="DSO" stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="bpdso" name="BPDSO" stroke={t.tl} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: CEI gauge + Concentration Pareto */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={30} title={en ? 'Collection Effectiveness (CEI)' : 'Tahsilat Etkinliği (CEI)'}
          why={en ? 'Tratta/HighRadius CEI gauge — collection-discipline metric that contextualizes DSO.' : 'Tratta/HighRadius CEI gauge deseni; DSO’yu bağlamlayan tahsilat-disiplini metriği.'}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 240 }}>
            <Gauge t={t} value={cei} min={0} max={100} display={`${cei.toFixed(0)}%`} label={en ? 'CEI' : 'CEI'} width={200}
              bands={[{ to: 80, color: t.rd }, { to: 90, color: t.am }, { to: 100, color: t.gn }]} />
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={66} title={en ? 'Customer Concentration Pareto' : 'Müşteri Konsantrasyon Pareto'}
          why={en ? 'NetSuite "Top delinquent accounts" pattern.' : 'NetSuite "Top delinquent accounts" deseni.'}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={pareto} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'cumulative' ? `${v.toFixed(0)}%` : fmtC(v))} />
              <Bar yAxisId="l" dataKey="amount" name={en ? 'Receivable' : 'Alacak'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={30} />
              <Line yAxisId="r" type="monotone" dataKey="cumulative" name={en ? 'Cumulative' : 'Kümülatif'} stroke={t.am} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Heatmap + Projection */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'Collection Heatmap (Customer × Bucket)' : 'Tahsilat Isı Haritası (Müşteri × Bucket)'}
          why={en ? 'Vertaccount customer-risk/dispute heatmap.' : 'Vertaccount customer-risk/dispute heatmap.'}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>{en ? 'Customer' : 'Müşteri'}</th>
                  {heatBuckets.map((b) => <th key={b.key} style={{ ...th, textAlign: 'center' }}>{b.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...AG].sort((a, b) => b.d90plus - a.d90plus).map((c) => (
                  <tr key={c.customer}>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{c.customer.split(' ').slice(0, 2).join(' ')}</td>
                    {(['current', 'd1_30', 'd31_60', 'd61_90', 'd90plus'] as const).map((k, bi) => {
                      const v = c[k];
                      return (
                        <td key={k} style={{ ...td, textAlign: 'center', padding: 4 }}>
                          <div style={{ ...heatColor(v, heatBuckets[bi].color), borderRadius: 5, padding: '6px 2px', color: v / heatMax > 0.5 ? '#fff' : t.tx, fontSize: 10.5, fontWeight: 600 }}>
                            {v ? fmtC(conv(v)) : '·'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? 'Expected Collections Projection' : 'Beklenen Tahsilat Projeksiyonu'}
          why={en ? 'Intuit AR-to-cash-forecast pattern (aging-based).' : 'Intuit AR-to-cash-forecast deseni (yaşlandırmaya dayalı).'}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projection} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <defs><linearGradient id="rcvProj" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.gn} stopOpacity={0.45} /><stop offset="100%" stopColor={t.gn} stopOpacity={0.04} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Area type="monotone" dataKey="expected" name={en ? 'Expected' : 'Beklenen'} stroke={t.gn} fill="url(#rcvProj)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Yaşlandırma Detayı */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Aging Detail (by Customer)' : 'Yaşlandırma Detayı (Müşteri Bazında)'}
          <InfoTip t={t} lang={lang} termKey="overdueRatio" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Customer' : 'Müşteri'}</th>
                <th style={th}>{en ? 'Total' : 'Toplam'}</th>
                <th style={th}>{en ? 'Current' : 'Cari'}</th>
                <th style={th}>1-30</th><th style={th}>31-60</th><th style={th}>61-90</th><th style={th}>90+</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Oldest' : 'En Eski'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Risk' : 'Risk'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Actions' : 'Aksiyon'}</th>
              </tr>
            </thead>
            <tbody>
              {[...AG].sort((a, b) => b.d90plus - a.d90plus).map((c) => (
                <tr key={c.customer}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{c.customer}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(c.total))}</td>
                  <td style={{ ...td, color: t.tx2 }}>{fmtC(conv(c.current))}</td>
                  <td style={td}>{c.d1_30 ? fmtC(conv(c.d1_30)) : '—'}</td>
                  <td style={td}>{c.d31_60 ? fmtC(conv(c.d31_60)) : '—'}</td>
                  <td style={td}>{c.d61_90 ? fmtC(conv(c.d61_90)) : '—'}</td>
                  <td style={{ ...td, color: c.d90plus ? t.rd : t.tx3, fontWeight: c.d90plus ? 600 : 400 }}>{c.d90plus ? fmtC(conv(c.d90plus)) : '—'}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{c.oldestInvoice}</td>
                  <td style={{ ...td, textAlign: 'center', color: c.riskScore >= 70 ? t.rd : c.riskScore >= 45 ? t.am : t.gn, fontWeight: 600 }}>{c.riskScore}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={statusTone(c.status)} label={statusLabel(c.status)} /></td>
                  <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {actBtn('download', en ? 'Statement' : 'Ekstre')}
                      {actBtn('bell', en ? 'Reminder' : 'Hatırlatma')}
                      {actBtn('calendar', en ? 'Promise to pay' : 'Söz-verilen ödeme')}
                      {actBtn('alertTriangle', en ? 'Legal action' : 'Yasal takip')}
                      {actBtn('user', en ? 'Customer card' : 'Cari kart', () => onSelectRep?.('satis__4'))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Tahsilat Aksiyon Listesi */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Collection Worklist (amount × days priority)' : 'Tahsilat Aksiyon Listesi (tutar × gün önceliği)'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Customer' : 'Müşteri'}</th>
                <th style={th}>{en ? 'Overdue' : 'Vadesi Geçen'}</th>
                <th style={th}>{en ? 'Days' : 'Gün'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Last Contact' : 'Son Temas'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Promised' : 'Söz Verilen'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Assignee' : 'Atanan'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
              </tr>
            </thead>
            <tbody>
              {[...collectionWorklist].sort((a, b) => b.overdueAmount * b.days - a.overdueAmount * a.days).map((w) => (
                <tr key={w.customer}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{w.customer}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(w.overdueAmount))}</td>
                  <td style={{ ...td, color: w.days >= 90 ? t.rd : w.days >= 30 ? t.am : t.tx }}>{w.days}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{w.lastContact}</td>
                  <td style={{ ...td, textAlign: 'center', color: w.promisedPayment ? t.gn : t.tx3, fontSize: 11 }}>{w.promisedPayment ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{w.assignee}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} dot={false} tone="blue" label={w.status[en ? 'en' : 'tr']} /></td>
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
