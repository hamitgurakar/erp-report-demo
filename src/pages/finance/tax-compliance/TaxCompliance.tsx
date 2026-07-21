import { useState, type CSSProperties } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FinancialPeriod, FinCurrency, PeriodType, OrderMode } from '../../../types/finance';
import { PERIODS_ANNUAL, PERIODS_QUARTER, incomeRaw } from '../../../constants/financeData';
import { taxCalendar2026, ebelgeStatus } from '../../../constants/financeReportsData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, InfoTip,
  StatusBadge, Dropdown, GaugeCard, type FinAlert,
} from '../../../components/finance';
import type { FinancePageProps } from '../_Placeholder';

const effTaxOf = (p: FinancialPeriod) => {
  const v = incomeRaw[p.id];
  const gross = (v.revenue ?? 0) + (v.cogs ?? 0);
  const ebit = gross + (v.marketingSales ?? 0) + (v.generalAdmin ?? 0) + (v.rnd ?? 0);
  const pretax = ebit + (v.nonOp ?? 0) + (v.interestIncome ?? 0) + (v.interestExpense ?? 0);
  return pretax ? (-(v.tax ?? 0) / pretax) * 100 : 0;
};

// Uyum skoru + yaklaşan yükümlülük (seed takviminden)
const notLate = taxCalendar2026.filter((d) => d.status !== 'late').length;
const ebActive = ebelgeStatus.filter((e) => e.status !== 'pending').length;
const complianceScore = Math.round((notLate / taxCalendar2026.length) * 60 + (ebActive / ebelgeStatus.length) * 40);
const upcoming30 = taxCalendar2026.filter((d) => d.status === 'approaching').length;

