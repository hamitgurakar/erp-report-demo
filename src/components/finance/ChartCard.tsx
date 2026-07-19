import type { ReactNode } from 'react';
import type { Theme, Lang } from '../../types';

interface ChartCardProps {
  title: string;
  t: Theme;
  lang?: Lang;
  children: ReactNode;
  /** Sağ üst kontrol (toggle/filtre). */
  right?: ReactNode;
  /** "Neden:" alt-notu — grafiğin tasarım gerekçesi/okuma ipucu. */
  why?: string;
  subtitle?: string;
  /** Grid'de kaç kolon kaplasın (flex-basis yüzdesi). */
  span?: number;
}

/** Grafik kartı: başlık + opsiyonel sağ kontrol + Recharts slot + opsiyonel "Neden:" alt-notu. */
export const ChartCard = ({ title, t, lang = 'tr', children, right, why, subtitle, span }: ChartCardProps) => (
  <div
    style={{
      background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18,
      display: 'flex', flexDirection: 'column', minWidth: 0,
      flex: span ? `1 1 ${span}%` : '1 1 100%',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: subtitle ? 2 : 14 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.tx3, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
    {subtitle && <div style={{ height: 12 }} />}
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    {why && (
      <div style={{ fontSize: 10.5, color: t.tx3, lineHeight: 1.4, marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${t.bd}` }}>
        <b style={{ color: t.tx2 }}>{lang === 'en' ? 'Why: ' : 'Neden: '}</b>{why}
      </div>
    )}
  </div>
);
