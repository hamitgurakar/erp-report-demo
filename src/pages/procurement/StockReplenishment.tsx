import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ScatterChart, Scatter, ZAxis, AreaChart, Area, Cell, Legend,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { Icon } from '../../components/ui/Icon';
import { FilterBar, type FilterOption } from '../../components/ui/FilterBar';
import { ColumnManager, type ColDef } from '../../components/ui/ColumnManager';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtCompactTRY, fmtMonth } from '../../utils/format';
import {
  stockItems, openPurchaseOrders, openPoBySupplier, weeklyDeliveries,
  dosTrendByCategory, dosCategories, daysToConfirm, expeditedOrderPct,
  suppliers, PROC_CATEGORIES,
} from '../../constants/procurementData';
import type { StockItem, ReplenishStatus, PurchaseOrder } from '../../types/procurement';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  onSelectRep?: (rep: string) => void;
}

const short = (name: string) => name.split(' ')[0];
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

const DONUT_COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#0D9488', '#14B8A6', '#F59E0B', '#EC4899', '#94A3B8'];

const STATUS_COLOR: Record<ReplenishStatus, { c: keyof Theme; bg: string }> = {
  iyi: { c: 'gn', bg: '#DCFCE7' },
  izle: { c: 'tl', bg: '#CCFBF1' },
  uyari: { c: 'am', bg: '#FEF3C7' },
  acil: { c: 'rd', bg: '#FEE2E2' },
};

// SKU durumuna göre renk (tedarik tetikleme perspektifi)
const stStatusClr = (st: ReplenishStatus, t: Theme) => t[STATUS_COLOR[st].c] as string;
// Days of supply: lead time'a göre kritiklik (item bazında değerlendirilir)
const dosClr = (s: StockItem, t: Theme) =>
  s.daysOfSupply < s.leadTime ? t.rd : s.onHand < s.reorderPoint ? t.am : t.gn;

