import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Legend,
  BarChart, ReferenceLine, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { Icon } from '../ui/Icon';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const funnelStages = [
  { name: 'İletişime Geçildi', value: 1800000, color: '#C7D2FE' },
  { name: 'Teklif Öncesi Follow-up', value: 1200000, color: '#A5B4FC' },
  { name: 'Teklif Bekliyor', value: 850000, color: '#818CF8' },
  { name: 'Fiyatlama Bekliyor', value: 420000, color: '#6366F1' },
  { name: 'Contract Send', value: 310000, color: '#4F46E5' },
  { name: 'Follow-up', value: 210000, color: '#4338CA' },
  { name: 'Closed Won', value: 145000, color: '#3730A3' },
];

const convRates = ['66,7%', '70,8%', '49,4%', '73,8%', '67,7%', '69,0%'];

const winRateData = [
  { month: 'Nis', muhiku: 22, project: 18 },
  { month: 'May', muhiku: 24, project: 20 },
  { month: 'Haz', muhiku: 23, project: 19 },
  { month: 'Tem', muhiku: 26, project: 22 },
  { month: 'Ağu', muhiku: 25, project: 21 },
  { month: 'Eyl', muhiku: 28, project: 24 },
];

const pipelineSnapshot = [
  { month: 'Mar', discovery: 380, qualification: 260, proposal: 180, negotiation: 90, closing: 40, closedWon: 120 },
  { month: 'Nis', discovery: 420, qualification: 280, proposal: 200, negotiation: 100, closing: 50, closedWon: 140 },
  { month: 'May', discovery: 400, qualification: 290, proposal: 190, negotiation: 110, closing: 45, closedWon: 155 },
  { month: 'Haz', discovery: 450, qualification: 310, proposal: 210, negotiation: 105, closing: 55, closedWon: 165 },
  { month: 'Tem', discovery: 440, qualification: 300, proposal: 220, negotiation: 115, closing: 50, closedWon: 175 },
  { month: 'Ağu', discovery: 460, qualification: 320, proposal: 230, negotiation: 120, closing: 60, closedWon: 185 },
];

const stageDurationData = [
  { stage: 'İletişime\nGeçildi', gun: 5 },
  { stage: 'Teklif Öncesi\nFollow-up', gun: 8 },
  { stage: 'Teklif\nBekliyor', gun: 14 },
  { stage: 'Fiyatlama\nBekliyor', gun: 10 },
  { stage: 'Contract\nSend', gun: 6 },
  { stage: 'Follow-up', gun: 12 },
  { stage: 'Closed\nWon', gun: 3 },
];
const avgStageDuration = stageDurationData.reduce((s, d) => s + d.gun, 0) / stageDurationData.length;

interface RiskDeal {
  id: number;
  deal: string;
  musteri: string;
  stage: string;
  deger: number;
  gun: number;
  probability: number;
  owner: string;
  durum: 'ontrack' | 'atrisk';
}

const riskDeals: RiskDeal[] = [
  { id: 1, deal: 'Yıllık Kurumsal Hediye Paketi', musteri: 'Koç Holding', stage: 'Proposal', deger: 142000, gun: 22, probability: 75, owner: 'Ayşe K.', durum: 'ontrack' },
  { id: 2, deal: 'Q2 Employee Welcome Kit', musteri: 'Arçelik', stage: 'Negotiation', deger: 89500, gun: 18, probability: 90, owner: 'Mehmet D.', durum: 'atrisk' },
  { id: 3, deal: 'Milestone Program', musteri: 'Turkcell', stage: 'Technical Review', deger: 64000, gun: 28, probability: 30, owner: 'Ayşe K.', durum: 'atrisk' },
  { id: 4, deal: 'Kurumsal Bayram Seti', musteri: 'Sabancı', stage: 'Discovery', deger: 185000, gun: 8, probability: 20, owner: 'Can Y.', durum: 'ontrack' },
  { id: 5, deal: 'VIP Müşteri Hediye', musteri: 'THY', stage: 'Proposal', deger: 72000, gun: 15, probability: 65, owner: 'Elif S.', durum: 'ontrack' },
  { id: 6, deal: 'Yeni İşe Başlama Kiti', musteri: 'Garanti', stage: 'Qualification', deger: 48000, gun: 12, probability: 45, owner: 'Mehmet D.', durum: 'ontrack' },
  { id: 7, deal: 'Motivasyon Ödül Paketi', musteri: 'Doğuş', stage: 'Negotiation', deger: 95000, gun: 32, probability: 85, owner: 'Can Y.', durum: 'atrisk' },
  { id: 8, deal: 'Sezon Sonu Kampanya', musteri: 'Vestel', stage: 'Closing', deger: 38000, gun: 5, probability: 95, owner: 'Elif S.', durum: 'ontrack' },
];

