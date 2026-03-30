import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import type { PerfRow } from '../../constants/categoryData';
import { mkSpk } from '../../constants/data';
import { Spark } from './Spark';
import { Icon } from './Icon';
import { type ColDef } from './ColumnManager';
import { ColumnPresetDropdown } from './ColumnPresetDropdown';

interface SortState { key: string; dir: 'asc' | 'desc'; }

const ALL_COLUMNS: ColDef[] = [
  { key: 'satisAdedi', label: 'Satış Adedi' },
  { key: 'ciroNet', label: 'Ciro Net (K ₺)' },
  { key: 'ciroPay', label: 'Ciro Payı %' },
  { key: 'cogs', label: 'COGS (K ₺)' },
  { key: 'cogsOrani', label: 'COGS Oranı %' },
  { key: 'brutKar', label: 'Brüt Kâr (K ₺)' },
  { key: 'brutMarj', label: 'Brüt Kâr Marjı %' },
  { key: 'netKar', label: 'Net Kâr (K ₺)' },
  { key: 'netMarj', label: 'Net Kâr Marjı %' },
  { key: 'ortFiyat', label: 'Ort. Satış Fiyatı (₺)' },
  { key: 'iadeOrani', label: 'İade Oranı %' },
  { key: 'stokDevir', label: 'Stok Devir Hızı (x)' },
  { key: 'stokAdedi', label: 'Stok Adedi' },
  { key: 'stokDegeri', label: 'Stok Değeri (K ₺)' },
  { key: 'trend', label: 'Trend' },
];

const FILTERABLE_COLS = ALL_COLUMNS.filter(c => c.key !== 'trend');
const OPERATORS = ['>', '<', '>=', '<=', '=', '≠'] as const;
type Operator = typeof OPERATORS[number];

interface MetricFilter { id: number; metric: string; operator: Operator; value: number; }

const DEFAULT_VISIBLE = ['satisAdedi', 'ciroNet', 'ciroPay', 'cogs', 'cogsOrani', 'brutMarj', 'netMarj', 'iadeOrani', 'stokDevir', 'trend'];

interface ExpandableTableProps { t: Theme; l: LangStrings; data: PerfRow[]; lang: 'tr' | 'en'; }

const brutMarjColor = (v: number, t: Theme) => v >= 30 ? t.gn : v >= 15 ? t.am : t.rd;
const netMarjColor = (v: number, t: Theme) => v >= 15 ? t.gn : v >= 5 ? t.am : t.rd;
const cogsOraniColor = (v: number, t: Theme) => v > 70 ? t.rd : v >= 50 ? t.am : t.gn;
const stokDevirColor = (v: number, t: Theme) => v > 6 ? t.gn : v >= 3 ? t.am : t.rd;
const iadeColor = (v: number, t: Theme) => v > 5 ? t.rd : t.tx;

const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {expanded ? <line x1="5" y1="12" x2="19" y2="12" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
  </svg>
);

const applyOp = (val: number, op: Operator, target: number): boolean => {
  switch (op) {
    case '>': return val > target;
    case '<': return val < target;
    case '>=': return val >= target;
    case '<=': return val <= target;
    case '=': return val === target;
    case '≠': return val !== target;
  }
};