export const StockReplenishment = ({ t, l, lang, panels, onAddPanel, onPinTo, onSelectRep }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const ts = (k: string) => i18n.t(`procurement.stock.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const dl = i18n.t('common.daysLower');

  const [tableSort, setTableSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'daysOfSupply', dir: 'asc' });
  const [poSort, setPoSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'lateDays', dir: 'desc' });

  // ── Aggregate KPIs (12) ─────────────────────────────────────────────────────
  const ropBelow = stockItems.filter((s) => s.onHand < s.reorderPoint).length;
  const openPos = openPurchaseOrders.length;
  const openPoValue = openPurchaseOrders.reduce((s, p) => s + p.amount, 0);
  const expectedThisWeek = weeklyDeliveries[0]?.poCount ?? 0;
  const latePos = openPurchaseOrders.filter((p) => p.status === 'Gecikmiş').length;
  const avgDaysToReceive = avg(stockItems.map((s) => s.leadTime));
  const stockoutRisk = stockItems.filter((s) => s.daysOfSupply < s.leadTime).length;
  const avgDos = avg(stockItems.map((s) => s.daysOfSupply));
  const safetyCoverage = avg(stockItems.map((s) => (s.safetyStock ? s.onHand / s.safetyStock : 0)));
  const overstock = stockItems.filter((s) => s.daysOfSupply > 90).length;

  const kpis: { id: string; title: string; value: string; trend: string; st: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'stk-rop', title: ts('kpi.skusBelowRop'), value: fmtNumber(ropBelow), trend: '+3', st: 'up', color: ropBelow > 5 ? 'rd' : 'am', unit: '' },
    { id: 'stk-openpos', title: ts('kpi.openPos'), value: fmtNumber(openPos), trend: '+2', st: 'up', color: 'tl', unit: '' },
    { id: 'stk-openpoval', title: ts('kpi.openPoValue'), value: fmtCompactTRY(openPoValue), trend: '+8,4%', st: 'up', color: 'pu', unit: 'K ₺' },
    { id: 'stk-expected', title: ts('kpi.expectedDeliveries'), value: fmtNumber(expectedThisWeek), trend: '+1', st: 'up', color: 'tl', unit: '' },
    { id: 'stk-late', title: ts('kpi.latePos'), value: fmtNumber(latePos), trend: '+1', st: 'up', color: latePos > 0 ? 'rd' : 'gn', unit: '' },
    { id: 'stk-recv', title: ts('kpi.avgDaysToReceive'), value: `${fmtNumber(avgDaysToReceive, 0)} ${dl}`, trend: '-1', st: 'down', color: 'tl', unit: dl },
    { id: 'stk-stockout', title: ts('kpi.stockoutRiskSkus'), value: fmtNumber(stockoutRisk), trend: '+2', st: 'up', color: stockoutRisk > 0 ? 'rd' : 'gn', unit: '' },
    { id: 'stk-dos', title: ts('kpi.avgDaysOfSupply'), value: `${fmtNumber(avgDos, 0)} ${dl}`, trend: '-3', st: 'down', color: 'am', unit: dl },
    { id: 'stk-safety', title: ts('kpi.safetyCoverage'), value: `${fmtNumber(safetyCoverage, 1)}×`, trend: '-0,2', st: 'down', color: safetyCoverage >= 1 ? 'gn' : 'rd', unit: '' },
    { id: 'stk-confirm', title: ts('kpi.daysToConfirm'), value: `${fmtNumber(daysToConfirm, 1)} ${dl}`, trend: '-0,3', st: 'down', color: 'gn', unit: dl },
    { id: 'stk-expedited', title: ts('kpi.expeditedPct'), value: fmtPercent(expeditedOrderPct, 1), trend: '+1,2pp', st: 'up', color: expeditedOrderPct > 12 ? 'rd' : 'am', unit: '%' },
    { id: 'stk-overstock', title: ts('kpi.overstockAlerts'), value: fmtNumber(overstock), trend: '-1', st: 'down', color: overstock > 8 ? 'am' : 'tl', unit: '' },
  ];

  // ── Kritik ikmal heatmap (Acil + Uyarı, days of supply artan, top 12) ───────
  const criticalItems = [...stockItems]
    .filter((s) => s.status === 'acil' || s.status === 'uyari')
    .sort((a, b) => a.daysOfSupply - b.daysOfSupply)
    .slice(0, 12);

  // ── Açık PO değeri bar (tedarikçiye göre, top 10) ───────────────────────────
  const openPoBarData = openPoBySupplier.slice(0, 10).map((r) => ({ name: short(r.supplier), value: r.value }));

  // ── Stockout Top-20 (days of supply en düşük 20) ────────────────────────────
  const stockoutBarData = [...stockItems]
    .sort((a, b) => a.daysOfSupply - b.daysOfSupply)
    .slice(0, 20)
    .map((s) => ({ name: s.name, dos: s.daysOfSupply, status: s.status }));

  // ── Lead time vs sapma scatter (tedarikçi bazında) ──────────────────────────
  const leadScatter = suppliers.map((s) => ({ x: s.leadTime, y: s.leadTimeVariance, z: Math.round(s.annualSpend / 1000), name: s.name }));
  const avgLead = avg(suppliers.map((s) => s.leadTime));
  const avgVar = avg(suppliers.map((s) => s.leadTimeVariance));

  // ── İkmal aksiyon tablosu ───────────────────────────────────────────────────
  const COLS: { key: string; label: string; align: 'left' | 'right' | 'center' }[] = [
    { key: 'sku', label: ts('cols.sku'), align: 'left' },
    { key: 'name', label: ts('cols.product'), align: 'left' },
    { key: 'onHand', label: ts('cols.onHand'), align: 'right' },
    { key: 'reorderPoint', label: ts('cols.rop'), align: 'right' },
    { key: 'safetyStock', label: ts('cols.safetyStock'), align: 'right' },
    { key: 'daysOfSupply', label: ts('cols.daysOfSupply'), align: 'right' },
    { key: 'eoq', label: ts('cols.eoq'), align: 'right' },
    { key: 'supplierName', label: ts('cols.supplier'), align: 'left' },
    { key: 'leadTime', label: ts('cols.leadTime'), align: 'right' },
    { key: 'status', label: ts('cols.status'), align: 'center' },
    { key: 'action', label: ts('cols.action'), align: 'center' },
  ];
  const colDefs: ColDef[] = COLS.map((c) => ({ key: c.key, label: c.label }));
  const [visibleCols, setVisibleCols] = useState<string[]>(COLS.map((c) => c.key));

  const sortedItems = [...stockItems].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[tableSort.key];
    const bv = (b as unknown as Record<string, unknown>)[tableSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return tableSort.dir === 'asc' ? av - bv : bv - av;
    return tableSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  // ── Açık PO takip tablosu (gecikme azalan) ──────────────────────────────────
  const supName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? id;
  const poRows = openPurchaseOrders.map((p) => ({ ...p, supplierName: supName(p.supplierId) }));
  const sortedPos = [...poRows].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[poSort.key];
    const bv = (b as unknown as Record<string, unknown>)[poSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return poSort.dir === 'asc' ? av - bv : bv - av;
    return poSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const handleSort = (setter: typeof setTableSort, key: string) =>
    setter((p) => (p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' }));

  const SortIcon = ({ colKey, s }: { colKey: string; s: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon name={s.key === colKey ? (s.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={s.key === colKey ? t.pr : t.tx3} />
  );

  const statusBadge = (st: ReplenishStatus) => {
    const cfg = STATUS_COLOR[st];
    return <span style={{ fontSize: 10, fontWeight: 600, color: t[cfg.c] as string, background: cfg.bg, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{i18n.t(`badges.${st}`)}</span>;
  };

  const actionBtn = (label: string, primary?: boolean) => (
    <button style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', border: `1px solid ${primary ? t.pr : t.bd}`, background: primary ? t.pr : t.bg2, color: primary ? '#fff' : t.tx2 }}>{label}</button>
  );

  const renderCell = (key: string, s: StockItem) => {
    switch (key) {
      case 'sku': return <span style={{ fontWeight: 600, color: t.tx2, fontSize: 11 }}>{s.sku}</span>;
      case 'name': return <span style={{ fontWeight: 600, color: t.tx }}>{s.name}</span>;
      case 'onHand': return <span style={{ fontWeight: 600, color: dosClr(s, t) }}>{fmtNumber(s.onHand)}</span>;
      case 'reorderPoint': return <span style={{ color: t.tx2 }}>{fmtNumber(s.reorderPoint)}</span>;
      case 'safetyStock': return <span style={{ color: t.tx2 }}>{fmtNumber(s.safetyStock)}</span>;
      case 'daysOfSupply': return <span style={{ fontWeight: 700, color: dosClr(s, t) }}>{s.daysOfSupply} {dl}</span>;
      case 'eoq': return <span style={{ fontWeight: 500, color: t.tx }}>{fmtNumber(s.eoq)}</span>;
      case 'supplierName': return <span style={{ color: t.tx2 }}>{s.supplierName}</span>;
      case 'leadTime': return <span style={{ color: t.tx }}>{s.leadTime} {dl}</span>;
      case 'status': return statusBadge(s.status);
      case 'action': return (
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
          {actionBtn(ts('createPo'), true)}
          {actionBtn(ts('askSupplier'))}
        </div>
      );
      default: return null;
    }
  };

  // ── Açık PO durum rozeti ────────────────────────────────────────────────────
  const poStatusBadge = (p: PurchaseOrder) => {
    const isLate = p.status === 'Gecikmiş';
    const clr = isLate ? t.rd : t.tl;
    const bg = isLate ? '#FEE2E2' : '#CCFBF1';
    return <span style={{ fontSize: 10, fontWeight: 600, color: clr, background: bg, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{i18n.t(`procurement.stock.poStatus.${p.status}`)}</span>;
  };

  // ── Filtre barı ─────────────────────────────────────────────────────────────
  const filters: FilterOption[] = [
    { key: 'category', label: tp('cols.category'), options: [...PROC_CATEGORIES] },
    { key: 'supplier', label: tp('cols.supplier'), options: suppliers.map((s) => s.name) },
    { key: 'status', label: ts('cols.status'), options: [i18n.t('badges.acil'), i18n.t('badges.uyari'), i18n.t('badges.izle'), i18n.t('badges.iyi')] },
  ];

  // ── AI uyarıları (4) ────────────────────────────────────────────────────────
  const riskiest = [...stockItems].sort((a, b) => a.daysOfSupply - b.daysOfSupply)[0];
  const latePo = [...poRows].sort((a, b) => b.lateDays - a.lateDays)[0]
    ?? { id: '—', supplierName: '—', lateDays: 0 };
  const belowRopItem = stockItems.find((s) => s.onHand < s.reorderPoint) ?? stockItems[0];
  const overstockValue = stockItems.filter((s) => s.daysOfSupply > 90).reduce((s, x) => s + x.onHand * x.landedUnitCost, 0);

  const alerts: { icon: string; border: string; text: string }[] = [
    {
      icon: '🔴', border: t.rd,
      text: lang === 'tr'
        ? `${stockoutRisk} SKU stockout riskinde (days of supply < lead time). Öncelikli: ${riskiest.name} (${riskiest.daysOfSupply} gün kaldı, lead ${riskiest.leadTime} gün).`
        : `${stockoutRisk} SKUs at stockout risk (days of supply < lead time). Top priority: ${riskiest.name} (${riskiest.daysOfSupply} days left, lead ${riskiest.leadTime} days).`,
    },
    {
      icon: '⚠️', border: t.am,
      text: lang === 'tr'
        ? `${latePo.supplierName} ${latePo.id} ${latePo.lateDays} gün gecikmiş; teslimat planını riske atıyor. Tedarikçiyle takip edin.`
        : `${latePo.supplierName} ${latePo.id} is ${latePo.lateDays} days late; it threatens the delivery plan. Follow up with the supplier.`,
    },
    {
      icon: '📦', border: t.pr,
      text: lang === 'tr'
        ? `${belowRopItem.name} ROP altında; önerilen EOQ ${fmtNumber(belowRopItem.eoq)} adet, tahmini landed cost ${fmtNumber(belowRopItem.landedUnitCost)} ₺/adet.`
        : `${belowRopItem.name} is below ROP; suggested EOQ ${fmtNumber(belowRopItem.eoq)} units, est. landed cost ${fmtNumber(belowRopItem.landedUnitCost)} ₺/unit.`,
    },
    {
      icon: '💡', border: t.tl,
      text: lang === 'tr'
        ? `${overstock} SKU'da fazla stok (>90 gün); yeni sipariş ertelenerek ~${fmtCompactTRY(overstockValue)} nakit serbest bırakılabilir.`
        : `${overstock} SKUs are overstocked (>90 days); deferring new orders could free up ~${fmtCompactTRY(overstockValue)} in cash.`,
    },
  ];

  const excelBtn = (
    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
      <Icon name="download" size={12} color={t.tx3} />{i18n.t('common.excel')}
    </button>
  );

  return (
    <>
      <FilterBar t={t} l={l} filters={filters} />

      {/* ── Envanter detayı çapraz link (Category > Stok & Envanter) ─────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.bg2, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
        <Icon name="package" size={15} color={t.tl} />
        <button
          onClick={() => onSelectRep?.('kategori__2')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.pr, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {ts('inventoryLink')}<Icon name="externalLink" size={12} color={t.pr} />
        </button>
        <span style={{ fontSize: 11.5, color: t.tx3, lineHeight: 1.4 }}>{ts('inventoryLinkNote')}</span>
      </div>

      {/* ── KPI BANDI (12) ──────────────────────────────────────────────────── */}
      <SectionHeader title={ts('overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── GÖRSEL 1: Kritik ikmal heatmap ──────────────────────────────────── */}
      <SectionHeader title={ts('sectionCritical')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, fontSize: 13, fontWeight: 500, color: t.tx }}>{ts('charts.criticalHeatmap')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{ts('cols.product')}</th>
                <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{ts('cols.supplier')}</th>
                <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{ts('heat.onHand')}</th>
                <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{ts('heat.rop')}</th>
                <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{ts('heat.safety')}</th>
                <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{ts('cols.daysOfSupply')}</th>
                <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{ts('cols.status')}</th>
              </tr>
            </thead>
            <tbody>
              {criticalItems.map((s) => {
                const clr = dosClr(s, t);
                return (
                  <tr key={s.sku} style={{ borderBottom: `1px solid ${t.bd}` }}>
                    <td style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: t.tx, whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ padding: '7px 14px', fontSize: 12, color: t.tx2, whiteSpace: 'nowrap' }}>{s.supplierName}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ background: `${clr}1F`, color: clr, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 0' }}>{fmtNumber(s.onHand)}</div>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: 11, color: t.tx2 }}>{fmtNumber(s.reorderPoint)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: 11, color: t.tx2 }}>{fmtNumber(s.safetyStock)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ background: `${clr}1F`, color: clr, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 0' }}>{s.daysOfSupply} {dl}</div>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>{statusBadge(s.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GÖRSEL 2 & 3: Açık PO bar + Teslimat timeline ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={ts('charts.openPoBar')} id="stk-chart-openpo" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={openPoBarData} margin={{ top: 15, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: t.tx2, angle: -35, textAnchor: 'end' }} interval={0} height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), ts('kpi.openPoValue')]} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} fill={t.pr} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={ts('charts.deliveryTimeline')} id="stk-chart-timeline" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyDeliveries} margin={{ top: 15, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip
                cursor={{ fill: t.hoverBg }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { label: string; poCount: number; value: number; isThisWeek: boolean };
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: t.tx, marginBottom: 4 }}>{fmtMonth(d.label)}{d.isThisWeek ? ` (${ts('thisWeek')})` : ''}</div>
                      <div style={{ color: t.tx2 }}>{fmtCompactTRY(d.value)}</div>
                      <div style={{ color: t.tx2 }}>{d.poCount} {ts('deliveries')}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {weeklyDeliveries.map((d, i) => <Cell key={i} fill={d.isThisWeek ? t.tl : t.prL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 4 & 5: Days of supply area + Stockout Top-20 ─────────────── */}
      <SectionHeader title={ts('sectionSupply')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={ts('charts.dosTrend')} id="stk-chart-dos" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dosTrendByCategory} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                {dosCategories.map((cat, i) => (
                  <linearGradient key={cat} id={`dos-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={DONUT_COLORS[i]} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={DONUT_COLORS[i]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${dl}`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [`${v} ${dl}`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              {dosCategories.map((cat, i) => (
                <Area key={cat} type="monotone" dataKey={cat} name={cat} stroke={DONUT_COLORS[i]} strokeWidth={2} fill={`url(#dos-${i})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={ts('charts.stockoutBar')} id="stk-chart-stockout" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockoutBarData} layout="vertical" margin={{ top: 5, right: 24, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${dl}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: t.tx2 }} width={110} axisLine={false} tickLine={false} interval={0} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} ${dl}`, ts('cols.daysOfSupply')]} />
              <Bar dataKey="dos" radius={[0, 3, 3, 0]}>
                {stockoutBarData.map((d, i) => <Cell key={i} fill={stStatusClr(d.status, t)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── GÖRSEL 6: Lead time vs sapma scatter ────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <ChartContainer t={t} l={l} title={ts('charts.leadVsVariance')} id="stk-chart-leadvar" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="lead" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${dl}`} label={{ value: tp('kpi.leadTime'), position: 'insideBottom', offset: -8, fontSize: 11, fill: t.tx3 }} />
              <YAxis type="number" dataKey="y" name="variance" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ZAxis type="number" dataKey="z" range={[60, 420]} />
              <ReferenceLine x={avgLead} stroke={t.tx3} strokeDasharray="4 3" />
              <ReferenceLine y={avgVar} stroke={t.tx3} strokeDasharray="4 3" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { x: number; y: number; z: number; name: string };
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: t.tx, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: t.tx2 }}>{tp('kpi.leadTime')}: {d.x} {dl}</div>
                      <div style={{ color: t.tx2 }}>{tp('kpi.leadTimeVariance')}: {fmtPercent(d.y, 1)}</div>
                      <div style={{ color: t.tx2 }}>{tp('cols.spend')}: {fmtCompactTRY(d.z * 1000)}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={leadScatter} fill={t.tl} fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── TABLO 1: İkmal aksiyon (ColumnManager + Excel, DoS artan) ────────── */}
      <SectionHeader title={ts('sectionTables')} t={t} />
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{ts('charts.replenishTable')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnManager t={t} l={l} allColumns={colDefs} visibleKeys={visibleCols} onChange={setVisibleCols} />
            {excelBtn}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                  <th
                    key={c.key}
                    onClick={() => c.key !== 'action' && handleSort(setTableSort, c.key)}
                    style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: tableSort.key === c.key ? t.pr : t.tx2, textAlign: c.align, whiteSpace: 'nowrap', cursor: c.key === 'action' ? 'default' : 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end', gap: 4 }}>
                      {c.label}
                      {c.key !== 'action' && <SortIcon colKey={c.key} s={tableSort} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((s) => (
                <tr key={s.sku} style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.hoverBg)}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                    <td key={c.key} style={{ padding: '9px 14px', fontSize: 12, textAlign: c.align }}>{renderCell(c.key, s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLO 2: Açık PO takip (gecikme azalan, Operasyon çapraz link) ───── */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{ts('charts.openPoTable')}</span>
          {excelBtn}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'id', label: ts('cols.poId'), align: 'left' as const },
                  { key: 'supplierName', label: ts('cols.supplier'), align: 'left' as const },
                  { key: 'orderedDate', label: ts('cols.orderedDate'), align: 'left' as const },
                  { key: 'expectedDate', label: ts('cols.expectedDate'), align: 'left' as const },
                  { key: 'amount', label: ts('cols.amount'), align: 'right' as const },
                  { key: 'lateDays', label: ts('cols.lateDays'), align: 'right' as const },
                  { key: 'status', label: ts('cols.status'), align: 'center' as const },
                ].map((c) => (
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
              {sortedPos.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${t.bd}` }}>
                  <td style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: t.tx2 }}>{p.id}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{p.supplierName}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{p.orderedDate}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{p.expectedDate}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtCompactTRY(p.amount)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: p.lateDays > 0 ? t.rd : t.gn }}>{p.lateDays > 0 ? `${p.lateDays} ${dl}` : '—'}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'center' }}>{poStatusBadge(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button
        onClick={() => onSelectRep?.('satin-alma__2')}
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: 16, cursor: 'pointer', color: t.tx3, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <Icon name="arrowRight" size={12} color={t.tx3} />{ts('crossLinkLatePo')}
      </button>

      {/* ── AI ÖNERİLERİ (4) ────────────────────────────────────────────────── */}
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

export default StockReplenishment;
