import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, ReferenceArea, Legend,
  LineChart, Line,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
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

const yoyData = [
  { month: 'Oca', buYil: 780, gecenYil: 680 },
  { month: 'Şub', buYil: 820, gecenYil: 710 },
  { month: 'Mar', buYil: 910, gecenYil: 790 },
  { month: 'Nis', buYil: 850, gecenYil: 740 },
  { month: 'May', buYil: 920, gecenYil: 800 },
  { month: 'Haz', buYil: 880, gecenYil: 760 },
  { month: 'Tem', buYil: 750, gecenYil: 680 },
  { month: 'Ağu', buYil: 720, gecenYil: 650 },
  { month: 'Eyl', buYil: 890, gecenYil: 780 },
  { month: 'Eki', buYil: 1050, gecenYil: 920 },
  { month: 'Kas', buYil: 1280, gecenYil: 1100 },
  { month: 'Ara', buYil: 1520, gecenYil: 1320 },
];

const weeklyRhythm = [
  { day: 'Pzt', ort: 145, buHafta: 152 },
  { day: 'Sal', ort: 168, buHafta: 180 },
  { day: 'Çar', ort: 172, buHafta: 165 },
  { day: 'Per', ort: 158, buHafta: 170 },
  { day: 'Cum', ort: 142, buHafta: 148 },
  { day: 'Cmt', ort: 45, buHafta: 38 },
  { day: 'Paz', ort: 12, buHafta: 8 },
];

const seasonalIndex = [
  { month: 'Oca', idx: 78 },
  { month: 'Şub', idx: 82 },
  { month: 'Mar', idx: 91 },
  { month: 'Nis', idx: 85 },
  { month: 'May', idx: 92 },
  { month: 'Haz', idx: 88 },
  { month: 'Tem', idx: 75 },
  { month: 'Ağu', idx: 72 },
  { month: 'Eyl', idx: 89 },
  { month: 'Eki', idx: 105 },
  { month: 'Kas', idx: 128 },
  { month: 'Ara', idx: 152 },
];

