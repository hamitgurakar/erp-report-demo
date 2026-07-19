import type { Theme } from '../../types';
import type { FinCurrency } from '../../types/finance';

interface CurrencyToggleProps {
  value: FinCurrency;
  onChange: (v: FinCurrency) => void;
  t: Theme;
}

/** TRY / USD para birimi toggle pill. */
export const CurrencyToggle = ({ value, onChange, t }: CurrencyToggleProps) => (
  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
    {(['TRY', 'USD'] as FinCurrency[]).map((c) => (
      <button
        key={c}
        onClick={() => onChange(c)}
        style={{
          padding: '5px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          background: value === c ? t.pr : 'transparent', color: value === c ? '#fff' : t.tx2,
        }}
      >
        {c === 'TRY' ? '₺ TRY' : '$ USD'}
      </button>
    ))}
  </div>
);
