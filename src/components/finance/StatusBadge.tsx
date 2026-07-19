import type { ReactNode } from 'react';
import type { Theme } from '../../types';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'neutral';

interface StatusBadgeProps {
  label: ReactNode;
  tone?: BadgeTone;
  t: Theme;
  dot?: boolean;
}

/** Yeniden kullanılabilir durum rozeti (🟢Güncel / 🟠 / 🔴 / ✅ vb.). */
export const StatusBadge = ({ label, tone = 'neutral', t, dot = true }: StatusBadgeProps) => {
  const map: Record<BadgeTone, { fg: string; bg: string }> = {
    green: { fg: t.gn, bg: t.gnL },
    amber: { fg: t.am, bg: t.amL },
    red: { fg: t.rd, bg: t.rdL },
    blue: { fg: t.pr, bg: t.prL },
    neutral: { fg: t.tx2, bg: t.bg3 },
  };
  const c = map[tone];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
        color: c.fg, background: c.bg, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap',
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: c.fg, flexShrink: 0 }} />}
      {label}
    </span>
  );
};
