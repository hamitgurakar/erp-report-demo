import { useState } from 'react';
import type { Theme, LangStrings, Lang } from '../../types';
import { mosTR, mosEN } from '../../constants/data';
import { Icon } from '../ui/Icon';

const PRESETS = [
  { tr: 'Bugün', en: 'Today' },
  { tr: 'Dün', en: 'Yesterday' },
  { tr: 'Son 7 gün', en: 'Last 7 days' },
  { tr: 'Son 30 gün', en: 'Last 30 days' },
  { tr: 'Son 60 gün', en: 'Last 60 days' },
  { tr: 'Son 90 gün', en: 'Last 90 days' },
  { tr: 'Son 2 ay', en: 'Last 2 months' },
  { tr: 'Son 3 ay', en: 'Last 3 months' },
  { tr: 'Son 6 ay', en: 'Last 6 months' },
  { tr: 'Son 12 ay', en: 'Last 12 months' },
  { tr: 'Son 365 gün', en: 'Last 365 days' },
  { tr: 'Yıl başından beri', en: 'Year to date' },
];

interface DateDay { m: number; d: number; y: number; }

interface DatePickerProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  dateRange: string;
  setDateRange: (v: string) => void;
  onClose: () => void;
}

export const DatePicker = ({ t, l, lang, dateRange, setDateRange, onClose }: DatePickerProps) => {
  const [fixed, setFixed] = useState(false);
  const [leftMonth, setLeftMonth] = useState(1);
  const [leftYear, setLeftYear] = useState(2026);
  const [selStart, setSelStart] = useState<DateDay>({ m: 1, d: 15, y: 2026 });
  const [selEnd, setSelEnd] = useState<DateDay>({ m: 2, d: 16, y: 2026 });
  const [picking, setPicking] = useState<string | null>(null);

  const ms = lang === 'en' ? mosEN : mosTR;
  const days = lang === 'en' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

  const rightMonth = (leftMonth + 1) % 12;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const getDays = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

  const isInRange = (m: number, d: number, y: number) => {
    const dt = new Date(y, m, d).getTime();
    return dt >= new Date(selStart.y, selStart.m, selStart.d).getTime() && dt <= new Date(selEnd.y, selEnd.m, selEnd.d).getTime();
  };

  const isStart = (m: number, d: number, y: number) => m === selStart.m && d === selStart.d && y === selStart.y;
  const isEnd = (m: number, d: number, y: number) => m === selEnd.m && d === selEnd.d && y === selEnd.y;

  const fmt = (o: DateDay) => `${o.d} ${ms[o.m]} ${o.y}`;

  const prevMonth = () => leftMonth === 0 ? (setLeftMonth(11), setLeftYear(leftYear - 1)) : setLeftMonth(leftMonth - 1);
  const nextMonth = () => leftMonth === 11 ? (setLeftMonth(0), setLeftYear(leftYear + 1)) : setLeftMonth(leftMonth + 1);

  const pickDay = (m: number, d: number, y: number) => {
    const pt = { m, d, y };
    if (!picking || picking === 'end') {
      setSelStart(pt);
      setPicking('start');
    } else {
      const s = new Date(selStart.y, selStart.m, selStart.d).getTime();
      const e = new Date(y, m, d).getTime();
      if (e >= s) setSelEnd(pt);
      else { setSelEnd(selStart); setSelStart(pt); }
      setPicking(null);
    }
  };

  const renderMonth = (m: number, y: number) => {
    const total = getDays(m, y);
    const first = getFirstDay(m, y);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center', fontSize: 11 }}>
          {days.map((d) => <div key={d} style={{ color: t.tx3, padding: 3, fontWeight: 500 }}>{d}</div>)}
          {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: total }).map((_, i) => {
            const day = i + 1;
            const inR = isInRange(m, day, y);
            const isSt = isStart(m, day, y);
            const isEn = isEnd(m, day, y);
            const isToday = day === 17 && m === 2 && y === 2026;
            return (
              <div
                key={day}
                onClick={() => pickDay(m, day, y)}
                style={{
                  width: 30, height: 30,
                  borderRadius: isSt || isEn ? 15 : inR ? 4 : 15,
                  background: isSt || isEn ? t.pu : inR ? t.puL : 'transparent',
                  color: isSt || isEn ? '#fff' : isToday ? t.pu : t.tx,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: isSt || isEn || isToday ? 600 : 400,
                  cursor: 'pointer', margin: '0 auto',
                  border: isToday && !isSt && !isEn ? `2px solid ${t.pu}` : 'none',
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 14, minWidth: 580, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 30, display: 'flex' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Presets */}
      <div style={{ width: 155, borderRight: `1px solid ${t.bd}`, padding: '12px 0', maxHeight: 400, overflowY: 'auto' }}>
        {PRESETS.map((p) => {
          const label = lang === 'en' ? p.en : p.tr;
          const isActive = dateRange === label;
          return (
            <div
              key={label}
              onClick={() => { setDateRange(label); onClose(); }}
              style={{ padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: isActive ? t.pu : t.tx2, background: isActive ? t.puL : 'transparent', fontWeight: isActive ? 500 : 400, display: 'flex', justifyContent: 'space-between' }}
            >
              {label}
              {isActive && <span>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: t.tx2 }}>{l.donemTipi}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: fixed ? t.tx : t.tx2, fontWeight: fixed ? 500 : 400 }}>{l.sabit}</span>
            <div onClick={() => setFixed(!fixed)} style={{ width: 38, height: 20, borderRadius: 10, background: fixed ? t.bd : t.pu, cursor: 'pointer', position: 'relative' }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', position: 'absolute', top: 2, left: fixed ? 2 : 20, transition: 'left 0.2s' }} />
            </div>
            <span style={{ color: !fixed ? t.tx : t.tx2, fontWeight: !fixed ? 500 : 400 }}>{l.kayan}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx2, display: 'flex' }}><Icon name="chevLeft" size={16} /></button>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{ms[leftMonth]} {leftYear}</span>
              <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx2, display: 'flex' }}><Icon name="chevRight" size={16} /></button>
            </div>
            {renderMonth(leftMonth, leftYear)}
          </div>
          <div style={{ width: 1, background: t.bd }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{ms[rightMonth]} {rightYear}</span>
            </div>
            {renderMonth(rightMonth, rightYear)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 14, marginBottom: 12 }}>
          <div style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 12 }}>
            <span style={{ color: t.tx3 }}>From </span>
            <span style={{ color: t.pu, fontWeight: 500 }}>{fmt(selStart)}</span>
          </div>
          <div style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 12 }}>
            <span style={{ color: t.tx3 }}>To </span>
            <span style={{ color: t.pu, fontWeight: 500 }}>{fmt(selEnd)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.tx2, cursor: 'pointer', fontSize: 13 }}>{l.iptal}</button>
          <button onClick={onClose} style={{ background: t.pu, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Apply</button>
        </div>
      </div>
    </div>
  );
};
