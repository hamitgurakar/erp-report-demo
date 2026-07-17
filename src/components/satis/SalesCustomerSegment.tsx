import type { Theme, LangStrings, Lang, Panel } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { Icon } from '../ui/Icon';
import { useState } from 'react';
import { Spark } from '../ui/Spark';
import { mkSpk } from '../../constants/data';
import { useTranslation } from '../../i18n/LanguageContext';
import { fmtPercent, fmtRelativeDays, fmtMonth } from '../../utils/format';
import { tTerm } from '../../i18n/terms';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const donutData = [
  { name: 'Yeni Müşteri', value: 30, amount: '2.088K ₺', color: '#0D9488' },
  { name: 'Mevcut Müşteri', value: 70, amount: '4.880K ₺', color: '#4F46E5' },
];

const funnelSteps = [
  { name: 'Subscribers', count: 890, color: '#C7D2FE' },
  { name: 'Leads', count: 495, color: '#A5B4FC' },
  { name: 'MQL', count: 322, color: '#818CF8' },
  { name: 'SQL', count: 179, color: '#6366F1' },
  { name: 'Opportunities', count: 88, color: '#4F46E5' },
  { name: 'Customers', count: 20, color: '#3730A3' },
  { name: 'Evangelists', count: 4, color: '#312E81' },
];

const funnelConv = ['55,6%', '65,1%', '55,6%', '49,2%', '22,7%', '20,0%'];

const clvHistogram = [
  { range: '0-2K', count: 180 },
  { range: '2K-5K', count: 320 },
  { range: '5K-10K', count: 285 },
  { range: '10K-20K', count: 210 },
  { range: '20K-50K', count: 145 },
  { range: '50K-100K', count: 72 },
  { range: '100K+', count: 36 },
];
const maxClvCount = Math.max(...clvHistogram.map((d) => d.count));

const orderHistogram = [
  { range: '1 sipariş', count: 285 },
  { range: '2-3 sipariş', count: 340 },
  { range: '4-6 sipariş', count: 260 },
  { range: '7-10 sipariş', count: 175 },
  { range: '11-20 sipariş', count: 110 },
  { range: '21-50 sipariş', count: 52 },
  { range: '50+', count: 26 },
];
const maxOrderCount = Math.max(...orderHistogram.map((d) => d.count));
const totalOrderCustomers = orderHistogram.reduce((s, d) => s + d.count, 0);

const cohortData = [
  { cohort: 'Oca 2025', values: [100, 82, 74, 68, 62, 58] },
  { cohort: 'Şub 2025', values: [100, 85, 76, 71, 65] },
  { cohort: 'Mar 2025', values: [100, 80, 72, 67] },
  { cohort: 'Nis 2025', values: [100, 83, 75] },
  { cohort: 'May 2025', values: [100, 81] },
];
const cohortHeaders = ['Ay 0', 'Ay+1', 'Ay+2', 'Ay+3', 'Ay+4', 'Ay+5'];

const segments = [
  { name: 'Enterprise', musteri: 42, gelir: '3.830K ₺', ortSiparis: '91.190 ₺', pay: 55, trend: '+18%', color: '#4F46E5', bg: '#EEF2FF' },
  { name: 'Mid-Market', musteri: 128, gelir: '2.091K ₺', ortSiparis: '16.336 ₺', pay: 30, trend: '+8%', color: '#0D9488', bg: '#F0FDFA' },
  { name: 'Small Business', musteri: 312, gelir: '1.048K ₺', ortSiparis: '3.359 ₺', pay: 15, trend: '+3%', color: '#D97706', bg: '#FFFBEB' },
];

interface GrowingFirma {
  firma: string;
  segment: string;
  sparkTrend: 'up' | 'down' | 'flat';
  ltv: number;
  sonSatis: string;
  sonSatisGun: number;
  sonSatisUzman: string;
  buyume: number;
  sorumlu: string;
}

