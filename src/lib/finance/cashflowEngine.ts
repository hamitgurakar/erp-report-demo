// Nakit Akışı motoru (direkt yöntem) — saf fonksiyonlar. docs/cashflow-brief.md SECTION B.
// Kredi/Çek satırları A3 cashflowFeed.getScheduledOutflows'tan birleştirilir.
import type { CashPeriodMode, CashGrid, CashRow, CashCell, CashScenario, VarianceRow, WeekPoint } from '../../types/cashflow';
import { CASH_ROWS, DIRECTION, FEED_ROWS, dailyForLine, REF_DATE, openingBalance as SEED_OPENING } from '../../constants/cashflowData';
import { getScheduledOutflows } from './cashflowFeed';

const USD_TRY = 44.9;
const toTRY = (v: number, cur: 'TRY' | 'USD' | 'EUR') => (cur === 'USD' ? v * USD_TRY : cur === 'EUR' ? v * USD_TRY * 1.08 : v);
const round = (x: number) => Math.round(x);

// ── tarih yardımcıları ──
export const addDays = (iso: string, n: number): string => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d + n)); return dt.toISOString().slice(0, 10); };
const dailyDates = (from: string, to: string): string[] => { const out: string[] = []; let c = from; let guard = 0; while (c <= to && guard++ < 4000) { out.push(c); c = addDays(c, 1); } return out; };
const mondayOf = (iso: string): string => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d)); const day = dt.getUTCDay(); const delta = day === 0 ? -6 : 1 - day; return addDays(iso, delta); };
const monthOf = (iso: string) => iso.slice(0, 7);

// gösterim değeri: geçmişte gerçekleşen (actual), gelecekte forecast
const shown = (c: CashCell) => (c.isForecast ? c.amount : (c.actual ?? c.amount));

interface Bucket { label: string; dates: string[]; isForecast: boolean }
const bucketize = (dates: string[], mode: CashPeriodMode): Bucket[] => {
  if (mode === 'daily') return dates.map((d) => ({ label: d, dates: [d], isForecast: d >= REF_DATE }));
  const map = new Map<string, string[]>();
  for (const d of dates) { const key = mode === 'weekly' ? mondayOf(d) : monthOf(d); if (!map.has(key)) map.set(key, []); map.get(key)!.push(d); }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, ds]) => ({ label, dates: ds, isForecast: ds[ds.length - 1] >= REF_DATE }));
};

// ── günlük ham satır hücreleri (forecast + actual) ──
const dailyLineCells = (dates: string[]): Record<string, CashCell[]> => {
  const feed = getScheduledOutflows({ from: dates[0], to: dates[dates.length - 1] });
  const feedByDate: Record<string, Record<string, number>> = { kredi: {}, cek: {} };
  for (const o of feed) { const k = o.kategori === 'Kredi' ? 'kredi' : 'cek'; feedByDate[k][o.tarih] = (feedByDate[k][o.tarih] ?? 0) + toTRY(o.tutar, o.paraBirimi); }

  const out: Record<string, CashCell[]> = {};
  for (const row of CASH_ROWS) {
    out[row.key] = dates.map((d) => {
      const isF = d >= REF_DATE;
      if (FEED_ROWS.has(row.key)) {
        const amt = round(feedByDate[row.key]?.[d] ?? 0);
        return { date: d, amount: amt, isForecast: isF, actual: isF ? undefined : amt }; // planlanan taksit/çek → geçmişte ödendi
      }
      const { forecast, actual } = dailyForLine(row.key, d);
      return { date: d, amount: forecast, isForecast: isF, actual: isF ? undefined : (actual ?? forecast) };
    });
  }
  return out;
};

// ── bucket'a indir + toplam/net/bakiye ──
const assemble = (dates: string[], mode: CashPeriodMode, lineCells: Record<string, CashCell[]>, opening: number): CashGrid => {
  const buckets = bucketize(dates, mode);
  const idxByDate = new Map(dates.map((d, i) => [d, i]));

  // günlük net & running (gösterim değeriyle) — bucket bakiyesi için
  const dailyNet = dates.map((d) => {
    let net = 0;
    for (const row of CASH_ROWS) { const c = lineCells[row.key][idxByDate.get(d)!]; net += (row.direction === 'inflow' ? 1 : -1) * shown(c); }
    return net;
  });
  const dailyRunning: number[] = []; let run = opening;
  for (let i = 0; i < dates.length; i++) { run += dailyNet[i]; dailyRunning.push(run); }

  const mkRows = (dir: 'inflow' | 'outflow'): CashRow[] => CASH_ROWS.filter((r) => r.direction === dir).map((row) => {
    const cells: CashCell[] = buckets.map((b) => {
      let amount = 0, actual = 0, hasActual = false;
      for (const d of b.dates) { const c = lineCells[row.key][idxByDate.get(d)!]; amount += c.amount; if (c.actual != null) { actual += c.actual; hasActual = true; } }
      return { date: b.label, amount: round(amount), isForecast: b.isForecast, actual: hasActual ? round(actual) : undefined };
    });
    return { line: row, cells, total: round(cells.reduce((s, c) => s + shown(c), 0)) };
  });
  const income = mkRows('inflow');
  const expense = mkRows('outflow');

  const totalIncome = buckets.map((_, bi) => round(income.reduce((s, r) => s + shown(r.cells[bi]), 0)));
  const totalExpense = buckets.map((_, bi) => round(expense.reduce((s, r) => s + shown(r.cells[bi]), 0)));
  const net = buckets.map((_, bi) => totalIncome[bi] - totalExpense[bi]);
  const balance = buckets.map((b) => round(dailyRunning[idxByDate.get(b.dates[b.dates.length - 1])!]));

  return { mode, dates: buckets.map((b) => b.label), isForecast: buckets.map((b) => b.isForecast), income, expense, totalIncome, totalExpense, net, balance, openingBalance: opening };
};

