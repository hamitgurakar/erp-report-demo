import type { Theme, LangStrings } from '../../types';

interface HealthScoreProps {
  score: number;
  t: Theme;
  l: LangStrings;
}

export const HealthScore = ({ score, t, l }: HealthScoreProps) => {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? t.gn : score >= 50 ? t.am : t.rd;
  const label = score >= 75 ? l.saglikli : score >= 50 ? l.dikkat : l.riskli;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={115} height={115} viewBox="0 0 115 115">
        <circle cx="57.5" cy="57.5" r={r} fill="none" stroke={t.bg3} strokeWidth={7} />
        <circle
          cx="57.5"
          cy="57.5"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 57.5 57.5)"
        />
        <text x="57.5" y="53" textAnchor="middle" fill={t.tx} fontSize="24" fontWeight="700">
          {score}
        </text>
        <text x="57.5" y="70" textAnchor="middle" fill={t.tx2} fontSize="11">
          {label}
        </text>
      </svg>
    </div>
  );
};
