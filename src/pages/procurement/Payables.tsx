import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceArea, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { Icon } from '../../components/ui/Icon';
import { ColumnManager, type ColDef } from '../../components/ui/ColumnManager';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtCompactTRY, fmtMonth } from '../../utils/format';
import {
  payableInvoices, suppliers, payablesDpoTrend, currentDpo, reconciliationRows,
} from '../../constants/procurementData';
import type { PayableInvoice, PaymentMethod, Currency } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

const METHODS: PaymentMethod[] = ['Havale', 'Çek', 'Senet', 'Açık Hesap'];
const METHOD_COLORS: Record<PaymentMethod, string> = {
  Havale: '#4F46E5', 'Açık Hesap': '#0D9488', Çek: '#F59E0B', Senet: '#EC4899',
};

export const Payables = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const py = (k: string) => i18n.t(`procurement.pay.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const dl = i18n.t('common.daysLower');

  const [schedSort, setSchedSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'daysRemaining', dir: 'asc' });

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? id;
  const mLabel = (m: PaymentMethod) => py(`method.${m}`);

  // ── Toplamlar ────────────────────────────────────────────────────────────────
  const total = payableInvoices.reduce((s, i) => s + i.amount, 0);
  const overdueInv = payableInvoices.filter((i) => i.daysRemaining < 0);
  const overdueAmt = overdueInv.reduce((s, i) => s + i.amount, 0);
  const upcomingAmt = payableInvoices.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 30).reduce((s, i) => s + i.amount, 0);
  const currentAmt = payableInvoices.filter((i) => i.daysRemaining > 30).reduce((s, i) => s + i.amount, 0);

  const overduePct = total ? (overdueAmt / total) * 100 : 0;
  const upcoming7 = payableInvoices.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 7).reduce((s, i) => s + i.amount, 0);
  const cashOutflow30 = upcomingAmt;
  const chequeNote = payableInvoices.filter((i) => i.paymentMethod === 'Çek' || i.paymentMethod === 'Senet').reduce((s, i) => s + i.amount, 0);
  const overdueSuppliers = new Set(overdueInv.map((i) => i.supplierId)).size;
  const avgTerm = suppliers.reduce((s, x) => s + x.avgPaymentDays, 0) / suppliers.length;
  const apTurnover = currentDpo ? 365 / currentDpo : 0;
  const reconciledCount = reconciliationRows.filter((r) => r.reconciled).length;
  const reconciliationPct = reconciliationRows.length ? (reconciledCount / reconciliationRows.length) * 100 : 0;
  const earlyPayEligible = payableInvoices.filter((i) => (i.paymentMethod === 'Havale' || i.paymentMethod === 'Açık Hesap') && i.daysRemaining >= 0 && i.daysRemaining <= 30);
  const earlyPayDiscount = Math.round(earlyPayEligible.reduce((s, i) => s + i.amount * 0.02, 0));

  // ── A6: PBI üçlü (Güncel / Vadesi Gelecek / Vadesi Geçmiş) ─────────────────────
  const triple = [
    { key: 'current', label: tp('kpi.currentPayables'), value: currentAmt, color: t.tx2, accent: t.c1 },
    { key: 'upcoming', label: tp('kpi.upcomingDue'), value: upcomingAmt, color: t.am, accent: t.am },
    { key: 'overdue', label: tp('kpi.overdue'), value: overdueAmt, color: t.rd, accent: t.rd },
  ];

  // ── 12 KPI ────────────────────────────────────────────────────────────────────
  const kpis: { id: string; title: string; value: string; trend: string; stt: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'pay-dpo', title: py('kpi.dpo'), value: `${fmtNumber(currentDpo)} ${dl}`, trend: '+2', stt: 'up', color: currentDpo <= 60 ? 'gn' : 'am', unit: dl },
    { id: 'pay-total', title: py('kpi.totalPayables'), value: fmtCompactTRY(total), trend: '+4,2%', stt: 'up', color: 'pu', unit: 'K ₺' },
    { id: 'pay-overdue', title: py('kpi.overduePayables'), value: fmtCompactTRY(overdueAmt), trend: '+1,1%', stt: 'up', color: 'rd', unit: 'K ₺' },
    { id: 'pay-overduepct', title: py('kpi.overduePct'), value: fmtPercent(overduePct, 1), trend: '+0,6pp', stt: 'up', color: overduePct < 5 ? 'gn' : overduePct < 9 ? 'am' : 'rd', unit: '%' },
    { id: 'pay-term', title: py('kpi.avgTerm'), value: `${fmtNumber(avgTerm, 0)} ${dl}`, trend: '+1', stt: 'up', color: 'tl', unit: dl },
    { id: 'pay-up7', title: py('kpi.upcoming7'), value: fmtCompactTRY(upcoming7), trend: '+3', stt: 'up', color: 'am', unit: 'K ₺' },
    { id: 'pay-apturn', title: py('kpi.apTurnover'), value: `${fmtNumber(apTurnover, 1)}x`, trend: '-0,2', stt: 'down', color: 'c2', unit: '' },
    { id: 'pay-early', title: py('kpi.earlyPayDiscount'), value: fmtCompactTRY(earlyPayDiscount), trend: '+8%', stt: 'up', color: 'gn', unit: 'K ₺' },
    { id: 'pay-odsup', title: py('kpi.overdueSuppliers'), value: fmtNumber(overdueSuppliers), trend: '+1', stt: 'up', color: overdueSuppliers > 3 ? 'rd' : 'am', unit: '' },
    { id: 'pay-cheque', title: py('kpi.chequeNote'), value: fmtCompactTRY(chequeNote), trend: '+2,4%', stt: 'up', color: 'co', unit: 'K ₺' },
    { id: 'pay-recon', title: py('kpi.reconciliation'), value: fmtPercent(reconciliationPct, 0), trend: '+5pp', stt: 'up', color: reconciliationPct >= 90 ? 'gn' : 'am', unit: '%' },
    { id: 'pay-cash30', title: py('kpi.cashOutflow30'), value: fmtCompactTRY(cashOutflow30), trend: '+6%', stt: 'up', color: 'pr', unit: 'K ₺' },
  ];

  // ── Görsel 1: Borç yaşlandırma ─────────────────────────────────────────────────
  const agingData = [
    { key: 'notDue', label: py('aging.notDue'), amt: payableInvoices.filter((i) => i.daysRemaining > 0).reduce((s, i) => s + i.amount, 0), color: t.tl },
    { key: 'b1', label: py('aging.b1'), amt: payableInvoices.filter((i) => i.daysRemaining <= 0 && i.daysRemaining >= -30).reduce((s, i) => s + i.amount, 0), color: t.am },
    { key: 'b2', label: py('aging.b2'), amt: payableInvoices.filter((i) => i.daysRemaining < -30 && i.daysRemaining >= -60).reduce((s, i) => s + i.amount, 0), color: t.co },
    { key: 'b3', label: py('aging.b3'), amt: payableInvoices.filter((i) => i.daysRemaining < -60).reduce((s, i) => s + i.amount, 0), color: t.rd },
  ];

  // ── Görsel 3: Ödeme takvimi (yaklaşan vadeler) ─────────────────────────────────
  const HORIZON = 60;
  const timelineRows = [...payableInvoices]
    .filter((i) => i.daysRemaining <= HORIZON)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 12);

  // ── Görsel 4: Nakit çıkış projeksiyonu (30/60/90), TRY vs Döviz kümülatif ──────
  const projPoint = (label: string, filt: (dr: number) => boolean) => {
    const inW = payableInvoices.filter((i) => filt(i.daysRemaining));
    return {
      label,
      TRY: inW.filter((i) => i.currency === 'TRY').reduce((s, i) => s + i.amount, 0),
      FX: inW.filter((i) => i.currency !== 'TRY').reduce((s, i) => s + i.amount, 0),
    };
  };
  const cashProjection = [
    projPoint(py('now'), (dr) => dr < 0),
    projPoint('30g', (dr) => dr <= 30),
    projPoint('60g', (dr) => dr <= 60),
    projPoint('90g', (dr) => dr <= 90),
  ];

  // ── Görsel 5: Ödeme aracı donut ────────────────────────────────────────────────
  const methodData = METHODS.map((m) => ({
    key: m, name: mLabel(m), value: payableInvoices.filter((i) => i.paymentMethod === m).reduce((s, i) => s + i.amount, 0),
  })).filter((x) => x.value > 0);

  // ── Görsel 6: Tedarikçi bazında gecikmiş borç (Top 10) ─────────────────────────
  const overdueBySupplier = (() => {
    const m: Record<string, number> = {};
    overdueInv.forEach((i) => { m[i.supplierId] = (m[i.supplierId] || 0) + i.amount; });
    return Object.entries(m)
      .map(([id, amt]) => ({ name: supplierName(id).split(' ')[0], amt }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 10);
  })();

  // ── Ortak yardımcılar ───────────────────────────────────────────────────────────
  const sortRows = <T,>(rows: T[], s: { key: string; dir: 'asc' | 'desc' }) =>
    [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[s.key];
      const bv = (b as Record<string, unknown>)[s.key];
      if (typeof av === 'number' && typeof bv === 'number') return s.dir === 'asc' ? av - bv : bv - av;
      return s.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  const handleSort = (setter: typeof setSchedSort, key: string) =>
    setter((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));
  const SortIcon = ({ colKey, s }: { colKey: string; s: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon name={s.key === colKey ? (s.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={s.key === colKey ? t.pr : t.tx3} />
  );
  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );
  const curChip = (c: Currency) => (
    <span style={{ fontSize: 10, fontWeight: 600, color: c === 'TRY' ? t.tx3 : t.pu, background: `${c === 'TRY' ? t.tx3 : t.pu}1A`, borderRadius: 5, padding: '2px 7px' }}>{c}</span>
  );
  const dueBadge = (dr: number) => {
    const c = dr < 0 ? t.rd : dr <= 7 ? t.am : t.tl;
    const label = dr < 0 ? tp('exec.critical') : dr <= 7 ? tp('exec.warning') : tp('exec.watch');
    return <span style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}1F`, borderRadius: 5, padding: '2px 8px' }}>{label}</span>;
  };
  const tableWrap = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 } as const;

  // ── Tablo 1: Ödeme takvimi / vade ──────────────────────────────────────────────
  const schedRows = payableInvoices.map((i) => ({ ...i, supplier: supplierName(i.supplierId) }));
  const sortedSched = sortRows(schedRows, schedSort);
  const SCHED_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'supplier', label: py('cols.supplier'), align: 'left' },
    { key: 'id', label: py('cols.invoice'), align: 'left' },
    { key: 'dueDate', label: py('cols.dueDate'), align: 'left' },
    { key: 'amount', label: py('cols.amount'), align: 'right' },
    { key: 'currency', label: py('cols.currency'), align: 'center' },
    { key: 'daysRemaining', label: py('cols.daysLeft'), align: 'right' },
    { key: 'paymentMethod', label: py('cols.method'), align: 'left' },
    { key: 'badge', label: py('cols.status'), align: 'center' },
  ];
  const schedColDefs: ColDef[] = SCHED_COLS.filter((c) => c.key !== 'badge').map((c) => ({ key: c.key, label: c.label }));
  const [schedVisible, setSchedVisible] = useState<string[]>(SCHED_COLS.map((c) => c.key));

  const renderSchedCell = (key: string, i: PayableInvoice & { supplier: string }) => {
    switch (key) {
      case 'supplier': return <span style={{ fontWeight: 600, color: t.tx }}>{i.supplier}</span>;
      case 'id': return <span style={{ color: t.tx3 }}>{i.id}</span>;
      case 'dueDate': return <span style={{ color: t.tx2 }}>{i.dueDate}</span>;
      case 'amount': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(i.amount)}</span>;
      case 'currency': return curChip(i.currency);
      case 'daysRemaining': return <span style={{ fontWeight: 700, color: i.daysRemaining < 0 ? t.rd : i.daysRemaining <= 7 ? t.am : t.tx }}>{i.daysRemaining < 0 ? `${fmtNumber(i.daysRemaining)}` : `+${fmtNumber(i.daysRemaining)}`} {dl}</span>;
      case 'paymentMethod': return <span style={{ color: t.tx2 }}>{mLabel(i.paymentMethod)}</span>;
      case 'badge': return dueBadge(i.daysRemaining);
      default: return null;
    }
  };

  // ── Tablo 2: BA-BS mutabakat ───────────────────────────────────────────────────
  const sortedRecon = [...reconciliationRows].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const mismatchRows = reconciliationRows.filter((r) => !r.reconciled);
  const mismatchTotal = mismatchRows.reduce((s, r) => s + Math.abs(r.diff), 0);

  // ── AI uyarıları (4) ────────────────────────────────────────────────────────────
  const topEarly = [...earlyPayEligible].sort((a, b) => b.amount - a.amount)[0];
  const topEarlySupplier = topEarly ? supplierName(topEarly.supplierId) : suppliers[0].name;
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '🔴', border: t.rd,
      text: lang === 'tr'
        ? `~${fmtCompactTRY(overdueAmt)} borç vadesi geçmiş (toplamın %${fmtNumber(overduePct, 0)}'i); ${fmtNumber(overdueSuppliers)} tedarikçi ödeme bekliyor — tedarik kesintisi riski.`
        : `~${fmtCompactTRY(overdueAmt)} of payables is overdue (${fmtNumber(overduePct, 0)}% of total); ${fmtNumber(overdueSuppliers)} suppliers awaiting payment — supply disruption risk.`,
    },
    {
      icon: '💡', border: t.gn,
      text: lang === 'tr'
        ? `${topEarlySupplier} net-10 %2 erken ödeme iskontosu sunuyor; toplam ~${fmtCompactTRY(earlyPayDiscount)} yakalanabilir (sermaye maliyetinin üstünde).`
        : `${topEarlySupplier} offers a net-10 2% early-payment discount; ~${fmtCompactTRY(earlyPayDiscount)} is capturable in total (above cost of capital).`,
    },
    {
      icon: '⚠️', border: t.am,
      text: lang === 'tr'
        ? `${fmtNumber(mismatchRows.length)} tedarikçide BA-BS bakiye farkı var (toplam ~${fmtCompactTRY(mismatchTotal)}); ay sonu mutabakatı öncesi çözülmeli.`
        : `${fmtNumber(mismatchRows.length)} suppliers show a BA-BS balance mismatch (~${fmtCompactTRY(mismatchTotal)} total); resolve before month-end reconciliation.`,
    },
    {
      icon: '📅', border: upcoming7 > 0 ? t.am : t.tl,
      text: lang === 'tr'
        ? `Önümüzdeki 7 günde ~${fmtCompactTRY(upcoming7)} ödeme yükümlülüğü var; nakit pozisyonu kontrol edilmeli (30 günlük çıkış ~${fmtCompactTRY(cashOutflow30)}).`
        : `~${fmtCompactTRY(upcoming7)} in payment obligations fall due within 7 days; check the cash position (30-day outflow ~${fmtCompactTRY(cashOutflow30)}).`,
    },
  ];

  return (
    <>
      {/* ── A6: PBI üçlü borç durumu ────────────────────────────────────────────── */}
      <SectionHeader title={py('overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {triple.map((x) => (
          <div key={x.key} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderTop: `3px solid ${x.accent}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: t.tx2, marginBottom: 6 }}>{x.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: x.color, letterSpacing: -0.5 }}>{fmtCompactTRY(x.value)}</div>
            <div style={{ fontSize: 11, color: t.tx3, marginTop: 4 }}>{fmtPercent(total ? (x.value / total) * 100 : 0, 1)} · {py('secondaryFx')}</div>
          </div>
        ))}
      </div>

      {/* ── KPI BANDI (12) ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.stt} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1 & 2: Yaşlandırma / DPO trend ──────────────────────────────── */}
      <SectionHeader title={py('sectionAging')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={py('charts.aging')} id="pay-aging" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingData} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} width={70} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), tp('kpi.payables')]} />
              <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                {agingData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={py('charts.dpoTrend')} id="pay-dpo-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={payablesDpoTrend} margin={{ top: 15, right: 24, bottom: 6, left: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[20, 70]} tickFormatter={(v) => `${v}${dl}`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtNumber(v)} ${dl}`, 'DPO']} labelFormatter={fmtMonth} />
              <ReferenceArea y1={30} y2={60} fill={t.gn} fillOpacity={0.08} label={{ value: py('targetBand'), fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="dpo" name="DPO" stroke={t.pr} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 3: Ödeme takvimi timeline ───────────────────────────────────── */}
      <SectionHeader title={py('sectionCash')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={py('charts.paymentTimeline')} id="pay-timeline" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 6 }}>
            {timelineRows.map((i) => {
              const pos = Math.max(0, Math.min(HORIZON, i.daysRemaining)) / HORIZON * 100;
              const c = i.daysRemaining < 0 ? t.rd : i.daysRemaining <= 7 ? t.am : t.tl;
              return (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10.5, color: t.tx2, width: 96, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{supplierName(i.supplierId).split(' ')[0]}</span>
                  <div style={{ flex: 1, height: 16, background: t.bg2, borderRadius: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pos}%`, background: `${c}44`, borderRadius: 4 }} />
                    <div style={{ position: 'absolute', left: `${pos}%`, top: -1, bottom: -1, width: 3, background: c, borderRadius: 2, transform: 'translateX(-1px)' }} />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: c, width: 44, textAlign: 'right', flexShrink: 0 }}>{i.daysRemaining < 0 ? i.daysRemaining : `+${i.daysRemaining}`}{dl}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: t.tx, width: 64, textAlign: 'right', flexShrink: 0 }}>{fmtCompactTRY(i.amount)}</span>
                </div>
              );
            })}
          </div>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={py('charts.cashProjection')} id="pay-cash" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashProjection} margin={{ top: 15, right: 20, bottom: 6, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} width={70} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="TRY" name="TRY" stackId="1" stroke={t.pr} fill={t.pr} fillOpacity={0.55} />
              <Area type="monotone" dataKey="FX" name={py('fxGroup')} stackId="1" stroke={t.pu} fill={t.pu} fillOpacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 5 & 6: Ödeme aracı donut / Tedarikçi gecikmiş borç ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 12, marginBottom: 16 }}>
        <ChartContainer t={t} l={l} title={py('charts.methodDonut')} id="pay-method" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={100} paddingAngle={2}>
                {methodData.map((d) => <Cell key={d.key} fill={METHOD_COLORS[d.key]} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={py('charts.overdueBySupplier')} id="pay-overdue-sup" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overdueBySupplier} layout="vertical" margin={{ top: 5, right: 50, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), tp('kpi.overdue')]} />
              <Bar dataKey="amt" radius={[0, 4, 4, 0]} fill={t.rd} opacity={0.82} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── TABLO 1: Ödeme takvimi / vade ──────────────────────────────────────── */}
      <SectionHeader title={py('sectionTables')} t={t} />
      <div style={tableWrap}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{py('charts.scheduleTable')} · {fmtNumber(payableInvoices.length)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={schedColDefs} visibleKeys={schedVisible} onChange={setSchedVisible} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {SCHED_COLS.filter((c) => schedVisible.includes(c.key)).map((c) => {
                  const sortable = c.key !== 'badge';
                  return (
                    <th key={c.key} onClick={() => sortable && handleSort(setSchedSort, c.key)}
                      style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: schedSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: sortable ? 'pointer' : 'default', userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                        {c.label}{sortable && <SortIcon colKey={c.key} s={schedSort} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedSched.map((i) => (
                <tr key={i.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {SCHED_COLS.filter((c) => schedVisible.includes(c.key)).map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderSchedCell(c.key, i)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: BA-BS mutabakat ───────────────────────────────────────────── */}
      <div style={tableWrap}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{py('charts.reconTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { k: 'supplier', a: 'left' as const }, { k: 'ourBalance', a: 'right' as const },
                  { k: 'theirBalance', a: 'right' as const }, { k: 'diff', a: 'right' as const },
                  { k: 'reconStatus', a: 'center' as const }, { k: 'lastRecon', a: 'left' as const },
                ].map((c) => (
                  <th key={c.k} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: c.a, whiteSpace: 'nowrap' }}>{py(`cols.${c.k}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecon.map((r) => (
                <tr key={r.supplier} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: t.tx }}>{r.supplier}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtCompactTRY(r.ourBalance)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtCompactTRY(r.theirBalance)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: r.diff === 0 ? t.tx3 : t.rd }}>{r.diff === 0 ? '—' : fmtCompactTRY(r.diff)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: r.reconciled ? t.gn : t.rd, background: r.reconciled ? '#DCFCE7' : '#FEE2E2', borderRadius: 5, padding: '2px 8px' }}>
                      {r.reconciled ? py('reconciled') : py('mismatch')}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{r.lastDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI ÖNERİLERİ (4) ───────────────────────────────────────────────────── */}
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

export default Payables;
