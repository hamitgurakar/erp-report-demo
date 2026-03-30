import { useState, useRef, useEffect } from 'react';
import type { Theme, LangStrings } from '../../types';
import type { ColDef } from './ColumnManager';
import { Icon } from './Icon';

export interface ColumnPreset {
  id: string;
  name: string;
  columns: string[];
  isBuiltIn: boolean;
}

export type TableType = 'performance' | 'criticalStock' | 'brand' | 'inefficient' | 'abc' | 'salesProduct';

const BUILT_IN: Record<TableType, ColumnPreset[]> = {
  performance: [
    { id: 'perf-perf', name: 'Performans',  columns: ['satisAdedi','ciroNet','ciroPay','cogs','cogsOrani','brutMarj','netMarj','iadeOrani','stokDevir','trend'], isBuiltIn: true },
    { id: 'perf-stok', name: 'Stok Odaklı', columns: ['satisAdedi','ciroNet','stokAdedi','stokDegeri','stokDevir','trend'], isBuiltIn: true },
    { id: 'perf-marj', name: 'Marj Odaklı', columns: ['ciroNet','cogs','cogsOrani','brutKar','brutMarj','netKar','netMarj','ortFiyat'], isBuiltIn: true },
  ],
  criticalStock: [
    { id: 'crit-def', name: 'Varsayılan', columns: ['urun','kategori','mevcutStok','gunlukSatis','tukenmeTarihi','tedarikSuresi','durum','aksiyon'], isBuiltIn: true },
    { id: 'crit-det', name: 'Detaylı',    columns: ['urun','kategori','mevcutStok','gunlukSatis','tukenmeTarihi','tedarikSuresi','durum','aksiyon','stokDegeri','ortFiyat'], isBuiltIn: true },
  ],
  brand: [
    { id: 'brand-def', name: 'Varsayılan', columns: ['marka','ciro','pay','marj','sku','satisAdedi','stok','iade','buyume'], isBuiltIn: true },
    { id: 'brand-oz',  name: 'Özet',       columns: ['marka','ciro','marj','buyume'], isBuiltIn: true },
  ],
  inefficient: [
    { id: 'inef-def', name: 'Varsayılan', columns: ['urun','kategori','stokDeg','stokYas','son30Gun','son90Gun','stokDevir','brutMarj','durum','aksiyon'], isBuiltIn: true },
  ],
  abc: [
    { id: 'abc-def', name: 'Varsayılan', columns: ['urun','abc','ciro','marj','stokGun','satisHizi','trend','aksiyon'], isBuiltIn: true },
  ],
  salesProduct: [
    { id: 'sp-perf', name: 'Performans', columns: ['satis','ciro','ciroPay','cogs','cogsOrani','brutMarj','netMarj','iade','devir','trend'], isBuiltIn: true },
    { id: 'sp-stok', name: 'Stok Odaklı', columns: ['satis','ciro','stokAdedi','stokDegeri','devir','iade','trend'], isBuiltIn: true },
    { id: 'sp-marj', name: 'Marj Odaklı', columns: ['satis','ciro','cogs','cogsOrani','brutKar','brutMarj','netKar','netMarj','trend'], isBuiltIn: true },
  ],
};

let _uid = 0;
const genId = () => `preset-${++_uid}-${Date.now()}`;

interface Props {
  t: Theme;
  l: LangStrings;
  tableType: TableType;
  allColumns: ColDef[];
  visibleKeys: string[];
  onChange: (keys: string[]) => void;
}