interface AllDeal {
  id: number;
  deal: string;
  musteri: string;
  deger: number;
  stage: string;
  owner: string;
  probability: number;
  olusturma: string;
  beklenenKapanis: string;
  pipelineGun: number;
  kanal: 'Portal' | 'Project';
  durum: 'Won' | 'Lost' | 'Active' | 'At Risk' | 'Stale';
  amac: string;
}

const allDeals: AllDeal[] = [
  { id: 1, deal: 'Yıllık Kurumsal Hediye Paketi', musteri: 'Koç Holding', deger: 142000, stage: 'Proposal', owner: 'Ayşe K.', probability: 75, olusturma: '12.01.2025', beklenenKapanis: '28.03.2025', pipelineGun: 22, kanal: 'Portal', durum: 'Active', amac: 'Kurumsal Hediye' },
  { id: 2, deal: 'Q2 Employee Welcome Kit', musteri: 'Arçelik', deger: 89500, stage: 'Negotiation', owner: 'Mehmet D.', probability: 90, olusturma: '05.02.2025', beklenenKapanis: '15.03.2025', pipelineGun: 18, kanal: 'Project', durum: 'At Risk', amac: 'Employee Welcome' },
  { id: 3, deal: 'Milestone Program', musteri: 'Turkcell', deger: 64000, stage: 'Technical Review', owner: 'Ayşe K.', probability: 30, olusturma: '20.01.2025', beklenenKapanis: '10.04.2025', pipelineGun: 28, kanal: 'Portal', durum: 'At Risk', amac: 'Motivasyon & Ödül' },
  { id: 4, deal: 'Kurumsal Bayram Seti', musteri: 'Sabancı Holding', deger: 185000, stage: 'Discovery', owner: 'Can Y.', probability: 20, olusturma: '01.03.2025', beklenenKapanis: '30.05.2025', pipelineGun: 8, kanal: 'Portal', durum: 'Active', amac: 'Bayram & Özel Gün' },
  { id: 5, deal: 'VIP Müşteri Hediye', musteri: 'THY', deger: 72000, stage: 'Proposal', owner: 'Elif S.', probability: 65, olusturma: '15.02.2025', beklenenKapanis: '20.03.2025', pipelineGun: 15, kanal: 'Project', durum: 'Active', amac: 'Müşteri Sadakat' },
  { id: 6, deal: 'Yeni İşe Başlama Kiti', musteri: 'Garanti BBVA', deger: 48000, stage: 'Qualification', owner: 'Mehmet D.', probability: 45, olusturma: '25.02.2025', beklenenKapanis: '15.04.2025', pipelineGun: 12, kanal: 'Portal', durum: 'Active', amac: 'Employee Welcome' },
  { id: 7, deal: 'Motivasyon Ödül Paketi', musteri: 'Doğuş Otomotiv', deger: 95000, stage: 'Negotiation', owner: 'Can Y.', probability: 85, olusturma: '10.01.2025', beklenenKapanis: '05.03.2025', pipelineGun: 32, kanal: 'Project', durum: 'At Risk', amac: 'Motivasyon & Ödül' },
  { id: 8, deal: 'Sezon Sonu Kampanya', musteri: 'Vestel', deger: 38000, stage: 'Closing', owner: 'Elif S.', probability: 95, olusturma: '01.03.2025', beklenenKapanis: '10.03.2025', pipelineGun: 5, kanal: 'Portal', durum: 'Active', amac: 'Tanıtım & Lansman' },
  { id: 9, deal: 'Departman Ödüllendirme Seti', musteri: 'Eczacıbaşı', deger: 67000, stage: 'Won', owner: 'Ayşe K.', probability: 100, olusturma: '05.12.2024', beklenenKapanis: '15.02.2025', pipelineGun: 72, kanal: 'Portal', durum: 'Won', amac: 'Motivasyon & Ödül' },
  { id: 10, deal: 'Yılbaşı Özel Paket', musteri: 'Pegasus', deger: 52000, stage: 'Won', owner: 'Mehmet D.', probability: 100, olusturma: '01.11.2024', beklenenKapanis: '20.12.2024', pipelineGun: 49, kanal: 'Project', durum: 'Won', amac: 'Bayram & Özel Gün' },
  { id: 11, deal: 'Kurumsal Tanıtım Kiti', musteri: 'İş Bankası', deger: 118000, stage: 'Lost', owner: 'Can Y.', probability: 0, olusturma: '10.01.2025', beklenenKapanis: '28.02.2025', pipelineGun: 49, kanal: 'Portal', durum: 'Lost', amac: 'Tanıtım & Lansman' },
  { id: 12, deal: 'Müşteri Sadakat Paketi', musteri: 'Akbank', deger: 76000, stage: 'Discovery', owner: 'Elif S.', probability: 15, olusturma: '08.03.2025', beklenenKapanis: '30.06.2025', pipelineGun: 3, kanal: 'Portal', durum: 'Active', amac: 'Müşteri Sadakat' },
  { id: 13, deal: 'Çalışan Motivasyon Seti', musteri: 'Enerjisa', deger: 43000, stage: 'Qualification', owner: 'Ayşe K.', probability: 40, olusturma: '20.02.2025', beklenenKapanis: '20.04.2025', pipelineGun: 14, kanal: 'Project', durum: 'Active', amac: 'Motivasyon & Ödül' },
  { id: 14, deal: 'Premium Hoşgeldin Kutusu', musteri: 'Trendyol', deger: 210000, stage: 'Proposal', owner: 'Mehmet D.', probability: 60, olusturma: '01.02.2025', beklenenKapanis: '15.04.2025', pipelineGun: 35, kanal: 'Portal', durum: 'Stale', amac: 'Employee Welcome' },
  { id: 15, deal: 'Bayram Hediye Koleksiyonu', musteri: 'Hepsiburada', deger: 88000, stage: 'Technical Review', owner: 'Can Y.', probability: 35, olusturma: '15.02.2025', beklenenKapanis: '01.05.2025', pipelineGun: 21, kanal: 'Project', durum: 'Active', amac: 'Bayram & Özel Gün' },
  { id: 16, deal: 'Şirket Kuruluş Yıldönümü', musteri: 'Ford Otosan', deger: 155000, stage: 'Lost', owner: 'Elif S.', probability: 0, olusturma: '05.01.2025', beklenenKapanis: '10.03.2025', pipelineGun: 64, kanal: 'Portal', durum: 'Lost', amac: 'Kurumsal Hediye' },
];

