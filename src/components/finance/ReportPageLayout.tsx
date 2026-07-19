import type { ReactNode, CSSProperties } from 'react';
import type { Theme, Lang } from '../../types';
import type { FinCurrency } from '../../types/finance';
import { Icon } from '../ui/Icon';
import { CurrencyToggle } from './CurrencyToggle';

interface ReportPageLayoutProps {
  title: string;
  t: Theme;
  lang: Lang;
  children: ReactNode;
  subtitle?: string;
  /** Dönem / Görünüm / Sıralama gibi sayfa-özel dropdown'lar. */
  controls?: ReactNode;
  /** TRY/USD toggle (verilirse gösterilir). */
  currency?: FinCurrency;
  onCurrency?: (v: FinCurrency) => void;
  /** Düzenle modu (verilirse buton gösterilir). */
  editing?: boolean;
  onToggleEdit?: () => void;
  /** Değişiklik Geçmişi (verilirse buton gösterilir). */
  onOpenHistory?: () => void;
  historyCount?: number;
  /** Kaynak-of-truth çapraz link (ör. "Ham tablo: Finansal Veriler →"). */
  crossLink?: { label: string; onClick: () => void };
}

/**
 * Finans rapor sayfası iskeleti: başlık + kontrol barı (dropdown'lar · TRY/USD · Düzenle ·
 * Değişiklik Geçmişi) + içerik slot'u. Tüm suite sayfaları bunu kullanır.
 */
export const ReportPageLayout = ({
  title, t, lang, children, subtitle, controls,
  currency, onCurrency, editing, onToggleEdit, onOpenHistory, historyCount, crossLink,
}: ReportPageLayoutProps) => {
  const btn = (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
    borderRadius: 8, cursor: 'pointer', border: `1px solid ${active ? t.pr : t.bd}`,
    background: active ? t.pr : t.cd, color: active ? '#fff' : t.tx2,
  });

  return (
    <div style={{ paddingTop: 8, paddingBottom: 40 }}>
      {/* Header + control bar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: t.tx, margin: 0, letterSpacing: -0.3 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 12.5, color: t.tx2, marginTop: 4 }}>{subtitle}</div>}
          {crossLink && (
            <div
              onClick={crossLink.onClick}
              style={{ fontSize: 11.5, color: t.pr, fontWeight: 600, marginTop: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Icon name="externalLink" size={12} color={t.pr} />{crossLink.label}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          {controls}
          {currency && onCurrency && <CurrencyToggle value={currency} onChange={onCurrency} t={t} />}
          {onToggleEdit && (
            <button onClick={onToggleEdit} style={btn(!!editing)}>
              <Icon name="settings" size={13} color={editing ? '#fff' : t.tx2} />
              {editing ? (lang === 'en' ? 'Done' : 'Bitir') : (lang === 'en' ? 'Edit' : 'Düzenle')}
            </button>
          )}
          {onOpenHistory && (
            <button onClick={onOpenHistory} style={btn(false)}>
              <Icon name="refresh" size={13} color={t.tx2} />
              {lang === 'en' ? 'History' : 'Değişiklik Geçmişi'}
              {historyCount ? <span style={{ fontSize: 10, background: t.prL, color: t.pr, borderRadius: 10, padding: '1px 6px' }}>{historyCount}</span> : null}
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
