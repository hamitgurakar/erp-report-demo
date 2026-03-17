import { useState, type ReactNode, type CSSProperties } from 'react';
import type { Theme, Panel, LangStrings } from '../../types';
import { Icon } from './Icon';
import { PinMenu } from '../kpi/PinMenu';

const EXPORT_FORMATS = ['Excel (.xlsx)', 'CSV (.csv)', 'PNG'];

interface ChartContainerProps {
  children: ReactNode;
  t: Theme;
  l: LangStrings;
  style?: CSSProperties;
  title?: string;
  id?: string;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const ChartContainer = ({ children, t, l, style, title, id, panels, onAddPanel, onPinTo }: ChartContainerProps) => {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [pin, setPin] = useState(false);

  const toolbar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{title}</span>
      {hov && (
        <div style={{ display: 'flex', gap: 3 }}>
          {id && (
            <button
              onClick={(e) => { e.stopPropagation(); setPin(!pin); }}
              style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="plus" size={13} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
          >
            <Icon name={expanded ? 'minimize' : 'maximize'} size={13} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowEx(!showEx)}
              style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="download" size={13} />
            </button>
            {showEx && (
              <div style={{ position: 'absolute', top: 30, right: 0, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: 4, zIndex: 20, minWidth: 130, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {EXPORT_FORMATS.map((f) => (
                  <div
                    key={f}
                    onClick={() => setShowEx(false)}
                    style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 5, color: t.tx }}
                    onMouseOver={(e) => ((e.target as HTMLElement).style.background = t.bg2)}
                    onMouseOut={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
        onClick={() => setExpanded(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => { setHov(false); setShowEx(false); setPin(false); }}
          style={{ background: t.cd, borderRadius: 14, padding: 24, width: '80vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}
        >
          {title && toolbar}
          {pin && <PinMenu t={t} l={l} onClose={() => setPin(false)} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} cardId={id!} />}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setShowEx(false); setPin(false); }}
      style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18, position: 'relative', ...style }}
    >
      {title && toolbar}
      {pin && <PinMenu t={t} l={l} onClose={() => setPin(false)} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} cardId={id!} />}
      {children}
    </div>
  );
};
