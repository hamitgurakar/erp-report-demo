import { useState, type CSSProperties } from 'react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode } from '../../../types/finance';
import { PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw, balanceRaw } from '../../../constants/financeData';
import { apInvoices, apAgingBySupplier, ebelgeReconciliation } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  StatusBadge, Dropdown, type FinAlert,
} from '../../../components/finance';
import { Icon } from '../../../components/ui/Icon';
import type { FinancePageProps } from '../_Placeholder';

const daysOf = (p: FinancialPeriod) => (p.type === 'annual' ? 365 : 90);
const SUP = apAgingBySupplier;
const supTotalDebt = SUP.reduce((s, x) => s + x.totalDebt, 0);
const supOverdue = SUP.reduce((s, x) => s + x.overdue, 0);
const reconMatchPct = (ebelgeReconciliation.matched / (ebelgeReconciliation.matched + ebelgeReconciliation.unmatched)) * 100;

export const Payables = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
  const [donem, setDonem] = useState<PeriodType>('annual');
  const [order, setOrder] = useState<OrderMode>('newestRight');
  const [currency, setCurrency] = useState<FinCurrency>('TRY');
  const en = lang === 'en';

  const periods = donem === 'annual' ? PERIODS_ANNUAL : PERIODS_QUARTER;
  const curr = periods[periods.length - 1];
  const prev = periods[periods.length - 2];

  const sym = currency === 'USD' ? '$' : '₺';
  const conv = (vTRY: number, p: FinancialPeriod = curr) => (currency === 'USD' ? vTRY / p.fxRate : vTRY);
  const fmtC = (v: number) => {
    const a = Math.abs(v);
    const s = a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0);
    return `${sym}${s}`;
  };
  const pl = (p: FinancialPeriod) => p.label.replace('Q', en ? 'Q' : 'Ç');
  const ordered = order === 'newestRight' ? periods : [...periods].reverse();

  // ── türetilen metrikler ──
  const dpoOf = (p: FinancialPeriod) => { const cogs = Math.abs(incomeRaw[p.id].cogs ?? 0); return cogs ? ((balanceRaw[p.id].ap ?? 0) / cogs) * daysOf(p) : 0; };
  const apTurnoverOf = (p: FinancialPeriod) => { const ap = balanceRaw[p.id].ap ?? 0; const cogs = Math.abs(incomeRaw[p.id].cogs ?? 0) * (p.type === 'annual' ? 1 : 4); return ap ? cogs / ap : 0; };
  const scale = (p: FinancialPeriod) => dpoOf(p) / (dpoOf(curr) || 1);

  const overduePct = (supOverdue / supTotalDebt) * 100;
  const concTop5 = Math.min(100, (supTotalDebt / (balanceRaw[curr.id].ap ?? supTotalDebt)) * 100);
  const overdueCount = apInvoices.filter((i) => i.status === 'overdue').length;
  const onTimePct = ((apInvoices.length - overdueCount) / apInvoices.length) * 100;
  const discountCapturePct = 68; // demo: yakalanan/uygun iskonto
  const processingDays = 3.9;    // demo: ortalama fatura işleme süresi

  const kpis = [
    { title: 'DPO', term: 'dpo', goodDir: 'up' as const, value: `${dpoOf(curr).toFixed(0)} ${en ? 'd' : 'gün'}`,
      trend: { value: dpoOf(curr) - dpoOf(prev), isRatio: true }, spark: periods.map(dpoOf), color: t.pr,
      hint: en ? 'Balanced-high favors cash' : 'Dengeli yüksek nakit lehine' },
    { title: en ? 'Overdue Payables %' : 'Vadesi Geçmiş %', term: 'apOverdue', goodDir: 'down' as const, value: `${(overduePct * scale(curr)).toFixed(1)}%`,
      trend: { value: overduePct * scale(curr) - overduePct * scale(prev), isRatio: true }, spark: periods.map((p) => overduePct * scale(p)), color: t.rd },
    { title: en ? 'Discount Capture %' : 'İskonto Yakalama %', term: 'discountCapture', goodDir: 'up' as const, value: `${(discountCapturePct / scale(curr)).toFixed(0)}%`,
      trend: { value: discountCapturePct / scale(curr) - discountCapturePct / scale(prev), isRatio: true }, spark: periods.map((p) => discountCapturePct / scale(p)), color: t.gn },
    { title: en ? 'AP Turnover' : 'Borç Devir Hızı', term: 'apTurnover', goodDir: 'up' as const, value: `${apTurnoverOf(curr).toFixed(1)}x`,
      trend: { value: apTurnoverOf(curr) - apTurnoverOf(prev), isRatio: true }, spark: periods.map(apTurnoverOf), color: t.pu },
    { title: en ? 'Invoice Processing' : 'Fatura İşleme Süresi', term: 'invoiceProcessing', goodDir: 'down' as const, value: `${(processingDays * scale(curr)).toFixed(1)} ${en ? 'd' : 'gün'}`,
      trend: { value: processingDays * scale(curr) - processingDays * scale(prev), isRatio: true }, spark: periods.map((p) => processingDays * scale(p)), color: t.am },
    { title: en ? 'On-time Payment %' : 'Zamanında Ödeme %', term: 'onTimePayment', goodDir: 'up' as const, value: `${(onTimePct / scale(curr)).toFixed(0)}%`,
      trend: { value: onTimePct / scale(curr) - onTimePct / scale(prev), isRatio: true }, spark: periods.map((p) => onTimePct / scale(p)), color: t.c1 },
    { title: en ? 'Top-5 Concentration' : 'Tedarikçi Konsantrasyon (İlk-5)', term: 'supplierConcentration', goodDir: 'down' as const, value: `${concTop5.toFixed(0)}%`,
      trend: { value: 0, isRatio: true }, spark: periods.map(() => concTop5), color: t.c2 },
    { title: en ? 'e-Doc Reconciliation %' : 'e-Belge Mutabakat %', term: 'ebelgeReconciliation', goodDir: 'up' as const, value: `${reconMatchPct.toFixed(1)}%`,
      trend: { value: 0, isRatio: true }, spark: periods.map(() => reconMatchPct), color: t.tl },
  ];

  // ── Chart 1: Borç yaşlandırma stacked-bar (tedarikçi) ──
  const agingSup = [...SUP].sort((a, b) => b.totalDebt - a.totalDebt).map((s) => ({
    name: s.supplier.split(' ')[0],
    current: conv(s.totalDebt - s.overdue), d1_30: conv(s.overdue * 0.6), d31_60: conv(s.overdue * 0.25), d61_90: conv(s.overdue * 0.10), d90plus: conv(s.overdue * 0.05),
  }));
  const AGING_SERIES = [
    { key: 'current', label: en ? 'Current' : 'Cari', color: t.gn },
    { key: 'd1_30', label: '1-30', color: t.tl },
    { key: 'd31_60', label: '31-60', color: t.am },
    { key: 'd61_90', label: '61-90', color: t.co },
    { key: 'd90plus', label: '90+', color: t.rd },
  ];

  // ── Chart 2: Ödeme takvimi (vade bazlı schedule) ──
  const schedule = apInvoices.filter((i) => i.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((i) => ({ name: `${i.supplier.split(' ')[0]}`, date: i.dueDate.slice(5), amount: conv(i.amount), status: i.status }));
  const schColor = (s: string) => (s === 'overdue' ? t.rd : s === 'approaching' ? t.am : t.pr);

  // ── Chart 3: Erken iskonto penceresi uyarı bar ──
  const discountData = apInvoices.filter((i) => i.discountWindow).map((i) => ({
    name: i.supplier.split(' ')[0], discount: conv(i.discountAmount), daysLeft: i.daysLeft, urgent: i.daysLeft <= 2,
  }));

  // ── Chart 4: DPO trend ──
  const dpoTrend = ordered.map((p) => ({ period: pl(p), dpo: dpoOf(p) }));

  // ── Chart 5: Tedarikçi ödeme Pareto (yıllık hacim) ──
  const totVol = SUP.reduce((s, x) => s + x.annualVolume, 0);
  let cum = 0;
  const pareto = [...SUP].sort((a, b) => b.annualVolume - a.annualVolume).map((s) => { cum += s.annualVolume; return { name: s.supplier.split(' ')[0], vol: conv(s.annualVolume), cumulative: (cum / totVol) * 100 }; });

  // ── Chart 6: e-Belge mutabakat donut ──
  const reconData = [
    { name: en ? 'Matched' : 'Eşleşen', value: ebelgeReconciliation.matched, color: t.gn },
    { name: en ? 'Unmatched' : 'Eşleşmeyen', value: ebelgeReconciliation.unmatched, color: t.rd },
  ];

  const statusTone = (s: string) => (s === 'overdue' ? 'red' : s === 'approaching' ? 'amber' : s === 'paid' ? 'green' : 'blue') as const;
  const statusLabel = (s: string) => s === 'overdue' ? (en ? 'Overdue' : 'Gecikmiş') : s === 'approaching' ? (en ? 'Approaching' : 'Yaklaşıyor') : s === 'paid' ? (en ? 'Paid' : 'Ödendi') : (en ? 'Upcoming' : 'Vadesi Gelmemiş');

  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Anadolu Ambalaj ₺320K invoice is 12 days overdue; supply-disruption risk — prioritize payment.'
      : 'Anadolu Ambalaj ₺320K faturası 12 gün gecikmiş; tedarik kesintisi riski, öncelikli ödeme önerilir.' },
    { severity: 'warning', text: en
      ? '3 invoices have a 2/10 discount window closing within 2 days (₺12.8K savings at risk).'
      : '3 faturada 2/10 iskonto penceresi 2 gün içinde kapanıyor (₺12.8K tasarruf kaçıyor).' },
    { severity: 'watch', text: en
      ? 'DPO rose from 38 to 52 days; cash-favorable but supplier relationships should be monitored.'
      : 'DPO 38→52 güne çıktı; nakit lehine ama tedarikçi ilişkisi izlenmeli.' },
    { severity: 'tip', text: en
      ? '7 purchase invoices do not match in e-document reconciliation; check for VAT-deduction and special-penalty risk.'
      : 'e-Belge mutabakatında 7 alış faturası sistemde eşleşmiyor; KDV indirimi ve özel usulsüzlük riski için kontrol edilmeli.' },
  ];

  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={setOrder} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 9px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 9px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const actBtn = (icon: string, title: string, onClick?: () => void) => (
    <button title={title} onClick={onClick} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', color: t.tx3, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={12} />
    </button>
  );

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin3}
      subtitle={en ? 'Accounting / VAT / reconciliation lens on payables — the operations/supply lens lives in Procurement.' : 'Borçların muhasebe / KDV / mutabakat lensi — operasyon/tedarik lensi Satın Alma’da.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Operations lens: Procurement Payables →' : 'Operasyon lensi: Satın Alma Borçluluk →', onClick: () => onSelectRep?.('satin-alma__7') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} hint={(k as { hint?: string }).hint} />
        ))}
      </KPIBand>

      {/* Row: Aging + Payment schedule */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Payables Aging by Supplier' : 'Tedarikçi Bazında Borç Yaşlandırma'}
          why={en ? 'NetSuite A/P Aging portlet + Odoo Aged Payable standard.' : 'NetSuite A/P Aging portlet + Odoo Aged Payable standardı.'}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agingSup} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {AGING_SERIES.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Payment Schedule (by due date)' : 'Ödeme Takvimi (vade bazlı)'}
          why={en ? 'NetSuite payment-scheduling + cash-flow payment-forecast pattern.' : 'NetSuite payment-scheduling + nakit-akışı ödeme-tahmini deseni.'}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={schedule} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }}
                formatter={(v: number, _n, p) => [fmtC(v), (p?.payload as { name: string })?.name]} />
              <Bar dataKey="amount" name={en ? 'Payment' : 'Ödeme'} radius={[3, 3, 0, 0]} barSize={34}>
                {schedule.map((d, i) => <Cell key={i} fill={schColor(d.status)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Discount window + DPO trend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Early-Discount Window Alerts' : 'Erken İskonto Penceresi Uyarıları'}
          why={en ? 'NetSuite/Zone & Co discount-window alert (2–5 day threshold).' : 'NetSuite/Zone & Co discount-window alert (2–5 gün eşik) deseni.'}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={discountData} margin={{ top: 6, right: 8, bottom: 0, left: -8 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }}
                formatter={(v: number, _n, p) => [`${fmtC(v)} · ${(p?.payload as { daysLeft: number })?.daysLeft}${en ? 'd left' : ' gün kaldı'}`, en ? 'Discount' : 'İskonto']} />
              <Bar dataKey="discount" name={en ? 'Discount' : 'İskonto'} radius={[0, 3, 3, 0]} barSize={22}>
                {discountData.map((d, i) => <Cell key={i} fill={d.urgent ? t.rd : t.gn} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title="DPO Trend"
          why={en ? 'Zone & Co DPO-trend pattern.' : 'Zone & Co DPO trend deseni.'}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dpoTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v.toFixed(0)} ${en ? 'days' : 'gün'}`} />
              <Line type="monotone" dataKey="dpo" name="DPO" stroke={t.pr} strokeWidth={2.5} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Supplier Pareto + Reconciliation donut */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={62} title={en ? 'Supplier Payment Pareto' : 'Tedarikçi Ödeme Pareto'}
          why={en ? 'NetSuite "Top Vendors" pattern.' : 'NetSuite "Top Vendors" deseni.'}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={pareto} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'cumulative' ? `${v.toFixed(0)}%` : fmtC(v))} />
              <Bar yAxisId="l" dataKey="vol" name={en ? 'Annual Volume' : 'Yıllık Hacim'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={30} />
              <Line yAxisId="r" type="monotone" dataKey="cumulative" name={en ? 'Cumulative' : 'Kümülatif'} stroke={t.am} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={34} title={en ? 'e-Document Reconciliation' : 'e-Belge Mutabakatı'}
          why={en ? 'Paraşüt invoice-reconciliation pattern. Note: Ba/Bs forms abolished (565 VUK Comm., Sept 2024); matching relies on e-doc cross-check.' : 'Paraşüt fatura mutabakatı deseni. Not: Form Ba/Bs 565 no.lu VUK Tebliği ile Eylül 2024’te kaldırıldı; mutabakat e-belge çapraz kontrolüne dayanır.'}>
          <div style={{ position: 'relative', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reconData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={2}>
                  {reconData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v} ${en ? 'docs' : 'belge'}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.tx }}>{reconMatchPct.toFixed(1)}%</div>
              <div style={{ fontSize: 10.5, color: t.tx3 }}>{en ? 'matched' : 'eşleşen'}</div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tablo 1: Ödenecek Faturalar */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'Invoices Payable' : 'Ödenecek Faturalar'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Supplier' : 'Tedarikçi'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Invoice No' : 'Fatura No'}</th>
                <th style={th}>{en ? 'Amount' : 'Tutar'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Due' : 'Vade'}</th>
                <th style={th}>{en ? 'Days Left' : 'Kalan Gün'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Discount Window' : 'İskonto Penceresi'}</th>
                <th style={th}>{en ? 'Discount' : 'İskonto'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Actions' : 'Aksiyon'}</th>
              </tr>
            </thead>
            <tbody>
              {[...apInvoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((i) => (
                <tr key={i.invoiceNo}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{i.supplier}</td>
                  <td style={{ ...td, textAlign: 'left', color: t.tx3, fontSize: 11 }}>{i.invoiceNo}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(i.amount))}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11.5 }}>{i.dueDate}</td>
                  <td style={{ ...td, color: i.daysLeft < 0 ? t.rd : i.daysLeft <= 2 ? t.am : t.tx }}>{i.status === 'paid' ? '—' : i.daysLeft}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2, fontSize: 11 }}>{i.discountWindow ?? '—'}</td>
                  <td style={{ ...td, color: i.discountAmount ? t.gn : t.tx3 }}>{i.discountAmount ? fmtC(conv(i.discountAmount)) : '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={statusTone(i.status)} label={statusLabel(i.status)} /></td>
                  <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      {actBtn('calendar', en ? 'Schedule payment' : 'Ödeme planla')}
                      {actBtn('check', en ? '3-way match (PO/GRN/invoice)' : '3’lü eşleştirme (PO/irsaliye/fatura)')}
                      {actBtn('shoppingBag', en ? 'Supplier card' : 'Tedarikçi kartı', () => onSelectRep?.('satin-alma__1'))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablo 2: Tedarikçi Bakiye Özeti */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? 'Supplier Balance Summary' : 'Tedarikçi Bakiye Özeti'}
          <InfoTip t={t} lang={lang} termKey="ebelgeReconciliation" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Supplier' : 'Tedarikçi'}</th>
                <th style={th}>{en ? 'Total Debt' : 'Toplam Borç'}</th>
                <th style={th}>{en ? 'Overdue' : 'Vadesi Geçmiş'}</th>
                <th style={th}>{en ? 'Avg Pay Days' : 'Ort. Ödeme Günü'}</th>
                <th style={th}>{en ? 'Annual Volume' : 'Yıllık Hacim'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'e-Doc Match' : 'e-Belge Uyumu'}</th>
              </tr>
            </thead>
            <tbody>
              {[...SUP].sort((a, b) => b.totalDebt - a.totalDebt).map((s) => (
                <tr key={s.supplier}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{s.supplier}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtC(conv(s.totalDebt))}</td>
                  <td style={{ ...td, color: s.overdue ? t.rd : t.tx3 }}>{s.overdue ? fmtC(conv(s.overdue)) : '—'}</td>
                  <td style={{ ...td, color: t.tx2 }}>{s.avgPayDays} {en ? 'd' : 'gün'}</td>
                  <td style={{ ...td, color: t.tx2 }}>{fmtC(conv(s.annualVolume))}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <StatusBadge t={t} dot={false} tone={s.ebelgeMatch >= 97 ? 'green' : s.ebelgeMatch >= 90 ? 'amber' : 'red'} label={`${s.ebelgeMatch}%`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '8px 16px', borderTop: `1px solid ${t.bd}` }}>
          {en ? 'Same data, two lenses: this page = accounting/VAT/reconciliation; Procurement = operations/supply.' : 'Aynı veri, iki lens: bu sayfa = muhasebe/KDV/mutabakat; Satın Alma = operasyon/tedarik.'}
          <span style={{ color: t.pr, fontWeight: 600, cursor: 'pointer', marginLeft: 6 }} onClick={() => onSelectRep?.('satin-alma__7')}>{en ? 'Procurement Payables →' : 'Satın Alma Borçluluk →'}</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} />
      </div>
    </ReportPageLayout>
  );
};
