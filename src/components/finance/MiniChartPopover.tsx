import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Theme, Lang } from '../../types';
import type { FinCurrency } from '../../types/finance';
import { Icon } from '../ui/Icon';

export interface MiniPoint { label: string; value: number }

interface MiniChartPopoverProps {
  data: MiniPoint[];
  t: Theme;
  lang: Lang;
  /** Tutar → bar, oran → çizgi. */
  mode?: 'bar' | 'line';
  currency?: FinCurrency;
  /** Değerleri para birimi olarak biçimlendir (oran metriklerinde false). */
  isCurrency?: boolean;
  title?: string;
}

/** Satır içi mini-grafik pop-up: son ~10 dönem, bar (tutar) / çizgi (oran). Portal ile üstte. */
export const MiniChartPopover = ({ data, t, lang, mode = 'bar', currency = 'TRY', isCurrency = true, title }: MiniChartPopoverProps) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const sym = currency === 'USD' ? '$' : '₺';
  const fmt = (v: number) =>
    isCurrency
      ? `${sym}${Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : (v / 1e3).toFixed(0) + 'K'}`
      : `${v.toFixed(1)}%`;

  return (
    <span style={{ display: 'inline-flex' }}>
      <button
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPos(pos ? null : { x: r.right, y: r.top });
        }}
        title={title ?? 'Trend'}
        style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3, padding: 0 }}
      >
        <Icon name="barChart3" size={12} />
      </button>
      {pos && createPortal(
        <>
          <div onClick={() => setPos(null)} style={{ position: 'fixed', inset: 0, zIndex: 99998 }} />
          <div
            style={{
              position: 'fixed',
              left: Math.min(pos.x + 8, window.innerWidth - 288),
              top: Math.min(pos.y, window.innerHeight - 200),
              width: 280, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10,
              padding: '12px 12px 6px', boxShadow: '0 12px 32px rgba(0,0,0,0.22)', zIndex: 99999,
            }}
          >
            {title && <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 8 }}>{title}</div>}
            <ResponsiveContainer width="100%" height={140}>
              {mode === 'bar' ? (
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} width={38} tickFormatter={fmt} />
                  <Tooltip
                    content={({ active, payload, label }) => active && payload?.[0] ? (
                      <div style={{ background: t.tx, color: t.bg, borderRadius: 6, padding: '4px 9px', fontSize: 11 }}>
                        <b>{label}</b> · {fmt(payload[0].value as number)}
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="value" fill={t.pr} radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} width={38} tickFormatter={fmt} />
                  <Tooltip
                    content={({ active, payload, label }) => active && payload?.[0] ? (
                      <div style={{ background: t.tx, color: t.bg, borderRadius: 6, padding: '4px 9px', fontSize: 11 }}>
                        <b>{label}</b> · {fmt(payload[0].value as number)}
                      </div>
                    ) : null}
                  />
                  <Line type="monotone" dataKey="value" stroke={t.tl} strokeWidth={2} dot={{ r: 2.5, fill: t.tl }} />
                </LineChart>
              )}
            </ResponsiveContainer>
            <div style={{ fontSize: 9.5, color: t.tx3, textAlign: 'right', paddingTop: 2 }}>
              {lang === 'en' ? 'Last periods' : 'Son dönemler'}
            </div>
          </div>
        </>,
        document.body,
      )}
    </span>
  );
};
