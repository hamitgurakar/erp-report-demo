import { useState, type CSSProperties } from 'react';
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { FinancialPeriod, FinCurrency } from '../../../types/finance';
import { PERIODS_ANNUAL, incomeRaw, balanceRaw } from '../../../constants/financeData';
import { scorecardCategories, moduleHealth, rollupAlerts, footballField } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPICard, KPIBand, ChartCard, StatusBadge, GaugeCard, InfoTip,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

const gradeOf = (s: number) => (s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F');
const composite = (() => {
  const wSum = scorecardCategories.reduce((s, c) => s + c.weight, 0);
  let comp = scorecardCategories.reduce((s, c) => s + c.score * c.weight, 0) / wSum;
  if (scorecardCategories.some((c) => (c.key.tr === 'Nakit-Likidite' || c.key.tr === 'Finansal Sağlık') && c.score < 40)) comp = Math.min(comp, 69);
  return comp;
})();

// alt sayfalardan okunan/roll-up metrikler (aynı formüller)
const metricsOf = (p: FinancialPeriod, prevId: string) => {
  const inc = incomeRaw[p.id], bal = balanceRaw[p.id];
  const rev = inc.revenue ?? 0;
  const ebitda = (rev + (inc.cogs ?? 0)) + (inc.marketingSales ?? 0) + (inc.generalAdmin ?? 0) + (inc.rnd ?? 0) + (inc.da ?? 0);
  const netDebt = (bal.stDebt ?? 0) + (bal.ltDebt ?? 0) - (bal.cash ?? 0) - (bal.stInvest ?? 0);
  const cash = (bal.cash ?? 0) + (bal.stInvest ?? 0);
  const cogsAbs = Math.abs(inc.cogs ?? 0);
  const dso = rev ? (bal.ar ?? 0) / rev * 365 : 0;
  const ccc = dso + (cogsAbs ? (bal.inventory ?? 0) / cogsAbs * 365 : 0) - (cogsAbs ? (bal.ap ?? 0) / cogsAbs * 365 : 0);
  const prevRev = incomeRaw[prevId]?.revenue ?? rev;
  return {
    rev, ebitda, ebitdaMargin: rev ? ebitda / rev * 100 : 0, netDebt, cash,
    runway: rev ? cash / ((rev * 0.10) / 12) : 0, ndEbitda: ebitda ? netDebt / ebitda : 0,
    dso, ccc, revGrowth: prevRev ? (rev - prevRev) / prevRev * 100 : 0,
  };
};

export const CfoCockpit = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';
  const periods = PERIODS_ANNUAL;
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod = curr) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const fmtPS = (vTRY: number) => `${sym}${conv(vTRY).toFixed(2)}`;

  const M = metricsOf(curr, prev.id);
  const series = (sel: (m: ReturnType<typeof metricsOf>) => number) => periods.map((p, i) => sel(metricsOf(p, periods[Math.max(0, i - 1)].id)));
  const upside = ((footballField.aiFairValue - footballField.current) / footballField.current) * 100;
  const gradeColor = (g: string) => (g === 'A' ? t.gn : g === 'B' ? t.pr : g === 'C' ? t.am : g === 'D' ? t.co : t.rd);

  // 6 above-the-fold KPI (her biri kaynak sayfaya drill-down)
  const kpis = [
    { title: en ? 'Composite Health' : 'Kompozit Sağlık', value: `${composite.toFixed(0)} · ${gradeOf(composite)}`, hint: en ? '8-category weighted' : '8 kategori ağırlıklı', spark: series(() => composite).map((v, i) => v * (0.92 + 0.08 * (i / 5))), color: gradeColor(gradeOf(composite)), goodDir: 'up' as const, rep: 'muhasebe__8' },
    { title: en ? 'Cash + Runway' : 'Nakit + Runway', value: fmtC(conv(M.cash)), hint: `${en ? 'Runway' : 'Runway'} ${M.runway.toFixed(1)} ${en ? 'mo' : 'ay'}`, spark: series((m) => m.cash), color: t.pr, goodDir: 'up' as const, rep: 'muhasebe__1' },
    { title: en ? 'Growth & EBITDA Margin' : 'Büyüme & FAVÖK Marjı', value: `${M.ebitdaMargin.toFixed(1)}%`, hint: `${en ? 'Revenue' : 'Hasılat'} +${M.revGrowth.toFixed(0)}%`, spark: series((m) => m.ebitdaMargin), color: t.tl, goodDir: 'up' as const, rep: 'muhasebe__0' },
    { title: en ? 'Net Debt/EBITDA' : 'Net Borç/FAVÖK', value: `${M.ndEbitda.toFixed(2)}x`, hint: en ? 'Covenant 3.0x' : 'Kovenant 3.0x', spark: series((m) => m.ndEbitda), color: t.pu, goodDir: 'down' as const, rep: 'muhasebe__5' },
    { title: 'DSO / CCC', value: `${M.dso.toFixed(0)} ${en ? 'd' : 'gün'}`, hint: `CCC ${M.ccc.toFixed(0)} ${en ? 'd' : 'gün'}`, spark: series((m) => m.dso), color: t.am, goodDir: 'down' as const, rep: 'muhasebe__2' },
    { title: en ? 'AI Fair Value' : 'AI Gerçeğe Uygun Değer', value: fmtPS(footballField.aiFairValue), hint: `${upside >= 0 ? '+' : ''}${upside.toFixed(0)}% ${en ? 'upside' : 'yükseliş'}`, spark: series(() => footballField.aiFairValue).map((v, i) => conv(v) * (0.85 + 0.15 * (i / 5))), color: t.co, goodDir: 'up' as const, rep: 'muhasebe__6' },
  ];

  // 13-aylık nakit trend (deterministik roll-up görseli)
  const cashBase = M.cash;
  const monthly = Array.from({ length: 13 }, (_, i) => ({ m: `${en ? 'M' : 'A'}${i + 1}`, cash: conv(cashBase * (0.86 + 0.013 * i) + Math.sin(i / 2) * cashBase * 0.03) }));

  // radar
  const radar = scorecardCategories.map((c) => ({ cat: c.key[en ? 'en' : 'tr'].split(' ')[0], score: c.score }));

  // alarm taksonomisi ısı matrisi (severity × modül)
  const SEV = [
    { key: 'critical', label: en ? 'Critical' : 'Acil', color: t.rd },
    { key: 'warning', label: en ? 'Warning' : 'Uyarı', color: t.am },
    { key: 'watch', label: en ? 'Watch' : 'İzle', color: t.pr },
  ] as const;
  const modules = Array.from(new Set(rollupAlerts.map((a) => a.moduleKey)));
  const alarmCount = (modKey: string, sev: string) => rollupAlerts.filter((a) => a.moduleKey === modKey && a.severity === sev).length;
  const modLabel = (modKey: string) => rollupAlerts.find((a) => a.moduleKey === modKey)?.module[en ? 'en' : 'tr'] ?? modKey;
  const modRep = (modKey: string) => rollupAlerts.find((a) => a.moduleKey === modKey)?.repKey ?? 'muhasebe__9';

  // KPI sparkline grid
  const sparkGrid = [
    { label: en ? 'Revenue' : 'Hasılat', data: series((m) => m.rev), color: t.pr },
    { label: en ? 'EBITDA Margin' : 'FAVÖK Marjı', data: series((m) => m.ebitdaMargin), color: t.tl },
    { label: 'Net Debt/EBITDA', data: series((m) => m.ndEbitda), color: t.pu },
    { label: 'DSO', data: series((m) => m.dso), color: t.am },
    { label: 'CCC', data: series((m) => m.ccc), color: t.co },
    { label: en ? 'Cash' : 'Nakit', data: series((m) => m.cash), color: t.gn },
  ];

  const sevRank: Record<string, number> = { critical: 0, warning: 1, watch: 2 };
  const sevMeta = (s: string) => (s === 'critical' ? { e: '🔴', tone: 'red' as const } : s === 'warning' ? { e: '🟠', tone: 'amber' as const } : { e: '🔵', tone: 'blue' as const });

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'left', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'left', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, verticalAlign: 'top' };
  const trendIcon = (tr: string) => tr === 'up' ? <Icon name="arrowUp" size={12} color={t.gn} /> : tr === 'down' ? <Icon name="arrowDown" size={12} color={t.rd} /> : <span style={{ color: t.tx3 }}>—</span>;

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin9}
      subtitle={en ? 'Command center — rolls up the whole suite (score + alarms + KPIs). Reads only; produces no data.' : 'Komuta merkezi — tüm suite’i toplar (skor + alarm + KPI). Sadece okur; veri üretmez.'}
      currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Scorecard detail →' : 'Skorkart detayı →', onClick: () => onSelectRep?.('muhasebe__8') }}
    >
      {/* 6 above-the-fold KPI — tıklanabilir drill-down */}
      <KPIBand>
        {kpis.map((k) => (
          <div key={k.title} onClick={() => onSelectRep?.(k.rep)} title={en ? 'Drill down' : 'Detaya git'} style={{ flex: 1, minWidth: 160, cursor: 'pointer', display: 'flex' }}>
            <KPICard t={t} lang={lang} title={k.title} value={k.value} hint={k.hint} spark={k.spark} sparkColor={k.color} goodDir={k.goodDir} />
          </div>
        ))}
      </KPIBand>

      {/* Row: Kompozit gauge + 13-aylık nakit + radar */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={30} title={en ? 'Composite Health Index' : 'Kompozit Sağlık Endeksi'}
          right={<InfoTip t={t} lang={lang} termKey="healthComposite" />}
          why={en ? 'Calqulate/StockTitan financial-health-index gauge.' : 'Calqulate/StockTitan financial-health-index gauge deseni.'}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 230, justifyContent: 'center' }}>
            <div style={{ width: 210 }}>
              <GaugeCard t={t} value={composite} min={0} max={100} format={(v) => `${Math.round(v)}`} centerText={gradeOf(composite)} label={en ? 'Composite' : 'Kompozit'}
                thresholds={[{ limit: 40, color: t.rd }, { limit: 55, color: t.co }, { limit: 70, color: t.am }, { limit: 85, color: t.pr }, { limit: 100, color: t.gn }]} />
            </div>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={38} title={en ? '13-Month Cash Trend' : '13-Aylık Nakit Trendi'}
          why={en ? 'Mosaic/Pigment board-mode single-screen pattern.' : 'Mosaic/Pigment board-mode single-screen deseni.'}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthly} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <defs><linearGradient id="cfoCash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.pr} stopOpacity={0.4} /><stop offset="100%" stopColor={t.pr} stopOpacity={0.03} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={44} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Area type="monotone" dataKey="cash" stroke={t.pr} fill="url(#cfoCash)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 8 }}>
            {[
              { lb: en ? 'Rev.Growth' : 'Büyüme', v: `+${M.revGrowth.toFixed(0)}%`, c: t.gn },
              { lb: 'FAVÖK', v: `${M.ebitdaMargin.toFixed(0)}%`, c: t.tl },
              { lb: 'ND/EBITDA', v: `${M.ndEbitda.toFixed(1)}x`, c: t.pu },
              { lb: 'DSO', v: `${M.dso.toFixed(0)}${en ? 'd' : 'g'}`, c: t.am },
            ].map((s) => (
              <div key={s.lb} style={{ background: t.bg2, borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9.5, color: t.tx3 }}>{s.lb}</div>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={26} title={en ? '8-Category Mini Radar' : '8-Kategori Mini Radar'}
          why={en ? 'Executive radar pattern (scorecard summary).' : 'Yönetici radar deseni (skorkart özeti).'}>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radar} outerRadius={80}>
              <PolarGrid stroke={t.bd} />
              <PolarAngleAxis dataKey="cat" tick={{ fontSize: 8.5, fill: t.tx2 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke={t.pr} fill={t.pr} fillOpacity={0.35} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v}/100`} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Alarm taksonomisi ısı + KPI sparkline grid */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Alarm Taxonomy (severity × module)' : 'Alarm Taksonomisi (önem × modül)'}
          why={en ? 'Orbit Analytics RAG-tile alert pattern.' : 'Orbit Analytics RAG-tile alert deseni.'}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 340 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 10, color: t.tx3, padding: 6, textAlign: 'left' }}>{en ? 'Module' : 'Modül'}</th>
                  {SEV.map((s) => <th key={s.key} style={{ fontSize: 10, color: t.tx2, padding: 6, fontWeight: 600 }}>{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {modules.map((mk) => (
                  <tr key={mk}>
                    <td style={{ fontSize: 11.5, color: t.pr, padding: 6, fontWeight: 500, cursor: 'pointer' }} onClick={() => onSelectRep?.(modRep(mk))}>{modLabel(mk)}</td>
                    {SEV.map((s) => {
                      const n = alarmCount(mk, s.key);
                      return (
                        <td key={s.key} style={{ padding: 3, textAlign: 'center' }}>
                          <div style={{ background: n ? s.color : t.bg2, color: n ? '#fff' : t.tx3, fontWeight: 700, fontSize: 12, borderRadius: 6, padding: '9px 4px', opacity: n ? 1 : 0.5 }}>{n || '·'}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'KPI Sparkline Grid' : 'KPI Sparkline Grid'}
          why={en ? 'insightsoftware sparkline-trend pattern.' : 'insightsoftware sparkline-trend deseni.'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {sparkGrid.map((s) => (
              <div key={s.label} style={{ background: t.bg2, borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 10.5, color: t.tx2, marginBottom: 2 }}>{s.label}</div>
                <div style={{ height: 34 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={s.data.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="v" stroke={s.color} strokeWidth={1.6} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Tablo 1: Kritik Uyarılar Roll-up */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Critical Alerts Roll-up' : 'Kritik Uyarılar Roll-up'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Sev.' : 'Önem'}</th>
                <th style={th}>{en ? 'Module' : 'Modül'}</th>
                <th style={th}>{en ? 'Alert' : 'Uyarı'}</th>
                <th style={{ ...th, textAlign: 'right' }}>{en ? 'Metric' : 'Metrik'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Threshold' : 'Eşik'}</th>
                <th style={th}>{en ? 'Action' : 'Aksiyon'}</th>
                <th style={th}>{en ? 'Owner' : 'Sorumlu'}</th>
                <th style={{ ...th, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {[...rollupAlerts].sort((a, b) => sevRank[a.severity] - sevRank[b.severity]).map((a, i) => {
                const sm = sevMeta(a.severity);
                return (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'center' }}>{sm.e}</td>
                    <td style={td}><StatusBadge t={t} dot={false} tone={sm.tone} label={a.module[en ? 'en' : 'tr']} /></td>
                    <td style={{ ...td, color: t.tx, maxWidth: 320, whiteSpace: 'normal' }}>{a.text[en ? 'en' : 'tr']}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{a.metric}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11 }}>{a.threshold}</td>
                    <td style={{ ...td, color: t.tx2, fontSize: 11.5 }}>{a.action[en ? 'en' : 'tr']}</td>
                    <td style={{ ...td, color: t.tx2, fontSize: 11.5 }}>{a.owner}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button title={en ? 'Go to source' : 'Kaynağa git'} onClick={() => onSelectRep?.(a.repKey)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}>
                        <Icon name="externalLink" size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '9px 16px', borderTop: `1px solid ${t.bd}`, lineHeight: 1.5 }}>
          {en ? '🔴 Critical: liquidity/runway <45d, covenant breach, tax filing delay, 90+ large receivable, interest coverage <2x. 🟠 Warning: margin compression, DSO/DPO drift, discount-window miss, threshold approach. 🔵 Watch: trend change, concentration, payment-behavior signal.' : '🔴 Acil: likidite/runway <45g, kovenant ihlali, vergi beyanname gecikme, 90+ gün büyük alacak, faiz karşılama <2x. 🟠 Uyarı: marj daralması, DSO/DPO sapması, iskonto penceresi kaçırma, eşik yaklaşma. 🔵 İzle: trend değişimi, konsantrasyon, ödeme davranışı sinyali.'}
        </div>
      </div>

      {/* Tablo 2: Modül Sağlık Özeti */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Module Health Summary' : 'Modül Sağlık Özeti'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>{en ? 'Module' : 'Modül'}</th>
                <th style={{ ...th, textAlign: 'right' }}>{en ? 'Score' : 'Skor'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Grade' : 'Harf'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Trend' : 'Trend'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Open Alerts' : 'Açık Uyarı'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
                <th style={{ ...th, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {[...moduleHealth].sort((a, b) => b.score - a.score).map((m) => (
                <tr key={m.moduleKey}>
                  <td style={{ ...td, fontWeight: 500 }}>{m.module[en ? 'en' : 'tr']}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{m.score}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} dot={false} tone={m.grade === 'A' ? 'green' : m.grade === 'B' ? 'blue' : m.grade === 'C' ? 'amber' : 'red'} label={m.grade} /></td>
                  <td style={{ ...td, textAlign: 'center' }}>{trendIcon(m.trend)}</td>
                  <td style={{ ...td, textAlign: 'center', color: m.openAlerts ? t.am : t.tx3, fontWeight: m.openAlerts ? 600 : 400 }}>{m.openAlerts || '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <StatusBadge t={t} tone={m.score >= 70 ? 'green' : m.score >= 55 ? 'amber' : 'red'} label={m.score >= 70 ? (en ? 'Healthy' : 'Sağlıklı') : m.score >= 55 ? (en ? 'Watch' : 'İzle') : (en ? 'Risk' : 'Risk')} />
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button title={en ? 'Open module' : 'Modülü aç'} onClick={() => onSelectRep?.(m.repKey)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}>
                      <Icon name="externalLink" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportPageLayout>
  );
};
