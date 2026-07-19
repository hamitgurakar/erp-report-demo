import { useState, Fragment, type CSSProperties, type ReactNode } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/LanguageContext';
import { finTerm } from '../../i18n/terms';
import { fmtNumber } from '../../utils/format';
import type {
  FinCurrency, FinSource, ViewMode, OrderMode, PeriodType, FinancialPeriod,
  InflationMethod, DividendEvent, PartnerId, AuditEntry,
} from '../../types/finance';
import {
  PARTNERS, TOTAL_SHARES, PERIODS_ANNUAL, PERIODS_QUARTER,
  LINE_LABELS, INCOME_ROWS, BALANCE_ROWS, CASHFLOW_ROWS, EXPENSE_TREE,
  incomeRaw, balanceRaw, cashflowRaw, expenseRaw, dividendEventsSeed,
  divSumInPeriod, type RowSpec, type ComputeCtx,
} from '../../constants/financeData';

interface Props { t: Theme; l: LangStrings; lang: Lang; }
type TabKey = 'income' | 'balance' | 'cashflow' | 'expense' | 'dividends' | 'meta';
type StoreKey = 'income' | 'balance' | 'cashflow' | 'expense';
type Store = Record<string, Record<string, number | null>>;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const PER_SHARE = new Set(['eps', 'dps', 'bvps', 'fcfPerShare']);

const SRC_COLOR = (s: FinSource, t: Theme): string =>
  s === 'erp' ? t.gn : s === 'parasut' ? t.tx2 : s === 'manual' ? t.am : t.tx3;

