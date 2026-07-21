import { useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { CashPeriodMode, CashCell, CashSource } from '../../../types/cashflow';
import { buildGrid, applyScenario, variance, gridForecastActual, addDays } from '../../../lib/finance/cashflowEngine';
import { REF_DATE, totalPosition, openingBalance, scenarios } from '../../../constants/cashflowData';
import { ReportPageLayout, KPIBand, KPICard, Dropdown } from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { Theme } from '../../../types';
import type { FinancePageProps } from '../_Placeholder';

const shown = (c: CashCell) => (c.isForecast ? c.amount : (c.actual ?? c.amount));
const SRC_COLOR = (s: CashSource, t: Theme) => (s === 'ERP' ? t.gn : s === 'Paraşüt' ? t.tx2 : s === 'Manuel' ? t.am : s === 'Hesaplanan' ? t.pr : t.pu);

export const CashFlowOps = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const [mode, setMode] = useState<CashPeriodMode>('weekly');
  const [scenKey, setScenKey] = useState<'base' | 'best' | 'worst'>('base');
  const [currency, setCurrency] = useState<'TRY' | 'USD'>('TRY');
  const [drill, setDrill] = useState<{ ci: number; x: number; y: number } | null>(null);

  const scen = scenarios.find((s) => s.key === scenKey)!;
  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (v: number) => (currency === 'USD' ? v / 44.9 : v);
  const fmt = (v: number) => { const c = conv(v); const a = Math.abs(c); const s = a >= 1e6 ? (c / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (c / 1e3).toFixed(0) + 'K' : Math.round(c).toString(); return `${sym}${s}`; };
  const colLabel = (d: string) => (mode === 'monthly' ? d : `${d.slice(8, 10)}.${d.slice(5, 7)}`);

  const range = useMemo(() => (
    mode === 'daily' ? { from: addDays(REF_DATE, -14), to: addDays(REF_DATE, 45) }
      : mode === 'weekly' ? { from: addDays(REF_DATE, -28), to: addDays(REF_DATE, 91) }
        : { from: addDays(REF_DATE, -59), to: addDays(REF_DATE, 120) }
  ), [mode]);

  const grid = useMemo(() => applyScenario(buildGrid(mode, range, openingBalance), scen), [mode, range, scen]);

  // ── KPI'lar (seçili senaryo altında) ──
  const kpi = useMemo(() => {
    const fwd = applyScenario(buildGrid('daily', { from: REF_DATE, to: addDays(REF_DATE, 90) }, openingBalance), scen);
    const endBal = fwd.balance[fwd.balance.length - 1];
    const monthlyBurn = (openingBalance - endBal) / 3; // + = yakım
    const runway = monthlyBurn > 0 ? openingBalance / monthlyBurn : Infinity;
    const g13 = applyScenario(buildGrid('weekly', { from: REF_DATE, to: addDays(REF_DATE, 13 * 7) }, openingBalance), scen);
    const bal13 = g13.balance.slice(0, 13);
    const r13End = bal13[bal13.length - 1] ?? endBal;
    const minBal = Math.min(...bal13);
    const past = buildGrid('weekly', { from: addDays(REF_DATE, -42), to: addDays(REF_DATE, -1) });
    const fa = gridForecastActual(past, 'outflow');
    const v = variance(fa.forecast, fa.actual);
    const varLast = v.length ? v[v.length - 1].cumVariancePct : 0;
    const firstF = grid.isForecast.indexOf(true);
    const netDonem = firstF >= 0 ? grid.net[firstF] : (grid.net[0] ?? 0);
    return { monthlyBurn, runway, r13End, minBal, varLast, netDonem };
  }, [scen, grid]);

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

  const controls = (
    <>
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
          </div>
        </>,
        document.body,
      )}
    </ReportPageLayout>
  );
};
