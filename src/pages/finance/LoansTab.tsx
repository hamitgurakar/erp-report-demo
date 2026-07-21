import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { Theme, Lang } from '../../types';
import type { AuditEntry } from '../../types/finance';
import type {
  Loan, Check, LoanSirket, LoanBanka, KrediTuru, ParaBirimi, OdemeSikligi, OdemeTipi, CheckYon, CheckDurum,
} from '../../types/loans';
import { loansSeed, checksSeed } from '../../constants/loansData';
import { generateAmortization, computeEarlyPayoff, summarize } from '../../lib/finance/loanEngine';
import { resolveTaxProfile } from '../../constants/taxConfig';
import { Icon } from '../../components/ui/Icon';
import { fmtNumber } from '../../utils/format';

const SIRKETLER: LoanSirket[] = ['Muhiku Limited', 'Muhiku Kurumsal A.Ş.', 'Ahmet Üreme Şahsi'];
const BANKALAR: LoanBanka[] = ['Ziraat', 'İş Bankası', 'Garanti BBVA', 'Yapı Kredi', 'Halkbank', 'Vakıf Katılım', 'Vakıfbank'];
const KREDI_TURLERI: KrediTuru[] = ['İşletme', 'Spot', 'Rotatif', 'Taşıt', 'Diğer'];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const todayISO = () => new Date().toISOString().slice(0, 10);

const money = (v: number, cur: ParaBirimi) => (cur === 'USD' ? `$${fmtNumber(Math.round(v))}` : `${fmtNumber(Math.round(v))} ₺`);

