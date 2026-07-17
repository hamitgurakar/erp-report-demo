import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend, Cell, ReferenceLine,
  LineChart,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { Icon } from '../ui/Icon';
import { fmtMonth } from '../../utils/format';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Types ───────────────────────────────────────────────────────────────────────

interface Rep {
  id: string;
  name: string;
  short: string;
  ciro: number;
  netKar: number;
  siparis: number;
  aov: number;
  kazanilan: number;
  winRate: number;
  aktivite: number;
  hedefPct: number;
  hedef: number;
  color: string;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const REPS: Rep[] = [
  { id: 'ayse', name: 'Ayşe Kara', short: 'Ayşe K.', ciro: 1820000, netKar: 492000, siparis: 84, aov: 21666, kazanilan: 28, winRate: 32.4, aktivite: 8.2, hedefPct: 112, hedef: 1625000, color: '#16A34A' },
  { id: 'mehmet', name: 'Mehmet Demir', short: 'Mehmet D.', ciro: 1540000, netKar: 398000, siparis: 72, aov: 21388, kazanilan: 22, winRate: 28.6, aktivite: 7.4, hedefPct: 96, hedef: 1604000, color: '#3B82F6' },
  { id: 'can', name: 'Can Yılmaz', short: 'Can Y.', ciro: 1280000, netKar: 332000, siparis: 58, aov: 22068, kazanilan: 18, winRate: 24.1, aktivite: 6.8, hedefPct: 82, hedef: 1560000, color: '#D97706' },
  { id: 'elif', name: 'Elif Sarı', short: 'Elif S.', ciro: 1438908, netKar: 378000, siparis: 65, aov: 22137, kazanilan: 20, winRate: 26.3, aktivite: 7.1, hedefPct: 91, hedef: 1581000, color: '#7C3AED' },
  { id: 'burak', name: 'Burak Aydın', short: 'Burak A.', ciro: 890000, netKar: 218000, siparis: 42, aov: 21190, kazanilan: 12, winRate: 18.5, aktivite: 5.2, hedefPct: 58, hedef: 1534000, color: '#DC2626' },
];

const ciroBarData = REPS.map((r) => ({
  name: r.short,
  ciro: Math.round(r.ciro / 1000),
  brutKar: Math.round(r.ciro * 0.27 / 1000),
  netKar: Math.round(r.netKar / 1000),
  hedef: Math.round(r.hedef / 1000),
}));

const marjBarData = [
  { name: 'Ayşe K.', brutMarj: 27.0, netMarj: 27.0 },
  { name: 'Mehmet D.', brutMarj: 25.8, netMarj: 25.8 },
  { name: 'Can Y.', brutMarj: 25.9, netMarj: 26.0 },
  { name: 'Elif S.', brutMarj: 26.8, netMarj: 26.9 },
  { name: 'Burak A.', brutMarj: 24.7, netMarj: 24.7 },
];

const quarterlyData = [
  { q: 'Q1 24', ayse: 980, mehmet: 820, can: 680, elif: 740, burak: 480, netMarj: 14.2 },
  { q: 'Q2 24', ayse: 1050, mehmet: 880, can: 720, elif: 790, burak: 510, netMarj: 15.1 },
  { q: 'Q3 24', ayse: 1120, mehmet: 920, can: 760, elif: 830, burak: 540, netMarj: 15.8 },
  { q: 'Q4 24', ayse: 1200, mehmet: 980, can: 810, elif: 880, burak: 570, netMarj: 16.3 },
  { q: 'Q1 25', ayse: 1350, mehmet: 1050, can: 870, elif: 950, burak: 610, netMarj: 16.8 },
  { q: 'Q2 25', ayse: 1480, mehmet: 1120, can: 920, elif: 1010, burak: 650, netMarj: 17.0 },
  { q: 'Q3 25', ayse: 1620, mehmet: 1240, can: 980, elif: 1080, burak: 710, netMarj: 17.1 },
];

const STACK_COLORS = { burak: '#38BDF8', can: '#F59E0B', elif: '#F472B6', mehmet: '#34D399', ayse: '#818CF8' };
const STACK_ORDER = ['burak', 'can', 'elif', 'mehmet', 'ayse'] as const;
const STACK_LABELS: Record<string, string> = { ayse: 'Ayşe K.', mehmet: 'Mehmet D.', can: 'Can Y.', elif: 'Elif S.', burak: 'Burak A.' };

const winRateTrend = [
  { month: 'Mar', ayse: 30, mehmet: 26, can: 22, elif: 24, burak: 16 },
  { month: 'Nis', ayse: 31, mehmet: 27, can: 23, elif: 25, burak: 17 },
  { month: 'May', ayse: 32, mehmet: 28, can: 22, elif: 26, burak: 18 },
  { month: 'Haz', ayse: 31, mehmet: 29, can: 24, elif: 25, burak: 17 },
  { month: 'Tem', ayse: 33, mehmet: 28, can: 25, elif: 27, burak: 19 },
  { month: 'Ağu', ayse: 32, mehmet: 29, can: 24, elif: 26, burak: 18 },
];

const topFirmalar = [
  { firma: 'Koç Holding', proje: 8, ciro: 624, netKar: 168, marj: 26.9, uzman: 'Ayşe K.' },
  { firma: 'Arçelik A.Ş.', proje: 6, ciro: 518, netKar: 145, marj: 28.0, uzman: 'Mehmet D.' },
  { firma: 'Turkcell İletişim', proje: 5, ciro: 472, netKar: 122, marj: 25.8, uzman: 'Elif S.' },
  { firma: 'Sabancı Holding', proje: 4, ciro: 398, netKar: 110, marj: 27.6, uzman: 'Can Y.' },
  { firma: 'THY Genel Müdürlük', proje: 7, ciro: 367, netKar: 98, marj: 26.7, uzman: 'Ayşe K.' },
  { firma: 'Eczacıbaşı Holding', proje: 3, ciro: 312, netKar: 84, marj: 26.9, uzman: 'Can Y.' },
  { firma: 'Garanti BBVA', proje: 5, ciro: 298, netKar: 78, marj: 26.2, uzman: 'Mehmet D.' },
  { firma: 'Doğuş Otomotiv', proje: 4, ciro: 256, netKar: 68, marj: 26.6, uzman: 'Burak A.' },
  { firma: 'Vestel Elektronik', proje: 3, ciro: 234, netKar: 62, marj: 26.5, uzman: 'Elif S.' },
  { firma: 'Pegasus Hava Yolları', proje: 6, ciro: 198, netKar: 52, marj: 26.3, uzman: 'Ayşe K.' },
  { firma: 'Hepsiburada', proje: 2, ciro: 178, netKar: 48, marj: 27.0, uzman: 'Can Y.' },
  { firma: 'İş Bankası', proje: 3, ciro: 165, netKar: 44, marj: 26.7, uzman: 'Mehmet D.' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000
      ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const hedefBg = (pct: number, t: Theme) =>
  pct >= 100 ? t.gnL : pct >= 80 ? '#F0FDF4' : pct >= 60 ? t.amL : '#FEF2F2';

const hedefBarColor = (pct: number, t: Theme) =>
  pct >= 100 ? t.gn : pct >= 80 ? '#22C55E' : pct >= 60 ? t.am : t.rd;

const marjColor = (v: number, t: Theme) => v >= 27 ? t.gn : v >= 25 ? t.am : t.rd;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesRepPerformance = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tableSort, setTableSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'ciro', dir: 'desc' });
  const [firmaSort, setFirmaSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'ciro', dir: 'desc' });
  const [ciroMode, setCiroMode] = useState<'TL' | '%'>('TL');

  const handleTableSort = (key: string) => {
    setTableSort((prev) => prev.key === key && prev.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const handleFirmaSort = (key: string) => {
    setFirmaSort((prev) => prev.key === key && prev.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const sortedReps = [...REPS].sort((a, b) => {
    const av = (a as Record<string, unknown>)[tableSort.key] as number;
    const bv = (b as Record<string, unknown>)[tableSort.key] as number;
    return tableSort.dir === 'asc' ? av - bv : bv - av;
  });

  const sortedFirmalar = [...topFirmalar].sort((a, b) => {
    const av = (a as Record<string, unknown>)[firmaSort.key];
    const bv = (b as Record<string, unknown>)[firmaSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return firmaSort.dir === 'asc' ? av - bv : bv - av;
    return firmaSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const selectedLabel = selectedRep === 'all'
    ? (lang === 'tr' ? 'Tüm Ekip' : 'All Team')
    : REPS.find((r) => r.id === selectedRep)?.name ?? '';

  // Hedef progress bar
  const hedefBar = (pct: number) => {
    const clampedWidth = Math.min(pct, 120);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 8, background: t.bg2, borderRadius: 4, overflow: 'hidden', minWidth: 60, position: 'relative' }}>
          {/* 100% marker */}
          <div style={{ position: 'absolute', left: `${(100 / 120) * 100}%`, top: 0, bottom: 0, width: 1, background: t.tx3, opacity: 0.4 }} />
          <div style={{ height: '100%', width: `${(clampedWidth / 120) * 100}%`, background: hedefBarColor(pct, t), borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: hedefBarColor(pct, t), width: 32, textAlign: 'right' }}>%{pct}</span>
      </div>
    );
  };

  const SortIcon = ({ colKey, sortState }: { colKey: string; sortState: { key: string; dir: 'asc' | 'desc' } }) => (
    <Icon
      name={sortState.key === colKey ? (sortState.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'}
      size={10}
      color={sortState.key === colKey ? t.pr : t.tx3}
    />
  );

  return (
    <>
      {/* ── Uzman Seçici ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
        <span style={{ fontSize: 12, color: t.tx2 }}>{lang === 'tr' ? 'Satış Uzmanı:' : 'Sales Rep:'}</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${t.bd}`, background: t.cd, color: t.tx, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', minWidth: 160,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedLabel}</span>
            <Icon name="chevDown" size={12} color={t.tx3} />
          </button>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 200, overflow: 'hidden' }}>
              {[{ id: 'all', name: lang === 'tr' ? 'Tüm Ekip' : 'All Team' }, ...REPS].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSelectedRep(opt.id); setDropdownOpen(false); }}
                  style={{
                    padding: '8px 14px', fontSize: 12, cursor: 'pointer',
                    color: selectedRep === opt.id ? t.pr : t.tx,
                    background: selectedRep === opt.id ? t.prL : 'transparent',
                    fontWeight: selectedRep === opt.id ? 600 : 400,
                  }}
                  onMouseOver={(e) => { if (selectedRep !== opt.id) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={(e) => { if (selectedRep !== opt.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRep !== 'all' ? (
        /* ── BİREYSEL UZMAN PLACEHOLDER ──────────────────────────────────────── */
        <div style={{
          background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 12, padding: '40px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.prL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={24} color={t.pr} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.tx }}>{REPS.find((r) => r.id === selectedRep)?.name}</div>
          <div style={{ fontSize: 13, color: t.tx2, maxWidth: 400, lineHeight: 1.6 }}>
            {lang === 'tr'
              ? 'Uzman seçildiğinde detaylı profil görünümü burada gösterilecek. Bireysel KPI\'lar, deal bazlı performans, aktivite timeline ve coaching önerileri yer alacak.'
              : 'Detailed profile view will be displayed here when a rep is selected. Individual KPIs, deal-level performance, activity timeline and coaching recommendations.'}
          </div>
          <button
            onClick={() => setSelectedRep('all')}
            style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, border: 'none', background: t.pr, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            {lang === 'tr' ? '← Ekip Görünümüne Dön' : '← Back to Team View'}
          </button>
        </div>
      ) : (
        <>
          {/* ── Section 1: EKİP GENEL METRİKLERİ ────────────────────────────── */}
          <SectionHeader title={l.repEkipMetrik ?? 'EKİP GENEL METRİKLERİ'} t={t} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            <KPICard id="rep-toplam-ciro" title={l.repToplamCiro ?? 'Toplam Ekip Cirosu'} value="6.968.908 ₺" trendValue="+12,5%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
            <KPICard id="rep-ort-ciro" title={l.repOrtCiro ?? 'Ort. Uzman Başı Ciro'} value="1.393.781 ₺" trendValue="+8,2%" sparkTrend="up" color="tl" unit="K ₺" big {...kp} />
            <KPICard id="rep-en-yuksek" title={l.repEnYuksek ?? 'En Yüksek Performans'} value="Ayşe Kara — 1.820K ₺" trendValue="%112 hedefe ulaşım" sparkTrend="up" color="gn" unit="₺" big {...kp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            <KPICard id="rep-en-dusuk" title={l.repEnDusuk ?? 'En Düşük Performans'} value="Burak Aydın — 890K ₺" trendValue="%58 hedefe ulaşım" sparkTrend="down" color="rd" unit="₺" {...kp} />
            <KPICard id="rep-winrate" title={l.repEkipWinRate ?? 'Ekip Win Rate'} value="%24,2" trendValue="+1,5pp" sparkTrend="up" color="gn" unit="%" {...kp} />
            <KPICard id="rep-aktivite" title={l.repAktiviteSkoru ?? 'Ort. Aktivite Skoru'} value="6,8/10" trendValue="+0,4" sparkTrend="up" color="tl" unit="" {...kp} />
          </div>

          {/* ── Section 2: EKİP KARŞILAŞTIRMA TABLOSU ────────────────────────── */}
          <SectionHeader title={l.repKarsilastirma ?? 'EKİP KARŞILAŞTIRMA TABLOSU'} t={t} />

          <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.repKarsilastirmaTablo ?? 'Satış Uzmanı Performans Karşılaştırma'}</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
                <Icon name="download" size={12} color={t.tx3} />
                Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                    {[
                      { key: 'name', label: 'Uzman Adı', align: 'left' },
                      { key: 'ciro', label: 'Toplam Ciro', align: 'right' },
                      { key: 'netKar', label: 'Net Kâr', align: 'right' },
                      { key: 'siparis', label: 'Sipariş', align: 'right' },
                      { key: 'aov', label: 'AOV', align: 'right' },
                      { key: 'kazanilan', label: 'Kazanılan', align: 'right' },
                      { key: 'winRate', label: 'Win Rate', align: 'right' },
                      { key: 'aktivite', label: 'Aktivite', align: 'right' },
                      { key: 'hedefPct', label: 'Hedefe Ulaşım', align: 'right' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.key !== 'name' && handleTableSort(col.key)}
                        style={{
                          padding: '8px 14px', fontSize: 11, fontWeight: 600,
                          color: tableSort.key === col.key ? t.pr : t.tx2,
                          textAlign: col.align as 'left' | 'right',
                          whiteSpace: 'nowrap',
                          cursor: col.key !== 'name' ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'left' ? 'flex-start' : 'flex-end', gap: 4 }}>
                          {col.label}
                          {col.key !== 'name' && <SortIcon colKey={col.key} sortState={tableSort} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedReps.map((r) => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: `1px solid ${t.bd}`, background: hedefBg(r.hedefPct, t) }}
                    >
                      <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: t.tx }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                          {r.name}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtTL(r.ciro)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{fmtTL(r.netKar)}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.siparis}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.aov.toLocaleString('tr-TR')} ₺</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{r.kazanilan}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: r.winRate >= 28 ? t.gn : r.winRate >= 22 ? t.am : t.rd }}>{r.winRate.toFixed(1)}%</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: r.aktivite >= 7 ? t.gn : r.aktivite >= 6 ? t.am : t.rd }}>{r.aktivite.toFixed(1)}/10</td>
                      <td style={{ padding: '9px 14px', width: 140 }}>{hedefBar(r.hedefPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 3: UZMAN BAZLI CİRO KARŞILAŞTIRMA ────────────────────── */}
          <SectionHeader title={l.repCiroKarsilastirma ?? 'UZMAN BAZLI CİRO KARŞILAŞTIRMA'} t={t} />

          <div style={{ marginBottom: 12 }}>
            <ChartContainer t={t} l={l} title={l.repCiroChart ?? 'Uzman Bazlı Ciro, Brüt Kâr & Net Kâr'} id="rep-chart-ciro" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              {/* TL / % toggle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <div style={{ display: 'flex', borderRadius: 6, border: `1px solid ${t.bd}`, overflow: 'hidden' }}>
                  {(['TL', '%'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCiroMode(m)}
                      style={{
                        padding: '4px 14px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                        background: ciroMode === m ? t.pr : 'transparent',
                        color: ciroMode === m ? '#fff' : t.tx2,
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ciroMode === 'TL' ? ciroBarData : marjBarData} margin={{ top: 15, right: 20, bottom: 0, left: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => ciroMode === 'TL' ? `${v}K` : `${v}%`}
                    domain={ciroMode === '%' ? [0, 50] : undefined}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const order = ciroMode === 'TL' ? ['ciro', 'brutKar', 'netKar'] : ['brutMarj', 'netMarj'];
                      const colors: Record<string, string> = { ciro: '#C7D2FE', brutKar: '#818CF8', netKar: '#4F46E5', brutMarj: '#818CF8', netMarj: '#4F46E5' };
                      const labels: Record<string, string> = {
                        ciro: lang === 'tr' ? 'Ciro' : 'Revenue',
                        brutKar: lang === 'tr' ? 'Brüt Kâr' : 'Gross Profit',
                        netKar: lang === 'tr' ? 'Net Kâr' : 'Net Profit',
                        brutMarj: lang === 'tr' ? 'Brüt Marj' : 'Gross Margin',
                        netMarj: lang === 'tr' ? 'Net Marj' : 'Net Margin',
                      };
                      const sorted = [...payload].sort((a, b) => order.indexOf(a.dataKey as string) - order.indexOf(b.dataKey as string));
                      return (
                        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{label}</div>
                          {sorted.map((entry) => (
                            <div key={entry.dataKey as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[entry.dataKey as string] ?? t.tx2 }} />
                              <span style={{ color: '#475569' }}>{labels[entry.dataKey as string] ?? entry.name}:</span>
                              <span style={{ fontWeight: 600, color: '#1E293B' }}>
                                {ciroMode === 'TL' ? `${entry.value}K ₺` : `%${entry.value}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  {ciroMode === 'TL' ? (
                    <>
                      <Bar dataKey="ciro" name={lang === 'tr' ? 'Ciro' : 'Revenue'} fill="#C7D2FE" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="brutKar" name={lang === 'tr' ? 'Brüt Kâr' : 'Gross Profit'} fill="#818CF8" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="netKar" name={lang === 'tr' ? 'Net Kâr' : 'Net Profit'} fill="#4F46E5" radius={[3, 3, 0, 0]} />
                      <ReferenceLine y={Math.round(REPS.reduce((s, r) => s + r.hedef, 0) / REPS.length / 1000)} stroke={t.tx3} strokeDasharray="5 3" label={{ value: lang === 'tr' ? 'Ort. Hedef' : 'Avg. Target', fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="brutMarj" name={lang === 'tr' ? 'Brüt Marj %' : 'Gross Margin %'} fill="#818CF8" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="netMarj" name={lang === 'tr' ? 'Net Marj %' : 'Net Margin %'} fill="#4F46E5" radius={[3, 3, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* ── Section 4: ÇEYREKLIK PERFORMANS TRENDİ ───────────────────────── */}
          <SectionHeader title={l.repCeyreklikTrend ?? 'ÇEYREKLİK PERFORMANS TRENDİ'} t={t} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Quarterly combo */}
            <ChartContainer t={t} l={l} title={l.repCeyreklikChart ?? 'Çeyreklik Ciro & Net Kâr Trendi'} id="rep-chart-quarterly" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={quarterlyData} margin={{ top: 15, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="q" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[10, 20]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const netMarjEntry = payload.find((p) => p.dataKey === 'netMarj');
                      const repEntries = payload.filter((p) => p.dataKey !== 'netMarj').sort((a, b) => (b.value as number) - (a.value as number));
                      const total = repEntries.reduce((s, p) => s + (p.value as number), 0);
                      return (
                        <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>{lang === 'tr' ? 'Toplam Ciro' : 'Total Revenue'}: {total.toLocaleString('tr-TR')}K ₺</div>
                          {repEntries.map((entry) => {
                            const pct = total > 0 ? ((entry.value as number) / total * 100).toFixed(1) : '0';
                            return (
                              <div key={entry.dataKey as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STACK_COLORS[entry.dataKey as keyof typeof STACK_COLORS] ?? t.tx2 }} />
                                <span style={{ color: '#475569' }}>{STACK_LABELS[entry.dataKey as string] ?? entry.name}:</span>
                                <span style={{ fontWeight: 600, color: '#1E293B' }}>{(entry.value as number).toLocaleString('tr-TR')}K ₺</span>
                                <span style={{ color: '#94A3B8', fontSize: 10 }}>(%{pct})</span>
                              </div>
                            );
                          })}
                          {netMarjEntry && (
                            <div style={{ borderTop: `1px solid ${t.bd}`, paddingTop: 4, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.gn }} />
                              <span style={{ color: '#475569' }}>{lang === 'tr' ? 'Net Kâr Oranı' : 'Net Profit %'}:</span>
                              <span style={{ fontWeight: 600, color: '#1E293B' }}>%{netMarjEntry.value}</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  {STACK_ORDER.map((key, i) => (
                    <Bar key={key} yAxisId="left" dataKey={key} name={STACK_LABELS[key]} stackId="ciro" fill={STACK_COLORS[key]} opacity={0.85} radius={i === STACK_ORDER.length - 1 ? [4, 4, 0, 0] : undefined} />
                  ))}
                  <Line yAxisId="right" type="monotone" dataKey="netMarj" name={lang === 'tr' ? 'Net Kâr Oranı %' : 'Net Profit %'} stroke={t.gn} strokeWidth={2.5} dot={{ r: 4, fill: t.gn }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Win Rate per rep */}
            <ChartContainer t={t} l={l} title={l.repWinRateTrend ?? 'Win Rate Trendi (Uzman Bazlı)'} id="rep-chart-winrate" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={winRateTrend} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[10, 40]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  {REPS.map((r) => (
                    <Line
                      key={r.id}
                      type="monotone"
                      dataKey={r.id === 'elif' ? 'elif' : r.id}
                      name={r.short}
                      stroke={r.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: r.color }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* ── Section 5: TOP 20 FİRMA ──────────────────────────────────────── */}
          <SectionHeader title={l.repTopFirma ?? 'TOP 20 FİRMA (EKİP TOPLAM)'} t={t} />

          <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.repTopFirmaTablo ?? 'En Çok Satış Yapılan Firmalar (Top 20)'}</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
                <Icon name="download" size={12} color={t.tx3} />
                Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                    {[
                      { key: 'firma', label: 'Firma Adı', align: 'left' },
                      { key: 'proje', label: 'Proje Sayısı', align: 'right' },
                      { key: 'ciro', label: 'Toplam Ciro', align: 'right' },
                      { key: 'netKar', label: 'Net Kâr', align: 'right' },
                      { key: 'marj', label: 'Kâr Oranı %', align: 'right' },
                      { key: 'uzman', label: 'Sorumlu Uzman', align: 'left' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleFirmaSort(col.key)}
                        style={{
                          padding: '8px 14px', fontSize: 11, fontWeight: 600,
                          color: firmaSort.key === col.key ? t.pr : t.tx2,
                          textAlign: col.align as 'left' | 'right',
                          whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'left' ? 'flex-start' : 'flex-end', gap: 4 }}>
                          {col.label}
                          <SortIcon colKey={col.key} sortState={firmaSort} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFirmalar.map((f, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: `1px solid ${t.bd}` }}
                      onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                      onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{f.firma}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{f.proje}</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{f.ciro}K ₺</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{f.netKar}K ₺</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600, color: marjColor(f.marj, t) }}>{f.marj.toFixed(1)}%</td>
                      <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{f.uzman}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>
              <button
                onClick={() => window.open('#', '_blank')}
                style={{ fontSize: 11, fontWeight: 500, color: t.pr, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {l.tumunuGor ?? 'Tümünü Gör'} →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
