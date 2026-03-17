import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import type { Theme, SparkPoint } from '../../types';

interface SparkProps {
  data: SparkPoint[];
  color: string;
  t: Theme;
}

export const Spark = ({ data, color, t }: SparkProps) => {
  const gradId = `s${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <div
                style={{
                  background: t.tx,
                  color: t.bg,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {(payload[0].payload as SparkPoint).label}
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: t.cd, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