// Campaign timeline — 50 weeks
const campaignWeeks = (() => {
  const base = [
    135, 140, 128, 145, 138, 142, 220, 150, 195, 148,
    155, 180, 160, 145, 142, 138, 135, 130, 125, 118,
    112, 108, 100, 105, 110, 115, 120, 125, 130, 128,
    135, 140, 145, 150, 148, 142, 138, 145, 155, 160,
    175, 190, 210, 280, 250, 260, 290, 310, 320, 280,
  ];
  const months = ['Oca', 'Oca', 'Oca', 'Oca', 'Şub', 'Şub', 'Şub', 'Şub', 'Mar', 'Mar',
    'Mar', 'Nis', 'Nis', 'Nis', 'Nis', 'May', 'May', 'May', 'May', 'Haz',
    'Haz', 'Haz', 'Haz', 'Tem', 'Tem', 'Tem', 'Tem', 'Ağu', 'Ağu', 'Ağu',
    'Ağu', 'Eyl', 'Eyl', 'Eyl', 'Eyl', 'Eki', 'Eki', 'Eki', 'Eki', 'Kas',
    'Kas', 'Kas', 'Kas', 'Kas', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara'];
  return base.map((ciro, i) => ({
    week: `H${i + 1}`,
    ciro,
    label: months[i],
    weekNum: i + 1,
  }));
})();

// Events with approximate week positions
const events = [
  { week: 7, label: '14 Şub — Sevgililer Günü', color: '#DC2626' },
  { week: 9, label: '8 Mar — Kadınlar Günü', color: '#7C3AED' },
  { week: 12, label: 'Ramazan Bayramı', color: '#16A34A' },
  { week: 16, label: '1 May — İşçi Bayramı', color: '#3B82F6' },
  { week: 22, label: 'Yaz Kampanyası', color: '#D97706' },
  { week: 38, label: '29 Eki — Cumhuriyet', color: '#DC2626' },
];

interface QRow {
  donem: string;
  adet: number;
  ciro: number;
  ortSiparis: number;
  yoy: number;
  pay: number;
  enGuclu: string;
  enZayif: string;
  isTotal?: boolean;
}

const quarterlyTable: QRow[] = [
  { donem: 'Q1 2025', adet: 5811, ciro: 8791437, ortSiparis: 1512, yoy: 14.2, pay: 22, enGuclu: 'Mart', enZayif: 'Ocak' },
  { donem: 'Q2 2025', adet: 5160, ciro: 7982520, ortSiparis: 1547, yoy: 8.5, pay: 20, enGuclu: 'Mayıs', enZayif: 'Nisan' },
  { donem: 'Q3 2025', adet: 3490, ciro: 5741708, ortSiparis: 1645, yoy: -11.5, pay: 14, enGuclu: 'Eylül', enZayif: 'Ağustos' },
  { donem: 'Q4 2025', adet: 22868, ciro: 40339152, ortSiparis: 1764, yoy: 18.3, pay: 44, enGuclu: 'Aralık', enZayif: 'Ekim' },
  { donem: 'Toplam', adet: 37329, ciro: 62854817, ortSiparis: 1683, yoy: 12.8, pay: 100, enGuclu: '-', enZayif: '-', isTotal: true },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesSeasonal = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  return (
    <>
      {/* ── Section 1: SEZONSAL METRİKLER ────────────────────────────────────── */}
      <SectionHeader title={l.sznMetrikler ?? 'SEZONSAL METRİKLER'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="szn-en-guclu" title={l.sznEnGuclu ?? 'En Güçlü Ay'} value="Aralık" trendValue="3.800 adet, yılın %18,7'si" sparkTrend="up" color="gn" unit="" big {...kp} />
        <KPICard id="szn-en-zayif" title={l.sznEnZayif ?? 'En Zayıf Ay'} value="Ağustos" trendValue="1.600 adet, yılın %7,9'u" sparkTrend="down" color="rd" unit="" big {...kp} />
        <KPICard id="szn-varyans" title={l.sznVaryans ?? 'Mevsimsel Varyans'} value="%42,5" trendValue="Peak/Low = 2,4x" sparkTrend="flat" color="am" unit="%" big {...kp} />
        <KPICard id="szn-yoy" title={l.sznYoY ?? 'YoY Büyüme'} value="+14,8%" trendValue="2024 vs 2025" sparkTrend="up" color="gn" unit="%" big {...kp} />
      </div>

      {/* ── Section 2: YOY SATIŞ KARŞILAŞTIRMA ───────────────────────────────── */}
      <SectionHeader title={l.sznYoYSection ?? 'YOY SATIŞ KARŞILAŞTIRMA'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.sznYoYChart ?? 'Yıllık Karşılaştırma (2024 vs 2025)'} id="szn-chart-yoy" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={yoyData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradBuYil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradGecenYil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value}K ₺`, name]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="gecenYil" name="2024" stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradGecenYil)" dot={false} />
              <Area type="monotone" dataKey="buYil" name="2025" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gradBuYil)" dot={{ r: 3, fill: '#4F46E5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 3: HAFTALIK RİTİM & SEZONSAL İNDEKS ─────────────────────── */}
      <SectionHeader title={l.sznRitmIndeks ?? 'HAFTALIK SATIŞ RİTMİ & SEZONSAL İNDEKS'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Weekly rhythm */}
        <ChartContainer t={t} l={l} title={l.sznHaftalikRitm ?? 'Haftalık Satış Ritmi'} id="szn-chart-weekly" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyRhythm} margin={{ top: 10, right: 20, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} adet`, name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ort" name={lang === 'tr' ? 'Son 4 Hafta Ort.' : 'Last 4 Weeks Avg.'} fill={t.tx3} opacity={0.35} radius={[3, 3, 0, 0]} />
              <Bar dataKey="buHafta" name={lang === 'tr' ? 'Bu Hafta' : 'This Week'} fill={t.pr} opacity={0.8} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Seasonal index */}
        <ChartContainer t={t} l={l} title={l.sznSezonalIndeks ?? 'Sezonsal İndeks'} id="szn-chart-index" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seasonalIndex} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[50, 170]} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}`, 'İndeks']} />
              <ReferenceLine y={100} stroke={t.tx3} strokeDasharray="5 3" strokeWidth={1.5} label={{ value: lang === 'tr' ? 'Ortalama (100)' : 'Average (100)', fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Bar dataKey="idx" name={tTerm('İndeks')} radius={[4, 4, 0, 0]}>
                {seasonalIndex.map((d, i) => (
                  <Cell key={i} fill={d.idx >= 100 ? t.gn : t.rd} opacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx2, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
            {lang === 'tr' ? "Q4 (Eki-Ara) yılın en güçlü dönemi — toplam satışın %38'i" : 'Q4 (Oct-Dec) is the strongest period — 38% of annual sales'}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 4: KAMPANYA ETKİ ANALİZİ ─────────────────────────────────── */}
      <SectionHeader title={l.sznKampanya ?? 'KAMPANYA & ETKİNLİK ETKİ ANALİZİ'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.sznKampanyaChart ?? 'Kampanya & Etkinlik Etki Analizi'} id="szn-chart-campaign" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={campaignWeeks} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradCampaign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis
                dataKey="weekNum"
                tick={{ fontSize: 9, fill: t.tx2 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const w = campaignWeeks[v - 1];
                  return w && (v === 1 || w.label !== campaignWeeks[v - 2]?.label) ? w.label : '';
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => {
                  const w = campaignWeeks[Number(v) - 1];
                  const evt = events.find((e) => e.week === Number(v));
                  return `Hafta ${v} (${w?.label ?? ''})${evt ? ` — ${evt.label}` : ''}`;
                }}
                formatter={(value: number) => [`${value}K ₺`, lang === 'tr' ? 'Haftalık Ciro' : 'Weekly Revenue']}
              />
              {/* Black Friday zone */}
              <ReferenceArea x1={40} x2={44} fill="#64748B" fillOpacity={0.08} label={{ value: 'Black Friday', fontSize: 9, fill: '#64748B', position: 'insideTopLeft' }} />
              {/* Yılbaşı zone */}
              <ReferenceArea x1={45} x2={50} fill="#16A34A" fillOpacity={0.06} label={{ value: 'Yılbaşı Sezonu', fontSize: 9, fill: '#16A34A', position: 'insideTopLeft' }} />
              {/* Event reference lines */}
              {events.map((evt) => (
                <ReferenceLine
                  key={evt.week}
                  x={evt.week}
                  stroke={evt.color}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  label={{ value: evt.label, fontSize: 8, fill: evt.color, angle: -90, position: 'insideTopRight', offset: 10 }}
                />
              ))}
              <Line type="monotone" dataKey="ciro" stroke="#4F46E5" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#4F46E5' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 5: ÇEYREK BAZLI PERFORMANS TABLOSU ───────────────────────── */}
      <SectionHeader title={l.sznCeyrekTablo ?? 'ÇEYREK BAZLI PERFORMANS TABLOSU'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.sznCeyrekGrid ?? 'Çeyreklik Performans Özeti'}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} />
            Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { label: lang === 'tr' ? 'Dönem' : 'Period', align: 'left' },
                  { label: lang === 'tr' ? 'Sipariş Adet' : 'Orders', align: 'right' },
                  { label: lang === 'tr' ? 'Ciro (₺)' : 'Revenue (₺)', align: 'right' },
                  { label: lang === 'tr' ? 'Ort. Sipariş' : 'Avg. Order', align: 'right' },
                  { label: lang === 'tr' ? 'YoY Büyüme' : 'YoY Growth', align: 'right' },
                  { label: lang === 'tr' ? 'Pay %' : 'Share %', align: 'right' },
                  { label: lang === 'tr' ? 'En Güçlü' : 'Strongest', align: 'left' },
                  { label: lang === 'tr' ? 'En Zayıf' : 'Weakest', align: 'left' },
                ].map((col, ci) => (
                  <th key={ci} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: col.align as 'left' | 'right', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quarterlyTable.map((r) => (
                <tr
                  key={r.donem}
                  style={{
                    borderBottom: `1px solid ${t.bd}`,
                    background: r.isTotal ? t.bg2 : 'transparent',
                  }}
                >
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: r.isTotal ? 700 : 500, color: t.tx }}>{r.donem}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: r.isTotal ? 700 : 400, color: t.tx }}>{r.adet.toLocaleString('tr-TR')}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: r.isTotal ? 700 : 500, color: t.tx }}>{fmtTL(r.ciro)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.ortSiparis.toLocaleString('tr-TR')} ₺</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: r.yoy >= 0 ? t.gn : t.rd }}>
                    {r.yoy > 0 ? '+' : ''}{r.yoy.toFixed(1)}%
                  </td>
                  <td style={{ padding: '9px 14px', width: 90 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: t.bg2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.pay}%`, background: t.pr, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: t.tx, width: 28, textAlign: 'right' }}>%{r.pay}</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{r.enGuclu}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{r.enZayif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
