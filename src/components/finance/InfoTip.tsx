import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Theme, Lang } from '../../types';
import { Icon } from '../ui/Icon';
import { finTerm } from '../../i18n/terms';

interface InfoTipProps {
  t: Theme;
  lang: Lang;
  /** terms.ts FIN_TERMS anahtarı. */
  termKey?: string;
  /** Doğrudan metin (termKey yerine). */
  text?: string;
  size?: number;
}

/**
 * "i" tooltip — React Portal ile document.body'ye render edilir; tablo/sticky hücre
 * stacking context'inden bağımsız, hiçbir komşu hücrenin altında kalmaz.
 */
export const InfoTip = ({ t, lang, termKey, text, size = 12 }: InfoTipProps) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const txt = text ?? (termKey ? finTerm(termKey, lang) : null);
  if (!txt) return null;
  return (
    <span
      style={{ display: 'inline-flex', marginLeft: 5, opacity: 0.32, transition: 'opacity 0.12s', cursor: 'help' }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <Icon name="info" size={size} color={t.tx3} />
      {pos && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.max(8, Math.min(pos.x - 125, window.innerWidth - 258)),
            top: pos.y - 8, transform: 'translateY(-100%)', width: 250,
            background: t.tx, color: t.bg, borderRadius: 8, padding: '9px 12px',
            fontSize: 11, lineHeight: 1.45, boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            zIndex: 99999, fontWeight: 400, whiteSpace: 'normal', pointerEvents: 'none',
          }}
        >
          {txt}
        </div>,
        document.body,
      )}
    </span>
  );
};