const AMAC_OPTIONS = ['Tümü', 'Kurumsal Hediye', 'Employee Welcome', 'Motivasyon & Ödül', 'Bayram & Özel Gün', 'Müşteri Sadakat', 'Tanıtım & Lansman'];
const OWNER_OPTIONS = ['Tümü', 'Ayşe K.', 'Mehmet D.', 'Can Y.', 'Elif S.', 'Burak A.'];
const STATUS_OPTIONS = ['Tümü', 'Active', 'Won', 'Lost', 'Stale', 'At Risk'];
const KANAL_OPTIONS = ['Tümü', 'b2b.muhiku.com', 'B2B Project'];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  Discovery: { color: '#3B82F6', bg: '#DBEAFE' },
  Qualification: { color: '#059669', bg: '#D1FAE5' },
  Proposal: { color: '#D97706', bg: '#FEF3C7' },
  Negotiation: { color: '#7C3AED', bg: '#EDE9FE' },
  'Technical Review': { color: '#3B82F6', bg: '#DBEAFE' },
  Closing: { color: '#DC2626', bg: '#FEE2E2' },
  Won: { color: '#059669', bg: '#D1FAE5' },
  Lost: { color: '#DC2626', bg: '#FEE2E2' },
};

type FilterChip = { key: string; label: string; color: string; bg: string };

