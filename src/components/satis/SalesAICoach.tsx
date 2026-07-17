import { useState } from 'react';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { Icon } from '../ui/Icon';
import { tTerm } from '../../i18n/terms';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

// ── Mock Data ───────────────────────────────────────────────────────────────────

const heatCards = [
  { title: 'Cold Companies', count: 847, cvr: 0.7, steps: 0, pipeline: '', barPct: 7, color: '#94A3B8', bg: '#F1F5F9' },
  { title: 'Aware Companies', count: 312, cvr: 6.3, steps: 5, pipeline: '21,5K ₺', barPct: 25, color: '#22C55E', bg: '#F0FDF4' },
  { title: 'Engaged Companies', count: 128, cvr: 28.9, steps: 5, pipeline: '16,1K ₺', barPct: 55, color: '#16A34A', bg: '#ECFDF5' },
  { title: 'Hot Companies', count: 45, cvr: 49.9, steps: 5, pipeline: '11K ₺', barPct: 85, color: '#15803D', bg: '#DCFCE7' },
];

interface ActionCard {
  icon: string;
  title: string;
  desc: string;
  detail: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
}

const actionCards: ActionCard[] = [
  { icon: '📞', title: 'İletişime Geç', desc: 'Bu hafta iletişime geçilmesi gereken müşteriler', detail: 'AI, geçmiş veriler + sezon + müşteri davranışı analiz ederek belirledi', badge: '12 müşteri', badgeColor: '#16A34A', borderColor: '#16A34A' },
  { icon: '🔄', title: 'Yeniden Satış', desc: 'Mevcut müşteride tekrar satış potansiyeli', detail: 'Geçen yıl bu dönemde sipariş veren ama henüz vermemiş müşteriler', badge: '8 müşteri', badgeColor: '#4F46E5', borderColor: '#4F46E5' },
  { icon: '🔔', title: 'Re-engage', desc: '90+ gün aktif olmayan müşteriler için yeniden iletişim', detail: 'Kişiselleştirilmiş mesaj önerileri hazır', badge: '15 müşteri', badgeColor: '#D97706', borderColor: '#D97706' },
  { icon: '⚠️', title: 'Deal Risk Alert', desc: "Pipeline'daki risk sinyalleri", detail: 'Uzun süredir aynı stage, değer düşüşü, ghost pipeline', badge: '6 deal', badgeColor: '#DC2626', borderColor: '#DC2626' },
  { icon: '📊', title: 'Kampanya Önerisi', desc: 'Sezonsal verilere dayalı kampanya fırsatı', detail: "Bu dönem 'Holiday Season' kategorisinde kampanya açılmalı", badge: '3 öneri', badgeColor: '#7C3AED', borderColor: '#7C3AED' },
];

interface Agent {
  icon: string;
  name: string;
  desc: string;
  trigger: 'Scheduled' | 'Manual';
  lastRun: string;
  live: boolean;
}

const agents: Agent[] = [
  { icon: '🔄', name: 'Kaybedilen Fırsat Diriltici', desc: 'Kaybedilen deal\'leri analiz eder, yeniden değerlendirilebilecekleri tespit eder', trigger: 'Scheduled', lastRun: '2 gün önce', live: true },
  { icon: '📋', name: 'Haftalık Koçluk Raporu', desc: 'Her uzmanın 7 günlük performansını analiz eder, güçlü/zayıf yönleri belirler', trigger: 'Scheduled', lastRun: '3 gün önce', live: true },
  { icon: '🎯', name: 'Açık Deal Sonraki Adım', desc: 'Açık deal\'ler için en optimal sonraki adımı önerir', trigger: 'Scheduled', lastRun: '1 gün önce', live: true },
  { icon: '📈', name: 'Büyüme Fırsat Bulucu', desc: 'Mevcut müşterilerde cross-sell/upsell fırsatlarını analiz eder', trigger: 'Scheduled', lastRun: '5 gün önce', live: true },
  { icon: '📄', name: 'Görüşme Öncesi Brief', desc: 'Herhangi bir müşteri görüşmesi öncesi otomatik firma brief\'i oluşturur', trigger: 'Manual', lastRun: 'bugün', live: true },
  { icon: '🏆', name: 'Müşteri Başarı Orkestratörü', desc: 'Müşteri lifecycle event\'lerini takip eder, uygun aksiyonları tetikler', trigger: 'Scheduled', lastRun: '12 gün önce', live: false },
];

interface AIRec {
  id: number;
  oncelik: '🔴' | '🟡' | '🟢';
  tip: string;
  firma: string;
  aciklama: string;
  deger: number;
  sonAktivite: string;
  sorumlu: string;
  durum: 'Yeni' | 'Devam' | 'Tamamlandı';
}

