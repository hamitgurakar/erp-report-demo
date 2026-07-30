import { useMemo, type CSSProperties } from 'react';
import {
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, LabelList, Cell,
} from 'recharts';
import {
  getKpis, getChannelBreakdown, getInteractionTrend, getReasonBreakdown, getHourDayHeatmap,
  getVoiceSL, getAgentSnapshot, supportInteractions, type Channel,
} from '../../constants/supportData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, GaugeCard, StatusBadge, type FinAlert,
} from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../finance/_Placeholder';

const CH_LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', phone: 'Telefon', chat: 'Canlı Sohbet', email: 'E-posta', messenger: 'Messenger', instagram: 'Instagram' };
const DOW = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HB = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
const fmtMMSS = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtDur = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} sa` : `${Math.round(s / 60)} dk`);
const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const DestekGenelBakis = ({ t, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const k = useMemo(() => getKpis(), []);
  const channels = useMemo(() => getChannelBreakdown(), []);
  const trend = useMemo(() => getInteractionTrend(), []);
  const reasons = useMemo(() => getReasonBreakdown(), []);
  const heat = useMemo(() => getHourDayHeatmap(), []);
  const voice = useMemo(() => getVoiceSL(), []);
  const team = useMemo(() => getAgentSnapshot(), []);

  // ── Bölüm 3 renk durumları ──
  const st = (v: number, g: number, y: number, dir: 'up' | 'down' = 'up') => {
    const good = dir === 'up' ? v >= g : v <= g;
    const warn = dir === 'up' ? v >= y : v <= y;
    return good ? t.gn : warn ? t.am : t.rd;
  };
  const csatColor = st(k.csat.value, 4.25, 3.75, 'up');
  const slaColor = st(k.slaCompliance.value, 90, 75, 'up');
  const slColor = st(k.voiceSL.value, 80, 60, 'up');
  const resColor = st(k.resolutionSec.value, 7200, 21600, 'down');

  // ── AI içgörüleri (data'dan) ──
  const dayMs = 86400000;
  const maxDate = supportInteractions[supportInteractions.length - 1].startAt;
  const maxT = new Date(maxDate).getTime();
  const inWin = (r: { startAt: string }, from: number, to: number) => { const x = new Date(r.startAt).getTime(); return x > from && x <= to; };
  const last7 = supportInteractions.filter((r) => inWin(r, maxT - 7 * dayMs, maxT));
  const prev7 = supportInteractions.filter((r) => inWin(r, maxT - 14 * dayMs, maxT - 7 * dayMs));
  const delivLast = last7.filter((r) => r.reason === 'Teslimat' || r.reason === 'WISMO').length;
  const delivPrev = prev7.filter((r) => r.reason === 'Teslimat' || r.reason === 'WISMO').length;
  const delivChange = delivPrev ? ((delivLast - delivPrev) / delivPrev) * 100 : 0;
  const corpAffected = new Set(last7.filter((r) => (r.reason === 'Teslimat' || r.reason === 'WISMO') && r.segment === 'Kurumsal').map((r) => r.customerRef)).size;

  const alerts: FinAlert[] = [
    { severity: delivChange > 0 ? 'warning' : 'watch', text: L(
      `Operasyon→Destek→Satış: Son 7 günde Teslimat/WISMO kaynaklı temas %${Math.abs(delivChange).toFixed(0)} ${delivChange >= 0 ? 'arttı' : 'azaldı'} (${delivLast} temas); ${corpAffected} kurumsal müşteri etkilendi. Operasyon kargo SL düşüşüyle korele — kök neden Operasyon'da.`,
      `Operations→Support→Sales: Delivery/WISMO-driven contacts ${delivChange >= 0 ? 'rose' : 'fell'} ${Math.abs(delivChange).toFixed(0)}% in the last 7 days (${delivLast} contacts); ${corpAffected} corporate customers affected. Correlated with a drop in Operations shipping SL — root cause sits in Operations.`) },
    { severity: k.voiceSL.value < 80 ? 'warning' : 'good', text: L(
      `Ses servis seviyesi %${k.voiceSL.value.toFixed(0)} (hedef 30sn ≥%80); kaçan %${voice.abandonedPct.toFixed(0)} — bunların %${voice.recoveredPct.toFixed(0)}'i geri dönüldü (B2B kurtarma). Kuyruk personeli mesai zirvesinde (12-15h) güçlendirilmeli.`,
      `Voice service level ${k.voiceSL.value.toFixed(0)}% (target ≥80% at 30s); abandoned ${voice.abandonedPct.toFixed(0)}% of which ${voice.recoveredPct.toFixed(0)}% were recovered (B2B rescue). Reinforce queue staffing at the 12-15h peak.`) },
    { severity: 'tip', text: L(
      `CSAT %${((k.csat.value / 5) * 100).toFixed(0)} (${k.csat.value.toFixed(2)}/5); en yüksek memnuniyet dijital kanallarda. WISMO temaslarını self-service (sipariş takip) ile azaltmak toplam hacmi düşürür.`,
      `CSAT ${((k.csat.value / 5) * 100).toFixed(0)}% (${k.csat.value.toFixed(2)}/5); highest on digital channels. Deflecting WISMO via self-service (order tracking) would cut total volume.`) },
  ];

  // ── trend event annotation haftası ──
  const aiWeek = trend.find((p) => p.week >= '2026-06-01')?.week;
  const CH_ORDER: Channel[] = ['whatsapp', 'phone', 'chat', 'email', 'messenger', 'instagram'];
  const CH_COLOR: Record<Channel, string> = { whatsapp: t.gn, phone: t.pr, chat: t.tl, email: t.am, messenger: t.pu, instagram: t.co };

  // ── heatmap renk ──
  const heatMax = Math.max(...heat.map((c) => c.count), 1);
  const heatColor = (v: number) => { const a = Math.max(0.05, v / heatMax); return `rgba(79,70,229,${a.toFixed(2)})`; };
  const heatGet = (day: number, bucket: number) => heat.find((c) => c.day === day && c.bucket === bucket)?.count ?? 0;

  const funnelMax = voice.funnel[0].value || 1;
  const funnelColor = [t.pr, t.tl, t.rd, t.gn, t.tx3];

  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const chartData = channels.map((c) => ({ name: CH_LABEL[c.channel], count: c.count, csat: +c.csat.toFixed(2) }));
  const reasonData = reasons.map((r) => ({ name: r.reason, count: r.count }));

  const agentRow = (a: { name: string; count: number; csat: number; kind: string }, top: boolean) => (
    <div key={a.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: `1px solid ${t.bd}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 13, background: top ? t.gnL : t.amL, color: top ? t.gn : t.am, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{a.name.slice(0, 1)}</span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.tx }}>{a.name}</div>
          <div style={{ fontSize: 10.5, color: t.tx3 }}>{a.kind === 'voice' ? L('Ses', 'Voice') : L('Dijital', 'Digital')} · {fmtInt(a.count)} {L('etkileşim', 'interactions')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: st(a.csat, 4.25, 3.75, 'up') }}>{a.csat.toFixed(2)}</span>
        <StatusBadge t={t} tone={top ? 'green' : 'amber'} label={top ? L('Top performer', 'Top performer') : L('Dikkat gerekli', 'Needs attention')} />
      </div>
    </div>
  );

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Destek Genel Bakış', 'Support Overview')}
      subtitle={L('Omnichannel destek özeti — ses (Verimor) + dijital (Crisp) birleşik. Son 6 ay.', 'Omnichannel support overview — voice (Verimor) + digital (Crisp) unified. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Toplam Etkileşim', 'Total Interactions')} value={fmtInt(k.total.value)} trend={{ value: k.total.mom }} goodDir="up" spark={k.spark} sparkColor={t.pr}
          infoText={L('Ses + dijital birleşik etkileşim (kanal-atlayan tek müşteri = tek kayıt). MoM = önceki aya göre.', 'Unified voice + digital interactions (channel-hopping customer counted once). MoM vs previous month.')} hint={L('son 6 ay', 'last 6 months')} />
        <KPICard t={t} lang={lang} title="CSAT" value={`${k.csat.value.toFixed(2)}/5`} trend={{ value: k.csat.mom }} goodDir="up" sparkColor={csatColor}
          infoText={L('Customer Satisfaction — puanlı etkileşimlerin ortalaması. Hedef ≥4,25 (yeşil).', 'Customer Satisfaction — mean of rated interactions. Target ≥4.25 (green).')} hint={L('hedef ≥4,25', 'target ≥4.25')} />
        <KPICard t={t} lang={lang} title={L('Ort. İlk Yanıt', 'Avg First Response')} value={fmtMMSS(k.frtSec.value)} trend={{ value: k.frtSec.mom }} goodDir="down" sparkColor={t.tl}
          infoText={L('FRT (First Response Time) — canlı kanallar + cevaplanan ses (ASA). E-posta async (24h) SLA uyumunda ölçülür.', 'FRT — live channels + answered voice (ASA). Email is async (24h), tracked under SLA compliance.')} hint={L('canlı kanal + ses', 'live + voice')} />
        <KPICard t={t} lang={lang} title={L('Ort. Çözüm Süresi', 'Avg Resolution Time')} value={fmtDur(k.resolutionSec.value)} trend={{ value: k.resolutionSec.mom }} goodDir="down" sparkColor={resColor}
          infoText={L('Time to Resolution — dijital çözüm + ses AHT. Hedef ≤2sa (yeşil).', 'Time to Resolution — digital resolution + voice AHT. Target ≤2h (green).')} hint={L('hedef ≤2 sa', 'target ≤2h')} />
        <KPICard t={t} lang={lang} title={L('SLA Uyum %', 'SLA Compliance %')} value={`%${k.slaCompliance.value.toFixed(0)}`} trend={{ value: k.slaCompliance.mom }} goodDir="up" sparkColor={slaColor}
          infoText={L('Dijital ilk yanıtın kanal SLA hedefini tutturma oranı (hızlı kanal 15dk / e-posta 24h). Hedef ≥%90.', 'Share of digital first responses meeting the channel SLA (fast 15m / email 24h). Target ≥90%.')} hint={L('dijital · hedef ≥%90', 'digital · target ≥90%')} />
        <KPICard t={t} lang={lang} title={L('Servis Seviyesi % (ses)', 'Service Level % (voice)')} value={`%${k.voiceSL.value.toFixed(0)}`} trend={{ value: k.voiceSL.mom }} goodDir="up" sparkColor={slColor}
          infoText={L('30sn içinde ajanla cevaplanan gelen çağrı oranı (Verimor). Hedef ≥%80.', 'Share of inbound calls answered by an agent within 30s (Verimor). Target ≥80%.')} hint={L(`Kaçan %${voice.abandonedPct.toFixed(0)} · Dönülen %${voice.recoveredPct.toFixed(0)}`, `Abandoned ${voice.abandonedPct.toFixed(0)}% · Recovered ${voice.recoveredPct.toFixed(0)}%`)} />
      </KPIBand>

      {/* 1) Etkileşim Trendi */}
      <div style={{ marginTop: 18 }}>
        <ChartCard t={t} lang={lang} title={L('Etkileşim Trendi (kanal kırılımlı)', 'Interaction Trend (by channel)')}
          why={L('Haftalık hacim kanal bazında yığılı; "çözülen" çizgisi üstte. Sezon zirveleri (Şub sevgililer, yıl ortası kurumsal) görünür.', 'Weekly volume stacked by channel with a "resolved" overlay line. Season peaks (Feb Valentine, mid-year corporate) are visible.')}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))} />
              <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => CH_LABEL[v as Channel] ?? (v === 'cozulen' ? L('Çözülen', 'Resolved') : v)} />
              {CH_ORDER.map((ch) => <Area key={ch} type="monotone" dataKey={ch} name={ch} stackId="v" stroke={CH_COLOR[ch]} fill={CH_COLOR[ch]} fillOpacity={0.5} strokeWidth={1} />)}
              <Line type="monotone" dataKey="cozulen" name="cozulen" stroke={t.tx} strokeWidth={2} dot={false} />
              {aiWeek && <ReferenceLine x={aiWeek} stroke={t.am} strokeDasharray="5 3" label={{ value: L('AI yönlendirme devreye girdi', 'AI routing went live'), position: 'top', fontSize: 9, fill: t.am }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2) Kanal Kırılımı + 5) Top Nedenler */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={50} title={L('Kanal Kırılımı (hacim + CSAT)', 'Channel Breakdown (volume + CSAT)')}
          why={L('Yatay hacim bar; her kanalın CSAT’ı sağda mikro-gösterge (pie değil — kıyas kolay).', 'Horizontal volume bars; each channel’s CSAT as a micro-indicator on the right (no pie — easy to compare).')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={84} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => (n === 'count' ? [fmtInt(v), L('Adet', 'Count')] : v)} />
              <Bar dataKey="count" fill={t.pr} radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList dataKey="count" position="insideRight" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 10, fill: '#fff', fontWeight: 600 }} />
                <LabelList dataKey="csat" position="right" formatter={(v: number) => `CSAT ${v.toFixed(2)}`} style={{ fontSize: 9.5, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={46} title={L('Top Nedenler', 'Top Reasons')}
          why={L('Temas nedenleri; en üstte WISMO/Teslimat (Operasyon kesişimi — self-service fırsatı).', 'Contact reasons; WISMO/Delivery on top (Operations intersection — self-service opportunity).')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={reasonData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={128} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Adet', 'Count')]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {reasonData.map((r, i) => <Cell key={i} fill={i === 0 ? t.rd : i === 1 ? t.co : t.pr} />)}
                <LabelList dataKey="count" position="right" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 9.5, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3) SL gauge + Kaçan→Dönülen funnel */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={36} title={L('Ses Servis Seviyesi (30sn)', 'Voice Service Level (30s)')}
          why={L('Verimor SL — 30sn içinde cevaplama. Bant: kırmızı <60 / sarı 60-80 / yeşil ≥80.', 'Verimor SL — answered within 30s. Bands: red <60 / amber 60-80 / green ≥80.')}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 240 }}>
            <GaugeCard t={t} value={k.voiceSL.value} min={0} max={100} label="SL %" format={(v) => `%${v.toFixed(0)}`}
              thresholds={[{ limit: 60, color: t.rd }, { limit: 80, color: t.am }, { limit: 100, color: t.gn }]} />
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={60} title={L('Kaçan → Dönülen Hunisi', 'Abandoned → Recovered Funnel')}
          why={L('Gelen→Cevaplanan→Kaçan→Dönülen→Kayıp. B2B’de kaçan çağrılar geri aranır (kurtarma).', 'Offered→Answered→Abandoned→Recovered→Lost. In B2B, abandoned calls get a callback (rescue).')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '18px 6px' }}>
            {voice.funnel.map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 92, fontSize: 12, color: t.tx2, textAlign: 'right' }}>{L(f.label, ['Offered', 'Answered', 'Abandoned', 'Recovered', 'Lost'][i])}</div>
                <div style={{ flex: 1, background: t.bg2, borderRadius: 6, overflow: 'hidden', height: 26 }}>
                  <div style={{ width: `${Math.max(3, (f.value / funnelMax) * 100)}%`, background: funnelColor[i], height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 8, color: '#fff', fontSize: 11.5, fontWeight: 700 }}>{fmtInt(f.value)}</div>
                </div>
                <div style={{ width: 44, fontSize: 10.5, color: t.tx3 }}>%{((f.value / funnelMax) * 100).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 4) Yoğunluk Heatmap */}
      <div style={{ marginTop: 14 }}>
        <ChartCard t={t} lang={lang} title={L('Yoğunluk Heatmap (gün × saat)', 'Density Heatmap (day × hour)')}
          why={L('Personel planlama — kurumsal mesai (Pzt-Cum, 09-18) belirgin yoğun. 3’er saatlik kovalar.', 'Staff planning — corporate business hours (Mon-Fri, 09-18) clearly peak. 3-hour buckets.')}>
          <div style={{ overflowX: 'auto', padding: '4px 0' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={{ padding: '4px 8px' }} />
                {HB.map((h) => <th key={h} style={{ padding: '4px 6px', fontSize: 9.5, color: t.tx3, fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {DOW.map((d, di) => (
                  <tr key={d}>
                    <td style={{ padding: '2px 8px', fontSize: 10.5, color: t.tx2, fontWeight: 600, textAlign: 'right' }}>{d}</td>
                    {HB.map((_, bi) => {
                      const v = heatGet(di, bi);
                      return (
                        <td key={bi} style={{ padding: 2 }}>
                          <div title={`${d} ${HB[bi]} · ${fmtInt(v)}`} style={{ width: 52, height: 26, borderRadius: 4, background: heatColor(v), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 600, color: v / heatMax > 0.5 ? '#fff' : t.tx3 }}>{v || ''}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* 6) AI panel */}
      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('Destek İçgörüleri', 'Support Insights')} />
      </div>

      {/* 7) Ekip Snapshot */}
      <div style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{L('Ekip Snapshot', 'Team Snapshot')}</span>
          <span style={{ fontSize: 11.5, color: t.pr, fontWeight: 600, cursor: 'pointer' }} onClick={() => onSelectRep?.('destek__3')}>{L('Ekip Raporu →', 'Team Report →')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ borderRight: `1px solid ${t.bd}` }}>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: t.gn, textTransform: 'uppercase', letterSpacing: 0.4 }}>{L('En İyi Performans', 'Top Performers')}</div>
            {team.top.map((a) => agentRow(a, true))}
          </div>
          <div>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: t.am, textTransform: 'uppercase', letterSpacing: 0.4 }}>{L('Dikkat Gerekli', 'Needs Attention')}</div>
            {team.attention.map((a) => agentRow(a, false))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: t.tx3, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="info" size={12} color={t.tx3} />
        {L('Mock veri (Verimor + Crisp deseni). Detay için alt sayfalar (Yakında): Çağrı Merkezi, SLA, Ekip, Kanal, Nedenler.', 'Mock data (Verimor + Crisp pattern). Detail sub-pages coming soon: Call Center, SLA, Team, Channel, Reasons.')}
      </div>
    </ReportPageLayout>
  );
};

export default DestekGenelBakis;
