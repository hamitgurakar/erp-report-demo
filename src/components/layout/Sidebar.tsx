import type { Theme, LangStrings, Panel, DeptReport } from '../../types';
import { Icon } from '../ui/Icon';

interface SidebarProps {
  t: Theme;
  l: LangStrings;
  open: boolean;
  onClose: () => void;
  deptReports: DeptReport[];
  expandedDepts: string[];
  onToggleDept: (id: string) => void;
  favs: string[];
  onToggleFav: (key: string) => void;
  activeRep: string;
  onSelectRep: (key: string) => void;
  panels: Panel[];
  view: string;
  onSelectPanel: (name: string) => void;
}

export const Sidebar = ({
  t, l, open, onClose,
  deptReports, expandedDepts, onToggleDept,
  favs, onToggleFav,
  activeRep, onSelectRep,
  panels, view, onSelectPanel,
}: SidebarProps) => {
  if (!open) return null;

  return (
    <div style={{ width: 230, background: t.bg2, borderRight: `1px solid ${t.bd}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${t.bd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.pr, fontWeight: 600, fontSize: 13 }}>
          <Icon name="layout" size={17} color={t.pr} />
          {l.raporMerkezi}
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}
        >
          <Icon name="panelLeft" size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {/* Favorites */}
        {favs.length > 0 && (
          <>
            <div style={{ padding: '6px 14px 4px', fontSize: 10, fontWeight: 600, color: t.tx3, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="starF" size={11} color={t.am} />{l.favRaporlar}
            </div>
            {favs.map((k) => {
              const [dId, rIdx] = k.split('__');
              const dept = deptReports.find((d) => d.id === dId);
              const rName = dept?.reports[parseInt(rIdx)] || k;
              const isActive = activeRep === k && view === 'report';
              return (
                <div
                  key={k}
                  onClick={() => onSelectRep(k)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 22px', fontSize: 12, cursor: 'pointer', color: isActive ? t.pr : t.tx, background: isActive ? t.prL : 'transparent', fontWeight: isActive ? 500 : 400, borderRadius: '0 6px 6px 0', marginRight: 6 }}
                  onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = t.bg3; }}
                  onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon name="fileText" size={13} color={isActive ? t.pr : t.tx3} />
                  <span style={{ flex: 1 }}>{rName}</span>
                </div>
              );
            })}
            <div style={{ height: 1, background: t.bd, margin: '8px 14px' }} />
          </>
        )}

        {/* Custom panels */}
        <div style={{ padding: '4px 14px 4px', fontSize: 10, fontWeight: 600, color: t.tx3, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="folder" size={11} color={t.pu} />{l.ozelRaporlar}
        </div>
        {panels.map((p, i) => {
          const isActive = view === `panel:${p.name}`;
          return (
            <div
              key={i}
              onClick={() => onSelectPanel(p.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 22px', fontSize: 12, cursor: 'pointer', color: isActive ? t.pr : t.tx, background: isActive ? t.prL : 'transparent', fontWeight: isActive ? 500 : 400, borderRadius: '0 6px 6px 0', marginRight: 6 }}
              onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = t.bg3; }}
              onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon name="layout" size={13} color={isActive ? t.pr : t.tx3} />
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 10, color: t.tx3, background: t.bg3, borderRadius: 4, padding: '1px 5px' }}>{p.items.length}</span>
            </div>
          );
        })}

        <div style={{ height: 1, background: t.bd, margin: '8px 14px' }} />
        <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 600, color: t.tx3, letterSpacing: 0.8, textTransform: 'uppercase' }}>{l.raporlar}</div>

        {/* Department reports */}
        {deptReports.map((dept) => {
          const isExpanded = expandedDepts.includes(dept.id);
          return (
            <div key={dept.id}>
              <div
                onClick={() => onToggleDept(dept.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', color: t.tx, fontSize: 13, fontWeight: 500 }}
                onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = t.bg3)}
                onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <span style={{ transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'flex' }}>
                  <Icon name="chevRight" size={13} color={t.tx3} />
                </span>
                <Icon name={dept.icon} size={15} color={t.tx2} />
                <span>{dept.label}</span>
              </div>
              {isExpanded && dept.reports.map((rep, ri) => {
                const k = `${dept.id}__${ri}`;
                const isActive = activeRep === k && view === 'report';
                const isFav = favs.includes(k);
                return (
                  <div
                    key={k}
                    onClick={() => onSelectRep(k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 44px', fontSize: 12, cursor: 'pointer', color: isActive ? t.pr : t.tx2, background: isActive ? t.prL : 'transparent', fontWeight: isActive ? 500 : 400 }}
                    onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = t.bg3; }}
                    onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ flex: 1 }}>{rep}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); onToggleFav(k); }}
                      style={{ cursor: 'pointer', display: 'flex' }}
                    >
                      <Icon name={isFav ? 'starF' : 'star'} size={12} color={isFav ? t.am : t.tx3} />
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
