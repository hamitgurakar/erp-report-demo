import { useState, type CSSProperties } from 'react';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Theme, Lang } from '../../types';
import { collectionsLedger } from '../../constants/financeReportsData';
import { ChartCard } from './ChartCard';

export type PeriodMode = 'haftalik' | 'aylik' | 'ceyreklik';
type Seg = 'B2B' | 'B2C';
const FX = 42.9; // demo USD-TRY (Muhasebe ile aynı mantık)
const SEG_COLOR: Record<Seg, (t: Theme) => string> = { B2B: (t) => t.pr, B2C: (t) => t.tl };
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const mondayOf = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); const day = dt.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day; dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
};
const quarterKey = (iso: string) => `${iso.slice(0, 4)}-Q${Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1}`;

interface Props {
  t: Theme;
  lang: Lang;
  title: string;
  segments: Seg[];
  segmentToggle: boolean;
  periodModes?: PeriodMode[];
  currency?: 'TRY' | 'USD';
  span?: number;
}

/**
 * Yeniden kullanılabilir tahsilat trend grafiği (Gaviti/Growfin collection-trend deseni).
 * Tek kaynak: Muhasebe > Alacak Yönetimi receivables → collectionsLedger; tahsilatTarihi'ne göre
 * seçili döneme bucket'lanır. Aynı component + aynı kaynak → B2B her yerde aynı çıkar.
 */
export const TahsilatTrendChart = ({ t, lang, title, segments, segmentToggle, periodModes = ['haftalik', 'aylik', 'ceyreklik'], currency = 'TRY', span }: Props) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const [mode, setMode] = useState<PeriodMode>(periodModes.includes('aylik') ? 'aylik' : periodModes[0]);
  const [active, setActive] = useState<Seg[]>(segments);

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (v: number) => (currency === 'USD' ? v / FX : v);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };

  const modeLabel = (m: PeriodMode) => (m === 'haftalik' ? L('Haftalık', 'Weekly') : m === 'aylik' ? L('Aylık', 'Monthly') : L('Çeyreklik', 'Quarterly'));
  const bucketKey = (iso: string) => (mode === 'aylik' ? iso.slice(0, 7) : mode === 'ceyreklik' ? quarterKey(iso) : mondayOf(iso));
  const labelFor = (k: string): string => {
    if (mode === 'aylik') { const mi = Number(k.slice(5, 7)) - 1; return `${(en ? MONTHS_EN : MONTHS_TR)[mi]} ${k.slice(2, 4)}`; }
    if (mode === 'ceyreklik') return `${k.slice(5)} ${k.slice(2, 4)}`;
    return `${k.slice(8, 10)}.${k.slice(5, 7)}`;
  };

  const keys = [...new Set(collectionsLedger.map((e) => bucketKey(e.tarih)))].sort();
  const rows = keys.map((k) => {
    const row: Record<string, number | string> = { key: k, label: labelFor(k) };
    for (const seg of segments) {
      row[seg] = conv(collectionsLedger.filter((e) => e.musteriTipi === seg && bucketKey(e.tarih) === k).reduce((s, e) => s + e.tutar, 0));
    }
    return row;
  });
  // period-over-period % (önceki döneme göre)
  const data = rows.map((r, i) => {
    const o: Record<string, number | string> = { ...r };
    for (const seg of segments) {
      const cur = r[seg] as number; const prev = i > 0 ? (rows[i - 1][seg] as number) : 0;
      o[`${seg}_mom`] = prev ? ((cur - prev) / prev) * 100 : 0;
    }
    return o;
  });

  const toggleSeg = (seg: Seg) => setActive((a) => (a.includes(seg) ? (a.length > 1 ? a.filter((x) => x !== seg) : a) : [...a, seg]));

  const segBtnStyle = (on: boolean): CSSProperties => ({ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? t.pr : t.bd}`, background: on ? t.prL : 'transparent', color: on ? t.pr : t.tx3 });
  const modeBtnStyle = (on: boolean): CSSProperties => ({ padding: '5px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', border: 'none', background: on ? t.pr : t.cd, color: on ? '#fff' : t.tx2 });

  const right = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {segmentToggle && (
        <div style={{ display: 'flex', gap: 6 }}>
          {segments.map((seg) => (
            <button key={seg} onClick={() => toggleSeg(seg)} style={segBtnStyle(active.includes(seg))}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: SEG_COLOR[seg](t), marginRight: 5, verticalAlign: 'middle', opacity: active.includes(seg) ? 1 : 0.4 }} />{seg}
            </button>
          ))}
        </div>
      )}
      {periodModes.length > 1 && (
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
          {periodModes.map((m) => (
            <button key={m} onClick={() => setMode(m)} style={modeBtnStyle(mode === m)}>{modeLabel(m)}</button>
          ))}
        </div>
      )}
    </div>
  );

  const TrendTip = ({ active: on, payload, label }: { active?: boolean; payload?: { payload: Record<string, number | string> }[]; label?: string }) => {
    if (!on || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: t.tx, minWidth: 170 }}>
        <div style={{ fontWeight: 700, marginBottom: 5 }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {segments.filter((s) => active.includes(s)).map((seg) => {
            const val = d[seg] as number; const mom = d[`${seg}_mom`] as number;
            return (
              <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: SEG_COLOR[seg](t) }} />{seg}</span>
                <span style={{ fontWeight: 600 }}>{fmtC(val)} <span style={{ color: mom >= 0 ? t.gn : t.rd, fontSize: 10, fontWeight: 600 }}>{mom >= 0 ? '▲' : '▼'}{Math.abs(mom).toFixed(0)}%</span></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ChartCard t={t} lang={lang} span={span} title={`${title} — ${modeLabel(mode)}`} right={right}
      why={L('Gaviti/Growfin tahsilat trend deseni — tahsilatlar döneme göre segment bazında.', 'Gaviti/Growfin collection-trend pattern — collections by period and segment.')}>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
          <defs>
            {segments.map((seg) => (
              <linearGradient key={seg} id={`tt-${seg}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEG_COLOR[seg](t)} stopOpacity={0.28} /><stop offset="100%" stopColor={SEG_COLOR[seg](t)} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
          <Tooltip content={<TrendTip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {segments.filter((s) => active.includes(s)).map((seg) => (
            <Area key={seg} type="monotone" dataKey={seg} name={seg} stroke={SEG_COLOR[seg](t)} strokeWidth={2.5} fill={`url(#tt-${seg})`} dot={{ r: 2 }} activeDot={{ r: 4 }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default TahsilatTrendChart;
