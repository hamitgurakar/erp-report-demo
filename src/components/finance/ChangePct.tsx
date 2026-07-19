import type { Theme } from '../../types';
import { Icon } from '../ui/Icon';

interface ChangePctProps {
  /** Değişim değeri: oran metrikleri için puan farkı (pp), diğerleri için yüzde değişim (%). */
  value: number;
  t: Theme;
  /** true → "pp" (puan) eki; false → "%" eki. */
  isRatio?: boolean;
  /** İyi yön: 'up' pozitif=yeşil (varsayılan), 'down' negatif=yeşil. */
  goodDir?: 'up' | 'down';
  size?: number;
  showIcon?: boolean;
}

/** Dönem değişim rozeti: yeşil/kırmızı, oran metriklerinde "pp". */
export const ChangePct = ({ value, t, isRatio = false, goodDir = 'up', size = 11, showIcon = true }: ChangePctProps) => {
  const isUp = value >= 0;
  const good = goodDir === 'up' ? isUp : !isUp;
  const color = value === 0 ? t.tx3 : good ? t.gn : t.rd;
  const sign = value > 0 ? '+' : '';
  const suffix = isRatio ? ' pp' : '%';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: size, fontWeight: 700, color }}>
      {showIcon && value !== 0 && <Icon name={isUp ? 'arrowUp' : 'arrowDown'} size={size + 1} color={color} />}
      {sign}{isRatio ? value.toFixed(1) : value.toFixed(1)}{suffix}
    </span>
  );
};
