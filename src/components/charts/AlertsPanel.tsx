import type { Theme, LangStrings } from '../../types';
import { mkAlerts } from '../../constants/data';
import { Icon } from '../ui/Icon';

interface AlertsPanelProps {
  t: Theme;
  l: LangStrings;
}

const ICON_MAP: Record<string, string> = {
  danger: 'alertCircle',
  warning: 'alertTriangle',
  info: 'trendUp',
};

export const AlertsPanel = ({ t, l }: AlertsPanelProps) => {
  const alerts = mkAlerts(l);

  const colorMap = {
    danger: t.rd,
    warning: t.am,
    info: t.gn,
  };

  const bgMap = {
    danger: t.rdL,
    warning: t.amL,
    info: t.gnL,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a, i) => {
        const c = colorMap[a.type];
        const bg = bgMap[a.type];
        return (
          <div
            key={i}
            style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: bg, border: `1px solid ${c}22` }}
          >
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              <Icon name={ICON_MAP[a.type]} size={15} color={c} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: t.tx2, lineHeight: 1.4 }}>{a.desc}</div>
              <button
                style={{ marginTop: 6, fontSize: 10, color: c, background: 'transparent', border: `1px solid ${c}44`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontWeight: 500 }}
              >
                {a.action} →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
