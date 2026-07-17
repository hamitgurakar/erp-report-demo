import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../../components/kpi/KPICard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ChartContainer } from '../../components/ui/ChartContainer';
import { HealthScore } from '../../components/charts/HealthScore';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtNumber, fmtPercent, fmtCompactTRY, fmtMonth } from '../../utils/format';
import {
  suppliers, supplierHHI, costSummary, savingsMonthly, spendRecords,
  purchaseRequests, purchaseOrders, quotes, buyers, payableInvoices,
  stockItems, openPurchaseOrders, currentDpo, reconciliationRows,
  categoryMargins, profitSummary, PROC_MONTHS,
} from '../../constants/procurementData';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  onSelectRep?: (key: string) => void;
}

// Alt sayfa yönlendirme anahtarları (Dashboard router ile uyumlu)
const REP_SUPPLIERS = 'satin-alma__1';
const REP_OPS = 'satin-alma__2';
const REP_BUYER = 'satin-alma__3';
const REP_PRICING = 'satin-alma__4';
const REP_COST = 'satin-alma__5';
const REP_PROFIT = 'satin-alma__6';
const REP_PAYABLES = 'satin-alma__7';
const REP_STOCK = 'satin-alma__8';

// Alt sayfalarla BİREBİR aynı formüller (deterministik veri → aynı değer).
const OPEN_PR = ['Taslak', 'Beklemede', 'Tedarik Edilebilir', 'İşleniyor'];
const OPEN_PO = ['Açık', 'Gecikmiş'];
const PENDING_QUOTE = ['Fiyatlanacak', 'TDR Cevap Bekleniyor', 'Eksik Bilgi'];
const SLA_HOURS = 24;

