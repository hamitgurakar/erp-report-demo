import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import { Icon } from './Icon';

export interface FilterOption {
  key: string;
  label: string;
  options: string[];
}

interface FilterBarProps {
  t: Theme;
  l: LangStrings;
  filters: FilterOption[];
  onApply?: (values: Record<string, string>) => void;
}

export const FilterBar = ({ t, l, filters, onApply }: FilterBarProps) => {
  const initial = Object.fromEntries(filters.map((f) => [f.key, l.filtreTumu]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [open, setOpen] = useState<string | null>(null);

  const set = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setOpen(null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 12px 0', flexWrap: 'wrap' }}>
      {filters.map((f) => (
        <div key={f.key} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(open === f.key ? null : f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: `1px solid ${open === f.key ? t.pr : t.bd}`,
              background: open === f.key ? t.prL : t.bg2,
              color: t.tx, fontSize: 12, cursor: 'pointer', outline: 'none',
            }}
          >
            <span style={{ color: t.tx2 }}>{f.label}:</span>
            <span style={{ fontWeight: 500, color: values[f.key] !== l.filtreTumu ? t.pr : t.tx }}>
              {values[f.key]}
            </span>
            <Icon name="chevDown" size={11} color={t.tx3} />
          </button>
          {open === f.key && (
            <div
              style={{
                position: 'absolute', top: 38, left: 0, minWidth: 160,
                background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 40, padding: 4,
              }}
            >
              {[l.filtreTumu, ...f.options].map((opt) => (
                <div
                  key={opt}
                  onClick={() => set(f.key, opt)}
                  style={{
                    padding: '7px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 7,
                    color: values[f.key] === opt ? t.pr : t.tx,
                    background: values[f.key] === opt ? t.prL : 'transparent',
                    fontWeight: values[f.key] === opt ? 500 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseOver={(e) => { if (values[f.key] !== opt) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={(e) => { if (values[f.key] !== opt) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {opt}
                  {values[f.key] === opt && <Icon name="check" size={12} color={t.pr} />}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => onApply?.(values)}
        style={{
          padding: '6px 16px', borderRadius: 8, border: 'none',
          background: t.pr, color: '#fff', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          marginLeft: 4,
        }}
      >
        <Icon name="filter" size={12} color="#fff" />
        {l.filtreUygula}
      </button>

      {/* Reset if any non-default value */}
      {Object.values(values).some((v) => v !== l.filtreTumu) && (
        <button
          onClick={() => setValues(initial)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, cursor: 'pointer' }}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
};
