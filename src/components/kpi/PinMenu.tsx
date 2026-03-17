import { useState } from 'react';
import type { Theme, Panel, LangStrings } from '../../types';
import { Icon } from '../ui/Icon';

interface PinMenuProps {
  t: Theme;
  l: LangStrings;
  onClose: () => void;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  cardId: string;
}

export const PinMenu = ({ t, l, onClose, panels, onAddPanel, onPinTo, cardId }: PinMenuProps) => {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onAddPanel(name.trim());
      onPinTo(name.trim(), cardId);
      setName('');
      setCreating(false);
      onClose();
    }
  };

  return (
    <div
      style={{ position: 'absolute', top: 34, right: 8, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 6, zIndex: 40, minWidth: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={() => setCreating(true)}
        style={{ padding: '7px 10px', fontSize: 12, color: t.pr, cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
        onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg2)}
        onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <Icon name="plus" size={14} color={t.pr} />
        {l.yeniPano}
      </div>

      {creating && (
        <div style={{ padding: '6px 10px', display: 'flex', gap: 4 }}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={l.panoAdi}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx, fontSize: 12, outline: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <button
            onClick={handleSave}
            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: t.pr, color: '#fff', fontSize: 11, cursor: 'pointer' }}
          >
            {l.kaydet}
          </button>
        </div>
      )}

      {panels.length > 0 && <div style={{ height: 1, background: t.bd, margin: '6px 0' }} />}
      {panels.length > 0 && (
        <div style={{ padding: '4px 10px', fontSize: 10, color: t.tx3, fontWeight: 600, letterSpacing: 0.5 }}>
          {l.panolarim}
        </div>
      )}

      {panels.map((p, i) => (
        <div
          key={i}
          onClick={() => { onPinTo(p.name, cardId); onClose(); }}
          style={{ padding: '7px 10px', fontSize: 12, color: t.tx, cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg2)}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Icon name="layout" size={14} color={t.tx3} />
          {p.name}
          {p.items.includes(cardId) && <span style={{ marginLeft: 'auto', color: t.gn }}>✓</span>}
        </div>
      ))}
    </div>
  );
};
