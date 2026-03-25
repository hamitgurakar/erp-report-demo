import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { Icon } from '../ui/Icon';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const summaryCards = [
  { title: 'B2B Ciro (TL)', hedef: '40.000.000 ₺', gercek: '21.972.462 ₺', sapma: -45.1, badge: 'RİSK', badgeColor: '#DC2626', badgeBg: '#FEE2E2', pct: 55 },
  { title: 'B2B Sipariş Sayısı', hedef: '25.000', gercek: '15.133', sapma: -39.5, badge: 'RİSK', badgeColor: '#DC2626', badgeBg: '#FEE2E2', pct: 60 },
  { title: 'B2B AOV ($)', hedef: '$33,19', gercek: '$29,31', sapma: -11.7, badge: 'DİKKAT', badgeColor: '#D97706', badgeBg: '#FEF3C7', pct: 88 },
  { title: 'B2B Net Kâr Marjı', hedef: '%27,00', gercek: '%27,67', sapma: 0.67, badge: 'HEDEFTE', badgeColor: '#16A34A', badgeBg: '#D1FAE5', pct: 102 },
];

// Monthly breakdown matrix
interface MatrixRow {
  group: string;
  metric: string;
  values: (number | string | null)[];
  total: number | string;
  format: 'number' | 'currency_tl' | 'currency_usd' | 'percent' | 'plain';
  isHedef?: boolean;
  isTotal?: boolean;
}

const matrixData: MatrixRow[] = [
  // Sipariş & Sepet
  { group: 'Sipariş & Sepet', metric: 'B2B Sipariş Sayısı', values: [5006, 15133, 5811, 2295, 5160, 1940, 1391, 3490, 3230, 4566, 22868, 20750], total: 91640, format: 'number' },
  { group: 'Sipariş & Sepet', metric: 'B2B Sepet Ort. (₺)', values: [1392, 1452, 1513, 1530, 1547, 1564, 1627, 1645, 1662, 1728, 1764, 2000], total: 1695, format: 'currency_tl' },
  // Gelir
  { group: 'Gelir', metric: 'B2B Gelir (USD)', values: [160204, 499374, 197560, 78030, 175440, 65960, 48692, 122164, 113050, 164383, 823248, 830000], total: 3278106, format: 'currency_usd' },
  { group: 'Gelir', metric: 'B2B Gelir (TRY)', values: [6968908, 21972462, 8791437, 3511350, 7982520, 3034160, 2264178, 5741708, 5369875, 7890393, 40339152, 41500000], total: 155366145, format: 'currency_tl' },
  // Hedef
  { group: 'Hedef', metric: 'B2B Hedef Gelir (TRY)', values: [3750000, 3250000, null, null, null, null, null, null, null, null, null, null], total: 7000000, format: 'currency_tl', isHedef: true },
  // Dolar Kuru
  { group: 'Kur', metric: 'Dolar Kur Tahmini', values: [36.05, 37.73, 39.40, 41.03, 42.50, 43.80, 44.90, 45.80, 46.50, 47.20, 48.00, 48.80], total: 41.81, format: 'plain' },
  // Karlılık
  { group: 'Karlılık', metric: 'Gelir USD (Toplam)', values: [228812, 575361, 261181, 103850, 233920, 87947, 64922, 162885, 150733, 219177, 1097664, 1106666], total: 4293119, format: 'currency_usd' },
  { group: 'Karlılık', metric: 'Gelir TRY (Toplam)', values: [9953356, 25315910, 11622563, 4659315, 10637360, 4109204, 3120156, 7987478, 7496037, 11101972, 56444684, 58000000], total: 210448037, format: 'currency_tl', isTotal: true },
  { group: 'Karlılık', metric: 'COGS', values: [4976678, 12657955, 5811281, 2329657, 5318680, 2054602, 1560078, 3993739, 3748018, 5550986, 28222342, 29000000], total: 105224018, format: 'currency_tl' },
  { group: 'Karlılık', metric: 'Gross Profit', values: [2488339, 6328977, 2905640, 1164828, 2659340, 1027301, 780039, 1996869, 1874009, 2775493, 14111171, 14500000], total: 52612009, format: 'currency_tl' },
  { group: 'Karlılık', metric: 'Net Sales Profit', values: [2786939, 7088454, 3254317, 1304447, 2978584, 1150570, 873643, 2236440, 2098845, 3108487, 15804431, 16240000], total: 58924159, format: 'currency_tl' },
];

