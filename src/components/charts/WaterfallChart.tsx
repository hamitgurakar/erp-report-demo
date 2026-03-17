import type { Theme, Lang } from '../../types';
import { wfD } from '../../constants/data';

const TOTAL_NAMES = ['Brüt Kâr', 'Faaliyet K.', 'Net Kâr', 'Gross Profit', 'EBIT', 'Net Profit'];

interface WaterfallChartProps {
  t: Theme;
  lang: Lang;
}

export const WaterfallChart = ({ t, lang }: WaterfallChartProps) => {
  let running = 0;

  const bars = wfD.map((d) => {
    const nm = lang === 'en' ? d.nameEN : d.name;
    const isTotal = TOTAL_NAMES.includes(nm);

    if (isTotal) {
      running = d.val;
      return { nm, val: d.val, base: 0, h: d.val, isTotal };
    }

    const base = running;
    running += d.val;
    return { nm, val: d.val, base: d.val > 0 ? base : base + d.val, h: Math.abs(d.val), isTotal };
  });

  const max = Math.max(...bars.map((b) => b.base + b.h)) * 1.1;
  const barW = 48;
  const gap = 12;
  const chartW = bars.length * (barW + gap) + 20;
  const scale = (v: number) => 20 + ((max - v) / max) * 150;

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} 210`} style={{ overflow: 'visible' }}>
      {bars.map((b, i) => {
        const x = 10 + i * (barW + gap);
        const y = scale(b.base + b.h);
        const h = (b.h / max) * 150;
        const fill = b.isTotal
          ? b.val > 0 ? t.gn : t.rd
          : b.val > 0 ? t.c1 : t.rdP;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx={4} fill={fill} opacity={b.isTotal ? 1 : 0.8} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={t.tx} fontSize={9} fontWeight={500}>
              {b.val}K
            </text>
            <text x={x + barW / 2} y={200} textAnchor="middle" fill={t.tx2} fontSize={8}>
              {b.nm}
            </text>
            {i < bars.length - 1 && !b.isTotal && (
              <line
                x1={x + barW}
                y1={scale(running)}
                x2={x + barW + gap}
                y2={scale(running)}
                stroke={t.bd}
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
