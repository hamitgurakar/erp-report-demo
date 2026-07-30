import { useMemo, type CSSProperties } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import {
  getKanalKpis, getChannelVolumeTrend, getCsatByChannel, getRatingDistribution, getRatingComments, getInteractionTrend, type Channel,
} from '../../constants/supportData';
import { ReportPageLayout, KPIBand, KPICard, ChartCard } from '../../components/finance';
import type { FinancePageProps } from '../finance/_Placeholder';

const CH_LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', phone: 'Telefon', chat: 'Canlı Sohbet', email: 'E-posta', messenger: 'Messenger', instagram: 'Instagram' };
const CH_ORDER: Channel[] = ['whatsapp', 'phone', 'chat', 'email', 'messenger', 'instagram'];
const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const KanalRating = ({ t, lang }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const kp = useMemo(() => getKanalKpis(), []);
  const volTrend = useMemo(() => getChannelVolumeTrend(), []);
  const csatByCh = useMemo(() => getCsatByChannel(), []);
  const rating = useMemo(() => getRatingDistribution(), []);
  const comments = useMemo(() => getRatingComments(16), []);
  const trend = useMemo(() => getInteractionTrend(), []);

  const st = (v: number, g: number, y: number) => (v >= g ? t.gn : v >= y ? t.am : t.rd);
  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const CH_COLOR: Record<Channel, string> = { whatsapp: t.gn, phone: t.pr, chat: t.tl, email: t.am, messenger: t.pu, instagram: t.co };

  const csatData = csatByCh.map((c) => ({ name: CH_LABEL[c.channel], csat: +c.csat.toFixed(2) }));
  const ratingData = rating.dist.map((d) => ({ name: `${d.star}★`, count: d.count, pct: +d.pct.toFixed(0) }));
  const toneColor = (tone: string) => (tone === 'positive' ? t.gn : tone === 'neutral' ? t.am : t.rd);
  const toneLabel = (tone: string) => (tone === 'positive' ? L('Pozitif', 'Positive') : tone === 'neutral' ? L('Nötr', 'Neutral') : L('Negatif', 'Negative'));

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Kanal & Memnuniyet', 'Channel & Satisfaction')}
      subtitle={L('Kanal hacmi, kanal bazında CSAT, rating dağılımı ve yorum akışı. Ses + dijital. Son 6 ay.', 'Channel volume, CSAT by channel, rating distribution and comment feed. Voice + digital. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Toplam Kanal Hacmi', 'Total Channel Volume')} value={fmtInt(kp.hacim.value)} trend={{ value: kp.hacim.mom }} goodDir="up" sparkColor={t.pr}
          infoText={L('Tüm kanallardaki toplam etkileşim. MoM önceki aya göre.', 'Total interactions across all channels. MoM vs previous month.')} hint={L('tüm kanallar', 'all channels')} />
        <KPICard t={t} lang={lang} title={L('Ortalama CSAT', 'Average CSAT')} value={`${kp.csat.value.toFixed(2)}/5`} trend={{ value: kp.csat.mom }} goodDir="up" sparkColor={st(kp.csat.value, 4.25, 3.75)}
          infoText={L('Tüm puanlı etkileşimlerin ortalaması. Hedef ≥4,25 (yeşil).', 'Mean of all rated interactions. Target ≥4.25 (green).')} hint={L('hedef ≥4,25', 'target ≥4.25')} />
        <KPICard t={t} lang={lang} title={L('En Yüksek / Düşük CSAT', 'Highest / Lowest CSAT')} value={`${CH_LABEL[kp.best.channel]} ${kp.best.csat.toFixed(2)}`} goodDir="up" sparkColor={t.gn}
          infoText={L('En yüksek ve en düşük memnuniyetli kanal (≥10 puanlı).', 'Channels with highest and lowest satisfaction (≥10 rated).')} hint={L(`en düşük: ${CH_LABEL[kp.worst.channel]} ${kp.worst.csat.toFixed(2)}`, `lowest: ${CH_LABEL[kp.worst.channel]} ${kp.worst.csat.toFixed(2)}`)} />
        <KPICard t={t} lang={lang} title={L('Yanıt Oranı', 'Response Rate')} value={`%${kp.yanitOrani.value.toFixed(0)}`} trend={{ value: kp.yanitOrani.mom }} goodDir="up" sparkColor={st(kp.yanitOrani.value, 85, 70)}
          infoText={L('İlk yanıt alan etkileşim oranı (dijital ilk yanıt + cevaplanan ses).', 'Share of interactions receiving a first response (digital FR + answered voice).')} hint={L('dijital + ses', 'digital + voice')} />
      </KPIBand>

      {/* 1) Volume by channel + trend% · 2) CSAT by channel */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={50} title={L('Kanal Hacmi + Trend %', 'Channel Volume + Trend %')}
          why={L('Kanal başına hacim (yatay bar) + aylık değişim rozeti (Crisp deseni). WhatsApp/Chat baskın.', 'Volume per channel (horizontal bar) + MoM trend badge (Crisp). WhatsApp/Chat dominate.')}>
          <div style={{ padding: '4px 4px 0' }}>
            {volTrend.map((c) => {
              const maxC = Math.max(...volTrend.map((x) => x.count));
              return (
                <div key={c.channel} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 92, fontSize: 11.5, color: t.tx2, textAlign: 'right' }}>{CH_LABEL[c.channel]}</div>
                  <div style={{ flex: 1, background: t.bg2, borderRadius: 6, height: 22, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(3, (c.count / maxC) * 100)}%`, height: '100%', background: CH_COLOR[c.channel], display: 'flex', alignItems: 'center', paddingLeft: 8, color: '#fff', fontSize: 11, fontWeight: 700 }}>{fmtInt(c.count)}</div>
                  </div>
                  <div style={{ width: 62, fontSize: 10.5, fontWeight: 700, color: c.trendPct >= 0 ? t.gn : t.rd, textAlign: 'right' }}>{c.trendPct >= 0 ? '▲' : '▼'} %{Math.abs(c.trendPct).toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={46} title={L('Kanal Bazında CSAT (0-5)', 'CSAT by Channel (0-5)')}
          why={L('Ses dahil tüm kanalların memnuniyeti; hedef 4,25 (renk). Crisp Rating deseni.', 'Satisfaction across all channels incl. voice; target 4.25 (color). Crisp Rating pattern.')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={csatData} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={84} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [`${v.toFixed(2)}/5`, 'CSAT']} />
              <Bar dataKey="csat" radius={[0, 4, 4, 0]} barSize={20}>
                {csatData.map((d, i) => <Cell key={i} fill={d.csat >= 4.25 ? t.gn : d.csat >= 3.75 ? t.am : t.rd} />)}
                <LabelList dataKey="csat" position="right" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3) Rating dağılımı + mean · 4) Kanal trendi stacked area */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={38} title={L('Rating Dağılımı', 'Rating Distribution')}
          why={L('1-5 yıldız dağılımı + ortalama skor. Yüksek 5★ + kuyruk 1★ B2B tipik.', '1-5 star distribution + mean. High 5★ with a 1★ tail is typical B2B.')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 4px' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: st(rating.mean, 4.25, 3.75) }}>{rating.mean.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: t.tx3 }}>/5 · {fmtInt(rating.total)} {L('puan', 'ratings')}</div>
            </div>
            <div style={{ flex: 1 }}>
              {ratingData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 24, fontSize: 11, color: t.tx2, textAlign: 'right' }}>{d.name}</span>
                  <div style={{ flex: 1, background: t.bg2, borderRadius: 5, height: 16, overflow: 'hidden' }}>
                    <div style={{ width: `${d.pct}%`, height: '100%', background: d.name === '5★' || d.name === '4★' ? t.gn : d.name === '3★' ? t.am : t.rd }} />
                  </div>
                  <span style={{ width: 54, fontSize: 10.5, color: t.tx3, textAlign: 'right' }}>%{d.pct} · {fmtInt(d.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={58} title={L('Kanal Trendi (zaman içinde)', 'Channel Trend (over time)')}
          why={L('Haftalık kanal hacmi (stacked area). Kanal kaymaları ve sezon zirveleri görünür.', 'Weekly channel volume (stacked area). Channel shifts and season peaks visible.')}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 10.5, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))} formatter={(v: number, n) => [fmtInt(v), CH_LABEL[n as Channel] ?? n]} />
              <Legend wrapperStyle={{ fontSize: 9.5 }} formatter={(v) => CH_LABEL[v as Channel] ?? v} />
              {CH_ORDER.map((ch) => <Area key={ch} type="monotone" dataKey={ch} name={ch} stackId="c" stroke={CH_COLOR[ch]} fill={CH_COLOR[ch]} fillOpacity={0.5} strokeWidth={1} />)}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Rating yorum akışı */}
      <div style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Rating Yorum Akışı', 'Rating Comment Feed')} <span style={{ fontSize: 11, color: t.tx3, fontWeight: 400 }}>· {L('jenerik mock, gerçek isim yok', 'generic mock, no real names')}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, padding: 14 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${t.bd}`, borderLeft: `3px solid ${toneColor(c.tone)}`, borderRadius: 8, padding: '9px 11px', background: t.bg2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.rating >= 4 ? t.gn : c.rating === 3 ? t.am : t.rd }}>{'★'.repeat(c.rating)}<span style={{ color: t.tx3 }}>{'★'.repeat(5 - c.rating)}</span></span>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: toneColor(c.tone) }}>{toneLabel(c.tone)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: t.tx, lineHeight: 1.45, marginBottom: 6 }}>{c.text}</div>
              <div style={{ fontSize: 10, color: t.tx3 }}>{CH_LABEL[c.channel]} · {c.date}</div>
            </div>
          ))}
        </div>
      </div>
    </ReportPageLayout>
  );
};

export default KanalRating;