export const ExecutiveSummary = ({ t, l, lang, panels, onAddPanel, onPinTo, onSelectRep }: Props) => {
  const i18n = useTranslation();
  const tp = (k: string) => i18n.t(`procurement.${k}`);
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const dl = i18n.t('common.daysLower');

  const cs = costSummary;
  const ps = profitSummary;

  // ── TEDARİKÇİ (Suppliers sayfası formülleri) ────────────────────────────────
  const avgOtif = suppliers.reduce((s, x) => s + x.otif, 0) / suppliers.length;
  const avgSpi = suppliers.reduce((s, x) => s + x.spiScore, 0) / suppliers.length;
  const atRisk = suppliers.filter((s) => s.status === 'acil' || s.status === 'uyari').length;
  const topSupplier = [...suppliers].sort((a, b) => b.spendShare - a.spendShare)[0];
  const worstOtif = [...suppliers].sort((a, b) => a.otif - b.otif)[0];

  // ── OPERASYON (Operations sayfası formülleri, total scope) ──────────────────
  const openCount = purchaseRequests.filter((p) => OPEN_PR.includes(p.status)).length;
  const conversionRate = purchaseRequests.length
    ? (purchaseRequests.filter((p) => p.poIds.length > 0).length / purchaseRequests.length) * 100 : 0;

  // ── FİYATLAMA (ProjectPricing sayfası formülleri) ───────────────────────────
  const pendingQuotes = quotes.filter((q) => PENDING_QUOTE.includes(q.status)).length;
  const pricedQuotes = quotes.filter((q) => q.status === 'Fiyatlandı' || q.status === 'Arşiv');
  const slaCompliance = pricedQuotes.length
    ? (pricedQuotes.filter((q) => q.pricingHours <= SLA_HOURS).length / pricedQuotes.length) * 100 : 0;

  // ── UZMAN (BuyerPerformance sayfası formülleri) ─────────────────────────────
  const teamOnTime = buyers.reduce((s, b) => s + b.onTimePct, 0) / buyers.length;
  const busiest = [...buyers].sort((a, b) => {
    const wa = purchaseRequests.filter((p) => p.buyerId === a.id && OPEN_PR.includes(p.status)).length
      + purchaseOrders.filter((p) => p.buyerId === a.id && OPEN_PO.includes(p.status)).length;
    const wb = purchaseRequests.filter((p) => p.buyerId === b.id && OPEN_PR.includes(p.status)).length
      + purchaseOrders.filter((p) => p.buyerId === b.id && OPEN_PO.includes(p.status)).length;
    return wb - wa;
  })[0];

  // ── STOK (StockReplenishment sayfası formülleri) ────────────────────────────
  const stockoutRisk = stockItems.filter((s) => s.daysOfSupply < s.leadTime).length;
  const latePos = openPurchaseOrders.filter((p) => p.status === 'Gecikmiş').length;
  const openPoValue = openPurchaseOrders.reduce((s, p) => s + p.amount, 0);
  const riskiestSku = [...stockItems].sort((a, b) => a.daysOfSupply - b.daysOfSupply)[0];

  // ── BORÇLULUK (Payables sayfası formülleri) ─────────────────────────────────
  const totalPayables = payableInvoices.reduce((s, i) => s + i.amount, 0);
  const overdueAmt = payableInvoices.filter((i) => i.daysRemaining < 0).reduce((s, i) => s + i.amount, 0);
  const overduePct = totalPayables ? (overdueAmt / totalPayables) * 100 : 0;
  const reconciliationPct = reconciliationRows.length
    ? (reconciliationRows.filter((r) => r.reconciled).length / reconciliationRows.length) * 100 : 0;
  const cash30 = payableInvoices.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 30).reduce((s, i) => s + i.amount, 0);
  const cash60 = payableInvoices.filter((i) => i.daysRemaining > 30 && i.daysRemaining <= 60).reduce((s, i) => s + i.amount, 0);
  const cash90 = payableInvoices.filter((i) => i.daysRemaining > 60 && i.daysRemaining <= 90).reduce((s, i) => s + i.amount, 0);

  // ── KARLILIK (Profitability sayfası) ────────────────────────────────────────
  const worstCat = [...categoryMargins].sort((a, b) => a.grossMargin - b.grossMargin)[0];

  // ── KPI BANDI (12: brief c core 6 + A7 roll-up 6) — hepsi alt sayfa birebir ──
  const kpis: { id: string; title: string; value: string; trend: string; st: 'up' | 'down' | 'flat'; color: string; unit: string }[] = [
    { id: 'exec-total', title: tp('kpi.totalSpend'), value: fmtCompactTRY(cs.totalSpend), trend: '+8,4%', st: 'up', color: 'pu', unit: '₺' },
    { id: 'exec-sum', title: tp('kpi.spendUnderManagement'), value: fmtPercent(cs.spendUnderMgmt, 1), trend: '+3,2pp', st: 'up', color: cs.spendUnderMgmt >= 80 ? 'gn' : 'am', unit: '%' },
    { id: 'exec-otif', title: tp('kpi.otif'), value: fmtPercent(avgOtif, 1), trend: '+1,1pp', st: 'up', color: avgOtif >= 95 ? 'gn' : avgOtif >= 90 ? 'tl' : 'am', unit: '%' },
    { id: 'exec-savings', title: tp('kpi.realizedSavings'), value: fmtCompactTRY(cs.realizedSavings), trend: '+12,1%', st: 'up', color: 'gn', unit: '₺' },
    { id: 'exec-dpo', title: tp('kpi.dpo'), value: `${fmtNumber(currentDpo)} ${dl}`, trend: '+2,0', st: 'up', color: currentDpo <= 60 ? 'gn' : 'am', unit: dl },
    { id: 'exec-gm', title: tp('profit.kpi.grossMargin'), value: fmtPercent(ps.grossMargin, 1), trend: '-1,3pp', st: 'down', color: ps.grossMargin >= 35 ? 'gn' : 'am', unit: '%' },
    { id: 'exec-openreq', title: tp('ops.kpi.openRequests'), value: fmtNumber(openCount), trend: '+3', st: 'up', color: openCount > 20 ? 'am' : 'tl', unit: '' },
    { id: 'exec-conv', title: tp('kpi.conversionRate'), value: fmtPercent(conversionRate, 1), trend: '+2,4pp', st: 'up', color: conversionRate >= 50 ? 'gn' : 'am', unit: '%' },
    { id: 'exec-pending', title: tp('kpi.pendingQuotes'), value: fmtNumber(pendingQuotes), trend: '+2', st: 'up', color: pendingQuotes > 12 ? 'am' : 'tl', unit: '' },
    { id: 'exec-sla', title: tp('kpi.slaCompliance'), value: fmtPercent(slaCompliance, 1), trend: '+3,1pp', st: 'up', color: slaCompliance >= 70 ? 'gn' : slaCompliance >= 50 ? 'am' : 'rd', unit: '%' },
    { id: 'exec-ontime', title: tp('exec.teamOnTime'), value: fmtPercent(teamOnTime, 1), trend: '+1,8pp', st: 'up', color: teamOnTime >= 85 ? 'gn' : 'am', unit: '%' },
    { id: 'exec-overdue', title: tp('pay.kpi.overduePct'), value: fmtPercent(overduePct, 1), trend: '+0,6pp', st: 'up', color: overduePct < 5 ? 'gn' : overduePct < 9 ? 'am' : 'rd', unit: '%' },
  ];

  // ── SAĞLIK SKORU — A7 ağırlıkları (6 bileşen, tam hesap) ────────────────────
  // Maliyet %20, Tedarikçi %20, Operasyon+Fiyatlama %20, Stok %15, Borçluluk %15, Karlılık %10
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const costScore = Math.round((
    clamp((cs.spendUnderMgmt / 80) * 100) +
    clamp(100 - (cs.maverickSpend - 10) * 5) +
    clamp(cs.savingsRealization) +
    clamp(100 - cs.avgPpv * 8)
  ) / 4);
  const supplierScore = Math.round(clamp(0.6 * avgSpi + 0.4 * avgOtif - atRisk * 2));
  const opsPricingScore = Math.round((clamp(conversionRate) + clamp(slaCompliance) + clamp(teamOnTime)) / 3);
  const stockScore = Math.round(clamp(100 - (stockoutRisk / stockItems.length) * 100 - latePos * 2));
  const payablesScore = Math.round(clamp(clamp(100 - overduePct * 5) * 0.7 + reconciliationPct * 0.3));
  const profitScore = Math.round(clamp(ps.grossMargin * 2 - ps.negativeMarginCount * 2));

  const comps: { key: string; score: number; weight: number; rep: string }[] = [
    { key: 'cost', score: costScore, weight: 20, rep: REP_COST },
    { key: 'supplier', score: supplierScore, weight: 20, rep: REP_SUPPLIERS },
    { key: 'opsPricing', score: opsPricingScore, weight: 20, rep: REP_OPS },
    { key: 'stock', score: stockScore, weight: 15, rep: REP_STOCK },
    { key: 'payables', score: payablesScore, weight: 15, rep: REP_PAYABLES },
    { key: 'profitability', score: profitScore, weight: 10, rep: REP_PROFIT },
  ];
  const health = Math.round(comps.reduce((s, c) => s + c.score * c.weight, 0) / 100);
  const grade = health >= 90 ? 'A' : health >= 80 ? 'B' : health >= 70 ? 'C' : health >= 60 ? 'D' : 'F';
  const gradeClr = health >= 75 ? t.gn : health >= 50 ? t.am : t.rd;
  const scoreClr = (v: number) => (v >= 75 ? t.gn : v >= 50 ? t.am : t.rd);

  // ── Harcama + Tasarruf trendi (12 ay) ────────────────────────────────────────
  const trend = PROC_MONTHS.map((m) => {
    const spend = spendRecords.filter((r) => r.month === m).reduce((s, r) => s + r.amount, 0);
    const sv = savingsMonthly.find((x) => x.month === m);
    return { month: m, spend, savings: sv ? sv.realized : 0 };
  });

  // ── Tedarikçi risk mini-scatter (harcama vs risk, balon = lead time) ─────────
  const scatterData = suppliers.map((s) => ({ x: Math.round(s.annualSpend / 1000), y: Math.round(100 - s.spiScore), z: s.leadTime, name: s.name }));

  // ── Nakit çıkış 30/60/90 mini-bar ────────────────────────────────────────────
  const cashData = [
    { label: tp('exec.cash.d30'), value: cash30 },
    { label: tp('exec.cash.d60'), value: cash60 },
    { label: tp('exec.cash.d90'), value: cash90 },
  ];
  const cashColors = [t.pr, t.tl, t.c1];

  // ── UYARI LİSTESİ (8 alt sayfadan; Acil/Uyarı/İzle, drill-down linkli) ──────
  type AlertLevel = 'critical' | 'warning' | 'watch';
  const alerts: { level: AlertLevel; text: string; repKey: string }[] = [
    { // 1 — Tedarikçi
      level: topSupplier.spendShare > 30 || supplierHHI > 2500 ? 'critical' : 'warning',
      repKey: REP_SUPPLIERS,
      text: lang === 'tr'
        ? `Toplam harcamanın %${fmtNumber(topSupplier.spendShare, 1)}'i ${topSupplier.name}'de yoğunlaşıyor (HHI ${fmtNumber(supplierHHI)}). İkinci kaynak nitelendirmesi önerilir.`
        : `${fmtNumber(topSupplier.spendShare, 1)}% of total spend is concentrated in ${topSupplier.name} (HHI ${fmtNumber(supplierHHI)}). Qualifying a second source is recommended.`,
    },
    { // 2 — Stok
      level: stockoutRisk > 0 ? 'critical' : 'watch',
      repKey: REP_STOCK,
      text: lang === 'tr'
        ? `${stockoutRisk} SKU stockout riskinde (days of supply < lead time). Öncelikli: ${riskiestSku.name} (${riskiestSku.daysOfSupply} ${dl} kaldı).`
        : `${stockoutRisk} SKUs at stockout risk (days of supply < lead time). Top priority: ${riskiestSku.name} (${riskiestSku.daysOfSupply} ${dl} left).`,
    },
    { // 3 — Borçluluk
      level: overduePct > 8 ? 'critical' : overduePct >= 5 ? 'warning' : 'watch',
      repKey: REP_PAYABLES,
      text: lang === 'tr'
        ? `Gecikmiş borç ${fmtCompactTRY(overdueAmt)} (toplamın %${fmtNumber(overduePct, 1)}'i); tedarik kesintisi riski. Ödeme planı gözden geçirilmeli.`
        : `Overdue payables ${fmtCompactTRY(overdueAmt)} (${fmtNumber(overduePct, 1)}% of total); supply disruption risk. Review the payment plan.`,
    },
    { // 4 — Maliyet
      level: cs.maverickSpend > 10 ? 'warning' : 'watch',
      repKey: REP_COST,
      text: lang === 'tr'
        ? `Serbest harcama (maverick) %${fmtNumber(cs.maverickSpend, 1)} (hedef <%10); açık döviz PO'larında ~${fmtCompactTRY(cs.fxImpact)} kur maliyeti birikti.`
        : `Maverick spend is ${fmtNumber(cs.maverickSpend, 1)}% (target <10%); open FX POs have accrued ~${fmtCompactTRY(cs.fxImpact)} of FX cost.`,
    },
    { // 5 — Fiyatlama
      level: slaCompliance < 70 ? 'warning' : 'watch',
      repKey: REP_PRICING,
      text: lang === 'tr'
        ? `Fiyatlama SLA uyumu %${fmtNumber(slaCompliance, 1)} (hedef ≥%70); ${fmtNumber(pendingQuotes)} talep beklemede. Yığılma riski izlenmeli.`
        : `Pricing SLA compliance is ${fmtNumber(slaCompliance, 1)}% (target ≥70%); ${fmtNumber(pendingQuotes)} quotes pending. Watch for backlog.`,
    },
    { // 6 — Karlılık
      level: 'watch',
      repKey: REP_PROFIT,
      text: lang === 'tr'
        ? `${worstCat.category} kategorisinde brüt marj %${fmtNumber(worstCat.grossMargin, 1)} ile en düşük; kur/navlun kaynaklı SMM artışı marjı aşındırıyor.`
        : `${worstCat.category} has the lowest gross margin at ${fmtNumber(worstCat.grossMargin, 1)}%; FX/freight-driven COGS is eroding margin.`,
    },
    { // 7 — Operasyon
      level: 'watch',
      repKey: REP_OPS,
      text: lang === 'tr'
        ? `${fmtNumber(openCount)} açık talep işlemde; talep→sipariş dönüşümü %${fmtNumber(conversionRate, 1)}. Darboğaz aşamaları izlenmeli.`
        : `${fmtNumber(openCount)} open requests in progress; request→order conversion is ${fmtNumber(conversionRate, 1)}%. Monitor bottleneck stages.`,
    },
    { // 8 — Uzman
      level: worstOtif.otif < 85 ? 'warning' : 'watch',
      repKey: REP_BUYER,
      text: lang === 'tr'
        ? `İş yükü ${busiest.name} uzmanında yoğunlaşıyor; ekip zamanında tamamlama %${fmtNumber(teamOnTime, 1)}. Yük dengelenmesi değerlendirilebilir.`
        : `Workload is concentrated on ${busiest.name}; team on-time completion is ${fmtNumber(teamOnTime, 1)}%. Consider rebalancing.`,
    },
  ];
  const severityRank: Record<AlertLevel, number> = { critical: 0, warning: 1, watch: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => severityRank[a.level] - severityRank[b.level]).slice(0, 8);
  const levelIcon: Record<AlertLevel, string> = { critical: '🔴', warning: '🟠', watch: '🔵' };
  const levelClr: Record<AlertLevel, string> = { critical: t.rd, warning: t.am, watch: t.c1 };
  const levelLabel: Record<AlertLevel, string> = { critical: tp('exec.critical'), warning: tp('exec.warning'), watch: tp('exec.watch') };

  return (
    <>
      {/* ── KPI BANDI (12 roll-up) ────────────────────────────────────────────── */}
      <SectionHeader title={tp('exec.overview')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KPICard key={k.id} id={k.id} title={k.title} value={k.value} trendValue={k.trend} sparkTrend={k.st} color={k.color} unit={k.unit} {...kp} />
        ))}
      </div>

      {/* ── SAĞLIK SKORU + UYARI LİSTESİ ──────────────────────────────────────── */}
      <SectionHeader title={tp('sections.procurementHealthScore')} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 12, marginBottom: 16 }}>
        {/* Health score gauge + bileşen kırılımı */}
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <HealthScore score={health} t={t} l={l} />
            <div>
              <div style={{ fontSize: 12, color: t.tx2, marginBottom: 4 }}>{tp('exec.grade')}</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: gradeClr, letterSpacing: -1, lineHeight: 1 }}>{grade}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.tx2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tp('exec.scoreBreakdown')}</div>
          {comps.map((c) => (
            <div key={c.key} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11.5, color: t.tx2 }}>{tp(`exec.comp.${c.key}`)}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: scoreClr(c.score) }}>{c.score}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: t.bg3, overflow: 'hidden' }}>
                <div style={{ width: `${c.score}%`, height: '100%', borderRadius: 3, background: scoreClr(c.score) }} />
              </div>
              <div style={{ fontSize: 9.5, color: t.tx3, marginTop: 1 }}>{lang === 'tr' ? 'ağırlık' : 'weight'} %{c.weight}</div>
            </div>
          ))}
          <div style={{ fontSize: 10.5, color: t.tx3, fontStyle: 'italic', marginTop: 10, lineHeight: 1.4 }}>{tp('exec.rollupNote')}</div>
        </div>

        {/* Öncelikli uyarılar (8 alt sayfa, drill-down linkli) */}
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 12 }}>{tp('exec.topAlerts')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {sortedAlerts.map((a, i) => (
              <div key={i} style={{ border: `1px solid ${t.bd}`, borderLeft: `3px solid ${levelClr[a.level]}`, borderRadius: 9, padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{levelIcon[a.level]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: levelClr[a.level], background: `${levelClr[a.level]}1F`, borderRadius: 5, padding: '2px 8px' }}>{levelLabel[a.level]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.tx2, lineHeight: 1.5, marginBottom: 6 }}>{a.text}</div>
                  <button
                    onClick={() => onSelectRep?.(a.repKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.pr, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {tp('exec.viewDetail')}<Icon name="chevRight" size={11} color={t.pr} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HARCAMA & TASARRUF TRENDİ + TEDARİKÇİ RİSK MİNİ-SCATTER ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={tp('exec.spendSavingsTrend')} id="exec-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend} margin={{ top: 15, right: 12, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="exec-spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.pr} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={t.pr} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="exec-save" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.gn} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={t.gn} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtMonth} formatter={(v: number, n: string) => [fmtCompactTRY(v), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="spend" name={tp('exec.spend')} stroke={t.pr} strokeWidth={2.5} fill="url(#exec-spend)" />
              <Area type="monotone" dataKey="savings" name={tp('exec.savings')} stroke={t.gn} strokeWidth={2.5} fill="url(#exec-save)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={tp('exec.supplierRiskMini')} id="exec-risk" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="spend" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${fmtNumber(v / 1000, 1)}M`} />
              <YAxis type="number" dataKey="y" name="risk" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[0, 50]} />
              <ZAxis type="number" dataKey="z" range={[60, 420]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { x: number; y: number; z: number; name: string };
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: t.tx, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ color: t.tx2 }}>{tp('cols.spend')}: {fmtCompactTRY(d.x * 1000)}</div>
                      <div style={{ color: t.tx2 }}>Risk: {d.y}</div>
                      <div style={{ color: t.tx2 }}>{tp('kpi.leadTime')}: {d.z} {dl}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill={t.pr} fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── NAKİT ÇIKIŞ 30/60/90 MİNİ-BAR ─────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <ChartContainer t={t} l={l} title={tp('exec.cashProjection')} id="exec-cash" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashData} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompactTRY(v)} />
              <Tooltip cursor={{ fill: t.hoverBg }} contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmtCompactTRY(v), tp('pay.kpi.cashOutflow30')]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={90}>
                {cashData.map((_, i) => <Cell key={i} fill={cashColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
};

export default ExecutiveSummary;
