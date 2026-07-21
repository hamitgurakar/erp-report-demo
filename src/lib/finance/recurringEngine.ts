// Recurring motoru — saf fonksiyonlar (RFC 5545: RRULE ∪ RDATE − EXDATE, sonra override).
// Minimal RRULE parser: FREQ MONTHLY/WEEKLY/DAILY · INTERVAL · BYMONTHDAY(-1=ayın son günü) · UNTIL · COUNT.
import type {
  RecurringSeries, OccurrenceOverride, Occurrence, RecurringForecastItem,
  EditScope, CancelScope, EditChanges, WeekendShift,
} from '../../types/recurring';

// ── tarih yardımcıları (UTC, 31-gün hardcode YOK) ──
const parts = (iso: string) => iso.split('-').map(Number);
const lastDay = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
const mkISO = (y: number, m0: number, d: number) => `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const addDaysISO = (iso: string, n: number) => { const [y, m, d] = parts(iso); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dow = (iso: string) => { const [y, m, d] = parts(iso); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const weekendShift = (iso: string, mode: WeekendShift = 'none') => {
  if (mode === 'none') return iso;
  const w = dow(iso);
  if (w === 6) return mode === 'onceki' ? addDaysISO(iso, -1) : addDaysISO(iso, 2);
  if (w === 0) return mode === 'onceki' ? addDaysISO(iso, -2) : addDaysISO(iso, 1);
  return iso;
};

interface RRule { freq: string; interval: number; byMonthDay?: number; until?: string; count?: number }
const parseRRule = (r: string): RRule => {
  const o: RRule = { freq: '', interval: 1 };
  if (!r) return o;
  for (const part of r.split(';')) {
    const [k, v] = part.split('=');
    if (k === 'FREQ') o.freq = v;
    else if (k === 'INTERVAL') o.interval = Number(v) || 1;
    else if (k === 'BYMONTHDAY') o.byMonthDay = Number(v);
    else if (k === 'COUNT') o.count = Number(v);
    else if (k === 'UNTIL') o.until = v.length >= 8 ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : v.slice(0, 10);
  }
  return o;
};

/** Kural tarihlerini (recurrenceId) dtstart → to aralığında üretir; UNTIL/COUNT'a uyar. */
const genRuleDates = (series: RecurringSeries, to: string): string[] => {
  const p = parseRRule(series.rrule);
  const until = series.bitis?.until ?? p.until;
  const count = series.bitis?.count ?? p.count;
  const [sy, sm, sd] = parts(series.dtstart);
  const out: string[] = [];
  if (!p.freq) { // tek seferlik
    if (series.dtstart <= to) out.push(series.dtstart);
    return out;
  }
  let n = 0;
  if (p.freq === 'MONTHLY') {
    const day = p.byMonthDay ?? sd;
    for (let k = 0, guard = 0; guard < 3000; k++, guard++) {
      const tm = (sm - 1) + k * p.interval;
      const yy = sy + Math.floor(tm / 12); const m0 = ((tm % 12) + 12) % 12;
      const dd = day === -1 ? lastDay(yy, m0) : Math.min(day, lastDay(yy, m0));
      const d = mkISO(yy, m0, dd);
      if (until && d > until) break;
      if (d > to) break;
      if (d >= series.dtstart) { out.push(d); n++; }
      if (count && n >= count) break;
    }
  } else if (p.freq === 'WEEKLY' || p.freq === 'DAILY') {
    const step = p.freq === 'WEEKLY' ? p.interval * 7 : p.interval;
    let d = series.dtstart;
    for (let guard = 0; guard < 6000; guard++) {
      if (until && d > until) break;
      if (d > to) break;
      out.push(d); n++;
      if (count && n >= count) break;
      d = addDaysISO(d, step);
    }
  }
  return out;
};

/**
 * Bir seriyi bir aralık için oluşumlara açar: RRULE ∪ RDATE − EXDATE, sonra override uygula.
 * cancelled/skipped listede kalır (durum verilir). Efektif tarih aralık içinde olanları döndürür.
 */
export const expandOccurrences = (series: RecurringSeries, overrides: OccurrenceOverride[], range: { from: string; to: string }): Occurrence[] => {
  const genTo = addDaysISO(range.to, 45); // taşınan oluşumları yakalamak için tampon
  let rids = genRuleDates(series, genTo);
  for (const rd of series.rdate ?? []) if (rd <= genTo && !rids.includes(rd)) rids.push(rd);
  const ex = new Set(series.exdate ?? []);
  rids = rids.filter((r) => !ex.has(r));
  const ovByRid = new Map(overrides.filter((o) => o.seriesId === series.id).map((o) => [o.recurrenceId, o]));

  const occ: Occurrence[] = rids.map((rid) => {
    const ov = ovByRid.get(rid);
    const tarih = ov?.yeniTarih ? ov.yeniTarih : weekendShift(rid, series.haftaSonuKaydir); // override tarihi kaydırma uygulanmaz
    return {
      seriesId: series.id, recurrenceId: rid, tarih,
      tip: series.tip, kategori: series.kategori, isim: series.isim,
      tutar: ov?.yeniTutar ?? series.tutar, paraBirimi: series.paraBirimi,
      durum: ov?.durum ?? 'planned', gerceklesenTutar: ov?.gerceklesenTutar, gerceklesenTarih: ov?.gerceklesenTarih,
    };
  });
  return occ.filter((o) => o.tarih >= range.from && o.tarih <= range.to).sort((a, b) => a.tarih.localeCompare(b.tarih));
};

/** Oluşum düzenleme kapsamı (Google Calendar modeli). Güncellenmiş seri listesi + override listesi döndürür. */
export const editScope = (series: RecurringSeries, overrides: OccurrenceOverride[], recurrenceId: string, changes: EditChanges, scope: EditScope): { series: RecurringSeries[]; overrides: OccurrenceOverride[] } => {
  if (scope === 'this') {
    const ov: OccurrenceOverride = { seriesId: series.id, recurrenceId, yeniTarih: changes.yeniTarih, yeniTutar: changes.yeniTutar, durum: changes.yeniTarih ? 'moved' : 'planned' };
    return { series: [series], overrides: [...overrides.filter((o) => !(o.seriesId === series.id && o.recurrenceId === recurrenceId)), ov] };
  }
  if (scope === 'all') {
    const updated: RecurringSeries = { ...series };
    if (changes.yeniTutar != null) updated.tutar = changes.yeniTutar;
    if (changes.isim) updated.isim = changes.isim;
    if (changes.kategori) updated.kategori = changes.kategori;
    return { series: [updated], overrides };
  }
  // thisAndFuture — seriyi ikiye böl
  const oldTrunc: RecurringSeries = { ...series, bitis: { ...(series.bitis ?? {}), until: addDaysISO(recurrenceId, -1) } };
  const newId = `${series.id}-${recurrenceId.replace(/-/g, '')}`;
  const newSeries: RecurringSeries = { ...series, id: newId, dtstart: recurrenceId, tutar: changes.yeniTutar ?? series.tutar, exdate: undefined, rdate: undefined, bitis: series.bitis?.until ? { until: series.bitis.until } : undefined };
  const kept = overrides.filter((o) => !(o.seriesId === series.id && o.recurrenceId >= recurrenceId));
  const firstMove: OccurrenceOverride[] = changes.yeniTarih ? [{ seriesId: newId, recurrenceId, yeniTarih: changes.yeniTarih, yeniTutar: changes.yeniTutar, durum: 'moved' }] : [];
  return { series: [oldTrunc, newSeries], overrides: [...kept, ...firstMove] };
};

/** Oluşum iptali. */
export const cancelScope = (series: RecurringSeries, overrides: OccurrenceOverride[], recurrenceId: string, scope: CancelScope): { series: RecurringSeries[]; overrides: OccurrenceOverride[] } => {
  if (scope === 'this') {
    return { series: [{ ...series, exdate: [...(series.exdate ?? []), recurrenceId] }], overrides: overrides.filter((o) => !(o.seriesId === series.id && o.recurrenceId === recurrenceId)) };
  }
  return { series: [{ ...series, bitis: { ...(series.bitis ?? {}), until: addDaysISO(recurrenceId, -1) } }], overrides };
};

/** Bir oluşumu ödendi işaretle (mevcut override ile birleşir). */
export const markPaid = (overrides: OccurrenceOverride[], seriesId: string, recurrenceId: string, gerceklesenTutar: number, gerceklesenTarih: string): OccurrenceOverride[] => {
  const existing = overrides.find((o) => o.seriesId === seriesId && o.recurrenceId === recurrenceId);
  const merged: OccurrenceOverride = { ...(existing ?? { seriesId, recurrenceId }), durum: 'paid', gerceklesenTutar, gerceklesenTarih };
  return [...overrides.filter((o) => o !== existing), merged];
};

/** Nakit Akışı (B0) forecast beslemesi: planlı → isForecast:true; paid → actual (isForecast:false). */
export const getRecurringForecast = (seriesList: RecurringSeries[], overrides: OccurrenceOverride[], range: { from: string; to: string }): RecurringForecastItem[] => {
  const out: RecurringForecastItem[] = [];
  for (const s of seriesList) {
    for (const o of expandOccurrences(s, overrides, range)) {
      if (o.durum === 'cancelled' || o.durum === 'skipped') continue;
      const paid = o.durum === 'paid';
      out.push({
        tarih: paid ? (o.gerceklesenTarih ?? o.tarih) : o.tarih,
        kategori: o.kategori, tip: o.tip,
        tutar: paid ? (o.gerceklesenTutar ?? o.tutar) : o.tutar,
        paraBirimi: o.paraBirimi, isForecast: !paid, seriesId: o.seriesId, recurrenceId: o.recurrenceId, isim: o.isim,
      });
    }
  }
  return out.sort((a, b) => a.tarih.localeCompare(b.tarih));
};
