import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AreaChart, Area, ComposedChart, Bar, Line, PieChart, Pie, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { Theme, Lang } from '../../types';
import type { AuditEntry } from '../../types/finance';
import type {
  Loan, Check, LoanSirket, LoanBanka, KrediTuru, ParaBirimi, OdemeSikligi, OdemeTipi, CheckYon, CheckDurum,
} from '../../types/loans';
import { loansSeed, checksSeed } from '../../constants/loansData';
import { generateAmortization, computeEarlyPayoff, summarize, daysBetween } from '../../lib/finance/loanEngine';
import { resolveTaxProfile } from '../../constants/taxConfig';
import { Icon } from '../../components/ui/Icon';
import { fmtNumber } from '../../utils/format';
import { KPIBand, KPICard, ChartCard, AIAlertPanel, type FinAlert } from '../../components/finance';

const SIRKETLER: LoanSirket[] = ['Muhiku Limited', 'Muhiku Kurumsal A.Ş.', 'Ahmet Üreme Şahsi'];
const BANKALAR: LoanBanka[] = ['Ziraat', 'İş Bankası', 'Garanti BBVA', 'Yapı Kredi', 'Halkbank', 'Vakıf Katılım', 'Vakıfbank'];
const KREDI_TURLERI: KrediTuru[] = ['İşletme', 'Spot', 'Rotatif', 'Taşıt', 'Diğer'];
const USD_TRY = 44.9; // demo agregasyon kuru (KPI/grafiklerde TRY birleştirme)
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const money = (v: number, cur: ParaBirimi) => (cur === 'USD' ? `$${fmtNumber(Math.round(v))}` : `${fmtNumber(Math.round(v))} ₺`);
const cTRY = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M ₺` : `${Math.round(v / 1e3)}K ₺`);
const toTRY = (v: number, cur: ParaBirimi) => (cur === 'USD' ? v * USD_TRY : v);

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
  const chartLoan = selected ?? rows[0] ?? null;

  // ── KPI (TRY birleştirilmiş) ──
  const sumT = (fn: (r: typeof rows[number]) => number) => rows.reduce((s, r) => s + toTRY(fn(r), r.loan.paraBirimi), 0);
  const toplamFinansman = sumT((r) => r.loan.anapara);
  const toplamOdeme = sumT((r) => r.sum.krediToplamOdeme);
  const kalanOdeme = sumT((r) => r.sum.kalanOdemeTutari);
  const erkenKapama = sumT((r) => r.ep.erkenKapamaTutari);
  const tasarrufPot = rows.reduce((s, r) => s + Math.max(0, toTRY(r.ep.tasarruf, r.loan.paraBirimi)), 0);
  const krediBorc = sumT((r) => r.ep.kalanAnapara);
  const cekBorc = checks.filter((c) => c.yon === 'Verilen' && c.durum !== 'Ödendi').reduce((s, c) => s + c.tutar, 0);
  const toplamBorc = krediBorc + cekBorc;

  const addLoan = (ln: Loan) => { setLoans((x) => [ln, ...x]); setLoanModal(false); setSelectedId(ln.id); log(ln.krediNo, `${ln.banka} · ${ln.krediNo}`, L(`Kredi eklendi: ${money(ln.anapara, ln.paraBirimi)} · ${ln.vadeAy} taksit`, `Loan added: ${money(ln.anapara, ln.paraBirimi)} · ${ln.vadeAy} inst.`)); };
  const addCheck = (c: Check) => { setChecks((x) => [c, ...x]); setCheckModal(false); log(c.cekNo, `${c.odemeTipi} · ${c.cekNo}`, L(`${c.yon} ${c.odemeTipi} eklendi: ${money(c.tutar, 'TRY')}`, `${c.yon} ${c.odemeTipi} added: ${money(c.tutar, 'TRY')}`)); };

  const togglePaid = (loan: Loan, k: number) => {
    if (!editMode) return;
    const next = loan.odenenTaksitSayisi === k ? k - 1 : k;
    setLoans((xs) => xs.map((l) => (l.id === loan.id ? { ...l, odenenTaksitSayisi: next } : l)));
    log(loan.krediNo, `${loan.banka} · ${loan.krediNo}`, L(`Ödenen taksit: ${loan.odenenTaksitSayisi} → ${next}`, `Paid installments: ${loan.odenenTaksitSayisi} → ${next}`));
  };

  // ── Grafik 1: amortisman eğrisi (seçili kredi) ──
  const amortData = useMemo(() => (chartLoan ? generateAmortization(chartLoan.loan).map((r) => ({ k: r.taksitNo.split('/')[0], anapara: r.anaparaPayi, faiz: r.faizPayi })) : []), [chartLoan]);

  // ── Grafik 2: erken kapama tasarruf (kredi bazında) ──
  const savingData = rows.map((r) => ({ name: r.loan.krediNo.replace(/^[A-Z]+-/, '').slice(-6), tasarruf: Math.round(toTRY(r.ep.tasarruf, r.loan.paraBirimi)), yuzde: +(r.ep.tasarrufYuzdesi * 100).toFixed(1) }));

  // ── Grafik 3: banka bazlı borç donut ──
  const bankData = BANKALAR.map((b) => ({ name: b, value: Math.round(rows.filter((r) => r.loan.banka === b).reduce((s, r) => s + toTRY(r.ep.kalanAnapara, r.loan.paraBirimi), 0)) })).filter((d) => d.value > 0);
  const DONUT = [t.pr, t.tl, t.am, t.gn, t.pu, t.co, t.c1];

  // ── Grafik 4: yaklaşan 90 gün (15 günlük 6 bucket, kredi+çek) ──
  const REF = todayISO();
  const END = addDaysISO(REF, 90);
  const upcoming = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, i) => ({ label: `${i * 15 + 1}-${i * 15 + 15}${L('g', 'd')}`, kredi: 0, cek: 0 }));
    const put = (dateISO: string, amt: number, kind: 'kredi' | 'cek') => {
      const diff = daysBetween(REF, dateISO);
      if (diff < 0 || diff > 90) return;
      const bi = Math.min(5, Math.floor(diff / 15));
      buckets[bi][kind] += amt;
    };
    for (const { loan } of rows) for (const inst of generateAmortization(loan)) if (inst.durum !== 'Ödendi') put(inst.vadeTarihi, toTRY(inst.taksitTutari, loan.paraBirimi), 'kredi');
    for (const c of checks) if (c.durum === 'Ödenecek') put(c.vade, c.tutar, 'cek');
    return buckets.map((b) => ({ ...b, kredi: Math.round(b.kredi), cek: Math.round(b.cek) }));
  }, [rows, checks]);

  // ── AI uyarıları (demo, hesaplanan) ──
  const fq = rows.filter((r) => r.sum.odenenTaksitSayisi <= r.loan.vadeAy / 4 && r.ep.tasarruf > 0).sort((a, b) => toTRY(b.ep.tasarruf, b.loan.paraBirimi) - toTRY(a.ep.tasarruf, a.loan.paraBirimi))[0];
  const bestPct = [...rows].sort((a, b) => b.ep.tasarrufYuzdesi - a.ep.tasarrufYuzdesi)[0];
  const cek30 = checks.filter((c) => c.yon === 'Verilen' && c.durum === 'Ödenecek' && daysBetween(REF, c.vade) >= 0 && daysBetween(REF, c.vade) <= 30).reduce((s, c) => s + c.tutar, 0);
  const alerts: FinAlert[] = [];
  if (fq) alerts.push({ severity: 'critical', text: L(`${fq.loan.banka} ${fq.loan.krediNo} kredisinde erken kapama ${money(fq.ep.erkenKapamaTutari, fq.loan.paraBirimi)} ile ${money(fq.ep.tasarruf, fq.loan.paraBirimi)} tasarruf sağlıyor (ilk çeyrek).`, `${fq.loan.banka} ${fq.loan.krediNo}: early payoff at ${money(fq.ep.erkenKapamaTutari, fq.loan.paraBirimi)} yields ${money(fq.ep.tasarruf, fq.loan.paraBirimi)} saving (first quarter).`), linkLabel: L('Detay', 'Detail'), onLink: () => setSelectedId(fq.loan.id) });
  if (cek30 > 0) alerts.push({ severity: 'warning', text: L(`Önümüzdeki 30 günde ${cTRY(cek30)} verilen çek vadesi yoğunlaşıyor.`, `${cTRY(cek30)} of issued cheques fall due within the next 30 days.`) });
  if (bestPct) alerts.push({ severity: 'tip', text: L(`${bestPct.loan.banka} kredisi erken kapama tasarrufu %${(bestPct.ep.tasarrufYuzdesi * 100).toFixed(0)} — en yüksek oran.`, `${bestPct.loan.banka} loan has the highest early-payoff saving at ${(bestPct.ep.tasarrufYuzdesi * 100).toFixed(0)}%.`), linkLabel: L('Detay', 'Detail'), onLink: () => setSelectedId(bestPct.loan.id) });

  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 9px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const durumBadge = (d: string) => {
    const tone = d === 'Ödendi' ? { fg: t.gn, bg: t.gnL } : d === 'Gecikti' || d === 'Karşılıksız' ? { fg: t.rd, bg: t.rdL } : { fg: t.am, bg: t.amL };
    const label = d === 'Ödendi' ? L('Ödendi', 'Paid') : d === 'Ödenecek' ? L('Ödenecek', 'Due') : d === 'Gecikti' ? L('Gecikti', 'Overdue') : L('Karşılıksız', 'Bounced');
    return <span style={{ fontSize: 10.5, fontWeight: 600, color: tone.fg, background: tone.bg, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap' }}>{label}</span>;
  };
  const checksSorted = [...checks].sort((a, b) => a.vade.localeCompare(b.vade));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setLoanModal(true)} style={btnP}><Icon name="plus" size={13} color="#fff" /> {L('Kredi Ekle', 'Add Loan')}</button>
        <button onClick={() => setCheckModal(true)} style={btnG(t)}><Icon name="plus" size={13} color={t.tx2} /> {L('Çek / Senet Ekle', 'Add Cheque / Note')}</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setEditMode((e) => !e)} style={editMode ? btnP : btnG(t)}>
          <Icon name="fileText" size={13} color={editMode ? '#fff' : t.tx2} /> {editMode ? L('Düzenleme açık', 'Editing on') : f('edit')}
        </button>
      </div>

      {/* KPI bandı (shared) */}
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Toplam Finansman', 'Total Financing')} value={cTRY(toplamFinansman)} goodDir="down" hint={`${loans.length} ${L('kredi', 'loans')}`} />
        <KPICard t={t} lang={lang} title={L('Toplam Ödeme', 'Total Payment')} value={cTRY(toplamOdeme)} goodDir="down" />
        <KPICard t={t} lang={lang} title={L('Kalan Ödeme', 'Remaining Payment')} value={cTRY(kalanOdeme)} goodDir="down" />
        <KPICard t={t} lang={lang} title={L('Erken Kapama Tutarı', 'Early Payoff Amount')} value={cTRY(erkenKapama)} goodDir="down" hint={L('bugün kapatılırsa', 'if closed today')} />
        <KPICard t={t} lang={lang} title={L('Tasarruf Potansiyeli', 'Savings Potential')} value={cTRY(tasarrufPot)} goodDir="up" sparkColor={t.gn} hint={L('erken kapama', 'early payoff')} />
        <KPICard t={t} lang={lang} title={L('Toplam Borç (Kuruma Göre)', 'Total Debt (by entity)')} value={cTRY(toplamBorc)} goodDir="down" hint={`${L('Çek', 'Cheque')} ${cTRY(cekBorc)} · ${L('Kredi', 'Loan')} ${cTRY(krediBorc)}`} />
      </KPIBand>

      {/* Grafikler */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={`${L('Amortisman Eğrisi', 'Amortization Curve')}${chartLoan ? ` — ${chartLoan.loan.krediNo}` : ''}`}
          why={L('Bankrate/HSH amortisman tablosu — erken dönemde faiz ağırlığı görselleştirilir.', 'Bankrate/HSH amortization table — visualizes front-loaded interest.')}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={amortData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="lnAna" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.pr} stopOpacity={0.5} /><stop offset="100%" stopColor={t.pr} stopOpacity={0.05} /></linearGradient>
                <linearGradient id="lnFaiz" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.am} stopOpacity={0.5} /><stop offset="100%" stopColor={t.am} stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="k" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(amortData.length / 12))} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} width={44} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => money(v, chartLoan?.loan.paraBirimi ?? 'TRY')} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="anapara" stackId="1" name={L('Anapara Payı', 'Principal')} stroke={t.pr} fill="url(#lnAna)" strokeWidth={2} />
              <Area type="monotone" dataKey="faiz" stackId="1" name={L('Faiz Payı', 'Interest')} stroke={t.am} fill="url(#lnFaiz)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={L('Erken Kapama Tasarrufu', 'Early-Payoff Savings')}
          why={L('Total Mortgage/HSH prepayment savings calculator — kredi bazında tutar + %.', 'Total Mortgage/HSH prepayment-savings calculator — amount + % per loan.')}>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={savingData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={44} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} width={44} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'yuzde' ? `${v}%` : cTRY(v))} />
              <Bar yAxisId="l" dataKey="tasarruf" name={L('Tasarruf', 'Savings')} fill={t.gn} radius={[3, 3, 0, 0]} barSize={20} />
              <Line yAxisId="r" type="monotone" dataKey="yuzde" name={L('Tasarruf %', 'Savings %')} stroke={t.pr} strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={40} title={L('Banka Bazlı Borç', 'Debt by Bank')}
          why={L('Kalan anapara toplamının 7 banka arasında dağılımı.', 'Remaining-principal distribution across the 7 banks.')}>
          <div style={{ position: 'relative', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bankData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={2}>
                  {bankData.map((_, i) => <Cell key={i} fill={DONUT[i % DONUT.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => cTRY(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.tx }}>{cTRY(krediBorc)}</div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{L('kredi borcu', 'loan debt')}</div>
            </div>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={56} title={L('Yaklaşan Taksit / Çek (90 gün)', 'Upcoming Instalments / Cheques (90d)')}
          why={L('Paraşüt vade-bazlı nakit akışı + ReportingGuru payment-forecast (haftalık bucket) deseni.', 'Paraşüt due-date cash-flow + ReportingGuru payment-forecast (weekly bucket) pattern.')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={upcoming} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} width={44} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => cTRY(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="kredi" name={L('Kredi Taksiti', 'Loan Inst.')} stackId="a" fill={t.pr} radius={[0, 0, 0, 0]} />
              <Bar dataKey="cek" name={L('Çek/Senet', 'Cheque/Note')} stackId="a" fill={t.co} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI paneli */}
      {alerts.length > 0 && <div style={{ marginTop: 16 }}><AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('Kredi & Çek Uyarıları', 'Loan & Cheque Alerts')} /></div>}

      {/* Loan register (virtualized) */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginTop: 16, marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Kredi Kayıtları', 'Loan Register')} <span style={{ color: t.tx3, fontWeight: 400 }}>· {rows.length}</span></div>
        <VirtualTable t={t} rowH={37} height={rows.length > 12 ? 460 : rows.length * 37 + 40} colCount={11}
          header={<tr>
            {[L('Şirket', 'Company'), L('Banka', 'Bank'), L('Kredi No', 'Loan No')].map((h) => <Th key={h} t={t} left>{h}</Th>)}
            {[L('Anapara', 'Principal')].map((h) => <Th key={h} t={t}>{h}</Th>)}
            <Th t={t} center>{L('Vade', 'Term')}</Th><Th t={t} center>{L('Ödenen/Kalan', 'Paid/Left')}</Th>
            {[L('Kalan Ödeme', 'Remaining'), L('Erken Kapama', 'Early Payoff'), L('Tasarruf', 'Savings'), '%'].map((h) => <Th key={h} t={t}>{h}</Th>)}
            <Th t={t} center>{L('Aksiyon', 'Action')}</Th>
          </tr>}
          rows={rows}
          renderRow={({ loan, sum, ep }) => {
            const cur = loan.paraBirimi; const active = loan.id === selectedId;
            return (
              <tr key={loan.id} style={{ height: 37, background: active ? t.prL : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedId(active ? null : loan.id)}>
                <td style={{ ...td, textAlign: 'left' }}>{loan.sirket}</td>
                <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{loan.banka}</td>
                <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{loan.krediNo}</td>
                <td style={{ ...td, fontWeight: 600 }}>{money(loan.anapara, cur)}</td>
                <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{loan.vadeAy} {loan.odemeSikligi === '3 Aylık' ? L('çyr', 'q') : L('ay', 'mo')}</td>
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
          }}
        />
      </div>

      {/* Seçili kredi detay */}
      {selected && (
        <div style={{ marginBottom: 16 }}>
          <EarlyPayoffCard t={t} L={L} loan={selected.loan} ep={selected.ep} sum={selected.sum} />
          <AmortizationTable t={t} L={L} loan={selected.loan} editMode={editMode} onTogglePaid={(k) => togglePaid(selected.loan, k)} />
        </div>
      )}

      {/* Check register (virtualized; vade artan) */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Çek / Senet Kayıtları', 'Cheque / Note Register')} <span style={{ color: t.tx3, fontWeight: 400 }}>· {checks.length}</span></div>
        <VirtualTable t={t} rowH={37} height={checks.length > 12 ? 460 : checks.length * 37 + 40} colCount={9}
          header={<tr>
            <Th t={t} left>{L('Çek/Senet No', 'No')}</Th><Th t={t} left>{L('Banka', 'Bank')}</Th><Th t={t} left>{L('Şirket', 'Company')}</Th>
            <Th t={t}>{L('Tutar', 'Amount')}</Th><Th t={t} center>{L('Vade', 'Due')}</Th><Th t={t} center>{L('Tip', 'Type')}</Th>
            <Th t={t} center>{L('Yön', 'Dir.')}</Th><Th t={t} center>{L('Durum', 'Status')}</Th><Th t={t} left>{L('Not', 'Note')}</Th>
          </tr>}
          rows={checksSorted}
          renderRow={(c) => (
            <tr key={c.id} style={{ height: 37 }}>
              <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{c.cekNo}</td>
              <td style={{ ...td, textAlign: 'left', color: t.tx2 }}>{c.banka}</td>
              <td style={{ ...td, textAlign: 'left' }}>{c.sirket}</td>
              <td style={{ ...td, fontWeight: 600 }}>{money(c.tutar, 'TRY')}</td>
              <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11.5 }}>{c.vade}</td>
              <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{c.odemeTipi}</td>
              <td style={{ ...td, textAlign: 'center' }}><span style={{ fontSize: 10.5, fontWeight: 600, color: c.yon === 'Alınan' ? t.gn : t.co }}>{c.yon === 'Alınan' ? L('Alınan', 'Received') : L('Verilen', 'Issued')}</span></td>
              <td style={{ ...td, textAlign: 'center' }}>{durumBadge(c.durum)}</td>
              <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{c.not ?? '—'}</td>
            </tr>
          )}
        />
      </div>

      {loanModal && <LoanModal t={t} L={L} onClose={() => setLoanModal(false)} onSave={addLoan} />}
      {checkModal && <CheckModal t={t} L={L} onClose={() => setCheckModal(false)} onSave={addCheck} />}
    </div>
  );
};

// ── Basit satır-windowing tablo (1000+ satır için) ──
function VirtualTable<T>({ t, rows, rowH, height, colCount, header, renderRow }: { t: Theme; rows: T[]; rowH: number; height: number; colCount: number; header: ReactNode; renderRow: (r: T, i: number) => ReactNode }) {
  const [scrollTop, setScrollTop] = useState(0);
  const total = rows.length;
  const visible = Math.ceil(height / rowH) + 6;
  const start = Math.max(0, Math.floor(scrollTop / rowH) - 3);
  const end = Math.min(total, start + visible);
  const padTop = start * rowH;
  const padBottom = Math.max(0, (total - end) * rowH);
  return (
    <div onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)} style={{ maxHeight: height, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: t.cd }}>{header}</thead>
        <tbody>
          {padTop > 0 && <tr style={{ height: padTop }}><td colSpan={colCount} /></tr>}
          {rows.slice(start, end).map((r, i) => renderRow(r, start + i))}
          {padBottom > 0 && <tr style={{ height: padBottom }}><td colSpan={colCount} /></tr>}
        </tbody>
      </table>
    </div>
  );
}
const Th = ({ t, children, left, center }: { t: Theme; children: ReactNode; left?: boolean; center?: boolean }) => (
  <th style={{ fontSize: 10.5, fontWeight: 600, color: t.tx3, textAlign: left ? 'left' : center ? 'center' : 'right', padding: '9px 9px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', background: t.cd, borderBottom: `1px solid ${t.bd}` }}>{children}</th>
);

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

  const save = () => { if (!preview) return; onSave({ ...preview.draft, id: `LX${Date.now()}` }); };
  const cur = paraBirimi;

  return (
    <Modal t={t} onClose={onClose} width={720} title={L('Kredi Ekle', 'Add Loan')}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
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
