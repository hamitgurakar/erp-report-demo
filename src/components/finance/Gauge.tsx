import type { Theme } from '../../types';

export interface GaugeBand { to: number; color: string }

interface GaugeProps {
  t: Theme;
  value: number;
  min: number;
  max: number;
  /** Eşik bantları (min→to sırayla). */
  bands: GaugeBand[];
  label: string;
  /** Ortada gösterilecek metin. */
  display: string;
  width?: number;
}

/** Yarım daire gauge — eşik bantlı, iğneli. Likidite/CEI/Runway vb. için. */
export const Gauge = ({ t, value, min, max, bands, label, display, width = 170 }: GaugeProps) => {
  const cx = width / 2, cy = 96, r = width * 0.39, sw = 13;
  const frac = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min)));
  const ang = (f: number) => Math.PI * (1 - f);
  const pt = (f: number): [number, number] => [cx + r * Math.cos(ang(f)), cy - r * Math.sin(ang(f))];
  let from = min;
  const segs = bands.map((b) => { const seg = { f0: frac(from), f1: frac(b.to), color: b.color }; from = b.to; return seg; });
  const arc = (f0: number, f1: number) => { const [x0, y0] = pt(f0); const [x1, y1] = pt(f1); return `M ${x0} ${y0} A ${r} ${r} 0 0 0 ${x1} ${y1}`; };
  const [nx, ny] = pt(frac(value));
  return (
    <svg width={width} height={120} viewBox={`0 0 ${width} 120`}>
      {segs.map((s, i) => <path key={i} d={arc(s.f0, s.f1)} stroke={s.color} strokeWidth={sw} fill="none" opacity={0.85} />)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={t.tx} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={t.tx} />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize={19} fontWeight={700} fill={t.tx}>{display}</text>
      <text x={cx} y={116} textAnchor="middle" fontSize={11} fill={t.tx2}>{label}</text>
    </svg>
  );
};
