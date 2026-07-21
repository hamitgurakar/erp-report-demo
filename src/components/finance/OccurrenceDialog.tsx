import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Theme, Lang } from '../../types';
import type { RecurringSeries, EditScope, CancelScope } from '../../types/recurring';
import { useRecurring } from '../../context/RecurringContext';

// SECTION C.3 — occurrence taşı/düzenle + iptal + ödendi kapsam dialogu (Google Calendar modeli)
export const OccurrenceDialog = ({ t, lang, series, recurrenceId, mode, defaultTutar, defaultTarih, onClose }: { t: Theme; lang: Lang; series: RecurringSeries; recurrenceId: string; mode: 'edit' | 'cancel' | 'paid'; defaultTutar?: number; defaultTarih?: string; onClose: () => void }) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const rec = useRecurring();
  const [yeniTarih, setYeniTarih] = useState(recurrenceId);
  const [yeniTutar, setYeniTutar] = useState(String(series.tutar));
  const [editScopeV, setEditScopeV] = useState<EditScope>('this');
  const [cancelScopeV, setCancelScopeV] = useState<CancelScope>('this');
  const [paidTutar, setPaidTutar] = useState(String(defaultTutar ?? series.tutar));
  const [paidTarih, setPaidTarih] = useState(defaultTarih ?? recurrenceId);

  const applyEdit = () => {
    const changes = { yeniTarih: yeniTarih !== recurrenceId ? yeniTarih : undefined, yeniTutar: Number(yeniTutar.replace(/[^\d.]/g, '')) || undefined };
    rec.editOcc(series, recurrenceId, changes, editScopeV);
    onClose();
  };
  const applyCancel = () => { rec.cancelOcc(series, recurrenceId, cancelScopeV); onClose(); };
  const applyPaid = () => { rec.markPaidOcc(series, recurrenceId, Number(paidTutar.replace(/[^\d.]/g, '')) || (defaultTutar ?? series.tutar), paidTarih || recurrenceId); onClose(); };

  const heading = mode === 'edit' ? L('Oluşumu Taşı / Düzenle', 'Move / Edit Occurrence')
    : mode === 'cancel' ? L('Ödemeyi İptal Et', 'Cancel Payment')
      : L('Ödendi İşaretle', 'Mark as Paid');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, padding: 22, width: 440, maxWidth: '100%', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.tx, marginBottom: 3 }}>{heading}</div>
        <div style={{ fontSize: 12, color: t.tx3, marginBottom: 16 }}>{series.isim} · {recurrenceId}</div>

        {mode === 'paid' ? (
          <>
            <div style={{ fontSize: 12.5, color: t.tx2, marginBottom: 12, lineHeight: 1.5 }}>
              {L('Gerçekleşen tutar ve tarihi girin. Bu oluşum tahmin (forecast) olmaktan çıkıp gerçekleşen (actual) olur ve varyans analizine girer.',
                'Enter the realized amount and date. This occurrence moves from forecast to actual and enters the variance analysis.')}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <Field label={L('Gerçekleşen Tarih', 'Realized Date')} t={t}><input type="date" value={paidTarih} onChange={(e) => setPaidTarih(e.target.value)} style={inp(t)} /></Field>
              <Field label={L('Gerçekleşen Tutar', 'Realized Amount')} t={t}><input value={paidTutar} onChange={(e) => setPaidTutar(e.target.value)} style={inp(t)} /></Field>
            </div>
            <div style={{ fontSize: 11, color: t.tx3, marginTop: 6 }}>{L('Plan', 'Plan')}: {(defaultTutar ?? series.tutar).toLocaleString(en ? 'en-US' : 'tr-TR')} {series.paraBirimi} · {recurrenceId}</div>
          </>
        ) : mode === 'edit' ? (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Field label={L('Yeni Tarih', 'New Date')} t={t}><input type="date" value={yeniTarih} onChange={(e) => setYeniTarih(e.target.value)} style={inp(t)} /></Field>
              <Field label={L('Yeni Tutar', 'New Amount')} t={t}><input value={yeniTutar} onChange={(e) => setYeniTutar(e.target.value)} style={inp(t)} /></Field>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.tx, marginBottom: 8 }}>{L('Bu değişikliği nasıl uygulamak istersiniz?', 'How do you want to apply this change?')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Radio t={t} checked={editScopeV === 'this'} onChange={() => setEditScopeV('this')} label={L('Yalnızca bu oluşum', 'This occurrence only')} />
              <Radio t={t} checked={editScopeV === 'thisAndFuture'} onChange={() => setEditScopeV('thisAndFuture')} label={L('Bu ve sonraki tüm oluşumlar', 'This and all following')} />
              <Radio t={t} checked={editScopeV === 'all'} onChange={() => setEditScopeV('all')} label={L('Tüm seri', 'All in the series')} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.tx, marginBottom: 8 }}>{L('Bu ödemeyi iptal et:', 'Cancel this payment:')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Radio t={t} checked={cancelScopeV === 'this'} onChange={() => setCancelScopeV('this')} label={L('Yalnızca bunu', 'Only this one')} />
              <Radio t={t} checked={cancelScopeV === 'all'} onChange={() => setCancelScopeV('all')} label={L('Tüm seriyi', 'The whole series')} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={btnG(t)}>{L('Vazgeç', 'Cancel')}</button>
          <button onClick={mode === 'edit' ? applyEdit : mode === 'cancel' ? applyCancel : applyPaid}
            style={{ ...btnP, background: mode === 'cancel' ? t.rd : mode === 'paid' ? t.gn : '#4F46E5' }}>
            {mode === 'edit' ? L('Uygula', 'Apply') : mode === 'paid' ? L('Ödendi İşaretle', 'Mark Paid') : L('Onayla', 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

const btnP: CSSProperties = { padding: '7px 16px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnG = (t: Theme): CSSProperties => ({ padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' });
const inp = (t: Theme): CSSProperties => ({ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 13, boxSizing: 'border-box' });
const Field = ({ label, t, children }: { label: string; t: Theme; children: ReactNode }) => (
  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11.5, fontWeight: 500, color: t.tx2, marginBottom: 4 }}>{label}</div>{children}</div>
);
const Radio = ({ t, checked, onChange, label }: { t: Theme; checked: boolean; onChange: () => void; label: string }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: t.tx, cursor: 'pointer' }} onClick={onChange}>
    <span style={{ width: 16, height: 16, borderRadius: 9, border: `2px solid ${checked ? t.pr : t.bd}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <span style={{ width: 7, height: 7, borderRadius: 4, background: t.pr }} />}
    </span>{label}
  </label>
);
