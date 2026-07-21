import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Theme, Lang } from '../../types';
import type { TxTip, RecCurrency, WeekendShift } from '../../types/recurring';
import { RECURRING_CATEGORIES } from '../../constants/recurringData';
import { useRecurring } from '../../context/RecurringContext';

// Kredi taksiti/Çek Section A motorundan gelir → manuel eklemede gösterme
const MANUAL_CATS = RECURRING_CATEGORIES.filter((c) => c !== 'Kredi taksiti' && c !== 'Çek');

export const RecurringModal = ({ t, lang, defaultTip, prefillDate, onClose }: { t: Theme; lang: Lang; defaultTip: TxTip; prefillDate?: string; onClose: () => void }) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const rec = useRecurring();
  const [tarih, setTarih] = useState(prefillDate ?? '');
  const [kategori, setKategori] = useState<string>(defaultTip === 'Gelir' ? 'Diğer' : 'Kira');
  const [isim, setIsim] = useState('');
  const [tutar, setTutar] = useState('');
  const [paraBirimi, setParaBirimi] = useState<RecCurrency>('TRY');
  const [tekrarli, setTekrarli] = useState(false);
  const [frekans, setFrekans] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [interval, setIntervalN] = useState('1');
  const [unit, setUnit] = useState<'week' | 'month'>('month');
  const [monthMode, setMonthMode] = useState<'day' | 'last'>('day');
  const [byDay, setByDay] = useState('1');
  const [bitisType, setBitisType] = useState<'none' | 'until' | 'count'>('none');
  const [until, setUntil] = useState('');
  const [count, setCount] = useState('12');
  const [haftaSonu, setHaftaSonu] = useState<WeekendShift>('none');

  const tutarNum = Number(tutar.replace(/[^\d.]/g, '')) || 0;
  const valid = tarih !== '' && isim !== '' && tutarNum > 0;
  const domFromDate = tarih ? Number(tarih.split('-')[2]) : 1;

  const buildRRule = (): string => {
    if (!tekrarli) return '';
    if (frekans === 'weekly') return 'FREQ=WEEKLY';
    if (frekans === 'monthly') return `FREQ=MONTHLY;BYMONTHDAY=${monthMode === 'last' ? -1 : domFromDate}`;
    // custom
    const iv = Math.max(1, Number(interval) || 1);
    if (unit === 'week') return `FREQ=WEEKLY;INTERVAL=${iv}`;
    return `FREQ=MONTHLY;INTERVAL=${iv};BYMONTHDAY=${monthMode === 'last' ? -1 : (Number(byDay) || domFromDate)}`;
  };

  const save = () => {
    if (!valid) return;
    const bitis = bitisType === 'until' && until ? { until } : bitisType === 'count' ? { count: Number(count) || 1 } : undefined;
    rec.addSeries({ id: `RX${Date.now()}`, tip: defaultTip, kategori, isim, tutar: tutarNum, paraBirimi, dtstart: tarih, rrule: buildRRule(), bitis, haftaSonuKaydir: tekrarli ? haftaSonu : undefined });
    onClose();
  };

  const title = defaultTip === 'Gider' ? L('Harcama Ekle', 'Add Expense') : L('Tahsilat Ekle', 'Add Income');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, padding: 24, width: 520, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.tx, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, color: t.tx3, marginBottom: 16 }}>{L('Kaynak', 'Source')}: <b style={{ color: t.am }}>{L('Manuel', 'Manual')}</b> · {defaultTip}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row2>
            <Field label={L('Tarih', 'Date')} t={t} req><input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={inp(t)} /></Field>
            <Field label={L('Kategori', 'Category')} t={t}><Sel t={t} value={kategori} onChange={setKategori} opts={[...MANUAL_CATS]} /></Field>
          </Row2>
          <Field label={L('İsim / Açıklama', 'Name / Description')} t={t} req><input value={isim} onChange={(e) => setIsim(e.target.value)} style={inp(t)} /></Field>
          <Row2>
            <Field label={L('Tutar', 'Amount')} t={t} req><input value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" style={inp(t)} /></Field>
            <Field label={L('Para Birimi', 'Currency')} t={t}><Sel t={t} value={paraBirimi} onChange={(v) => setParaBirimi(v as RecCurrency)} opts={['TRY', 'USD']} /></Field>
          </Row2>

          {/* Tekrar */}
          <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
            <Radio t={t} checked={!tekrarli} onChange={() => setTekrarli(false)} label={L('Tek seferlik', 'One-time')} />
            <Radio t={t} checked={tekrarli} onChange={() => setTekrarli(true)} label={L('Tekrarlı', 'Recurring')} />
          </div>

          {tekrarli && (
            <div style={{ border: `1px solid ${t.bd}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: t.bg2 }}>
              <Field label={L('Frekans', 'Frequency')} t={t}>
                <Sel t={t} value={frekans} onChange={(v) => setFrekans(v as 'weekly' | 'monthly' | 'custom')} opts={['weekly', 'monthly', 'custom']}
                  labels={{ weekly: L('Haftalık', 'Weekly'), monthly: L('Aylık', 'Monthly'), custom: L('Özel', 'Custom') }} />
              </Field>
              {frekans === 'monthly' && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <Radio t={t} checked={monthMode === 'day'} onChange={() => setMonthMode('day')} label={L(`Ayın ${domFromDate}. günü`, `Day ${domFromDate} of month`)} />
                  <Radio t={t} checked={monthMode === 'last'} onChange={() => setMonthMode('last')} label={L('Ayın son günü', 'Last day of month')} />
                </div>
              )}
              {frekans === 'custom' && (
                <>
                  <Row2>
                    <Field label={L('Her N', 'Every N')} t={t}><input value={interval} onChange={(e) => setIntervalN(e.target.value)} style={inp(t)} /></Field>
                    <Field label={L('Birim', 'Unit')} t={t}><Sel t={t} value={unit} onChange={(v) => setUnit(v as 'week' | 'month')} opts={['week', 'month']} labels={{ week: L('Hafta', 'Week'), month: L('Ay', 'Month') }} /></Field>
                  </Row2>
                  {unit === 'month' && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Radio t={t} checked={monthMode === 'day'} onChange={() => setMonthMode('day')} label={L('Ayın X’i', 'Day of month')} />
                      {monthMode === 'day' && <input value={byDay} onChange={(e) => setByDay(e.target.value)} style={{ ...inp(t), width: 70 }} />}
                      <Radio t={t} checked={monthMode === 'last'} onChange={() => setMonthMode('last')} label={L('Ayın son günü', 'Last day')} />
                    </div>
                  )}
                </>
              )}
              {/* Bitiş */}
              <div style={{ fontSize: 11.5, fontWeight: 600, color: t.tx2, marginTop: 2 }}>{L('Bitiş', 'End')}</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <Radio t={t} checked={bitisType === 'none'} onChange={() => setBitisType('none')} label={L('Süresiz', 'Never')} />
                <Radio t={t} checked={bitisType === 'until'} onChange={() => setBitisType('until')} label={L('Tarihe kadar', 'Until date')} />
                {bitisType === 'until' && <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} style={{ ...inp(t), width: 150 }} />}
                <Radio t={t} checked={bitisType === 'count'} onChange={() => setBitisType('count')} label={L('N tekrar', 'N times')} />
                {bitisType === 'count' && <input value={count} onChange={(e) => setCount(e.target.value)} style={{ ...inp(t), width: 70 }} />}
              </div>
              {/* Hafta sonu */}
              <Field label={L('Hafta sonuna denk gelirse', 'If it falls on a weekend')} t={t}>
                <Sel t={t} value={haftaSonu} onChange={(v) => setHaftaSonu(v as WeekendShift)} opts={['none', 'onceki', 'sonraki']}
                  labels={{ none: L('Aynı gün', 'Same day'), onceki: L('Önceki iş günü', 'Previous business day'), sonraki: L('Sonraki iş günü', 'Next business day') }} />
              </Field>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={btnG(t)}>{L('Vazgeç', 'Cancel')}</button>
          <button onClick={save} disabled={!valid} style={{ ...btnP, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>{L('Kaydet', 'Save')}</button>
        </div>
      </div>
    </div>
  );
};

// ── küçük parçalar ──
const btnP: CSSProperties = { padding: '7px 16px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnG = (t: Theme): CSSProperties => ({ padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' });
const inp = (t: Theme): CSSProperties => ({ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 13, boxSizing: 'border-box' });
const Row2 = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
const Field = ({ label, t, req, children }: { label: string; t: Theme; req?: boolean; children: ReactNode }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 11.5, fontWeight: 500, color: t.tx2, marginBottom: 4 }}>{label}{req && <span style={{ color: t.rd }}> *</span>}</div>
    {children}
  </div>
);
const Radio = ({ t, checked, onChange, label }: { t: Theme; checked: boolean; onChange: () => void; label: string }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.tx, cursor: 'pointer' }}>
    <span style={{ width: 15, height: 15, borderRadius: 8, border: `2px solid ${checked ? t.pr : t.bd}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onChange}>
      {checked && <span style={{ width: 7, height: 7, borderRadius: 4, background: t.pr }} />}
    </span>{label}
  </label>
);
function Sel({ t, value, onChange, opts, labels }: { t: Theme; value: string; onChange: (v: string) => void; opts: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp(t), cursor: 'pointer' }}>
      {opts.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  );
}