export const ExpandableTable = ({ t, l, data, lang }: ExpandableTableProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(DEFAULT_VISIBLE);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MetricFilter[]>([]);
  const [nextId, setNextId] = useState(1);

  const toggleRow = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSort = (key: string) => setSort(prev => prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' });
  const visibleCols = ALL_COLUMNS.filter(c => visibleKeys.includes(c.key));

  // Filter management
  const addFilter = () => { setFilters(prev => [...prev, { id: nextId, metric: 'satisAdedi', operator: '>', value: 0 }]); setNextId(n => n + 1); };
  const removeFilter = (id: number) => setFilters(prev => prev.filter(f => f.id !== id));
  const updateFilter = (id: number, field: keyof MetricFilter, val: string | number) => setFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  const clearFilters = () => setFilters([]);

  // Check if a row passes all metric filters
  const passesFilters = (row: PerfRow): boolean => {
    if (filters.length === 0) return true;
    return filters.every(f => {
      const v = (row as unknown as Record<string, number>)[f.metric];
      if (v === undefined) return true;
      return applyOp(v, f.operator, f.value);
    });
  };

  // Filter + search rows recursively
  const filterRows = (rows: PerfRow[]): PerfRow[] => {
    return rows
      .map(row => {
        const children = row.children ? filterRows(row.children) : undefined;
        const nameMatch = !search || row.name.toLowerCase().includes(search.toLowerCase());
        const metricMatch = passesFilters(row);
        const childrenMatch = children && children.length > 0;
        if (nameMatch && metricMatch) return { ...row, children };
        if (childrenMatch) return { ...row, children };
        return null;
      })
      .filter(Boolean) as PerfRow[];
  };

  // Auto-expand parents when searching
  const getMatchIds = (rows: PerfRow[], parentIds: string[] = []): Set<string> => {
    const ids = new Set<string>();
    for (const row of rows) {
      const nameMatch = search && row.name.toLowerCase().includes(search.toLowerCase());
      if (nameMatch) parentIds.forEach(id => ids.add(id));
      if (row.children) {
        const childIds = getMatchIds(row.children, [...parentIds, row.id]);
        childIds.forEach(id => ids.add(id));
      }
    }
    return ids;
  };

  // When search changes, auto-expand matching parents
  const autoExpandIds = search ? getMatchIds(data) : new Set<string>();
  const effectiveExpanded = new Set([...expanded, ...autoExpandIds]);

  const isHighlighted = (name: string) => search && name.toLowerCase().includes(search.toLowerCase());

  const renderValue = (col: ColDef, row: PerfRow) => {
    const v = (row as unknown as Record<string, number>)[col.key];
    if (col.key === 'trend') return <Spark data={mkSpk(row.sparkTrend, 'K ₺', lang)} color={row.sparkTrend === 'up' ? t.gn : row.sparkTrend === 'down' ? t.rd : t.am} t={t} compact />;
    if (col.key === 'brutMarj' || col.key === 'netMarj') return <span style={{ color: col.key === 'brutMarj' ? brutMarjColor(v, t) : netMarjColor(v, t), fontWeight: 600 }}>{v.toFixed(1)}%</span>;
    if (col.key === 'cogsOrani') return <span style={{ color: cogsOraniColor(v, t), fontWeight: 600 }}>{v.toFixed(1)}%</span>;
    if (col.key === 'iadeOrani') return <span style={{ color: iadeColor(v, t), fontWeight: v > 5 ? 600 : 400 }}>{v > 5 && <span style={{ fontSize: 9, background: t.rdL, color: t.rd, borderRadius: 4, padding: '1px 4px', marginRight: 4 }}>!</span>}{v.toFixed(1)}%</span>;
    if (col.key === 'stokDevir') return <span style={{ color: stokDevirColor(v, t), fontWeight: 600 }}>{v.toFixed(1)}x</span>;
    if (col.key === 'ciroPay') return `${v.toFixed(1)}%`;
    if (col.key === 'ortFiyat') return `${v.toLocaleString('tr-TR')} ₺`;
    if (col.key === 'satisAdedi' || col.key === 'stokAdedi') return v.toLocaleString('tr-TR');
    return `${v.toLocaleString('tr-TR')} K`;
  };

  const renderRows = (rows: PerfRow[], depth = 0): React.ReactNode[] => {
    const filtered = depth === 0 ? filterRows(rows) : rows;
    const sorted = sort ? [...filtered].sort((a, b) => { const av = (a as unknown as Record<string, number>)[sort.key] ?? 0; const bv = (b as unknown as Record<string, number>)[sort.key] ?? 0; return sort.dir === 'asc' ? av - bv : bv - av; }) : filtered;

    return sorted.flatMap((row: PerfRow) => {
      const isExp = effectiveExpanded.has(row.id);
      const hasChildren = (row.children?.length ?? 0) > 0;
      const indent = depth * 20;
      const hl = isHighlighted(row.name);

      const cells: React.ReactNode = (
        <tr key={row.id} style={{ borderBottom: `1px solid ${t.bd}`, background: hl ? '#FEF9C3' : 'transparent' }}
          onMouseOver={e => { if (!hl) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = hl ? '#FEF9C3' : 'transparent'; }}
        >
          <td style={{ padding: '9px 12px', fontSize: 12, color: t.tx, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indent }}>
              {hasChildren ? (
                <button onClick={() => toggleRow(row.id)} style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.tx3 }}>
                  <ExpandIcon expanded={isExp} />
                </button>
              ) : <div style={{ width: 18, flexShrink: 0 }} />}
              <span style={{ fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400, color: depth === 2 ? t.tx2 : t.tx }}>{row.name}</span>
            </div>
          </td>
          {visibleCols.map(col => (
            <td key={col.key} style={{ padding: '9px 12px', fontSize: 12, textAlign: col.key === 'trend' ? 'center' : 'right', whiteSpace: 'nowrap' }}>{renderValue(col, row)}</td>
          ))}
        </tr>
      );
      if (isExp && hasChildren) return [cells, ...renderRows(row.children!, depth + 1)];
      return [cells];
    });
  };

  return (
    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.katPerfBaslik ?? l.katPerf}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'tr' ? 'Kategori, alt kategori veya ürün ara...' : 'Search category, sub-category or product...'}
              style={{ paddingLeft: 28, paddingRight: search ? 28 : 10, paddingTop: 5, paddingBottom: 5, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 11, color: t.tx, outline: 'none', width: 260 }}
            />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, fontSize: 14, lineHeight: 1 }}>×</button>}
          </div>
          {/* Filters toggle */}
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: `1px solid ${filters.length > 0 ? t.pr : t.bd}`, background: filters.length > 0 ? t.prL : t.bg2, color: filters.length > 0 ? t.pr : t.tx2, fontSize: 11, cursor: 'pointer', fontWeight: filters.length > 0 ? 600 : 400 }}>
            <Icon name="filter" size={12} color={filters.length > 0 ? t.pr : t.tx3} />
            {lang === 'tr' ? 'Filtreler' : 'Filters'}{filters.length > 0 && ` (${filters.length})`}
          </button>
          <ColumnPresetDropdown t={t} l={l} tableType="performance" allColumns={ALL_COLUMNS} visibleKeys={visibleKeys} onChange={setVisibleKeys} />
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} /> Excel
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: `1px solid ${t.bd}` }}>
          {filters.map(f => (
            <div key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <select value={f.metric} onChange={e => updateFilter(f.id, 'metric', e.target.value)} style={{ width: 140, padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, fontSize: 11, color: t.tx, background: t.cd, outline: 'none' }}>
                {FILTERABLE_COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={f.operator} onChange={e => updateFilter(f.id, 'operator', e.target.value)} style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: `1px solid ${t.bd}`, fontSize: 11, color: t.tx, background: t.cd, outline: 'none' }}>
                {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <input type="number" value={f.value || ''} onChange={e => updateFilter(f.id, 'value', parseFloat(e.target.value) || 0)} style={{ width: 90, padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, fontSize: 11, color: t.tx, background: t.cd, outline: 'none' }} placeholder="değer" />
              <button onClick={() => removeFilter(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={addFilter} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.pr}`, background: 'transparent', color: t.pr, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>+ {lang === 'tr' ? 'Filtre Ekle' : 'Add Filter'}</button>
            {filters.length > 0 && <button onClick={clearFilters} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: t.rd, fontSize: 10, cursor: 'pointer' }}>{lang === 'tr' ? 'Tümünü Temizle' : 'Clear All'}</button>}
          </div>
          {/* Active filter chips */}
          {filters.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {filters.map(f => {
                const label = FILTERABLE_COLS.find(c => c.key === f.metric)?.label ?? f.metric;
                return (
                  <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 16, background: '#EEF2FF', color: '#4F46E5', fontSize: 10, fontWeight: 600 }}>
                    {label} {f.operator} {f.value}
                    <button onClick={() => removeFilter(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: 12, lineHeight: 1, marginLeft: 2 }}>×</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
              <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: t.bg2 }}>{l.tblKategori}</th>
              {visibleCols.map(col => (
                <th key={col.key} onClick={() => col.key !== 'trend' && handleSort(col.key)}
                  style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: sort?.key === col.key ? t.pr : t.tx2, textAlign: 'right', whiteSpace: 'nowrap', cursor: col.key !== 'trend' ? 'pointer' : 'default', userSelect: 'none', position: 'sticky', top: 0, background: t.bg2 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    {col.label}
                    {col.key !== 'trend' && <Icon name={sort?.key === col.key ? (sort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={10} color={sort?.key === col.key ? t.pr : t.tx3} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderRows(data)}
            <tr style={{ borderTop: `2px solid ${t.bd}`, background: t.bg2 }}>
              <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: t.tx }}>{l.toplam}</td>
              {visibleCols.map(col => {
                if (col.key === 'trend') return <td key={col.key} />;
                if (['ciroPay', 'cogsOrani', 'brutMarj', 'netMarj', 'iadeOrani', 'stokDevir', 'ortFiyat'].includes(col.key)) return <td key={col.key} />;
                const total = data.reduce((s, r) => s + ((r as unknown as Record<string, number>)[col.key] ?? 0), 0);
                return <td key={col.key} style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: t.tx, textAlign: 'right' }}>{col.key === 'satisAdedi' || col.key === 'stokAdedi' ? total.toLocaleString('tr-TR') : `${total.toLocaleString('tr-TR')} K`}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