export const TaxCompliance = ({ t, l, lang, onSelectRep }: FinancePageProps) => {
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
  const revScale = (p: FinancialPeriod) => (incomeRaw[p.id].revenue ?? 0) / (incomeRaw[curr.id].revenue ?? 1);

  // Seed 2026 yükümlülükleri
  const kdvNet = taxCalendar2026.find((d) => d.declaration.tr.startsWith('KDV') && d.status === 'approaching')?.amount ?? 780_000;
  const provisional = taxCalendar2026.find((d) => d.declaration.tr.startsWith('Geçici'))?.amount ?? 1_240_000;
  const muhsgk = taxCalendar2026.find((d) => d.declaration.tr.startsWith('Muhtasar'))?.amount ?? 410_000;
  const sgk = taxCalendar2026.find((d) => d.declaration.tr.startsWith('SGK'))?.amount ?? 520_000;
  const carryVat = Math.round((incomeRaw[curr.id].revenue ?? 0) * 0.006);

  const eff = effTaxOf(curr);
  const kpis = [
    { title: en ? 'Net VAT Payable' : 'Net KDV', term: 'netVAT', goodDir: 'down' as const, value: fmtC(conv(kdvNet)),
      trend: { value: 0, isRatio: false }, spark: periods.map((p) => conv(kdvNet * revScale(p), p)), color: t.pr },
    { title: en ? 'Carried VAT (190)' : 'Devreden KDV (190)', term: 'carryVAT', goodDir: 'up' as const, value: fmtC(conv(carryVat)),
      trend: { value: 0, isRatio: false }, spark: periods.map((p) => conv(carryVat * revScale(p), p)), color: t.tl },
    { title: en ? 'Effective Tax Rate' : 'Efektif Vergi %', term: 'effectiveTax', goodDir: 'down' as const, value: `${eff.toFixed(1)}%`,
      trend: { value: eff - effTaxOf(prev), isRatio: true }, spark: periods.map(effTaxOf), color: t.am },
    { title: en ? 'Provisional/Corp. Tax' : 'Kurumlar/Geçici Tahakkuk', term: 'provisionalTax', goodDir: 'down' as const, value: fmtC(conv(provisional)),
      trend: { value: 0, isRatio: false }, spark: periods.map((p) => conv(provisional * revScale(p), p)), color: t.co },
    { title: en ? 'Withholding (MUHSGK)' : 'Stopaj (MUHSGK)', term: 'withholdingMuhsgk', goodDir: 'down' as const, value: fmtC(conv(muhsgk)),
      trend: { value: 0, isRatio: false }, spark: periods.map((p) => conv(muhsgk * revScale(p), p)), color: t.pu },
    { title: en ? 'Social Security' : 'SGK Primi', term: 'sgkPremium', goodDir: 'down' as const, value: fmtC(conv(sgk)),
      trend: { value: 0, isRatio: false }, spark: periods.map((p) => conv(sgk * revScale(p), p)), color: t.c1 },
    { title: en ? 'Compliance Score' : 'Uyum Skoru', term: 'complianceScore', goodDir: 'up' as const, value: `${complianceScore}/100`,
      trend: { value: 0, isRatio: true }, spark: periods.map(() => complianceScore), color: t.gn },
    { title: en ? 'Upcoming (30d)' : 'Yaklaşan (30g)', term: 'upcomingObligations', goodDir: 'down' as const, value: `${upcoming30}`,
      trend: { value: 0, isRatio: true }, spark: periods.map(() => upcoming30), color: t.c2 },
  ];

  // ── Chart 2: KDV trend bar (Hesaplanan/İndirilecek/Net) ──
  const kdvTrend = ordered.map((p) => {
    const rev = incomeRaw[p.id].revenue ?? 0;
    const hesap = rev * 0.20;
    const indir = (Math.abs(incomeRaw[p.id].cogs ?? 0) + Math.abs(incomeRaw[p.id].marketingSales ?? 0)) * 0.20;
    return { period: pl(p), hesap: conv(hesap, p), indir: conv(indir, p), net: conv(hesap - indir, p) };
  });

  // ── Chart 3: Vergi yükü stacked-area ──
  const burden = ordered.map((p) => {
    const rev = incomeRaw[p.id].revenue ?? 0;
    return {
      period: pl(p),
      kdv: conv(rev * 0.02, p), kurumlar: conv(Math.max(0, -(incomeRaw[p.id].tax ?? 0)), p), gecici: conv(rev * 0.012, p),
      stopaj: conv(rev * 0.006, p), sgk: conv(rev * 0.02, p), damga: conv(rev * 0.001, p),
    };
  });
  const BURDEN_SERIES = [
    { key: 'kdv', label: en ? 'VAT' : 'KDV', color: t.pr },
    { key: 'kurumlar', label: en ? 'Corp.' : 'Kurumlar', color: t.tl },
    { key: 'gecici', label: en ? 'Provisional' : 'Geçici', color: t.am },
    { key: 'stopaj', label: en ? 'Withholding' : 'Stopaj', color: t.pu },
    { key: 'sgk', label: 'SGK', color: t.c1 },
    { key: 'damga', label: en ? 'Stamp' : 'Damga', color: t.co },
  ];

  const calSorted = [...taxCalendar2026].sort((a, b) => a.fileBy.localeCompare(b.fileBy));
  const statusTone = (s: string) => (s === 'late' ? 'red' : s === 'approaching' ? 'amber' : 'green') as const;
  const statusLabel = (s: string) => s === 'late' ? (en ? 'Late' : 'Gecikti') : s === 'approaching' ? (en ? 'Approaching' : 'Yaklaşıyor') : (en ? 'Filed' : 'Verildi');
  const statusIcon = (s: string) => s === 'late' ? '🔴' : s === 'approaching' ? '🟠' : '✅';

  // ── Chart 6: Beyanname uyum timeline (gün-until bar) ──
  const REF = new Date(2026, 6, 19); // 2026-07-19 (demo referans)
  const timeline = calSorted.map((d) => {
    const dl = Math.round((new Date(d.fileBy).getTime() - REF.getTime()) / 86_400_000);
    return { name: d.declaration[en ? 'en' : 'tr'], days: dl, status: d.status };
  });

  const eStatusTone = (s: string) => (s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'blue') as const;
  const eStatusLabel = (s: string) => s === 'active' ? (en ? 'Active' : 'Aktif') : s === 'pending' ? (en ? 'Pending' : 'Bekliyor') : (en ? 'Exempt' : 'Muaf');

  const alerts: FinAlert[] = [
    { severity: 'critical', text: en
      ? 'Provisional Tax Q1 is due 18 May (17 May is Sunday); accrual ₺1.2M and cash looks short — pull collections forward.'
      : 'Geçici Vergi Q1 beyanı 18 Mayıs’ta (17 Mayıs Pazar); tahakkuk ₺1.2M ve nakit yetersiz görünüyor. Vadesi gelen tahsilatlar öne çekilmeli.',
      linkLabel: en ? 'Cash' : 'Nakit', onLink: () => onSelectRep?.('muhasebe__1') },
    { severity: 'warning', text: en
      ? 'e-Ledger April berat upload is due 14 August; not yet generated — first-degree penalty risk.'
      : 'e-Defter Nisan berat yükleme son tarihi 14 Ağustos; henüz oluşturulmadı — 1. derece usulsüzlük cezası riski.' },
    { severity: 'watch', text: en
      ? 'Your effective tax rate is 31%; above the statutory 25% — review non-deductible (KKEG) items.'
      : 'Efektif vergi oranınız %31; yasal %25’in üstünde — KKEG kalemleri gözden geçirilmeli.' },
    { severity: 'tip', text: en
      ? '2025 turnover exceeded the e-Waybill ₺10M threshold; migration is mandatory by 1 July 2026.'
      : '2025 cironuz e-İrsaliye 10M TL eşiğini aştı; 1 Temmuz 2026’ya kadar geçiş zorunlu.' },
  ];

  const controls = (
    <>
      <Dropdown label={en ? 'Period' : 'Dönem'} value={donem} onChange={setDonem} t={t} width={120}
        options={[{ value: 'annual', label: en ? 'Annual' : 'Yıllık' }, { value: 'quarter', label: en ? 'Quarterly' : 'Çeyreklik' }]} />
      <Dropdown label={en ? 'Order' : 'Sıralama'} value={order} onChange={setOrder} t={t} width={140}
        options={[{ value: 'newestRight', label: en ? 'Newest right' : 'En yeni sağda' }, { value: 'newestLeft', label: en ? 'Newest left' : 'En yeni solda' }]} />
    </>
  );

  const th: CSSProperties = { fontSize: 11, fontWeight: 600, color: t.tx3, textAlign: 'right', padding: '8px 10px', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
  const td: CSSProperties = { fontSize: 12, color: t.tx, textAlign: 'right', padding: '8px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={l.mhFin4}
      subtitle={en ? 'Turkey 2026 tax calendar, VAT, e-document status and compliance — the single tax authority in the suite.' : 'Türkiye 2026 vergi takvimi, KDV, e-belge statü ve uyum — suite’in tek vergi otoritesi.'}
      controls={controls} currency={currency} onCurrency={setCurrency}
      crossLink={{ label: en ? 'Source: Financial Data grid →' : 'Kaynak: Finansal Veriler grid →', onClick: () => onSelectRep?.('yonetim__4') }}
    >
      <KPIBand>
        {kpis.map((k) => (
          <KPICard key={k.title} t={t} lang={lang} title={k.title} value={k.value} trend={k.trend}
            goodDir={k.goodDir} spark={k.spark} sparkColor={k.color} infoTermKey={k.term} />
        ))}
      </KPIBand>

      {/* Chart 1: Vergi Takvimi kartları */}
      <ChartCard t={t} lang={lang} title={en ? 'Tax Calendar 2026' : 'Vergi Takvimi 2026'}
        why={en ? 'GİB / kdvhesaplama.org calendar-card pattern with weekend/holiday shift notes.' : 'GİB / kdvhesaplama.org Vergi Takvimi kart deseni; hafta sonu/tatil kaydırma notlarıyla.'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginTop: 4 }}>
          {calSorted.map((d, i) => {
            const tone = statusTone(d.status);
            const c = tone === 'red' ? t.rd : tone === 'amber' ? t.am : t.gn;
            return (
              <div key={i} style={{ border: `1px solid ${t.bd}`, borderLeft: `3px solid ${c}`, borderRadius: 8, padding: '10px 12px', background: t.bg2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: t.tx }}>{d.declaration[en ? 'en' : 'tr']}</span>
                  <span style={{ fontSize: 13 }}>{statusIcon(d.status)}</span>
                </div>
                <div style={{ fontSize: 11, color: t.tx3 }}>{d.period}</div>
                <div style={{ fontSize: 11.5, color: t.tx2, marginTop: 4 }}>{en ? 'File' : 'Beyan'}: <b>{d.fileBy}</b></div>
                {d.amount > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: t.tx, marginTop: 4 }}>{fmtC(conv(d.amount))}</div>}
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Row: KDV trend + Vergi yükü */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'VAT Trend (Output / Input / Net)' : 'KDV Trend (Hesaplanan / İndirilecek / Net)'}
          why={en ? 'Paraşüt VAT-report pattern.' : 'Paraşüt KDV raporu deseni.'}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={kdvTrend} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hesap" name={en ? 'Output' : 'Hesaplanan'} fill={t.pr} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="indir" name={en ? 'Input' : 'İndirilecek'} fill={t.tl} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="net" name={en ? 'Net' : 'Net'} fill={t.am} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={48} title={en ? 'Tax Burden Mix' : 'Vergi Yükü Dağılımı'}
          why={en ? 'CFO tax-burden mix pattern (VAT/Corp/Provisional/Withholding/SSI/Stamp over time).' : 'CFO tax-burden mix deseni (KDV/Kurumlar/Geçici/Stopaj/SGK/Damga zaman içinde).'}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={burden} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => fmtC(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {BURDEN_SERIES.map((s) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stackId="1" stroke={s.color} fill={s.color} fillOpacity={0.55} strokeWidth={1.5} />)}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: e-Dönüşüm panosu + Efektif vergi gauge */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={62} title={en ? 'e-Transformation Status' : 'e-Dönüşüm Durum Panosu'}
          why={en ? 'QNB eSolutions/GİB e-document status pattern.' : 'QNB eSolutions/GİB e-belge statü deseni.'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 4 }}>
            {ebelgeStatus.map((e, i) => {
              const tone = eStatusTone(e.status);
              const c = tone === 'green' ? t.gn : tone === 'amber' ? t.am : t.pr;
              return (
                <div key={i} style={{ border: `1px solid ${t.bd}`, borderRadius: 8, padding: '11px 12px', background: t.bg2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: t.tx }}>{e.app[en ? 'en' : 'tr']}</span>
                  </div>
                  <StatusBadge t={t} dot={false} tone={tone} label={eStatusLabel(e.status)} />
                  <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 6 }}>{en ? 'Threshold' : 'Eşik'}: {e.threshold}</div>
                </div>
              );
            })}
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={34} title={en ? 'Effective Tax Rate (vs 25%)' : 'Efektif Vergi Oranı (vs %25)'}
          why={en ? 'Fintables effective-tax-rate pattern; green up to the statutory 25%.' : 'Fintables efektif vergi trend deseni; yasal %25’e kadar yeşil.'}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}>
            <GaugeCard t={t} value={eff} min={0} max={50} format={(v) => `${v.toFixed(1)}%`} label={en ? 'vs 25% legal' : 'vs %25 yasal'}
              thresholds={[{ limit: 25, color: t.gn }, { limit: 50, color: t.am }]} />
          </div>
        </ChartCard>
      </div>

      {/* Chart 6: Beyanname uyum timeline */}
      <div style={{ marginTop: 14 }}>
        <ChartCard t={t} lang={lang} title={en ? 'Filing Compliance Timeline (days to deadline)' : 'Beyanname Uyum Timeline (son tarihe gün)'}
          why={en ? 'Compliance-calendar audit pattern; negative = overdue.' : 'compliance-calendar audit deseni; negatif = gecikmiş.'}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeline} layout="vertical" margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${en ? 'd' : 'g'}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => `${v} ${en ? 'days' : 'gün'}`} />
              <Bar dataKey="days" name={en ? 'Days to deadline' : 'Son tarihe gün'} radius={[0, 3, 3, 0]} barSize={16} fill={t.pr} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablo 1: 2026 Vergi/Beyanname Takvimi */}
      <div style={{ marginTop: 22, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center' }}>
          {en ? '2026 Tax / Filing Calendar' : '2026 Vergi / Beyanname Takvimi'}
          <InfoTip t={t} lang={lang} termKey="eDefter" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Declaration' : 'Beyanname'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Period' : 'Dönem'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'File By' : 'Son Beyan'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Pay By' : 'Son Ödeme'}</th>
                <th style={th}>{en ? 'Amount' : 'Tutar'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Durum'}</th>
              </tr>
            </thead>
            <tbody>
              {calSorted.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{d.declaration[en ? 'en' : 'tr']}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{d.period}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{d.fileBy}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{d.payBy}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{d.amount > 0 ? fmtC(conv(d.amount)) : '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={statusTone(d.status)} label={statusLabel(d.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: t.tx3, padding: '9px 16px', borderTop: `1px solid ${t.bd}`, lineHeight: 1.5 }}>
          {en
            ? 'Q4 provisional tax (17 Feb 2027) reinstated by Law 7566. e-Ledger berat: 14th of the 4th month after. SGK: last day of the following month. Ba/Bs forms abolished (565 VUK Comm., Sept 2024). Demo — dates are subject to weekend/holiday shift (VUK art.18) and GİB extension circulars; confirm each period on the GİB Tax Calendar.'
            : 'Q4 geçici vergi (17 Şub 2027) 7566 sayılı Kanun ile yeniden yürürlükte. e-Defter berat: izleyen 4. ayın 14’ü. SGK: izleyen ayın son günü. Ba/Bs formları kaldırıldı (565 no.lu VUK Tebliği, Eylül 2024). Demo — tarihler hafta sonu/tatil kaydırması (VUK md.18) ve GİB süre uzatımı sirkülerlerine tabidir; her dönem GİB Vergi Takvimi’nden teyit edilmelidir.'}
        </div>
      </div>

      {/* Tablo 2: e-Belge Statü */}
      <div style={{ marginTop: 16, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>
          {en ? 'e-Document Status' : 'e-Belge Statü'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Application' : 'Uygulama'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Status' : 'Statü'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Migrated' : 'Geçiş Tarihi'}</th>
                <th style={{ ...th, textAlign: 'left' }}>{en ? 'Turnover Threshold' : 'Ciro Eşiği'}</th>
                <th style={{ ...th, textAlign: 'center' }}>{en ? 'Last Action' : 'Son İşlem'}</th>
              </tr>
            </thead>
            <tbody>
              {ebelgeStatus.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500 }}>{e.app[en ? 'en' : 'tr']}</td>
                  <td style={{ ...td, textAlign: 'center' }}><StatusBadge t={t} tone={eStatusTone(e.status)} label={eStatusLabel(e.status)} /></td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{e.migratedOn}</td>
                  <td style={{ ...td, textAlign: 'left', color: t.tx2, fontSize: 11.5 }}>{e.threshold}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx3, fontSize: 11 }}>{e.lastAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} />
      </div>
    </ReportPageLayout>
  );
};
