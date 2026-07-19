import { useState } from 'react';
import type { Theme } from '../../types';
import { Icon } from '../ui/Icon';

export interface DropdownOption<T extends string> { value: T; label: string }

interface DropdownProps<T extends string> {
  label?: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  t: Theme;
  width?: number;
}

/** Seeking-Alpha tarzı kompakt dropdown (Dönem / Görünüm / Sıralama). */
export function Dropdown<T extends string>({ label, value, options, onChange, t, width }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      {label && <span style={{ fontSize: 9.5, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>}
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, minWidth: width ?? 130, justifyContent: 'space-between',
          padding: '6px 10px', fontSize: 12, fontWeight: 500, color: t.tx, background: t.cd,
          border: `1px solid ${t.bd}`, borderRadius: 8, cursor: 'pointer',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur?.label ?? value}</span>
        <Icon name="chevDown" size={13} color={t.tx3} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', marginTop: 4, left: 0, right: 0, minWidth: width ?? 130, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 60, padding: 4 }}>
          {options.map((o) => (
            <div
              key={o.value}
              onMouseDown={() => { onChange(o.value); setOpen(false); }}
              style={{ padding: '7px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer', color: o.value === value ? t.pr : t.tx, background: o.value === value ? t.prL : 'transparent', fontWeight: o.value === value ? 600 : 400 }}
              onMouseOver={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = t.bg3; }}
              onMouseOut={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
