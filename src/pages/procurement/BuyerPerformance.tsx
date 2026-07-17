import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, ReferenceLine,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtCompactTRY, fmtMonth } from '../../utils/format';
import {
  buyers, purchaseRequests, purchaseOrders, buyerCompletionTrend, buyerSpendSpark,
} from '../../constants/procurementData';
import type { Buyer } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// Uzman renk paleti (Satış Uzman Performans kalıbıyla uyumlu)
const BUYER_COLORS = ['#16A34A', '#3B82F6', '#D97706', '#7C3AED', '#DC2626'];
const short = (name: string) => name.split(' ')[0];

// Açık iş yükü (gerçek PR/PO verisinden) — açık PR + açık/gecikmiş PO
const OPEN_PR = ['Taslak', 'Beklemede', 'Tedarik Edilebilir', 'İşleniyor'];
const OPEN_PO = ['Açık', 'Gecikmiş'];

export const BuyerPerformance = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const bp = (k: string) => i18n.t(`procurement.buyer.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const dl = i18n.t('common.daysLower');

  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tableSort, setTableSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'totalSpend', dir: 'desc' });

  const color = (id: string) => BUYER_COLORS[buyers.findIndex((b) => b.id === id) % BUYER_COLORS.length];

  // ── İş yükü (açık PR / açık PO) uzman bazında ───────────────────────────────
  const openPrOf = (id: string) => purchaseRequests.filter((p) => p.buyerId === id && OPEN_PR.includes(p.status)).length;
  const openPoOf = (id: string) => purchaseOrders.filter((p) => p.buyerId === id && OPEN_PO.includes(p.status)).length;

  // ── Uzman satırları (gerçek buyer aggregate + türetilmiş açık iş) ───────────
  interface Row extends Buyer { openPr: number; openPo: number; spark: number[] }
  const rows: Row[] = buyers.map((b) => ({
    ...b, openPr: openPrOf(b.id), openPo: openPoOf(b.id), spark: buyerSpendSpark[b.id] ?? [],
  }));

  // ── KPI hesapları (8) ───────────────────────────────────────────────────────
  const totalTeamSpend = rows.reduce((s, b) => s + b.totalSpend, 0);
  const avgPerBuyer = totalTeamSpend / rows.length;
  const fastest = [...rows].sort((a, b) => a.avgCompletionDays - b.avgCompletionDays)[0];
  const slowest = [...rows].sort((a, b) => b.avgCompletionDays - a.avgCompletionDays)[0];
  const teamAvgCompletion = rows.reduce((s, b) => s + b.avgCompletionDays, 0) / rows.length;
  const teamOnTime = rows.reduce((s, b) => s + b.onTimePct, 0) / rows.length;
  const totalOpenWork = rows.reduce((s, b) => s + b.openPr + b.openPo, 0);
  const avgPayment = rows.reduce((s, b) => s + b.avgPaymentDays, 0) / rows.length;

  const kpis1 = [
    { id: 'byr-total', title: bp('kpi.totalTeamSpend'), value: fmtCompactTRY(totalTeamSpend), trend: '+9,4%', st: 'up' as const, color: 'gn', unit: '₺', big: true },
    { id: 'byr-avg', title: bp('kpi.avgPerBuyer'), value: fmtCompactTRY(avgPerBuyer), trend: '+5,1%', st: 'up' as const, color: 'tl', unit: '₺', big: true },
    { id: 'byr-fast', title: bp('kpi.fastest'), value: `${short(fastest.name)} — ${fmtNumber(fastest.avgCompletionDays, 1)} ${dl}`, trend: `${fmtPercent(fastest.onTimePct, 0)} ${lang === 'tr' ? 'zamanında' : 'on-time'}`, st: 'up' as const, color: 'gn', unit: '', big: true },
  ];
  const kpis2 = [
    { id: 'byr-slow', title: bp('kpi.slowest'), value: `${short(slowest.name)} — ${fmtNumber(slowest.avgCompletionDays, 1)} ${dl}`, trend: `${fmtPercent(slowest.onTimePct, 0)} ${lang === 'tr' ? 'zamanında' : 'on-time'}`, st: 'down' as const, color: 'rd', unit: '' },
    { id: 'byr-cmpl', title: bp('kpi.teamAvgCompletion'), value: `${fmtNumber(teamAvgCompletion, 1)} ${dl}`, trend: '-0,6', st: 'down' as const, color: teamAvgCompletion <= 8 ? 'gn' : 'am', unit: dl },
    { id: 'byr-ontime', title: bp('kpi.teamOnTime'), value: fmtPercent(teamOnTime, 1), trend: '+1,8pp', st: 'up' as const, color: teamOnTime >= 85 ? 'gn' : 'am', unit: '%' },
    { id: 'byr-open', title: bp('kpi.totalOpenWork'), value: fmtNumber(totalOpenWork), trend: '+3', st: 'up' as const, color: 'pu', unit: '' },
    { id: 'byr-pay', title: bp('kpi.avgPayment'), value: `${fmtNumber(avgPayment, 0)} ${dl}`, trend: '+1,2', st: 'up' as const, color: 'c1', unit: dl },
  ];

  // ── Grafik verileri ─────────────────────────────────────────────────────────
  const spendBar = [...rows].sort((a, b) => b.totalSpend - a.totalSpend)
    .map((b) => ({ name: short(b.name), spend: Math.round(b.totalSpend / 1000), id: b.id }));
  const workloadBar = [...rows].sort((a, b) => (b.openPr + b.openPo) - (a.openPr + a.openPo))
    .map((b) => ({ name: short(b.name), openPr: b.openPr, openPo: b.openPo }));

  // ── Sıralama ────────────────────────────────────────────────────────────────
  const sortedRows = [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[tableSort.key];
    const bv = (b as Record<string, unknown>)[tableSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return tableSort.dir === 'asc' ? av - bv : bv - av;
    return tableSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
  const handleSort = (key: string) => setTableSort((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));
  const SortIcon = ({ colKey }: { colKey: string }) => (
    <Icon name={tableSort.key === colKey ? (tableSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={tableSort.key === colKey ? t.pr : t.tx3} />
  );

  const miniSpark = (vals: number[], clr: string) => {
    if (!vals.length) return null;
    const min = Math.min(...vals), max = Math.max(...vals), rng = max - min || 1;
    const w = 64, h = 22;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / rng) * h}`).join(' ');
    return (
      <svg width={w} height={h} style={{ display: 'block', margin: '0 auto' }}>
        <polyline points={pts} fill="none" stroke={clr} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  const onTimeClr = (v: number) => (v >= 90 ? t.gn : v >= 80 ? t.am : t.rd);
  const cmplClr = (v: number) => (v <= 6 ? t.gn : v <= 9 ? t.am : t.rd);

  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );

  const TABLE_COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'name', label: bp('cols.name'), align: 'left' },
    { key: 'totalSpend', label: bp('cols.spend'), align: 'right' },
    { key: 'prCount', label: bp('cols.prCount'), align: 'right' },
    { key: 'poCount', label: bp('cols.poCount'), align: 'right' },
    { key: 'avgCompletionDays', label: bp('cols.avgCompletion'), align: 'right' },
    { key: 'onTimePct', label: bp('cols.onTime'), align: 'right' },
    { key: 'openWork', label: bp('cols.openWork'), align: 'right' },
    { key: 'avgPaymentDays', label: bp('cols.avgPayment'), align: 'right' },
    { key: 'spark', label: bp('cols.trend'), align: 'center' },
  ];

  const selectedLabel = selectedBuyer === 'all' ? bp('allTeam') : buyers.find((b) => b.id === selectedBuyer)?.name ?? '';

  // ── AI uyarıları (3): iş yükü dengesizliği; süre artış trendi; pozitif örnek ─
  const maxWork = [...rows].sort((a, b) => (b.openPr + b.openPo) - (a.openPr + a.openPo))[0];
  const minWork = [...rows].sort((a, b) => (a.openPr + a.openPo) - (b.openPr + b.openPo))[0];
  const risingBuyer = (() => {
    // tamamlama süresi son 2 ayda en çok artan uzman
    const first = buyerCompletionTrend[0], last = buyerCompletionTrend[buyerCompletionTrend.length - 1];
    let worst = rows[0], delta = -Infinity;
    rows.forEach((b) => { const d = Number(last[b.id]) - Number(first[b.id]); if (d > delta) { delta = d; worst = b; } });
    return { buyer: worst, delta };
  })();
  const bestBuyer = [...rows].sort((a, b) => b.onTimePct - a.onTimePct)[0];
  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '⚖️', border: t.am,
      text: lang === 'tr'
        ? `İş yükü dengesiz: ${short(maxWork.name)} ${maxWork.openPr + maxWork.openPo} açık işle en yüklü, ${short(minWork.name)} ise ${minWork.openPr + minWork.openPo}. Yeniden dağıtım değerlendirilebilir.`
        : `Workload is uneven: ${short(maxWork.name)} carries ${maxWork.openPr + maxWork.openPo} open items (heaviest), while ${short(minWork.name)} has ${minWork.openPr + minWork.openPo}. Consider rebalancing.`,
    },
    {
      icon: risingBuyer.delta > 0 ? '🔴' : '🔵', border: risingBuyer.delta > 0 ? t.rd : t.c1,
      text: lang === 'tr'
        ? `${short(risingBuyer.buyer.name)} tamamlama süresi son dönemde ${fmtNumber(Math.abs(risingBuyer.delta), 1)} ${dl} ${risingBuyer.delta > 0 ? 'arttı' : 'düştü'}; iş yükü ve darboğaz kontrol edilmeli.`
        : `${short(risingBuyer.buyer.name)}'s completion time ${risingBuyer.delta > 0 ? 'rose' : 'fell'} by ${fmtNumber(Math.abs(risingBuyer.delta), 1)} days recently; review workload and bottlenecks.`,
    },
    {
      icon: '✅', border: t.gn,
      text: lang === 'tr'
        ? `${short(bestBuyer.name)} %${fmtNumber(bestBuyer.onTimePct, 0)} zamanında tamamlama ile ekip lideri; ${fmtNumber(bestBuyer.avgCompletionDays, 1)} ${dl} ort. süre. Pratikleri paylaşılabilir.`
        : `${short(bestBuyer.name)} leads the team with ${fmtNumber(bestBuyer.onTimePct, 0)}% on-time completion at ${fmtNumber(bestBuyer.avgCompletionDays, 1)} days avg. Share best practices.`,
    },
  ];

  return (
    <>
      {/* ── Uzman Seçici ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
        <span style={{ fontSize: 12, color: t.tx2 }}>{bp('selectLabel')}:</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd, color: t.tx, fontSize: 12, fontWeight: 500, cursor: 'pointer', minWidth: 160 }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedLabel}</span>
            <Icon name="chevDown" size={12} color={t.tx3} />
          </button>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 200, overflow: 'hidden' }}>
              {[{ id: 'all', name: bp('allTeam') }, ...buyers].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSelectedBuyer(opt.id); setDropdownOpen(false); }}
                  style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', color: selectedBuyer === opt.id ? t.pr : t.tx, background: selectedBuyer === opt.id ? t.prL : 'transparent', fontWeight: selectedBuyer === opt.id ? 600 : 400 }}
                  onMouseOver={(e) => { if (selectedBuyer !== opt.id) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={(e) => { if (selectedBuyer !== opt.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBuyer !== 'all' ? (
        /* ── BİREYSEL UZMAN PLACEHOLDER ──────────────────────────────────────── */
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 12, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.prL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={24} color={t.pr} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.tx }}>{buyers.find((b) => b.id === selectedBuyer)?.name}</div>
          <div style={{ fontSize: 13, color: t.tx2, maxWidth: 400, lineHeight: 1.6 }}>{bp('individualNote')}</div>
          <button
            onClick={() => setSelectedBuyer('all')}
            style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, border: 'none', background: t.pr, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            {bp('backToTeam')}
          </button>
        </div>
      ) : (
        <>
          {/* ── EKİP GENEL METRİKLERİ (8 KPI) ──────────────────────────────────── */}
          <SectionHeader title={bp('sectionMetrics')} t={t} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {kpis1.map((k) => (
              <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} big {...kp} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
            {kpis2.map((k) => (
              <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
            ))}
          </div>

          {/* ── EKİP KARŞILAŞTIRMA TABLOSU ──────────────────────────────────────── */}
          <SectionHeader title={bp('sectionTable')} t={t} />
          <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{bp('charts.comparisonTable')}</span>
              {excelBtn}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                    {TABLE_COLS.map((c) => (
                      <th key={c.key} onClick={() => c.key !== 'spark' && handleSort(c.key)}
                        style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: tableSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'spark' ? 'default' : 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                          {c.label}{c.key !== 'spark' && <SortIcon colKey={c.key} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((b) => (
                    <tr key={b.id} style={{ borderBottom: `1px solid ${t.bd}` }}
                      onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                      onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: t.tx }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color(b.id), flexShrink: 0 }} />
                          {b.name}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtCompactTRY(b.totalSpend)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fmtNumber(b.prCount)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fmtNumber(b.poCount)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: cmplClr(b.avgCompletionDays) }}>{fmtNumber(b.avgCompletionDays, 1)} {dl}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: onTimeClr(b.onTimePct) }}>{fmtPercent(b.onTimePct, 1)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fmtNumber(b.openPr + b.openPo)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fmtNumber(b.avgPaymentDays)} {dl}</td>
                      <td style={{ padding: '9px 14px' }}>{miniSpark(b.spark, color(b.id))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ALIM & İŞ YÜKÜ (bar + stacked bar) ──────────────────────────────── */}
          <SectionHeader title={bp('sectionCharts')} t={t} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <ChartContainer t={t} l={l} title={bp('charts.spendByBuyer')} id="byr-spend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={spendBar} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                  <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${fmtNumber(v)}K ₺`, bp('cols.spend')]} />
                  <ReferenceLine y={Math.round(avgPerBuyer / 1000)} stroke={t.tx3} strokeDasharray="5 3" label={{ value: bp('kpi.avgPerBuyer'), fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
                  <Bar dataKey="spend" radius={[4, 4, 0, 0]} barSize={44}>
                    {spendBar.map((d) => <Cell key={d.id} fill={color(d.id)} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer t={t} l={l} title={bp('charts.workloadBalance')} id="byr-workload" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={workloadBar} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [fmtNumber(v), n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="openPr" name={bp('openPr')} stackId="w" fill={t.pr} barSize={44} />
                  <Bar dataKey="openPo" name={bp('openPo')} stackId="w" fill={t.tl} radius={[4, 4, 0, 0]} barSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* ── TAMAMLAMA SÜRESİ TRENDİ (uzman bazlı line) ──────────────────────── */}
          <SectionHeader title={bp('sectionTrend')} t={t} />
          <div style={{ marginBottom: 20 }}>
            <ChartContainer t={t} l={l} title={bp('charts.completionTrend')} id="byr-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={buyerCompletionTrend} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} ${dl}`} />
                  <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth} formatter={(v: number, n: string) => [`${fmtNumber(v, 1)} ${dl}`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  {buyers.map((b) => (
                    <Line key={b.id} type="monotone" dataKey={b.id} name={short(b.name)} stroke={color(b.id)} strokeWidth={2} dot={{ r: 3, fill: color(b.id) }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* ── AI ÖNERİLERİ (3) ─────────────────────────────────────────────────── */}
          <SectionHeader title={i18n.t('procurement.aiTitle')} t={t} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderLeft: `3px solid ${a.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: 12.5, color: t.tx2, lineHeight: 1.5 }}>{a.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default BuyerPerformance;
