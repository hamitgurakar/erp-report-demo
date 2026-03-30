import { useState } from 'react';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';
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

const monthlyRevenue = [
  { month: 'Oca', b2bMuhiku: 420, b2bProject: 180 },
  { month: 'Şub', b2bMuhiku: 480, b2bProject: 210 },
  { month: 'Mar', b2bMuhiku: 530, b2bProject: 240 },
  { month: 'Nis', b2bMuhiku: 510, b2bProject: 230 },
  { month: 'May', b2bMuhiku: 560, b2bProject: 260 },
  { month: 'Haz', b2bMuhiku: 620, b2bProject: 290 },
  { month: 'Tem', b2bMuhiku: 640, b2bProject: 310 },
  { month: 'Ağu', b2bMuhiku: 680, b2bProject: 340 },
];

const revenueDonut = [
  { name: 'b2b.muhiku.com', value: 65, amount: '4.530K ₺', color: '#818CF8' },
  { name: 'B2B Project', value: 35, amount: '2.439K ₺', color: '#4F46E5' },
];

const targetData = [
  { quarter: 'Q1 2025', hedef: 35000, gerceklesen: 32000, sapma: -8.6, hit: false },
  { quarter: 'Q2 2025', hedef: 40000, gerceklesen: 44000, sapma: 10.0, hit: true },
  { quarter: 'Q3 2025', hedef: 38000, gerceklesen: 36000, sapma: -5.3, hit: false },
  { quarter: 'Q4 2025', hedef: 42000, gerceklesen: 45000, sapma: 7.1, hit: true },
];

const top10Products = [
  { name: 'Corporate Hamper XL', ciro: 482000 },
  { name: 'Wellness Kit Premium', ciro: 376000 },
  { name: 'Executive Gift Box', ciro: 348000 },
  { name: 'Gourmet Selection Pack', ciro: 312000 },
  { name: 'Premium Textile Set', ciro: 289000 },
  { name: 'Organic Care Bundle', ciro: 267000 },
  { name: 'Corporate Notebook Set', ciro: 234000 },
  { name: 'Tech Accessory Pack', ciro: 218000 },
  { name: 'Artisan Coffee Collection', ciro: 196000 },
  { name: 'Holiday Special Box', ciro: 184000 },
];

