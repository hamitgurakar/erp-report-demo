import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { Theme, Lang } from '../../types';
import { Icon } from '../ui/Icon';
import { InfoTip } from './InfoTip';
import { ChangePct } from './ChangePct';

interface KPICardProps {
  title: string;
  value: string;
  t: Theme;
  lang: Lang;
  /** YoY / dönem değişimi (yüzde veya pp). */
  trend?: { value: number; isRatio?: boolean };
  /** Metrik için "iyi yön": yukarı mı aşağı mı? Trend rengini ve oku belirler. */
  goodDir?: 'up' | 'down';
  /** Sparkline serisi (opsiyonel). */
  spark?: number[];
  sparkColor?: string;
  /** terms.ts anahtarı → "i" tooltip. */
  infoTermKey?: string;
  infoText?: string;
  /** Alt not (ör. benchmark). */
  hint?: string;
}

/** Finans KPI kartı: başlık + "i" + değer + trend rozeti + sparkline + iyi-yön oku. */
export const KPICard = ({
  title, value, t, lang, trend, goodDir = 'up', spark, sparkColor, infoTermKey, infoText, hint,
}: KPICardProps) => {
  const clr = sparkColor ?? t.tl;
  const gradId = `kpi-${title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}-${clr.replace('#', '')}`;
  const data = spark?.map((v, i) => ({ i, v })) ?? [];

  return (
    <div
      style={{
        background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '13px 15px',
        flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 11.5, color: t.tx2, lineHeight: 1.3 }}>{title}</span>
        {(infoTermKey || infoText) && <InfoTip t={t} lang={lang} termKey={infoTermKey} text={infoText} />}
        <span title={goodDir === 'up' ? (lang === 'en' ? 'Higher is better' : 'Yüksek iyi') : (lang === 'en' ? 'Lower is better' : 'Düşük iyi')} style={{ marginLeft: 'auto', display: 'inline-flex', opacity: 0.4 }}>
          <Icon name={goodDir === 'up' ? 'arrowUp' : 'arrowDown'} size={11} color={t.tx3} />
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: t.tx, letterSpacing: -0.5 }}>{value}</span>
        {trend && <ChangePct value={trend.value} t={t} isRatio={trend.isRatio} goodDir={goodDir} />}
      </div>

      {spark && spark.length > 1 && (
        <div style={{ height: 30, marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={clr} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={clr} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={clr} strokeWidth={1.6} fill={`url(#${gradId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {hint && <div style={{ fontSize: 10, color: t.tx3, lineHeight: 1.35 }}>{hint}</div>}
    </div>
  );
};