const growingFirmalar: GrowingFirma[] = [
  { firma: 'Trendyol', segment: 'Enterprise', sparkTrend: 'up', ltv: 210000, sonSatis: '12.03.2025', sonSatisGun: 18, sonSatisUzman: 'Mehmet D.', buyume: 48, sorumlu: 'Mehmet D.' },
  { firma: 'Hepsiburada', segment: 'Enterprise', sparkTrend: 'up', ltv: 178000, sonSatis: '08.03.2025', sonSatisGun: 22, sonSatisUzman: 'Can Y.', buyume: 42, sorumlu: 'Can Y.' },
  { firma: 'Getir', segment: 'Mid-Market', sparkTrend: 'up', ltv: 92000, sonSatis: '18.03.2025', sonSatisGun: 12, sonSatisUzman: 'Elif S.', buyume: 38, sorumlu: 'Elif S.' },
  { firma: 'Enerjisa', segment: 'Mid-Market', sparkTrend: 'up', ltv: 76000, sonSatis: '05.03.2025', sonSatisGun: 25, sonSatisUzman: 'Ayşe K.', buyume: 35, sorumlu: 'Ayşe K.' },
  { firma: 'TAV Havalimanları', segment: 'Enterprise', sparkTrend: 'up', ltv: 145000, sonSatis: '20.03.2025', sonSatisGun: 10, sonSatisUzman: 'Can Y.', buyume: 31, sorumlu: 'Can Y.' },
  { firma: 'Migros', segment: 'Mid-Market', sparkTrend: 'up', ltv: 68000, sonSatis: '22.03.2025', sonSatisGun: 8, sonSatisUzman: 'Mehmet D.', buyume: 28, sorumlu: 'Mehmet D.' },
  { firma: 'LC Waikiki', segment: 'Mid-Market', sparkTrend: 'up', ltv: 54000, sonSatis: '01.03.2025', sonSatisGun: 29, sonSatisUzman: 'Burak A.', buyume: 24, sorumlu: 'Burak A.' },
  { firma: 'Boyner', segment: 'Small', sparkTrend: 'up', ltv: 38000, sonSatis: '25.02.2025', sonSatisGun: 33, sonSatisUzman: 'Elif S.', buyume: 22, sorumlu: 'Elif S.' },
];

interface ChurnRisk {
  firma: string;
  sonAktivite: number;
  sonSatis: string;
  sonSatisGun: number;
  sonSatisUzman: string;
  risk: 'Critical' | 'High' | 'Medium';
  aksiyon: 'reengage' | 'checkin';
}

