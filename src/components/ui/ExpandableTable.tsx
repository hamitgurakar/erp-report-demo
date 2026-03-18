import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import type { PerfRow } from '../../constants/categoryData';
import { mkSpk } from '../../constants/data';
import { Spark } from './Spark';
import { Icon } from './Icon';
import { ColumnManager, type ColDef } from './ColumnManager';

interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

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

const DEFAULT_VISIBLE = ['satisAdedi', 'ciroNet', 'ciroPay', 'cogs', 'cogsOrani', 'brutMarj', 'netMarj', 'iadeOrani', 'stokDevir', 'trend'];

interface ExpandableTableProps {
  t: Theme;
  l: LangStrings;
  data: PerfRow[];
  lang: 'tr' | 'en';
}

const brutMarjColor = (v: number, t: Theme): string =>
  v >= 30 ? t.gn : v >= 15 ? t.am : t.rd;

const netMarjColor = (v: number, t: Theme): string =>
  v >= 15 ? t.gn : v >= 5 ? t.am : t.rd;

const cogsOraniColor = (v: number, t: Theme): string =>
  v > 70 ? t.rd : v >= 50 ? t.am : t.gn;

const stokDevirColor = (v: number, t: Theme): string =>
  v > 6 ? t.gn : v >= 3 ? t.am : t.rd;

const iadeColor = (v: number, t: Theme): string =>
  v > 5 ? t.rd : t.tx;

// +/- SVG icon for expand/collapse
const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {expanded ? (
      <line x1="5" y1="12" x2="19" y2="12" />
    ) : (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    )}
  </svg>
);

