import GaugeComponent from 'react-gauge-component';
import type { Theme } from '../../types';

export interface GaugeThreshold { limit: number; color: string }

interface GaugeCardProps {
  value: number;
  min: number;
  max: number;
  /** Yay altında gösterilecek başlık ("Kompozit", "CEI", "vs %25 yasal"...). */
  label: string;
  /** Merkez değer biçimi ("%", "x", "gün", "0-100"...). */
  format?: (v: number) => string;
  /** Renk bantları (yeşil/sarı/kırmızı stop'ları); son limit = max olmalı. */
  thresholds: GaugeThreshold[];
  /** Opsiyonel: merkeze basılacak harf notu (A-F) — değer alt-başlığa iner. */
  centerText?: string;
  /** Düşük iyi mi (bilgilendirme; renkler thresholds'tan gelir). */
  inverted?: boolean;
  t: Theme;
}

/**
 * Tek amaçlı yarım daire gauge — react-gauge-component üzerine.
 * Arc bantları thresholds'tan; needle overlay hazır; arc kapalı, needle içeride.
 * Değer etiketi daima gerçek (clamp'lenmemiş) değeri gösterir.
 */
export const GaugeCard = ({ value, min, max, label, format, thresholds, centerText, t }: GaugeCardProps) => {
  const clamped = Math.max(min, Math.min(max, value));
  const fmt = (v: number) => (format ? format(v) : String(Math.round(v)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 230 }}>
        <GaugeComponent
          type="semicircle"
          minValue={min}
          maxValue={max}
          value={clamped}
          arc={{ width: 0.22, padding: 0.006, cornerRadius: 3, subArcs: thresholds.map((th) => ({ limit: th.limit, color: th.color })) }}
          pointer={{ type: 'needle', color: t.tx, baseColor: t.tx, length: 0.72, width: 13, animate: false, elastic: false }}
          labels={{
            valueLabel: {
              matchColorWithArc: true,
              maxDecimalDigits: 2,
              style: { fontSize: '32px', fontWeight: 800, textShadow: 'none' },
              // Daima gerçek değeri (veya harf notunu) göster — clamp'ten etkilenmesin.
              formatTextValue: () => (centerText ?? fmt(value)),
            },
            tickLabels: { hideMinMax: true, ticks: [] },
          }}
        />
      </div>
      <div style={{ marginTop: -4, textAlign: 'center', lineHeight: 1.3 }}>
        {centerText && <div style={{ fontSize: 13, fontWeight: 700, color: t.tx2 }}>{fmt(value)}</div>}
        <div style={{ fontSize: 12, color: t.tx3 }}>{label}</div>
      </div>
    </div>
  );
};