const churnRisks: ChurnRisk[] = [
  { firma: 'Horizon Medya', sonAktivite: 102, sonSatis: '18.12.2024', sonSatisGun: 102, sonSatisUzman: 'Ayşe K.', risk: 'Critical', aksiyon: 'reengage' },
  { firma: 'Swift Delivery', sonAktivite: 94, sonSatis: '26.12.2024', sonSatisGun: 94, sonSatisUzman: 'Mehmet D.', risk: 'High', aksiyon: 'checkin' },
  { firma: 'Apex Consulting', sonAktivite: 118, sonSatis: '02.12.2024', sonSatisGun: 118, sonSatisUzman: 'Can Y.', risk: 'Critical', aksiyon: 'reengage' },
  { firma: 'Metro Lojistik', sonAktivite: 78, sonSatis: '11.01.2025', sonSatisGun: 78, sonSatisUzman: 'Elif S.', risk: 'Medium', aksiyon: 'checkin' },
  { firma: 'Delta İnşaat', sonAktivite: 85, sonSatis: '04.01.2025', sonSatisGun: 85, sonSatisUzman: 'Burak A.', risk: 'High', aksiyon: 'checkin' },
  { firma: 'Star İletişim', sonAktivite: 110, sonSatis: '10.12.2024', sonSatisGun: 110, sonSatisUzman: 'Ayşe K.', risk: 'Critical', aksiyon: 'reengage' },
  { firma: 'Nova Teknoloji', sonAktivite: 65, sonSatis: '24.01.2025', sonSatisGun: 65, sonSatisUzman: 'Mehmet D.', risk: 'Medium', aksiyon: 'checkin' },
  { firma: 'Atlas Gıda', sonAktivite: 92, sonSatis: '28.12.2024', sonSatisGun: 92, sonSatisUzman: 'Can Y.', risk: 'High', aksiyon: 'reengage' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000
      ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const retentionColor = (pct: number): string => {
  if (pct >= 80) return '#166534'; // dark green
  if (pct >= 70) return '#15803D';
  if (pct >= 60) return '#22C55E';
  if (pct >= 50) return '#D97706';
  return '#DC2626';
};

const retentionBg = (pct: number): string => {
  if (pct >= 80) return '#DCFCE7';
  if (pct >= 70) return '#D1FAE5';
  if (pct >= 60) return '#ECFDF5';
  if (pct >= 50) return '#FEF3C7';
  return '#FEE2E2';
};

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesCustomerSegment = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  const [growSort, setGrowSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'buyume', dir: 'desc' });

  const handleGrowSort = (key: string) => {
    setGrowSort((p) => p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const sortedGrowing = [...growingFirmalar].sort((a, b) => {
    const av = (a as Record<string, unknown>)[growSort.key];
    const bv = (b as Record<string, unknown>)[growSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return growSort.dir === 'asc' ? av - bv : bv - av;
    return growSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const segmentBadge = (seg: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Enterprise: { color: '#4F46E5', bg: '#EEF2FF' },
      'Mid-Market': { color: '#0D9488', bg: '#F0FDFA' },
      Small: { color: '#D97706', bg: '#FFFBEB' },
    };
    const c = cfg[seg] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{seg}</span>;
  };

  const riskBadge = (risk: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Critical: { color: '#DC2626', bg: '#FEE2E2' },
      High: { color: '#D97706', bg: '#FEF3C7' },
      Medium: { color: '#CA8A04', bg: '#FEF9C3' },
    };
    const c = cfg[risk] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{risk}</span>;
  };

  const aksiyonBtn = (aksiyon: string) => {
    const isRe = aksiyon === 'reengage';
    return (
      <button
        onClick={() => window.open('#', '_blank')}
        style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
          color: isRe ? '#DC2626' : '#D97706',
          background: 'transparent',
          border: `1px solid ${isRe ? '#DC262655' : '#D9770655'}`,
          whiteSpace: 'nowrap',
        }}
      >
        {isRe ? 'Re-engage' : 'Check-in'}
      </button>
    );
  };

  return (
    <>
      {/* ── Section 1: MÜŞTERİ METRİKLERİ ───────────────────────────────────── */}
      <SectionHeader title={l.cstMetrikler ?? 'MÜŞTERİ METRİKLERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="cst-aktif" title={l.cstAktifMusteri ?? 'Toplam Aktif Müşteri'} value="1.248" trendValue="+5,2%" sparkTrend="up" color="c1" unit="adet" big info={l.cstAktifInfo ?? 'Son 12 ayda sipariş veren'} {...kp} />
        <KPICard id="cst-yeni" title={l.cstYeniMusteri ?? 'Yeni Müşteri'} value="47" trendValue="+12%" sparkTrend="up" color="tl" unit="adet" big info={l.cstYeniInfo ?? 'Bu dönem ilk siparişi olan'} {...kp} />
        <KPICard id="cst-tekrar" title={l.cstTekrarSatin ?? 'Tekrar Satın Alma Oranı'} value="%42,5" trendValue="+3,8pp" sparkTrend="up" color="gn" unit="%" big {...kp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="cst-clv" title={l.cstOrtCLV ?? 'Ort. CLV (12 Ay)'} value="8.420 ₺" trendValue="+14,2%" sparkTrend="up" color="pr" unit="₺" {...kp} />
        <KPICard id="cst-churn" title={l.cstChurn ?? 'Churn Oranı'} value="%3,2" trendValue="-0,8pp" sparkTrend="down" color="gn" unit="%" {...kp} />
        <KPICard id="cst-nps" title={l.cstNPS ?? 'NPS Skoru'} value="59" trendValue="+4" sparkTrend="up" color="tl" unit="" info={l.cstNPSInfo ?? 'Net Promoter Score'} {...kp} />
      </div>

      {/* ── Section 2: GELİR DAĞILIMI & LIFECYCLE FUNNEL ─────────────────────── */}
      <SectionHeader title={l.cstGelirFunnel ?? 'MÜŞTERİ GELİR DAĞILIMI & LIFECYCLE FUNNEL'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Donut */}
        <ChartContainer t={t} l={l} title={l.cstGelirDagilim ?? 'Müşteri Gelir Dağılımı (Yeni vs Mevcut)'} id="cst-chart-donut" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`%${v}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.tx }}>6.968K ₺</div>
                <div style={{ fontSize: 9, color: t.tx2 }}>{l.toplam ?? 'Toplam'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '0 8px' }}>
              {donutData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.tx2, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{d.amount}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
              <div style={{ background: t.bg2, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: t.tx3, marginBottom: 2 }}>{lang === 'tr' ? 'Yeni müşteri başına ort.' : 'Avg. per new customer'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D9488' }}>44.425 ₺</div>
              </div>
              <div style={{ background: t.bg2, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: t.tx3, marginBottom: 2 }}>{lang === 'tr' ? 'Mevcut müşteri başına ort.' : 'Avg. per existing customer'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>5.665 ₺</div>
              </div>
            </div>
          </div>
        </ChartContainer>

        {/* Lifecycle Funnel */}
        <ChartContainer t={t} l={l} title={l.cstLifecycleFunnel ?? 'Müşteri Lifecycle Funnel'} id="cst-chart-funnel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {funnelSteps.map((step, i) => {
              const maxVal = funnelSteps[0].count;
              const pct = (step.count / maxVal) * 100;
              const minPct = 15;
              const barPct = minPct + (pct / 100) * (100 - minPct);
              return (
                <div key={step.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: t.tx2, width: 72, textAlign: 'right', flexShrink: 0 }}>{step.name}</span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ width: `${barPct}%`, height: 24, background: step.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.3s', minWidth: 40 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: i >= 4 ? '#fff' : '#1E293B' }}>{step.count.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 82, padding: '1px 0' }}>
                      <span style={{ fontSize: 9, color: t.tx3 }}>↓</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: t.pr, marginLeft: 4 }}>{funnelConv[i]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 3: CLV DISTRIBUTION & COHORT ─────────────────────────────── */}
      <SectionHeader title={l.cstClvCohort ?? 'CLV DISTRIBUTION & COHORT'} t={t} />

      {/* CLV + Sipariş Adet — yan yana */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* CLV Histogram */}
        <ChartContainer t={t} l={l} title={l.cstClvDagilim ?? 'CLV Dağılımı'} id="cst-chart-clv" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={clvHistogram} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="range" tickFormatter={tTerm} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} müşteri`, '']} />
              <ReferenceLine x="5K-10K" stroke={t.pr} strokeDasharray="5 3" strokeWidth={1.5} label={{ value: `${tTerm('Ort.')} 8.420 ₺`, fontSize: 9, fill: t.pr, position: 'top' }} />
              <ReferenceLine x="2K-5K" stroke={t.tl} strokeDasharray="3 3" strokeWidth={1} label={{ value: `${tTerm('Medyan')} 6.200 ₺`, fontSize: 9, fill: t.tl, position: 'top' }} />
              <Bar dataKey="count" name={tTerm('Müşteri')} radius={[4, 4, 0, 0]}>
                {clvHistogram.map((d, i) => (
                  <Cell key={i} fill={d.count === maxClvCount ? t.pr : '#818CF8'} opacity={d.count === maxClvCount ? 1 : 0.65} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Sipariş Adet Dağılımı */}
        <ChartContainer t={t} l={l} title={l.cstSiparisAdet ?? 'Sipariş Adet Dağılımı'} id="cst-chart-orderhist" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={orderHistogram} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="range" tickFormatter={tTerm} tick={{ fontSize: 9, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as { range: string; count: number };
                  const pct = ((d.count / totalOrderCustomers) * 100).toFixed(1);
                  return (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.range}</div>
                      <div style={{ color: t.tx2 }}>{d.count} {lang === 'tr' ? 'müşteri' : 'customers'} <span style={{ color: t.tx3 }}>(%{pct})</span></div>
                    </div>
                  );
                }}
              />
              <ReferenceLine x="4-6 sipariş" stroke={t.pr} strokeDasharray="5 3" strokeWidth={1.5} label={{ value: `${tTerm('Ort.')} 5,8 ${tTerm('adet')}`, fontSize: 9, fill: t.pr, position: 'top' }} />
              <ReferenceLine x="2-3 sipariş" stroke={t.tl} strokeDasharray="3 3" strokeWidth={1} label={{ value: `${tTerm('Medyan')} 3 ${tTerm('adet')}`, fontSize: 9, fill: t.tl, position: 'top' }} />
              <Bar dataKey="count" name={tTerm('Müşteri')} radius={[4, 4, 0, 0]}>
                {orderHistogram.map((d, i) => (
                  <Cell key={i} fill={d.count === maxOrderCount ? t.pr : '#818CF8'} opacity={d.count === maxOrderCount ? 1 : 0.65} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Cohort Retention — full width */}
      <div style={{ marginBottom: 12 }}>
        {/* Cohort Retention Heatmap */}
        <ChartContainer t={t} l={l} title={l.cstCohortRetention ?? 'Cohort Retention Heatmap'} id="cst-chart-cohort" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'left', whiteSpace: 'nowrap' }}>{lang === 'tr' ? 'Kohort' : 'Cohort'}</th>
                  {cohortHeaders.map((h) => (
                    <th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={fmtMonth(row.cohort)}>
                    <td style={{ padding: '6px 8px', fontSize: 10, fontWeight: 500, color: t.tx, whiteSpace: 'nowrap' }}>{fmtMonth(row.cohort)}</td>
                    {cohortHeaders.map((_, ci) => {
                      const val = row.values[ci];
                      if (val === undefined) return <td key={ci} style={{ padding: '6px 8px' }} />;
                      return (
                        <td key={ci} style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <div style={{
                            background: ci === 0 ? t.bg2 : retentionBg(val),
                            color: ci === 0 ? t.tx : retentionColor(val),
                            borderRadius: 4,
                            padding: '4px 6px',
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {val}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 4: SEGMENT PERFORMANS ─────────────────────────────────────── */}
      <SectionHeader title={l.cstSegmentPerf ?? 'SEGMENT PERFORMANS'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        {segments.map((seg) => (
          <div key={seg.name} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderLeft: `4px solid ${seg.color}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.tx }}>{seg.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>{seg.trend} YoY</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Müşteri' : 'Customers'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.tx }}>{seg.musteri}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Toplam Gelir' : 'Revenue'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.tx }}>{seg.gelir}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Ort. Sipariş' : 'Avg. Order'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{seg.ortSiparis}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{lang === 'tr' ? 'Gelir Payı' : 'Share'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: t.bg2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${seg.pay}%`, background: seg.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: seg.color }}>{fmtPercent(seg.pay, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 5: TOP GROWING & CHURN RISK ──────────────────────────────── */}
      <SectionHeader title={l.cstGrowChurn ?? 'TOP GROWING & CHURN RISK'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Growing customers */}
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.cstGrowingTablo ?? 'En Hızlı Büyüyen Müşteriler (Top 10)'}</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 11, cursor: 'pointer' }}>
              <Icon name="download" size={11} color={t.tx3} />
              Excel
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                  {[
                    { key: 'firma', label: 'Firma', align: 'left' },
                    { key: 'segment', label: 'Segment', align: 'left' },
                    { key: 'trend', label: 'Trend', align: 'center' },
                    { key: 'ltv', label: 'LTV', align: 'right' },
                    { key: 'sonSatis', label: 'Son Satış', align: 'left' },
                    { key: 'sonSatisUzman', label: 'Son Satış Uzmanı', align: 'left' },
                    { key: 'buyume', label: 'Büyüme %', align: 'right' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => !['segment', 'trend'].includes(col.key) && handleGrowSort(col.key)}
                      style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: growSort.key === col.key ? t.pr : t.tx2, textAlign: col.align as 'left' | 'right' | 'center', whiteSpace: 'nowrap', cursor: !['segment', 'trend'].includes(col.key) ? 'pointer' : 'default', userSelect: 'none' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedGrowing.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.bd}` }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: t.tx }}>{f.firma}</td>
                    <td style={{ padding: '8px 10px' }}>{segmentBadge(f.segment)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <Spark data={mkSpk(f.sparkTrend, 'K ₺', lang)} color={t.gn} t={t} compact />
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', color: t.tx }}>{fmtTL(f.ltv)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, color: t.tx }}>{f.sonSatis}</div>
                      <div style={{ fontSize: 9, color: t.tx3 }}>{fmtRelativeDays(f.sonSatisGun)}</div>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: t.tx2 }}>{f.sonSatisUzman}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', fontWeight: 700, color: t.gn }}>+{f.buyume}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Churn risk */}
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.cstChurnTablo ?? 'Churn Risk & Pasif Hesaplar'}</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 11, cursor: 'pointer' }}>
              <Icon name="download" size={11} color={t.tx3} />
              Excel
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{tTerm('Firma Adı')}</th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'right' }}>{tTerm('Son Aktivite')}</th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{tTerm('Son Satış')}</th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'left' }}>{tTerm('Son Satış Uzmanı')}</th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{tTerm('Risk Skoru')}</th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'center' }}>{tTerm('Aksiyon')}</th>
                </tr>
              </thead>
              <tbody>
                {churnRisks.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.bd}` }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: t.tx }}>{r.firma}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', color: r.sonAktivite >= 90 ? t.rd : t.tx, fontWeight: r.sonAktivite >= 90 ? 700 : 400 }}>{r.sonAktivite} {i18n.t('common.daysLower')}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, color: r.sonSatisGun >= 180 ? '#DC2626' : r.sonSatisGun >= 90 ? '#D97706' : t.tx }}>{r.sonSatis}</div>
                      <div style={{ fontSize: 9, color: t.tx3 }}>{fmtRelativeDays(r.sonSatisGun)}</div>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: t.tx2 }}>{r.sonSatisUzman}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{riskBadge(r.risk)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{aksiyonBtn(r.aksiyon)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
