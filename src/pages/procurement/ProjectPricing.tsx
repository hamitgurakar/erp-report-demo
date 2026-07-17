import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, ReferenceDot, Cell, Legend,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { Icon } from '../../components/ui/Icon';
import { ColumnManager, type ColDef } from '../../components/ui/ColumnManager';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtMonth } from '../../utils/format';
import {
  quotes, buyers, PROC_MONTHS,
  pricingBacklog, pricingBacklogMax, PRICING_WEEKDAYS,
  quoteWeeklyForecast, quoteForecastNextWeek,
} from '../../constants/procurementData';
import type { Quote, QuoteStatus, ProcSource } from '../../types/procurement';

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

// Fiyatlama hunisi sırası (Fiyatlanacak → … → Fiyatlandı → PR'a dönüştü)
const PENDING_STATUSES: QuoteStatus[] = ['Fiyatlanacak', 'TDR Cevap Bekleniyor', 'Eksik Bilgi'];
const FUNNEL_COLORS = ['#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4338CA'];
const SLA_HOURS = 24; // hedef fiyatlama SLA'sı

const monthLabel = (s: string): string => PROC_MONTHS[Number(s.split('-')[1]) - 1];

export const ProjectPricing = ({ t, l, lang, panels, onAddPanel, onPinTo, acct = 'total' }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const pp = (k: string) => i18n.t(`procurement.pricing.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const hs = pp('hoursShort'); // saat kısaltması (s / h)

  const [pendSort, setPendSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'waitHours', dir: 'desc' });

  // ── Global hesap filtresi → kaynak (source) filtresi ────────────────────────
  const srcFilter: ProcSource | null = acct === 'b2b' ? 'B2B' : acct === 'b2c' ? 'B2C' : null;
  const qs = srcFilter ? quotes.filter((q) => q.source === srcFilter) : quotes;
  const buyerName = (id: string) => buyers.find((b) => b.id === id)?.name ?? id;
  const st = (s: string) => pp(`status.${s}`);

  // ── Durum grupları ───────────────────────────────────────────────────────────
  const pending = qs.filter((q) => PENDING_STATUSES.includes(q.status));
  const priced = qs.filter((q) => q.status === 'Fiyatlandı' || q.status === 'Arşiv');
  const pricedFinal = qs.filter((q) => q.status === 'Fiyatlandı'); // dönüşüm paydası
  const convertedQs = qs.filter((q) => q.converted);

  // ── Aylık gruplar ─────────────────────────────────────────────────────────────
  const monthsWithData = PROC_MONTHS.filter((m) => qs.some((q) => monthLabel(q.openedDate) === m));
  const latestMonth = monthsWithData[monthsWithData.length - 1] ?? 'Tem';

  // ── KPI hesapları (10) ─────────────────────────────────────────────────────────
  const monthlyQuotes = qs.filter((q) => monthLabel(q.openedDate) === 'Tem').length;
  const avgTurnaround = priced.length ? priced.reduce((s, q) => s + q.pricingHours, 0) / priced.length : 0;
  const slaCompliant = priced.filter((q) => q.pricingHours <= SLA_HOURS).length;
  const slaCompliance = priced.length ? (slaCompliant / priced.length) * 100 : 0;
  const longestWaiting = pending.length ? Math.max(...pending.map((q) => q.pricingHours)) : 0;
  const winRate = pricedFinal.length ? (convertedQs.length / pricedFinal.length) * 100 : 0;
  const customPrintPct = qs.length ? (qs.filter((q) => q.customPrint).length / qs.length) * 100 : 0;
  const awaitingTdr = qs.filter((q) => q.status === 'TDR Cevap Bekleniyor').length;
  const awaitingInfo = qs.filter((q) => q.status === 'Eksik Bilgi').length;

  const kpis: { id: string; title: string; value: string; trend: string; stt: 'up' | 'down' | 'flat'; color: string; unit: string; info?: string }[] = [
    { id: 'pr-monthly', title: pp('kpi.monthlyQuotes'), value: fmtNumber(monthlyQuotes), trend: '+3', stt: 'up', color: 'pu', unit: '' },
    { id: 'pr-pending', title: pp('kpi.pendingQuotes'), value: fmtNumber(pending.length), trend: '+2', stt: 'up', color: pending.length > 12 ? 'am' : 'tl', unit: '' },
    { id: 'pr-avg', title: pp('kpi.avgTurnaround'), value: `${fmtNumber(avgTurnaround, 1)} ${hs}`, trend: '-1,4', stt: 'down', color: avgTurnaround <= SLA_HOURS ? 'gn' : 'am', unit: hs },
    { id: 'pr-sla', title: pp('kpi.slaCompliance'), value: fmtPercent(slaCompliance, 1), trend: '+3,1pp', stt: 'up', color: slaCompliance >= 70 ? 'gn' : slaCompliance >= 50 ? 'am' : 'rd', unit: '%' },
    { id: 'pr-longest', title: pp('kpi.longestWaiting'), value: `${fmtNumber(longestWaiting, 0)} ${hs}`, trend: '+6', stt: 'up', color: longestWaiting > 48 ? 'rd' : longestWaiting > 24 ? 'am' : 'gn', unit: hs },
    { id: 'pr-win', title: pp('kpi.winRate'), value: fmtPercent(winRate, 1), trend: '-2,2pp', stt: 'down', color: winRate >= 45 ? 'gn' : winRate >= 30 ? 'am' : 'rd', unit: '%' },
    { id: 'pr-custom', title: pp('kpi.customPrintPct'), value: fmtPercent(customPrintPct, 1), trend: '+1,8pp', stt: 'up', color: 'c2', unit: '%' },
    { id: 'pr-tdr', title: pp('kpi.awaitingTdr'), value: fmtNumber(awaitingTdr), trend: '+1', stt: 'up', color: awaitingTdr > 6 ? 'am' : 'c1', unit: '' },
    { id: 'pr-info', title: pp('kpi.awaitingInfo'), value: fmtNumber(awaitingInfo), trend: '+2', stt: 'up', color: awaitingInfo > 5 ? 'rd' : 'am', unit: '' },
    { id: 'pr-fc', title: pp('kpi.forecastNextWeek'), value: `~${fmtNumber(quoteForecastNextWeek)}`, trend: '+2', stt: 'up', color: 'pr', unit: '' },
  ];

  // ── Görsel 2: Durum hunisi ───────────────────────────────────────────────────
  const funnelData = [
    { key: 'Fiyatlanacak', count: qs.filter((q) => q.status === 'Fiyatlanacak').length },
    { key: 'TDR Cevap Bekleniyor', count: awaitingTdr },
    { key: 'Eksik Bilgi', count: awaitingInfo },
    { key: 'Fiyatlandı', count: priced.length },
    { key: 'converted', count: convertedQs.length },
  ];
  const funnelMax = Math.max(...funnelData.map((d) => d.count), 1);

  // ── Görsel 3: Haftalık gelen talep + forecast ────────────────────────────────
  const fcStart = quoteWeeklyForecast.find((p) => p.isForecast);
  const peakPoint = quoteWeeklyForecast.reduce((m, x) => {
    const v = x.actual ?? x.forecast ?? 0;
    const mv = m.actual ?? m.forecast ?? 0;
    return v > mv ? x : m;
  }, quoteWeeklyForecast[0]);
  const peakVal = peakPoint.actual ?? peakPoint.forecast ?? 0;

  // ── Görsel 4: Fiyatlama süresi histogramı ────────────────────────────────────
  const DUR_BUCKETS: { label: string; min: number; max: number }[] = [
    { label: `0-12${hs}`, min: 0, max: 12 },
    { label: `12-24${hs}`, min: 12, max: 24 },
    { label: `24-36${hs}`, min: 24, max: 36 },
    { label: `36-48${hs}`, min: 36, max: 48 },
    { label: `48-72${hs}`, min: 48, max: Infinity },
  ];
  const durHist = DUR_BUCKETS.map((b) => ({
    label: b.label,
    count: priced.filter((q) => q.pricingHours > b.min && q.pricingHours <= b.max).length,
    breach: b.min >= SLA_HOURS,
  }));

  // ── Görsel 5: Özel baskılı vs normal ort. süre ───────────────────────────────
  const customPriced = priced.filter((q) => q.customPrint);
  const normalPriced = priced.filter((q) => !q.customPrint);
  const avgOf = (arr: Quote[]) => (arr.length ? arr.reduce((s, q) => s + q.pricingHours, 0) / arr.length : 0);
  const customVsNormal = [
    { key: 'custom', label: pp('legend.custom'), val: Math.round(avgOf(customPriced) * 10) / 10 },
    { key: 'normal', label: pp('legend.normal'), val: Math.round(avgOf(normalPriced) * 10) / 10 },
  ];

  // ── Görsel 6: Uzman bazlı ort. fiyatlama süresi ──────────────────────────────
  const byBuyer = buyers.map((b) => {
    const bq = priced.filter((q) => q.buyerId === b.id);
    return { name: b.name, val: bq.length ? Math.round((bq.reduce((s, q) => s + q.pricingHours, 0) / bq.length) * 10) / 10 : 0, n: bq.length };
  }).filter((b) => b.n > 0).sort((a, b) => b.val - a.val);

  // ── Tablo 2: Aylık dönüşüm ────────────────────────────────────────────────────
  const convRows = monthsWithData.map((m) => {
    const inM = qs.filter((q) => monthLabel(q.openedDate) === m);
    const pricedM = inM.filter((q) => q.status === 'Fiyatlandı' || q.status === 'Arşiv').length;
    const convM = inM.filter((q) => q.converted).length;
    return { month: m, priced: pricedM, converted: convM, rate: pricedM ? (convM / pricedM) * 100 : 0 };
  });
  const convTotal = {
    priced: convRows.reduce((s, r) => s + r.priced, 0),
    converted: convRows.reduce((s, r) => s + r.converted, 0),
  };
  const convTotalRate = convTotal.priced ? (convTotal.converted / convTotal.priced) * 100 : 0;

  // ── Ortak yardımcılar ─────────────────────────────────────────────────────────
  const sortRows = <T,>(rows: T[], s: { key: string; dir: 'asc' | 'desc' }) =>
    [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[s.key];
      const bv = (b as Record<string, unknown>)[s.key];
      if (typeof av === 'number' && typeof bv === 'number') return s.dir === 'asc' ? av - bv : bv - av;
      return s.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  const handleSort = (setter: typeof setPendSort, key: string) =>
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
  const waitBadge = (h: number) => {
    const c = h > 48 ? t.rd : h > 24 ? t.am : t.tl;
    const label = h > 48 ? tp('exec.critical') : h > 24 ? tp('exec.warning') : tp('exec.watch');
    return <span style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}1F`, borderRadius: 5, padding: '2px 8px' }}>{label}</span>;
  };

  // ── Isı haritası hücre stili (yoğunluk → indigo alfa) ────────────────────────
  const heatCell = (v: number) => {
    if (v <= 0) return { bg: t.bg2, color: t.tx3 };
    const ratio = v / pricingBacklogMax;
    const alpha = Math.round((0.12 + ratio * 0.85) * 255);
    const hex = alpha.toString(16).padStart(2, '0');
    return { bg: `${t.pr}${hex}`, color: ratio > 0.5 ? '#fff' : t.tx };
  };

  // ── Tablo 1: Bekleyen fiyatlamalar ───────────────────────────────────────────
  const pendingRows = pending.map((q) => ({
    ...q, waitHours: q.pricingHours, buyer: buyerName(q.buyerId),
  }));
  const sortedPending = sortRows(pendingRows, pendSort);
  const PEND_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'id', label: 'ID', align: 'left' },
    { key: 'projectName', label: pp('cols.project'), align: 'left' },
    { key: 'source', label: pp('cols.source'), align: 'center' },
    { key: 'status', label: pp('cols.status'), align: 'left' },
    { key: 'waitHours', label: pp('cols.waitHours'), align: 'right' },
    { key: 'customPrint', label: pp('cols.customPrint'), align: 'center' },
    { key: 'buyer', label: pp('cols.buyer'), align: 'left' },
    { key: 'salesRep', label: pp('cols.salesRep'), align: 'left' },
    { key: 'badge', label: pp('cols.badge'), align: 'center' },
  ];
  const pendColDefs: ColDef[] = PEND_COLS.filter((c) => c.key !== 'badge').map((c) => ({ key: c.key, label: c.label }));
  const [pendVisible, setPendVisible] = useState<string[]>(PEND_COLS.map((c) => c.key));

  const renderPendCell = (key: string, q: Quote & { waitHours: number; buyer: string }) => {
    switch (key) {
      case 'id': return <span style={{ fontWeight: 600, color: t.tx }}>{q.id}</span>;
      case 'projectName': return <span style={{ color: t.tx2 }}>{q.projectName}</span>;
      case 'source': return srcBadge(q.source);
      case 'status': return <span style={{ color: t.tx }}>{st(q.status)}</span>;
      case 'waitHours': return <span style={{ fontWeight: 700, color: q.waitHours > 48 ? t.rd : q.waitHours > 24 ? t.am : t.tx }}>{fmtNumber(q.waitHours, 0)} {hs}</span>;
      case 'customPrint': return <span style={{ color: q.customPrint ? t.pu : t.tx3, fontWeight: q.customPrint ? 600 : 400 }}>{q.customPrint ? tp('yes') : tp('no')}</span>;
      case 'buyer': return <span style={{ color: t.tx2 }}>{q.buyer}</span>;
      case 'salesRep': return <span style={{ color: t.tx2 }}>{q.salesRep}</span>;
      case 'badge': return waitBadge(q.waitHours);
      default: return null;
    }
  };

  // ── AI uyarıları (4) ────────────────────────────────────────────────────────
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '📈', border: t.am,
      text: lang === 'tr'
        ? `Gelecek hafta ~${fmtNumber(quoteForecastNextWeek)} fiyat talebi öngörülüyor (sezonsal Q4 yükselişi; tepe H${peakPoint.label.replace('H', '')} ~${fmtNumber(peakVal)}). Kapasite önden planlanmalı.`
        : `~${fmtNumber(quoteForecastNextWeek)} quote requests forecast next week (seasonal Q4 rise; peak ${peakPoint.label} ~${fmtNumber(peakVal)}). Plan capacity ahead.`,
    },
    {
      icon: slaCompliance < 60 ? '🔴' : '🟠', border: slaCompliance < 60 ? t.rd : t.am,
      text: lang === 'tr'
        ? `SLA uyumu %${fmtNumber(slaCompliance, 0)} (${fmtNumber(priced.length - slaCompliant)} talep 24s üstünde fiyatlandı); en uzun bekleyen ${fmtNumber(longestWaiting, 0)}s. SLA ihlal riski var.`
        : `SLA compliance is ${fmtNumber(slaCompliance, 0)}% (${fmtNumber(priced.length - slaCompliant)} quotes priced over 24h); longest wait ${fmtNumber(longestWaiting, 0)}h. SLA breach risk.`,
    },
    {
      icon: awaitingInfo > 5 ? '🔴' : '⚠️', border: awaitingInfo > 5 ? t.rd : t.am,
      text: lang === 'tr'
        ? `${fmtNumber(awaitingInfo)} talep "Eksik Bilgi" aşamasında bekliyor; ayrıca ${fmtNumber(awaitingTdr)} talep TDR cevabı bekliyor. Eksik bilgi darboğazı dönüşümü yavaşlatıyor.`
        : `${fmtNumber(awaitingInfo)} quotes are stuck in "Missing Info"; ${fmtNumber(awaitingTdr)} more await a TDR response. The missing-info bottleneck is slowing conversion.`,
    },
    {
      icon: winRate < 45 ? '📉' : '✅', border: winRate < 45 ? t.rd : t.gn,
      text: lang === 'tr'
        ? `Fiyatlandı→PR dönüşümü %${fmtNumber(winRate, 0)} (${fmtNumber(convertedQs.length)}/${fmtNumber(pricedFinal.length)}). Özel baskılı talepler ort. ${fmtNumber(customVsNormal[0].val, 0)}s sürüyor (normal ${fmtNumber(customVsNormal[1].val, 0)}s); hızlı fiyatlama win-rate'i artırır.`
        : `Priced→PR conversion is ${fmtNumber(winRate, 0)}% (${fmtNumber(convertedQs.length)}/${fmtNumber(pricedFinal.length)}). Custom-print quotes take ${fmtNumber(customVsNormal[0].val, 0)}h on avg (normal ${fmtNumber(customVsNormal[1].val, 0)}h); faster pricing lifts win rate.`,
    },
  ];

  const tableWrap = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 } as const;
  const thStyle = (align: string, active: boolean) => ({ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: active ? t.pr : t.tx2, textAlign: align as 'left' | 'right' | 'center', whiteSpace: 'nowrap' as const, userSelect: 'none' as const });

  return (
    <>
      {/* ── Veri kaynağı bilgi notu ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px 0', padding: '7px 12px', background: `${t.pu}12`, border: `1px solid ${t.pu}33`, borderRadius: 8, width: 'fit-content' }}>
        <Icon name="info" size={13} color={t.pu} />
        <span style={{ fontSize: 11.5, color: t.tx2 }}>{pp('dataSource')}</span>
      </div>

      {/* ── KPI BANDI (10) ─────────────────────────────────────────────────────── */}
      <SectionHeader title={pp('overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.stt} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1 & 2: Yığılma heatmap / Durum hunisi ───────────────────────── */}
      <SectionHeader title={pp('sectionBacklog')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={pp('charts.backlogHeatmap')} id="pr-heatmap" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 52 }} />
                  {PRICING_WEEKDAYS.map((d) => (
                    <th key={d} style={{ fontSize: 10.5, fontWeight: 600, color: t.tx2, padding: '2px 0' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingBacklog.map((wk) => (
                  <tr key={wk.label}>
                    <td style={{ fontSize: 10, color: t.tx3, textAlign: 'right', paddingRight: 6, whiteSpace: 'nowrap' }}>{wk.label}</td>
                    {wk.days.map((v, di) => {
                      const c = heatCell(v);
                      return (
                        <td key={di} title={`${PRICING_WEEKDAYS[di]} · ${v}`}
                          style={{ background: c.bg, color: c.color, textAlign: 'center', fontSize: 10.5, fontWeight: 600, height: 30, borderRadius: 5, minWidth: 34 }}>
                          {v > 0 ? v : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: t.tx3 }}>{pp('legend.low')}</span>
            {[0.15, 0.4, 0.65, 0.9].map((r) => (
              <div key={r} style={{ width: 18, height: 12, borderRadius: 3, background: `${t.pr}${Math.round(r * 255).toString(16).padStart(2, '0')}` }} />
            ))}
            <span style={{ fontSize: 10, color: t.tx3 }}>{pp('legend.high')}</span>
          </div>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={pp('charts.statusFunnel')} id="pr-funnel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 8 }}>
            {funnelData.map((s, i) => {
              const barPct = 25 + (s.count / funnelMax) * 75;
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, color: t.tx2, width: 120, textAlign: 'right', flexShrink: 0, lineHeight: 1.2 }}>{st(s.key)}</span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: `${barPct}%`, height: 34, background: FUNNEL_COLORS[i], borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* ── GÖRSEL 3: Haftalık gelen talep + forecast ──────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={pp('charts.weeklyForecast')} id="pr-forecast" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quoteWeeklyForecast} margin={{ top: 15, right: 24, bottom: 6, left: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number | null, n: string) => v !== null ? [fmtNumber(v), n] : ['—', n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {fcStart && (
                <ReferenceLine x={fcStart.label} stroke={t.tx3} strokeDasharray="4 3"
                  label={{ value: pp('forecastTag'), fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="actual" name={pp('legend.actual')} stroke={t.pr} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="forecast" name={pp('legend.forecast')} stroke={t.pu} strokeWidth={2.2} strokeDasharray="6 4" dot={{ r: 3, fill: t.pu }} connectNulls />
              <ReferenceDot x={peakPoint.label} y={peakVal} r={5} fill={t.rd} stroke={t.cd} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 4 & 5: Süre histogramı / Özel-Normal ───────────────────────── */}
      <SectionHeader title={pp('sectionDuration')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={pp('charts.durationHistogram')} id="pr-hist" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={durHist} margin={{ top: 15, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtNumber(v), pp('legend.quotes')]} />
              <ReferenceLine x={`24-36${hs}`} stroke={t.rd} strokeDasharray="5 3" label={{ value: pp('slaTarget'), fontSize: 10, fill: t.rd, position: 'insideTopLeft' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {durHist.map((d, i) => <Cell key={i} fill={d.breach ? t.rd : t.gn} opacity={0.82} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={pp('charts.customVsNormal')} id="pr-custom" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={customVsNormal} margin={{ top: 15, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${hs}`} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtNumber(v, 1)} ${hs}`, pp('kpi.avgTurnaround')]} />
              <ReferenceLine y={SLA_HOURS} stroke={t.rd} strokeDasharray="5 3" label={{ value: pp('slaTarget'), fontSize: 10, fill: t.rd, position: 'insideTopRight' }} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={70}>
                <Cell fill={t.pu} opacity={0.85} />
                <Cell fill={t.tl} opacity={0.85} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 6: Uzman bazlı ort. fiyatlama süresi ────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <ChartContainer t={t} l={l} title={pp('charts.turnaroundByBuyer')} id="pr-buyer" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byBuyer} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${hs}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtNumber(v, 1)} ${hs}`, pp('kpi.avgTurnaround')]} />
              <ReferenceLine x={SLA_HOURS} stroke={t.rd} strokeDasharray="5 3" label={{ value: pp('slaTarget'), fontSize: 10, fill: t.rd, position: 'top' }} />
              <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={22}>
                {byBuyer.map((b, i) => <Cell key={i} fill={b.val > SLA_HOURS ? t.am : t.pr} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── TABLO 1: Bekleyen fiyatlamalar ─────────────────────────────────────── */}
      <SectionHeader title={pp('sectionTables')} t={t} />
      <div style={tableWrap}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{pp('charts.pendingTable')} · {fmtNumber(pending.length)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={pendColDefs} visibleKeys={pendVisible} onChange={setPendVisible} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {PEND_COLS.filter((c) => pendVisible.includes(c.key)).map((c) => {
                  const sortable = c.key !== 'badge';
                  return (
                    <th key={c.key} onClick={() => sortable && handleSort(setPendSort, c.key)}
                      style={{ ...thStyle(c.align, pendSort.key === c.key), cursor: sortable ? 'pointer' : 'default' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                        {c.label}{sortable && <SortIcon colKey={c.key} s={pendSort} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedPending.map((q) => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {PEND_COLS.filter((c) => pendVisible.includes(c.key)).map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderPendCell(c.key, q)}</td>
                  ))}
                </tr>
              ))}
              {!sortedPending.length && (
                <tr><td colSpan={PEND_COLS.length} style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: Aylık dönüşüm ──────────────────────────────────────────────── */}
      <div style={tableWrap}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{pp('charts.conversionTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { k: 'month', a: 'left' as const }, { k: 'priced', a: 'right' as const },
                  { k: 'convertedCount', a: 'right' as const }, { k: 'rate', a: 'right' as const },
                ].map((c) => (
                  <th key={c.k} style={thStyle(c.a, false)}>{pp(`cols.${c.k}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {convRows.map((r) => (
                <tr key={r.month} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx }}>{fmtMonth(r.month)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtNumber(r.priced)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{fmtNumber(r.converted)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: r.rate >= 45 ? t.gn : r.rate >= 30 ? t.am : t.rd }}>{fmtPercent(r.rate, 0)}</td>
                </tr>
              ))}
              <tr style={{ background: t.bg2, borderTop: `2px solid ${t.bd}` }}>
                <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: t.tx }}>{lang === 'tr' ? 'Toplam' : 'Total'}</td>
                <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: t.tx }}>{fmtNumber(convTotal.priced)}</td>
                <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: t.tx }}>{fmtNumber(convTotal.converted)}</td>
                <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: t.pr }}>{fmtPercent(convTotalRate, 0)}</td>
              </tr>
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

export default ProjectPricing;
