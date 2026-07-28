import { useMemo, useState, type CSSProperties } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FinCurrency } from '../../types/finance';
import type { Theme, Lang } from '../../types';
import type { DcfSettings, BaseMetric } from '../../constants/dcfData';
import { dcfDefaults, BASE_BY_METRIC, DCF_SHARES } from '../../constants/dcfData';
import { runDcf, scenarioWeighted, reverseDcf, projectCashflows, sensitivityMatrix } from '../../lib/finance/dcfEngine';
import { useDcf } from '../../context/DcfContext';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, StatusBadge, Waterfall, InfoTip, Dropdown, type FinAlert,
} from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../finance/_Placeholder';

type Mode = 'fcf' | 'exit' | 'reverse';
const FX = 44.9;
const clone = (s: DcfSettings): DcfSettings => JSON.parse(JSON.stringify(s));

// Modül düzeyi (component içinde tanımlanırsa her tuşta remount → input focus kaybı)
const DNum = ({ t, lang, label, value, onChange, step = 1, suffix, term }: { t: Theme; lang: Lang; label: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string; term?: string }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 11, fontWeight: 500, color: t.tx2, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}>{label}{suffix ? ` (${suffix})` : ''}{term && <InfoTip t={t} lang={lang} termKey={term} />}</div>
    <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12.5, boxSizing: 'border-box' }} />
  </div>
);
function DSeg<T extends string>({ t, opts, val, onChange }: { t: Theme; opts: { v: T; label: string }[]; val: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
      {opts.map((o) => <button key={o.v} onClick={() => onChange(o.v)} style={{ flex: 1, padding: '6px 8px', fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: val === o.v ? t.pr : t.cd, color: val === o.v ? '#fff' : t.tx2 }}>{o.label}</button>)}
    </div>
  );
}