export const LoansTab = ({ t, lang, f, onAudit }: { t: Theme; lang: Lang; f: (k: string) => string; onAudit: (e: AuditEntry) => void }) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const [loans, setLoans] = useState<Loan[]>(() => clone(loansSeed));
  const [checks, setChecks] = useState<Check[]>(() => clone(checksSeed));
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loanModal, setLoanModal] = useState(false);
  const [checkModal, setCheckModal] = useState(false);

  const log = (itemKey: string, itemLabel: string, note: string) =>
    onAudit({ id: `LN${Date.now()}-${Math.round(performance.now())}`, ts: Date.now(), user: f('user'), tab: 'loans', itemKey, itemLabel, periodId: '', periodLabel: '—', oldValue: null, newValue: null, sourceNote: note });

  // ── türev özet (motor) ──
  const rows = useMemo(() => loans.map((ln) => ({ loan: ln, sum: summarize(ln), ep: computeEarlyPayoff(ln, ln.sorguTarihi) })), [loans]);
  const selected = rows.find((r) => r.loan.id === selectedId) ?? null;

  // ── KPI (TRY krediler) ──
  const tryRows = rows.filter((r) => r.loan.paraBirimi === 'TRY');
  const usdCount = loans.filter((l) => l.paraBirimi === 'USD').length;
  const toplamFinansman = tryRows.reduce((s, r) => s + r.loan.anapara, 0);
  const kalanOdeme = tryRows.reduce((s, r) => s + r.sum.kalanOdemeTutari, 0);
  const tasarrufPot = tryRows.reduce((s, r) => s + Math.max(0, r.ep.tasarruf), 0);
  const verilenCek = checks.filter((c) => c.yon === 'Verilen' && c.durum !== 'Ödendi').reduce((s, c) => s + c.tutar, 0);

  const addLoan = (ln: Loan) => { setLoans((x) => [ln, ...x]); setLoanModal(false); setSelectedId(ln.id); log(ln.krediNo, `${ln.banka} · ${ln.krediNo}`, L(`Kredi eklendi: ${money(ln.anapara, ln.paraBirimi)} · ${ln.vadeAy} taksit`, `Loan added: ${money(ln.anapara, ln.paraBirimi)} · ${ln.vadeAy} inst.`)); };
  const addCheck = (c: Check) => { setChecks((x) => [c, ...x]); setCheckModal(false); log(c.cekNo, `${c.odemeTipi} · ${c.cekNo}`, L(`${c.yon} ${c.odemeTipi} eklendi: ${money(c.tutar, 'TRY')}`, `${c.yon} ${c.odemeTipi} added: ${money(c.tutar, 'TRY')}`)); };

  const togglePaid = (loan: Loan, k: number) => {
    if (!editMode) return;
    const next = loan.odenenTaksitSayisi === k ? k - 1 : k;
    setLoans((xs) => xs.map((l) => (l.id === loan.id ? { ...l, odenenTaksitSayisi: next } : l)));
    log(loan.krediNo, `${loan.banka} · ${loan.krediNo}`, L(`Ödenen taksit: ${loan.odenenTaksitSayisi} → ${next}`, `Paid installments: ${loan.odenenTaksitSayisi} → ${next}`));
  };

  const th: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 9px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 9px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const durumBadge = (d: string) => {
    const tone = d === 'Ödendi' ? { fg: t.gn, bg: t.gnL } : d === 'Gecikti' || d === 'Karşılıksız' ? { fg: t.rd, bg: t.rdL } : { fg: t.am, bg: t.amL };
    const label = d === 'Ödendi' ? L('Ödendi', 'Paid') : d === 'Ödenecek' ? L('Ödenecek', 'Due') : d === 'Gecikti' ? L('Gecikti', 'Overdue') : L('Karşılıksız', 'Bounced');
    return <span style={{ fontSize: 10.5, fontWeight: 600, color: tone.fg, background: tone.bg, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap' }}>{label}</span>;
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setLoanModal(true)} style={btnP}><Icon name="plus" size={13} color="#fff" /> {L('Kredi Ekle', 'Add Loan')}</button>
        <button onClick={() => setCheckModal(true)} style={btnG(t)}><Icon name="plus" size={13} color={t.tx2} /> {L('Çek / Senet Ekle', 'Add Cheque / Note')}</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setEditMode((e) => !e)} style={editMode ? btnP : btnG(t)}>
          <Icon name="fileText" size={13} color={editMode ? '#fff' : t.tx2} /> {editMode ? L('Düzenleme açık', 'Editing on') : f('edit')}
        </button>
      </div>

      {/* KPI şeridi */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { lb: L('Toplam Finansman', 'Total Financing'), v: money(toplamFinansman, 'TRY'), sub: usdCount ? `+ ${usdCount} USD ${L('kredi', 'loan')}` : '', c: t.pr },
          { lb: L('Kalan Ödeme', 'Remaining Payment'), v: money(kalanOdeme, 'TRY'), sub: `${loans.length} ${L('aktif kredi', 'active loans')}`, c: t.am },
          { lb: L('Tasarruf Potansiyeli', 'Savings Potential'), v: money(tasarrufPot, 'TRY'), sub: L('erken kapama', 'early payoff'), c: t.gn },
          { lb: L('Verilen Çek (açık)', 'Cheques Payable (open)'), v: money(verilenCek, 'TRY'), sub: `${checks.length} ${L('çek/senet', 'cheques')}`, c: t.co },
        ].map((k) => (
          <div key={k.lb} style={{ flex: 1, minWidth: 170, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11.5, color: t.tx2 }}>{k.lb}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.c, marginTop: 3 }}>{k.v}</div>
            {k.sub && <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Loan register */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Kredi Kayıtları', 'Loan Register')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...th, textAlign: 'left' }}>{L('Şirket', 'Company')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Banka', 'Bank')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Kredi No', 'Loan No')}</th>
              <th style={th}>{L('Anapara', 'Principal')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Vade', 'Term')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Ödenen/Kalan', 'Paid/Left')}</th>
              <th style={th}>{L('Kalan Ödeme', 'Remaining')}</th>
              <th style={th}>{L('Erken Kapama', 'Early Payoff')}</th>
              <th style={th}>{L('Tasarruf', 'Savings')}</th>
              <th style={th}>%</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Aksiyon', 'Action')}</th>
            </tr></thead>
            <tbody>
              {rows.map(({ loan, sum, ep }) => {
                const cur = loan.paraBirimi;
                const active = loan.id === selectedId;
                return (
                  <tr key={loan.id} style={{ background: active ? t.prL : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedId(active ? null : loan.id)}>
                    <td style={{ ...td, textAlign: 'left' }}>{loan.sirket}</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{loan.banka}</td>
                    <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{loan.krediNo}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{money(loan.anapara, cur)}</td>
                    <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{loan.vadeAy} {loan.odemeSikligi === '3 Aylık' ? L('çeyrek', 'q') : L('ay', 'mo')}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{sum.odenenTaksitSayisi}/{sum.kalanTaksitSayisi}</td>
                    <td style={td}>{money(sum.kalanOdemeTutari, cur)}</td>
                    <td style={td}>{money(ep.erkenKapamaTutari, cur)}</td>
                    <td style={{ ...td, color: ep.tasarruf > 0 ? t.gn : t.tx2, fontWeight: 600 }}>{money(ep.tasarruf, cur)}</td>
                    <td style={{ ...td, color: ep.tasarruf > 0 ? t.gn : t.tx2 }}>{(ep.tasarrufYuzdesi * 100).toFixed(1)}%</td>
                    <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        <button title={L('Amortisman Gör', 'View Amortization')} onClick={(e) => { e.stopPropagation(); setSelectedId(loan.id); }} style={iconBtn(t)}><Icon name="barChart3" size={12} /></button>
                        <button title={L('Erken Kapama Hesapla', 'Compute Early Payoff')} onClick={(e) => { e.stopPropagation(); setSelectedId(loan.id); }} style={iconBtn(t)}><Icon name="calculator" size={12} /></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seçili kredi: Erken Kapama kartı + Amortisman tablosu */}
      {selected && (
        <div style={{ marginBottom: 16 }}>
          <EarlyPayoffCard t={t} L={L} loan={selected.loan} ep={selected.ep} sum={selected.sum} />
          <AmortizationTable t={t} L={L} loan={selected.loan} editMode={editMode} onTogglePaid={(k) => togglePaid(selected.loan, k)} />
        </div>
      )}

      {/* Check register */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Çek / Senet Kayıtları', 'Cheque / Note Register')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...th, textAlign: 'left' }}>{L('Çek/Senet No', 'No')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Banka', 'Bank')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Şirket', 'Company')}</th>
              <th style={th}>{L('Tutar', 'Amount')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Vade', 'Due')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Tip', 'Type')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Yön', 'Dir.')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Durum', 'Status')}</th>
              <th style={{ ...th, textAlign: 'left' }}>{L('Not', 'Note')}</th>
            </tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{c.cekNo}</td>
                  <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{c.banka}</td>
                  <td style={{ ...td, textAlign: 'left' }}>{c.sirket}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{money(c.tutar, 'TRY')}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11.5 }}>{c.vade}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{c.odemeTipi}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: c.yon === 'Alınan' ? t.gn : t.co }}>{c.yon === 'Alınan' ? L('Alınan', 'Received') : L('Verilen', 'Issued')}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>{durumBadge(c.durum)}</td>
                  <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{c.not ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loanModal && <LoanModal t={t} L={L} onClose={() => setLoanModal(false)} onSave={addLoan} />}
      {checkModal && <CheckModal t={t} L={L} onClose={() => setCheckModal(false)} onSave={addCheck} />}
    </div>
  );
};