const FILTER_CHIPS: FilterChip[] = [
  { key: 'won', label: 'Deal Won', color: '#059669', bg: '#D1FAE5' },
  { key: 'lost', label: 'Deal Lost', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'highest', label: 'Highest Value', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'ghost', label: 'Ghost Pipeline', color: '#64748B', bg: '#F1F5F9' },
  { key: 'thisweek', label: 'Bu Hafta Kapanacak', color: '#D97706', bg: '#FEF3C7' },
  { key: 'atrisk', label: 'Risk Altında', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'newthismonth', label: 'Yeni Bu Ay', color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'portal', label: 'b2b.muhiku.com', color: '#818CF8', bg: '#EEF2FF' },
  { key: 'project', label: 'B2B Project', color: '#4F46E5', bg: '#E0E7FF' },
];

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesPipeline = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [dealSort, setDealSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'deger', dir: 'desc' });
  const [dealPage, setDealPage] = useState(0);
  const PAGE_SIZE = 25;

  // Search & filter state
  const [dealSearch, setDealSearch] = useState('');
  const [fStatus, setFStatus] = useState('Tümü');
  const [fOwner, setFOwner] = useState('Tümü');
  const [fAmac, setFAmac] = useState('Tümü');
  const [fKanal, setFKanal] = useState('Tümü');

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setDealPage(0);
  };

  const handleDealSort = (key: string) => {
    setDealSort((prev) => prev.key === key && prev.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const clearAllFilters = () => {
    setDealSearch(''); setFStatus('Tümü'); setFOwner('Tümü'); setFAmac('Tümü'); setFKanal('Tümü');
    setActiveFilters(new Set()); setDealPage(0);
  };

  const activeDropdownCount = [fStatus, fOwner, fAmac, fKanal].filter((f) => f !== 'Tümü').length + (dealSearch ? 1 : 0);

  // Filter deals (dropdowns + search + chips combined)
  const filteredDeals = allDeals.filter((d) => {
    // Search
    if (dealSearch) {
      const q = dealSearch.toLowerCase();
      if (!d.deal.toLowerCase().includes(q) && !d.musteri.toLowerCase().includes(q)) return false;
    }
    // Dropdown filters
    if (fStatus !== 'Tümü' && d.durum !== fStatus) return false;
    if (fOwner !== 'Tümü' && d.owner !== fOwner) return false;
    if (fAmac !== 'Tümü' && d.amac !== fAmac) return false;
    if (fKanal !== 'Tümü') {
      const kanalMatch = fKanal === 'b2b.muhiku.com' ? d.kanal === 'Portal' : d.kanal === 'Project';
      if (!kanalMatch) return false;
    }
    // Chip filters
    if (activeFilters.size > 0) {
      const checks: boolean[] = [];
      if (activeFilters.has('won')) checks.push(d.durum === 'Won');
      if (activeFilters.has('lost')) checks.push(d.durum === 'Lost');
      if (activeFilters.has('highest')) checks.push(d.deger >= 100000);
      if (activeFilters.has('ghost')) checks.push(d.pipelineGun >= 30 && d.durum !== 'Won' && d.durum !== 'Lost');
      if (activeFilters.has('thisweek')) checks.push(d.pipelineGun <= 7 && d.stage === 'Closing');
      if (activeFilters.has('atrisk')) checks.push(d.durum === 'At Risk');
      if (activeFilters.has('newthismonth')) checks.push(d.pipelineGun <= 14);
      if (activeFilters.has('portal')) checks.push(d.kanal === 'Portal');
      if (activeFilters.has('project')) checks.push(d.kanal === 'Project');
      if (!checks.some(Boolean)) return false;
    }
    return true;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    const av = (a as Record<string, unknown>)[dealSort.key];
    const bv = (b as Record<string, unknown>)[dealSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return dealSort.dir === 'asc' ? av - bv : bv - av;
    return dealSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const pagedDeals = sortedDeals.slice(dealPage * PAGE_SIZE, (dealPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedDeals.length / PAGE_SIZE);

  const stageBadge = (stage: string) => {
    const cfg = STAGE_COLORS[stage] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{stage}</span>;
  };

  const durumBadge = (d: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Won: { color: '#059669', bg: '#D1FAE5' }, Lost: { color: '#DC2626', bg: '#FEE2E2' },
      Active: { color: '#3B82F6', bg: '#DBEAFE' }, 'At Risk': { color: '#DC2626', bg: '#FEE2E2' },
      Stale: { color: '#64748B', bg: '#F1F5F9' }, 'On Track': { color: '#059669', bg: '#D1FAE5' },
    };
    const c = cfg[d] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{d}</span>;
  };

  const kanalBadge = (k: string) => {
    const isPortal = k === 'Portal';
    return <span style={{ fontSize: 10, fontWeight: 500, color: isPortal ? '#818CF8' : '#4F46E5', background: isPortal ? '#EEF2FF' : '#E0E7FF', borderRadius: 5, padding: '2px 8px' }}>{isPortal ? 'b2b.muhiku.com' : 'B2B Project'}</span>;
  };

  const probBar = (pct: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: t.bg2, borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? t.gn : pct >= 40 ? t.am : t.rd, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: pct >= 70 ? t.gn : pct >= 40 ? t.am : t.rd, width: 28, textAlign: 'right' }}>{pct}%</span>
    </div>
  );

  const avgRiskDays = riskDeals.reduce((s, d) => s + d.gun, 0) / riskDeals.length;

  // Filter dropdown component
  const FilterDD = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => { onChange(e.target.value); setDealPage(0); }}
        style={{
          padding: '5px 24px 5px 8px', borderRadius: 6, border: `1px solid ${value !== 'Tümü' ? t.pr : t.bd}`,
          background: value !== 'Tümü' ? t.prL : t.bg2, color: value !== 'Tümü' ? t.pr : t.tx2,
          fontSize: 11, fontWeight: value !== 'Tümü' ? 600 : 400, cursor: 'pointer', outline: 'none',
          appearance: 'none', WebkitAppearance: 'none',
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o === 'Tümü' ? `${label}: Tümü` : o}</option>)}
      </select>
      <Icon name="chevDown" size={10} color={t.tx3} />
    </div>
  );

  return (
    <>
      {/* ── Section 1: PİPELİNE METRİKLERİ ──────────────────────────────────── */}
      <SectionHeader title={l.pipMetrikler ?? 'PİPELİNE METRİKLERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="pip-toplam" title={l.pipToplamDeger ?? 'Toplam Pipeline Değeri'} value="4.200.000 ₺" trendValue="+14,2%" sparkTrend="up" color="pr" unit="K ₺" big {...kp} />
        <KPICard id="pip-coverage" title={l.pipCoverage ?? 'Pipeline Coverage'} value="3,5x" trendValue="+0,2x" sparkTrend="up" color="tl" unit="x" big info={l.pipCoverageInfo ?? 'Pipeline / Çeyreklik Hedef'} {...kp} />
        <KPICard id="pip-winrate" title={l.pipWinRate ?? 'Win Rate %'} value="%24,2" trendValue="+1,5pp" sparkTrend="up" color="gn" unit="%" big {...kp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="pip-dongu" title={l.pipDongu ?? 'Ort. Satış Döngüsü'} value="42 Gün" trendValue="-3 gün" sparkTrend="down" color="gn" unit="gün" {...kp} />
        <KPICard id="pip-velocity" title={l.pipVelocity ?? 'Deal Velocity'} value="4,2x" trendValue="+0,3x" sparkTrend="up" color="tl" unit="x" info={l.pipVelocityInfo ?? 'Pipeline × WinRate / Cycle'} {...kp} />
        <KPICard id="pip-forecast" title={l.pipForecast ?? 'Forecast Accuracy'} value="%87" trendValue="+2pp" sparkTrend="up" color="gn" unit="%" info={l.pipForecastInfo ?? 'Gerçekleşen / Tahmin'} {...kp} />
      </div>

      {/* ── Section 2: SALES FUNNEL & WIN RATE ───────────────────────────────── */}
      <SectionHeader title={l.pipFunnelSection ?? 'SALES FUNNEL & WIN RATE'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.pipFunnel ?? 'Sales Funnel (Deal Stage)'} id="pip-chart-funnel" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {funnelStages.map((s, i) => {
              const maxVal = funnelStages[0].value;
              const pct = (s.value / maxVal) * 100;
              const barPct = 25 + (pct / 100) * 75;
              return (
                <div key={s.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: t.tx2, width: 130, textAlign: 'right', flexShrink: 0, lineHeight: 1.2 }}>{s.name}</span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: `${barPct}%`, height: 28, background: s.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.3s' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: i >= 4 ? '#fff' : '#1E293B' }}>{fmtTL(s.value)}</span>
                      </div>
                    </div>
                  </div>
                  {i < funnelStages.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0', marginLeft: 140 }}>
                      <span style={{ fontSize: 9, color: t.tx3 }}>↓</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: t.pr, marginLeft: 4 }}>{convRates[i]}</span>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 8, padding: '8px 12px', background: t.bg2, borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: t.tx2 }}>İletişime Geçildi → Closed Won Conversion: </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.pr }}>%8,1</span>
            </div>
          </div>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.pipWinRateTrend ?? 'Win Rate Trendi'} id="pip-chart-winrate" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={winRateData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(value: number, name: string) => [`${value}%`, name]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="muhiku" name="b2b.muhiku.com" stroke="#818CF8" strokeWidth={2.5} dot={{ r: 4, fill: '#818CF8' }} />
              <Line type="monotone" dataKey="project" name="B2B Project" stroke="#4F46E5" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#4F46E5' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 3: PİPELİNE SNAPSHOT ─────────────────────────────────────── */}
      <SectionHeader title={l.pipSnapshotSection ?? 'PİPELİNE SNAPSHOT'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.pipSnapshot ?? 'Pipeline Snapshot (Aylık)'} id="pip-chart-snapshot" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={pipelineSnapshot} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(value: number, name: string) => [`${value}K ₺`, name]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="discovery" name="Discovery" stackId="a" fill="#BFDBFE" />
              <Bar yAxisId="left" dataKey="qualification" name="Qualification" stackId="a" fill="#A7F3D0" />
              <Bar yAxisId="left" dataKey="proposal" name="Proposal" stackId="a" fill="#FDE68A" />
              <Bar yAxisId="left" dataKey="negotiation" name="Negotiation" stackId="a" fill="#C4B5FD" />
              <Bar yAxisId="left" dataKey="closing" name="Closing" stackId="a" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="closedWon" name="Closed Won" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4, fill: '#16A34A' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 4: STAGE DURATION ANALİZİ ────────────────────────────────── */}
      <SectionHeader title={l.pipStageDuration ?? 'STAGE DURATION ANALİZİ'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.pipStageDurationChart ?? 'Ortalama Stage Süresi (Gün)'} id="pip-chart-duration" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stageDurationData} margin={{ top: 15, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 9, fill: t.tx2, angle: -25, textAnchor: 'end' }} axisLine={false} tickLine={false} interval={0} height={50} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value} gün`, '']} />
              <ReferenceLine y={avgStageDuration} stroke={t.tx3} strokeDasharray="5 3" label={{ value: `Ort. ${avgStageDuration.toFixed(1)} gün`, fontSize: 10, fill: t.tx3, position: 'insideTopRight' }} />
              <Bar dataKey="gun" name="Gün" radius={[4, 4, 0, 0]}>
                {stageDurationData.map((d, i) => (
                  <Cell key={i} fill={d.gun === 14 ? '#EF4444' : d.gun === 12 ? '#F59E0B' : '#6366F1'} opacity={d.gun >= 12 ? 0.9 : 0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 5: RİSK ALTINDAKİ FIRSATLAR ─────────────────────────────── */}
      <SectionHeader title={l.pipRiskSection ?? 'RİSK ALTINDAKİ FIRSATLAR'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.pipRiskTablo ?? 'Yüksek Değerli Risk Altındaki Fırsatlar'}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} /> Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {['Müşteri', 'Proje Adı', 'Stage', 'Değer', 'Stage Gün', 'Probability', 'Owner', 'Durum'].map((h) => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: h === 'Değer' || h === 'Stage Gün' || h === 'Probability' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskDeals.map((row) => (
                <tr key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}`, background: row.durum === 'atrisk' ? '#FEF2F2' : 'transparent' }}
                  onMouseOver={(e) => { if (row.durum !== 'atrisk') (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = row.durum === 'atrisk' ? '#FEF2F2' : 'transparent'; }}
                >
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx }}>{row.musteri}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{row.deal}</td>
                  <td style={{ padding: '9px 14px' }}>{stageBadge(row.stage)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtTL(row.deger)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.gun > avgRiskDays * 2 ? t.rd : t.tx, fontWeight: row.gun > avgRiskDays * 2 ? 700 : 400 }}>{row.gun} gün</td>
                  <td style={{ padding: '9px 14px', width: 100 }}>{probBar(row.probability)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2 }}>{row.owner}</td>
                  <td style={{ padding: '9px 14px' }}>{durumBadge(row.durum === 'ontrack' ? 'On Track' : 'At Risk')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 6: TÜM DEAL'LER TABLOSU ──────────────────────────────────── */}
      <SectionHeader title={l.pipAllDeals ?? "TÜM DEAL'LER TABLOSU"} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.pipAllDealsTablo ?? "Tüm Projeler / Deal'ler"}</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
              <Icon name="download" size={12} color={t.tx3} /> Excel
            </button>
          </div>

          {/* Search + Filter dropdowns */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', left: 8, pointerEvents: 'none', zIndex: 1 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={dealSearch}
                onChange={(e) => { setDealSearch(e.target.value); setDealPage(0); }}
                placeholder={lang === 'tr' ? 'Proje veya müşteri ara...' : 'Search project or customer...'}
                style={{ paddingLeft: 28, paddingRight: dealSearch ? 28 : 10, paddingTop: 5, paddingBottom: 5, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 11, color: t.tx, outline: 'none', width: 240 }}
              />
              {dealSearch && (
                <button onClick={() => { setDealSearch(''); setDealPage(0); }} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, fontSize: 14, lineHeight: 1 }}>×</button>
              )}
            </div>
            <FilterDD label="Durum" value={fStatus} options={STATUS_OPTIONS} onChange={setFStatus} />
            <FilterDD label="Uzman" value={fOwner} options={OWNER_OPTIONS} onChange={setFOwner} />
            <FilterDD label="Amaç" value={fAmac} options={AMAC_OPTIONS} onChange={setFAmac} />
            <FilterDD label="Kanal" value={fKanal} options={KANAL_OPTIONS} onChange={setFKanal} />
            {activeDropdownCount > 0 && (
              <button onClick={clearAllFilters} style={{ fontSize: 10, color: t.rd, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {lang === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'} ({activeDropdownCount + activeFilters.size})
              </button>
            )}
          </div>

          {/* Chip presets */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilters.has(chip.key);
              return (
                <button key={chip.key} onClick={() => toggleFilter(chip.key)}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${isActive ? chip.color : t.bd}`, background: isActive ? chip.bg : 'transparent', color: isActive ? chip.color : t.tx3, transition: 'all 0.15s' }}
                >{chip.label}</button>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'deal', label: 'Proje Adı', align: 'left' },
                  { key: 'musteri', label: 'Müşteri', align: 'left' },
                  { key: 'deger', label: 'Değer', align: 'right' },
                  { key: 'stage', label: 'Stage', align: 'left' },
                  { key: 'owner', label: 'Owner', align: 'left' },
                  { key: 'probability', label: 'Prob. %', align: 'right' },
                  { key: 'olusturma', label: 'Oluşturma', align: 'left' },
                  { key: 'beklenenKapanis', label: 'Bkl. Kapanış', align: 'left' },
                  { key: 'pipelineGun', label: 'Gün', align: 'right' },
                  { key: 'kanal', label: 'Kanal', align: 'left' },
                  { key: 'durum', label: 'Durum', align: 'center' },
                ].map((col) => (
                  <th key={col.key} onClick={() => handleDealSort(col.key)}
                    style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: dealSort.key === col.key ? t.pr : t.tx2, textAlign: col.align as 'left'|'right'|'center', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'left' ? 'flex-start' : col.align === 'center' ? 'center' : 'flex-end', gap: 3 }}>
                      {col.label}
                      <Icon name={dealSort.key === col.key ? (dealSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={9} color={dealSort.key === col.key ? t.pr : t.tx3} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedDeals.map((row) => (
                <tr key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}`, background: row.durum === 'At Risk' ? '#FEF2F2' : 'transparent' }}
                  onMouseOver={(e) => { if (row.durum !== 'At Risk') (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = row.durum === 'At Risk' ? '#FEF2F2' : 'transparent'; }}
                >
                  <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: t.tx, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.deal}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: t.tx2, whiteSpace: 'nowrap' }}>{row.musteri}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', fontWeight: 500, color: t.tx }}>{fmtTL(row.deger)}</td>
                  <td style={{ padding: '8px 10px' }}>{stageBadge(row.stage)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: t.tx2, whiteSpace: 'nowrap' }}>{row.owner}</td>
                  <td style={{ padding: '8px 10px', width: 80 }}>{probBar(row.probability)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 10, color: t.tx2 }}>{row.olusturma}</td>
                  <td style={{ padding: '8px 10px', fontSize: 10, color: t.tx2 }}>{row.beklenenKapanis}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', color: row.pipelineGun >= 30 ? t.rd : t.tx, fontWeight: row.pipelineGun >= 30 ? 700 : 400 }}>{row.pipelineGun}</td>
                  <td style={{ padding: '8px 10px' }}>{kanalBadge(row.kanal)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{durumBadge(row.durum)}</td>
                </tr>
              ))}
              {pagedDeals.length === 0 && (
                <tr><td colSpan={11} style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>{lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination + count */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: t.tx2 }}>{sortedDeals.length} {lang === 'tr' ? 'sonuç' : 'results'}</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setDealPage(i)}
                  style={{ width: 28, height: 28, borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `1px solid ${dealPage === i ? t.pr : t.bd}`, background: dealPage === i ? t.prL : 'transparent', color: dealPage === i ? t.pr : t.tx2, fontWeight: dealPage === i ? 600 : 400 }}
                >{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