/** Satır×tarih matrisi + Toplam Gelir/Gider, Net, running Bakiye. */
export const buildGrid = (mode: CashPeriodMode, range: { from: string; to: string }, opening: number = SEED_OPENING): CashGrid => {
  const dates = dailyDates(range.from, range.to);
  return assemble(dates, mode, dailyLineCells(dates), opening);
};

/** best/base/worst multiplier uygula; toplam/net/bakiye yeniden hesaplanır. */
export const applyScenario = (grid: CashGrid, scenario: CashScenario): CashGrid => {
  const m = scenario.multipliers;
  const scaleRows = (rows: CashRow[], mult: number): CashRow[] => rows.map((r) => {
    const cells = r.cells.map((c) => ({ ...c, amount: round(c.amount * mult), actual: c.actual != null ? round(c.actual * mult) : undefined }));
    return { ...r, cells, total: round(cells.reduce((s, c) => s + shown(c), 0)) };
  });
  const income = scaleRows(grid.income, m.inflow);
  const expense = scaleRows(grid.expense, m.outflow);
  const totalIncome = grid.dates.map((_, bi) => round(income.reduce((s, r) => s + shown(r.cells[bi]), 0)));
  const totalExpense = grid.dates.map((_, bi) => round(expense.reduce((s, r) => s + shown(r.cells[bi]), 0)));
  const net = grid.dates.map((_, bi) => totalIncome[bi] - totalExpense[bi]);
  const balance: number[] = []; let run = grid.openingBalance;
  for (const n of net) { run += n; balance.push(round(run)); }
  return { ...grid, income, expense, totalIncome, totalExpense, net, balance };
};

/** 13 haftalık haftalık net + kümülatif bakiye (rolling). */
export const rolling13Weeks = (fromDate: string, opening: number = SEED_OPENING): WeekPoint[] => {
  const grid = buildGrid('weekly', { from: mondayOf(fromDate), to: addDays(mondayOf(fromDate), 13 * 7 - 1) }, opening);
  return grid.dates.slice(0, 13).map((wk, i) => ({ week: i + 1, weekStart: wk, inflow: grid.totalIncome[i], outflow: grid.totalExpense[i], net: grid.net[i], cumulativeBalance: grid.balance[i] }));
};

/**
 * Forecast vs actual varyansı — dönem (hafta) bazında + kümülatif.
 * Eşik: ≤30 gün ±%5, ≤90 gün ±%15. withinBand=false → uyarı.
 */
export const variance = (forecast: number[], actual: number[]): VarianceRow[] => {
  const out: VarianceRow[] = []; let cumF = 0, cumA = 0;
  for (let i = 0; i < forecast.length; i++) {
    const fc = forecast[i], ac = actual[i]; cumF += fc; cumA += ac;
    const horizonDays = (i + 1) * 7;
    const band = horizonDays <= 30 ? 0.05 : 0.15;
    const vPct = fc ? (ac - fc) / fc : 0;
    const cumV = cumF ? (cumA - cumF) / cumF : 0;
    out.push({ label: `H${i + 1}`, forecast: fc, actual: ac, variancePct: vPct, cumForecast: cumF, cumActual: cumA, cumVariancePct: cumV, horizonDays, band, withinBand: Math.abs(vPct) <= band });
  }
  return out;
};

/**
 * Bir grid'in kolon bazında forecast vs actual *toplam ödeme (disbursement)* çıkarır (variance için).
 * Ödeme-tahmin doğruluğu treasury standardıdır (Agicap/CashAnalytics): net-akış gibi sıfıra
 * yakın payda üretmez, sabit büyüklüklüdür ve sapan haftalarda bandı net aşar.
 * `base='net'|'balance'` ile alternatif tabanlar da alınabilir.
 */
export const gridForecastActual = (grid: CashGrid, base: 'outflow' | 'inflow' | 'net' | 'balance' = 'outflow'): { forecast: number[]; actual: number[] } => {
  const forecast: number[] = [], actual: number[] = [];
  let runF = grid.openingBalance, runA = grid.openingBalance;
  grid.dates.forEach((_, bi) => {
    const inF = grid.income.reduce((s, r) => s + r.cells[bi].amount, 0);
    const inA = grid.income.reduce((s, r) => s + (r.cells[bi].actual ?? r.cells[bi].amount), 0);
    const outF = grid.expense.reduce((s, r) => s + r.cells[bi].amount, 0);
    const outA = grid.expense.reduce((s, r) => s + (r.cells[bi].actual ?? r.cells[bi].amount), 0);
    runF += inF - outF; runA += inA - outA;
    if (base === 'outflow') { forecast.push(round(outF)); actual.push(round(outA)); }
    else if (base === 'inflow') { forecast.push(round(inF)); actual.push(round(inA)); }
    else if (base === 'net') { forecast.push(round(inF - outF)); actual.push(round(inA - outA)); }
    else { forecast.push(round(runF)); actual.push(round(runA)); }
  });
  return { forecast, actual };
};