const aiRecs: AIRec[] = [
  { id: 1, oncelik: '🔴', tip: 'İletişime Geç', firma: 'Koç Holding', aciklama: 'Q4 hediye siparişi için takip — geçen yıl bu dönem 280K sipariş vermişti', deger: 300000, sonAktivite: '12 gün önce', sorumlu: 'Ayşe K.', durum: 'Yeni' },
  { id: 2, oncelik: '🔴', tip: 'Deal Risk', firma: 'Arçelik Welcome Kit', aciklama: "32 gündür Negotiation'da, aktivite yok", deger: 89500, sonAktivite: '32 gün', sorumlu: 'Mehmet D.', durum: 'Yeni' },
  { id: 3, oncelik: '🟡', tip: 'Yeniden Satış', firma: 'Turkcell', aciklama: "2024 Q4'te 3 proje yapmıştı, henüz 2025 Q4 siparişi yok", deger: 180000, sonAktivite: '45 gün', sorumlu: 'Elif S.', durum: 'Devam' },
  { id: 4, oncelik: '🟡', tip: 'Re-engage', firma: 'Sabancı Holding', aciklama: '94 gündür aktif değil, önceki yıl düzenli müşteriydi', deger: 120000, sonAktivite: '94 gün', sorumlu: 'Can Y.', durum: 'Yeni' },
  { id: 5, oncelik: '🟢', tip: 'İletişime Geç', firma: 'THY', aciklama: 'Yeni dönem bütçe planlaması başladı, temas kurulmalı', deger: 200000, sonAktivite: '8 gün', sorumlu: 'Ayşe K.', durum: 'Devam' },
  { id: 6, oncelik: '🔴', tip: 'Deal Risk', firma: 'Eczacıbaşı', aciklama: "Pipeline'da 45 gündür Tech Review'da takılı", deger: 64000, sonAktivite: '45 gün', sorumlu: 'Can Y.', durum: 'Yeni' },
  { id: 7, oncelik: '🟡', tip: 'Kampanya', firma: 'Holiday Season', aciklama: 'Bu dönem hediye kutusu kategorisinde %40 artış bekleniyor', deger: 250000, sonAktivite: '-', sorumlu: 'Ekip', durum: 'Yeni' },
  { id: 8, oncelik: '🟢', tip: 'Yeniden Satış', firma: 'Garanti BBVA', aciklama: 'Son siparişten memnun, yeni departman için genişleme potansiyeli', deger: 85000, sonAktivite: '20 gün', sorumlu: 'Mehmet D.', durum: 'Devam' },
  { id: 9, oncelik: '🟡', tip: 'Re-engage', firma: 'Vestel', aciklama: '110 gündür sessiz, son proje başarılıydı ama takip yapılmamış', deger: 70000, sonAktivite: '110 gün', sorumlu: 'Elif S.', durum: 'Yeni' },
  { id: 10, oncelik: '🟢', tip: 'İletişime Geç', firma: 'İş Bankası', aciklama: 'Yıldönümü hediye programı için teklif hazırlanabilir', deger: 95000, sonAktivite: '5 gün', sorumlu: 'Burak A.', durum: 'Yeni' },
];