export const ExpandableTable = ({ t, l, data, lang }: ExpandableTableProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(DEFAULT_VISIBLE);
  const [search, setSearch] = useState('');

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSort = (key: string) => {
    setSort((prev) => prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' });
  };

  const visibleCols = ALL_COLUMNS.filter((c) => visibleKeys.includes(c.key));

  const renderValue = (col: ColDef, row: PerfRow) => {
    const v = (row as unknown as Record<string, number>)[col.key];
    if (col.key === 'trend') {
      return <Spark data={mkSpk(row.sparkTrend, 'K ₺', lang)} color={row.sparkTrend === 'up' ? t.gn : row.sparkTrend === 'down' ? t.rd : t.am} t={t} compact />;
    }
    if (col.key === 'brutMarj' || col.key === 'netMarj') {
      const clr = col.key === 'brutMarj' ? brutMarjColor(v, t) : netMarjColor(v, t);
      return <span style={{ color: clr, fontWeight: 600 }}>{v.toFixed(1)}%</span>;
    }
    if (col.key === 'cogsOrani') {
      return <span style={{ color: cogsOraniColor(v, t), fontWeight: 600 }}>{v.toFixed(1)}%</span>;
    }
    if (col.key === 'iadeOrani') {
      return (
        <span style={{ color: iadeColor(v, t), fontWeight: v > 5 ? 600 : 400 }}>
          {v > 5 && <span style={{ fontSize: 9, background: t.rdL, color: t.rd, borderRadius: 4, padding: '1px 4px', marginRight: 4 }}>!</span>}
          {v.toFixed(1)}%
        </span>
      );
    }
    if (col.key === 'stokDevir') {
      return <span style={{ color: stokDevirColor(v, t), fontWeight: 600 }}>{v.toFixed(1)}x</span>;
    }
    if (col.key === 'ciroPay') return `${v.toFixed(1)}%`;
    if (col.key === 'ortFiyat') return `${v.toLocaleString('tr-TR')} ₺`;
    if (col.key === 'satisAdedi' || col.key === 'stokAdedi') return v.toLocaleString('tr-TR');
    return `${v.toLocaleString('tr-TR')} K`;
  };

  const filterRows = (rows: PerfRow[]): PerfRow[] => {
    if (!search) return rows;
    return rows
      .map((row) => {
        const children = row.children ? filterRows(row.children) : undefined;
        const matches = row.name.toLowerCase().includes(search.toLowerCase());
        if (matches) return { ...row, children };
        if (children && children.length > 0) return { ...row, children };
        return null;
      })
      .filter(Boolean) as PerfRow[];
  };

  const renderRows = (rows: PerfRow[], depth = 0): React.ReactNode[] => {
    const filtered = depth === 0 ? filterRows(rows) : rows;
    const sorted = sort
      ? [...filtered].sort((a, b) => {
          const av = (a as unknown as Record<string, number>)[sort.key] ?? 0;
          const bv = (b as unknown as Record<string, number>)[sort.key] ?? 0;
          return sort.dir === 'asc' ? av - bv : bv - av;
        })
      : filtered;

    return sorted.flatMap((row: PerfRow) => {
      const isExp = expanded.has(row.id);
      const hasChildren = (row.children?.length ?? 0) > 0;
      const indent = depth * 20;

      const cells: React.ReactNode = (
        <tr
          key={row.id}
          style={{ borderBottom: `1px solid ${t.bd}` }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          {/* Name cell */}
          <td style={{ padding: '9px 12px', fontSize: 12, color: t.tx, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indent }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleRow(row.id)}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.tx3 }}
                >
                  <ExpandIcon expanded={isExp} />
                </button>
              ) : (
                <div style={{ width: 18, flexShrink: 0 }} />
              )}
              <span style={{ fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400, color: depth === 2 ? t.tx2 : t.tx }}>
                {row.name}
              </span>
            </div>
          </td>
          {/* Data cells */}
          {visibleCols.map((col) => (
            <td key={col.key} style={{ padding: '9px 12px', fontSize: 12, textAlign: col.key === 'trend' ? 'center' : 'right', whiteSpace: 'nowrap' }}>
              {renderValue(col, row)}
            </td>
          ))}
        </tr>
      );

      if (isExp && hasChildren) {
        return [cells, ...renderRows(row.children!, depth + 1)];
      }
      return [cells];
    });
  };

  return (
    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Table toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.katPerfBaslik ?? l.katPerf}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'tr' ? 'Kategori ara...' : 'Search category...'}
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 5, paddingBottom: 5, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 12, color: t.tx, outline: 'none', width: 160 }}
            />
          </div>
          <ColumnManager t={t} l={l} allColumns={ALL_COLUMNS} visibleKeys={visibleKeys} onChange={setVisibleKeys} />
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}
          >
            <Icon name="download" size={12} color={t.tx3} />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
              <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: t.bg2 }}>
                {l.tblKategori}
              </th>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'trend' && handleSort(col.key)}
                  style={{
                    padding: '8px 12px', fontSize: 11, fontWeight: 600, color: sort?.key === col.key ? t.pr : t.tx2,
                    textAlign: 'right', whiteSpace: 'nowrap', cursor: col.key !== 'trend' ? 'pointer' : 'default',
                    userSelect: 'none', position: 'sticky', top: 0, background: t.bg2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    {col.label}
                    {col.key !== 'trend' && (
                      <Icon
                        name={sort?.key === col.key ? (sort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'}
                        size={10}
                        color={sort?.key === col.key ? t.pr : t.tx3}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderRows(data)}
            {/* Total row */}
            <tr style={{ borderTop: `2px solid ${t.bd}`, background: t.bg2 }}>
              <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: t.tx }}>{l.toplam}</td>
              {visibleCols.map((col) => {
                if (col.key === 'trend') return <td key={col.key} />;
                if (['ciroPay', 'cogsOrani', 'brutMarj', 'netMarj', 'iadeOrani', 'stokDevir', 'ortFiyat'].includes(col.key)) return <td key={col.key} />;
                const total = data.reduce((s, r) => s + ((r as unknown as Record<string, number>)[col.key] ?? 0), 0);
                return (
                  <td key={col.key} style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: t.tx, textAlign: 'right' }}>
                    {col.key === 'satisAdedi' || col.key === 'stokAdedi' ? total.toLocaleString('tr-TR') : `${total.toLocaleString('tr-TR')} K`}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
