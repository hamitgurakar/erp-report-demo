import type { Theme, Lang } from '../../types';
import type { FinSource } from '../../types/finance';

interface SourceBadgeProps {
  source: FinSource;
  t: Theme;
  lang: Lang;
}

const LABELS: Record<FinSource, { tr: string; en: string }> = {
  erp: { tr: 'ERP', en: 'ERP' },
  parasut: { tr: 'Paraşüt', en: 'Paraşüt' },
  manual: { tr: 'Manuel', en: 'Manual' },
  computed: { tr: 'Hesaplanan', en: 'Computed' },
};

/** Kaynak rozeti: ERP yeşil / Paraşüt gri / Manuel amber / Hesaplanan mavi. Arka plan tint YOK. */
export const SourceBadge = ({ source, t, lang }: SourceBadgeProps) => {
  const color: Record<FinSource, string> = {
    erp: t.gn, parasut: t.tx3, manual: t.am, computed: t.pr,
  };
  const label = LABELS[source][lang === 'en' ? 'en' : 'tr'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: color[source], whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: color[source], flexShrink: 0 }} />
      {label}
    </span>
  );
};
