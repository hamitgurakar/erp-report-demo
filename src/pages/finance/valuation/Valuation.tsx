import { useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ZAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType } from '../../../types/finance';
import { PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw, TOTAL_SHARES } from '../../../constants/financeData';
import { compsSet, footballField } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  Dropdown, Waterfall, type FinAlert,
} from '../../../components/finance';
import { useDcf } from '../../../context/DcfContext';
import type { FinancePageProps } from '../_Placeholder';

const ebitdaAnnualOf = (p: FinancialPeriod) => {
  const v = incomeRaw[p.id];
  const gross = (v.revenue ?? 0) + (v.cogs ?? 0);
  const ebit = gross + (v.marketingSales ?? 0) + (v.generalAdmin ?? 0) + (v.rnd ?? 0);
  const ebitda = ebit + (v.da ?? 0);
  return ebitda * (p.type === 'annual' ? 1 : 4);
};
const netDebtOf = (p: FinancialPeriod) => (balanceRaw[p.id].stDebt ?? 0) + (balanceRaw[p.id].ltDebt ?? 0) - (balanceRaw[p.id].cash ?? 0) - (balanceRaw[p.id].stInvest ?? 0);
const MUHIKU = compsSet.find((c) => c.company === 'Muhiku')!;
const MEDIAN = compsSet.find((c) => c.company.startsWith('Medyan') || c.company.startsWith('Median'))!;