export const FinancialData = ({ t, lang }: Props) => {
  const i18n = useTranslation();
  const f = (k: string) => i18n.t(`finance.${k}`);
  const loc = lang === 'en' ? 'en-US' : 'tr-TR';
  const USER = f('user');
  const lbl = (key: string) => (LINE_LABELS[key] ? (lang === 'en' ? LINE_LABELS[key].en : LINE_LABELS[key].tr) : key);
  const pLabel = (p: FinancialPeriod) => (lang === 'tr' ? p.label.replace('/Q', '/Ç') : p.label);

  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const [periodType, setPeriodType] = useState<PeriodType>('quarter');
  const [view, setView] = useState<ViewMode>('absolute');
  const [order, setOrder] = useState<OrderMode>('newestLeft');
  const [tab, setTab] = useState<TabKey>('income');
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const [stores, setStores] = useState<Record<StoreKey, Store>>(() => ({
    income: clone(incomeRaw), balance: clone(balanceRaw), cashflow: clone(cashflowRaw), expense: clone(expenseRaw),
  }));
  const [draftStores, setDraftStores] = useState<Partial<Record<StoreKey, Store>>>({});
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [audit, setAudit] = useState<AuditEntry[]>(() => [{
    id: 'demo-1', ts: new Date(2026, 6, 19, 14, 32).getTime(), user: 'Ahmet Üreme', tab: 'balance',
    itemKey: 'inventory', itemLabel: LINE_LABELS.inventory.tr, periodId: '2026/Q2', periodLabel: '2026/Ç2',
    oldValue: 151893, newValue: 155000, sourceNote: 'ERP→düzenlendi',
  }]);
  const [tree, setTree] = useState(() => clone(EXPENSE_TREE));
  const [draftTree, setDraftTree] = useState<typeof EXPENSE_TREE | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [events, setEvents] = useState<DividendEvent[]>(() => clone(dividendEventsSeed));
  const [draftDivs, setDraftDivs] = useState<DividendEvent[] | null>(null);
  const [settings, setSettings] = useState<{ inflation: InflationMethod; startDate: string }>({ inflation: 'nominal', startDate: '2020-01-01' });
  const [settingsSnap, setSettingsSnap] = useState<{ inflation: InflationMethod; startDate: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chart, setChart] = useState<{ label: string; isMargin: boolean; perShare: boolean; values: Record<string, number | null> } | null>(null);

  const inflation = settings.inflation;
  const activeEvents = draftDivs ?? events;
  const activeTree = draftTree ?? tree;

  // Rapor başlangıç tarihine göre dönem üretimi (ilk dönem startDate'ten itibaren)
  const periodStart = (p: FinancialPeriod): string => p.type === 'annual'
    ? `${p.label}-01-01`
    : `${p.label.split('/')[0]}-${String((Number(p.label.split('/')[1].replace('Q', '')) - 1) * 3 + 1).padStart(2, '0')}-01`;
  const allPeriods = periodType === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const periodsFor = allPeriods.filter((p) => periodStart(p) >= settings.startDate);
  const dispPeriods = order === 'newestLeft' ? [...periodsFor].reverse() : periodsFor;
  const periodById = (id: string) => (periodsFor.find((p) => p.id === id) ?? allPeriods.find((p) => p.id === id))!;

  const activeStore = (s: StoreKey): Store => draftStores[s] ?? stores[s];
  const isEditing = (tb: TabKey): boolean =>
    tb === 'dividends' ? draftDivs !== null : tb === 'meta' ? settingsSnap !== null : !!draftStores[tb as StoreKey];

  // ── Değer biçimlendirme (dönem kuruna göre USD) ────────────────────────────
  const money = (tryVal: number | null, p: FinancialPeriod, perShare = false): string => {
    if (tryVal === null || tryVal === undefined) return '—';
    if (currency === 'USD') {
      const v = tryVal / p.fxRate;
      return perShare ? `$${fmtNumber(v, 3)}` : `$${fmtNumber(Math.round(v))}`;
    }
    return perShare ? `${fmtNumber(tryVal, 2)} ₺` : `${fmtNumber(tryVal)} ₺`;
  };
  const pctFmt = (v: number | null) => (v === null ? '—' : `${lang === 'tr' ? '%' : ''}${fmtNumber(v, 1)}${lang === 'en' ? '%' : ''}`);

  // ── Net kâr / hasılat (çapraz-tablo) ───────────────────────────────────────
  const netIncomeFromRaw = (r: Record<string, number | null>): number => {
    const gross = (r.revenue ?? 0) + (r.cogs ?? 0);
    const ebit = gross + (r.opex ?? 0);
    const pretax = ebit + (r.nonOp ?? 0) + (r.netFin ?? 0);
    return pretax + (r.tax ?? 0);
  };

  // ── Bir tabloyu tüm dönemler için çöz ──────────────────────────────────────
  const resolveStatement = (statement: StoreKey, rows: RowSpec[]): Record<string, Record<string, number | null>> => {
    const store = activeStore(statement);
    const incomeStore = activeStore('income');
    const out: Record<string, Record<string, number | null>> = {};
    for (const p of periodsFor) {
      const raw = store[p.id] || {};
      const incRaw = incomeStore[p.id] || {};
      const resolved: Record<string, number | null> = {};
      const ctx: ComputeCtx = {
        get: (k) => resolved[k] ?? null,
        raw,
        revenue: incRaw.revenue ?? null,
        netIncome: netIncomeFromRaw(incRaw),
        shares: TOTAL_SHARES,
        divDeclared: divSumInPeriod(activeEvents, p, 'beyan'),
        divPaid: divSumInPeriod(activeEvents, p, 'odeme'),
      };
      for (const row of rows) resolved[row.key] = row.compute ? row.compute(ctx) : (raw[row.key] ?? null);
      out[p.id] = resolved;
    }
    return out;
  };

  // ── Edit / Kaydet / Vazgeç (sekme bazlı taslak — sekmeler birbirini ezmez) ──
  const ROWS_BY: Record<StoreKey, RowSpec[]> = { income: INCOME_ROWS, balance: BALANCE_ROWS, cashflow: CASHFLOW_ROWS, expense: [] };
  let seq = 0;
  const mkEntry = (tabId: string, key: string, pid: string, pl: string, ov: number | null, nv: number | null, note?: string): AuditEntry =>
    ({ id: `A${Date.now()}-${seq++}`, ts: Date.now(), user: USER, tab: tabId, itemKey: key, itemLabel: lbl(key), periodId: pid, periodLabel: pl, oldValue: ov, newValue: nv, sourceNote: note });

  const startEditTab = (tb: TabKey) => {
    if (tb === 'dividends') setDraftDivs(clone(events));
    else if (tb === 'meta') setSettingsSnap(clone(settings));
    else { setDraftStores((d) => ({ ...d, [tb]: clone(stores[tb as StoreKey]) })); if (tb === 'expense') setDraftTree(clone(tree)); }
  };
  const cancelEditTab = (tb: TabKey) => {
    if (tb === 'dividends') setDraftDivs(null);
    else if (tb === 'meta') { if (settingsSnap) setSettings(settingsSnap); setSettingsSnap(null); }
    else { setDraftStores((d) => { const n = { ...d }; delete n[tb as StoreKey]; return n; }); if (tb === 'expense') setDraftTree(null); }
  };
  const editCell = (s: StoreKey, pid: string, key: string, raw: string) => {
    const v = raw.trim() === '' ? null : Number(raw.replace(/[^\d.-]/g, ''));
    setDraftStores((d) => ({ ...d, [s]: { ...(d[s] ?? {}), [pid]: { ...(d[s]?.[pid] ?? {}), [key]: Number.isNaN(v as number) ? null : v } } }));
  };

  const saveDatasetTab = (s: StoreKey, rows: RowSpec[]) => {
    const dd = draftStores[s]; if (!dd) return;
    const entries: AuditEntry[] = [];
    const newEdited = new Set(editedCells);
    const rowBySrc: Record<string, FinSource> = {};
    rows.forEach((r) => { rowBySrc[r.key] = r.source; });
    for (const p of periodsFor) {
      const before = stores[s][p.id] || {}, after = dd[p.id] || {};
      for (const key of Object.keys(after)) {
        const ov = before[key] ?? null, nv = after[key] ?? null;
        if (ov !== nv) {
          const src = rowBySrc[key]; const wasSourced = src === 'erp' || src === 'parasut';
          if (wasSourced) newEdited.add(`${s}:${p.id}:${key}`);
          entries.push(mkEntry(s, key, p.id, pLabel(p), ov, nv, wasSourced ? `${f(`source.${src}`)}→${f('editedTag')}` : undefined));
        }
      }
    }
    setStores((st) => ({ ...st, [s]: dd }));
    if (s === 'expense' && draftTree) { setTree(draftTree); setDraftTree(null); }
    if (entries.length) setAudit((a) => [...entries, ...a]);
    if (newEdited.size !== editedCells.size) setEditedCells(newEdited);
    setDraftStores((d) => { const n = { ...d }; delete n[s]; return n; });
  };
  const saveDivsTab = () => {
    if (!draftDivs) return;
    const entries: AuditEntry[] = [];
    for (const e of draftDivs) {
      const old = events.find((x) => x.id === e.id);
      if (old && old.amountTRY !== e.amountTRY) {
        const pn = PARTNERS.find((p) => p.id === e.partnerId)?.name ?? e.partnerId;
        entries.push(mkEntry('dividends', 'cfDiv', e.date, pn, old.amountTRY, e.amountTRY, e.date));
      }
    }
    setEvents(draftDivs); if (entries.length) setAudit((a) => [...entries, ...a]); setDraftDivs(null);
  };
  const saveSettingsTab = () => {
    if (!settingsSnap) return;
    const entries: AuditEntry[] = [];
    const base = (key: string, label: string, note: string): AuditEntry =>
      ({ id: `A${Date.now()}-${seq++}`, ts: Date.now(), user: USER, tab: 'meta', itemKey: key, itemLabel: label, periodId: '—', periodLabel: '—', oldValue: null, newValue: null, sourceNote: note });
    if (settingsSnap.inflation !== settings.inflation) entries.push(base('inflation', f('meta.inflation'), `${f(`meta.${settingsSnap.inflation}`)} → ${f(`meta.${settings.inflation}`)}`));
    if (settingsSnap.startDate !== settings.startDate) entries.push(base('reportStart', f('meta.reportStart'), `${settingsSnap.startDate} → ${settings.startDate}`));
    if (entries.length) setAudit((a) => [...entries, ...a]);
    setSettingsSnap(null);
  };
  const doSave = (tb: TabKey) => {
    if (tb === 'dividends') saveDivsTab();
    else if (tb === 'meta') saveSettingsTab();
    else if (tb === 'expense') saveDatasetTab('expense', activeTree.flatMap((c) => c.items.map((it) => ({ key: it.key, source: it.source } as RowSpec))));
    else saveDatasetTab(tb as StoreKey, ROWS_BY[tb as StoreKey]);
  };

  const toggleGroup = (id: string) => setCollapsed((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ── "i" tooltip — position:fixed ile overflow kırpması olmadan her zaman üstte ─
  const InfoTip = ({ termKey }: { termKey: string }) => {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const txt = finTerm(termKey, lang);
    if (!txt) return null;
    return (
      <span className="fin-i" style={{ display: 'inline-flex', marginLeft: 5, opacity: 0.28, transition: 'opacity 0.12s' }}
        onMouseEnter={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPos({ x: r.left, y: r.top }); }}
        onMouseLeave={() => setPos(null)}>
        <Icon name="info" size={12} color={t.tx3} />
        {pos && (
          <span style={{ position: 'fixed', left: Math.min(pos.x - 8, window.innerWidth - 270), top: pos.y - 8, transform: 'translateY(-100%)', width: 250, background: t.tx, color: t.bg, borderRadius: 8, padding: '9px 12px', fontSize: 11, lineHeight: 1.45, boxShadow: '0 6px 18px rgba(0,0,0,0.3)', zIndex: 9999, fontWeight: 400, whiteSpace: 'normal', pointerEvents: 'none' }}>
            {txt}
          </span>
        )}
      </span>
    );
  };

  const SourceBadge = ({ s, edited }: { s: FinSource; edited?: boolean }) => {
    if (s === 'computed') return null;
    const c = SRC_COLOR(s, t);
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: c, whiteSpace: 'nowrap' }}>
        {f(`source.${s}`)}{edited ? ` · ${f('editedTag')}` : ''}
      </span>
    );
  };

  // ── Değişim gösterimi ──────────────────────────────────────────────────────
  const changeEl = (cur: number | null, prev: number | null, isMargin: boolean) => {
    if (cur === null || prev === null || prev === 0) return null;
    let txt: string, positive: boolean;
    if (isMargin) { const pp = cur - prev; positive = pp >= 0; txt = `${pp >= 0 ? '+' : '−'}${fmtNumber(Math.abs(pp), 1)} pp`; }
    else { const ch = ((cur - prev) / Math.abs(prev)) * 100; positive = ch >= 0; txt = `${ch >= 0 ? '+' : '−'}${fmtNumber(Math.abs(ch), 1)}%`; }
    return <div style={{ fontSize: 10, fontWeight: 600, color: positive ? t.gn : t.rd, marginTop: 1 }}>{txt}</div>;
  };

  // ── Grid stilleri ──────────────────────────────────────────────────────────
  const stickyMetric: CSSProperties = { position: 'sticky', left: 0, zIndex: 2, background: t.cd, minWidth: 240, padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${t.bd}` };
  const stickySource: CSSProperties = { position: 'sticky', left: 240, zIndex: 2, background: t.cd, minWidth: 90, padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${t.bd}` };
  const periodTh: CSSProperties = { minWidth: 130, padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: t.tx2, background: t.bg2, borderBottom: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  // ═══════════════════════════════════════════════════════════════════════════
  // GENEL GRID (Gelir Tablosu / Bilanço / Nakit Akışı)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderGrid = (statement: StoreKey, rows: RowSpec[], pctBase: 'revenue' | 'totalAssets') => {
    const resolved = resolveStatement(statement, rows);
    const incomeResolved = statement === 'income' ? resolved : resolveStatement('income', INCOME_ROWS);
    const editingThis = isEditing(statement);
    const chronoIdx = (pid: string) => periodsFor.findIndex((p) => p.id === pid);
    const baseVal = (pid: string): number | null =>
      pctBase === 'totalAssets' ? (resolved[pid]?.totalAssets ?? null) : (incomeResolved[pid]?.revenue ?? null);
    const visibleRows = rows.filter((r) => (r.isGroupHeader || !r.group || !collapsed.includes(r.group)) && (!r.iasOnly || inflation === 'ias29'));
    const valuesOf = (key: string): Record<string, number | null> => Object.fromEntries(periodsFor.map((p) => [p.id, resolved[p.id]?.[key] ?? null]));
    const pctViewLabel = pctBase === 'totalAssets' ? f('viewPctAssets') : f('viewPctRevenue');

    // Bilanço denge uyarısı (dönem bazında)
    const mismatch = (pid: string) =>
      statement === 'balance' && resolved[pid]?.totalAssets != null && resolved[pid]?.totalResources != null &&
      Math.abs((resolved[pid]!.totalAssets as number) - (resolved[pid]!.totalResources as number)) > 1;

    return (
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{f(`tabs.${statement}`)}{view === 'pct' ? ` · ${pctViewLabel}` : ''}{editingThis ? ` · ${f('edit')}` : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...stickyMetric, ...periodTh, textAlign: 'left', minWidth: 240, left: 0 }}>{f('metricCol')}</th>
                <th style={{ ...stickySource, ...periodTh, textAlign: 'left', minWidth: 90, left: 240 }}>{f('sourceCol')}</th>
                {dispPeriods.map((p) => <th key={p.id} style={periodTh}>{pLabel(p)}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const editedKeyPref = `${statement}:`;
                return (
                  <tr key={row.key} className="fin-row"
                    style={{ background: row.isSubtotal ? t.bg2 : 'transparent' }}>
                    <td style={{ ...stickyMetric, background: row.isSubtotal ? t.bg2 : t.cd, paddingLeft: row.group && !row.isGroupHeader ? 28 : 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12.5, fontWeight: row.isSubtotal ? 700 : 500, fontStyle: row.isMargin ? 'italic' : 'normal', color: row.isMargin ? t.tx2 : t.tx }}>
                        {row.isGroupHeader && (
                          <button onClick={() => toggleGroup(row.group!)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 4, display: 'inline-flex' }}>
                            <Icon name={collapsed.includes(row.group!) ? 'chevRight' : 'chevDown'} size={13} color={t.tx3} />
                          </button>
                        )}
                        {lbl(row.key)}
                        <InfoTip termKey={row.key} />
                        <span className="fin-chart" onClick={(e) => { e.stopPropagation(); setChart({ label: lbl(row.key), isMargin: !!row.isMargin, perShare: PER_SHARE.has(row.key), values: valuesOf(row.key) }); }}
                          style={{ cursor: 'pointer', display: 'inline-flex', marginLeft: 4, opacity: 0.22, transition: 'opacity 0.12s' }}>
                          <Icon name="barChart3" size={12} color={t.tx3} />
                        </span>
                      </span>
                    </td>
                    <td style={{ ...stickySource, background: row.isSubtotal ? t.bg2 : t.cd }}>
                      <SourceBadge s={row.source} edited={periodsFor.some((pp) => editedCells.has(`${editedKeyPref}${pp.id}:${row.key}`))} />
                    </td>
                    {dispPeriods.map((p) => {
                      const val = resolved[p.id]?.[row.key] ?? null;
                      const prevId = periodsFor[chronoIdx(p.id) - 1]?.id;
                      const prev = prevId ? resolved[prevId]?.[row.key] ?? null : null;
                      const canEdit = editingThis && !row.compute && row.source !== 'computed';
                      const isEdited = editedCells.has(`${statement}:${p.id}:${row.key}`);
                      return (
                        <td key={p.id} style={{ padding: '7px 12px', textAlign: 'right', borderBottom: `1px solid ${t.bd}`, whiteSpace: 'nowrap' }}>
                          {canEdit ? (
                            <input value={val === null ? '' : String(val)} onChange={(e) => editCell(statement, p.id, row.key, e.target.value)} placeholder="—"
                              style={{ width: 108, textAlign: 'right', padding: '3px 7px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12 }} />
                          ) : view === 'yoy' ? (
                            (() => { const c = changeEl(val, prev, !!row.isMargin); return c ?? <span style={{ color: t.tx3 }}>—</span>; })()
                          ) : view === 'pct' && !row.isMargin ? (
                            <span style={{ fontWeight: row.isSubtotal ? 700 : 500, color: t.tx }}>{pctFmt(baseVal(p.id) ? ((val ?? 0) / (baseVal(p.id) as number)) * 100 : null)}</span>
                          ) : (
                            <>
                              <div style={{ fontSize: 12.5, fontWeight: row.isSubtotal ? 700 : 500, fontStyle: row.isMargin ? 'italic' : 'normal', color: row.isMargin ? t.tx2 : (val ?? 0) < 0 ? t.rd : t.tx }}>
                                {row.isMargin ? pctFmt(val) : money(val, p, PER_SHARE.has(row.key))}
                                {isEdited && <span title={f('editedTag')} style={{ color: t.am, marginLeft: 4 }}>•</span>}
                              </div>
                              {view === 'absolute' && changeEl(val, prev, !!row.isMargin)}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {statement === 'balance' && dispPeriods.some((p) => mismatch(p.id)) && (
                <tr>
                  <td style={{ ...stickyMetric, background: t.cd, color: t.rd, fontSize: 11 }} colSpan={2}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="alertTriangle" size={13} color={t.rd} />{f('mismatch')}</span>
                  </td>
                  {dispPeriods.map((p) => <td key={p.id} style={{ textAlign: 'right', padding: '6px 12px', borderBottom: `1px solid ${t.bd}` }}>{mismatch(p.id) ? <Icon name="alertTriangle" size={13} color={t.rd} /> : ''}</td>)}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GİDER AĞACI
  // ═══════════════════════════════════════════════════════════════════════════
  const renderExpense = () => {
    const store = activeStore('expense');
    const incomeResolved = resolveStatement('income', INCOME_ROWS);
    const editingThis = isEditing('expense');
    const chronoIdx = (pid: string) => periodsFor.findIndex((p) => p.id === pid);
    const catTotal = (catId: string, pid: string) => {
      const cat = activeTree.find((c) => c.id === catId)!;
      return cat.items.reduce((s, it) => s + (store[pid]?.[it.key] ?? 0), 0);
    };
    const grand = (pid: string) => activeTree.reduce((s, c) => s + catTotal(c.id, pid), 0);
    const cellVal = (key: string, pid: string) => store[pid]?.[key] ?? null;
    const catValues = (catId: string) => Object.fromEntries(periodsFor.map((p) => [p.id, catTotal(catId, p.id)]));
    const itemValues = (key: string) => Object.fromEntries(periodsFor.map((p) => [p.id, cellVal(key, p.id)]));
    const grandValues = () => Object.fromEntries(periodsFor.map((p) => [p.id, grand(p.id)]));
    const chartBtn = (label: string, values: Record<string, number | null>) => (
      <span className="fin-chart" onClick={(e) => { e.stopPropagation(); setChart({ label, isMargin: false, perShare: false, values }); }}
        style={{ cursor: 'pointer', display: 'inline-flex', marginLeft: 4, opacity: 0.22, transition: 'opacity 0.12s' }}>
        <Icon name="barChart3" size={12} color={t.tx3} />
      </span>
    );

    const cell = (val: number | null, prev: number | null, pid: string, sub = false) => {
      if (view === 'yoy') { const c = changeEl(val, prev, false); return c ?? <span style={{ color: t.tx3 }}>—</span>; }
      if (view === 'pct') { const base = incomeResolved[pid]?.revenue ?? null; return <span style={{ fontWeight: sub ? 700 : 500, color: t.tx }}>{base ? pctFmt(((val ?? 0) / (base as number)) * 100) : '—'}</span>; }
      return (<><div style={{ fontSize: 12.5, fontWeight: sub ? 700 : 500, color: t.tx }}>{money(val, periodById(pid))}</div>{view === 'absolute' && changeEl(val, prev, false)}</>);
    };

    return (
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{f('tabs.expense')}{view === 'pct' ? ` · ${f('viewPctRevenue')}` : ''}{editingThis ? ` · ${f('edit')}` : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr>
              <th style={{ ...stickyMetric, ...periodTh, textAlign: 'left', minWidth: 240, left: 0 }}>{f('metricCol')}</th>
              <th style={{ ...stickySource, ...periodTh, textAlign: 'left', minWidth: 90, left: 240 }}>{f('sourceCol')}</th>
              {dispPeriods.map((p) => <th key={p.id} style={periodTh}>{pLabel(p)}</th>)}
              {editingThis && <th style={periodTh} />}
            </tr></thead>
            <tbody>
              {activeTree.map((cat) => {
                const open = !collapsed.includes(cat.id);
                return (
                  <Fragment key={cat.id}>
                    <tr className="fin-row" style={{ background: t.bg2 }}>
                      <td style={{ ...stickyMetric, background: t.bg2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12.5, fontWeight: 700, color: t.tx }}>
                          <button onClick={() => toggleGroup(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 4, display: 'inline-flex' }}>
                            <Icon name={open ? 'chevDown' : 'chevRight'} size={13} color={t.tx3} />
                          </button>{lbl(cat.id)}<InfoTip termKey={cat.id} />{chartBtn(lbl(cat.id), catValues(cat.id))}
                        </span>
                      </td>
                      <td style={{ ...stickySource, background: t.bg2 }} />
                      {dispPeriods.map((p) => { const v = catTotal(cat.id, p.id); const pid2 = periodsFor[chronoIdx(p.id) - 1]?.id; return <td key={p.id} style={{ padding: '7px 12px', textAlign: 'right', borderBottom: `1px solid ${t.bd}` }}>{cell(v, pid2 ? catTotal(cat.id, pid2) : null, p.id, true)}</td>; })}
                      {editingThis && <td style={{ borderBottom: `1px solid ${t.bd}` }} />}
                    </tr>
                    {open && cat.items.map((it) => (
                      <tr key={it.key} className="fin-row">
                        <td style={{ ...stickyMetric, background: t.cd, paddingLeft: 32, fontSize: 12, color: t.tx2 }}><span style={{ display: 'inline-flex', alignItems: 'center' }}>{lbl(it.key)}{chartBtn(lbl(it.key), itemValues(it.key))}</span></td>
                        <td style={{ ...stickySource, background: t.cd }}><SourceBadge s={it.source} /></td>
                        {dispPeriods.map((p) => {
                          const v = cellVal(it.key, p.id); const pid2 = periodsFor[chronoIdx(p.id) - 1]?.id;
                          const canEdit = editingThis && it.source !== 'computed';
                          return (
                            <td key={p.id} style={{ padding: '7px 12px', textAlign: 'right', borderBottom: `1px solid ${t.bd}` }}>
                              {canEdit
                                ? <input value={v === null ? '' : String(v)} onChange={(e) => editCell('expense', p.id, it.key, e.target.value)} placeholder="—" style={{ width: 100, textAlign: 'right', padding: '3px 7px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12 }} />
                                : cell(v, pid2 ? cellVal(it.key, pid2) : null, p.id)}
                            </td>
                          );
                        })}
                        {editingThis && <td style={{ textAlign: 'center', borderBottom: `1px solid ${t.bd}` }}><button onClick={() => setDraftTree((tr2) => (tr2 ?? tree).map((c) => c.id === cat.id ? { ...c, items: c.items.filter((x) => x.key !== it.key) } : c))} style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3 }}><Icon name="x" size={11} /></button></td>}
                      </tr>
                    ))}
                    {open && editingThis && (
                      <tr><td colSpan={dispPeriods.length + 3} style={{ padding: '6px 12px 6px 32px', borderBottom: `1px solid ${t.bd}` }}>
                        {addingTo === cat.id ? (
                          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={f('expense.namePlaceholder')} style={{ padding: '4px 9px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12 }} />
                            <button onClick={() => { const nm = newName.trim(); if (nm) { const key = `custom-${cat.id}-${Date.now()}`; setDraftTree((tr2) => (tr2 ?? tree).map((c) => c.id === cat.id ? { ...c, items: [...c.items, { key, source: 'manual' }] } : c)); LINE_LABELS[key] = { tr: nm, en: nm }; } setNewName(''); setAddingTo(null); }} style={btnPrimary}>{f('expense.addConfirm')}</button>
                            <button onClick={() => { setAddingTo(null); setNewName(''); }} style={btnGhost}>{f('expense.cancel')}</button>
                          </span>
                        ) : (
                          <button onClick={() => setAddingTo(cat.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: `1px dashed ${t.bd}`, background: 'transparent', color: t.pr, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}><Icon name="plus" size={12} color={t.pr} />{f('expense.addItem')}</button>
                        )}
                      </td></tr>
                    )}
                  </Fragment>
                );
              })}
              <tr className="fin-row" style={{ background: t.bg3 }}>
                <td style={{ ...stickyMetric, background: t.bg3, fontWeight: 700, color: t.tx }}><span style={{ display: 'inline-flex', alignItems: 'center' }}>{f('totals.totalOpex')}<InfoTip termKey="totalOpex" />{chartBtn(f('totals.totalOpex'), grandValues())}</span></td>
                <td style={{ ...stickySource, background: t.bg3 }} />
                {dispPeriods.map((p) => { const v = grand(p.id); const pid2 = periodsFor[chronoIdx(p.id) - 1]?.id; return <td key={p.id} style={{ padding: '7px 12px', textAlign: 'right', borderBottom: `1px solid ${t.bd}`, fontWeight: 700, color: t.pr }}>{cell(v, pid2 ? grand(pid2) : null, p.id, true)}</td>; })}
                {editingThis && <td style={{ borderBottom: `1px solid ${t.bd}` }} />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ORTAK GETİRİSİ (Temettü)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderDividends = () => {
    const editingThis = isEditing('dividends');
    const evs = activeEvents;
    const declaredOf = (pid: PartnerId) => evs.filter((e) => e.type === 'beyan' && e.partnerId === pid).reduce((s, e) => s + e.amountTRY, 0);
    const paidOf = (pid: PartnerId) => evs.filter((e) => e.type === 'odeme' && e.partnerId === pid).reduce((s, e) => s + e.amountTRY, 0);
    // distribution gruplama
    const distIds = [...new Set(evs.filter((e) => e.type === 'beyan').map((e) => e.distributionId!))];
    const usd = (tryVal: number, rate: number) => `$${fmtNumber(Math.round(tryVal / rate))}`;
    const disp = (tryVal: number, rate: number) => currency === 'USD' ? usd(tryVal, rate) : `${fmtNumber(tryVal)} ₺`;
    const editOdeme = (did: string, pid: PartnerId, date: string, rate: number, raw: string) => {
      const d = raw.trim() === '' ? 0 : Number(raw.replace(/[^\d.-]/g, ''));
      const tryVal = currency === 'USD' ? Math.round(d * rate) : d;
      setDraftDivs((prev) => {
        const base = prev ?? clone(events);
        const idx = base.findIndex((x) => x.type === 'odeme' && x.distributionId === did && x.partnerId === pid);
        if (idx >= 0) { const n = [...base]; n[idx] = { ...n[idx], amountTRY: Number.isNaN(tryVal) ? 0 : tryVal }; return n; }
        return [...base, { id: `${did}-${pid}-o`, partnerId: pid, type: 'odeme', date, amountTRY: Number.isNaN(tryVal) ? 0 : tryVal, fxRate: rate, distributionId: did }];
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{f('tabs.dividends')}</span>
          <button onClick={() => setModalOpen(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={13} color="#fff" />{f('dividends.addRecord')}</button>
        </div>
        {/* Ortak özet kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {PARTNERS.map((p) => {
            const dec = declaredOf(p.id), paid = paidOf(p.id), bal = dec - paid;
            return (
              <div key={p.id} style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: t.tx3, marginBottom: 10 }}>%{p.pct}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Row3 label={f('dividends.declaredCard')} val={currency === 'USD' ? '—' : `${fmtNumber(dec)} ₺`} t={t} />
                  <Row3 label={f('dividends.paidCard')} val={currency === 'USD' ? '—' : `${fmtNumber(paid)} ₺`} t={t} />
                  <div style={{ height: 1, background: t.bd, margin: '2px 0' }} />
                  <Row3 label={f('dividends.balanceCard')} val={`${fmtNumber(bal)} ₺`} strong color={bal > 0 ? t.am : t.gn} t={t} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Distribution bazlı gruplu tablo */}
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[f('dividends.date'), f('dividends.partner'), f('dividends.beyan'), f('dividends.rate'), f('dividends.usd'), f('dividends.odeme'), f('dividends.balance')].map((h, i) => (
                  <th key={i} style={{ ...periodTh, textAlign: i < 2 ? 'left' : 'right', minWidth: 0 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {distIds.map((did) => {
                  const beyanRows = evs.filter((e) => e.type === 'beyan' && e.distributionId === did);
                  const date = beyanRows[0]?.date, rate = beyanRows[0]?.fxRate ?? 1;
                  return (
                    <Fragment key={did}>
                      <tr style={{ background: t.bg2 }}><td colSpan={7} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: t.tx2, borderBottom: `1px solid ${t.bd}` }}>{f('dividends.distribution')} · {date}</td></tr>
                      {beyanRows.map((e) => {
                        const paid = evs.filter((x) => x.type === 'odeme' && x.distributionId === did && x.partnerId === e.partnerId).reduce((s, x) => s + x.amountTRY, 0);
                        const bal = e.amountTRY - paid;
                        const pName = PARTNERS.find((p) => p.id === e.partnerId)?.name ?? e.partnerId;
                        return (
                          <tr key={e.id}>
                            <td style={{ padding: '7px 12px', fontSize: 12, color: t.tx2, borderBottom: `1px solid ${t.bd}` }}>{e.date}</td>
                            <td style={{ padding: '7px 12px', fontSize: 12, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{pName}</td>
                            <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{disp(e.amountTRY, rate)}</td>
                            <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: t.tx2, borderBottom: `1px solid ${t.bd}` }}>{fmtNumber(rate, 2)}</td>
                            <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: t.tx2, borderBottom: `1px solid ${t.bd}` }}>{usd(e.amountTRY, rate)}</td>
                            <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
                              {editingThis
                                ? <input value={currency === 'USD' ? String(Math.round(paid / rate)) : String(paid)} onChange={(ev) => editOdeme(did, e.partnerId, e.date, rate, ev.target.value)} style={{ width: 100, textAlign: 'right', padding: '3px 7px', borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 12 }} />
                                : disp(paid, rate)}
                            </td>
                            <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: bal > 0 ? t.am : t.gn, borderBottom: `1px solid ${t.bd}` }}>{disp(bal, rate)}</td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // META / AYARLAR
  // ═══════════════════════════════════════════════════════════════════════════
  const renderMeta = () => {
    const latest = periodsFor[periodsFor.length - 1] ?? allPeriods[allPeriods.length - 1];
    const marketCap = latest.sharePrice * TOTAL_SHARES;
    const editingThis = isEditing('meta');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginBottom: 14 }}>{f('tabs.meta')}{editingThis ? ` · ${f('edit')}` : ''}</div>
          {/* Rapor Başlangıç Tarihi */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.tx, marginBottom: 6, display: 'inline-flex', alignItems: 'center' }}>{f('meta.reportStart')}</div>
            {editingThis
              ? <input type="date" value={settings.startDate} onChange={(e) => setSettings((s) => ({ ...s, startDate: e.target.value }))} style={{ display: 'block', padding: '6px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 13 }} />
              : <div style={{ fontSize: 13, color: t.tx }}>{settings.startDate}</div>}
            <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 3, lineHeight: 1.4 }}>{f('meta.reportStartNote')}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.tx, marginBottom: 6 }}>{f('meta.inflation')}</div>
            <div style={{ display: 'flex', gap: 18 }}>
              {(['nominal', 'ias29'] as InflationMethod[]).map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: editingThis ? t.tx : t.tx2, cursor: editingThis ? 'pointer' : 'default' }}>
                  <input type="radio" disabled={!editingThis} checked={settings.inflation === opt} onChange={() => setSettings((s) => ({ ...s, inflation: opt }))} style={{ accentColor: t.pr }} />{f(`meta.${opt}`)}
                </label>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${t.bd}`, paddingTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: t.tx2, marginBottom: 4 }}>{f('meta.marketCap')} · {pLabel(latest)}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.pr }}>{money(marketCap, latest)}</div>
            <div style={{ fontSize: 11, color: t.tx3, marginTop: 2 }}>{f('meta.sharePrice')}: {fmtNumber(latest.sharePrice, 2)} ₺</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.tx2, marginBottom: 6 }}>{f('meta.periodRef')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {periodsFor.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '4px 0', fontSize: 12, color: t.tx }}>{pLabel(p)}</td>
                  <td style={{ padding: '4px 0', fontSize: 12, color: t.tx2, textAlign: 'right' }}>{fmtNumber(p.fxRate, 2)}</td>
                  <td style={{ padding: '4px 0', fontSize: 12, color: t.tx2, textAlign: 'right' }}>{fmtNumber(p.sharePrice, 2)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>{f('meta.capTable')}</div>
            <div style={{ fontSize: 11, color: t.tx3, marginTop: 2 }}>{f('meta.capNote')}</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...periodTh, textAlign: 'left' }}>{f('meta.partner')}</th>
              <th style={{ ...periodTh }}>{f('meta.shares')}</th>
              <th style={{ ...periodTh }}>{f('meta.stake')}</th>
              <th style={{ ...periodTh }}>{f('meta.value')}</th>
            </tr></thead>
            <tbody>
              {PARTNERS.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 500, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{p.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', color: t.tx2, borderBottom: `1px solid ${t.bd}` }}>{fmtNumber(TOTAL_SHARES * p.pct / 100)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', color: t.tx, borderBottom: `1px solid ${t.bd}` }}>%{fmtNumber(p.pct)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{money(latest.sharePrice * TOTAL_SHARES * p.pct / 100, latest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const showControls = tab === 'income' || tab === 'balance' || tab === 'cashflow' || tab === 'expense';
  const pctLabel = tab === 'balance' ? f('viewPctAssets') : f('viewPctRevenue');
  const editingTab = isEditing(tab);

  return (
    <div style={{ paddingTop: 6 }}>
      <style>{`.fin-row:hover .fin-i{opacity:1 !important}.fin-row:hover .fin-chart{opacity:0.75 !important}.fin-chart:hover{opacity:1 !important}`}</style>

      {/* ── ÜST BAR: kontroller + para birimi (solda) · Düzenle + Geçmiş (sağda) ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {showControls && (
          <>
            <ControlGroup label={f('period')} t={t}><Dropdown t={t} opts={[{ v: 'annual', label: f('annual') }, { v: 'quarter', label: f('quarterly') }]} value={periodType} onChange={setPeriodType} /></ControlGroup>
            <ControlGroup label={f('view')} t={t}><Dropdown t={t} opts={[{ v: 'absolute', label: f('viewAbsolute') }, { v: 'yoy', label: f('viewYoY') }, { v: 'pct', label: pctLabel }]} value={view} onChange={setView} /></ControlGroup>
            <ControlGroup label={f('order')} t={t}><Dropdown t={t} opts={[{ v: 'newestLeft', label: f('newestLeft') }, { v: 'newestRight', label: f('newestRight') }]} value={order} onChange={setOrder} /></ControlGroup>
          </>
        )}
        <ControlGroup label={f('currency')} t={t}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
            {(['TRY', 'USD'] as FinCurrency[]).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: currency === c ? t.pr : t.cd, color: currency === c ? '#fff' : t.tx2 }}>{c === 'TRY' ? '₺ TRY' : '$ USD'}</button>
            ))}
          </div>
        </ControlGroup>

        <div style={{ flex: 1 }} />

        {/* Sağ üst: Düzenle / Kaydet+Vazgeç + Değişiklik Geçmişi */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {editingTab ? (
            <>
              <button onClick={() => doSave(tab)} style={btnPrimary}>{f('save')}</button>
              <button onClick={() => cancelEditTab(tab)} style={btnGhost}>{f('cancel')}</button>
            </>
          ) : (
            <button onClick={() => startEditTab(tab)} style={btnGhost}><Icon name="fileText" size={13} color={t.tx2} /> {f('edit')}</button>
          )}
          <button onClick={() => setHistoryOpen(true)} style={btnGhost}><Icon name="refresh" size={13} color={t.tx2} /> {f('history')}</button>
        </div>
      </div>

      {/* ── TAB ŞERİDİ ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `1px solid ${t.bd}`, flexWrap: 'wrap' }}>
        {(['income', 'balance', 'cashflow', 'expense', 'dividends', 'meta'] as TabKey[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: tab === tb ? 600 : 500, border: 'none', borderBottom: `2px solid ${tab === tb ? t.pr : 'transparent'}`, background: 'transparent', color: tab === tb ? t.pr : t.tx2, cursor: 'pointer', marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {f(`tabs.${tb}`)}
            {isEditing(tb) && <span style={{ width: 6, height: 6, borderRadius: 3, background: t.am }} title={f('edit')} />}
          </button>
        ))}
      </div>

      {/* ── İÇERİK (tek kolon; geçmiş artık pop-up) ─────────────────────────── */}
      <div style={{ minWidth: 0, marginBottom: 24 }}>
        {tab === 'income' && renderGrid('income', INCOME_ROWS, 'revenue')}
        {tab === 'balance' && renderGrid('balance', BALANCE_ROWS, 'totalAssets')}
        {tab === 'cashflow' && renderGrid('cashflow', CASHFLOW_ROWS, 'revenue')}
        {tab === 'expense' && renderExpense()}
        {tab === 'dividends' && renderDividends()}
        {tab === 'meta' && renderMeta()}
      </div>

      {modalOpen && <DividendModal t={t} f={f} onClose={() => setModalOpen(false)} onSave={(ev) => { setEvents((e) => [...e, ...ev]); setModalOpen(false); }} />}
      {chart && <MetricChart t={t} lang={lang} currency={currency} periods={periodsFor} data={chart} onClose={() => setChart(null)} />}
      {historyOpen && <HistoryModal t={t} f={f} lang={lang} audit={audit} currentTab={tab} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
};

// ── Alt bileşenler ───────────────────────────────────────────────────────────
const btnPrimary: CSSProperties = { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnGhost: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'transparent', color: '#475569', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' };

const ControlGroup = ({ label, t, children }: { label: string; t: Theme; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 10, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
    {children}
  </div>
);

// Seeking Alpha tarzı dropdown kontrol
function Dropdown<T extends string>({ t, opts, value, onChange }: { t: Theme; opts: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const cur = opts.find((o) => o.v === value);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150, justifyContent: 'space-between', padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd, color: t.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        {cur?.label}<Icon name="chevDown" size={13} color={t.tx3} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 5, minWidth: 180, boxShadow: '0 6px 20px rgba(0,0,0,0.14)', zIndex: 40 }}>
          {opts.map((o) => (
            <div key={o.v} onMouseDown={() => { onChange(o.v); setOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', background: value === o.v ? t.prL : 'transparent', color: value === o.v ? t.pr : t.tx, fontSize: 13, fontWeight: value === o.v ? 600 : 400 }}>
              {o.label}{value === o.v && <span style={{ float: 'right' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Row3 = ({ label, val, strong, color, t }: { label: string; val: string; strong?: boolean; color?: string; t: Theme }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 11.5, color: t.tx2 }}>{label}</span>
    <span style={{ fontSize: strong ? 14 : 12.5, fontWeight: strong ? 700 : 500, color: color ?? t.tx }}>{val}</span>
  </div>
);

// ── Temettü Kaydı Ekle modalı ────────────────────────────────────────────────
const DividendModal = ({ t, f, onClose, onSave }: { t: Theme; f: (k: string) => string; onClose: () => void; onSave: (ev: DividendEvent[]) => void }) => {
  const [date, setDate] = useState('');
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [total, setTotal] = useState('');
  const [split, setSplit] = useState<Record<PartnerId, number>>({ abdulhamit: 0, ahmet: 0, hasan: 0 });
  const [manualSplit, setManualSplit] = useState(false);

  const totalNum = Number(total.replace(/[^\d.]/g, '')) || 0;
  const rateNum = Number(rate.replace(/[^\d.]/g, '')) || 0;
  const autoSplit: Record<PartnerId, number> = { abdulhamit: Math.round(totalNum * 0.35), ahmet: Math.round(totalNum * 0.35), hasan: Math.round(totalNum * 0.30) };
  const effSplit = manualSplit ? split : autoSplit;
  const valid = date !== '' && rateNum > 0 && totalNum > 0;

  const save = () => {
    if (!valid) return;
    const did = `DX${Date.now()}`;
    const ev: DividendEvent[] = PARTNERS.map((p) => ({
      id: `${did}-${p.id}-b`, partnerId: p.id, type: 'beyan', date, amountTRY: effSplit[p.id], fxRate: rateNum, distributionId: did, note: note || undefined,
    }));
    onSave(ev);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, padding: 24, width: 460, maxWidth: '100%', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.tx, marginBottom: 16 }}>{f('dividends.modal.title')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label={f('dividends.modal.date')} t={t} required><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp(t)} /></Field>
          <Field label={f('dividends.modal.fxRate')} t={t} required><input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0,00" style={inp(t)} /></Field>
          <Field label={f('dividends.modal.totalAmount')} t={t} required><input value={total} onChange={(e) => { setTotal(e.target.value); setManualSplit(false); }} placeholder="0" style={inp(t)} /></Field>
          <Field label={f('dividends.modal.note')} t={t}><input value={note} onChange={(e) => setNote(e.target.value)} style={inp(t)} /></Field>
          {/* Cap table böl önizleme */}
          <div style={{ border: `1px solid ${t.bd}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: t.tx2, marginBottom: 8 }}>{f('dividends.modal.split')}</div>
            {PARTNERS.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: t.tx }}>{p.name} <span style={{ color: t.tx3 }}>%{p.pct}</span></span>
                <input value={String(effSplit[p.id])} onChange={(e) => { setManualSplit(true); setSplit((s) => ({ ...s, [p.id]: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })); }}
                  style={{ ...inp(t), width: 130, textAlign: 'right', padding: '4px 8px' }} />
              </div>
            ))}
            <div style={{ fontSize: 11, color: t.tx3, marginTop: 6, textAlign: 'right' }}>
              {f('dividends.modal.usdEquivalent')}: {rateNum > 0 ? `$${fmtNumber(Math.round((effSplit.abdulhamit + effSplit.ahmet + effSplit.hasan) / rateNum))}` : '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={btnGhost}>{f('dividends.modal.cancel')}</button>
          <button onClick={save} disabled={!valid} style={{ ...btnPrimary, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>{f('dividends.modal.save')}</button>
        </div>
      </div>
    </div>
  );
};

// ── Metrik mini-grafik pop-up (son 10 periyot; bar=tutar, line=oran) ─────────
const MetricChart = ({ t, lang, currency, periods, data, onClose }: {
  t: Theme; lang: Lang; currency: FinCurrency; periods: FinancialPeriod[];
  data: { label: string; isMargin: boolean; perShare: boolean; values: Record<string, number | null> }; onClose: () => void;
}) => {
  const pLabel = (p: FinancialPeriod) => (lang === 'tr' ? p.label.replace('/Q', '/Ç') : p.label);
  const last10 = periods.slice(-10); // kronolojik
  const rows = last10.map((p) => {
    const raw = data.values[p.id];
    let v: number | null = raw;
    if (raw !== null && !data.isMargin && currency === 'USD') v = raw / p.fxRate;
    return { name: pLabel(p), value: v };
  });
  const fmtTip = (v: number) => {
    if (data.isMargin) return `${lang === 'tr' ? '%' : ''}${fmtNumber(v, 1)}${lang === 'en' ? '%' : ''}`;
    const sym = currency === 'USD' ? '$' : '₺';
    const num = data.perShare ? fmtNumber(v, currency === 'USD' ? 3 : 2) : fmtNumber(Math.round(v));
    return currency === 'USD' ? `${sym}${num}` : `${num} ${sym}`;
  };
  const tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) =>
    active && payload && payload.length ? (
      <div style={{ background: t.tx, color: t.bg, borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
        <div>{fmtTip(payload[0].value)}</div>
      </div>
    ) : null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, padding: 20, width: 620, maxWidth: '100%', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.tx }}>{data.label} <span style={{ fontSize: 12, fontWeight: 500, color: t.tx3 }}>· {currency}</span></span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', color: t.tx3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} /></button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          {data.isMargin ? (
            <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 6, left: 6 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${fmtNumber(v, 0)}`} width={44} />
              <Tooltip content={tip} />
              <Line type="monotone" dataKey="value" stroke={t.pr} strokeWidth={2.5} dot={{ r: 3, fill: t.pr }} />
            </LineChart>
          ) : (
            <BarChart data={rows} margin={{ top: 10, right: 16, bottom: 6, left: 6 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNumber(Math.round(v / 1000))} width={52} />
              <Tooltip content={tip} cursor={{ fill: t.hoverBg }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {rows.map((r, i) => <Cell key={i} fill={(r.value ?? 0) < 0 ? t.rd : t.pr} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Değişiklik Geçmişi pop-up (sekme filtreli) ──────────────────────────────
const HistoryModal = ({ t, f, lang, audit, currentTab, onClose }: {
  t: Theme; f: (k: string) => string; lang: Lang; audit: AuditEntry[]; currentTab: string; onClose: () => void;
}) => {
  const [filter, setFilter] = useState<string>(currentTab);
  const loc = lang === 'en' ? 'en-US' : 'tr-TR';
  const fmtTs = (ts: number) => new Date(ts).toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtLog = (v: number | null) => v === null ? null : `${fmtNumber(v)} ₺`;
  const rows = audit.filter((a) => filter === 'all' || a.tab === filter);
  const opts = [{ v: 'all', label: f('historyAll') }, ...(['income', 'balance', 'cashflow', 'expense', 'dividends', 'meta'].map((tb) => ({ v: tb, label: f(`tabs.${tb}`) })))];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, width: 640, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.tx }}>{f('history')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Dropdown t={t} opts={opts} value={filter} onChange={setFilter} />
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', color: t.tx3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 0' }}>
          {rows.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12.5, color: t.tx3 }}>{f('noHistory')}</div>
          ) : rows.map((a) => {
            const ov = fmtLog(a.oldValue), nv = fmtLog(a.newValue);
            return (
              <div key={a.id} style={{ padding: '11px 20px', borderBottom: `1px solid ${t.bd}` }}>
                <div style={{ fontSize: 12.5, color: t.tx, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{f(`tabs.${a.tab}`)} › {a.itemLabel}</span>
                  {a.periodLabel && a.periodLabel !== '—' ? <span style={{ color: t.tx3 }}> ({a.periodLabel})</span> : null}
                  {ov && nv ? <>: <span style={{ color: t.rd }}>{ov}</span> <span style={{ color: t.tx3 }}>→</span> <span style={{ color: t.gn }}>{nv}</span></> : a.sourceNote ? <>: <span style={{ color: t.tx2 }}>{a.sourceNote}</span></> : null}
                </div>
                <div style={{ fontSize: 11, color: t.tx3, marginTop: 2 }}>{a.user} · {fmtTs(a.ts)}{ov && nv && a.sourceNote ? ` · ${a.sourceNote}` : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const inp = (t: Theme): CSSProperties => ({ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 13, boxSizing: 'border-box' });
const Field = ({ label, t, required, children }: { label: string; t: Theme; required?: boolean; children: ReactNode }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 500, color: t.tx2, marginBottom: 4 }}>{label}{required && <span style={{ color: t.rd }}> *</span>}</div>
    {children}
  </div>
);

export default FinancialData;
