import type { Theme, Lang } from '../../types';

export type AlertSeverity = 'critical' | 'warning' | 'watch' | 'good' | 'tip';

export interface FinAlert {
  severity: AlertSeverity;
  text: string;
  /** Drill-down bağlantı etiketi (opsiyonel). */
  linkLabel?: string;
  onLink?: () => void;
}

interface AIAlertPanelProps {
  alerts: FinAlert[];
  t: Theme;
  lang?: Lang;
  title?: string;
}

const META: Record<AlertSeverity, { emoji: string; tone: (t: Theme) => { fg: string; bg: string } }> = {
  critical: { emoji: '🔴', tone: (t) => ({ fg: t.rd, bg: t.rdL }) },
  warning: { emoji: '🟠', tone: (t) => ({ fg: t.am, bg: t.amL }) },
  watch: { emoji: '🔵', tone: (t) => ({ fg: t.pr, bg: t.prL }) },
  good: { emoji: '✅', tone: (t) => ({ fg: t.gn, bg: t.gnL }) },
  tip: { emoji: '💡', tone: (t) => ({ fg: t.tl, bg: t.bg3 }) },
};

/** AI öneri/uyarı paneli — önem ikonlu (🔴Acil/🟠Uyarı/🔵İzle/✅/💡) liste + drill-down. */
export const AIAlertPanel = ({ alerts, t, lang = 'tr', title }: AIAlertPanelProps) => (
  <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: t.tx, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      <span>🤖</span>{title ?? (lang === 'en' ? 'AI Insights & Alerts' : 'AI Öneri & Uyarılar')}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a, i) => {
        const m = META[a.severity];
        const c = m.tone(t);
        return (
          <div key={i} style={{ display: 'flex', gap: 9, background: c.bg, borderRadius: 8, padding: '9px 11px', borderLeft: `3px solid ${c.fg}` }}>
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.4 }}>{m.emoji}</span>
            <div style={{ fontSize: 12, color: t.tx, lineHeight: 1.45, flex: 1 }}>
              {a.text}
              {a.linkLabel && (
                <span
                  onClick={a.onLink}
                  style={{ marginLeft: 6, color: t.pr, fontWeight: 600, cursor: a.onLink ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                >
                  {a.linkLabel} →
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
