import { useMemo, useState, type CSSProperties } from 'react';
import {
  ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import {
  getNedenlerKpis, getReasonDeep, getOpsCorrelation, getArticleFeedback, getDeflection, getCrossLinkRows,
  type Reason, type Channel,
} from '../../constants/supportData';
import { ReportPageLayout, KPIBand, KPICard, ChartCard, AIAlertPanel, type FinAlert } from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../finance/_Placeholder';

const CH_LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', phone: 'Telefon', chat: 'Canlı Sohbet', email: 'E-posta', messenger: 'Messenger', instagram: 'Instagram' };
const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export const NedenlerOperasyon = ({ t, lang, onSelectRep }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const kp = useMemo(() => getNedenlerKpis(), []);
  const reasons = useMemo(() => getReasonDeep(), []);
  const ops = useMemo(() => getOpsCorrelation(), []);
  const articles = useMemo(() => getArticleFeedback(), []);
  const defl = useMemo(() => getDeflection(), []);
  const cross = useMemo(() => getCrossLinkRows(), []);

  const [reasonFlt, setReasonFlt] = useState<'all' | Reason>('all');
  const crossFiltered = useMemo(() => cross.filter((r) => reasonFlt === 'all' || r.reason === reasonFlt).slice(0, 40), [cross, reasonFlt]);

  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const th: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.3, padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.bd}` };
  const td: CSSProperties = { fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };

  // ops korelasyon: en yüksek ticket haftası (kargo SL dibi) → anotasyon
  const spikeWk = ops.reduce((mi, p, i, a) => (p.ticketVol > a[mi].ticketVol ? i : mi), 0);
  const reasonData = reasons.map((r) => ({ name: r.reason, Kurumsal: r.kurumsal, Bireysel: r.bireysel, total: r.total }));
  const articleData = articles.map((a) => ({ name: a.title.length > 28 ? a.title.slice(0, 26) + '…' : a.title, helpful: a.helpful, unhelpful: -a.unhelpful, pct: a.helpfulPct }));

  const alerts: FinAlert[] = [
    { severity: 'warning', text: L(
      `Kargo SL en düşük olduğu ${mmdd(ops[spikeWk].week)} haftasında WISMO/Teslimat teması ${fmtInt(ops[spikeWk].ticketVol)}'e çıktı — Operasyon kargo SL düşüşü doğrudan destek hacmine yansıyor. Kök neden Operasyon'da.`,
      `In the week of ${mmdd(ops[spikeWk].week)} (lowest shipping SL), WISMO/Delivery contacts peaked at ${fmtInt(ops[spikeWk].ticketVol)} — the Operations shipping-SL dip flows straight into support volume. Root cause sits in Operations.`) },
    { severity: 'tip', text: L(
      `WISMO/Teslimat toplam temasların %${kp.wismoPayi.value.toFixed(0)}'i. Self-service (sipariş takip) deflection %${defl.deflectionPct.toFixed(0)}; bot kapsama %${defl.botPct.toFixed(0)}. KB "Kargom Nerede" makalesini öne çıkarmak WISMO'yu düşürür.`,
      `WISMO/Delivery is ${kp.wismoPayi.value.toFixed(0)}% of all contacts. Self-service deflection ${defl.deflectionPct.toFixed(0)}%; bot coverage ${defl.botPct.toFixed(0)}%. Promoting the "Where is my order" KB article would cut WISMO.`) },
    { severity: 'good', text: L(
      `KB arama→ticket düşüşü %${defl.ticketDropPct}; AI otomasyon genel etkisi %${defl.aiImpactPct} (containment + yönlendirme). Deflection artışı doğrudan hacim düşüşü.`,
      `KB search→ticket drop ${defl.ticketDropPct}%; AI automation overall impact ${defl.aiImpactPct}% (containment + routing). Higher deflection directly lowers volume.`) },
  ];

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Nedenler & Operasyon Kesişimi', 'Reasons & Operations Intersection')}
      subtitle={L('Temas nedenleri, Operasyon kargo SL korelasyonu ve self-service deflection. Kargo SL bağımsız mock (Operasyon modülü veri sağlamıyor). Son 6 ay.', 'Contact reasons, Operations shipping-SL correlation and self-service deflection. Shipping SL is an independent mock. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('WISMO/Teslimat Payı', 'WISMO/Delivery Share')} value={`%${kp.wismoPayi.value.toFixed(0)}`} trend={{ value: kp.wismoPayi.mom }} goodDir="down" sparkColor={t.co}
          infoText={L('Kargo/teslimat kaynaklı temasların toplam içindeki payı. Operasyon kesişimi.', 'Share of shipping/delivery-driven contacts. Operations intersection.')} hint={L('operasyon kaynaklı', 'ops-driven')} />
        <KPICard t={t} lang={lang} title={L('Ticket / Sipariş Oranı', 'Ticket / Order Ratio')} value={`%${kp.ticketSiparis.value.toFixed(1)}`} trend={{ value: kp.ticketSiparis.mom }} goodDir="down" sparkColor={t.am}
          infoText={L('Sipariş başına destek teması oranı (mock sipariş tabanı). Düşük = daha az sürtünme.', 'Support contacts per order (mock order base). Lower = less friction.')} hint={L('sipariş başına temas', 'contacts per order')} />
        <KPICard t={t} lang={lang} title="Deflection %" value={`%${kp.deflection.value.toFixed(0)}`} trend={{ value: kp.deflection.mom }} goodDir="up" sparkColor={t.gn}
          infoText={L('Self-service (bot + KB) ile temsilciye gitmeden çözülen oranı.', 'Share resolved via self-service (bot + KB) without reaching an agent.')} hint={L('self-service', 'self-service')} />
        <KPICard t={t} lang={lang} title={L('Bot/Otomasyon Kapsama', 'Bot/Automation Coverage')} value={`%${kp.botKapsama.value.toFixed(0)}`} trend={{ value: kp.botKapsama.mom }} goodDir="up" sparkColor={t.pr}
          infoText={L('Bot containment — dijital etkileşimlerin bot ile kapatılan oranı.', 'Bot containment — share of digital interactions closed by the bot.')} hint={L('dijital', 'digital')} />
      </KPIBand>

      {/* 1) Neden kırılımı derin + 2) Ops korelasyon */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={46} title={L('Neden Kırılımı (segment alt-kırılım)', 'Reason Breakdown (segment sub-split)')}
          why={L('Temas nedenleri + Kurumsal/Bireysel alt-kırılım (stacked). WISMO/Teslimat üstte.', 'Contact reasons + Corporate/Individual sub-split (stacked). WISMO/Delivery on top.')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reasonData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: t.tx2 }} axisLine={false} tickLine={false} width={128} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => [fmtInt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Kurumsal" stackId="r" fill={t.pr} radius={[0, 0, 0, 0]} barSize={16} />
              <Bar dataKey="Bireysel" stackId="r" fill={t.tl} radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="total" position="right" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 9, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={50} title={L('Operasyon Kesişimi: Kargo SL vs Ticket', 'Operations Intersection: Shipping SL vs Tickets')}
          why={L('Kargo SL % (çizgi, sağ) düşünce WISMO/Teslimat ticket hacmi (alan, sol) artıyor — ters korelasyon.', 'When shipping SL% (line, right) drops, WISMO/Delivery ticket volume (area, left) rises — inverse correlation.')}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={ops} margin={{ top: 8, right: 6, bottom: 0, left: -10 }}>
              <defs><linearGradient id="opsTk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.co} stopOpacity={0.35} /><stop offset="100%" stopColor={t.co} stopOpacity={0.04} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tickFormatter={mmdd} tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={30} />
              <YAxis yAxisId="r" orientation="right" domain={[60, 100]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `%${v}`} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(w) => mmdd(String(w))} formatter={(v: number, n) => (n === 'kargoSL' ? [`%${v}`, L('Kargo SL', 'Shipping SL')] : [fmtInt(v), L('WISMO/Teslimat', 'WISMO/Delivery')])} />
              <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => (v === 'kargoSL' ? L('Kargo SL %', 'Shipping SL %') : L('WISMO/Teslimat ticket', 'WISMO/Delivery tickets'))} />
              <ReferenceLine yAxisId="l" x={ops[spikeWk].week} stroke={t.rd} strokeDasharray="5 3" label={{ value: L('SL dibi → ticket zirvesi', 'SL trough → ticket peak'), position: 'top', fontSize: 8.5, fill: t.rd }} />
              <Area yAxisId="l" type="monotone" dataKey="ticketVol" name="ticketVol" stroke={t.co} fill="url(#opsTk)" strokeWidth={1.5} />
              <Line yAxisId="r" type="monotone" dataKey="kargoSL" name="kargoSL" stroke={t.pr} strokeWidth={2.2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3) Self-service / deflection */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={58} title={L('KB Makale Geri Bildirimi (helpful / unhelpful)', 'KB Article Feedback (helpful / unhelpful)')}
          why={L('Crisp Articles feedback deseni — faydalı/faydasız oyları. Yüksek faydalı = deflection potansiyeli.', 'Crisp Articles feedback pattern — helpful/unhelpful votes. High helpful = deflection potential.')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={articleData} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 20, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtInt(Math.abs(v))} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: t.tx2 }} axisLine={false} tickLine={false} width={150} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number, n) => [fmtInt(Math.abs(v)), n === 'helpful' ? L('Faydalı', 'Helpful') : L('Faydasız', 'Unhelpful')]} />
              <ReferenceLine x={0} stroke={t.bd} />
              <Bar dataKey="helpful" name="helpful" fill={t.gn} stackId="a" barSize={15} />
              <Bar dataKey="unhelpful" name="unhelpful" fill={t.rd} stackId="a" barSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={38} title={L('Otomasyon & Deflection Etkisi', 'Automation & Deflection Impact')}
          why={L('AI - Overall Impact: bot containment + KB deflection + arama→ticket düşüşü.', 'AI - Overall Impact: bot containment + KB deflection + search→ticket drop.')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '8px 4px' }}>
            {[[L('Deflection', 'Deflection'), `%${defl.deflectionPct.toFixed(0)}`, t.gn], [L('Bot Kapsama', 'Bot Coverage'), `%${defl.botPct.toFixed(0)}`, t.pr], [L('KB→Ticket Düşüşü', 'KB→Ticket Drop'), `%${defl.ticketDropPct}`, t.tl], [L('AI Genel Etki', 'AI Overall Impact'), `%${defl.aiImpactPct}`, t.am]].map(([lbl, val, c]) => (
              <div key={lbl as string} style={{ background: t.bg2, borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c as string }}>{val as string}</div>
                <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 2 }}>{lbl as string}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: t.tx3, padding: '4px 6px 0', lineHeight: 1.5 }}>{L(`Self-service ile ~${fmtInt(defl.kbDeflected)} temas temsilciye ulaşmadan çözüldü (mock).`, `~${fmtInt(defl.kbDeflected)} contacts resolved via self-service without an agent (mock).`)}</div>
        </ChartCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <AIAlertPanel t={t} lang={lang} alerts={alerts} title={L('Neden & Operasyon İçgörüleri', 'Reason & Operations Insights')} />
      </div>

      {/* Ticket→Sipariş cross-link tablosu */}
      <div style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{L('Ticket → Sipariş Bağlantısı', 'Ticket → Order Cross-Link')}</span>
          <span style={{ fontSize: 11, color: t.tx3 }}>{fmtInt(cross.length)} {L('bağlı temas', 'linked contacts')}</span>
          <div style={{ flex: 1 }} />
          <select value={reasonFlt} onChange={(e) => setReasonFlt(e.target.value as 'all' | Reason)} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 11.5 }}>
            <option value="all">{L('Tüm nedenler', 'All reasons')}</option>
            {reasons.map((r) => <option key={r.reason} value={r.reason}>{r.reason}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>{L('Kayıt No', 'ID')}</th><th style={th}>{L('Neden', 'Reason')}</th><th style={th}>{L('Kanal', 'Channel')}</th>
              <th style={th}>{L('Segment', 'Segment')}</th><th style={th}>{L('Tarih', 'Date')}</th><th style={th}>{L('Sipariş', 'Order')}</th>
            </tr></thead>
            <tbody>
              {crossFiltered.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td, color: t.tx2 }}>{r.id}</td>
                  <td style={td}>{r.reason}</td>
                  <td style={td}>{CH_LABEL[r.channel]}</td>
                  <td style={{ ...td, color: t.tx2 }}>{r.segment}</td>
                  <td style={{ ...td, color: t.tx3 }}>{r.date}</td>
                  <td style={td}><span onClick={() => onSelectRep?.('satis__11')} title={L('Satış/Operasyon sipariş kaydı (placeholder)', 'Sales/Ops order record (placeholder)')} style={{ color: t.pr, fontWeight: 600, cursor: 'pointer' }}>↗ {r.orderId}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: t.tx3, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="info" size={12} color={t.tx3} />
        {L('Kargo SL zaman serisi bağımsız mock’tur (Operasyon modülü gerçek veri sağlamıyor); WISMO/Teslimat hacmiyle ters korele üretilir. Sipariş linkleri placeholder.', 'Shipping-SL series is an independent mock (Operations provides no real data); generated inversely correlated with WISMO/Delivery volume. Order links are placeholders.')}
      </div>
    </ReportPageLayout>
  );
};

export default NedenlerOperasyon;