// ── Erken kapama kartı ──
const EarlyPayoffCard = ({ t, L, loan, ep, sum }: { t: Theme; L: (a: string, b: string) => string; loan: Loan; ep: ReturnType<typeof computeEarlyPayoff>; sum: ReturnType<typeof summarize> }) => {
  const cur = loan.paraBirimi;
  const firstQuarter = sum.odenenTaksitSayisi <= loan.vadeAy / 4;
  const stat = (lb: string, v: string, c?: string, note?: string) => (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11.5, color: t.tx2 }}>{lb}{note ? <span style={{ color: t.tx3 }}> {note}</span> : null}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: c ?? t.tx, marginTop: 2 }}>{v}</div>
    </div>
  );
  return (
    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 12 }}>{L('Erken Kapama', 'Early Payoff')} — {loan.banka} · {loan.krediNo}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stat(L('Erken Kapama Tutarı', 'Payoff Amount'), money(ep.erkenKapamaTutari, cur), t.tx)}
        {stat(L('Tasarruf', 'Savings'), money(ep.tasarruf, cur), t.gn)}
        {stat(L('Tasarruf %', 'Savings %'), `${(ep.tasarrufYuzdesi * 100).toFixed(1)}%`, t.gn)}
        {stat(L('Erken Ödeme Ücreti', 'Prepayment Fee'), money(ep.erkenOdemeUcreti, cur), t.co, L('~yaklaşık', '~approx'))}
        {stat(L('Birikmiş Faiz', 'Accrued Interest'), money(ep.birikmisGunlukFaiz, cur), t.tx2)}
      </div>
      <div style={{ fontSize: 11, color: firstQuarter ? t.gn : t.tx3, background: firstQuarter ? t.gnL : t.bg2, borderRadius: 8, padding: '8px 11px', marginTop: 12, display: 'flex', gap: 7, alignItems: 'center' }}>
        <span>💡</span>
        {firstQuarter
          ? L('Kredinin ilk çeyreğindesiniz — faiz front-loaded olduğu için erken kapama şu an en yüksek tasarrufu sağlar.', 'You are in the loan’s first quarter — interest is front-loaded, so early payoff yields the highest saving now.')
          : L('Faiz front-loaded; erken kapama tasarrufu kredinin ilk çeyreğinde en yüksektir, ilerledikçe azalır.', 'Interest is front-loaded; early-payoff saving peaks in the first quarter and shrinks over time.')}
      </div>
    </div>
  );
};

