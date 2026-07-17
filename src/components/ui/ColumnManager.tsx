import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import { Icon } from './Icon';
import { tTerm } from '../../i18n/terms';

export interface ColDef {
  key: string;
  label: string;
  group?: string;
}

interface ColumnManagerProps {
  t: Theme;
  l: LangStrings;
  allColumns: ColDef[];
  visibleKeys: string[];
  onChange: (keys: string[]) => void;
}

export const ColumnManager = ({ t, l, allColumns, visibleKeys, onChange }: ColumnManagerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(visibleKeys);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const toggle = (key: string) => {
    setDraft((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const removeFromSelected = (key: string) => {
    setDraft((prev) => prev.filter((k) => k !== key));
  };

  const filtered = allColumns.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCols = draft.map((k) => allColumns.find((c) => c.key === k)!).filter(Boolean);

  const handleDrop = (toIdx: number) => {
    if (drag === null || drag === toIdx) return;
    const newDraft = [...draft];
    const [moved] = newDraft.splice(drag, 1);
    newDraft.splice(toIdx, 0, moved);
    setDraft(newDraft);
    setDrag(null);
    setOver(null);
  };

  return (
    <>
      <button
        onClick={() => { setDraft(visibleKeys); setOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8,
          border: `1px solid ${t.bd}`, background: t.bg2,
          color: t.tx, fontSize: 12, cursor: 'pointer',
        }}
      >
        <Icon name="columns" size={13} color={t.tx2} />
        {l.sutunlar}
        <span style={{ background: t.prL, color: t.pr, fontSize: 10, borderRadius: 5, padding: '1px 6px', fontWeight: 600 }}>
          {visibleKeys.length}
        </span>
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: t.cd, borderRadius: 16, width: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: `1px solid ${t.bd}` }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{l.sutunlar}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: t.tx2 }}>
                  {draft.length} {l.sutunSecili}
                </span>
                <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx2 }}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: all columns */}
              <div style={{ width: 280, borderRight: `1px solid ${t.bd}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.bg2, borderRadius: 8, padding: '6px 10px', border: `1px solid ${t.bd}` }}>
                    <Icon name="search" size={13} color={t.tx3} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={l.sutunAra}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: t.tx }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {filtered.map((col) => (
                    <div
                      key={col.key}
                      onClick={() => toggle(col.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                        cursor: 'pointer', fontSize: 12, color: t.tx,
                      }}
                      onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg2)}
                      onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `1.5px solid ${draft.includes(col.key) ? t.pr : t.bd}`,
                        background: draft.includes(col.key) ? t.pr : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {draft.includes(col.key) && <Icon name="check" size={10} color="#fff" />}
                      </div>
                      {tTerm(col.label)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: selected (draggable) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, fontSize: 11, color: t.tx2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {tTerm('Seçili sütunlar')}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {selectedCols.map((col, idx) => (
                    <div
                      key={col.key}
                      draggable
                      onDragStart={() => setDrag(idx)}
                      onDragOver={(e) => { e.preventDefault(); setOver(idx); }}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
                        fontSize: 12, cursor: 'grab', color: t.tx,
                        background: over === idx ? t.prL : 'transparent',
                        transition: 'background 0.1s',
                        opacity: drag === idx ? 0.4 : 1,
                      }}
                    >
                      <Icon name="gripV" size={14} color={t.tx3} />
                      <span style={{ flex: 1 }}>{tTerm(col.label)}</span>
                      <button
                        onClick={() => removeFromSelected(col.key)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex', padding: 2 }}
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ fontSize: 11, color: t.rd, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {l.sutunSil}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding: '7px 18px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, cursor: 'pointer' }}
                >
                  {l.iptal}
                </button>
                <button
                  onClick={() => { onChange(draft); setOpen(false); }}
                  style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: t.pr, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  {l.kaydet}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