// Quarterly forecast vs actual
const qForecastChart = [
  { q: 'Q1 2025', forecast: 44226, actual: 37732 },
  { q: 'Q2 2025', forecast: 31391, actual: 25038 },
  { q: 'Q3 2025', forecast: 22103, actual: 18869 },
  { q: 'Q4 2025', forecast: 107704, actual: 0 },
];

const qForecastTable = [
  { donem: 'Q1 2025', order: 40000, aov: '$30,67', kur: '36,05₺', revUSD: '$1.226.800', revTL: '44.226.140₺' },
  { donem: 'Q2 2025', order: 26000, aov: '$32,00', kur: '37,73₺', revUSD: '$832.000', revTL: '31.391.360₺' },
  { donem: 'Q3 2025', order: 17000, aov: '$33,00', kur: '39,40₺', revUSD: '$561.000', revTL: '22.103.400₺' },
  { donem: 'Q4 2025', order: 75000, aov: '$35,00', kur: '41,03₺', revUSD: '$2.625.000', revTL: '107.703.750₺' },
  { donem: '2025 Toplam', order: 158000, aov: '$33,19', kur: '39,17₺', revUSD: '$5.244.800', revTL: '205.424.650₺', isTotal: true },
];

const comparisons = [
  { donem: '2024 Toplam', order: 171972, aov: '$24,24', kur: '33,42₺', revUSD: '$4.167.107', revTL: '139.256.789₺' },
  { donem: 'Fark', order: -13972, aov: '+$8,95', kur: '+5,75₺', revUSD: '+$1.077.693', revTL: '+66.167.860₺' },
  { donem: 'Fark %', order: '-8,12%', aov: '+36,94%', kur: '+17,20%', revUSD: '+25,86%', revTL: '+47,51%' },
];

// Trend chart (8 quarters)
const trendData = [
  { q: 'Q1 24', gercek: 28500, hedef: 25000 },
  { q: 'Q2 24', gercek: 32000, hedef: 30000 },
  { q: 'Q3 24', gercek: 35000, hedef: 38000 },
  { q: 'Q4 24', gercek: 48000, hedef: 45000 },
  { q: 'Q1 25', gercek: 37732, hedef: 44226 },
  { q: 'Q2 25', gercek: 25038, hedef: 31391 },
  { q: 'Q3 25', gercek: 18869, hedef: 22103 },
  { q: 'Q4 25', gercek: null, hedef: 107704 },
];

