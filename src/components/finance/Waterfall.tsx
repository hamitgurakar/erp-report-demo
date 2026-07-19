import type { Theme } from '../../types';

export interface WFStep { label: string; value: number; isTotal: boolean }

interface WaterfallProps {
  steps: WFStep[];
  t: Theme;
  /** Değer etiketi biçimlendirici (para birimi veya pp). */
  fmt: (v: number) => string;
  /** true → tüm barlar yeşil/kırmızı (pp köprüleri için). */
  pp?: boolean;
  height?: number;
}

/** SVG şelale/waterfall — P&L WaterfallChart görsel diliyle uyumlu (barW 44 · gap 14). */
export const Waterfall = ({ steps, t, fmt, pp, height = 210 }: WaterfallProps) => {
  let running = 0;
  const bars = steps.map((s) => {
    if (s.isTotal) { running = s.value; return { ...s, base: 0, h: Math.abs(s.value), pos: s.value >= 0 }; }
    const base = running; running += s.value;
    return { ...s, base: s.value > 0 ? base : base + s.value, h: Math.abs(s.value), pos: s.value > 0 };
  });
  const vals = bars.map((b) => b.base + b.h);
  const minBase = Math.min(0, ...bars.map((b) => b.base));
  const max = Math.max(...vals, 1);
  const range = (max - minBase) || 1;
  const barW = 44, gap = 14, TOP = 22, PLOT = height - 60, BOT = height;
  const chartW = bars.length * (barW + gap) + 20;
  const y = (v: number) => TOP + ((max - v) / range) * PLOT;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${chartW} ${BOT}`} style={{ overflow: 'visible', minWidth: chartW }}>
        {bars.map((b, i) => {
          const x = 10 + i * (barW + gap);
          const yTop = y(b.base + b.h);
          const h = Math.max((b.h / range) * PLOT, 2);
          const fill = b.isTotal ? (b.pos ? t.gn : t.rd) : (pp ? (b.pos ? t.gn : t.rd) : (b.pos ? t.c1 : t.rdP));
          return (
            <g key={i}>
              <rect x={x} y={yTop} width={barW} height={h} rx={4} fill={fill} opacity={b.isTotal ? 1 : 0.82} />
              <text x={x + barW / 2} y={yTop - 5} textAnchor="middle" fill={t.tx} fontSize={9} fontWeight={600}>{fmt(b.value)}</text>
              <text x={x + barW / 2} y={BOT - 8} textAnchor="middle" fill={t.tx2} fontSize={8}>{b.label}</text>
              {i < bars.length - 1 && !b.isTotal && (
                <line x1={x + barW} y1={y(running)} x2={x + barW + gap} y2={y(running)} stroke={t.bd} strokeWidth={1} strokeDasharray="3 2" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