export const DcfCalculator = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const dcf = useDcf();
  const [s, setS] = useState<DcfSettings>(() => clone(dcf.saved));
  const [mode, setMode] = useState<Mode>('fcf');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const [chartTab, setChartTab] = useState<'proj' | 'netkar' | 'favok' | 'bridge' | 'sens'>('proj');
  const [scenarioName, setScenarioName] = useState('');
  const [loadName, setLoadName] = useState('');

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (v: number) => (currency === 'USD' ? v / FX : v);
  const fmtC = (v: number) => { const c = conv(v); const a = Math.abs(c); const str = a >= 1e9 ? (c / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (c / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (c / 1e3).toFixed(0) + 'K' : Math.round(c).toString(); return `${sym}${str}`; };
  const fmtPS = (v: number) => `${sym}${conv(v).toFixed(2)}`;

  const set = <K extends keyof DcfSettings>(k: K, v: DcfSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setScen = (i: number, patch: Partial<DcfSettings['scenarios'][number]>) =>
    setS((p) => ({ ...p, scenarios: p.scenarios.map((sc, j) => (j === i ? { ...sc, ...patch } : sc)) }));

  // ── hesap (mod'a göre) — girdi değişince canlı ──
  const eff = mode === 'exit' ? { ...s, terminalMethod: 'exit' as const } : s;
  const res = useMemo(() => runDcf(eff), [eff]);
  const sw = useMemo(() => scenarioWeighted(eff), [eff]);
  const rev = useMemo(() => reverseDcf(eff, s.currentFairValueTRY), [eff, s.currentFairValueTRY]);
  const sens = useMemo(() => sensitivityMatrix(eff), [eff]);
  const revOptimistic = rev.impliedGrowthPct > s.historicalCagrPct;

  // ── AI uyarıları ──
  const alerts: FinAlert[] = [];
  if (res.terminalShare > 0.75) alerts.push({ severity: 'critical', text: L(
    `Değerin %${(res.terminalShare * 100).toFixed(0)}'i terminal değerden geliyor (>%75) — terminal büyüme varsayımına aşırı duyarlı. Terminal g'yi WACC'in altında ve GSYİH ile tutarlı tutun.`,
    `${(res.terminalShare * 100).toFixed(0)}% of value comes from the terminal value (>75%) — highly sensitive to the terminal-growth assumption. Keep terminal g below WACC and consistent with GDP.`) });
  else alerts.push({ severity: 'good', text: L(
    `Terminal değer payı %${(res.terminalShare * 100).toFixed(0)} (IB standardı %60-80); açık dönem projeksiyonu değeri makul taşıyor.`,
    `Terminal value share is ${(res.terminalShare * 100).toFixed(0)}% (IB norm 60-80%); the explicit period carries value reasonably.`) });
  if (mode === 'reverse') alerts.push({ severity: revOptimistic ? 'warning' : 'watch', text: L(
    `Mevcut değeri (₺${(s.currentFairValueTRY / 1e6).toFixed(0)}M) haklı çıkarmak için gereken büyüme %${rev.impliedGrowthPct.toFixed(1)}; tarihsel büyüme %${s.historicalCagrPct}. ${revOptimistic ? 'İma edilen büyüme tarihselin ÜSTÜNDE → değerleme iyimser.' : 'İma edilen büyüme tarihselin altında → ulaşılabilir.'}`,
    `Justifying the current value (₺${(s.currentFairValueTRY / 1e6).toFixed(0)}M) requires ${rev.impliedGrowthPct.toFixed(1)}% growth; historical is ${s.historicalCagrPct}%. ${revOptimistic ? 'Implied growth ABOVE historical → optimistic valuation.' : 'Implied growth below historical → achievable.'}`) });
  if (s.terminalGrowthPct >= s.waccPct) alerts.push({ severity: 'critical', text: L('Terminal büyüme ≥ WACC — Gordon formülü geçersiz (negatif/sonsuz değer). Terminal g < WACC olmalı.', 'Terminal growth ≥ WACC — Gordon formula invalid. Terminal g must be < WACC.') });
  alerts.push({ severity: 'tip', text: L('DCF tek başına değil; comps ve piyasa mantığıyla birlikte kullanın (Değerleme sayfası football-field).', 'Use DCF alongside comps and market logic, not alone (see the Valuation football-field).') });

  // ── projeksiyon grafiği (historical + projected + no-decay) ──
  const projFor = (base: number) => projectCashflows(base, s.growthPct, s.growthDecayPct, s.years);
  const histYears = 3;
  const buildSeries = (base: number) => {
    const hist = Array.from({ length: histYears }, (_, i) => {
      const k = histYears - i; const val = base / Math.pow(1 + s.historicalCagrPct / 100, k);
      return { yil: `${2026 - k}`, historical: conv(val), projected: null as number | null, noDecay: null as number | null };
    });
    const p = projFor(base);
    const proj = p.map((r) => ({ yil: `${2026 + r.year - 1}`, historical: null as number | null, projected: conv(r.cashflow), noDecay: conv(r.cashflowNoDecay) }));
    // köprü noktası (son historical = ilk projected başlangıcı)
    if (hist.length) { hist[hist.length - 1].projected = conv(base); hist[hist.length - 1].noDecay = conv(base); }
    return [...hist, ...proj];
  };
  const projData = useMemo(() => buildSeries(s.baseValueTRY), [s]);
  const netkarData = useMemo(() => buildSeries(BASE_BY_METRIC.NetKar), [s]);
  const favokData = useMemo(() => buildSeries(BASE_BY_METRIC.FAVOK), [s]);

  const bridge = [
    { label: L('Şirket Değeri', 'Enterprise Value'), value: conv(res.enterpriseValue), isTotal: true },
    { label: L('− Net Borç', '− Net Debt'), value: -conv(s.netDebtTRY), isTotal: false },
    { label: L('Özkaynak', 'Equity'), value: conv(res.equityValue), isTotal: true },
    { label: L(`− DLOM %${s.dlomPct}`, `− DLOM ${s.dlomPct}%`), value: -conv(res.equityValue * s.dlomPct / 100), isTotal: false },
    { label: L('Net Değer', 'Net Value'), value: conv(res.equityAfterDLOM), isTotal: true },
  ];

  // ── kaydet/yükle ──
  const saveSettings = () => dcf.saveToSettings(s);
  const doSaveScenario = () => { if (scenarioName.trim()) { dcf.saveScenario(scenarioName.trim(), s); setScenarioName(''); } };
  const doLoadScenario = (name: string) => { const sc = dcf.scenarios.find((x) => x.name === name); if (sc) setS(clone(sc.settings)); setLoadName(name); };
  const loadPreset = () => setS(clone(dcfDefaults));

  // ── stiller ──
  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const lbl: CSSProperties = { fontSize: 11, fontWeight: 500, color: t.tx2, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 };
  const inp: CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12.5, boxSizing: 'border-box' };
  const secTitle: CSSProperties = { fontSize: 11, fontWeight: 700, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.4, margin: '14px 0 8px' };

  const controls = (
    <div style={{ width: 300 }}>
      <DSeg t={t} opts={[{ v: 'fcf' as Mode, label: 'FCF-DCF' }, { v: 'exit' as Mode, label: L('Exit', 'Exit') }, { v: 'reverse' as Mode, label: 'Reverse' }]} val={mode} onChange={setMode} />
    </div>
  );

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.dcfCalculator ?? (en ? 'DCF Calculator' : 'DCF Calculator')}
      subtitle={L('İnteraktif DCF hesap motoru — Muhiku halka kapalı (hisse fiyatı yok). Varsayımlar Ayarlar’dan; kullanıcı override edebilir.',
        'Interactive DCF engine — Muhiku is private (no share price). Assumptions from Settings; user can override.')}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: L('Tam değerleme (comps + football-field) → Değerleme', 'Full valuation (comps + football-field) → Valuation'), onClick: () => onSelectRep?.('muhasebe__7') }}
    >
      {/* 3 kolon */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: 14, alignItems: 'start' }}>
        {/* SOL — girdi paneli */}
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.tx }}>{L('Girdiler', 'Inputs')}</div>

          <div style={secTitle}>{L('Temel Metrik', 'Base Metric')}</div>
          <DSeg t={t} opts={[{ v: 'FCF' as BaseMetric, label: 'FCF' }, { v: 'NetKar' as BaseMetric, label: L('Net Kâr', 'Net Inc.') }, { v: 'FAVOK' as BaseMetric, label: 'FAVÖK' }]}
            val={s.baseMetric} onChange={(m) => setS((p) => ({ ...p, baseMetric: m, baseValueTRY: p.autofillBase ? BASE_BY_METRIC[m] : p.baseValueTRY }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
            <DNum t={t} lang={lang} label={L('Başlangıç Değeri', 'Base Value')} value={s.baseValueTRY} step={100000} onChange={(v) => set('baseValueTRY', v)} />
            <button onClick={() => setS((p) => ({ ...p, autofillBase: !p.autofillBase, baseValueTRY: !p.autofillBase ? BASE_BY_METRIC[p.baseMetric] : p.baseValueTRY }))}
              style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, background: s.autofillBase ? t.prL : 'transparent', color: s.autofillBase ? t.pr : t.tx3, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {s.autofillBase ? L('Autofill', 'Autofill') : L('Manuel', 'Manual')}
            </button>
          </div>

          <div style={secTitle}>{L('Büyüme Dönemi', 'Growth Stage')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DNum t={t} lang={lang} label={L('Yıl', 'Years')} value={s.years} onChange={(v) => set('years', Math.max(1, Math.min(10, v)))} />
            <DNum t={t} lang={lang} label={L('Büyüme', 'Growth')} suffix="%" value={s.growthPct} step={0.5} onChange={(v) => set('growthPct', v)} />
            <DNum t={t} lang={lang} label={L('Decay', 'Decay')} suffix="%" value={s.growthDecayPct} step={1} onChange={(v) => set('growthDecayPct', v)} />
          </div>

          <div style={secTitle}>{L('Terminal Dönem', 'Terminal Stage')}</div>
          <DSeg t={t} opts={[{ v: 'gordon' as const, label: 'Gordon' }, { v: 'exit' as const, label: L('Çıkış Çarpanı', 'Exit Mult.') }]} val={eff.terminalMethod} onChange={(m) => set('terminalMethod', m)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {eff.terminalMethod === 'gordon'
              ? <DNum t={t} lang={lang} label={L('Terminal Büyüme', 'Terminal g')} suffix="%" value={s.terminalGrowthPct} step={0.25} onChange={(v) => set('terminalGrowthPct', v)} term="terminalGrowth" />
              : <DNum t={t} lang={lang} label={L('Çıkış Çarpanı', 'Exit Multiple')} suffix="x" value={s.exitMultiple} step={0.5} onChange={(v) => set('exitMultiple', v)} />}
          </div>

          <div style={secTitle}>{L('İskonto & Köprü', 'Discount & Bridge')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DNum t={t} lang={lang} label="WACC" suffix="%" value={s.waccPct} step={0.5} onChange={(v) => set('waccPct', v)} />
            <DNum t={t} lang={lang} label="DLOM" suffix="%" value={s.dlomPct} step={1} onChange={(v) => set('dlomPct', v)} term="dlom" />
          </div>
          <div style={{ marginTop: 8 }}>
            <DNum t={t} lang={lang} label={L('Net Borç', 'Net Debt')} value={s.netDebtTRY} step={500000} onChange={(v) => set('netDebtTRY', v)} />
          </div>

          <div style={secTitle}>{L('Senaryolar', 'Scenarios')}</div>
          {s.scenarios.map((sc, i) => (
            <div key={sc.key} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
              <div style={{ width: 70, fontSize: 11, color: t.tx2, paddingBottom: 6 }}>{sc.key === 'bear' ? L('Kötümser', 'Bear') : sc.key === 'base' ? L('Baz', 'Base') : L('İyimser', 'Bull')}</div>
              <DNum t={t} lang={lang} label={L('Ağırlık', 'Weight')} suffix="%" value={sc.weight} onChange={(v) => setScen(i, { weight: v })} />
              <DNum t={t} lang={lang} label={L('Büyüme', 'Growth')} suffix="%" value={sc.growthPct} step={0.5} onChange={(v) => setScen(i, { growthPct: v })} />
            </div>
          ))}

          {mode === 'reverse' && (
            <>
              <div style={secTitle}>{L('Reverse Hedefi', 'Reverse Target')}</div>
              <DNum t={t} lang={lang} label={L('Mevcut Değer (Ayarlar)', 'Current Value (Settings)')} value={s.currentFairValueTRY} step={1000000} onChange={(v) => set('currentFairValueTRY', v)} />
              <div style={{ marginTop: 8 }}><DNum t={t} lang={lang} label={L('Tarihsel Büyüme', 'Historical Growth')} suffix="%" value={s.historicalCagrPct} step={1} onChange={(v) => set('historicalCagrPct', v)} /></div>
            </>
          )}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.bd}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: 11, color: t.tx3 }}>{L('Hisse Sayısı', 'Shares')}: <b style={{ color: t.tx2 }}>{DCF_SHARES.toLocaleString('tr-TR')}</b> ({L('sabit', 'fixed')})</div>
            <button onClick={saveSettings} style={{ padding: '8px', borderRadius: 7, border: 'none', background: t.pr, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{L('Ayarlar’a Kaydet', 'Save to Settings')}</button>
            <button onClick={loadPreset} style={{ padding: '7px', borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{L('Muhiku Baz Senaryo (preset)', 'Muhiku Base Preset')}</button>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder={L('Senaryo adı', 'Scenario name')} style={{ ...inp, flex: 1 }} />
              <button onClick={doSaveScenario} style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{L('Kaydet', 'Save')}</button>
            </div>
            {dcf.scenarios.length > 0 && (
              <Dropdown t={t} label={L('Senaryo yükle', 'Load scenario')} value={loadName} width={260}
                options={dcf.scenarios.map((x) => ({ value: x.name, label: x.name }))} onChange={doLoadScenario} />
            )}
          </div>
        </div>

        {/* ORTA — analiz + AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.tx, marginBottom: 8 }}>{L('DCF Analiz Özeti', 'DCF Analysis Summary')}</div>
            <div style={{ fontSize: 13, color: t.tx2, lineHeight: 1.7 }}>
              {mode === 'reverse' ? (
                <>{L('Ayarlar’daki mevcut değeri', 'The current value in Settings')} (<b style={{ color: t.tx }}>{fmtC(s.currentFairValueTRY)}</b>) {L('haklı çıkarmak için gereken yıllık büyüme', 'requires annual growth of')} <b style={{ color: revOptimistic ? t.rd : t.gn }}>%{rev.impliedGrowthPct.toFixed(1)}</b>; {L('tarihsel büyüme', 'historical growth is')} %{s.historicalCagrPct}. {revOptimistic ? L('Bu, tarihselin üstünde — değerleme iyimser.', 'This is above historical — the valuation is optimistic.') : L('Bu, tarihselin altında — ulaşılabilir.', 'This is below historical — achievable.')}</>
              ) : (
                <>{L('Bu varsayımlarla Muhiku özkaynak değeri', 'Under these assumptions Muhiku equity value is')} <b style={{ color: t.tx }}>{fmtC(res.equityAfterDLOM)}</b> (DLOM {L('sonrası', 'applied')}); {L('senaryo-ağırlıklı', 'scenario-weighted')} <b style={{ color: t.tx }}>{fmtC(sw.value)}</b>. {L('Değerin', 'About')} <b style={{ color: res.terminalShare > 0.75 ? t.rd : t.tx }}>%{(res.terminalShare * 100).toFixed(0)}</b>{L('’i terminal değerden geliyor', ' of value comes from the terminal value')}{res.terminalShare > 0.75 ? L(' — terminal varsayımına aşırı duyarlı.', ' — highly sensitive to the terminal assumption.') : '.'} {L('Hisse başına', 'Per share')} <b style={{ color: t.pr }}>{fmtPS(res.equityAfterDLOM / DCF_SHARES)}</b>.</>
              )}
            </div>
          </div>
          <AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('DCF Uyarıları', 'DCF Alerts')} />

          {/* değişiklik geçmişi */}
          {dcf.log.length > 0 && (
            <div style={{ ...card, padding: '10px 14px', fontSize: 10.5, color: t.tx3 }}>
              <b style={{ color: t.tx2 }}>{L('Değişiklik Geçmişi', 'Change Log')}:</b>{' '}
              {dcf.log.slice(0, 4).map((e) => `${e.action} · ${e.detail}`).join('  |  ')}
            </div>
          )}
        </div>

        {/* SAĞ — sonuç KPI kartları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <KPIBand>
            <KPICard t={t} lang={lang} title={L('Şirket Değeri (EV)', 'Enterprise Value')} value={fmtC(res.enterpriseValue)} goodDir="up" />
            <KPICard t={t} lang={lang} title={L('Özkaynak Değeri', 'Equity Value')} value={fmtC(res.equityValue)} goodDir="up" />
            <KPICard t={t} lang={lang} title={L('DLOM Sonrası Değer', 'Post-DLOM Value')} value={fmtC(res.equityAfterDLOM)} goodDir="up" />
            <KPICard t={t} lang={lang} title={L('Hisse Başına', 'Per Share')} value={fmtPS(res.equityAfterDLOM / DCF_SHARES)} goodDir="up" hint={`/ ${(DCF_SHARES / 1e6)}M`} />
            <KPICard t={t} lang={lang} title={L('Senaryo-Ağırlıklı', 'Scenario-Weighted')} value={fmtC(sw.value)} goodDir="up" hint="25/50/25" />
            <KPICard t={t} lang={lang} title={L('Terminal / Büyüme', 'Terminal / Growth')} value={`${(res.terminalShare * 100).toFixed(0)}% / ${((1 - res.terminalShare) * 100).toFixed(0)}%`} goodDir="down" sparkColor={res.terminalShare > 0.75 ? t.rd : t.gn} />
          </KPIBand>
          {mode === 'reverse' && (
            <div style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 11, color: t.tx3, marginBottom: 4 }}>{L('İma Edilen Büyüme', 'Implied Growth')}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: revOptimistic ? t.rd : t.gn }}>%{rev.impliedGrowthPct.toFixed(1)}</div>
              <div style={{ marginTop: 6 }}><StatusBadge t={t} tone={revOptimistic ? 'red' : 'green'} label={revOptimistic ? L('İyimser', 'Optimistic') : L('Ulaşılabilir', 'Achievable')} /> <span style={{ fontSize: 11, color: t.tx3 }}>{L('tarihsel', 'historical')} %{s.historicalCagrPct}</span></div>
            </div>
          )}
          {/* Cap table */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Cap Table (DLOM sonrası)', 'Cap Table (post-DLOM)')}</div>
            {res.capTable.map((c) => (
              <div key={c.partner} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: `1px solid ${t.bd}`, fontSize: 12 }}>
                <span style={{ color: t.tx2 }}>{c.partner} <span style={{ color: t.tx3 }}>%{c.pct}</span></span>
                <span style={{ fontWeight: 600, color: t.tx }}>{fmtC(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALT — sekmeli projeksiyon grafikleri */}
      <div style={{ ...card, marginTop: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 4, padding: '10px 14px 0', borderBottom: `1px solid ${t.bd}`, flexWrap: 'wrap' }}>
          {([['proj', L('Nakit Akışı Projeksiyonu', 'Cash Flow Projection')], ['netkar', L('Net Kâr', 'Net Income')], ['favok', 'FAVÖK'], ['bridge', L('Değer Köprüsü', 'Value Bridge')], ['sens', L('Duyarlılık', 'Sensitivity')]] as const).map(([k, lb]) => (
            <button key={k} onClick={() => setChartTab(k)} style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: chartTab === k ? 600 : 500, border: 'none', borderBottom: `2px solid ${chartTab === k ? t.pr : 'transparent'}`, background: 'transparent', color: chartTab === k ? t.pr : t.tx2, cursor: 'pointer', marginBottom: -1 }}>{lb}</button>
          ))}
        </div>
        <div style={{ padding: 16 }}>
          {(chartTab === 'proj' || chartTab === 'netkar' || chartTab === 'favok') && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartTab === 'proj' ? projData : chartTab === 'netkar' ? netkarData : favokData} margin={{ top: 8, right: 12, bottom: 0, left: -4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                <XAxis dataKey="yil" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={52} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="historical" name={L('Geçmiş', 'Historical')} stroke={t.gn} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="projected" name={L('Projeksiyon', 'Projected')} stroke={t.pr} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="noDecay" name={L('Decay’siz', 'No decay')} stroke={t.tx3} strokeWidth={1.4} strokeDasharray="5 3" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
          {chartTab === 'bridge' && (
            <div>
              <div style={{ fontSize: 11.5, color: t.tx3, marginBottom: 8 }}>{L('EV → −Net Borç → Özkaynak → −DLOM → Net Değer', 'EV → −Net Debt → Equity → −DLOM → Net Value')}</div>
              <Waterfall steps={bridge} t={t} fmt={(c) => { const a = Math.abs(c); const str = a >= 1e6 ? (c / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (c / 1e3).toFixed(0) + 'K' : Math.round(c).toString(); return `${sym}${str}`; }} height={260} />
            </div>
          )}
          {chartTab === 'sens' && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ fontSize: 11.5, color: t.tx3, marginBottom: 8 }}>{L('WACC × Terminal Büyüme → Hisse Başına Değer (baz hücre vurgulu)', 'WACC × Terminal Growth → Per-Share Value (base cell highlighted)')}</div>
              <table style={{ borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ padding: '6px 10px', fontSize: 10.5, color: t.tx3, textAlign: 'left' }}>WACC \ g</th>
                  {sens.gAxis.map((g) => <th key={g} style={{ padding: '6px 10px', fontSize: 11, color: t.tx2, textAlign: 'right' }}>%{g}</th>)}
                </tr></thead>
                <tbody>
                  {sens.grid.map((row, ri) => {
                    const flat = sens.grid.flat(); const min = Math.min(...flat), max = Math.max(...flat);
                    return (
                      <tr key={ri}>
                        <td style={{ padding: '6px 10px', fontSize: 11, color: t.tx2, fontWeight: 600 }}>%{sens.waccAxis[ri]}</td>
                        {row.map((v, ci) => {
                          const isBase = ri === Math.floor(sens.waccAxis.length / 2) && ci === Math.floor(sens.gAxis.length / 2);
                          const norm = max > min ? (v - min) / (max - min) : 0.5;
                          return (
                            <td key={ci} style={{ padding: '7px 10px', fontSize: 11.5, textAlign: 'right', color: norm > 0.6 ? '#fff' : t.tx, background: `rgba(79,70,229,${(0.12 + norm * 0.7).toFixed(2)})`, fontWeight: isBase ? 700 : 400, outline: isBase ? `2px solid ${t.am}` : 'none' }}>
                              {fmtPS(v)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Eğitim linki (accordion KOPYALANMAZ — mevcut Değerleme accordion'ına yönlendir) */}
      <div style={{ marginTop: 14, fontSize: 12, color: t.tx3, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="externalLink" size={13} color={t.tx3} />
        {L('DCF nasıl çalışır (eğitim)?', 'How does DCF work (learn)?')}
        <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectRep?.('muhasebe__7')}>{L('→ Değerleme sayfası', '→ Valuation page')}</span>
      </div>
    </ReportPageLayout>
  );
};

export default DcfCalculator;
