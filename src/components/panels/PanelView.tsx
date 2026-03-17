import { useState } from 'react';
import type { Theme, Panel, LangStrings, Lang } from '../../types';
import { kpiDefs, mkSpk } from '../../constants/data';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';

interface PanelViewProps {
  panel: Panel;
  t: Theme;
  l: LangStrings;
  lang: Lang;
  onRemoveItem: (panelName: string, itemId: string) => void;
  onReorder: (panelName: string, from: number, to: number) => void;
}

export const PanelView = ({ panel, t, l, lang, onRemoveItem, onReorder }: PanelViewProps) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const defs = kpiDefs(l);
  const items = panel.items
    .map((id) => { const def = defs[id]; return def ? { id, ...def } : null; })
    .filter(Boolean) as (ReturnType<typeof kpiDefs>[string] & { id: string })[];

  if (!items.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: t.tx3 }}>
        <Icon name="layout" size={44} color={t.bd} />
        <div style={{ marginTop: 16, fontSize: 15, fontWeight: 500, color: t.tx2 }}>{l.panoBos}</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>{l.panoBosAciklama}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: '16px 0' }}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIdx !== null && dragIdx !== idx) onReorder(panel.name, dragIdx, idx);
            setDragIdx(null);
          }}
          style={{ background: t.cd, border: `1px solid ${dragIdx === idx ? t.pr : t.bd}`, borderRadius: 10, padding: '14px 16px', cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="grip" size={14} color={t.tx3} />
              <span style={{ fontSize: 12, color: t.tx2 }}>{item.title}</span>
            </div>
            <button
              onClick={() => onRemoveItem(panel.name, item.id)}
              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.tx, marginBottom: 4 }}>{item.value}</div>
          {item.trendValue && (
            <div style={{ fontSize: 11, color: item.trendValue.startsWith('+') ? t.gn : t.rd, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700, marginBottom: 4 }}>
              <Icon name="trendUp" size={12} color={item.trendValue.startsWith('+') ? t.gn : t.rd} />
              {item.trendValue}
            </div>
          )}
          <Spark
            data={mkSpk(item.sparkTrend, item.unit || 'K ₺', lang)}
            color={(t as Record<string, string>)[item.color] || t.gn}
            t={t}
          />
        </div>
      ))}
    </div>
  );
};
