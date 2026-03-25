import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
  ScatterChart, Scatter, ZAxis, Cell,
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

interface RepComm {
  id: string; name: string; color: string;
  email: number; acilma: number; telefon: number; gorSuresi: number;
  yanitOrani: number; kapamaSuresi: number; aktivite: number;
  kapananDeal: number; ciro: number; hedefPct: number;
  meeting: number;
}

const REPS: RepComm[] = [
  { id: 'ayse', name: 'Ayşe Kara', color: '#16A34A', email: 520, acilma: 38.5, telefon: 168, gorSuresi: 10.2, yanitOrani: 28.4, kapamaSuresi: 26, aktivite: 8.2, kapananDeal: 28, ciro: 1820000, hedefPct: 112, meeting: 42 },
  { id: 'mehmet', name: 'Mehmet Demir', color: '#3B82F6', email: 410, acilma: 32.1, telefon: 142, gorSuresi: 8.8, yanitOrani: 24.2, kapamaSuresi: 34, aktivite: 7.4, kapananDeal: 22, ciro: 1540000, hedefPct: 96, meeting: 38 },
  { id: 'elif', name: 'Elif Sarı', color: '#7C3AED', email: 380, acilma: 35.8, telefon: 128, gorSuresi: 9.1, yanitOrani: 26.8, kapamaSuresi: 28, aktivite: 7.1, kapananDeal: 20, ciro: 1438000, hedefPct: 91, meeting: 35 },
  { id: 'can', name: 'Can Yılmaz', color: '#D97706', email: 320, acilma: 28.4, telefon: 108, gorSuresi: 6.4, yanitOrani: 19.2, kapamaSuresi: 38, aktivite: 6.8, kapananDeal: 18, ciro: 1280000, hedefPct: 82, meeting: 28 },
  { id: 'burak', name: 'Burak Aydın', color: '#DC2626', email: 210, acilma: 18.2, telefon: 78, gorSuresi: 4.2, yanitOrani: 12.5, kapamaSuresi: 52, aktivite: 5.2, kapananDeal: 12, ciro: 890000, hedefPct: 58, meeting: 18 },
];

const activityBarData = REPS.map((r) => ({
  name: r.name.split(' ')[0] + ' ' + r.name.split(' ')[1][0] + '.',
  email: r.email, telefon: r.telefon, meeting: r.meeting,
}));

// Daily activity (30 days)
const dailyActivity = Array.from({ length: 30 }, (_, i) => {
  const isWeekend = (i % 7 === 5) || (i % 7 === 6);
  return {
    day: i + 1,
    email: isWeekend ? Math.round(3 + Math.random() * 5) : Math.round(40 + Math.random() * 25),
    telefon: isWeekend ? Math.round(1 + Math.random() * 3) : Math.round(15 + Math.random() * 12),
    meeting: isWeekend ? 0 : Math.round(3 + Math.random() * 6),
  };
});

const scatterData = REPS.map((r) => ({
  name: r.name.split(' ')[0] + ' ' + r.name.split(' ')[1][0] + '.',
  x: Math.round((r.email + r.telefon + r.meeting) / 4.2), // weekly
  y: Math.round(r.ciro / 1000 * 0.23), // deal value
  color: r.color,
}));

const channelEfficiency = [
  { kanal: 'E-posta', yapilan: 1840, sonuc: 420, oran: 22.8 },
  { kanal: 'Telefon', yapilan: 624, sonuc: 312, oran: 50.0 },
  { kanal: 'Meeting', yapilan: 161, sonuc: 148, oran: 91.9 },
];

const aiCards = [
  { name: 'Ayşe Kara', skor: 8.4, sentiment: 'Pozitif', sentColor: '#16A34A', sentBg: '#D1FAE5', topics: 'Bütçe planlaması, Q4 teslimat, özel fiyat', oneri: 'Müşteri fiyat hassasiyeti gösteriyor, bundle teklif önerilir', borderColor: '#16A34A', skorColor: '#16A34A' },
  { name: 'Can Yılmaz', skor: 5.8, sentiment: 'Nötr', sentColor: '#64748B', sentBg: '#F1F5F9', topics: 'Teslimat gecikmesi, ürün değişikliği', oneri: 'Görüşmelerde çözüm odaklı yaklaşım artırılmalı', borderColor: '#D97706', skorColor: '#D97706' },
  { name: 'Burak Aydın', skor: 4.2, sentiment: 'Karışık', sentColor: '#D97706', sentBg: '#FEF3C7', topics: 'Fiyat şikayeti, alternatif arayışı', oneri: 'Değer önerisi eğitimi önerilir, müşteri kaybı riski', borderColor: '#DC2626', skorColor: '#DC2626' },
];

