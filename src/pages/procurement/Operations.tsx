import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, LineChart, ReferenceLine, ReferenceDot, PieChart, Pie, Cell, Legend,
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
  purchaseRequests, purchaseOrders, buyers, prWeeklyInflow, PROC_MONTHS,
} from '../../constants/procurementData';
import type { PurchaseRequest, PurchaseOrder, PRStatus, ProcSource } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  onSelectRep?: (key: string) => void;
  acct?: string; // global hesap filtresi: 'total' | 'b2b' | 'b2c'
}

// PR durum pipeline sırası (huni + aşama süre için)
const PR_PIPELINE: PRStatus[] = ['Taslak', 'Beklemede', 'Tedarik Edilebilir', 'İşleniyor', 'Tamamlandı'];
const OPEN_STATUSES: PRStatus[] = ['Taslak', 'Beklemede', 'Tedarik Edilebilir', 'İşleniyor'];
const FUNNEL_COLORS = ['#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4338CA'];

// YYYY-MM-DD → UTC gün sayısı
const toDays = (s: string): number => {
  const [y, m, d] = s.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};
const monthLabel = (s: string): string => PROC_MONTHS[Number(s.split('-')[1]) - 1];

// Deterministik iptal nedeni (PR id'sine göre) — donut için
const REASON_KEYS = ['budget', 'noSupplier', 'duplicate', 'priceHigh', 'postponed'] as const;
const reasonOf = (id: string): string => {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return REASON_KEYS[n % REASON_KEYS.length];
};

const DONUT_COLORS = ['#4F46E5', '#0D9488', '#F59E0B', '#EC4899', '#6366F1'];