const archiveData = [
  { yil: '2023', hedef: '95.000.000 ₺', gercek: '89.500.000 ₺', sapma: -5.8, badge: 'DİKKAT' },
  { yil: '2024', hedef: '139.256.789 ₺', gercek: '122.249.956 ₺', sapma: -12.2, badge: 'RİSK' },
  { yil: '2025 (YTD)', hedef: '205.424.650 ₺', gercek: '155.366.145 ₺', sapma: -24.4, badge: 'RİSK' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtCell = (v: number | string | null, format: string): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  switch (format) {
    case 'currency_tl': return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')}M ₺` : `${v.toLocaleString('tr-TR')} ₺`;
    case 'currency_usd': return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${v.toLocaleString('en-US')}`;
    case 'number': return v.toLocaleString('tr-TR');
    case 'percent': return `%${v}`;
    default: return typeof v === 'number' && v % 1 !== 0 ? v.toFixed(2).replace('.', ',') + ' ₺' : String(v);
  }
};

const barColor = (pct: number) =>
  pct >= 100 ? '#16A34A' : pct >= 80 ? '#22C55E' : pct >= 60 ? '#D97706' : '#DC2626';

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesTargets = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const [selectedQ, setSelectedQ] = useState('Q4 2025');
  const [qDropdown, setQDropdown] = useState(false);
  const [toast, setToast] = useState(false);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026'];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, right: 24, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, fontSize: 12, color: t.tx, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="info" size={14} color={t.pr} />
          {lang === 'tr' ? 'Düzenleme modu yakında aktif olacak' : 'Edit mode coming soon'}
        </div>
      )}

      {/* ── Üst Kısım: Çeyrek Seçici + Hedef Düzenle ────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <span style={{ fontSize: 12, color: t.tx2 }}>{lang === 'tr' ? 'Dönem:' : 'Period:'}</span>
          <button
            onClick={() => setQDropdown(!qDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd, color: t.tx, fontSize: 12, fontWeight: 500, cursor: 'pointer', minWidth: 120 }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedQ}</span>
            <Icon name="chevDown" size={12} color={t.tx3} />
          </button>
          {qDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 50, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 140, overflow: 'hidden' }}>
              {quarters.map((q) => (
                <div key={q} onClick={() => { setSelectedQ(q); setQDropdown(false); }}
                  style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', color: selectedQ === q ? t.pr : t.tx, background: selectedQ === q ? t.prL : 'transparent', fontWeight: selectedQ === q ? 600 : 400 }}
                  onMouseOver={(e) => { if (selectedQ !== q) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={(e) => { if (selectedQ !== q) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >{q}</div>
              ))}
            </div>
          )}
        </div>
        <button onClick={showToast} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${t.pr}`, background: 'transparent', color: t.pr, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {lang === 'tr' ? 'Hedefleri Düzenle ✏️' : 'Edit Targets ✏️'}
        </button>
      </div>

      {/* ── Section 1: B2B HEDEF ÖZET KARTLARI ───────────────────────────────── */}
      <SectionHeader title={l.tgtOzet ?? 'B2B HEDEF ÖZET KARTLARI'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        {summaryCards.map((card) => (
          <div key={card.title} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.tx2 }}>{card.title}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: card.badgeColor, background: card.badgeBg, padding: '2px 8px', borderRadius: 4 }}>{card.badge}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.tx, marginBottom: 4 }}>{card.gercek}</div>
            <div style={{ fontSize: 10, color: t.tx3, marginBottom: 8 }}>{lang === 'tr' ? 'Hedef:' : 'Target:'} {card.hedef}</div>
            {/* Progress bar */}
            <div style={{ height: 6, background: t.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: 4, position: 'relative' }}>
              {card.pct <= 100 && <div style={{ position: 'absolute', left: `${(100 / 120) * 100}%`, top: 0, bottom: 0, width: 1, background: t.tx3, opacity: 0.3 }} />}
              <div style={{ height: '100%', width: `${Math.min(card.pct, 120) / 120 * 100}%`, background: barColor(card.pct), borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: card.sapma >= 0 ? '#16A34A' : '#DC2626' }}>
              {card.sapma > 0 ? '+' : ''}{card.sapma}%
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2: AYLIK KIRILIM MATRİSİ ─────────────────────────────────── */}
      <SectionHeader title={l.tgtAylikMatris ?? 'AYLIK KIRILIM MATRİSİ'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{lang === 'tr' ? 'Aylık Kırılım Matrisi' : 'Monthly Breakdown Matrix'}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} />
            Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead>
              <tr style={{ background: t.bg2, borderBottom: `1px solid ${t.bd}` }}>
                <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'left', position: 'sticky', left: 0, background: t.bg2, zIndex: 2, minWidth: 160, whiteSpace: 'nowrap' }}>Metrik</th>
                {MONTHS.map((m) => (
                  <th key={m} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: 'right', whiteSpace: 'nowrap', minWidth: 85 }}>{m}</th>
                ))}
                <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: t.tx, textAlign: 'right', whiteSpace: 'nowrap', minWidth: 100, background: '#F0F9FF' }}>Yıl Toplam</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, ri) => {
                const prevGroup = ri > 0 ? matrixData[ri - 1].group : '';
                const showGroup = row.group !== prevGroup;
                return (
                  <tr key={ri} style={{ borderBottom: `1px solid ${t.bd}` }}>
                    <td style={{
                      padding: '7px 12px', fontSize: 10, fontWeight: 500,
                      color: t.tx, position: 'sticky', left: 0, zIndex: 1, whiteSpace: 'nowrap',
                      background: row.isHedef ? '#FEFCE8' : row.isTotal ? '#F0F9FF' : t.cd,
                      borderLeft: showGroup ? `3px solid ${t.pr}` : '3px solid transparent',
                    }}>
                      {row.metric}
                    </td>
                    {row.values.map((v, ci) => (
                      <td key={ci} style={{
                        padding: '7px 10px', fontSize: 10, textAlign: 'right', whiteSpace: 'nowrap',
                        fontWeight: row.isTotal ? 600 : 400,
                        color: v === null ? t.tx3 : t.tx,
                        background: row.isHedef ? '#FEFCE8' : row.isTotal ? '#F0F9FF' : 'transparent',
                      }}>
                        {fmtCell(v, row.format)}
                      </td>
                    ))}
                    <td style={{
                      padding: '7px 12px', fontSize: 10, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap',
                      color: t.tx,
                      background: row.isHedef ? '#FEFCE8' : '#F0F9FF',
                    }}>
                      {fmtCell(row.total, row.format)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: ÇEYREKLIK KARŞILAŞTIRMA ───────────────────────────────── */}
      <SectionHeader title={l.tgtCeyreklik ?? 'B2B FORECAST VS GERÇEKLEŞEN'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.tgtCeyrekChart ?? 'B2B Forecast vs Gerçekleşen (K ₺)'} id="tgt-chart-qcomp" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={qForecastChart} margin={{ top: 15, right: 20, bottom: 0, left: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [`${v.toLocaleString('tr-TR')}K ₺`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="forecast" name="Forecast" fill="#C7D2FE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name={lang === 'tr' ? 'Gerçekleşen' : 'Actual'} fill={t.pr} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Quarterly comparison table */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {['Çeyrek', 'Order', 'AOV', 'Ort. Dolar', 'Revenue USD', 'Revenue TL'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: h === 'Çeyrek' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qForecastTable.map((r) => (
                <tr key={r.donem} style={{ borderBottom: `1px solid ${t.bd}`, background: r.isTotal ? t.bg2 : 'transparent' }}>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: r.isTotal ? 700 : 500, color: t.tx }}>{r.donem}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: t.tx }}>{r.order.toLocaleString('tr-TR')}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: t.tx }}>{r.aov}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: t.tx }}>{r.kur}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontWeight: 500, color: t.tx }}>{r.revUSD}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', fontWeight: 500, color: t.tx }}>{r.revTL}</td>
                </tr>
              ))}
              {/* Separator */}
              <tr><td colSpan={6} style={{ height: 2, background: t.bd }} /></tr>
              {comparisons.map((r, i) => {
                const isFark = r.donem.startsWith('Fark');
                const isPct = r.donem === 'Fark %';
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.bd}`, background: isFark ? '#F8FAFC' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: t.tx }}>{r.donem}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: isPct && String(r.order).startsWith('-') ? '#DC2626' : isPct ? '#16A34A' : t.tx, background: isPct ? (String(r.order).startsWith('-') ? '#FEF2F2' : '#F0FDF4') : 'transparent' }}>
                      {typeof r.order === 'number' ? r.order.toLocaleString('tr-TR') : r.order}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: isPct ? '#16A34A' : t.tx, background: isPct ? '#F0FDF4' : 'transparent' }}>{r.aov}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: isPct ? '#16A34A' : t.tx, background: isPct ? '#F0FDF4' : 'transparent' }}>{r.kur}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: isPct ? '#16A34A' : t.tx, background: isPct ? '#F0FDF4' : 'transparent' }}>{r.revUSD}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, textAlign: 'right', color: isPct ? '#16A34A' : t.tx, background: isPct ? '#F0FDF4' : 'transparent' }}>{r.revTL}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: TREND GRAFİĞİ ─────────────────────────────────────────── */}
      <SectionHeader title={l.tgtTrend ?? 'ÇEYREKLİK HEDEF VS GERÇEKLEŞEN TRENDİ'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.tgtTrendChart ?? 'Çeyreklik Hedef vs Gerçekleşen Trendi (K ₺)'} id="tgt-chart-trend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={trendData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number | null) => v !== null ? [`${v.toLocaleString('tr-TR')}K ₺`] : ['-']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="gercek" name={lang === 'tr' ? 'Gerçekleşen' : 'Actual'} fill={t.pr} radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line type="monotone" dataKey="hedef" name={lang === 'tr' ? 'Hedef' : 'Target'} stroke="#DC2626" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, fill: '#DC2626' }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 5: GEÇMİŞ ÇEYREK ARŞİVİ ──────────────────────────────────── */}
      <SectionHeader title={l.tgtArsiv ?? 'GEÇMİŞ ÇEYREK ARŞİVİ'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{lang === 'tr' ? 'Yıllık Özet (Son 3 Yıl)' : 'Annual Summary (Last 3 Years)'}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[lang === 'tr' ? 'Yıl' : 'Year', lang === 'tr' ? 'Hedef' : 'Target', lang === 'tr' ? 'Gerçekleşen' : 'Actual', lang === 'tr' ? 'Sapma %' : 'Variance %', lang === 'tr' ? 'Durum' : 'Status'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archiveData.map((r) => {
                const badgeColor = r.badge === 'RİSK' ? '#DC2626' : r.badge === 'DİKKAT' ? '#D97706' : '#16A34A';
                const badgeBg = r.badge === 'RİSK' ? '#FEE2E2' : r.badge === 'DİKKAT' ? '#FEF3C7' : '#D1FAE5';
                return (
                  <tr key={r.yil} style={{ borderBottom: `1px solid ${t.bd}` }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: t.tx }}>{r.yil}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{r.hedef}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: t.tx }}>{r.gercek}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: r.sapma >= 0 ? '#16A34A' : '#DC2626' }}>
                      {r.sapma > 0 ? '+' : ''}{r.sapma}%
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, padding: '3px 10px', borderRadius: 4 }}>{r.badge}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
