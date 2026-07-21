import { useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
} from 'recharts';
import type { CashPeriodMode, CashCell, CashSource } from '../../../types/cashflow';
import { buildGrid, applyScenario, variance, gridForecastActual, addDays } from '../../../lib/finance/cashflowEngine';
import { getScheduledOutflows } from '../../../lib/finance/cashflowFeed';
import { REF_DATE, totalPosition, openingBalance, scenarios, bankAccounts } from '../../../constants/cashflowData';
import { ReportPageLayout, KPIBand, KPICard, ChartCard, Dropdown, Waterfall, AIAlertPanel, StatusBadge, RecurringModal, OccurrenceDialog, type FinAlert } from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import { useRecurring } from '../../../context/RecurringContext';
import type { RecurringSeries } from '../../../types/recurring';
import type { Theme } from '../../../types';
import type { FinancePageProps } from '../_Placeholder';

// Recurring kategori → nakit akışı grid satırı eşlemesi
const RECUR_TO_GRID: Record<string, string> = {
  'Kira': 'kira', 'Yazılım/SaaS': 'yazilim', 'Personel/Maaş': 'yonetim', 'Tedarikçi': 'tedarikci',
  'Pazarlama': 'pazarlama', 'Lojistik': 'lojistik', 'Vergi': 'yapVergi', 'Kredi taksiti': 'kredi', 'Çek': 'cek', 'Diğer': 'diger',
};

const shown = (c: CashCell) => (c.isForecast ? c.amount : (c.actual ?? c.amount));
const SRC_COLOR = (s: CashSource, t: Theme) => (s === 'ERP' ? t.gn : s === 'Paraşüt' ? t.tx2 : s === 'Manuel' ? t.am : s === 'Hesaplanan' ? t.pr : t.pu);

