// DCF hesap motoru — saf, test edilebilir fonksiyonlar. docs/finance-suite-brief.md SAYFA 7.
// Muhiku halka kapalı: hisse fiyatı yok → çıktı EV → Equity → DLOM → hisse başı → cap table.
import type { DcfSettings } from '../../constants/dcfData';
import { DCF_SHARES } from '../../constants/dcfData';

export interface ProjRow { year: number; growthPct: number; cashflow: number; cashflowNoDecay: number; pv: number }

const pct = (x: number) => x / 100;
export const pvOf = (value: number, waccPct: number, year: number) => value / Math.pow(1 + pct(waccPct), year);

/** Yıllık projeksiyon: büyüme her yıl decay ile yavaşlar. cashflowNoDecay = sabit büyüme (kıyas serisi). */
export const projectCashflows = (base: number, growthPct: number, decayPct: number, years: number): ProjRow[] => {
  const rows: ProjRow[] = [];
  let cf = base, cfND = base;
  for (let k = 1; k <= years; k++) {
    const g = growthPct * Math.pow(1 - pct(decayPct), k - 1);
    cf = cf * (1 + pct(g));
    cfND = cfND * (1 + pct(growthPct));
    rows.push({ year: k, growthPct: g, cashflow: cf, cashflowNoDecay: cfND, pv: 0 });
  }
  return rows;
};

/** Nakit akışlarının bugünkü değer toplamı (year 1..n). */
export const discount = (cashflows: number[], waccPct: number, startYear = 1): number =>
  cashflows.reduce((s, cf, i) => s + pvOf(cf, waccPct, startYear + i), 0);

/** Gordon büyüme terminal değeri (nominal): lastCF·(1+g)/(WACC−g). WACC>g olmalı. */
export const terminalValueGordon = (lastCF: number, terminalGrowthPct: number, waccPct: number): number => {
  const spread = pct(waccPct) - pct(terminalGrowthPct);
  if (spread <= 0) return NaN; // WACC ≤ g → geçersiz
  return (lastCF * (1 + pct(terminalGrowthPct))) / spread;
};

/** Çıkış çarpanı terminal değeri: son yıl metriği × exit multiple. */
export const terminalValueExit = (lastMetric: number, exitMultiple: number): number => lastMetric * exitMultiple;

export interface DcfResult {
  projections: ProjRow[];
  pvGrowth: number;         // açık dönem PV toplamı (growth value)
  terminalValueRaw: number; // indirgenmemiş terminal değer
  pvTerminal: number;       // terminal değerin PV'si
  enterpriseValue: number;  // EV
  equityValue: number;      // EV − Net Borç
  equityAfterDLOM: number;  // × (1 − DLOM)
  perShare: number;         // / 20.000.000
  capTable: { partner: string; pct: number; value: number }[];
  terminalShare: number;    // PV(terminal) / EV
  growthValue: number;      // = pvGrowth
}

/** Tek senaryo DCF çalıştırması. growthOverride verilirse büyümeyi ezer (senaryo/reverse için). */
export const runDcf = (s: DcfSettings, growthOverride?: number): DcfResult => {
  const growth = growthOverride ?? s.growthPct;
  const projFull = projectCashflows(s.baseValueTRY, growth, s.growthDecayPct, s.years);
  const projections = projFull.map((r) => ({ ...r, pv: pvOf(r.cashflow, s.waccPct, r.year) }));
  const pvGrowth = projections.reduce((sum, r) => sum + r.pv, 0);
  const lastCF = projections[projections.length - 1].cashflow;
  const terminalValueRaw = s.terminalMethod === 'exit'
    ? terminalValueExit(lastCF, s.exitMultiple)
    : terminalValueGordon(lastCF, s.terminalGrowthPct, s.waccPct);
  const pvTerminal = pvOf(terminalValueRaw, s.waccPct, s.years);
  const enterpriseValue = pvGrowth + pvTerminal;
  const equityValue = enterpriseValue - s.netDebtTRY;
  const equityAfterDLOM = equityValue * (1 - pct(s.dlomPct));
  const perShare = equityAfterDLOM / (s.shares || DCF_SHARES);
  const capTable = s.capTable.map((c) => ({ partner: c.partner, pct: c.pct, value: equityAfterDLOM * pct(c.pct) }));
  const terminalShare = enterpriseValue ? pvTerminal / enterpriseValue : 0;
  return { projections, pvGrowth, terminalValueRaw, pvTerminal, enterpriseValue, equityValue, equityAfterDLOM, perShare, capTable, terminalShare, growthValue: pvGrowth };
};

/** Senaryo-ağırlıklı beklenen özkaynak (DLOM sonrası). */
export const scenarioWeighted = (s: DcfSettings): { value: number; parts: { key: string; weight: number; value: number }[] } => {
  const wSum = s.scenarios.reduce((a, b) => a + b.weight, 0) || 1;
  const parts = s.scenarios.map((sc) => ({ key: sc.key, weight: sc.weight, value: runDcf(s, sc.growthPct).equityAfterDLOM }));
  const value = parts.reduce((sum, p) => sum + p.value * (p.weight / wSum), 0);
  return { value, parts };
};

/**
 * Reverse DCF — hedef özkaynak (DLOM sonrası) değerini veren büyümeyi binary-search ile çöz.
 * equityAfterDLOM, growth'a göre monoton artar → ikili arama güvenli.
 */
export const reverseDcf = (s: DcfSettings, targetEquityAfterDLOM: number): { impliedGrowthPct: number; iterations: number; reached: boolean } => {
  let lo = -50, hi = 300, iterations = 0;
  const f = (g: number) => runDcf(s, g).equityAfterDLOM;
  if (f(hi) < targetEquityAfterDLOM) return { impliedGrowthPct: hi, iterations, reached: false }; // ulaşılamaz
  if (f(lo) > targetEquityAfterDLOM) return { impliedGrowthPct: lo, iterations, reached: false };
  while (hi - lo > 0.01 && iterations < 200) {
    const mid = (lo + hi) / 2;
    if (f(mid) < targetEquityAfterDLOM) lo = mid; else hi = mid;
    iterations++;
  }
  return { impliedGrowthPct: (lo + hi) / 2, iterations, reached: true };
};

/** WACC × Terminal Büyüme duyarlılık matrisi (perShare). Adım: WACC 0.5%, g 0.25%. */
export const sensitivityMatrix = (s: DcfSettings, waccSteps = 5, gSteps = 5): { waccAxis: number[]; gAxis: number[]; grid: number[][] } => {
  const half = (n: number) => Math.floor(n / 2);
  const waccAxis = Array.from({ length: waccSteps }, (_, i) => +(s.waccPct + (i - half(waccSteps)) * 0.5).toFixed(2));
  const gAxis = Array.from({ length: gSteps }, (_, i) => +(s.terminalGrowthPct + (i - half(gSteps)) * 0.25).toFixed(2));
  const grid = waccAxis.map((w) => gAxis.map((g) => runDcf({ ...s, waccPct: w, terminalGrowthPct: g }).perShare));
  return { waccAxis, gAxis, grid };
};