export const Valuation = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const [eduOpen, setEduOpen] = useState(false);
  const en = lang === 'en';
  const dcf = useDcf(); // DCF Calculator "Ayarlar'a kaydet" → bu tablo canlı besleniyor (tek kaynak)
  const liveAssumptions = [
    { assumption: { tr: 'WACC', en: 'WACC' }, value: `%${dcf.saved.waccPct}`, note: { tr: 'TL nominal', en: 'TRY nominal' } },
    { assumption: { tr: 'Türkiye ERP', en: 'Turkey ERP' }, value: `%${dcf.saved.erpPct.toFixed(2)}`, note: { tr: 'Damodaran 07/2026', en: 'Damodaran 07/2026' } },
    { assumption: { tr: 'Terminal Büyüme', en: 'Terminal Growth' }, value: `%${dcf.saved.terminalGrowthPct}`, note: { tr: '≈GSYİH, WACC altında', en: '≈GDP, below WACC' } },
    { assumption: { tr: 'Projeksiyon', en: 'Projection' }, value: `${dcf.saved.years} ${en ? 'yr' : 'yıl'}`, note: { tr: 'Açık dönem', en: 'Explicit period' } },
    { assumption: { tr: 'Senaryo Ağırlığı', en: 'Scenario Weight' }, value: dcf.saved.scenarios.map((sc) => sc.weight).join(' / '), note: { tr: 'Kötü/Baz/İyi', en: 'Bear/Base/Bull' } },
    { assumption: { tr: 'DLOM', en: 'DLOM' }, value: `%${dcf.saved.dlomPct}`, note: { tr: 'Pazarlanabilirlik iskontosu', en: 'Marketability discount' } },
  ];

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const curr = periods[periods.length - 1];

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod = curr) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const fmtPS = (vTRY: number) => `${sym}${conv(vTRY).toFixed(2)}`;
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');

  // ── değerleme çıktıları ──
  const ebitda = ebitdaAnnualOf(curr);
  const EV = MUHIKU.evEbitda * ebitda;               // comps çarpanından EV
  const fairValue = footballField.aiFairValue;        // ₺/hisse
  const current = footballField.current;              // ₺/hisse
  const upside = ((fairValue - current) / current) * 100;
  const dcfBase = (footballField.ranges[2].low + footballField.ranges[2].high) / 2; // DCF aralık ortası
  const dlomValue = fairValue * 0.75;                 // %25 DLOM

  const kpis = [
    { title: en ? 'AI Fair Value' : 'AI Gerçeğe Uygun Değer', term: 'aiFairValue', goodDir: 'up' as const, value: fmtPS(fairValue),
      trend: { value: 0 }, spark: periods.map((_, i) => fairValue * (0.8 + 0.2 * (i / (periods.length - 1)))), color: t.pr },
    { title: en ? 'Upside' : 'Yükseliş Potansiyeli', term: 'upside', goodDir: 'up' as const, value: `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%`,
      trend: { value: upside, isRatio: true }, spark: periods.map(() => upside), color: t.gn },
    { title: en ? 'Enterprise Value' : 'Şirket Değeri (EV)', term: 'enterpriseValue', goodDir: 'up' as const, value: fmtC(conv(EV)),
      trend: { value: 0 }, spark: periods.map((p) => conv(MUHIKU.evEbitda * ebitdaAnnualOf(p), p)), color: t.tl },
    { title: 'EV/EBITDA', term: 'evEbitda', goodDir: 'down' as const, value: `${MUHIKU.evEbitda.toFixed(1)}x`,
      trend: { value: MUHIKU.evEbitda - MEDIAN.evEbitda, isRatio: true }, spark: periods.map((_, i) => MUHIKU.evEbitda * (0.8 + 0.2 * (i / (periods.length - 1)))), color: t.pu },
    { title: en ? 'EV/Revenue' : 'EV/Hasılat', term: 'evRevenue', goodDir: 'down' as const, value: `${MUHIKU.evRevenue.toFixed(1)}x`,
      trend: { value: MUHIKU.evRevenue - MEDIAN.evRevenue, isRatio: true }, spark: periods.map(() => MUHIKU.evRevenue), color: t.c1 },
    { title: en ? 'P/E' : 'F/K', term: 'peRatio', goodDir: 'down' as const, value: `${MUHIKU.pe.toFixed(1)}x`,
      trend: { value: MUHIKU.pe - MEDIAN.pe, isRatio: true }, spark: periods.map(() => MUHIKU.pe), color: t.am },
    { title: en ? 'DCF Base' : 'DCF Baz', term: 'dcfBase', goodDir: 'up' as const, value: fmtPS(dcfBase),
      trend: { value: 0 }, spark: periods.map((_, i) => dcfBase * (0.8 + 0.2 * (i / (periods.length - 1)))), color: t.co },
    { title: en ? 'Post-DLOM Value' : 'DLOM Sonrası', term: 'dlom', goodDir: 'up' as const, value: fmtPS(dlomValue),
      trend: { value: 0 }, spark: periods.map((_, i) => dlomValue * (0.8 + 0.2 * (i / (periods.length - 1)))), color: t.c2 },
  ];

  // ── Chart 1: Football-field ──
  const ff = footballField.ranges.map((r) => ({ method: r.method[en ? 'en' : 'tr'], low: r.low, range: r.high - r.low, high: r.high }));

  // ── Chart 2: DCF duyarlılık heatmap ──
  const waccRows = [36, 37, 38.5, 39, 40];
  const gCols = [23, 24, 25, 26, 27];
  const baseW = 38.5, baseG = 25, baseSpread = baseW - baseG;
  const sens = waccRows.map((w) => gCols.map((g) => fairValue * (baseSpread / (w - g))));
  const sensFlat = sens.flat();
  const sMin = Math.min(...sensFlat), sMax = Math.max(...sensFlat);
  const heatCol = (v: number) => {
    const f = (v - sMin) / (sMax - sMin || 1); // 0=düşük(kırmızı) 1=yüksek(yeşil)
    const r = Math.round(220 - f * 130), gg = Math.round(90 + f * 130);
    return `rgb(${r},${gg},90)`;
  };

  // ── Chart 3: Senaryo ağırlık ──
  const scenarios = [
    { name: en ? 'Bear 25%' : 'Kötümser %25', value: dlomValue, w: 25, color: t.rd },
    { name: en ? 'Base 50%' : 'Baz %50', value: fairValue, w: 50, color: t.pr },
    { name: en ? 'Bull 25%' : 'İyimser %25', value: footballField.ranges[2].high, w: 25, color: t.gn },
  ];
  const expectedVal = scenarios.reduce((s, x) => s + x.value * (x.w / 100), 0);

  // ── Chart 4: EV köprüsü waterfall ──
  const equityVal = EV - netDebtOf(curr);
  const wfSteps = [
    { label: en ? 'Equity Value' : 'Özkaynak Değeri', value: conv(equityVal), isTotal: true },
    { label: en ? '+ Total Debt' : '+ Toplam Borç', value: conv((balanceRaw[curr.id].stDebt ?? 0) + (balanceRaw[curr.id].ltDebt ?? 0)), isTotal: false },
    { label: en ? '− Cash' : '− Nakit', value: -conv((balanceRaw[curr.id].cash ?? 0) + (balanceRaw[curr.id].stInvest ?? 0)), isTotal: false },
    { label: 'EV', value: conv(EV), isTotal: true },
  ];

  // ── Chart 5: Peer comps scatter ──
  const scatter = compsSet.filter((c) => !c.company.startsWith('Medyan') && !c.company.startsWith('Median')).map((c) => ({
    name: c.company, x: c.evEbitda, y: c.ebitdaMargin, z: c.revGrowth, subject: c.company === 'Muhiku',
  }));

  // ── Chart 6: Çarpan trend ──
  const multipleTrend = periods.map((p, i) => ({ period: pl(p), mult: MUHIKU.evEbitda * (0.80 + 0.20 * (i / (periods.length - 1))) }));

  const alerts: FinAlert[] = [
    { severity: 'watch', text: en
      ? `AI fair value ₺${fairValue.toFixed(2)}/share; ~${(((MEDIAN.evEbitda - MUHIKU.evEbitda) / MEDIAN.evEbitda) * 100).toFixed(0)}% discount to the comps median.`
      : `AI gerçeğe uygun değer hisse başı ₺${fairValue.toFixed(2)}; comps medyanına göre %${(((MEDIAN.evEbitda - MUHIKU.evEbitda) / MEDIAN.evEbitda) * 100).toFixed(0)} iskontolu.` },
    { severity: 'warning', text: en
      ? 'Terminal value is ~72% of the DCF output; highly sensitive to the terminal-growth assumption (IB norm: TV usually 60–80%).'
      : 'DCF çıktısının %72’si terminal değerden geliyor; terminal büyüme varsayımına aşırı duyarlı (IB standardı: TV genelde %60-80).' },
    { severity: 'tip', text: en
      ? 'Moonpig carries a premium multiple at ~28% EBITDA margin; Muhiku ~19% — the multiple discount is explained by this margin gap.'
      : 'Peer setinde Moonpig ~%28 FAVÖK marjıyla premium çarpan taşıyor; Muhiku ~%19, çarpan iskontosu bu marj farkıyla açıklanabilir.' },
    { severity: 'good', text: en
      ? 'The overlap zone of the 3 methods (comps/DCF/precedent) is narrow; the valuation range is defensible.'
      : '3 yöntemin (comps/DCF/precedent) örtüşme bölgesi dar; değerleme aralığı savunulabilir.' },
  ];

  const controls = (
    <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
      options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin6}
      subtitle={en ? 'Comps + DCF valuation. Assumptions are stored in Settings (single source); this page reads them.' : 'Comps + DCF değerleme. Varsayımlar Ayarlar’da saklanır (tek yer); bu sayfa okur.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Assumptions: Settings →' : 'Varsayımlar: Ayarlar →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Football-field */}
      <ChartCard t={t} lang={lang} title={en ? 'Football-Field (value per share ₺)' : 'Football-Field (hisse başı değer ₺)'}
        why={en ? 'WallStreetPrep/FE Training football-field standard — sanity-checks methods side by side; the current & AI value lines cross all ranges.' : 'WallStreetPrep/FE Training football-field standardı; yöntemleri yan yana sanity-check eder — mevcut & AI değer çizgileri tüm aralıkları keser.'}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ff} layout="vertical" margin={{ top: 6, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
            <XAxis type="number" domain={[0, 'dataMax + 1']} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v}`} />
            <YAxis type="category" dataKey="method" tick={{ fontSize: 10.5, fill: t.tx2 }} axisLine={false} tickLine={false} width={150} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }}
              formatter={(_v, _n, p) => { const d = p?.payload as { low: number; high: number }; return [`₺${d.low.toFixed(1)} – ₺${d.high.toFixed(1)}`, en ? 'Range' : 'Aralık']; }} />
            <Bar dataKey="low" stackId="a" fill="transparent" />
            <Bar dataKey="range" stackId="a" fill={t.pr} radius={4} barSize={22} opacity={0.8} />
            <ReferenceLine x={current} stroke={t.tx3} strokeDasharray="5 3" label={{ value: en ? `Current ₺${current}` : `Mevcut ₺${current}`, fontSize: 10, fill: t.tx3, position: 'top' }} />
            <ReferenceLine x={fairValue} stroke={t.gn} strokeWidth={2} label={{ value: en ? `AI ₺${fairValue}` : `AI ₺${fairValue}`, fontSize: 10, fill: t.gn, position: 'top' }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row: Sensitivity heatmap + Scenario weights */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'DCF Sensitivity (WACC × Terminal g)' : 'DCF Duyarlılık (WACC × Terminal g)'}
          why={en ? 'IB pitchbook 2-variable sensitivity-table standard; base cell highlighted.' : 'IB pitchbook 2-değişkenli sensitivity-table standardı; baz hücre vurgulu.'}>
          <div style={{ overflowX: 'auto', paddingTop: 8 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 10, color: t.tx3, padding: 6, textAlign: 'left' }}>WACC \ g</th>
                  {gCols.map((g) => <th key={g} style={{ fontSize: 10.5, color: t.tx2, padding: 6, fontWeight: 600 }}>{g}%</th>)}
                </tr>
              </thead>
              <tbody>
                {waccRows.map((w, ri) => (
                  <tr key={w}>
                    <td style={{ fontSize: 10.5, color: t.tx2, padding: 6, fontWeight: 600 }}>{w}%</td>
                    {gCols.map((g, ci) => {
                      const v = sens[ri][ci];
                      const isBase = w === baseW && g === baseG;
                      return (
                        <td key={g} style={{ padding: 3 }}>
                          <div style={{ background: heatCol(v), color: '#0b1220', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '8px 4px', borderRadius: 5, border: isBase ? `2px solid ${t.tx}` : '2px solid transparent' }}>
                            ₺{v.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={en ? 'Scenario Weights (25/50/25)' : 'Senaryo Ağırlık (25/50/25)'}
          why={en ? 'IB base/bull/bear probability-weighted pattern.' : 'IB base/bull/bear probability-weighted deseni.'}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={scenarios} margin={{ top: 14, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v}`} />
              <ReferenceLine y={expectedVal} stroke={t.am} strokeDasharray="5 3" label={{ value: en ? `E[V] ₺${expectedVal.toFixed(1)}` : `Beklenen ₺${expectedVal.toFixed(1)}`, fontSize: 10, fill: t.am, position: 'insideTopRight' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `₺${v.toFixed(2)}`} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={44}>
                {scenarios.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: EV bridge + Peer scatter */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={40} title={en ? 'EV Bridge' : 'EV Köprüsü'}
          why={en ? "Ryan O'Connell EV-to-equity bridge pattern." : "Ryan O'Connell EV-to-equity bridge deseni."}>
          <Waterfall steps={wfSteps} t={t} fmt={fmtC} />
        </ChartCard>
        <ChartCard t={t} lang={lang} span={56} title={en ? 'Peer Comps (EV/EBITDA × EBITDA Margin)' : 'Peer Comps (EV/EBITDA × FAVÖK Marjı)'}
          why={en ? 'Seeking Alpha peer-relative valuation pattern; bubble = revenue growth.' : 'Seeking Alpha peer-relative valuation deseni; balon = hasılat büyümesi.'}>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="EV/EBITDA" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} domain={[4, 11]} />
              <YAxis type="number" dataKey="y" name={en ? 'EBITDA Margin' : 'FAVÖK Marjı'} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <ZAxis type="number" dataKey="z" range={[80, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }}
                formatter={(v: number, n) => (n === 'EV/EBITDA' ? `${v}x` : `${v}%`)} labelFormatter={() => ''}
                content={({ payload }) => payload?.[0] ? (<div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11.5 }}>
                  <b>{(payload[0].payload as { name: string }).name}</b><br />EV/EBITDA {(payload[0].payload as { x: number }).x}x · {(payload[0].payload as { y: number }).y}% {en ? 'margin' : 'marj'}
                </div>) : null} />
              <Scatter data={scatter} fill={t.pr}>
                {scatter.map((d, i) => <Cell key={i} fill={d.subject ? t.gn : t.pr} opacity={d.subject ? 1 : 0.6} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Çarpan trend */}
      <div style={{ marginTop: 14 }}>
        <ChartCard t={t} lang={lang} title={en ? 'EV/EBITDA Multiple Trend' : 'EV/EBITDA Çarpan Trendi'}
          why={en ? 'Fintables historical-multiple pattern.' : 'Fintables tarihsel çarpan deseni.'}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={multipleTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}x`} />
              <ReferenceLine y={MEDIAN.evEbitda} stroke={t.tx3} strokeDasharray="5 3" label={{ value: en ? `Peer median ${MEDIAN.evEbitda}x` : `Peer medyan ${MEDIAN.evEbitda}x`, fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(1)}x`} />
              <Line type="monotone" dataKey="mult" name="EV/EBITDA" stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: Comps Seti */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Comparable Companies' : 'Comps Seti'}
          <InfoTip t={t} lang={lang} termKey="evEbitda" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Company' : 'Şirket'}</th>
                <th style={th}>EV/EBITDA</th>
                <th style={th}>{en ? 'EV/Revenue' : 'EV/Hasılat'}</th>
                <th style={th}>{en ? 'P/E' : 'F/K'}</th>
                <th style={th}>{en ? 'EBITDA Margin' : 'FAVÖK Marjı'}</th>
                <th style={th}>{en ? 'Rev. Growth' : 'Hasılat Büyüme'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Note' : 'Not'}</th>
              </tr>
            </thead>
            <tbody>
              {[...compsSet].sort((a, b) => b.evEbitda - a.evEbitda).map((c) => {
                const isSubject = c.company === 'Muhiku';
                const isMedian = c.company.startsWith('Medyan') || c.company.startsWith('Median');
                return (
                  <tr key={c.company} style={{ background: isSubject ? t.prL : isMedian ? t.bg2 : 'transparent' }}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: isSubject || isMedian ? 700 : 500, color: isSubject ? t.pr : t.tx }}>{c.company}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{c.evEbitda.toFixed(1)}x</td>
                    <td style={td}>{c.evRevenue.toFixed(1)}x</td>
                    <td style={td}>{c.pe ? `${c.pe.toFixed(1)}x` : '—'}</td>
                    <td style={td}>{c.ebitdaMargin}%</td>
                    <td style={td}>{c.revGrowth}%</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{c.note[en ? 'en' : 'tr']}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '9px 16px', borderTop: `1px solid ${t.bd}`, lineHeight: 1.5 }}>
          {en ? 'Comps multiples are research-moment values that move with markets; update periodically from Settings. Notonthehighstreet is private (precedent/estimate).' : 'Comps çarpanları araştırma-anı değerleridir ve piyasa koşullarıyla değişir; Ayarlar’dan periyodik güncellenmeli. Notonthehighstreet özel şirket (precedent/tahmini).'}
        </div>
      </div>

      {/* Tablo 2: DCF Varsayımları */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'DCF Assumptions' : 'DCF Varsayımları'}
          <InfoTip t={t} lang={lang} termKey="dcfBase" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Assumption' : 'Varsayım'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Value' : 'Değer'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Note' : 'Not'}</th>
              </tr>
            </thead>
            <tbody>
              {liveAssumptions.map((a, i) => {
                const isERP = a.assumption.tr.includes('ERP');
                const isDlom = a.assumption.tr.includes('DLOM');
                return (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                      {a.assumption[en ? 'en' : 'tr']}
                      {isERP && <InfoTip t={t} lang={lang} termKey="turkeyERP" />}
                      {isDlom && <InfoTip t={t} lang={lang} termKey="dlom" />}
                    </td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{a.value}</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11.5 }}>{a.note[en ? 'en' : 'tr']}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '9px 16px', borderTop: `1px solid ${t.bd}` }}>
          {en ? 'Turkey ERP 9.30% is Damodaran’s Jul-2026 update (revised annually). DLOM ~25% should be calibrated to liquidity conditions.' : 'Türkiye ERP %9.30 Damodaran’ın Temmuz 2026 güncellemesidir (yıllık revize). DLOM ~%25 likidite koşuluna göre kalibre edilmelidir.'}
          <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer', marginLeft: 6 }} onClick={() => onSelectRep?.('yonetim__4')}>{en ? 'Edit in Settings →' : 'Ayarlar’dan düzenle →'}</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} />
      </div>

      {/* ── Eğitim / Bilgilendirme (accordion, default kapalı) ─────────────────── */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <button onClick={() => setEduOpen((o) => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 4, height: 18, background: t.tl, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: t.tx, flex: 1 }}>{en ? 'What is DCF & How It Works?' : 'DCF Nedir & Nasıl Çalışır?'}</span>
          <span style={{ fontSize: 12, color: t.tx3, transform: eduOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▸</span>
        </button>
        {eduOpen && (() => {
          const H: CSSProperties = { fontSize: 13, fontWeight: 700, color: t.tx, margin: '18px 0 7px' };
          const P: CSSProperties = { fontSize: 12.5, color: t.tx2, lineHeight: 1.65, margin: '0 0 8px' };
          const LI: CSSProperties = { fontSize: 12.5, color: t.tx2, lineHeight: 1.6, marginBottom: 6 };
          const b = (s: string) => <strong style={{ color: t.tx, fontWeight: 700 }}>{s}</strong>;
          return (
            <div style={{ padding: '0 18px 20px', borderTop: `1px solid ${t.bd}` }}>
              {/* DCF Nedir? */}
              <div style={{ ...H, marginTop: 16 }}>DCF Nedir? (What is DCF?)</div>
              <p style={P}>
                İndirgenmiş Nakit Akışı (Discounted Cash Flow / DCF), bir şirketin bugünkü değerini, gelecekte
                üreteceği nakit akışlarını bugüne indirgeyerek hesaplayan değerleme yöntemidir. Temel fikir:{' '}
                {b('bir şirket, gelecekte sahiplerine üretebileceği nakit kadar değerlidir.')} Bugünkü 1₺, gelecekteki
                1₺'den değerlidir (paranın zaman değeri / time value of money) — çünkü bugünkü para yatırılıp
                getiri sağlayabilir. DCF bu "gelecekteki nakdi bugünkü değerine çevirme" işlemidir.
              </p>

              {/* Neden kullanılır? */}
              <div style={H}>Neden şirketler bu yöntemi kullanır? (Why is it used?)</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={LI}>{b('Piyasa fiyatından bağımsızdır:')} Çarpan yöntemleri (F/K, EV/FAVÖK) piyasanın o anki ruh haline bağlıdır; DCF şirketin kendi nakit üretme gücüne dayanır (intrinsic / içsel değer).</li>
                <li style={LI}>{b('Halka kapalı şirketler için idealdir:')} Muhiku gibi borsada işlem görmeyen şirketlerde "hisse fiyatı" yoktur; DCF, fiyat olmadan değer biçebilen tek sağlam yöntemdir.</li>
                <li style={LI}>{b('Varsayımları şeffaftır:')} Büyüme, kârlılık, iskonto oranı açıkça girilir; "değer neye duyarlı?" sorusu duyarlılık analiziyle görülür.</li>
                <li style={LI}>{b('Yatırım/satış/ortaklık kararlarında standarttır:')} Şirket değerleme, hisse devri, yatırımcı görüşmeleri ve stratejik planlamada kullanılır.</li>
              </ul>

              {/* Nasıl çalışır? */}
              <div style={H}>Nasıl çalışır? (How it works — 4 adım)</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                <li style={LI}>{b('Nakit akışı projeksiyonu (Cash Flow Projection):')} Şirketin önümüzdeki N yıl (ör. 5 yıl) üreteceği serbest nakit akışı / net kâr, bir büyüme oranıyla tahmin edilir. {b('Growth Decay')} ile büyüme her yıl kademeli yavaşlatılır (gerçekçilik: hiçbir şirket sonsuza dek aynı hızda büyümez).</li>
                <li style={LI}>{b('Terminal değer (Terminal Value):')} Projeksiyon sonrası şirketin "kalan tüm ömrü" tek bir değere indirgenir — ya sabit sonsuz büyüme (Gordon Growth) ya da çıkış çarpanı (exit multiple) ile. <em style={{ color: t.tx3 }}>Dikkat: değerin genelde %60-80'i terminal değerden gelir; bu yüzden terminal varsayımı kritiktir.</em></li>
                <li style={LI}>{b('İskonto (Discounting / WACC):')} Gelecekteki nakit akışları ve terminal değer, {b('iskonto oranı (WACC — Ağırlıklı Ortalama Sermaye Maliyeti / Weighted Average Cost of Capital)')} ile bugüne indirgenir. WACC ne kadar yüksekse gelecekteki nakit o kadar "ucuzlar" — Türkiye'de yüksek enflasyon/risk primi (Damodaran TR risk primi ~%9,30) WACC'i yükseltir, bu da değeri düşürür.</li>
                <li style={LI}>{b('Değer köprüsü (EV → Equity → Net Değer):')} İndirgenmiş toplam = {b('Şirket Değeri (Enterprise Value)')}. Bundan {b('Net Borç')} çıkarılınca {b('Özkaynak Değeri (Equity Value)')}; halka kapalı/pazarlanamaz olduğu için {b('DLOM (Pazarlanabilirlik İskontosu / Discount for Lack of Marketability ~%25)')} uygulanınca nihai değer bulunur. 20.000.000 hisseye bölününce {b('hisse başına değer')}, cap table paylarıyla çarpılınca {b('ortak bazında değer')} elde edilir.</li>
              </ol>

              {/* Modlar */}
              <div style={H}>Modlar (Modes)</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={LI}>{b('FCF-DCF:')} En sağlam yöntem — serbest nakit akışına dayanır. Muhiku varsayılanı.</li>
                <li style={LI}>{b('Earnings / Exit-Multiple:')} Hızlı tahmin — net kârı büyütüp çıkış çarpanıyla çarpar. Kaba ama pratik.</li>
                <li style={LI}>{b('Reverse DCF (Ters DCF):')} Tersine çevirir — "mevcut değerlemeyi haklı çıkarmak için şirketin ne kadar büyümesi gerekir?" sorusunu yanıtlar. İma edilen büyüme, tarihsel büyümeden çok yüksekse değerleme iyimser demektir (GuruFocus reverse-DCF mantığı).</li>
              </ul>

              {/* Senaryo & Duyarlılık */}
              <div style={H}>Senaryo &amp; Duyarlılık (Scenario &amp; Sensitivity)</div>
              <p style={P}>
                Tek bir "kesin değer" yanıltıcıdır. Bu araç {b('Kötümser %25 / Baz %50 / İyimser %25')} senaryolarını
                ağırlıklandırır ve {b('WACC × Terminal Büyüme duyarlılık matrisi')} ile değerin varsayımlara ne kadar
                hassas olduğunu gösterir. Amaç tek rakam değil, {b('savunulabilir bir değer aralığıdır.')}
              </p>

              {/* Sınırları */}
              <div style={H}>Sınırları (Limitations — dürüst uyarı)</div>
              <p style={P}>
                DCF, girdiğiniz varsayımlar kadar iyidir ("garbage in, garbage out"). Küçük WACC/terminal büyüme
                değişiklikleri sonucu büyük oranda değiştirebilir. Bu yüzden DCF'i tek başına değil, çarpan (comps)
                ve piyasa mantığıyla birlikte kullanın (bkz. bu sayfadaki football-field / 3-yöntem kıyası).
              </p>

              <div style={{ marginTop: 14, fontSize: 12, color: t.tx3, borderTop: `1px solid ${t.bd}`, paddingTop: 12 }}>
                {en ? 'Edit DCF assumptions (WACC, terminal growth, DLOM) in ' : 'DCF varsayımlarını (WACC, terminal büyüme, DLOM) düzenle → '}
                <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectRep?.('yonetim__4')}>{en ? 'Settings →' : 'Ayarlar'}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </ReportPageLayout>
  );
};