const timeline = [
  { date: '22 Mar', icon: '📧', type: 'E-posta', desc: 'Q4 hediye kataloğu gönderildi', owner: 'Ayşe K.' },
  { date: '18 Mar', icon: '📞', type: 'Telefon', desc: 'Bütçe görüşmesi, 15dk', owner: 'Ayşe K.' },
  { date: '12 Mar', icon: '📧', type: 'E-posta', desc: 'Teklif gönderildi — 280K ₺', owner: 'Ayşe K.' },
  { date: '8 Mar', icon: '🤝', type: 'Meeting', desc: 'Yüz yüze toplantı, İstanbul ofis', owner: 'Ayşe K.' },
  { date: '1 Mar', icon: '🌐', type: 'Website', desc: 'Ürün kataloğu incelendi, 8 sayfa', owner: '' },
  { date: '25 Şub', icon: '📧', type: 'E-posta', desc: 'İlk temas — tanışma maili', owner: 'Ayşe K.' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2).replace('.', ',')}M ₺`
    : v >= 1_000 ? `${Math.round(v / 1_000).toLocaleString('tr-TR')}K ₺`
      : `${v.toLocaleString('tr-TR')} ₺`;

type CellColor = { bg: string; color: string };
const GN: CellColor = { bg: '#F0FDF4', color: '#16A34A' };
const AM: CellColor = { bg: '#FFFBEB', color: '#D97706' };
const RD: CellColor = { bg: '#FEF2F2', color: '#DC2626' };
const NL: CellColor = { bg: 'transparent', color: '' };

const emailColor = (v: number): CellColor => v >= 400 ? GN : v >= 300 ? NL : RD;
const acilmaColor = (v: number): CellColor => v >= 30 ? GN : v >= 20 ? AM : RD;
const telefonColor = (v: number): CellColor => v >= 130 ? GN : v >= 100 ? AM : RD;
const gorSuresiColor = (v: number): CellColor => v >= 8 ? GN : v >= 5 ? AM : RD;
const yanitColor = (v: number): CellColor => v >= 25 ? GN : v >= 15 ? AM : RD;
const kapamaColor = (v: number): CellColor => v < 30 ? GN : v <= 45 ? AM : RD;
const aktiviteColor = (v: number): CellColor => v >= 7 ? GN : v >= 5 ? AM : RD;

const hedefBarColor = (pct: number, t: Theme) =>
  pct >= 100 ? t.gn : pct >= 80 ? '#22C55E' : pct >= 60 ? t.am : t.rd;

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesCommunication = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [selectedFirma] = useState('Koç Holding');
  const avgDeal = REPS.reduce((s, r) => s + r.kapananDeal, 0) / REPS.length;

  const cellStyle = (cc: CellColor, bold = false): React.CSSProperties => ({
    padding: '8px 10px', fontSize: 11, textAlign: 'right' as const,
    background: cc.bg, color: cc.color || t.tx,
    fontWeight: bold ? 700 : 600,
  });

  return (
    <>
      {/* ── Section 1: İLETİŞİM METRİKLERİ ──────────────────────────────────── */}
      <SectionHeader title={l.commMetrikler ?? 'İLETİŞİM METRİKLERİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="comm-email" title={l.commEmail ?? 'E-posta Gönderilen'} value="1.840" trendValue="+8,2%" sparkTrend="up" color="pr" unit="adet" big {...kp} />
        <KPICard id="comm-acilma" title={l.commAcilma ?? 'E-posta Açılma Oranı'} value="%34,2" trendValue="+2,1pp" sparkTrend="up" color="gn" unit="%" big {...kp} />
        <KPICard id="comm-telefon" title={l.commTelefon ?? 'Telefon Görüşmesi'} value="624" trendValue="+12,5%" sparkTrend="up" color="tl" unit="adet" big {...kp} />
        <KPICard id="comm-sure" title={l.commGorSuresi ?? 'Ort. Görüşme Süresi'} value="8,4 dk" trendValue="+1,2 dk" sparkTrend="up" color="gn" unit="dk" big {...kp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="comm-yanit" title={l.commYanit ?? 'Yanıt Alma Oranı'} value="%22,8" trendValue="+3,4pp" sparkTrend="up" color="gn" unit="%" {...kp} />
        <KPICard id="comm-aktivite" title={l.commAktivite ?? 'Aktivite Skoru (Ekip)'} value="6,8/10" trendValue="+0,4" sparkTrend="up" color="tl" unit="" {...kp} />
        <KPICard id="comm-kapama" title={l.commKapama ?? 'Ort. Satış Kapanma Süresi'} value="32 Gün" trendValue="-4 gün" sparkTrend="down" color="gn" unit="gün" {...kp} />
      </div>

      {/* ── Section 2: UZMAN PERFORMANS TABLOSU ──────────────────────────────── */}
      <SectionHeader title={l.commUzmanTablo ?? 'UZMAN İLETİŞİM PERFORMANS TABLOSU'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.commUzmanGrid ?? 'Uzman İletişim Performans Karşılaştırma'}</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} />
            Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {['Uzman', 'E-posta', 'Açılma %', 'Telefon', 'Ort. Süre', 'Yanıt %', 'Kapama Gün', 'Aktivite', 'Deal', 'Toplam Ciro'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: t.tx2, textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPS.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${t.bd}` }}>
                  <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: t.tx }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                      {r.name}
                    </div>
                  </td>
                  <td style={cellStyle(emailColor(r.email))}>{r.email}</td>
                  <td style={cellStyle(acilmaColor(r.acilma))}>%{r.acilma}</td>
                  <td style={cellStyle(telefonColor(r.telefon))}>{r.telefon}</td>
                  <td style={cellStyle(gorSuresiColor(r.gorSuresi))}>{r.gorSuresi} dk</td>
                  <td style={cellStyle(yanitColor(r.yanitOrani))}>%{r.yanitOrani}</td>
                  <td style={cellStyle(kapamaColor(r.kapamaSuresi))}>{r.kapamaSuresi} gün</td>
                  <td style={cellStyle(aktiviteColor(r.aktivite))}>{r.aktivite}/10</td>
                  <td style={cellStyle(r.kapananDeal >= avgDeal ? GN : RD)}>{r.kapananDeal}</td>
                  <td style={{ padding: '8px 10px', width: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ flex: 1, height: 7, background: t.bg2, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: `${(100 / 120) * 100}%`, top: 0, bottom: 0, width: 1, background: t.tx3, opacity: 0.3 }} />
                        <div style={{ height: '100%', width: `${Math.min(r.hedefPct, 120) / 120 * 100}%`, background: hedefBarColor(r.hedefPct, t), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: hedefBarColor(r.hedefPct, t), width: 28 }}>%{r.hedefPct}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: AKTİVİTE KARŞILAŞTIRMA & TREND ───────────────────────── */}
      <SectionHeader title={l.commAktiviteTrend ?? 'AKTİVİTE KARŞILAŞTIRMA & TREND'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Horizontal stacked bar */}
        <ChartContainer t={t} l={l} title={l.commAktiviteDagilim ?? 'Uzman Bazlı Aktivite Dağılımı'} id="comm-chart-aktivite" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={activityBarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 0 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="email" name="E-posta" stackId="a" fill="#818CF8" />
              <Bar dataKey="telefon" name="Telefon" stackId="a" fill="#0D9488" />
              <Bar dataKey="meeting" name="Meeting" stackId="a" fill="#D97706" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Daily activity trend */}
        <ChartContainer t={t} l={l} title={l.commGunlukTrend ?? 'Günlük Aktivite Trendi (Son 30 Gün)'} id="comm-chart-daily" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyActivity} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="email" name="E-posta" stackId="1" stroke="#818CF8" fill="#818CF8" fillOpacity={0.4} />
              <Area type="monotone" dataKey="telefon" name="Telefon" stackId="1" stroke="#0D9488" fill="#0D9488" fillOpacity={0.4} />
              <Area type="monotone" dataKey="meeting" name="Meeting" stackId="1" stroke="#D97706" fill="#D97706" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 4: İLETİŞİM → SONUÇ KORELASYONU ─────────────────────────── */}
      <SectionHeader title={l.commKorelasyon ?? 'İLETİŞİM → SONUÇ KORELASYONU'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Scatter */}
        <ChartContainer t={t} l={l} title={l.commScatter ?? 'İletişim Hacmi vs Deal Kapanma'} id="comm-chart-scatter" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="x" name="Haftalık İletişim" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} label={{ value: 'Haftalık İletişim', position: 'insideBottom', offset: -5, fontSize: 9, fill: t.tx3 }} />
              <YAxis type="number" dataKey="y" name="Kapanan Deal (K ₺)" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} label={{ value: 'Deal (K ₺)', angle: -90, position: 'insideLeft', fontSize: 9, fill: t.tx3 }} />
              <ZAxis range={[60, 60]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>İletişim: {payload[0].payload.x}/hafta</div>
                      <div style={{ color: t.tx2 }}>Deal: {payload[0].payload.y}K ₺</div>
                    </div>
                  ) : null
                }
              />
              <Scatter
                data={scatterData}
                shape={(props: { cx?: number; cy?: number; payload?: { name: string; color: string } }) => {
                  const { cx = 0, cy = 0, payload } = props;
                  if (!payload) return <g />;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={7} fill={payload.color} opacity={0.85} />
                      <text x={cx} y={cy - 12} textAnchor="middle" fontSize={9} fill={t.tx2} fontWeight={500}>{payload.name}</text>
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx2, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
            {lang === 'tr' ? 'Haftalık 15+ iletişim yapan uzmanlar %40 daha yüksek kapama oranı gösteriyor' : 'Reps with 15+ weekly touchpoints show 40% higher close rates'}
          </div>
        </ChartContainer>

        {/* Channel efficiency */}
        <ChartContainer t={t} l={l} title={l.commKanalEtkinlik ?? 'Kanal Etkinliği Karşılaştırma'} id="comm-chart-kanal" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelEfficiency} margin={{ top: 20, right: 20, bottom: 0, left: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="kanal" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="yapilan" name={lang === 'tr' ? 'Yapılan' : 'Attempted'} fill={t.tx3} opacity={0.3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sonuc" name={lang === 'tr' ? 'Sonuç Getiren' : 'Successful'} fill={t.gn} opacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Efficiency labels */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 40px 0' }}>
            {channelEfficiency.map((c) => (
              <span key={c.kanal} style={{ fontSize: 10, fontWeight: 600, color: t.pr }}>%{c.oran}</span>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* ── Section 5: AI GÖRÜŞME ANALİZİ ────────────────────────────────────── */}
      <SectionHeader title={l.commAIAnaliz ?? 'AI GÖRÜŞME ANALİZİ'} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {aiCards.map((card) => (
          <div key={card.name} style={{
            background: t.cd, border: `1px solid ${t.bd}`, borderLeft: `4px solid ${card.borderColor}`,
            borderRadius: 10, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{card.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: card.sentColor, background: card.sentBg, padding: '2px 8px', borderRadius: 4 }}>{card.sentiment}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.skorColor, marginBottom: 8 }}>
              {card.skor}<span style={{ fontSize: 14, fontWeight: 500, color: t.tx3 }}>/10</span>
            </div>
            <div style={{ fontSize: 10, color: t.tx3, marginBottom: 4 }}>Key Topics</div>
            <div style={{ fontSize: 11, color: t.tx2, marginBottom: 10, lineHeight: 1.4 }}>{card.topics}</div>
            <div style={{ background: t.bg2, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: t.pr, marginBottom: 2 }}>AI Öneri</div>
              <div style={{ fontSize: 10, color: t.tx2, lineHeight: 1.4 }}>{card.oneri}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 6: TOUCHPOINT TIMELINE ────────────────────────────────────── */}
      <SectionHeader title={l.commTimeline ?? 'MÜŞTERİ TOUCHPOINT TIMELINE'} t={t} />

      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: t.tx2 }}>{lang === 'tr' ? 'Firma:' : 'Company:'}</span>
          <div style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, fontSize: 12, fontWeight: 500, color: t.tx }}>
            {selectedFirma} ▾
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {timeline.map((tp, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < timeline.length - 1 ? 20 : 0 }}>
              {/* Timeline line */}
              {i < timeline.length - 1 && (
                <div style={{ position: 'absolute', left: 15, top: 26, bottom: 0, width: 2, background: t.bd }} />
              )}
              {/* Date */}
              <div style={{ width: 50, flexShrink: 0, fontSize: 10, fontWeight: 600, color: t.tx2, paddingTop: 4 }}>{tp.date}</div>
              {/* Dot */}
              <div style={{ width: 30, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                <span style={{ fontSize: 16 }}>{tp.icon}</span>
              </div>
              {/* Content */}
              <div style={{ flex: 1, background: t.bg2, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: t.pr }}>{tp.type}</span>
                  {tp.owner && <span style={{ fontSize: 10, color: t.tx3 }}>• {tp.owner}</span>}
                </div>
                <div style={{ fontSize: 11, color: t.tx }}>{tp.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
