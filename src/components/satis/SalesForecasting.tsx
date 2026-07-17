import type { Theme, LangStrings, Lang, Panel } from '../../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell,
  PieChart, Pie,
} from 'recharts';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { Icon } from '../ui/Icon';
import { tTerm } from '../../i18n/terms';
import { fmtMonth } from '../../utils/format';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const forecastData = [
  { month: 'Oca', actual: 2800, pipeline: null, predicted: null, lastYear: 2400, target: 3500 },
  { month: 'Şub', actual: 3100, pipeline: null, predicted: null, lastYear: 2600, target: 3500 },
  { month: 'Mar', actual: 3400, pipeline: null, predicted: null, lastYear: 2900, target: 3500 },
  { month: 'Nis', actual: 3200, pipeline: null, predicted: null, lastYear: 2700, target: 3500 },
  { month: 'May', actual: 3600, pipeline: null, predicted: null, lastYear: 3000, target: 3500 },
  { month: 'Haz', actual: 3500, pipeline: null, predicted: null, lastYear: 2800, target: 3500 },
  { month: 'Tem', actual: 3300, pipeline: null, predicted: null, lastYear: 2600, target: 3500 },
  { month: 'Ağu', actual: 3800, pipeline: 3800, predicted: null, lastYear: 3200, target: 3500 },
  { month: 'Eyl', actual: null, pipeline: 4100, predicted: 3600, lastYear: 3400, target: 3500 },
  { month: 'Eki', actual: null, pipeline: 4400, predicted: 3900, lastYear: 3800, target: 3500 },
  { month: 'Kas', actual: null, pipeline: 4800, predicted: 4200, lastYear: 4200, target: 3500 },
  { month: 'Ara', actual: null, pipeline: 5200, predicted: 4600, lastYear: 4800, target: 3500 },
];

const funnelStages = [
  { stage: 'Qualified Opps', value: 1082500 },
  { stage: 'Assessment Scheduled', value: 91200 },
  { stage: 'Assessment Done', value: 1930800 },
  { stage: 'Setup Help Scheduled', value: 286000 },
  { stage: 'Setup Help Completed', value: 801000 },
  { stage: 'Ongoing Setup', value: 1366200 },
  { stage: 'Bought In', value: 4334400 },
  { stage: 'Closed Won', value: 12200000 },
];
const funnelTotal = funnelStages.reduce((s, f) => s + f.value, 0);
const funnelMax = Math.max(...funnelStages.map((f) => f.value));

interface QoQRow {
  donem: string; winRate: string; created: number; value: string; companies: number; inPipeline: number; dealRate: string;
}
const qoqData: QoQRow[] = [
  { donem: 'Q4 2024', winRate: '%1,07', created: 124, value: '$137.400', companies: 1384, inPipeline: 29, dealRate: '%1,15' },
  { donem: 'Q3 2024', winRate: '%1,13', created: 198, value: '$47.555', companies: 1113, inPipeline: 209, dealRate: '%2,21' },
  { donem: 'Q2 2025', winRate: '%6,08', created: 71, value: '$171.000', companies: 3130, inPipeline: 176, dealRate: '%1,20' },
  { donem: 'Q2 2024', winRate: '%1,17', created: 171, value: '$53.519', companies: 3594, inPipeline: 59, dealRate: '%6,34' },
  { donem: 'Q1 2025', winRate: '%1,20', created: 191, value: '$148.200', companies: 2046, inPipeline: 185, dealRate: '%1,45' },
  { donem: 'Toplam', winRate: '%1,57', created: 755, value: '$557.700', companies: 11267, inPipeline: 658, dealRate: '%1,54' },
];

const dealsWonQ = [
  { q: 'Q1 25', val: 137 },
  { q: 'Q2 25', val: 213 },
  { q: 'Q3 25', val: 246 },
  { q: 'Q4 25', val: 248 },
  { q: 'Q1 26', val: 250 },
];

const inboundACV = [
  { q: 'Q1 25', val: 77966 },
  { q: 'Q2 25', val: 99051 },
  { q: 'Q3 25', val: 121200 },
  { q: 'Q4 25', val: 191800 },
  { q: 'Q1 26', val: 199200 },
];