export const Operations = ({ t, l, lang, panels, onAddPanel, onPinTo, onSelectRep, acct = 'total' }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const op = (k: string) => i18n.t(`procurement.ops.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const dl = i18n.t('common.daysLower');

  const [prSort, setPrSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'ageDays', dir: 'desc' });
  const [poSort, setPoSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'lateDays', dir: 'desc' });

  // ── Global hesap filtresi → kaynak (source) filtresi ────────────────────────
  const srcFilter: ProcSource | null = acct === 'b2b' ? 'B2B' : acct === 'b2c' ? 'B2C' : null;
  const prs = srcFilter ? purchaseRequests.filter((p) => p.source === srcFilter) : purchaseRequests;
  const pos = srcFilter ? purchaseOrders.filter((p) => p.source === srcFilter) : purchaseOrders;
  const buyerName = (id: string) => buyers.find((b) => b.id === id)?.name ?? id;
  const st = (s: string) => op(`status.${s}`);

  // ── Ay grupları ─────────────────────────────────────────────────────────────
  const months = [...new Set(prs.map((p) => monthLabel(p.createdDate)))]
    .sort((a, b) => PROC_MONTHS.indexOf(a) - PROC_MONTHS.indexOf(b));
  const latestMonth = months[months.length - 1];

  // ── KPI hesapları (12) ──────────────────────────────────────────────────────
  const openPrs = prs.filter((p) => OPEN_STATUSES.includes(p.status));
  const completedPrs = prs.filter((p) => p.status === 'Tamamlandı' && p.completedDate);
  const cancelledPrs = prs.filter((p) => p.status === 'İptal');
  const convertedPrs = prs.filter((p) => p.poIds.length > 0);

  const monthlyRequests = prs.filter((p) => monthLabel(p.createdDate) === latestMonth).length;
  const openCount = openPrs.length;
  const conversionRate = prs.length ? (convertedPrs.length / prs.length) * 100 : 0;
  const cycleDays = (p: PurchaseRequest) => toDays(p.completedDate!) - toDays(p.createdDate);
  const avgCompletion = completedPrs.length ? completedPrs.reduce((s, p) => s + cycleDays(p), 0) / completedPrs.length : 0;

  const prById = (id: string | null) => (id ? prs.find((p) => p.id === id) : undefined);
  const prToPoDurations = pos.map((po) => { const pr = prById(po.prId); return pr ? toDays(po.orderedDate) - toDays(pr.createdDate) : null; }).filter((x): x is number => x !== null && x >= 0);
  const avgPrToPo = prToPoDurations.length ? prToPoDurations.reduce((s, x) => s + x, 0) / prToPoDurations.length : 0;
  const deliveredPos = pos.filter((po) => po.completedDate);
  const poDeliveryDurations = deliveredPos.map((po) => toDays(po.completedDate!) - toDays(po.orderedDate)).filter((x) => x >= 0);
  const avgPoDelivery = poDeliveryDurations.length ? poDeliveryDurations.reduce((s, x) => s + x, 0) / poDeliveryDurations.length : 0;

  const SLA_DAYS = 15; // zamanında tamamlama eşiği (demo)
  const onTimePr = completedPrs.length ? (completedPrs.filter((p) => cycleDays(p) <= SLA_DAYS).length / completedPrs.length) * 100 : 0;
  const cancelRate = prs.length ? (cancelledPrs.length / prs.length) * 100 : 0;
  const poPerPr = prs.length ? pos.length / prs.length : 0;
  const latePos = pos.filter((po) => po.lateDays > 0).length;
  const b2bCount = prs.filter((p) => p.source === 'B2B').length;
  const b2cCount = prs.filter((p) => p.source === 'B2C').length;
  const b2bPct = prs.length ? Math.round((b2bCount / prs.length) * 100) : 0;
  const pendingApproval = prs.filter((p) => p.status === 'Beklemede').length;

  const kpis: { id: string; title: string; value: string; trend: string; stt: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'ops-monthly', title: op('kpi.monthlyRequests'), value: fmtNumber(monthlyRequests), trend: '+2', stt: 'up', color: 'pu', unit: '' },
    { id: 'ops-open', title: op('kpi.openRequests'), value: fmtNumber(openCount), trend: '+3', stt: 'up', color: openCount > 20 ? 'am' : 'tl', unit: '' },
    { id: 'ops-conv', title: op('kpi.conversionRate'), value: fmtPercent(conversionRate, 1), trend: '+2,4pp', stt: 'up', color: conversionRate >= 50 ? 'gn' : 'am', unit: '%' },
    { id: 'ops-cycle', title: op('kpi.avgCompletion'), value: `${fmtNumber(avgCompletion, 1)} ${dl}`, trend: '-0,8', stt: 'down', color: avgCompletion <= 12 ? 'gn' : 'am', unit: dl },
    { id: 'ops-prtopo', title: op('kpi.avgPrToPo'), value: `${fmtNumber(avgPrToPo, 1)} ${dl}`, trend: '-0,3', stt: 'down', color: 'tl', unit: dl },
    { id: 'ops-podeliv', title: op('kpi.avgPoDelivery'), value: `${fmtNumber(avgPoDelivery, 1)} ${dl}`, trend: '+1,1', stt: 'up', color: avgPoDelivery <= 20 ? 'gn' : 'am', unit: dl },
    { id: 'ops-ontime', title: op('kpi.onTimePr'), value: fmtPercent(onTimePr, 1), trend: '+1,5pp', stt: 'up', color: onTimePr >= 80 ? 'gn' : 'am', unit: '%' },
    { id: 'ops-cancel', title: op('kpi.cancelRate'), value: fmtPercent(cancelRate, 1), trend: '-0,6pp', stt: 'down', color: cancelRate < 10 ? 'gn' : 'rd', unit: '%' },
    { id: 'ops-poperpr', title: op('kpi.poPerPr'), value: fmtNumber(poPerPr, 2), trend: '+0,1', stt: 'up', color: 'c1', unit: '' },
    { id: 'ops-late', title: op('kpi.latePos'), value: fmtNumber(latePos), trend: '+1', stt: 'up', color: latePos > 0 ? 'rd' : 'gn', unit: '' },
    { id: 'ops-ratio', title: op('kpi.b2bB2cRatio'), value: `${b2bPct}/${100 - b2bPct}`, trend: '+2', stt: 'up', color: 'c2', unit: '' },
    { id: 'ops-pending', title: op('kpi.pendingApproval'), value: fmtNumber(pendingApproval), trend: '+2', stt: 'up', color: pendingApproval > 8 ? 'rd' : 'am', unit: '' },
  ];

  // ── Görsel 1: Aylık PR hacmi (B2B/B2C stacked) + dönüşüm line ────────────────
  const monthlyData = months.map((m) => {
    const inMonth = prs.filter((p) => monthLabel(p.createdDate) === m);
    const conv = inMonth.length ? (inMonth.filter((p) => p.poIds.length > 0).length / inMonth.length) * 100 : 0;
    return {
      month: m,
      B2B: inMonth.filter((p) => p.source === 'B2B').length,
      B2C: inMonth.filter((p) => p.source === 'B2C').length,
      conv: Math.round(conv),
    };
  });

  // ── Görsel 2: PR durum hunisi ────────────────────────────────────────────────
  const funnelData = PR_PIPELINE.map((s) => ({ status: s, count: prs.filter((p) => p.status === s).length }));
  const funnelMax = Math.max(...funnelData.map((d) => d.count), 1);

  // ── Görsel 3: Aşama süre analizi (durum bazında ort. gün/yaş) ────────────────
  const stageDuration = PR_PIPELINE.map((s) => {
    const inStatus = prs.filter((p) => p.status === s);
    if (!inStatus.length) return { status: s, gun: 0 };
    const days = inStatus.map((p) => (p.status === 'Tamamlandı' && p.completedDate ? cycleDays(p) : p.ageDays));
    return { status: s, gun: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 };
  });
  const avgStage = stageDuration.reduce((s, d) => s + d.gun, 0) / (stageDuration.length || 1);
  const maxStage = Math.max(...stageDuration.map((d) => d.gun));

  // ── Görsel 4: Haftalık gelen talep (52 hafta) ────────────────────────────────
  const weekly = prWeeklyInflow.map((w) => ({
    ...w,
    val: srcFilter === 'B2B' ? w.b2b : srcFilter === 'B2C' ? w.b2c : w.total,
  }));
  const peakWeek = weekly.reduce((m, x) => (x.val > m.val ? x : m), weekly[0]);

  // ── Görsel 5: Açık PR yaş histogram ──────────────────────────────────────────
  const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
    { label: '0-3', min: 0, max: 3 }, { label: '4-7', min: 4, max: 7 },
    { label: '8-14', min: 8, max: 14 }, { label: '15-30', min: 15, max: 30 },
    { label: '30+', min: 31, max: Infinity },
  ];
  const ageHist = AGE_BUCKETS.map((b) => ({
    label: b.label,
    count: openPrs.filter((p) => p.ageDays >= b.min && p.ageDays <= b.max).length,
    danger: b.min >= 8,
  }));

  // ── Görsel 6: İptal nedeni donut ─────────────────────────────────────────────
  const cancelByReason = REASON_KEYS.map((r) => ({
    key: r, name: op(`reasons.${r}`),
    value: cancelledPrs.filter((p) => reasonOf(p.id) === r).length,
  })).filter((x) => x.value > 0);

  // ── Sıralama yardımcıları ─────────────────────────────────────────────────────
  const sortRows = <T,>(rows: T[], s: { key: string; dir: 'asc' | 'desc' }) =>
    [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[s.key];
      const bv = (b as Record<string, unknown>)[s.key];
      if (typeof av === 'number' && typeof bv === 'number') return s.dir === 'asc' ? av - bv : bv - av;
      return s.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  const handleSort = (setter: typeof setPrSort, key: string) =>
    setter((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));
  const SortIcon = ({ colKey, s }: { colKey: string; s: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon name={s.key === colKey ? (s.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={s.key === colKey ? t.pr : t.tx3} />
  );
  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );
  const srcBadge = (s: ProcSource) => (
    <span style={{ fontSize: 10, fontWeight: 600, color: s === 'B2B' ? t.pr : t.tl, background: `${s === 'B2B' ? t.pr : t.tl}1F`, borderRadius: 5, padding: '2px 8px' }}>{s}</span>
  );
  const ageBadge = (age: number) => {
    const c = age > 7 ? t.rd : age > 3 ? t.am : t.tl;
    const label = age > 7 ? tp('exec.critical') : age > 3 ? tp('exec.warning') : tp('exec.watch');
    return <span style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}1F`, borderRadius: 5, padding: '2px 8px' }}>{label}</span>;
  };

  // ── Tablo 1: Açık PR ─────────────────────────────────────────────────────────
  const PR_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'id', label: op('cols.id'), align: 'left' },
    { key: 'title', label: op('cols.title'), align: 'left' },
    { key: 'source', label: op('cols.source'), align: 'center' },
    { key: 'status', label: op('cols.status'), align: 'left' },
    { key: 'ageDays', label: op('cols.age'), align: 'right' },
    { key: 'buyer', label: op('cols.buyer'), align: 'left' },
    { key: 'linkedPo', label: op('cols.linkedPo'), align: 'center' },
    { key: 'badge', label: op('cols.status'), align: 'center' },
  ];
  const prColDefs: ColDef[] = PR_COLS.filter((c) => c.key !== 'badge').map((c) => ({ key: c.key, label: c.label }));
  const [prVisible, setPrVisible] = useState<string[]>(PR_COLS.map((c) => c.key));
  const sortedPrs = sortRows(openPrs, prSort);

  const renderPrCell = (key: string, p: PurchaseRequest) => {
    switch (key) {
      case 'id': return <span style={{ fontWeight: 600, color: t.tx }}>{p.id}</span>;
      case 'title': return <span style={{ color: t.tx2 }}>{p.title}</span>;
      case 'source': return srcBadge(p.source);
      case 'status': return <span style={{ color: t.tx }}>{st(p.status)}</span>;
      case 'ageDays': return <span style={{ fontWeight: 600, color: p.ageDays > 7 ? t.rd : p.ageDays > 3 ? t.am : t.tx }}>{fmtNumber(p.ageDays)}</span>;
      case 'buyer': return <span style={{ color: t.tx2 }}>{buyerName(p.buyerId)}</span>;
      case 'linkedPo': return <span style={{ color: p.poIds.length ? t.tx : t.tx3 }}>{p.poIds.length ? p.poIds.join(', ') : '—'}</span>;
      case 'badge': return ageBadge(p.ageDays);
      default: return null;
    }
  };

  // ── Tablo 2: Geciken PO ──────────────────────────────────────────────────────
  const latePoRows = pos.filter((po) => po.lateDays > 0).map((po) => ({ ...po, supplierName: po.supplierId, buyer: buyerName(po.buyerId) }));
  const sortedLatePos = sortRows(latePoRows, poSort);
  const PO_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'id', label: op('cols.poId'), align: 'left' },
    { key: 'prId', label: op('cols.id'), align: 'left' },
    { key: 'source', label: op('cols.source'), align: 'center' },
    { key: 'buyer', label: op('cols.buyer'), align: 'left' },
    { key: 'orderedDate', label: op('cols.orderedDate'), align: 'left' },
    { key: 'expectedDate', label: op('cols.expectedDate'), align: 'left' },
    { key: 'lateDays', label: op('cols.lateDays'), align: 'right' },
    { key: 'amount', label: op('cols.amount'), align: 'right' },
  ];
  const renderPoCell = (key: string, po: PurchaseOrder & { buyer: string }) => {
    switch (key) {
      case 'id': return <span style={{ fontWeight: 600, color: t.tx }}>{po.id}</span>;
      case 'prId': return <span style={{ color: t.tx3 }}>{po.prId ?? '—'}</span>;
      case 'source': return srcBadge(po.source);
      case 'buyer': return <span style={{ color: t.tx2 }}>{po.buyer}</span>;
      case 'orderedDate': return <span style={{ color: t.tx2 }}>{po.orderedDate}</span>;
      case 'expectedDate': return <span style={{ color: t.tx2 }}>{po.expectedDate}</span>;
      case 'lateDays': return <span style={{ fontWeight: 700, color: t.rd }}>+{fmtNumber(po.lateDays)}</span>;
      case 'amount': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtCompactTRY(po.amount)}</span>;
      default: return null;
    }
  };

  // ── AI uyarıları (3) ──────────────────────────────────────────────────────────
  const pendingAvgAge = pendingApproval ? Math.round(prs.filter((p) => p.status === 'Beklemede').reduce((s, p) => s + p.ageDays, 0) / pendingApproval) : 0;
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '📈', border: t.am,
      text: lang === 'tr'
        ? `Gelen talep ${peakWeek.label} haftasında ${fmtNumber(peakWeek.val)} ile zirve yaptı (sezonsal Kas-Ara tepe). Ekip kapasitesi önden planlanmalı.`
        : `Incoming requests peaked in week ${peakWeek.week} at ${fmtNumber(peakWeek.val)} (seasonal Nov-Dec peak). Plan team capacity ahead.`,
    },
    {
      icon: pendingAvgAge > 5 ? '🔴' : '🟠', border: pendingAvgAge > 5 ? t.rd : t.am,
      text: lang === 'tr'
        ? `Beklemede aşamasında ${fmtNumber(pendingApproval)} talep var; ortalama ${fmtNumber(pendingAvgAge)} ${dl} bekliyor. Onay darboğazı dönüşümü yavaşlatıyor.`
        : `${fmtNumber(pendingApproval)} requests are Pending, waiting ${fmtNumber(pendingAvgAge)} days on average. The approval bottleneck is slowing conversion.`,
    },
    {
      icon: cancelRate >= 10 ? '🔴' : '🔵', border: cancelRate >= 10 ? t.rd : t.c1,
      text: lang === 'tr'
        ? `İptal oranı %${fmtNumber(cancelRate, 1)} (${fmtNumber(cancelledPrs.length)} talep). En sık neden "${cancelByReason[0] ? cancelByReason[0].name : '—'}"; talep kalitesi gözden geçirilmeli.`
        : `Cancellation rate is ${fmtNumber(cancelRate, 1)}% (${fmtNumber(cancelledPrs.length)} requests). Top reason: "${cancelByReason[0] ? cancelByReason[0].name : '—'}"; review request quality.`,
    },
  ];

  return (
    <>
      {/* ── KPI BANDI (12) ────────────────────────────────────────────────────── */}
      <SectionHeader title={op('overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.stt} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1 & 2: Aylık PR hacmi + dönüşüm / PR durum hunisi ──────────── */}
      <SectionHeader title={op('sectionFlow')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={op('monthlyPrVolume')} id="ops-monthly" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth}
                formatter={(v: number, n: string) => n === op('conversion') ? [`${fmtNumber(v)}%`, n] : [fmtNumber(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="B2B" name="B2B" stackId="s" fill={t.pr} barSize={30} />
              <Bar yAxisId="left" dataKey="B2C" name="B2C" stackId="s" fill={t.tl} radius={[3, 3, 0, 0]} barSize={30} />
              <Line yAxisId="right" type="monotone" dataKey="conv" name={op('conversion')} stroke={t.pu} strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={op('prStatusFunnel')} id="ops-funnel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 8 }}>
            {funnelData.map((s, i) => {
              const barPct = 25 + (s.count / funnelMax) * 75;
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, color: t.tx2, width: 120, textAlign: 'right', flexShrink: 0, lineHeight: 1.2 }}>{st(s.status)}</span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: `${barPct}%`, height: 30, background: FUNNEL_COLORS[i], borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: i >= 3 ? '#fff' : '#1E293B' }}>{fmtNumber(s.count)}</span>
                      </div>
                    </div>
                  </div>
                  {i < funnelData.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0', marginLeft: 130 }}>
                      <span style={{ fontSize: 9, color: t.tx3 }}>↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 3 & 4: Aşama süresi / Haftalık gelen talep ─────────────────── */}
      <SectionHeader title={op('sectionBottleneck')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={op('stageDurationChart')} id="ops-stage" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageDuration} margin={{ top: 15, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="status" tickFormatter={st} tick={{ fontSize: 9, fill: t.tx2, angle: -20, textAnchor: 'end' }} axisLine={false} tickLine={false} interval={0} height={55} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtNumber(v, 1)} ${dl}`, op('avg')]} labelFormatter={st} />
              <ReferenceLine y={avgStage} stroke={t.tx3} strokeDasharray="5 3" label={{ value: `${op('avg')} ${fmtNumber(avgStage, 1)}`, fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Bar dataKey="gun" radius={[4, 4, 0, 0]}>
                {stageDuration.map((d, i) => <Cell key={i} fill={d.gun === maxStage ? t.rd : d.gun >= avgStage ? t.am : t.pr} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={op('weeklyInflow')} id="ops-weekly" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weekly} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: t.tx2 }} axisLine={false} tickLine={false} interval={4} tickFormatter={(v) => `H${v}`} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={(v) => `H${v}`} formatter={(v: number) => [fmtNumber(v), op('requests')]} />
              <Line type="monotone" dataKey="val" stroke={t.pr} strokeWidth={2} dot={false} />
              <ReferenceDot x={peakWeek.week} y={peakWeek.val} r={5} fill={t.rd} stroke={t.cd} strokeWidth={2}
                label={{ value: op('peakWeek'), fontSize: 10, fill: t.rd, position: 'top' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 5 & 6: Yaş histogram / İptal donut ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12, marginBottom: 16 }}>
        <ChartContainer t={t} l={l} title={op('ageHistogram')} id="ops-agehist" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageHist} margin={{ top: 15, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtNumber(v), op('requests')]} labelFormatter={(v) => `${v} ${dl}`} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ageHist.map((d, i) => <Cell key={i} fill={d.danger ? t.am : t.pr} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={op('cancelDonut')} id="ops-cancel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={cancelByReason} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={95} paddingAngle={2}>
                {cancelByReason.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [fmtNumber(v), n]} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── TABLO 1: Açık PR (yaş rozetli) ─────────────────────────────────────── */}
      <SectionHeader title={op('sectionTables')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{op('openPrTable')} · {fmtNumber(openPrs.length)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={prColDefs} visibleKeys={prVisible} onChange={setPrVisible} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {PR_COLS.filter((c) => prVisible.includes(c.key)).map((c) => (
                  <th key={c.key} onClick={() => c.key !== 'badge' && c.key !== 'linkedPo' && handleSort(setPrSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: prSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'badge' || c.key === 'linkedPo' ? 'default' : 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}{c.key !== 'badge' && c.key !== 'linkedPo' && <SortIcon colKey={c.key} s={prSort} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPrs.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {PR_COLS.filter((c) => prVisible.includes(c.key)).map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderPrCell(c.key, p)}</td>
                  ))}
                </tr>
              ))}
              {!sortedPrs.length && (
                <tr><td colSpan={PR_COLS.length} style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: Geciken PO (süreç perspektifi + Stok çapraz link notu) ────── */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{op('latePoTable')} · {fmtNumber(latePoRows.length)}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => onSelectRep?.('satin-alma__8')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.pr, fontSize: 11.5, cursor: 'pointer' }}>
              {tp('pages.stockReplenishment')}<Icon name="chevRight" size={11} color={t.pr} />
            </button>
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {PO_COLS.map((c) => (
                  <th key={c.key} onClick={() => handleSort(setPoSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: poSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}<SortIcon colKey={c.key} s={poSort} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedLatePos.map((po) => (
                <tr key={po.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {PO_COLS.map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderPoCell(c.key, po)}</td>
                  ))}
                </tr>
              ))}
              {!sortedLatePos.length && (
                <tr><td colSpan={PO_COLS.length} style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>—</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 16px', fontSize: 10.5, color: t.tx3, fontStyle: 'italic', borderTop: `1px solid ${t.bd}` }}>
          {op('latePoNote')}
        </div>
      </div>

      {/* ── AI ÖNERİLERİ (3) ───────────────────────────────────────────────────── */}
      <SectionHeader title={tp('aiTitle')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
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

export default Operations;
