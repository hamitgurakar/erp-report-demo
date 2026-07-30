import { useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ComposedChart, Bar, Line, Area, LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import {
  getTicketKpis, getTicketTrend, getSegmentBreakdown, getGeoByProvince,
} from '../../constants/supportData';
import { TR_PROVINCES, TR_GRID_COLS, TR_GRID_ROWS } from '../../constants/trProvinces';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard,
} from '../../components/finance';
import type { FinancePageProps } from '../finance/_Placeholder';

const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const fmtMMSS = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const TicketAnalizi = ({ t, lang }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const kp = useMemo(() => getTicketKpis(), []);
  const trend = useMemo(() => getTicketTrend(), []);
  const segments = useMemo(() => getSegmentBreakdown(), []);
  const geo = useMemo(() => getGeoByProvince(), []);

  const [hover, setHover] = useState<{ x: number; y: number; name: string; count: number } | null>(null);

  const st = (v: number, g: number, y: number, dir: 'up' | 'down' = 'up') => {
    const good = dir === 'up' ? v >= g : v <= g; const warn = dir === 'up' ? v >= y : v <= y;
    return good ? t.gn : warn ? t.am : t.rd;
  };

  // il yoğunluk map (isim → sayı)
  const geoMap = useMemo(() => { const m = new Map<string, number>(); geo.forEach((g) => m.set(g.province, g.count)); return m; }, [geo]);
  const geoMax = Math.max(...geo.map((g) => g.count), 1);
  const CELL = 30, TILE = 26;
  const fillFor = (count: number) => {
    if (!count) return t.bg2;
    const a = Math.max(0.14, count / geoMax);
    return `rgba(79,70,229,${a.toFixed(2)})`;
  };
  const top10 = geo.slice(0, 10).map((g) => ({ name: g.province, count: g.count }));

  const segData = segments.map((s) => ({ name: s.segment, count: s.count, csat: +s.csat.toFixed(2) }));

  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Ticket & Konuşma Analizi', 'Ticket & Conversation Analysis')}
      subtitle={L('Yeni/çözülen akışı, backlog, reopen, segment ve talep coğrafyası. Son 6 ay.', 'New/resolved flow, backlog, reopen, segment and demand geography. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Açık / Backlog', 'Open / Backlog')} value={fmtInt(kp.backlog.value)} trend={{ value: kp.backlog.mom }} goodDir="down" sparkColor={t.am}
          infoText={L('Çözülmemiş (kaçan/yeniden-açılan) birikmiş talep. Yeni açılan − çözülen kümülatif.', 'Unresolved (abandoned/reopened) accumulated demand. Cumulative new − resolved.')} hint={L('kümülatif açık', 'cumulative open')} />
        <KPICard t={t} lang={lang} title={L('Yeni Açılan (ay)', 'New (month)')} value={fmtInt(kp.yeni.value)} trend={{ value: kp.yeni.mom }} goodDir="up" sparkColor={t.pr}
          infoText={L('Son ayda açılan yeni talep/konuşma adedi. MoM önceki aya göre.', 'New requests/conversations opened last month. MoM vs previous month.')} hint={L('son ay', 'last month')} />
        <KPICard t={t} lang={lang} title="Reopen %" value={`%${kp.reopenPct.value.toFixed(1)}`} trend={{ value: kp.reopenPct.mom }} goodDir="down" sparkColor={st(kp.reopenPct.value, 10, 20, 'down')}
          infoText={L('Çözüldükten sonra yeniden açılan talep oranı. Hedef <%10 (yeşil).', 'Share of tickets reopened after resolution. Target <10% (green).')} hint={L('hedef <%10', 'target <10%')} />
        <KPICard t={t} lang={lang} title={L('Ort. Konuşma/Ticket', 'Avg Talk/Ticket')} value={fmtMMSS(kp.avgKonusma.value)} trend={{ value: kp.avgKonusma.mom }} goodDir="down" sparkColor={t.tl}
          infoText={L('Ticket başına ortalama aktif konuşma/işlem süresi (kaçanlar hariç).', 'Average active talk/handle time per ticket (excluding abandoned).')} hint={L('kaçanlar hariç', 'excl. abandoned')} />
      </KPIBand>

      {/* 1) Yeni vs Çözülen + backlog */}
      <div style={{ marginTop: 18 }}>
        <ChartCard t={t} lang={lang} title={L('Yeni Açılan vs Çözülen Trendi', 'New vs Resolved Trend')}
          why={L('Crisp "new requests" deseni — yeni açılan (bar) + çözülen (çizgi) + backlog (alan). Backlog büyümesi kapasite sinyali.', 'Crisp "new requests" pattern — new (bar) + resolved (line) + backlog (area). Backlog growth signals capacity.')}>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <defs><linearGradient id="tkBacklog" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.am} stopOpacity={0.25} /><stop offset="100%" stopColor={t.am} stopOpacity={0.03} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))}
                formatter={(v: number, n) => [fmtInt(v), n === 'yeni' ? L('Yeni', 'New') : n === 'cozulen' ? L('Çözülen', 'Resolved') : 'Backlog']} />
              <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => (v === 'yeni' ? L('Yeni Açılan', 'New') : v === 'cozulen' ? L('Çözülen', 'Resolved') : 'Backlog')} />
              <Area type="monotone" dataKey="backlog" name="backlog" stroke={t.am} fill="url(#tkBacklog)" strokeWidth={1.5} />
              <Bar dataKey="yeni" name="yeni" fill={t.pr} radius={[2, 2, 0, 0]} barSize={7} />
              <Line type="monotone" dataKey="cozulen" name="cozulen" stroke={t.gn} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2) Konuşma Hacmi + 3) Segment */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={54} title={L('Konuşma Hacmi Trendi', 'Conversation Volume Trend')}
          why={L('Haftalık toplam konuşma/temas hacmi (tüm kanallar). Sezon zirveleri görünür.', 'Weekly total conversation volume (all channels). Season peaks visible.')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))} formatter={(v: number) => [fmtInt(v), L('Konuşma', 'Conversations')]} />
              <Line type="monotone" dataKey="hacim" name={L('Konuşma', 'Conversations')} stroke={t.tl} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={42} title={L('Segment Kırılımı (hacim + CSAT)', 'Segment Breakdown (volume + CSAT)')}
          why={L('Kurumsal vs Bireysel hacim; CSAT yan mikro-gösterge. B2B ağırlıklı.', 'Corporate vs Individual volume; CSAT micro-indicator. B2B-heavy.')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={segData} layout="vertical" margin={{ top: 8, right: 64, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11.5, fill: t.tx2 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'count' ? [fmtInt(v), L('Adet', 'Count')] : v)} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                {segData.map((s, i) => <Cell key={i} fill={s.name === 'Kurumsal' ? t.pr : t.tl} />)}
                <LabelList dataKey="count" position="insideRight" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 10.5, fill: '#fff', fontWeight: 600 }} />
                <LabelList dataKey="csat" position="right" formatter={(v: number) => `CSAT ${v.toFixed(2)}`} style={{ fontSize: 10, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 4) Talep Coğrafyası — inline SVG TR il haritası + Top 10 */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={58} title={L('Talep Coğrafyası (TR il)', 'Demand Geography (TR provinces)')}
          why={L('İnline SVG 81-il tilemap (coğrafi-yaklaşık); yoğunluğa göre choropleth. Kurumsal talep İstanbul/Ankara/İzmir/Bursa ağırlıklı.', 'Inline SVG 81-province tilemap (geo-approx); density choropleth. Corporate demand concentrated in İstanbul/Ankara/İzmir/Bursa.')}>
          <div style={{ overflowX: 'auto', padding: '6px 0' }}>
            <svg width="100%" viewBox={`0 0 ${TR_GRID_COLS * CELL} ${TR_GRID_ROWS * CELL}`} style={{ maxWidth: TR_GRID_COLS * CELL, minWidth: 460 }}>
              {TR_PROVINCES.map((p) => {
                const count = geoMap.get(p.name) ?? 0;
                const x = p.col * CELL, y = p.row * CELL;
                return (
                  <g key={p.code}
                    onMouseEnter={(e) => setHover({ x: e.clientX, y: e.clientY, name: p.name, count })}
                    onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY, name: p.name, count })}
                    onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                    <rect x={x} y={y} width={TILE} height={TILE} rx={4} fill={fillFor(count)} stroke={count ? t.pr : t.bd} strokeWidth={count ? 1 : 0.8} />
                    <text x={x + TILE / 2} y={y + TILE / 2 + 3} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={count && count / geoMax > 0.5 ? '#fff' : t.tx3} style={{ pointerEvents: 'none' }}>{p.code}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 10, color: t.tx3 }}>
            <span>{L('Az', 'Low')}</span>
            <span style={{ display: 'inline-flex', gap: 2 }}>{[0.14, 0.35, 0.6, 0.85, 1].map((a) => <span key={a} style={{ width: 16, height: 10, borderRadius: 2, background: `rgba(79,70,229,${a})` }} />)}</span>
            <span>{L('Çok', 'High')}</span>
            <span style={{ marginLeft: 8, color: t.tx3 }}>{L('· kutu içi = plaka kodu', '· box = plate code')}</span>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={38} title={L('Top İller', 'Top Provinces')}
          why={L('En yüksek talep hacmi olan iller (kurumsal müşteri yoğunluğu).', 'Provinces with the highest demand volume (corporate customer density).')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10.5, fill: t.tx2 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Etkileşim', 'Interactions')]} />
              <Bar dataKey="count" fill={t.pr} radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="count" position="right" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 9.5, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {hover && createPortal(
        <div style={{ position: 'fixed', left: Math.min(hover.x + 12, window.innerWidth - 180), top: hover.y - 8, transform: 'translateY(-100%)', background: t.tx, color: t.bg, borderRadius: 8, padding: '7px 11px', fontSize: 11.5, fontWeight: 500, boxShadow: '0 6px 20px rgba(0,0,0,0.35)', zIndex: 99999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 700, marginBottom: 1 }}>{hover.name}</div>
          <div>{fmtInt(hover.count)} {L('etkileşim', 'interactions')}</div>
        </div>,
        document.body,
      )}
    </ReportPageLayout>
  );
};

export default TicketAnalizi;