interface RepTarget {
  name: string; hedef: number; gerceklesen: number; color: string;
}
const repTargets: RepTarget[] = [
  { name: 'Ayşe Kara', hedef: 1620000, gerceklesen: 1820000, color: '#16A34A' },
  { name: 'Mehmet Demir', hedef: 1600000, gerceklesen: 1540000, color: '#3B82F6' },
  { name: 'Elif Sarı', hedef: 1580000, gerceklesen: 1438908, color: '#7C3AED' },
  { name: 'Can Yılmaz', hedef: 1560000, gerceklesen: 1280000, color: '#D97706' },
  { name: 'Burak Aydın', hedef: 1540000, gerceklesen: 890000, color: '#DC2626' },
];
const teamHedef = repTargets.reduce((s, r) => s + r.hedef, 0);
const teamGercek = repTargets.reduce((s, r) => s + r.gerceklesen, 0);

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const fmtDollar = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toLocaleString('en-US')}`;

const barColor = (pct: number) =>
  pct >= 100 ? '#16A34A' : pct >= 80 ? '#22C55E' : pct >= 60 ? '#D97706' : '#DC2626';

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesForecasting = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  const goalPct = 89;

  return (
    <>
      {/* ── Section 1: FORECAST METRİKLERİ ───────────────────────────────────── */}
      <SectionHeader title={l.fcMetrikler ?? 'FORECAST METRİKLERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="fc-hedef" title={l.fcCeyrekHedef ?? 'Çeyreklik Hedef'} value="42.000.000 ₺" trendValue="Q4 2025 gelir hedefi" sparkTrend="flat" color="c1" unit="K ₺" big {...kp} />
        <KPICard id="fc-ytd" title={l.fcGerceklesen ?? 'Gerçekleşen (YTD)'} value="31.500.000 ₺" trendValue="+18,3%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="fc-ulasim" title={l.fcUlasim ?? 'Hedefe Ulaşım %'} value="%75" trendValue="+4,2pp" sparkTrend="up" color="tl" unit="%" big {...kp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="fc-ai" title={l.fcAIForecast ?? 'AI Forecast (Çeyrek Sonu)'} value="38.800.000 ₺" trendValue="AI tahmini bu çeyrek sonu" sparkTrend="up" color="pr" unit="K ₺" {...kp} />
        <KPICard id="fc-gap" title={l.fcGap ?? 'Gap to Target'} value="3.200.000 ₺" trendValue="Hedef - Forecast farkı" sparkTrend="down" color="rd" unit="K ₺" {...kp} />
        <KPICard id="fc-accuracy" title={l.fcAccuracy ?? 'Forecast Accuracy (Son Q)'} value="%87,3" trendValue="+2,1pp" sparkTrend="up" color="gn" unit="%" info={l.fcAccuracyInfo ?? 'Geçen çeyrek isabeti'} {...kp} />
      </div>

      {/* ── Section 2: PREDICTIVE SALES FORECAST ─────────────────────────────── */}
      <SectionHeader title={l.fcPredictive ?? 'PREDICTIVE SALES FORECAST'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.fcPredictiveChart ?? 'Satış Tahmin Grafiği'} id="fc-chart-predict" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={forecastData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} domain={[0, 6000]} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number | null, name: string) => value !== null ? [`${value}K ₺`, name] : ['-', name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              {/* Target horizontal line */}
              <Line type="monotone" dataKey="target" name={lang === 'tr' ? 'Hedef' : 'Target'} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="8 4" dot={false} connectNulls />
              {/* Last year */}
              <Line type="monotone" dataKey="lastYear" name={lang === 'tr' ? 'Geçen Yıl' : 'Last Year'} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
              {/* Predicted Won */}
              <Line type="monotone" dataKey="predicted" name={lang === 'tr' ? 'Predicted Won' : 'Predicted Won'} stroke="#0D9488" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: '#0D9488' }} connectNulls />
              {/* Weighted Pipeline */}
              <Line type="monotone" dataKey="pipeline" name={lang === 'tr' ? 'Weighted Pipeline' : 'Weighted Pipeline'} stroke="#4F46E5" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, fill: '#4F46E5' }} connectNulls />
              {/* Actual */}
              <Line type="monotone" dataKey="actual" name={lang === 'tr' ? 'Gerçekleşen' : 'Actual'} stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4, fill: '#4F46E5' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 3: FORECAST FUNNEL & QOQ ─────────────────────────────────── */}
      <SectionHeader title={l.fcFunnelQoQ ?? 'FORECAST FUNNEL & QOQ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Forecast Funnel */}
        <ChartContainer t={t} l={l} title={l.fcFunnel ?? 'Forecast Funnel (Stage Bazlı)'} id="fc-chart-funnel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          {/* Summary header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', background: t.bg2, borderRadius: 8 }}>
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <ResponsiveContainer width={44} height={44}>
                <PieChart>
                  <Pie data={[{ v: goalPct }, { v: 100 - goalPct }]} cx="50%" cy="50%" innerRadius={15} outerRadius={20} dataKey="v" strokeWidth={0}>
                    <Cell fill={t.pr} />
                    <Cell fill={t.bg2} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: t.pr }}>%{goalPct}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tx }}>Forecast: {fmtTL(funnelTotal)}</div>
              <div style={{ fontSize: 10, color: t.tx2 }}>%{goalPct} Goal</div>
            </div>
          </div>
          {/* Stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {funnelStages.map((s) => {
              const pct = (s.value / funnelMax) * 100;
              return (
                <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: t.tx2, width: 120, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.stage}</span>
                  <div style={{ flex: 1, height: 14, background: t.bg2, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: t.pr, borderRadius: 4, opacity: 0.7 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: t.tx, width: 72, textAlign: 'right', flexShrink: 0 }}>{fmtTL(s.value)}</span>
                </div>
              );
            })}
          </div>
        </ChartContainer>

        {/* QoQ Table */}
        <ChartContainer t={t} l={l} title={l.fcQoQ ?? 'Quarter-over-Quarter Performans'} id="fc-chart-qoq" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.bd}` }}>
                  {['Dönem', 'Win Rate', 'Created', 'Deal Value', 'Companies', 'In Pipeline', 'Deal Rate'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', fontSize: 9, fontWeight: 600, color: t.tx2, textAlign: h === 'Dönem' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{tTerm(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qoqData.map((r) => {
                  const isTotal = r.donem === 'Toplam';
                  return (
                    <tr key={r.donem} style={{ borderBottom: `1px solid ${t.bd}`, background: isTotal ? t.bg2 : 'transparent' }}>
                      <td style={{ padding: '6px 8px', fontSize: 10, fontWeight: isTotal ? 700 : 500, color: t.tx }}>{r.donem}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', color: t.tx }}>{r.winRate}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', color: t.tx }}>{r.created}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', fontWeight: 500, color: t.tx }}>{r.value}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', color: t.tx }}>{r.companies.toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', color: t.tx }}>{r.inPipeline}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, textAlign: 'right', color: t.tx }}>{r.dealRate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 4: DEALS WON & INBOUND ACV ───────────────────────────────── */}
      <SectionHeader title={l.fcDealsACV ?? 'DEALS WON & INBOUND ACV'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.fcDealsWon ?? 'Çeyreklik Kazanılan Deal Sayısı'} id="fc-chart-dealswon" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dealsWonQ} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} deal`, '']} />
              <Bar dataKey="val" name={tTerm("Kazanılan Deal'lar")} fill={t.tl} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.fcInboundACV ?? 'Inbound ACV (Çeyreklik)'} id="fc-chart-acv" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={inboundACV} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtDollar(v)} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString('en-US')}`, '']} />
              <Bar dataKey="val" name="Inbound ACV" fill={t.pr} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 5: HEDEF TAKİP PANELİ ────────────────────────────────────── */}
      <SectionHeader title={l.fcHedefTakip ?? 'UZMAN BAZLI HEDEF TAKİBİ — Q4 2025'} t={t} />

      {/* Team total */}
      <div style={{
        background: '#EEF2FF', border: `1px solid ${t.bd}`, borderRadius: 10,
        padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: t.tx2, marginBottom: 2 }}>{lang === 'tr' ? 'Ekip Toplamı' : 'Team Total'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.tx }}>
            {fmtTL(teamGercek)} <span style={{ fontSize: 12, fontWeight: 400, color: t.tx2 }}>/ {fmtTL(teamHedef)}</span>
          </div>
        </div>
        <div style={{ width: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 10, background: '#C7D2FE', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${(100 / 120) * 100}%`, top: 0, bottom: 0, width: 1.5, background: '#4F46E5', opacity: 0.4 }} />
              <div style={{ height: '100%', width: `${Math.min(Math.round(teamGercek / teamHedef * 100), 120) / 120 * 100}%`, background: barColor(Math.round(teamGercek / teamHedef * 100)), borderRadius: 5 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: barColor(Math.round(teamGercek / teamHedef * 100)) }}>%{Math.round(teamGercek / teamHedef * 100)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Kalan' : 'Remaining'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.am }}>{fmtTL(teamHedef - teamGercek)}</div>
        </div>
      </div>

      {/* Per-rep cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {repTargets.map((r) => {
          const pct = Math.round(r.gerceklesen / r.hedef * 100);
          const kalan = r.hedef - r.gerceklesen;
          const isOver = pct >= 100;
          return (
            <div key={r.name} style={{
              background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10,
              padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 140, flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.name.split(' ').map((w) => w[0]).join('')}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{r.name}</span>
              </div>
              {/* Hedef */}
              <div style={{ width: 110, flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: t.tx3 }}>{lang === 'tr' ? 'Hedef' : 'Target'}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: t.tx }}>{fmtTL(r.hedef)}</div>
              </div>
              {/* Gerçekleşen */}
              <div style={{ width: 110, flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: t.tx3 }}>{lang === 'tr' ? 'Gerçekleşen' : 'Actual'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{fmtTL(r.gerceklesen)}</div>
              </div>
              {/* Progress */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 8, background: t.bg2, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: `${(100 / 120) * 100}%`, top: 0, bottom: 0, width: 1, background: t.tx3, opacity: 0.3 }} />
                    <div style={{ height: '100%', width: `${Math.min(pct, 120) / 120 * 100}%`, background: barColor(pct), borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: barColor(pct), width: 32 }}>%{pct}</span>
                </div>
              </div>
              {/* Kalan */}
              <div style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: t.tx3 }}>{lang === 'tr' ? 'Kalan' : 'Remaining'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isOver ? t.gn : kalan > 500000 ? t.rd : t.am }}>
                  {isOver ? `+${fmtTL(Math.abs(kalan))} ✅` : `${fmtTL(kalan)}${kalan > 500000 ? ' ⚠️' : ''}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