const top10Customers = [
  { name: 'Koç Holding', ciro: 624000 },
  { name: 'Arçelik A.Ş.', ciro: 518000 },
  { name: 'Turkcell İletişim', ciro: 472000 },
  { name: 'Sabancı Holding', ciro: 398000 },
  { name: 'THY Genel Müdürlük', ciro: 367000 },
  { name: 'Eczacıbaşı Holding', ciro: 312000 },
  { name: 'Garanti BBVA', ciro: 289000 },
  { name: 'Doğuş Otomotiv', ciro: 256000 },
  { name: 'Vestel Elektronik', ciro: 234000 },
  { name: 'Pegasus Hava Yolları', ciro: 198000 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000
      ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

const fmtK = (v: number) => `${(v / 1000).toLocaleString('tr-TR')}K`;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesOverview = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const totalDonut = revenueDonut.reduce((s, d) => s + d.value, 0);
  const [bkMode, setBkMode] = useState('TL');
  const [nkMode, setNkMode] = useState('TL');

  return (
    <>
      {/* ── Section 1: GENEL PERFORMANS ──────────────────────────────────────── */}
      <SectionHeader title={l.satisGenelPerf ?? 'GENEL PERFORMANS'} t={t} />

      {/* Row 1 — 5 big KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="satis-toplam-ciro" title={l.satisToplamCiro ?? 'Toplam Ciro (Net)'} value="6.968.908 ₺" trendValue="+12,5%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="satis-brut-kar" title={l.satisBrutKar ?? 'Brüt Kâr'} value="860.000 ₺" trendValue="+9,8%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState={bkMode} onToggle={setBkMode} altValue="%25,3" {...kp} />
        <KPICard id="satis-net-kar" title={l.satisNetKar ?? 'Net Kâr'} value="425.000 ₺" trendValue="+8,3%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState={nkMode} onToggle={setNkMode} altValue="%15,7" {...kp} />
        <KPICard id="satis-siparis-sayisi" title={l.satisSiparisSayisi ?? 'Sipariş Sayısı'} value="2.847" trendValue="+5,1%" sparkTrend="up" color="c1" unit="adet" big {...kp} />
        <KPICard id="satis-aov" title={l.satisAOV ?? 'Ort. Sipariş Tutarı (AOV)'} value="632,40 ₺" trendValue="+7,0%" sparkTrend="up" color="tl" unit="₺" big {...kp} />
      </div>

      {/* Row 2 — 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="satis-pipeline" title={l.satisPipeline ?? 'Pipeline Değeri'} value="2.100.000 ₺" trendValue="+14,2%" sparkTrend="up" color="pr" unit="K ₺" {...kp} />
        <KPICard id="satis-winrate" title={l.satisWinRate ?? 'Win Rate'} value="%26,97" trendValue="+3,8%" sparkTrend="up" color="gn" unit="%" {...kp} />
        <KPICard id="satis-yeni-musteri" title={l.satisYeniMusteri ?? 'Yeni Müşteri Sayısı'} value="47" trendValue="+12%" sparkTrend="up" color="tl" unit="adet" {...kp} />
        <KPICard id="satis-dongu" title={l.satisDongu ?? 'Ort. Satış Döngüsü'} value="24 Gün" trendValue="-3 gün" sparkTrend="down" color="gn" unit="gün" {...kp} />
      </div>

      {/* Row 3 — 4 KPIs (Tahsilat) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="satis-gelecek-tahsilat" title={l.satisGelecekTahsilat ?? 'Gelecek Tahsilatlar'} value="1.840.000 ₺" trendValue="+8,2%" sparkTrend="up" color="gn" unit="K ₺" info={lang === 'tr' ? 'Önümüzdeki 30 gün beklenen' : 'Expected next 30 days'} {...kp} />
        <KPICard id="satis-ort-tahsilat" title={l.satisOrtTahsilat ?? 'Ortalama Tahsilat Süresi'} value="38 Gün" trendValue="-2 gün" sparkTrend="down" color="gn" unit="gün" {...kp} />
        <KPICard id="satis-gecikme-tahsilat" title={l.satisGecikmeTahsilat ?? 'Gecikmedeki Tahsilatlar'} value="425.000 ₺" trendValue="+12,5%" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
        <KPICard id="satis-gecikme-sirket" title={l.satisGecikmeSirket ?? 'Gecikmedeki Tahsilat - Şirketler'} value="18" trendValue="+3" sparkTrend="up" color="rd" unit="adet" info={lang === 'tr' ? 'Vadesi geçmiş şirket sayısı' : 'Overdue company count'} {...kp} />
      </div>

      {/* Row 4 — 3 KPIs (Gecikme, kırmızı sol border ile vurgulu) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { id: 'satis-geciken-proje', title: lang === 'tr' ? 'Geciken Projeler' : 'Delayed Projects', value: '12', trend: '+2', info: lang === 'tr' ? 'Teslimatı geciken proje sayısı' : 'Projects with delayed delivery' },
          { id: 'satis-geciken-teslimat', title: lang === 'tr' ? 'Geciken Teslimatlar' : 'Delayed Deliveries', value: '847', trend: '+124', info: lang === 'tr' ? 'Geciken sipariş/kutu adedi' : 'Delayed order/box count' },
          { id: 'satis-geciken-ciro', title: lang === 'tr' ? 'Geciken Teslimat Cirosu' : 'Delayed Delivery Revenue', value: '2.180.000 ₺', trend: '+15,4%', info: lang === 'tr' ? 'Geciken projelerin toplam ciro değeri' : 'Total revenue of delayed projects' },
        ].map((card) => (
          <div key={card.id} style={{ borderLeft: '3px solid #FCA5A5', borderRadius: 10 }}>
            <KPICard id={card.id} title={card.title} value={card.value} trendValue={card.trend} sparkTrend="up" color="rd" unit={card.value.includes('₺') ? 'K ₺' : 'adet'} info={card.info} {...kp} />
          </div>
        ))}
      </div>

      {/* ── Section 2: CİRO TRENDİ & GELİR DAĞILIMI ────────────────────────── */}
      <SectionHeader title={l.satisCiroTrend ?? 'CİRO TRENDİ & GELİR DAĞILIMI'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Stacked Area — Aylık Ciro Trendi (Kanal Kırılımlı) */}
        <ChartContainer t={t} l={l} title={l.satisAylikCiroKanal ?? 'Aylık Ciro Trendi (Kanal Kırılımlı)'} id="satis-chart-cirotrend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value}K ₺`, name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Area type="monotone" dataKey="b2bProject" name="B2B Project" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.85} />
              <Area type="monotone" dataKey="b2bMuhiku" name="b2b.muhiku.com" stackId="1" stroke="#818CF8" fill="#818CF8" fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Donut — Gelir Dağılımı */}
        <ChartContainer t={t} l={l} title={l.satisGelirDagilimi ?? 'Gelir Dağılımı'} id="satis-chart-dagilim" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={revenueDonut} cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" strokeWidth={0}>
                    {revenueDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`%${value}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.tx }}>6.969K ₺</div>
                <div style={{ fontSize: 9, color: t.tx2 }}>{l.toplam ?? 'Toplam'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '0 8px' }}>
              {revenueDonut.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.tx2, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{d.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 3: HEDEF TUTARLILIĞI ─────────────────────────────────────── */}
      <SectionHeader title={l.satisHedefTutarliligi ?? 'HEDEF TUTARLILIĞI'} t={t} />

      <div style={{ marginBottom: 12 }}>
        <ChartContainer t={t} l={l} title={l.satisHedefChart ?? 'Hedef Tutarlılığı (Çeyreklik)'} id="satis-chart-hedef" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={targetData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v)} />
              <Tooltip
                contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [fmtK(value), name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hedef" name={l.hedef ?? 'Hedef'} fill={t.tx3} opacity={0.35} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gerceklesen" name={l.gerceklesen ?? 'Gerçekleşen'} radius={[4, 4, 0, 0]}>
                {targetData.map((d, i) => (
                  <Cell key={i} fill={d.hit ? t.gn : t.rd} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Sapma labels under chart */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 40px 0' }}>
            {targetData.map((d) => (
              <span key={d.quarter} style={{ fontSize: 11, fontWeight: 600, color: d.hit ? t.gn : t.rd }}>
                {d.sapma > 0 ? '+' : ''}{d.sapma}%
              </span>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 4: TOP 10 ÜRÜN & TOP 10 MÜŞTERİ ─────────────────────────── */}
      <SectionHeader title={l.satisTopUrunMusteri ?? 'TOP 10 ÜRÜN & TOP 10 MÜŞTERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Top 10 Ürün */}
        <ChartContainer t={t} l={l} title={l.satisTop10Urun ?? 'Top 10 Ürün'} id="satis-chart-topurun" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {top10Products.map((p, i) => {
              const maxCiro = top10Products[0].ciro;
              const pct = (p.ciro / maxCiro) * 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: t.tx3, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: t.tx, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: t.tx, flexShrink: 0, marginLeft: 8 }}>{fmtTL(p.ciro)}</span>
                    </div>
                    <div style={{ height: 5, background: t.bg2, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${t.pr}, #818CF8)`, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button
              onClick={() => window.open('#', '_blank')}
              style={{ fontSize: 11, fontWeight: 500, color: t.pr, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {l.tumunuGor ?? 'Tümünü Gör'} →
            </button>
          </div>
        </ChartContainer>

        {/* Top 10 Müşteri */}
        <ChartContainer t={t} l={l} title={l.satisTop10Musteri ?? 'Top 10 Müşteri'} id="satis-chart-topmusteri" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {top10Customers.map((c, i) => {
              const maxCiro = top10Customers[0].ciro;
              const pct = (c.ciro / maxCiro) * 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: t.tx3, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: t.tx, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: t.tx, flexShrink: 0, marginLeft: 8 }}>{fmtTL(c.ciro)}</span>
                    </div>
                    <div style={{ height: 5, background: t.bg2, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${t.tl}, #5EEAD4)`, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button
              onClick={() => window.open('#', '_blank')}
              style={{ fontSize: 11, fontWeight: 500, color: t.pr, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {l.tumunuGor ?? 'Tümünü Gör'} →
            </button>
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 5: KRİTİK UYARILAR ──────────────────────────────────────── */}
      <SectionHeader title={l.satisKritikUyarilar ?? 'KRİTİK UYARILAR'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          {
            title: l.satisAlertStok ?? 'Kritik Stok',
            desc: l.satisAlertStokD ?? '7 üründe stok kritik seviyede',
            color: t.rd,
            icon: 'alertTriangle' as const,
          },
          {
            title: l.satisAlertTeslimat ?? 'Geciken Teslimat',
            desc: l.satisAlertTeslimatD ?? '12 siparişte teslimat gecikmesi',
            color: t.am,
            icon: 'clock' as const,
          },
          {
            title: l.satisAlertAlacak ?? 'Vadesi Geçmiş Alacak',
            desc: l.satisAlertAlacakD ?? '128.000 ₺ vadesi geçmiş',
            color: '#F97316',
            icon: 'alertTriangle' as const,
          },
        ].map((alert) => (
          <div
            key={alert.title}
            style={{
              background: t.cd,
              border: `1px solid ${t.bd}`,
              borderLeft: `4px solid ${alert.color}`,
              borderRadius: 10,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={alert.icon} size={16} color={alert.color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: t.tx }}>{alert.title}</span>
            </div>
            <span style={{ fontSize: 12, color: t.tx2, lineHeight: 1.5 }}>{alert.desc}</span>
            <button
              onClick={() => window.open('#', '_blank')}
              style={{
                alignSelf: 'flex-start',
                marginTop: 4,
                fontSize: 11,
                fontWeight: 500,
                color: t.pr,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {l.detayGor ?? 'Detay'} →
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
