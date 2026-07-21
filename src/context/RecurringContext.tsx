// Recurring işlem paylaşılan deposu (tek kaynak). Finansal Veriler + Nakit Akışı ikisi de buraya yazar.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { RecurringSeries, OccurrenceOverride, Occurrence, RecurringForecastItem, EditScope, CancelScope, EditChanges } from '../types/recurring';
import { recurringSeed, recurringOverridesSeed } from '../constants/recurringData';
import { expandOccurrences, editScope, cancelScope, markPaid, getRecurringForecast } from '../lib/finance/recurringEngine';

export interface RecurringLogEntry { id: string; ts: number; action: 'add' | 'edit' | 'cancel' | 'paid'; scope?: string; isim: string; detail?: string }

interface RecurringCtx {
  series: RecurringSeries[];
  overrides: OccurrenceOverride[];
  log: RecurringLogEntry[];
  addSeries: (s: RecurringSeries) => void;
  editOcc: (series: RecurringSeries, recurrenceId: string, changes: EditChanges, scope: EditScope) => void;
  cancelOcc: (series: RecurringSeries, recurrenceId: string, scope: CancelScope) => void;
  markPaidOcc: (series: RecurringSeries, recurrenceId: string, tutar: number, tarih: string) => void;
  occurrences: (range: { from: string; to: string }) => Occurrence[];
  getForecast: (range: { from: string; to: string }) => RecurringForecastItem[];
}

const Ctx = createContext<RecurringCtx | null>(null);

export const RecurringProvider = ({ children }: { children: ReactNode }) => {
  const [series, setSeries] = useState<RecurringSeries[]>(() => JSON.parse(JSON.stringify(recurringSeed)));
  const [overrides, setOverrides] = useState<OccurrenceOverride[]>(() => JSON.parse(JSON.stringify(recurringOverridesSeed)));
  const [log, setLog] = useState<RecurringLogEntry[]>([]);
  const pushLog = useCallback((e: Omit<RecurringLogEntry, 'id' | 'ts'>) => setLog((l) => [{ id: `RL${Date.now()}-${Math.round(performance.now())}`, ts: Date.now(), ...e }, ...l]), []);

  const addSeries = useCallback((s: RecurringSeries) => { setSeries((prev) => [...prev, s]); pushLog({ action: 'add', isim: s.isim, detail: s.rrule || 'tek seferlik' }); }, [pushLog]);

  const editOcc = useCallback((target: RecurringSeries, recurrenceId: string, changes: EditChanges, scope: EditScope) => {
    setSeries((prevS) => {
      const res = editScope(target, [], recurrenceId, changes, scope); // overrides ayrı state'te; burada yalnız seri değişimi
      return prevS.flatMap((s) => (s.id === target.id ? res.series : [s]));
    });
    setOverrides((prevO) => editScope(target, prevO, recurrenceId, changes, scope).overrides);
    pushLog({ action: 'edit', scope, isim: target.isim, detail: recurrenceId });
  }, [pushLog]);

  const cancelOcc = useCallback((target: RecurringSeries, recurrenceId: string, scope: CancelScope) => {
    setSeries((prevS) => { const res = cancelScope(target, [], recurrenceId, scope); return prevS.flatMap((s) => (s.id === target.id ? res.series : [s])); });
    setOverrides((prevO) => cancelScope(target, prevO, recurrenceId, scope).overrides);
    pushLog({ action: 'cancel', scope, isim: target.isim, detail: recurrenceId });
  }, [pushLog]);

  const markPaidOcc = useCallback((target: RecurringSeries, recurrenceId: string, tutar: number, tarih: string) => {
    setOverrides((prevO) => markPaid(prevO, target.id, recurrenceId, tutar, tarih));
    pushLog({ action: 'paid', isim: target.isim, detail: `${recurrenceId} → ${tarih}` });
  }, [pushLog]);

  const occurrences = useCallback((range: { from: string; to: string }) => series.flatMap((s) => expandOccurrences(s, overrides, range)).sort((a, b) => a.tarih.localeCompare(b.tarih)), [series, overrides]);
  const getForecast = useCallback((range: { from: string; to: string }) => getRecurringForecast(series, overrides, range), [series, overrides]);

  const value = useMemo<RecurringCtx>(() => ({ series, overrides, log, addSeries, editOcc, cancelOcc, markPaidOcc, occurrences, getForecast }), [series, overrides, log, addSeries, editOcc, cancelOcc, markPaidOcc, occurrences, getForecast]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useRecurring = (): RecurringCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRecurring must be used within RecurringProvider');
  return c;
};
