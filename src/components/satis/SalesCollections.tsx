import { useState, type CSSProperties } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
} from 'recharts';
import type { FinCurrency, PeriodType, OrderMode } from '../../types/finance';
import { arAgingByCustomer } from '../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, StatusBadge, Dropdown, TahsilatTrendChart, type FinAlert,
} from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../../pages/finance/_Placeholder';

const TODAY = '2026-07-24'; // demo "bugün"
const dayNum = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000;
const dcDays = (kapanis: string, tahsilat: string | null) => Math.round((tahsilat ? dayNum(tahsilat) : dayNum(TODAY)) - dayNum(kapanis));

const AG = arAgingByCustomer;
const SLOW_REP_THRESHOLD = 90; // ort. tahsilat günü eşiği (riskli temsilci)
const RATE_THRESHOLD = 0.5;    // tahsilat oranı eşiği (kırmızı)

export const SalesCollections = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  void donem;

  // ── demo FX (Muhasebe ile aynı mantık: son dönem kuru ~ 42.9) ──
  const FX = 42.9;
  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number) => (currency === 'USD' ? vTRY / FX : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const pct = (v: number) => `${en ? '' : '%'}${(v * 100).toFixed(0)}${en ? '%' : ''}`;

  // ── deal bazında türevler (tek kaynak: receivables) ──
  const deals = AG.map((c) => {
    const collected = c.dealTutari - c.total;         // tahsil edilen = deal − açık AR
    const overdue = c.total - c.current;              // vadesi geçmiş
    const days = dcDays(c.dealKapanisTarihi, c.tahsilatTarihi);
    const durum = c.tahsilatTarihi ? 'collected' : overdue > 0 && (c.d61_90 > 0 || c.d90plus > 0 || c.status !== 'current') ? 'late' : 'open';
    const clawback = c.komisyonOdendiMi && !c.tahsilatTarihi ? c.komisyonTutari : 0;
    return { ...c, collected, overdue, days, durum, clawback };
  });

  // ── temsilci agregasyonu ──
  const reps = [...new Set(AG.map((c) => c.temsilci))];
  const repAgg = reps.map((r) => {
    const cs = deals.filter((d) => d.temsilci === r);
    const deal = cs.reduce((s, c) => s + c.dealTutari, 0);
    const collected = cs.reduce((s, c) => s + c.collected, 0);
    const overdue = cs.reduce((s, c) => s + c.overdue, 0);
    const clawback = cs.reduce((s, c) => s + c.clawback, 0);
    const risk90 = cs.reduce((s, c) => s + c.d90plus, 0);
    const avgDays = Math.round(cs.reduce((s, c) => s + c.days, 0) / cs.length);
    const rate = deal ? collected / deal : 0;
    return { rep: r, deal, collected, overdue, clawback, risk90, avgDays, rate };
  }).sort((a, b) => a.rate - b.rate); // en kötü üstte

  // ── toplamlar ──
  const totalDeal = deals.reduce((s, c) => s + c.dealTutari, 0);
  const totalCollected = deals.reduce((s, c) => s + c.collected, 0);
  const totalOverdue = deals.reduce((s, c) => s + c.overdue, 0);
  const total90 = deals.reduce((s, c) => s + c.d90plus, 0);
  const pesinDeal = deals.filter((c) => c.satisTuru === 'Peşin').reduce((s, c) => s + c.dealTutari, 0);
  const vadeliDeal = totalDeal - pesinDeal;
  const komisyonRisk = deals.reduce((s, c) => s + c.clawback, 0);
  const avgRepRate = repAgg.reduce((s, r) => s + r.rate, 0) / repAgg.length;
  const avgDealToCash = Math.round(deals.reduce((s, c) => s + c.days, 0) / deals.length);
  const bestRep = [...repAgg].sort((a, b) => a.avgDays - b.avgDays)[0];
  const worstRep = [...repAgg].sort((a, b) => b.avgDays - a.avgDays)[0];
  const riskyReps = repAgg.filter((r) => r.avgDays > SLOW_REP_THRESHOLD).length;

  // segment ort. tahsilat günü
  const segAvgDays = (tip: 'B2B' | 'B2C') => { const cs = deals.filter((c) => c.musteriTipi === tip); return Math.round(cs.reduce((s, c) => s + c.days, 0) / cs.length); };
  const b2bDays = segAvgDays('B2B'), b2cDays = segAvgDays('B2C');

  // ── KPI'lar (8) ──
  const kpis = [
    { title: L('Temsilci Tahsilat Oranı', 'Rep Collection Rate'), value: pct(avgRepRate), goodDir: 'up' as const, color: t.gn, hint: L('temsilci ort.', 'rep avg') },
    { title: L('Deal-to-Cash Süresi', 'Deal-to-Cash Time'), value: `${avgDealToCash} ${en ? 'd' : 'gün'}`, goodDir: 'down' as const, color: t.pr, hint: L('açık dahil, bugüne kadar', 'incl. open, to date') },
    { title: L('Vadeli Satış Oranı', 'Credit-Sale Ratio'), value: pct(vadeliDeal / totalDeal), goodDir: 'down' as const, color: t.am, hint: L('hacim trade-off', 'volume trade-off') },
    { title: L('Peşin Satış Oranı', 'Cash-Sale Ratio'), value: pct(pesinDeal / totalDeal), goodDir: 'up' as const, color: t.tl },
    { title: L('Komisyon Risk Tutarı', 'Commission at Risk'), value: fmtC(conv(komisyonRisk)), goodDir: 'down' as const, color: t.rd, hint: L('tahsilat öncesi ödenmiş', 'paid pre-collection') },
    { title: L('Tahsil Edilemeyen Satış', 'Uncollectible Sales'), value: pct(total90 / totalDeal), goodDir: 'down' as const, color: t.co, hint: L('90+ / şüpheli', '90+ / doubtful') },
    { title: L('Ort. Tahsilat (en iyi/kötü)', 'Avg Collect (best/worst)'), value: `${bestRep.avgDays} / ${worstRep.avgDays} ${en ? 'd' : 'g'}`, goodDir: 'down' as const, color: t.pu, hint: `${bestRep.rep} · ${worstRep.rep}` },
    { title: L('Riskli Temsilci Sayısı', 'At-Risk Reps'), value: `${riskyReps}`, goodDir: 'down' as const, color: t.rd, hint: L(`ort. > ${SLOW_REP_THRESHOLD} gün`, `avg > ${SLOW_REP_THRESHOLD}d`) },
  ];

  // ── aylık deterministik trendler (12 ay) ──
  const MONTHS = en ? ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    : ['Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'];
  // Chart 2: deal-to-cash cycle-time trend (42 → 58, hedef bant)
  const cycleTrend = MONTHS.map((m, i) => ({ month: m, gun: Math.round(42 + (58 - 42) * (i / 11) + (i % 2 ? 1.4 : -1.4)), hedef: 45 }));
  // Chart 3: Peşin vs Vadeli mix (aylık); peşin payı ~0.28 → şimdiki orana ramp
  const pesinNow = pesinDeal / totalDeal;
  const mixBase = totalDeal / 12; // aylık satış run-rate
  const mixTrend = MONTHS.map((m, i) => {
    const total = mixBase * (0.9 + 0.018 * i);
    const ps = 0.28 + (pesinNow - 0.28) * (i / 11);
    return { month: m, pesin: conv(total * ps), vadeli: conv(total * (1 - ps)) };
  });
  // Chart 5: segment tahsilat kalitesi → yerini reusable TahsilatTrendChart aldı (B2B tek seri)

  // Chart 1: rep ranking; Chart 4: komisyon riski by rep; Chart 6: scatter
  const rankData = [...repAgg].sort((a, b) => b.rate - a.rate).map((r) => ({ rep: r.rep, oran: +(r.rate * 100).toFixed(0), below: r.rate < RATE_THRESHOLD }));
  const clawData = [...repAgg].filter((r) => r.clawback > 0).sort((a, b) => b.clawback - a.clawback).map((r) => ({ rep: r.rep, risk: conv(r.clawback) }));
  const scatterData = repAgg.map((r) => ({ rep: r.rep, hacim: conv(r.deal), gun: r.avgDays, overdue: conv(r.overdue) }));

  // ── AI uyarıları (veriden hesaplanır) ──
  const worstByUncoll = [...repAgg].map((r) => ({ ...r, uncollPct: r.deal ? r.risk90 / r.deal : 0 })).sort((a, b) => b.uncollPct - a.uncollPct)[0];
  const cycleFirst = cycleTrend[0].gun, cycleLast = cycleTrend[cycleTrend.length - 1].gun;
  const alerts: FinAlert[] = [];
  if (worstByUncoll.uncollPct > 0.2) alerts.push({ severity: 'critical', text: L(
    `Temsilci ${worstByUncoll.rep} satışlarının %${(worstByUncoll.uncollPct * 100).toFixed(0)}'i 90+ gün tahsil edilmemiş; ${fmtC(conv(worstByUncoll.clawback))} komisyon tahsilat öncesi ödenmiş (clawback riski).`,
    `Rep ${worstByUncoll.rep} has ${(worstByUncoll.uncollPct * 100).toFixed(0)}% of sales uncollected at 90+ days; ${fmtC(conv(worstByUncoll.clawback))} in commission was paid before collection (clawback risk).`) });
  alerts.push({ severity: 'warning', text: L(
    `Deal-to-cash süresi ${cycleFirst}→${cycleLast} güne çıktı; vadeli satış oranı %${((vadeliDeal / totalDeal) * 100).toFixed(0)} ve artıyor.`,
    `Deal-to-cash time rose ${cycleFirst}→${cycleLast} days; credit-sale ratio is ${((vadeliDeal / totalDeal) * 100).toFixed(0)}% and climbing.`) });
  alerts.push({ severity: 'watch', text: L(
    `B2B tahsilat kalitesi B2C'den düşük; B2B ort. ${b2bDays} gün vs B2C ${b2cDays} gün.`,
    `B2B collection quality lags B2C; B2B avg ${b2bDays} days vs B2C ${b2cDays} days.`) });
  alerts.push({ severity: 'good', text: L(
    `Peşin satış oranı %${(pesinNow * 100).toFixed(0)}; nakit döngüsü ${pesinNow >= 0.4 ? 'iyileşiyor' : 'izlemede'}.`,
    `Cash-sale ratio at ${(pesinNow * 100).toFixed(0)}%; the cash cycle is ${pesinNow >= 0.4 ? 'improving' : 'being monitored'}.`) });

  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={setOrder} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );
  void order;

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', borderBottom: `1px solid ${t.bd}` };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const repTone = (r: { rate: number; avgDays: number }) => (r.rate < RATE_THRESHOLD || r.avgDays > SLOW_REP_THRESHOLD ? 'red' : r.rate < 0.65 ? 'amber' : 'green') as 'red' | 'amber' | 'green';
  const repLabel = (r: { rate: number; avgDays: number }) => repTone(r) === 'red' ? L('Riskli', 'At risk') : repTone(r) === 'amber' ? L('İzle', 'Watch') : L('İyi', 'Good');
  const durumBadge = (d: string) => d === 'collected'
    ? <StatusBadge t={t} tone="green" label={L('Tahsil Edildi', 'Collected')} />
    : d === 'late' ? <StatusBadge t={t} tone="red" label={L('Gecikmiş', 'Late')} />
      : <StatusBadge t={t} tone="amber" label={L('Açık', 'Open')} />;

  // scatter tooltip
  const ScatTip = ({ active, payload }: { active?: boolean; payload?: { payload: (typeof scatterData)[number] }[] }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: t.tx }}>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.rep}</div>
        <div>{L('Satış hacmi', 'Sales volume')}: {fmtC(d.hacim)}</div>
        <div>{L('Ort. tahsilat günü', 'Avg collection days')}: {d.gun}</div>
        <div>{L('Vadesi geçmiş', 'Overdue')}: {fmtC(d.overdue)}</div>
      </div>
    );
  };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.satisTahsilat ?? (en ? 'Collections' : 'Tahsilat')}
      subtitle={L('Satış-temsilci ve deal performansı açısından tahsilat. Finansal/yaşlandırma analizi için → Muhasebe > Alacak Yönetimi.',
        'Collections through the sales-rep and deal-performance lens. For financial/aging analysis → Accounting > Receivables.')}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: L('Finansal/yaşlandırma: Muhasebe > Alacak Yönetimi →', 'Financial/aging: Accounting > Receivables →'), onClick: () => onSelectRep?.('muhasebe__2') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} goodDir={k.goodDir} sparkColor={k.color} hint={k.hint} />
        ))}
      </KPIBand>

      {/* Row: Rep ranking + Deal-to-cash cycle trend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={L('Temsilci Tahsilat Oranı (ranking)', 'Rep Collection Rate (ranking)')}
          why={L('Salesforce/RevOps rep-scorecard ranking deseni; eşik altı kırmızı.', 'Salesforce/RevOps rep-scorecard ranking; below-threshold in red.')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rankData} layout="vertical" margin={{ top: 4, right: 30, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="rep" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v}%`} cursor={{ fill: t.bg2 }} />
              <ReferenceLine x={RATE_THRESHOLD * 100} stroke={t.rd} strokeDasharray="4 3" label={{ value: `${L('eşik', 'threshold')} ${RATE_THRESHOLD * 100}%`, position: 'top', fontSize: 9, fill: t.rd }} />
              <Bar dataKey="oran" name={L('Tahsilat %', 'Collection %')} radius={[0, 4, 4, 0]} barSize={20}>
                {rankData.map((d, i) => <Cell key={i} fill={d.below ? t.rd : t.gn} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={L('Deal-to-Cash Cycle-Time Trendi', 'Deal-to-Cash Cycle-Time Trend')}
          why={L('Order-to-cash (O2C) cycle-time izleme deseni; hedef bant.', 'Order-to-cash (O2C) cycle-time tracking; target band.')}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cycleTrend} margin={{ top: 6, right: 10, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <ReferenceArea y1={0} y2={45} fill={t.gn} fillOpacity={0.06} label={{ value: L('hedef', 'target'), position: 'insideBottomRight', fontSize: 9, fill: t.gn }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v} ${en ? 'days' : 'gün'}`} />
              <Line type="monotone" dataKey="gun" name={L('Ort. gün', 'Avg days')} stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="hedef" name={L('Hedef', 'Target')} stroke={t.gn} strokeWidth={1.4} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Peşin/Vadeli mix + Segment collection quality */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={52} title={L('Peşin vs Vadeli Satış (zaman)', 'Cash vs Credit Sales (over time)')}
          why={L('Cash-vs-credit sales mix deseni.', 'Cash-vs-credit sales mix pattern.')}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mixTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="scPesin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.tl} stopOpacity={0.5} /><stop offset="100%" stopColor={t.tl} stopOpacity={0.05} /></linearGradient>
                <linearGradient id="scVadeli" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.am} stopOpacity={0.5} /><stop offset="100%" stopColor={t.am} stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="pesin" stackId="m" name={L('Peşin', 'Cash')} stroke={t.tl} fill="url(#scPesin)" strokeWidth={2} />
              <Area type="monotone" dataKey="vadeli" stackId="m" name={L('Vadeli', 'Credit')} stroke={t.am} fill="url(#scVadeli)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <TahsilatTrendChart t={t} lang={lang} span={44} title={L('B2B Tahsilat Trendi', 'B2B Collections Trend')} segments={['B2B']} segmentToggle={false} currency={currency} />
      </div>

      {/* Row: Komisyon riski + Rep scatter */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={44} title={L('Komisyon Riski (temsilci)', 'Commission at Risk (by rep)')}
          why={L('Commission clawback / tahsil edilmemiş ciroya bağlı komisyon riski deseni.', 'Commission clawback / commission-on-uncollected-revenue risk pattern.')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={clawData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="rep" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} cursor={{ fill: t.bg2 }} />
              <Bar dataKey="risk" name={L('Komisyon Riski', 'Commission at risk')} fill={t.rd} radius={[3, 3, 0, 0]} barSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={52} title={L('Temsilci × Ort. Tahsilat Günü', 'Rep × Avg Collection Days')}
          why={L('Rep-level receivables-risk scatter: yavaş + yüksek hacim = kritik çeyrek (sağ-üst).', 'Rep-level receivables-risk scatter: slow + high volume = critical quadrant (top-right).')}>
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart margin={{ top: 10, right: 12, bottom: 4, left: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="hacim" name={L('Satış hacmi', 'Sales volume')} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} />
              <YAxis type="number" dataKey="gun" name={L('Ort. gün', 'Avg days')} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <ZAxis type="number" dataKey="overdue" range={[60, 460]} />
              <ReferenceLine y={SLOW_REP_THRESHOLD} stroke={t.rd} strokeDasharray="4 3" label={{ value: L('yavaş eşiği', 'slow threshold'), position: 'insideTopLeft', fontSize: 9, fill: t.rd }} />
              <Tooltip content={<ScatTip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} name={L('Temsilci', 'Rep')}>
                {scatterData.map((d, i) => <Cell key={i} fill={d.gun > SLOW_REP_THRESHOLD ? t.rd : t.pr} fillOpacity={0.75} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Temsilci Tahsilat Karnesi */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {L('Temsilci Tahsilat Karnesi', 'Rep Collection Scorecard')} <span style={{ fontSize: 11, color: t.tx3, fontWeight: 400 }}>· {L('en kötü üstte', 'worst first')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...th, textAlign: 'left' }}>{L('Temsilci', 'Rep')}</th>
              <th style={th}>{L('Toplam Satış', 'Total Sales')}</th>
              <th style={th}>{L('Tahsil Edilen', 'Collected')}</th>
              <th style={th}>{L('Tahsilat %', 'Collection %')}</th>
              <th style={th}>{L('Ort. Gün', 'Avg Days')}</th>
              <th style={th}>{L('Vadesi Geçmiş', 'Overdue')}</th>
              <th style={th}>{L('Komisyon Riski', 'Comm. at Risk')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Durum', 'Status')}</th>
            </tr></thead>
            <tbody>
              {repAgg.map((r) => (
                <tr key={r.rep} className="sc-row" style={{ cursor: 'pointer' }} onClick={() => onSelectRep?.('satis__3')} title={L('Uzman Performans’a git', 'Go to Rep Performance')}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500, color: t.pr }}>{r.rep}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(r.deal))}</td>
                  <td style={{ ...td, color: t.tx2 }}>{fmtC(conv(r.collected))}</td>
                  <td style={{ ...td, fontWeight: 600, color: r.rate < RATE_THRESHOLD ? t.rd : r.rate < 0.65 ? t.am : t.gn }}>{pct(r.rate)}</td>
                  <td style={{ ...td, color: r.avgDays > SLOW_REP_THRESHOLD ? t.rd : t.tx }}>{r.avgDays}</td>
                  <td style={td}>{fmtC(conv(r.overdue))}</td>
                  <td style={{ ...td, color: r.clawback > 0 ? t.rd : t.tx3, fontWeight: r.clawback > 0 ? 600 : 400 }}>{r.clawback > 0 ? fmtC(conv(r.clawback)) : '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={repTone(r)} label={repLabel(r)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Deal-to-Cash Detayı */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {L('Deal-to-Cash Detayı', 'Deal-to-Cash Detail')} <span style={{ fontSize: 11, color: t.tx3, fontWeight: 400 }}>· {L('gün azalan', 'days descending')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...th, textAlign: 'left' }}>{L('Müşteri (Deal)', 'Customer (Deal)')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Temsilci', 'Rep')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Tip', 'Type')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Kapanış', 'Close')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Tahsilat', 'Collected On')}</th>
              <th style={th}>{L('Gün', 'Days')}</th>
              <th style={th}>{L('Deal Tutarı', 'Deal Amount')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Durum', 'Status')}</th>
            </tr></thead>
            <tbody>
              {[...deals].sort((a, b) => b.days - a.days).map((d) => (
                <tr key={d.customer}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{d.customer} <span style={{ color: t.tx3, fontSize: 10 }}>· {d.musteriTipi}</span></td>
                  <td style={{ ...td, textAlign: 'left', color: t.pr, cursor: 'pointer' }} onClick={() => onSelectRep?.('satis__3')}>{d.temsilci}</td>
                  <td style={{ ...td, textAlign: 'center', color: d.satisTuru === 'Peşin' ? t.gn : t.am }}>{L(d.satisTuru, d.satisTuru === 'Peşin' ? 'Cash' : 'Credit')}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{d.dealKapanisTarihi}</td>
                  <td style={{ ...td, textAlign: 'center', color: d.tahsilatTarihi ? t.gn : t.tx3, fontSize: 11 }}>{d.tahsilatTarihi ?? '—'}</td>
                  <td style={{ ...td, fontWeight: 600, color: d.days > SLOW_REP_THRESHOLD ? t.rd : t.tx }}>{d.days}</td>
                  <td style={td}>{fmtC(conv(d.dealTutari))}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{durumBadge(d.durum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('Tahsilat Öneri & Uyarıları', 'Collection Recommendations & Alerts')} />
      </div>

      {/* Çapraz link notu */}
      <div style={{ marginTop: 12, fontSize: 11.5, color: t.tx3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Icon name="externalLink" size={12} color={t.tx3} />
        {L('Aynı alacak verisi — bu sayfa satış lensi. Ham yaşlandırma/düzenleme:', 'Same receivables data — this is the sales lens. Raw aging/editing:')}
        <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectRep?.('muhasebe__2')}>{L('Muhasebe > Alacak Yönetimi →', 'Accounting > Receivables →')}</span>
        <span style={{ color: t.tx3 }}>·</span>
        <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectRep?.('satis__4')}>{L('Müşteri & Segment →', 'Customer & Segment →')}</span>
      </div>
      <style>{`.sc-row:hover td{background:${t.bg2}}`}</style>
    </ReportPageLayout>
  );
};

export default SalesCollections;