// ── Amortisman tablosu ──
const AmortizationTable = ({ t, L, loan, editMode, onTogglePaid }: { t: Theme; L: (a: string, b: string) => string; loan: Loan; editMode: boolean; onTogglePaid: (k: number) => void }) => {
  const sched = useMemo(() => generateAmortization(loan), [loan]);
  const cur = loan.paraBirimi;
  const { kkdf } = resolveTaxProfile(loan.krediTuru, loan.paraBirimi);
  const th: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '7px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 11.5, color: t.tx, textAlign: 'right', padding: '6px 9px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const badge = (d: string) => {
    const tone = d === 'Ödendi' ? { fg: t.gn, bg: t.gnL } : d === 'Gecikti' ? { fg: t.rd, bg: t.rdL } : { fg: t.am, bg: t.amL };
    return <span style={{ fontSize: 10, fontWeight: 600, color: tone.fg, background: tone.bg, borderRadius: 20, padding: '2px 8px' }}>{d === 'Ödendi' ? L('Ödendi', 'Paid') : d === 'Gecikti' ? L('Gecikti', 'Overdue') : L('Ödenecek', 'Due')}</span>;
  };
  return (
    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {L('Amortisman Planı', 'Amortization Schedule')} · {loan.krediNo}
        {editMode && <span style={{ fontSize: 10.5, color: t.pr, fontWeight: 500 }}>— {L('taksite tıklayıp ödendi işaretleyin', 'click a row to mark paid')}</span>}
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...th, textAlign: 'left' }}>{L('Taksit', 'Inst.')}</th>
            <th style={{ ...th, textAlign: 'center' }}>{L('Vade', 'Due')}</th>
            <th style={th}>{L('Taksit', 'Payment')}</th>
            <th style={th}>{L('Anapara', 'Principal')}</th>
            <th style={th}>{L('Faiz', 'Interest')}</th>
            <th style={th}>BSMV</th>
            <th style={th}>KKDF</th>
            <th style={th}>{L('Kalan Anapara', 'Balance')}</th>
            <th style={{ ...th, textAlign: 'center' }}>{L('Durum', 'Status')}</th>
          </tr></thead>
          <tbody>
            {sched.map((r) => (
              <tr key={r.index} onClick={() => onTogglePaid(r.index)} style={{ cursor: editMode ? 'pointer' : 'default', background: r.durum === 'Ödendi' ? t.gnL + '55' : 'transparent' }}>
                <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{r.taksitNo}</td>
                <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11 }}>{r.vadeTarihi}</td>
                <td style={{ ...td, fontWeight: 600 }}>{money(r.taksitTutari, cur)}</td>
                <td style={td}>{money(r.anaparaPayi, cur)}</td>
                <td style={{ ...td, color: t.tx2 }}>{money(r.faizPayi, cur)}</td>
                <td style={{ ...td, color: t.tx3 }}>{money(r.bsmvPayi, cur)}</td>
                <td style={{ ...td, color: t.tx3 }}>{kkdf === 0 ? '—' : money(r.kkdfPayi, cur)}</td>
                <td style={td}>{money(r.kalanAnapara, cur)}</td>
                <td style={{ ...td, textAlign: 'center' }}>{badge(r.durum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Kredi Ekle modal ──
const LoanModal = ({ t, L, onClose, onSave }: { t: Theme; L: (a: string, b: string) => string; onClose: () => void; onSave: (l: Loan) => void }) => {
  const [sirket, setSirket] = useState<LoanSirket>('Muhiku Limited');
  const [banka, setBanka] = useState<LoanBanka>('İş Bankası');
  const [krediNo, setKrediNo] = useState('');
  const [krediTuru, setKrediTuru] = useState<KrediTuru>('İşletme');
  const [paraBirimi, setParaBirimi] = useState<ParaBirimi>('TRY');
  const [anapara, setAnapara] = useState('');
  const [kullandirimTarihi, setKullandirim] = useState('');
  const [vadeAy, setVadeAy] = useState('');
  const [faiz, setFaiz] = useState('');
  const [odemeSikligi, setOdemeSikligi] = useState<OdemeSikligi>('Aylık');

  const P = Number(anapara.replace(/[^\d.]/g, '')) || 0;
  const n = Number(vadeAy.replace(/[^\d]/g, '')) || 0;
  const rMonthly = (Number(faiz.replace(/[^\d.,]/g, '').replace(',', '.')) || 0) / 100;
  const valid = krediNo !== '' && P > 0 && n > 0 && rMonthly > 0 && kullandirimTarihi !== '';

  const preview = useMemo(() => {
    if (!valid) return null;
    const draft: Loan = { id: 'PREVIEW', sirket, banka, krediNo, krediTuru, paraBirimi, anapara: P, kullandirimTarihi, sorguTarihi: todayISO(), vadeAy: n, faizOraniAylik: rMonthly, odemeSikligi, odenenTaksitSayisi: 0, kaynak: 'Manuel' };
    const sched = generateAmortization(draft);
    const sum = summarize(draft);
    const toplamFaiz = sched.reduce((s, r) => s + r.faizPayi, 0);
    const toplamBsmv = sched.reduce((s, r) => s + r.bsmvPayi, 0);
    const toplamKkdf = sched.reduce((s, r) => s + r.kkdfPayi, 0);
    return { draft, sched, sum, toplamFaiz, toplamBsmv, toplamKkdf };
  }, [valid, sirket, banka, krediNo, krediTuru, paraBirimi, P, kullandirimTarihi, n, rMonthly, odemeSikligi]);

  const save = () => {
    if (!preview) return;
    onSave({ ...preview.draft, id: `LX${Date.now()}` });
  };
  const cur = paraBirimi;

  return (
    <Modal t={t} onClose={onClose} width={720} title={L('Kredi Ekle', 'Add Loan')}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* Sol: form */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row2>
            <FieldS label={L('Şirket', 'Company')} t={t}><Sel t={t} value={sirket} onChange={(v) => setSirket(v as LoanSirket)} opts={SIRKETLER} /></FieldS>
            <FieldS label={L('Banka', 'Bank')} t={t}><Sel t={t} value={banka} onChange={(v) => setBanka(v as LoanBanka)} opts={BANKALAR} /></FieldS>
          </Row2>
          <Row2>
            <FieldS label={L('Kredi No', 'Loan No')} t={t}><input value={krediNo} onChange={(e) => setKrediNo(e.target.value)} style={inp(t)} placeholder="ISB-2026-..." /></FieldS>
            <FieldS label={L('Kredi Türü', 'Loan Type')} t={t}><Sel t={t} value={krediTuru} onChange={(v) => setKrediTuru(v as KrediTuru)} opts={KREDI_TURLERI} /></FieldS>
          </Row2>
          <Row2>
            <FieldS label={L('Para Birimi', 'Currency')} t={t}><Sel t={t} value={paraBirimi} onChange={(v) => setParaBirimi(v as ParaBirimi)} opts={['TRY', 'USD']} /></FieldS>
            <FieldS label={L('Anapara', 'Principal')} t={t} req><input value={anapara} onChange={(e) => setAnapara(e.target.value)} style={inp(t)} placeholder="0" /></FieldS>
          </Row2>
          <Row2>
            <FieldS label={L('Kullandırım Tarihi', 'Disbursement Date')} t={t} req><input type="date" value={kullandirimTarihi} onChange={(e) => setKullandirim(e.target.value)} style={inp(t)} /></FieldS>
            <FieldS label={L('Taksit Sayısı', 'Installments')} t={t} req><input value={vadeAy} onChange={(e) => setVadeAy(e.target.value)} style={inp(t)} placeholder="12" /></FieldS>
          </Row2>
          <Row2>
            <FieldS label={L('Aylık Faiz %', 'Monthly Rate %')} t={t} req><input value={faiz} onChange={(e) => setFaiz(e.target.value)} style={inp(t)} placeholder="4,2" /></FieldS>
            <FieldS label={L('Ödeme Sıklığı', 'Frequency')} t={t}><Sel t={t} value={odemeSikligi} onChange={(v) => setOdemeSikligi(v as OdemeSikligi)} opts={['Aylık', '3 Aylık']} /></FieldS>
          </Row2>
          <div style={{ fontSize: 10.5, color: t.tx3 }}>{L('Girişler', 'Inputs')}: <b style={{ color: t.am }}>{L('Manuel', 'Manual')}</b> · {L('Türev alanlar', 'Derived')}: <b style={{ color: t.tx2 }}>{L('Hesaplanan', 'Computed')}</b></div>
        </div>

        {/* Sağ: canlı önizleme */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ background: t.bg2, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.tx2, marginBottom: 10 }}>{L('Canlı Önizleme (Hesaplanan)', 'Live Preview (Computed)')}</div>
            {preview ? (
              <>
                <PRow t={t} lb={L('Taksit Tutarı', 'Installment')} v={money(preview.sum.taksitTutari, cur)} strong />
                <PRow t={t} lb={L('Toplam Ödeme', 'Total Payment')} v={money(preview.sum.krediToplamOdeme, cur)} />
                <PRow t={t} lb={L('Toplam Faiz', 'Total Interest')} v={money(preview.toplamFaiz, cur)} />
                <PRow t={t} lb="Toplam BSMV" v={money(preview.toplamBsmv, cur)} />
                <PRow t={t} lb="Toplam KKDF" v={preview.toplamKkdf ? money(preview.toplamKkdf, cur) : '—'} />
                <div style={{ borderTop: `1px solid ${t.bd}`, margin: '8px 0' }} />
                <div style={{ fontSize: 10.5, color: t.tx3, marginBottom: 6 }}>{L('Amortisman (ilk 4 taksit)', 'Amortization (first 4)')}</div>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {preview.sched.slice(0, 4).map((r) => (
                    <div key={r.index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: t.tx2, padding: '2px 0' }}>
                      <span>{r.taksitNo} · {r.vadeTarihi}</span>
                      <span>{money(r.taksitTutari, cur)} <span style={{ color: t.tx3 }}>(a {money(r.anaparaPayi, cur)} / f {money(r.faizPayi, cur)})</span></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: t.tx3 }}>{L('Anapara, taksit sayısı, faiz ve tarih girin.', 'Enter principal, installments, rate and date.')}</div>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <button onClick={onClose} style={btnG(t)}>{L('Vazgeç', 'Cancel')}</button>
        <button onClick={save} disabled={!valid} style={{ ...btnP, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>{L('Kaydet', 'Save')}</button>
      </div>
    </Modal>
  );
};

// ── Çek Ekle modal ──
const CheckModal = ({ t, L, onClose, onSave }: { t: Theme; L: (a: string, b: string) => string; onClose: () => void; onSave: (c: Check) => void }) => {
  const [cekNo, setCekNo] = useState('');
  const [banka, setBanka] = useState<LoanBanka>('İş Bankası');
  const [sirket, setSirket] = useState<LoanSirket>('Muhiku Limited');
  const [tutar, setTutar] = useState('');
  const [duzenlemeTarihi, setDuz] = useState('');
  const [vade, setVade] = useState('');
  const [odemeTipi, setOdemeTipi] = useState<OdemeTipi>('Çek');
  const [yon, setYon] = useState<CheckYon>('Verilen');
  const [durum, setDurum] = useState<CheckDurum>('Ödenecek');
  const [taksit, setTaksit] = useState('');
  const [note, setNote] = useState('');

  const tutarNum = Number(tutar.replace(/[^\d.]/g, '')) || 0;
  const valid = cekNo !== '' && tutarNum > 0 && vade !== '';
  const save = () => {
    if (!valid) return;
    onSave({ id: `CX${Date.now()}`, cekNo, banka, sirket, tutar: tutarNum, duzenlemeTarihi: duzenlemeTarihi || vade, vade, odemeTipi, yon, durum, taksit: taksit || undefined, not: note || undefined, karsiliksizMi: durum === 'Karşılıksız' });
  };
  return (
    <Modal t={t} onClose={onClose} width={520} title={L('Çek / Senet Ekle', 'Add Cheque / Note')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row2>
          <FieldS label={L('Çek/Senet No', 'No')} t={t} req><input value={cekNo} onChange={(e) => setCekNo(e.target.value)} style={inp(t)} /></FieldS>
          <FieldS label={L('Tip', 'Type')} t={t}><Sel t={t} value={odemeTipi} onChange={(v) => setOdemeTipi(v as OdemeTipi)} opts={['Çek', 'Senet', 'Kredi']} /></FieldS>
        </Row2>
        <Row2>
          <FieldS label={L('Banka', 'Bank')} t={t}><Sel t={t} value={banka} onChange={(v) => setBanka(v as LoanBanka)} opts={BANKALAR} /></FieldS>
          <FieldS label={L('Şirket', 'Company')} t={t}><Sel t={t} value={sirket} onChange={(v) => setSirket(v as LoanSirket)} opts={SIRKETLER} /></FieldS>
        </Row2>
        <Row2>
          <FieldS label={L('Tutar', 'Amount')} t={t} req><input value={tutar} onChange={(e) => setTutar(e.target.value)} style={inp(t)} placeholder="0" /></FieldS>
          <FieldS label={L('Yön', 'Direction')} t={t}><Sel t={t} value={yon} onChange={(v) => setYon(v as CheckYon)} opts={['Verilen', 'Alınan']} /></FieldS>
        </Row2>
        <Row2>
          <FieldS label={L('Düzenleme Tarihi', 'Issue Date')} t={t}><input type="date" value={duzenlemeTarihi} onChange={(e) => setDuz(e.target.value)} style={inp(t)} /></FieldS>
          <FieldS label={L('Vade', 'Due Date')} t={t} req><input type="date" value={vade} onChange={(e) => setVade(e.target.value)} style={inp(t)} /></FieldS>
        </Row2>
        <Row2>
          <FieldS label={L('Durum', 'Status')} t={t}><Sel t={t} value={durum} onChange={(v) => setDurum(v as CheckDurum)} opts={['Ödenecek', 'Ödendi', 'Karşılıksız']} /></FieldS>
          <FieldS label={L('Taksit (k/n)', 'Installment (k/n)')} t={t}><input value={taksit} onChange={(e) => setTaksit(e.target.value)} style={inp(t)} placeholder="3/12" /></FieldS>
        </Row2>
        <FieldS label={L('Not', 'Note')} t={t}><input value={note} onChange={(e) => setNote(e.target.value)} style={inp(t)} /></FieldS>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <button onClick={onClose} style={btnG(t)}>{L('Vazgeç', 'Cancel')}</button>
        <button onClick={save} disabled={!valid} style={{ ...btnP, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>{L('Kaydet', 'Save')}</button>
      </div>
    </Modal>
  );
};

// ── ortak küçük parçalar ──
const btnP: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const btnG = (t: Theme): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' });
const iconBtn = (t: Theme): CSSProperties => ({ width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' });
const inp = (t: Theme): CSSProperties => ({ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 13, boxSizing: 'border-box' });

const Modal = ({ t, onClose, width, title, children }: { t: Theme; onClose: () => void; width: number; title: string; children: ReactNode }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: t.cd, borderRadius: 14, padding: 24, width, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${t.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: t.tx, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  </div>
);
const Row2 = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
const FieldS = ({ label, t, req, children }: { label: string; t: Theme; req?: boolean; children: ReactNode }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 11.5, fontWeight: 500, color: t.tx2, marginBottom: 4 }}>{label}{req && <span style={{ color: t.rd }}> *</span>}</div>
    {children}
  </div>
);
function Sel({ t, value, onChange, opts }: { t: Theme; value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp(t), cursor: 'pointer' }}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
const PRow = ({ t, lb, v, strong }: { t: Theme; lb: string; v: string; strong?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
    <span style={{ fontSize: 11.5, color: t.tx2 }}>{lb}</span>
    <span style={{ fontSize: strong ? 15 : 12.5, fontWeight: strong ? 700 : 600, color: strong ? t.pr : t.tx }}>{v}</span>
  </div>
);
