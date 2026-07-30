import { useMemo, useState, type CSSProperties } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
} from 'recharts';
import {
  getSlaKpis, getFrtDistribution, getResolutionDistribution, getCsatSlaSeries, getSlaBreaches,
  FRT_IDEAL_SEC, type OfficeFilter, type ChannelFilter, type Channel,
} from '../../constants/supportData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, GaugeCard,
} from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../finance/_Placeholder';

const CH_LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', phone: 'Telefon', chat: 'Canlı Sohbet', email: 'E-posta', messenger: 'Messenger', instagram: 'Instagram' };
const fmtMMSS = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtDur = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} sa` : `${Math.round(s / 60)} dk`);
const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const dtLabel = (iso: string) => { const d = new Date(iso); return `${mmdd(iso)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

export const SlaPerformans = ({ t, lang }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);
  const [office, setOffice] = useState<OfficeFilter>('all');
  const [seg, setSeg] = useState<ChannelFilter>('all');

  const kp = useMemo(() => getSlaKpis(office), [office]);
  const frt = useMemo(() => getFrtDistribution(office), [office]);
  const resn = useMemo(() => getResolutionDistribution(office), [office]);
  const series = useMemo(() => getCsatSlaSeries(office, seg), [office, seg]);
  const breaches = useMemo(() => getSlaBreaches(office), [office]);

  const st = (v: number, g: number, y: number, dir: 'up' | 'down' = 'up') => {
    const good = dir === 'up' ? v >= g : v <= g; const warn = dir === 'up' ? v >= y : v <= y;
    return good ? t.gn : warn ? t.am : t.rd;
  };

  // bottleneck: en düşük SLA haftası
  const worstIdx = series.reduce((mi, p, i, a) => (p.slaPct < a[mi].slaPct ? i : mi), 0);
  const bnStart = series[Math.max(0, worstIdx - 1)]?.week;
  const bnEnd = series[Math.min(series.length - 1, worstIdx + 1)]?.week;
  const aiWeek = series.find((p) => p.week >= '2026-06-01')?.week;

  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const segBtn = (val: OfficeFilter | ChannelFilter, cur: string, on: () => void, label: string): CSSProperties => ({ padding: '5px 11px', fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: cur === val ? t.pr : t.cd, color: cur === val ? '#fff' : t.tx2 });

  const controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{L('Mesai Saati', 'Office Hours')}</span>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
        {([['all', L('Tümü', 'All')], ['in', L('Mesai içi', 'In-hours')], ['out', L('Mesai dışı', 'Off-hours')]] as [OfficeFilter, string][]).map(([v, lbl]) => (
          <button key={v} onClick={() => setOffice(v)} style={segBtn(v, office, () => setOffice(v), lbl)}>{lbl}</button>
        ))}
      </div>
    </div>
  );

  const frtChanLabel = frt.channelAvg.map((c) => `${CH_LABEL[c.channel]} ${fmtMMSS(c.avgSec)}`).join(' · ');

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('SLA & Yanıt Performansı', 'SLA & Response Performance')}
      subtitle={L('İlk yanıt, çözüm süresi, SLA uyumu ve ihlaller. Mesai filtresi metrikleri yeniden hesaplar. Son 6 ay.', 'First response, resolution, SLA compliance and breaches. Office filter recomputes metrics. Last 6 months.')}
      controls={controls}
    >
      <KPIBand>
        <div style={{ ...card, width: 200, padding: '10px 12px 4px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11.5, color: t.tx2, fontWeight: 500, marginBottom: -6 }}>{L('SLA Uyum %', 'SLA Compliance %')}</div>
          <GaugeCard t={t} value={kp.sla.value} min={0} max={100} label="" format={(v) => `%${v.toFixed(0)}`}
            thresholds={[{ limit: 75, color: t.rd }, { limit: 90, color: t.am }, { limit: 100, color: t.gn }]} />
          <div style={{ fontSize: 10, color: t.tx3, textAlign: 'center', marginTop: -6, paddingBottom: 4 }}>{L('hedef ≥%90 · yanıt-SLA (15dk/24h)', 'target ≥90% · response-SLA (15m/24h)')}</div>
        </div>
        <KPICard t={t} lang={lang} title={L('Ort. İlk Yanıt', 'Avg First Response')} value={fmtMMSS(kp.frt.value)} trend={{ value: kp.frt.mom }} goodDir="down" sparkColor={t.tl}
          infoText={L('FRT — kanal-ağırlıklı (canlı kanal + cevaplanan ses ASA). İdeal chat <90sn (B3).', 'FRT — channel-weighted (live + answered voice ASA). Ideal chat <90s (B3).')} hint={L('ideal chat <90sn', 'ideal chat <90s')} />
        <KPICard t={t} lang={lang} title={L('Ort. Çözüm Süresi', 'Avg Resolution Time')} value={fmtDur(kp.resn.value)} trend={{ value: kp.resn.mom }} goodDir="down" sparkColor={st(kp.resn.value, 7200, 21600, 'down')}
          infoText={L('Time to Resolution — canlı kanal çözüm + ses AHT. Hedef ≤2sa (yeşil).', 'Time to Resolution — live-channel resolution + voice AHT. Target ≤2h (green).')} hint={L('hedef ≤2 sa', 'target ≤2h')} />
        <KPICard t={t} lang={lang} title={L('İhlal Sayısı', 'Breach Count')} value={fmtInt(kp.breaches.value)} trend={{ value: kp.breaches.mom }} goodDir="down" sparkColor={st(kp.breaches.value === 0 ? 1 : 0, 1, 0.5, 'up')}
          infoText={L('Yanıt SLA hedefini aşan dijital etkileşim sayısı (hızlı kanal 15dk / e-posta 24h).', 'Digital interactions exceeding the response SLA (fast 15m / email 24h).')} hint={L('dijital yanıt SLA', 'digital response SLA')} />
      </KPIBand>

      {/* 1) CSAT + SLA dual-area + bottleneck */}
      <div style={{ marginTop: 18 }}>
        <ChartCard t={t} lang={lang} title={L('CSAT + SLA Uyum Trendi + Darboğaz', 'CSAT + SLA Compliance Trend + Bottleneck')}
          right={(
            <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
              {([['all', L('Tüm kanallar', 'All')], ['chat', L('Chat', 'Chat')]] as [ChannelFilter, string][]).map(([v, lbl]) => (
                <button key={v} onClick={() => setSeg(v)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: seg === v ? t.pr : t.cd, color: seg === v ? '#fff' : t.tx2 }}>{lbl}</button>
              ))}
            </div>
          )}
          why={L('Crisp CSAT+SLA dual-area; kırmızı bant = darboğaz (SLA en düşük hafta). İki eksen aynı %0-100.', 'Crisp CSAT+SLA dual-area; red band = bottleneck (lowest-SLA week). Both series on %0-100.')}>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="slaCsat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.gn} stopOpacity={0.35} /><stop offset="100%" stopColor={t.gn} stopOpacity={0.04} /></linearGradient>
                <linearGradient id="slaSla" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.am} stopOpacity={0.3} /><stop offset="100%" stopColor={t.am} stopOpacity={0.03} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => `%${v}`} width={38} />
              {bnStart && bnEnd && bnStart !== bnEnd && (
                <ReferenceArea x1={bnStart} x2={bnEnd} fill={t.rd} fillOpacity={0.1} label={{ value: L('Darboğaz tespit edildi', 'Bottleneck detected'), position: 'insideTop', fontSize: 9.5, fill: t.rd }} />
              )}
              <ReferenceLine y={90} stroke={t.gn} strokeDasharray="4 3" label={{ value: L('SLA hedef %90', 'SLA target 90%'), position: 'insideTopRight', fontSize: 9, fill: t.gn }} />
              {aiWeek && <ReferenceLine x={aiWeek} stroke={t.pr} strokeDasharray="5 3" label={{ value: L('AI yönlendirme', 'AI routing'), position: 'top', fontSize: 9, fill: t.pr }} />}
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))} formatter={(v: number, n) => [`%${v.toFixed(0)}`, n === 'csatPct' ? 'CSAT' : L('SLA Uyum', 'SLA')]} />
              <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => (v === 'csatPct' ? 'CSAT' : L('SLA Uyum', 'SLA Compliance'))} />
              <Area type="monotone" dataKey="csatPct" name="csatPct" stroke={t.gn} fill="url(#slaCsat)" strokeWidth={2} />
              <Area type="monotone" dataKey="slaPct" name="slaPct" stroke={t.am} fill="url(#slaSla)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2) FRT dağılımı + 3) Çözüm süresi dağılımı */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={50} title={L('İlk Yanıt (FRT) Dağılımı', 'First Response (FRT) Distribution')}
          why={L('Yanıt süresi kovaları (canlı kanal + ses ASA); ideal chat 90sn çizili. Kanal ort. altta.', 'Response-time buckets (live + voice ASA); ideal chat 90s marked. Channel avg below.')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={frt.buckets} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Etkileşim', 'Interactions')]} />
              <ReferenceLine x="31-90sn" stroke={t.gn} strokeDasharray="4 3" label={{ value: L(`ideal ${FRT_IDEAL_SEC}sn`, `ideal ${FRT_IDEAL_SEC}s`), position: 'top', fontSize: 8.5, fill: t.gn }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={26}>
                {frt.buckets.map((_, i) => <Cell key={i} fill={i <= 1 ? t.gn : i <= 3 ? t.am : t.rd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx3, marginTop: 4 }}>{L('Kanal ort.', 'Channel avg')}: {frtChanLabel}</div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={46} title={L('Çözüm Süresi Dağılımı', 'Resolution Time Distribution')}
          why={L('Çözüm süresi kovaları; 2sa hedef çizili (Crisp ~2h). Uzun kuyruk = darboğaz.', 'Resolution buckets; 2h target marked (Crisp ~2h). Long tail = bottleneck.')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={resn} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Etkileşim', 'Interactions')]} />
              <ReferenceLine x="1-2sa" stroke={t.gn} strokeDasharray="4 3" label={{ value: L('2sa hedef', '2h target'), position: 'top', fontSize: 8.5, fill: t.gn }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={34}>
                {resn.map((_, i) => <Cell key={i} fill={i <= 1 ? t.gn : i === 2 ? t.am : t.rd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SLA İhlal Tablosu */}
      <div style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{L('SLA İhlal Tablosu', 'SLA Breach Table')}</span>
          <span style={{ fontSize: 11, color: t.rd, fontWeight: 600 }}>{fmtInt(breaches.length)} {L('ihlal', 'breaches')}</span>
          <span style={{ fontSize: 10.5, color: t.tx3 }}>{L('· gecikme azalan (ilk 50)', '· by delay desc (top 50)')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[L('Kayıt No', 'ID'), L('Zaman', 'Time'), L('Kanal', 'Channel'), L('Ajan', 'Agent'), L('Hedef', 'Target'), L('Gerçekleşen', 'Actual'), L('Gecikme', 'Delay')].map((h, i) => (
                <th key={i} style={{ fontSize: 10.5, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.3, padding: '8px 10px', textAlign: i >= 4 ? 'right' : 'left', borderBottom: `1px solid ${t.bd}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {breaches.slice(0, 50).map((b) => (
                <tr key={b.id}>
                  <td style={{ fontSize: 11.5, color: t.tx2, padding: '7px 10px', borderTop: `1px solid ${t.bd}` }}>{b.id}</td>
                  <td style={{ fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' }}>{dtLabel(b.startAt)}</td>
                  <td style={{ fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}` }}>{CH_LABEL[b.channel]}</td>
                  <td style={{ fontSize: 11.5, color: t.tx2, padding: '7px 10px', borderTop: `1px solid ${t.bd}` }}>{b.agentName}</td>
                  <td style={{ fontSize: 11.5, color: t.tx3, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>{fmtDur(b.targetSec)}</td>
                  <td style={{ fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>{fmtDur(b.actualSec)}</td>
                  <td style={{ fontSize: 11.5, fontWeight: 600, color: t.rd, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, textAlign: 'right' }}>+{fmtDur(b.delaySec)}</td>
                </tr>
              ))}
              {breaches.length === 0 && <tr><td colSpan={7} style={{ padding: 20, fontSize: 12, color: t.tx3, textAlign: 'center' }}>{L('Seçili filtrede SLA ihlali yok.', 'No SLA breaches in the current filter.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: t.tx3, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="info" size={12} color={t.tx3} />
        {L('Mesai filtresi tüm KPI, grafik ve tabloyu yeniden hesaplar. SLA uyumu operasyonel yanıt-SLA (hızlı kanal 15dk / e-posta 24h) ile ölçülür; B3 ideal FRT (90sn) referans çizgisidir.', 'Office filter recomputes all KPIs, charts and the table. SLA compliance uses the operational response-SLA (fast 15m / email 24h); the B3 ideal FRT (90s) is a reference line.')}
      </div>
    </ReportPageLayout>
  );
};

export default SlaPerformans;