const TIP_FILTERS = ['Tümü', 'İletişime Geç', 'Yeniden Satış', 'Re-engage', 'Deal Risk', 'Kampanya'];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesAICoach = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [actionTab, setActionTab] = useState<'haftalik' | 'aylik' | 'ceyreklik'>('haftalik');
  const [tipFilter, setTipFilter] = useState('Tümü');
  const [recSort, setRecSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'deger', dir: 'desc' });
  const [agentStates, setAgentStates] = useState<boolean[]>(agents.map((a) => a.live));

  const toggleAgent = (idx: number) => {
    setAgentStates((prev) => prev.map((v, i) => i === idx ? !v : v));
  };

  const handleRecSort = (key: string) => {
    setRecSort((p) => p.key === key && p.dir === 'desc' ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const filteredRecs = tipFilter === 'Tümü' ? aiRecs : aiRecs.filter((r) => r.tip === tipFilter);
  const sortedRecs = [...filteredRecs].sort((a, b) => {
    const av = (a as Record<string, unknown>)[recSort.key];
    const bv = (b as Record<string, unknown>)[recSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return recSort.dir === 'asc' ? av - bv : bv - av;
    return recSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const durumBadge = (d: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      Yeni: { color: '#3B82F6', bg: '#DBEAFE' },
      Devam: { color: '#D97706', bg: '#FEF3C7' },
      'Tamamlandı': { color: '#059669', bg: '#D1FAE5' },
    };
    const c = cfg[d] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px' }}>{i18n.tBadge(d)}</span>;
  };

  const tipBadge = (tip: string) => {
    const cfg: Record<string, { color: string; bg: string }> = {
      'İletişime Geç': { color: '#16A34A', bg: '#D1FAE5' },
      'Yeniden Satış': { color: '#4F46E5', bg: '#EEF2FF' },
      'Re-engage': { color: '#D97706', bg: '#FEF3C7' },
      'Deal Risk': { color: '#DC2626', bg: '#FEE2E2' },
      Kampanya: { color: '#7C3AED', bg: '#F3E8FF' },
    };
    const c = cfg[tip] ?? { color: t.tx2, bg: t.bg2 };
    return <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{tTerm(tip)}</span>;
  };

  return (
    <>
      {/* ── Banner ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#EEF2FF', borderLeft: '4px solid #4F46E5', borderRadius: 10,
        padding: '14px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
            AI Sales Coach
          </span>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>
            — {lang === 'tr' ? 'Verilerinize dayalı kişiselleştirilmiş aksiyonlar ve öneriler.' : 'Personalized actions based on your data.'}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>
            {lang === 'tr' ? 'Son analiz: 3 dk önce' : 'Last analysis: 3 min ago'}
          </span>
        </div>
        <button style={{
          padding: '7px 16px', borderRadius: 8, border: '1.5px solid #4F46E5',
          background: 'transparent', color: '#4F46E5', fontSize: 12, fontWeight: 600,
          cursor: 'pointer',
        }}>
          {lang === 'tr' ? 'Yeniden Analiz Et' : 'Re-analyze'}
        </button>
      </div>

      {/* ── Section 1: NEXT BEST ACTIONS ÖZETİ ──────────────────────────────── */}
      <SectionHeader title={l.aiNextActions ?? 'NEXT BEST ACTIONS ÖZETİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'stretch' }}>
        <KPICard id="ai-bekleyen" title={l.aiBekleyen ?? 'Bekleyen Aksiyonlar'} value="23" trendValue="Bu hafta tamamlanması gereken" sparkTrend="flat" color="am" unit="adet" big {...kp} />
        <KPICard id="ai-pipeline" title={l.aiPotPipeline ?? 'Potansiyel Pipeline'} value="1.280.000 ₺" trendValue="Aksiyonlardan beklenen gelir" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => document.getElementById('ai-rec-table')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '14px 28px', borderRadius: 10, border: 'none',
              background: t.pr, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            View Actions ↓
          </button>
        </div>
      </div>

      {/* ── Section 2: MÜŞTERİ ISISI HARİTASI ──────────────────────────────── */}
      <SectionHeader title={l.aiHeatMap ?? 'MÜŞTERİ ISISI HARİTASI'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        {heatCards.map((card) => (
          <div key={card.title} style={{
            background: card.bg, border: `1px solid ${t.bd}`, borderRadius: 10,
            padding: '16px 18px', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 12, right: 14, color: card.color, opacity: 0.5 }}>
              <Icon name="chevRight" size={14} color={card.color} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{card.title}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>{card.count}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#475569' }}>CVR</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: card.color }}>%{card.cvr}</span>
            </div>
            {/* Mini bar */}
            <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${card.barPct}%`, background: card.color, borderRadius: 3 }} />
            </div>
            {card.steps > 0 && (
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
                {card.steps} next steps | {card.pipeline} pipeline
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Section 3: HAFTALIK AKSİYON LİSTESİ ─────────────────────────────── */}
      <SectionHeader title={l.aiAksiyonlar ?? 'AKSİYON LİSTESİ'} t={t} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: `2px solid ${t.bd}` }}>
        {([
          { key: 'haftalik', label: lang === 'tr' ? 'Haftalık' : 'Weekly' },
          { key: 'aylik', label: lang === 'tr' ? 'Aylık' : 'Monthly' },
          { key: 'ceyreklik', label: lang === 'tr' ? 'Çeyreklik' : 'Quarterly' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActionTab(tab.key)}
            style={{
              padding: '8px 20px', fontSize: 12, fontWeight: actionTab === tab.key ? 600 : 400,
              color: actionTab === tab.key ? t.pr : t.tx2,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: actionTab === tab.key ? `2px solid ${t.pr}` : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {actionCards.map((card) => (
          <div key={card.title} style={{
            background: t.cd, border: `1px solid ${t.bd}`, borderLeft: `4px solid ${card.borderColor}`,
            borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{card.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.tx, marginBottom: 3 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: t.tx2, marginBottom: 2 }}>{card.desc}</div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{card.detail}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: card.badgeColor, background: card.badgeColor + '18', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {card.badge}
            </span>
            <button onClick={() => window.open('#', '_blank')} style={{
              padding: '6px 14px', borderRadius: 7, border: `1px solid ${t.bd}`,
              background: t.bg2, color: t.pr, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {lang === 'tr' ? 'Aksiyonları Gör →' : 'View Actions →'}
            </button>
          </div>
        ))}
      </div>

      {/* ── Section 4: AI AGENT'LAR ──────────────────────────────────────────── */}
      <SectionHeader title={l.aiAgents ?? "AI AGENT'LAR"} t={t} />

      <div style={{ fontSize: 11, color: t.tx2, marginBottom: 12, marginTop: -4 }}>
        {lang === 'tr'
          ? "Bu agent'lar belirlenen periyodlarda otomatik çalışır ve sonuçları bildirim olarak gönderir."
          : 'These agents run automatically at set intervals and send results as notifications.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {agents.map((agent, idx) => {
          const isLive = agentStates[idx];
          return (
            <div key={idx} style={{
              background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10,
              padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
              opacity: isLive ? 1 : 0.6,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{agent.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{agent.name}</div>
                <div style={{ fontSize: 10, color: t.tx2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.desc}</div>
              </div>
              {/* Trigger badge */}
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap',
                color: agent.trigger === 'Scheduled' ? '#3B82F6' : '#D97706',
                background: agent.trigger === 'Scheduled' ? '#DBEAFE' : '#FEF3C7',
              }}>
                {agent.trigger}
              </span>
              {/* Last run */}
              <span style={{ fontSize: 10, color: t.tx3, whiteSpace: 'nowrap', width: 80 }}>{tTerm(agent.lastRun)}</span>
              {/* Toggle */}
              <button
                onClick={() => toggleAgent(idx)}
                style={{
                  width: 38, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isLive ? '#16A34A' : '#CBD5E1',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: isLive ? 20 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
              <span style={{ fontSize: 9, fontWeight: 600, color: isLive ? '#16A34A' : '#94A3B8', width: 36 }}>
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Section 5: ÖNERİ DETAY TABLOSU ──────────────────────────────────── */}
      <SectionHeader title={l.aiOneriDetay ?? 'AI ÖNERİLERİ — DETAYLI LİSTE'} t={t} />

      <div id="ai-rec-table" style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Toolbar + filter chips */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.aiOneriTablo ?? 'AI Önerileri — Detaylı Liste'}</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
              <Icon name="download" size={12} color={t.tx3} />
              Excel
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIP_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTipFilter(f)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${tipFilter === f ? t.pr : t.bd}`,
                  background: tipFilter === f ? t.prL : 'transparent',
                  color: tipFilter === f ? t.pr : t.tx3,
                }}
              >
                {tTerm(f)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {[
                  { key: 'oncelik', label: '', align: 'center', w: 36 },
                  { key: 'tip', label: 'Aksiyon Tipi', align: 'left' },
                  { key: 'firma', label: 'Firma/Deal', align: 'left' },
                  { key: 'aciklama', label: 'Öneri Açıklaması', align: 'left' },
                  { key: 'deger', label: 'Potansiyel Değer', align: 'right' },
                  { key: 'sonAktivite', label: 'Son Aktivite', align: 'right' },
                  { key: 'sorumlu', label: 'Sorumlu', align: 'left' },
                  { key: 'durum', label: 'Durum', align: 'center' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleRecSort(col.key)}
                    style={{
                      padding: '8px 10px', fontSize: 10, fontWeight: 600,
                      color: recSort.key === col.key ? t.pr : t.tx2,
                      textAlign: col.align as 'left' | 'right' | 'center',
                      whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
                      width: col.w,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecs.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 14 }}>{r.oncelik}</td>
                  <td style={{ padding: '8px 10px' }}>{tipBadge(r.tip)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: t.tx, whiteSpace: 'nowrap' }}>{r.firma}</td>
                  <td style={{ padding: '8px 10px', fontSize: 10, color: t.tx2, maxWidth: 260, lineHeight: 1.4 }}>{r.aciklama}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', fontWeight: 600, color: t.tx }}>{fmtTL(r.deger)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 10, textAlign: 'right', color: t.tx2 }}>{tTerm(r.sonAktivite)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: t.tx2, whiteSpace: 'nowrap' }}>{r.sorumlu}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{durumBadge(r.durum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