const PencilIcon = ({ color }: { color: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const RadioDot = ({ active, color }: { active: boolean; color: string }) => (
  <div style={{
    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${active ? color : '#CBD5E1'}`,
    background: active ? color : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
  </div>
);

export const ColumnPresetDropdown = ({ t, l, tableType, allColumns, visibleKeys, onChange }: Props) => {
  const builtIn = BUILT_IN[tableType] ?? [];

  // ── Preset state ──────────────────────────────────────────────────────────────
  const [presets, setPresets]       = useState<ColumnPreset[]>(builtIn);
  const [activeId, setActiveId]     = useState<string>(builtIn[0]?.id ?? '');
  const [recentIds, setRecentIds]   = useState<string[]>([builtIn[0]?.id ?? ''].filter(Boolean));

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [dropdownOpen, setDropdown] = useState(false);
  const [modalOpen, setModal]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null); // preset loaded in modal

  // Save-as dialog state
  const [saveDialog, setSaveDialog] = useState(false);
  const [saveName, setSaveName]     = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDelConf] = useState(false);

  // Modal column selection state
  const [draft, setDraft]           = useState<string[]>(visibleKeys);
  const [colSearch, setColSearch]   = useState('');
  const [drag, setDrag]             = useState<number | null>(null);
  const [over, setOver]             = useState<number | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const activePreset   = presets.find((p) => p.id === activeId);
  const editingPreset  = editingId ? presets.find((p) => p.id === editingId) : null;
  const recentPresets  = recentIds.map((id) => presets.find((p) => p.id === id)).filter(Boolean) as ColumnPreset[];
  const popularPresets = builtIn.filter((p) => !recentIds.includes(p.id));
  const filteredCols   = allColumns.filter((c) => c.label.toLowerCase().includes(colSearch.toLowerCase()));
  const selectedCols   = draft.map((k) => allColumns.find((c) => c.key === k)!).filter(Boolean);

  const selectPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setActiveId(id);
    setRecentIds((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, 3));
    const valid = preset.columns.filter((k) => allColumns.some((c) => c.key === k));
    onChange(valid.length > 0 ? valid : allColumns.map((c) => c.key));
    setDropdown(false);
  };

  // Open customize modal (optionally pre-loaded with a preset's columns)
  const openModal = (presetId: string | null) => {
    setEditingId(presetId);
    if (presetId) {
      const p = presets.find((pr) => pr.id === presetId);
      if (p) {
        const valid = p.columns.filter((k) => allColumns.some((c) => c.key === k));
        setDraft(valid.length > 0 ? valid : visibleKeys);
      }
    } else {
      setDraft(visibleKeys);
    }
    setColSearch('');
    setDropdown(false);
    setModal(true);
  };

  // Apply columns without saving as preset
  const applyColumns = () => {
    onChange(draft);
    setModal(false);
  };

  // Open the save-as dialog
  const openSaveDialog = () => {
    // Pre-fill name: editing non-builtin → use its name; otherwise empty
    setSaveName(editingPreset && !editingPreset.isBuiltIn ? editingPreset.name : '');
    setSaveDialog(true);
  };

  // Save preset (from save dialog)
  const confirmSave = () => {
    const name = saveName.trim() || (l.ozel ?? 'Özel');
    // If editing a user preset with the same name → update in-place
    if (editingPreset && !editingPreset.isBuiltIn && editingPreset.name === name) {
      setPresets((prev) => prev.map((p) => p.id === editingId ? { ...p, columns: draft } : p));
      onChange(draft);
      setActiveId(editingId!);
    } else {
      const newId = genId();
      setPresets((prev) => [...prev, { id: newId, name, columns: draft, isBuiltIn: false }]);
      setActiveId(newId);
      setRecentIds((prev) => [newId, ...prev].slice(0, 3));
      onChange(draft);
    }
    setSaveDialog(false);
    setModal(false);
  };

  // Delete preset
  const deletePreset = () => {
    if (!editingId) return;
    setPresets((prev) => prev.filter((p) => p.id !== editingId));
    setRecentIds((prev) => prev.filter((r) => r !== editingId));
    const fallback = builtIn[0];
    if (fallback) {
      setActiveId(fallback.id);
      const valid = fallback.columns.filter((k) => allColumns.some((c) => c.key === k));
      onChange(valid.length > 0 ? valid : allColumns.map((c) => c.key));
    }
    setDelConf(false);
    setSaveDialog(false);
    setModal(false);
  };

  // Drag-and-drop in right panel
  const handleDrop = (toIdx: number) => {
    if (drag === null || drag === toIdx) return;
    const d = [...draft];
    const [moved] = d.splice(drag, 1);
    d.splice(toIdx, 0, moved);
    setDraft(d);
    setDrag(null);
    setOver(null);
  };

  return (
    <>
      {/* ── Trigger button + dropdown ─────────────────────────────────────────── */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdown((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${t.bd}`, background: dropdownOpen ? t.prL : t.bg2,
            color: t.tx, fontSize: 12, cursor: 'pointer',
          }}
        >
          <Icon name="columns" size={13} color={t.tx2} />
          <span style={{ color: t.tx2 }}>{l.sutunlar}:</span>
          <span style={{ fontWeight: 600, color: dropdownOpen ? t.pr : t.tx }}>{activePreset?.name ?? l.sutunlar}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round">
            <polyline points={dropdownOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 150,
            background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.13)', minWidth: 270, maxHeight: 420, overflowY: 'auto',
          }}>
            {/* Recently used */}
            {recentPresets.length > 0 && (
              <>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: t.tx3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {l.sonKullanilanlar}
                </div>
                {recentPresets.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                      background: p.id === activeId ? t.prL : 'transparent', cursor: 'pointer',
                    }}
                    onMouseOver={(e) => { if (p.id !== activeId) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                    onMouseOut={(e) => { if (p.id !== activeId) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div onClick={() => selectPreset(p.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <RadioDot active={p.id === activeId} color={t.pr} />
                      <span style={{ fontSize: 13, color: t.tx, fontWeight: p.id === activeId ? 600 : 400 }}>{p.name}</span>
                    </div>
                    {/* Pencil — opens modal pre-loaded with this preset */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(p.id); }}
                      title={l.sutunlariOzellestir}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx3, padding: 2, display: 'flex', opacity: 0.55 }}
                      onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                      onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.55')}
                    >
                      <PencilIcon color={t.tx3} />
                    </button>
                  </div>
                ))}
                {popularPresets.length > 0 && <div style={{ height: 1, background: t.bd, margin: '4px 0' }} />}
              </>
            )}

            {/* Popular */}
            {popularPresets.length > 0 && (
              <>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: t.tx3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {l.populer}
                </div>
                {popularPresets.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPreset(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg2)}
                    onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <RadioDot active={false} color={t.pr} />
                    <span style={{ fontSize: 13, color: t.tx }}>{p.name}</span>
                  </div>
                ))}
              </>
            )}

            <div style={{ height: 1, background: t.bd, margin: '4px 0' }} />

            {/* Customize columns */}
            <div
              onClick={() => openModal(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderRadius: '0 0 12px 12px' }}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg2)}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Icon name="settings" size={13} color={t.tx2} />
              <span style={{ fontSize: 13, color: t.tx }}>{l.sutunlariOzellestir}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Customize Modal ───────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setModal(false); setSaveDialog(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: t.cd, borderRadius: 16, width: 660, maxHeight: '84vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', border: `1px solid ${t.bd}`, position: 'relative' }}
          >
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.tx }}>{l.sutunlariOzellestir}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: t.tx3 }}>{draft.length} {l.sutunSecili}</span>
                <button onClick={() => { setModal(false); setSaveDialog(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx2, display: 'flex' }}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: column list */}
              <div style={{ width: 300, borderRight: `1px solid ${t.bd}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.bg2, borderRadius: 8, padding: '6px 10px', border: `1px solid ${t.bd}` }}>
                    <Icon name="search" size={13} color={t.tx3} />
                    <input
                      value={colSearch}
                      onChange={(e) => setColSearch(e.target.value)}
                      placeholder={l.sutunAra}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: t.tx }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {filteredCols.map((col) => (
                    <div
                      key={col.key}
                      onClick={() => setDraft((prev) => prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key])}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 12, color: t.tx }}
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
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: selected draggable */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, fontSize: 11, fontWeight: 600, color: t.tx2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {l.seciliSutunlar}
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
                        opacity: drag === idx ? 0.4 : 1,
                        transition: 'background 0.1s',
                      }}
                    >
                      <Icon name="gripV" size={14} color={t.tx3} />
                      <span style={{ flex: 1 }}>{col.label}</span>
                      <button
                        onClick={() => setDraft((prev) => prev.filter((k) => k !== col.key))}
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
              {/* "Save as preset" button — Meta style, outlined, bottom-left */}
              <button
                onClick={openSaveDialog}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  border: `1px solid ${t.bd}`, background: 'transparent',
                  color: t.tx2, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                }}
                onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = t.pr)}
                onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = t.bd)}
              >
                {/* Bookmark icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {l.goruntuyuKaydet ?? 'Bu Görünümü Kaydet'}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setModal(false); setSaveDialog(false); }}
                  style={{ padding: '7px 18px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, cursor: 'pointer' }}
                >
                  {l.iptal}
                </button>
                <button
                  onClick={applyColumns}
                  style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: t.pr, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {l.uygula ?? 'Uygula'}
                </button>
              </div>
            </div>

            {/* ── Save-as dialog (floats inside/over modal) ───────────────────── */}
            {saveDialog && (
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                onClick={() => setSaveDialog(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: t.cd, borderRadius: 12, padding: '24px 24px 20px', width: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: `1px solid ${t.bd}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: t.tx, marginBottom: 4 }}>
                        {l.goruntuyuKaydet ?? 'Bu Görünümü Kaydet'}
                      </div>
                      <div style={{ fontSize: 12, color: t.tx3, lineHeight: 1.5 }}>
                        {l.sutunSetiAciklama ?? 'Kaydedilen sütun setlerini Sütunlar menüsünden bulabilirsiniz.'}
                      </div>
                    </div>
                    <button onClick={() => setSaveDialog(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex', flexShrink: 0, marginLeft: 8 }}>
                      <Icon name="x" size={15} />
                    </button>
                  </div>

                  {/* Name input */}
                  <div style={{ marginTop: 14, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.tx2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {l.presetAdi ?? 'Ad'}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        autoFocus
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value.slice(0, 50))}
                        placeholder={l.presetAdi ?? 'Sütun seti adı'}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '9px 44px 9px 12px', borderRadius: 8,
                          border: `1.5px solid ${t.pr}`, outline: 'none',
                          fontSize: 13, color: t.tx, background: t.bg2,
                        }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: t.tx3 }}>
                        {saveName.length}/50
                      </span>
                    </div>
                  </div>

                  {/* Footer: delete link (if editing user preset) + Cancel/Save */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {editingPreset && !editingPreset.isBuiltIn ? (
                      <button
                        onClick={() => { setSaveDialog(false); setDelConf(true); }}
                        style={{ fontSize: 11, color: t.rd, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        {l.sutunSil}
                      </button>
                    ) : <div />}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setSaveDialog(false)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, cursor: 'pointer' }}
                      >
                        {l.iptal}
                      </button>
                      <button
                        onClick={confirmSave}
                        disabled={!saveName.trim()}
                        style={{
                          padding: '7px 16px', borderRadius: 8, border: 'none',
                          background: saveName.trim() ? t.pr : t.bd,
                          color: saveName.trim() ? '#fff' : t.tx3,
                          fontSize: 12, fontWeight: 600, cursor: saveName.trim() ? 'pointer' : 'default',
                        }}
                      >
                        {l.kaydet}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: t.cd, borderRadius: 14, padding: '28px 28px 22px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: `1px solid ${t.bd}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: t.tx }}>{l.sutunSil}</div>
            <div style={{ fontSize: 13, color: t.tx2, marginBottom: 24, lineHeight: 1.5 }}>{l.sutunSetiSilOnay}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDelConf(false)}
                style={{ padding: '7px 18px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12, cursor: 'pointer' }}
              >
                {l.iptal}
              </button>
              <button
                onClick={deletePreset}
                style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: t.rd, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {l.sil}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