export const CashFlowOps = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const [mode, setMode] = useState<CashPeriodMode>('weekly');
  const [scenKey, setScenKey] = useState<'base' | 'best' | 'worst'>('base');
  const [currency, setCurrency] = useState<'TRY' | 'USD'>('TRY');
  const [drill, setDrill] = useState<{ ci: number; x: number; y: number } | null>(null);
  const [safetyNet, setSafetyNet] = useState(0); // TRY min bakiye eşiği
  const [recModal, setRecModal] = useState<{ tip: 'Gider' | 'Gelir'; date?: string } | null>(null);
  const [occDlg, setOccDlg] = useState<{ series: RecurringSeries; recurrenceId: string; mode: 'edit' | 'cancel' | 'paid'; defaultTutar?: number; defaultTarih?: string } | null>(null);
  const rec = useRecurring();

  const scen = scenarios.find((s) => s.key === scenKey)!;
  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (v: number) => (currency === 'USD' ? v / 44.9 : v);
  const fmt = (v: number) => { const c = conv(v); const a = Math.abs(c); const s = a >= 1e6 ? (c / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (c / 1e3).toFixed(0) + 'K' : Math.round(c).toString(); return `${sym}${s}`; };
  const fmtDisp = (c: number) => { const a = Math.abs(c); const s = a >= 1e6 ? (c / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (c / 1e3).toFixed(0) + 'K' : Math.round(c).toString(); return `${sym}${s}`; }; // zaten dönüştürülmüş değer
  const colLabel = (d: string) => (mode === 'monthly' ? d : `${d.slice(8, 10)}.${d.slice(5, 7)}`);

  const range = useMemo(() => (
    mode === 'daily' ? { from: addDays(REF_DATE, -14), to: addDays(REF_DATE, 45) }
      : mode === 'weekly' ? { from: addDays(REF_DATE, -28), to: addDays(REF_DATE, 91) }
        : { from: addDays(REF_DATE, -59), to: addDays(REF_DATE, 120) }
  ), [mode]);

  // Recurring feed → grid'e eklenecek dış akışlar (tek kaynak: RecurringContext).
  // Planlı → forecast (amount); ödenmiş (paid) → planlı tarihte forecast + gerçekleşen tarihte actual → variance.
  const extraAll = useMemo(() => {
    const occ = rec.occurrences({ from: addDays(REF_DATE, -60), to: addDays(REF_DATE, 140) });
    const toTRY = (v: number, cur: string) => (cur === 'USD' ? v * 44.9 : v);
    const flows: { date: string; gridKey: string; amount: number; actual?: number }[] = [];
    for (const o of occ) {
      if (o.durum === 'cancelled' || o.durum === 'skipped') continue;
      const gridKey = o.tip === 'Gelir' ? 'muhikuKurumsal' : (RECUR_TO_GRID[o.kategori] ?? 'diger');
      if (o.durum === 'paid') {
        flows.push({ date: o.tarih, gridKey, amount: toTRY(o.tutar, o.paraBirimi) });
        flows.push({ date: o.gerceklesenTarih ?? o.tarih, gridKey, amount: 0, actual: toTRY(o.gerceklesenTutar ?? o.tutar, o.paraBirimi) });
      } else {
        flows.push({ date: o.tarih, gridKey, amount: toTRY(o.tutar, o.paraBirimi) });
      }
    }
    return flows;
  }, [rec]);

  const grid = useMemo(() => applyScenario(buildGrid(mode, range, openingBalance, extraAll), scen), [mode, range, scen, extraAll]);

  // ── KPI'lar (seçili senaryo altında) ──
  const kpi = useMemo(() => {
    const fwd = applyScenario(buildGrid('daily', { from: REF_DATE, to: addDays(REF_DATE, 90) }, openingBalance, extraAll), scen);
    const endBal = fwd.balance[fwd.balance.length - 1];
    const monthlyBurn = (openingBalance - endBal) / 3; // + = yakım
    const runway = monthlyBurn > 0 ? openingBalance / monthlyBurn : Infinity;
    const g13 = applyScenario(buildGrid('weekly', { from: REF_DATE, to: addDays(REF_DATE, 13 * 7) }, openingBalance, extraAll), scen);
    const bal13 = g13.balance.slice(0, 13);
    const r13End = bal13[bal13.length - 1] ?? endBal;
    const minBal = Math.min(...bal13);
    const past = buildGrid('weekly', { from: addDays(REF_DATE, -42), to: addDays(REF_DATE, -1) }, openingBalance, extraAll);
    const fa = gridForecastActual(past, 'outflow');
    const v = variance(fa.forecast, fa.actual);
    const varLast = v.length ? v[v.length - 1].cumVariancePct : 0;
    const firstF = grid.isForecast.indexOf(true);
    const netDonem = firstF >= 0 ? grid.net[firstF] : (grid.net[0] ?? 0);
    return { monthlyBurn, runway, r13End, minBal, varLast, netDonem };
  }, [scen, grid, extraAll]);

  // ── 13-haftalık rolling forecast (senaryo bazında) ──
  const CONF_WEEKS = 4; // ilk 4 hafta yüksek güven, sonrası yönsel
  const roll = useMemo(() => {
    const wk = (key: 'base' | 'best' | 'worst') => applyScenario(buildGrid('weekly', { from: REF_DATE, to: addDays(REF_DATE, 13 * 7) }, openingBalance, extraAll), scenarios.find((s) => s.key === key)!);
    const gb = wk('base'), gbest = wk('best'), gworst = wk('worst');
    const n = Math.min(13, gb.dates.length);
    const rows = Array.from({ length: n }, (_, i) => ({
      week: `H${i + 1}`,
      giris: conv(gb.totalIncome[i]),
      cikis: -conv(gb.totalExpense[i]),
      balBase: conv(gb.balance[i]), balBest: conv(gbest.balance[i]), balWorst: conv(gworst.balance[i]),
    }));
    const critIdx = Array.from({ length: n }, (_, i) => gworst.balance[i]).findIndex((b) => b < safetyNet);
    return { rows, critWeek: critIdx >= 0 ? `H${critIdx + 1}` : null };
  }, [scen, currency, safetyNet, extraAll]);

  // ── B3 grafik verileri (para-birimi bağımsız ham) ──
  const b3 = useMemo(() => {
    const fwd = buildGrid('daily', { from: REF_DATE, to: addDays(REF_DATE, 90) }, openingBalance, extraAll);
    const w = buildGrid('weekly', { from: REF_DATE, to: addDays(REF_DATE, 90) }, openingBalance, extraAll);
    const past = buildGrid('weekly', { from: addDays(REF_DATE, -42), to: addDays(REF_DATE, -1) }, openingBalance, extraAll);
    const m = buildGrid('monthly', { from: addDays(REF_DATE, -60), to: addDays(REF_DATE, 120) }, openingBalance, extraAll);
    const fa = gridForecastActual(past, 'outflow');
    const v = variance(fa.forecast, fa.actual);
    const cek3w = getScheduledOutflows({ from: REF_DATE, to: addDays(REF_DATE, 21) }).filter((o) => o.kategori === 'Çek').reduce((s, o) => s + o.tutar, 0);
    return { fwd, w, past, m, v, cek3w };
  }, [extraAll]);

  const shownV = shown;
  const sumExp = (key: string) => b3.fwd.expense.find((r) => r.line.key === key)?.cells.reduce((s, c) => s + shownV(c), 0) ?? 0;
  const inflow90 = b3.fwd.totalIncome.reduce((a, b) => a + b, 0);
  const exp90 = b3.fwd.totalExpense.reduce((a, b) => a + b, 0);
  const namedExp = ['tedarikci', 'cek', 'kredi', 'kira', 'yapVergi'].reduce((s, k) => s + sumExp(k), 0);
  const bridge = [
    { label: L('Açılış', 'Opening'), value: conv(openingBalance), isTotal: true },
    { label: L('+Tahsilat', '+Receipts'), value: conv(inflow90), isTotal: false },
    { label: L('−Tedarikçi', '−Suppliers'), value: -conv(sumExp('tedarikci')), isTotal: false },
    { label: L('−Çek', '−Cheque'), value: -conv(sumExp('cek')), isTotal: false },
    { label: L('−Kredi', '−Loan'), value: -conv(sumExp('kredi')), isTotal: false },
    { label: L('−Kira', '−Rent'), value: -conv(sumExp('kira')), isTotal: false },
    { label: L('−Vergi', '−Tax'), value: -conv(sumExp('yapVergi')), isTotal: false },
    { label: L('−Diğer', '−Other'), value: -conv(exp90 - namedExp), isTotal: false },
    { label: L('Kapanış', 'Closing'), value: conv(b3.fwd.balance[b3.fwd.balance.length - 1]), isTotal: true },
  ];

  const PAL = [t.pr, t.tl, t.am, t.gn, t.pu, t.co, t.c1, t.c2, t.c3, t.rd, t.bdH];
  const catKeys = b3.w.expense.map((r) => ({ key: r.line.key, label: r.line.label[en ? 'en' : 'tr'] }));
  const catData = b3.w.dates.map((_, bi) => { const o: Record<string, number | string> = { week: `H${bi + 1}` }; b3.w.expense.forEach((r) => { o[r.line.key] = conv(shownV(r.cells[bi])); }); return o; });
  const bankData = bankAccounts.map((a) => ({ name: a.banka, value: conv(a.bakiyeTRY), durum: a.durum }));
  const varData = b3.v.map((r) => ({ week: r.label, sapma: +(r.variancePct * 100).toFixed(1), breach: !r.withinBand }));
  const usdData = b3.m.dates.map((d, bi) => ({ ay: d, tryTutar: b3.m.totalExpense[bi], usd: b3.m.totalExpense[bi] / 44.9 }));

  // ── AI uyarıları (eşik-tabanlı) ──
  const idle = [...bankAccounts].filter((a) => a.durum === 'Aktif').sort((a, b) => b.bakiyeTRY - a.bakiyeTRY)[0];
  const alerts: FinAlert[] = [];
  if (kpi.minBal < 0) alerts.push({ severity: 'critical', text: L(`${roll.critWeek ?? '13. hafta'} projekte bakiyesi ${fmt(kpi.minBal)}'ye düşüyor: kredi taksiti ile büyük tedarikçi/çek ödemesi aynı haftaya denk geliyor. Öneri: ödemeyi sonraki haftaya kaydır veya atıl bakiyeden aktar.`, `${roll.critWeek ?? 'Week 13'} projected balance drops to ${fmt(kpi.minBal)}: a loan installment coincides with a large supplier/cheque payment. Suggestion: shift the payment a week or transfer from an idle account.`) });
  alerts.push({ severity: 'warning', text: L('Yazılım/SaaS gideri USD/TRY kaynaklı bu ay ~%8 arttı — 12 aboneliğin 5’i USD; bütçe sapması izlenmeli.', 'Software/SaaS cost rose ~8% this month on USD/TRY — 5 of 12 subscriptions are USD; watch the budget variance.') });
  if (idle && idle.bakiyeTRY > 3_000_000) alerts.push({ severity: 'watch', text: L(`${idle.banka} hesabında ${fmt(idle.bakiyeTRY)} atıl duruyor; önümüzdeki 3 haftada çıkış planı yok — kısa vadeli değerlendirilebilir.`, `${idle.banka} holds ${fmt(idle.bakiyeTRY)} idle with no outflow planned in the next 3 weeks — consider short-term placement.`) });
  if (Math.abs(kpi.varLast) <= 0.05) alerts.push({ severity: 'good', text: L(`Bu hafta forecast varyansı %${(kpi.varLast * 100).toFixed(1)} içinde — tahmin kalitesi hedef bandında (30 günde ±%5).`, `This week's forecast variance is ${(kpi.varLast * 100).toFixed(1)}% — within the target band (±5% at 30 days).`) });
  else alerts.push({ severity: 'warning', text: L(`Forecast varyansı %${(kpi.varLast * 100).toFixed(1)} — hedef bandı aşıldı; tahmin varsayımları gözden geçirilmeli.`, `Forecast variance ${(kpi.varLast * 100).toFixed(1)}% — outside the target band; review forecast assumptions.`) });
  if (b3.cek3w > 0) alerts.push({ severity: 'tip', text: L(`Vadesi 3 hafta içindeki ${fmt(b3.cek3w)} çek portföyünü tahsilat takvimiyle eşleştir; çek çıkışları ilerleyen haftalarda yoğunlaşıyor.`, `Match the ${fmt(b3.cek3w)} cheque portfolio due within 3 weeks against the collection calendar; cheque outflows cluster in later weeks.`) });

  // ── satır tanımları (render sırası) ──
  type RRow = { kind: 'section' | 'line' | 'total' | 'net' | 'balance'; label: string; source?: CashSource; values: number[]; };
  const rrows: RRow[] = [];
  rrows.push({ kind: 'section', label: L('GELİRLER', 'INCOME'), values: [] });
  grid.income.forEach((r) => rrows.push({ kind: 'line', label: r.line.label[en ? 'en' : 'tr'], source: r.line.source, values: r.cells.map(shown) }));
  rrows.push({ kind: 'total', label: L('Toplam Gelirler', 'Total Income'), values: grid.totalIncome });
  rrows.push({ kind: 'section', label: L('ÖDEMELER', 'PAYMENTS'), values: [] });
  grid.expense.forEach((r) => rrows.push({ kind: 'line', label: r.line.label[en ? 'en' : 'tr'], source: r.line.source, values: r.cells.map(shown) }));
  rrows.push({ kind: 'total', label: L('Toplam Giderler', 'Total Expenses'), values: grid.totalExpense });
  rrows.push({ kind: 'net', label: L('Net Nakit Akışı', 'Net Cash Flow'), values: grid.net });
  rrows.push({ kind: 'balance', label: L('Bakiye', 'Balance'), values: grid.balance });

  const exportCSV = () => {
    const head = [L('Satır', 'Row'), ...grid.dates].join(';');
    const body = rrows.filter((r) => r.kind !== 'section').map((r) => [r.label, ...r.values.map((v) => Math.round(conv(v)))].join(';'));
    const blob = new Blob(['﻿' + head + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `nakit-akisi-${mode}-${scenKey}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  // sticky ilk kolon + hücre stilleri
  const cell = (v: number, forecast: boolean, opts?: { bold?: boolean; balance?: boolean }): CSSProperties => ({
    padding: '6px 10px', fontSize: 11.5, textAlign: 'right', whiteSpace: 'nowrap',
    borderBottom: `1px solid ${t.bd}`, borderLeft: forecast ? `1px dashed ${t.bd}` : 'none',
    color: opts?.balance && v < 0 ? t.rd : forecast ? t.tx3 : t.tx,
    fontWeight: opts?.bold || (opts?.balance && v < 0) ? 700 : 400,
    background: opts?.balance && v < 0 ? t.rdL : 'transparent',
    fontStyle: forecast ? 'italic' : 'normal', cursor: 'pointer',
  });
  const firstColBase: CSSProperties = { position: 'sticky', left: 0, zIndex: 2, background: t.cd, borderBottom: `1px solid ${t.bd}`, padding: '6px 12px', whiteSpace: 'nowrap', minWidth: 220 };

  const addBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-end' };
  const controls = (
    <>
      <button onClick={() => setRecModal({ tip: 'Gider' })} style={addBtn}><Icon name="plus" size={12} color={t.tx2} /> {L('Harcama Ekle', 'Add Expense')}</button>
      <button onClick={() => setRecModal({ tip: 'Gelir' })} style={addBtn}><Icon name="plus" size={12} color={t.tx2} /> {L('Tahsilat Ekle', 'Add Income')}</button>
      <Dropdown t={t} label={L('Dönem', 'Period')} value={mode} onChange={(v) => setMode(v)} width={130}
        options={[{ value: 'daily', label: L('Günlük', 'Daily') }, { value: 'weekly', label: L('Haftalık', 'Weekly') }, { value: 'monthly', label: L('Aylık', 'Monthly') }]} />
      <Dropdown t={t} label={L('Senaryo', 'Scenario')} value={scenKey} onChange={(v) => setScenKey(v)} width={130}
        options={scenarios.map((s) => ({ value: s.key, label: s.label[en ? 'en' : 'tr'] }))} />
    </>
  );

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin10}
      subtitle={L('Operasyonel nakit yönetimi ve 13-haftalık tahmin. Oran/likidite analizi için → Nakit & Likidite.', 'Operational cash management and 13-week forecast. For ratio/liquidity analysis → Cash & Liquidity.')}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: L('Oran/likidite analizi: Nakit & Likidite →', 'Ratio/liquidity analysis: Cash & Liquidity →'), onClick: () => onSelectRep?.('muhasebe__1') }}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Bugünkü Nakit Pozisyonu', 'Cash Position Today')} value={fmt(totalPosition)} goodDir="up" hint={L('tüm banka bakiyeleri', 'all bank balances')} />
        <KPICard t={t} lang={lang} title={L('Net Nakit Akışı (dönem)', 'Net Cash Flow (period)')} value={fmt(kpi.netDonem)} goodDir="up" sparkColor={kpi.netDonem >= 0 ? t.gn : t.rd} />
        <KPICard t={t} lang={lang} title={L('Aylık Cash Burn', 'Monthly Cash Burn')} value={fmt(kpi.monthlyBurn)} goodDir="down" hint={kpi.monthlyBurn <= 0 ? L('nakit üretiyor', 'cash-generating') : ''} />
        <KPICard t={t} lang={lang} title={L('Runway (ay)', 'Runway (mo)')} value={kpi.runway === Infinity ? '∞' : kpi.runway.toFixed(1)} goodDir="up" />
        <KPICard t={t} lang={lang} title={L('13-hafta sonu bakiye', '13-week end balance')} value={fmt(kpi.r13End)} goodDir="up" sparkColor={kpi.r13End >= 0 ? t.gn : t.rd} />
        <KPICard t={t} lang={lang} title={L('Varyans % (kümülatif)', 'Variance % (cum.)')} value={`${(kpi.varLast * 100).toFixed(1)}%`} goodDir="down" hint={L('30g ±%5 · 90g ±%15', '30d ±5% · 90d ±15%')} />
        <KPICard t={t} lang={lang} title={L('En düşük 13-hafta bakiye', 'Min 13-week balance')} value={fmt(kpi.minBal)} goodDir="up" sparkColor={kpi.minBal < 0 ? t.rd : t.gn} hint={kpi.minBal < 0 ? '🔴' : ''} />
      </KPIBand>

      {/* 13-haftalık rolling forecast + senaryo */}
      <div style={{ marginTop: 18 }}>
        <ChartCard t={t} lang={lang} title={L('13-Haftalık Rolling Forecast', '13-Week Rolling Forecast')}
          right={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 11, color: t.tx3 }}>{L('Safety-net eşiği', 'Safety net')}</span>
              <input type="number" value={safetyNet} onChange={(e) => setSafetyNet(Number(e.target.value) || 0)} style={{ width: 110, padding: '5px 8px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12 }} />
            </div>
          )}
          why={L('2024 AFP Liquidity Survey: hazinecilerin %71’i 13-haftalık rolling forecast kullanır (her hafta kapanınca kaydırılır); Float/Agicap 13-hafta + senaryo + safety-net eşiği.', '2024 AFP Liquidity Survey: 71% of treasurers run a rolling 13-week forecast; Float/Agicap 13-week + scenario + safety-net threshold.')}>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={roll.rows} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtDisp} width={52} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtDisp} width={52} />
              {/* Güven bandı: ilk 4 hafta kesin, sonrası yönsel */}
              {roll.rows.length > CONF_WEEKS && (
                <ReferenceArea yAxisId="r" x1={`H${CONF_WEEKS + 1}`} x2={roll.rows[roll.rows.length - 1].week} fill={t.tx3} fillOpacity={0.07}
                  label={{ value: L('yönsel', 'directional'), position: 'insideTop', fontSize: 10, fill: t.tx3 }} />
              )}
              <ReferenceLine yAxisId="r" y={conv(safetyNet)} stroke={t.rd} strokeDasharray="5 3" label={{ value: `${L('Safety-net', 'Safety net')} ${fmtDisp(conv(safetyNet))}`, position: 'insideBottomRight', fontSize: 10, fill: t.rd }} />
              {roll.critWeek && (
                <ReferenceLine yAxisId="r" x={roll.critWeek} stroke={t.rd} strokeWidth={1.5} label={{ value: `⚠ ${L('kritik hafta', 'critical week')}`, position: 'top', fontSize: 10, fill: t.rd }} />
              )}
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtDisp(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="giris" name={L('Giriş', 'Inflow')} fill={t.gn} radius={[3, 3, 0, 0]} barSize={12} />
              <Bar yAxisId="l" dataKey="cikis" name={L('Çıkış', 'Outflow')} fill={t.rd} radius={[0, 0, 3, 3]} barSize={12}>
                {roll.rows.map((_, i) => <Cell key={i} fill={t.rd} />)}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="balBase" name={L('Bakiye (Baz)', 'Balance (Base)')} stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
              <Line yAxisId="r" type="monotone" dataKey="balBest" name={L('İyimser', 'Best')} stroke={t.gn} strokeWidth={1.8} strokeDasharray="6 3" dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="balWorst" name={L('Kötümser', 'Worst')} stroke={t.rd} strokeWidth={1.8} strokeDasharray="6 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Cash bridge + Kategori kırılımı */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={44} title={L('Nakit Köprüsü (90 gün)', 'Cash Bridge (90d)')}
          why={L('Agicap cash-bridge deseni: açılış → tahsilat → çıkışlar → kapanış.', 'Agicap cash-bridge pattern: opening → receipts → outflows → closing.')}>
          <Waterfall steps={bridge} t={t} fmt={fmtDisp} height={230} />
        </ChartCard>
        <ChartCard t={t} lang={lang} span={52} title={L('Kategori Kırılımı (haftalık)', 'Category Breakdown (weekly)')}
          why={L('Ödeme kategorilerinin zaman içindeki dağılımı (stacked).', 'Payment categories over time (stacked).')}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={catData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtDisp} width={48} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtDisp(v)} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              {catKeys.map((c, i) => <Bar key={c.key} dataKey={c.key} name={c.label} stackId="e" fill={PAL[i % PAL.length]} />)}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Banka pozisyonu + Varyans */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={44} title={L('Banka Bazlı Nakit Pozisyonu', 'Cash Position by Bank')}
          why={L('Agicap multi-bank konsolide pozisyon; döviz hesaplar TRY karşılığıyla.', 'Agicap multi-bank consolidated position; FX accounts in TRY-equivalent.')}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={bankData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={44} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtDisp} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtDisp(v)} />
              <Bar dataKey="value" name={L('Bakiye', 'Balance')} radius={[3, 3, 0, 0]} barSize={38}>
                {bankData.map((b, i) => <Cell key={i} fill={b.durum === 'Bloke' ? t.tx3 : t.pr} />)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={52} title={L('Forecast vs Actual Varyans', 'Forecast vs Actual Variance')}
          why={L('Agicap/CashAnalytics variance analizi; hedef bandı ±%5 (30g) / ±%15 (90g).', 'Agicap/CashAnalytics variance analysis; target band ±5% (30d) / ±15% (90d).')}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={varData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={5} stroke={t.am} strokeDasharray="4 3" /><ReferenceLine y={-5} stroke={t.am} strokeDasharray="4 3" />
              <ReferenceLine y={15} stroke={t.rd} strokeDasharray="4 3" /><ReferenceLine y={-15} stroke={t.rd} strokeDasharray="4 3" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="sapma" name={L('Sapma %', 'Variance %')} radius={[3, 3, 0, 0]} barSize={26}>
                {varData.map((d, i) => <Cell key={i} fill={d.breach ? t.rd : t.gn} />)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* USD/TRY köprüsü */}
      <div style={{ marginTop: 14 }}>
        <ChartCard t={t} lang={lang} title={L('USD/TRY Köprüsü (aylık ödeme)', 'USD/TRY Bridge (monthly payments)')}
          why={L('Aylık TRY tutar + USD karşılığı (mevcut USD-TRY sheet mantığı).', 'Monthly TRY amount + USD equivalent (existing USD-TRY sheet logic).')}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={usdData} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="ay" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${Math.round(v / 1e6)}M`} width={48} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1e3)}K`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'usd' ? `$${Math.round(v).toLocaleString('en-US')}` : `₺${Math.round(v).toLocaleString('tr-TR')}`)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="tryTutar" name={L('Aylık Ödeme (TRY)', 'Monthly Payment (TRY)')} fill={t.pr} radius={[3, 3, 0, 0]} barSize={22} />
              <Line yAxisId="r" type="monotone" dataKey="usd" name={L('USD Karşılığı', 'USD Equivalent')} stroke={t.tl} strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI paneli */}
      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('Nakit Akışı Uyarıları', 'Cash Flow Alerts')} />
      </div>

      {/* Grid */}
      <div style={{ marginTop: 18, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{L('Günlük Nakit Akışı', 'Daily Cash Flow')}</span>
          <span style={{ fontSize: 10.5, color: t.tx3 }}>{L('kesikli/italik = tahmin · dolu = gerçekleşen', 'dashed/italic = forecast · solid = actual')}</span>
          <div style={{ flex: 1 }} />
          <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Icon name="download" size={13} color={t.tx2} /> CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...firstColBase, textAlign: 'left', fontSize: 10.5, color: t.tx3, textTransform: 'uppercase', zIndex: 3 }}>{L('Kalem', 'Line')}</th>
                {grid.dates.map((d, ci) => (
                  <th key={ci} style={{ padding: '7px 10px', fontSize: 10.5, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.bd}`, color: grid.isForecast[ci] ? t.tx3 : t.tx2, borderLeft: grid.isForecast[ci] && !grid.isForecast[ci - 1] ? `2px solid ${t.pr}` : 'none' }}>
                    {colLabel(d)}{grid.isForecast[ci] ? ' ·' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rrows.map((r, ri) => {
                if (r.kind === 'section') {
                  return (
                    <tr key={ri}>
                      <td colSpan={grid.dates.length + 1} style={{ position: 'sticky', left: 0, background: t.bg2, padding: '6px 12px', fontSize: 10.5, fontWeight: 700, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${t.bd}` }}>{r.label}</td>
                    </tr>
                  );
                }
                const bold = r.kind === 'total' || r.kind === 'net' || r.kind === 'balance';
                const rowBg = r.kind === 'net' ? t.bg2 : r.kind === 'balance' ? t.bg3 : 'transparent';
                return (
                  <tr key={ri}>
                    <td style={{ ...firstColBase, background: rowBg === 'transparent' ? t.cd : rowBg, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: t.tx }}>{r.label}</span>
                      {r.source && <span style={{ fontSize: 9, fontWeight: 600, color: SRC_COLOR(r.source, t), border: `1px solid ${SRC_COLOR(r.source, t)}33`, borderRadius: 5, padding: '1px 5px' }}>{r.source}</span>}
                    </td>
                    {r.values.map((v, ci) => (
                      <td key={ci} onClick={(e) => setDrill({ ci, x: (e.currentTarget as HTMLElement).getBoundingClientRect().left, y: (e.currentTarget as HTMLElement).getBoundingClientRect().bottom })}
                        style={{ ...cell(v, grid.isForecast[ci], { bold, balance: r.kind === 'balance' }), background: r.kind === 'balance' && v < 0 ? t.rdL : rowBg === 'transparent' ? undefined : rowBg }}>
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banka Hesapları */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Banka Hesapları', 'Bank Accounts')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[L('Hesap', 'Account')].map((h) => <th key={h} style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'left', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</th>)}
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'center', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Para Birimi', 'Currency')}</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Bakiye (TRY)', 'Balance (TRY)')}</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Bakiye (Orijinal)', 'Balance (Original)')}</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'center', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Son Hareket', 'Last Tx')}</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'center', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Durum', 'Status')}</th>
              <th style={{ fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'center', padding: '8px 12px', textTransform: 'uppercase' }}>{L('Aksiyon', 'Action')}</th>
            </tr></thead>
            <tbody>
              {bankAccounts.map((a) => {
                const cd: CSSProperties = { fontSize: 12, color: t.tx, padding: '8px 12px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
                return (
                  <tr key={a.id}>
                    <td style={{ ...cd, fontWeight: 500 }}>{a.ad}</td>
                    <td style={{ ...cd, textAlign: 'center', color: t.tx2 }}>{a.paraBirimi}</td>
                    <td style={{ ...cd, textAlign: 'right', fontWeight: 600 }}>{`₺${(a.bakiyeTRY / 1e6).toFixed(2)}M`}</td>
                    <td style={{ ...cd, textAlign: 'right', color: t.tx2 }}>{a.bakiyeOrijinal != null ? `${a.paraBirimi === 'USD' ? '$' : a.paraBirimi === 'EUR' ? '€' : '₺'}${a.bakiyeOrijinal.toLocaleString('en-US')}` : '—'}</td>
                    <td style={{ ...cd, textAlign: 'center', color: t.tx3, fontSize: 11.5 }}>{a.sonHareket}</td>
                    <td style={{ ...cd, textAlign: 'center' }}><StatusBadge t={t} tone={a.durum === 'Aktif' ? 'green' : 'red'} label={a.durum === 'Aktif' ? L('Aktif', 'Active') : L('Bloke', 'Blocked')} /></td>
                    <td style={{ ...cd, textAlign: 'center' }}>
                      <button title={L('Ekstre indir', 'Download statement')} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}><Icon name="download" size={12} /></button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ fontSize: 12, fontWeight: 700, color: t.tx, padding: '8px 12px', borderTop: `1px solid ${t.bd}` }}>{L('Toplam', 'Total')}</td>
                <td style={{ borderTop: `1px solid ${t.bd}` }} />
                <td style={{ fontSize: 12, fontWeight: 700, color: t.tx, textAlign: 'right', padding: '8px 12px', borderTop: `1px solid ${t.bd}` }}>{`₺${(totalPosition / 1e6).toFixed(2)}M`}</td>
                <td colSpan={4} style={{ borderTop: `1px solid ${t.bd}` }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Planlı İşlemler (Recurring) */}
      {(() => {
        const occs = rec.occurrences({ from: addDays(REF_DATE, -14), to: addDays(REF_DATE, 120) });
        const cd: CSSProperties = { fontSize: 12, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
        const th2: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textAlign: 'left', padding: '8px 10px', textTransform: 'uppercase' };
        const durTone = (d: string) => d === 'paid' ? { fg: t.gn, bg: t.gnL } : d === 'moved' ? { fg: t.pr, bg: t.prL } : d === 'cancelled' || d === 'skipped' ? { fg: t.rd, bg: t.rdL } : { fg: t.am, bg: t.amL };
        const durLbl = (d: string) => d === 'paid' ? L('Ödendi', 'Paid') : d === 'moved' ? L('Taşındı', 'Moved') : d === 'cancelled' ? L('İptal', 'Cancelled') : d === 'skipped' ? L('Atlandı', 'Skipped') : L('Planlı', 'Planned');
        return (
          <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              {L('Planlı İşlemler (Recurring)', 'Planned Transactions (Recurring)')}<span style={{ color: t.tx3, fontWeight: 400 }}>· {occs.length}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10.5, color: t.tx3 }}>{L('Kaynak: Manuel · tek kaynak (Finansal Veriler ile ortak)', 'Source: Manual · single store (shared with Financial Data)')}</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th2}>{L('Tarih', 'Date')}</th><th style={th2}>{L('Kategori', 'Category')}</th><th style={th2}>{L('İsim', 'Name')}</th>
                  <th style={{ ...th2, textAlign: 'center' }}>{L('Tip', 'Type')}</th><th style={{ ...th2, textAlign: 'right' }}>{L('Tutar', 'Amount')}</th>
                  <th style={{ ...th2, textAlign: 'center' }}>{L('Durum', 'Status')}</th><th style={{ ...th2, textAlign: 'center' }}>{L('Aksiyon', 'Action')}</th>
                </tr></thead>
                <tbody>
                  {occs.map((o) => {
                    const s = rec.series.find((x) => x.id === o.seriesId);
                    const tone = durTone(o.durum);
                    return (
                      <tr key={`${o.seriesId}-${o.recurrenceId}`}>
                        <td style={cd}>{o.tarih}{o.tarih !== o.recurrenceId ? <span style={{ color: t.tx3, fontSize: 10 }}> ({o.recurrenceId})</span> : null}</td>
                        <td style={{ ...cd, color: t.tx2 }}>{o.kategori}</td>
                        <td style={{ ...cd, fontWeight: 500 }}>{o.isim}</td>
                        <td style={{ ...cd, textAlign: 'center', color: o.tip === 'Gelir' ? t.gn : t.co }}>{o.tip}</td>
                        <td style={{ ...cd, textAlign: 'right', fontWeight: 600 }}>{o.paraBirimi === 'USD' ? `$${o.tutar.toLocaleString('en-US')}` : `₺${o.tutar.toLocaleString('tr-TR')}`}</td>
                        <td style={{ ...cd, textAlign: 'center' }}><span style={{ fontSize: 10.5, fontWeight: 600, color: tone.fg, background: tone.bg, borderRadius: 20, padding: '2px 9px' }}>{durLbl(o.durum)}</span></td>
                        <td style={{ ...cd, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {s && o.durum !== 'paid' && o.durum !== 'cancelled' && (
                            <span style={{ display: 'inline-flex', gap: 4 }}>
                              <button title={L('Taşı/Düzenle', 'Move/Edit')} onClick={() => setOccDlg({ series: s, recurrenceId: o.recurrenceId, mode: 'edit' })} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}><Icon name="calendar" size={12} /></button>
                              <button title={L('İptal', 'Cancel')} onClick={() => setOccDlg({ series: s, recurrenceId: o.recurrenceId, mode: 'cancel' })} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}><Icon name="x" size={12} /></button>
                              <button title={L('Ödendi işaretle', 'Mark paid')} onClick={() => setOccDlg({ series: s, recurrenceId: o.recurrenceId, mode: 'paid', defaultTutar: o.tutar, defaultTarih: o.tarih })} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.gn }}><Icon name="check" size={12} /></button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rec.log.length > 0 && (
              <div style={{ borderTop: `1px solid ${t.bd}`, padding: '8px 16px', fontSize: 10.5, color: t.tx3 }}>
                <b style={{ color: t.tx2 }}>{L('Son işlemler', 'Recent changes')}:</b>{' '}
                {rec.log.slice(0, 3).map((e) => `${e.action}${e.scope ? `(${e.scope})` : ''} · ${e.isim}`).join('  |  ')}
              </div>
            )}
          </div>
        );
      })()}

      {/* Drill-down popover */}
      {drill && createPortal(
        <>
          <div onClick={() => setDrill(null)} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
          <div style={{ position: 'fixed', left: Math.min(drill.x, window.innerWidth - 300), top: Math.min(drill.y + 4, window.innerHeight - 340), width: 288, maxHeight: 320, overflowY: 'auto', background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.22)', zIndex: 301, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: t.tx, marginBottom: 2 }}>{grid.dates[drill.ci]}{grid.isForecast[drill.ci] ? ` · ${L('tahmin', 'forecast')}` : ` · ${L('gerçekleşen', 'actual')}`}</div>
            <div style={{ fontSize: 10.5, color: t.tx3, marginBottom: 8 }}>{L('İşlem kırılımı', 'Transaction breakdown')}</div>
            {[...grid.income, ...grid.expense].filter((r) => shown(r.cells[drill.ci]) !== 0).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '3px 0', borderBottom: `1px solid ${t.bd}` }}>
                <span style={{ color: t.tx2 }}>{r.line.label[en ? 'en' : 'tr']}</span>
                <span style={{ color: r.line.direction === 'inflow' ? t.gn : t.tx, fontWeight: 500 }}>{r.line.direction === 'inflow' ? '+' : '−'}{fmt(shown(r.cells[drill.ci]))}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0 0', fontWeight: 700, color: t.tx }}>
              <span>{L('Net', 'Net')}</span><span style={{ color: grid.net[drill.ci] >= 0 ? t.gn : t.rd }}>{fmt(grid.net[drill.ci])}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0 0', fontWeight: 700, color: t.tx }}>
              <span>{L('Bakiye', 'Balance')}</span><span style={{ color: grid.balance[drill.ci] < 0 ? t.rd : t.tx }}>{fmt(grid.balance[drill.ci])}</span>
            </div>
            {(() => {
              const d = grid.dates[drill.ci]; const prefill = mode === 'monthly' ? `${d}-01` : d;
              return (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: `1px solid ${t.bd}`, paddingTop: 8 }}>
                  <button onClick={() => { setRecModal({ tip: 'Gider', date: prefill }); setDrill(null); }} style={{ flex: 1, padding: '6px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ {L('Harcama', 'Expense')}</button>
                  <button onClick={() => { setRecModal({ tip: 'Gelir', date: prefill }); setDrill(null); }} style={{ flex: 1, padding: '6px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ {L('Tahsilat', 'Income')}</button>
                </div>
              );
            })()}
          </div>
        </>,
        document.body,
      )}

      {recModal && <RecurringModal t={t} lang={lang} defaultTip={recModal.tip} prefillDate={recModal.date} onClose={() => setRecModal(null)} />}
      {occDlg && <OccurrenceDialog t={t} lang={lang} series={occDlg.series} recurrenceId={occDlg.recurrenceId} mode={occDlg.mode} defaultTutar={occDlg.defaultTutar} defaultTarih={occDlg.defaultTarih} onClose={() => setOccDlg(null)} />}
    </ReportPageLayout>
  );
};
