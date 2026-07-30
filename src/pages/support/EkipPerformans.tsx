import { useMemo, useState, type CSSProperties } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { getEkipKpis, getOperatorLeaderboard, getWorkload, getPresence, getVoiceAgentStats, type Operator, type VoiceAgentStat } from '../../constants/supportData';
import { ReportPageLayout, KPIBand, KPICard, ChartCard, StatusBadge } from '../../components/finance';
import type { FinancePageProps } from '../finance/_Placeholder';

const fmtMMSS = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtClock = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}s ${Math.round((s % 3600) / 60)}dk` : fmtMMSS(s));
const fmtInt = (n: number) => n.toLocaleString('tr-TR');

export const EkipPerformans = ({ t, lang }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const kp = useMemo(() => getEkipKpis(), []);
  const lb = useMemo(() => getOperatorLeaderboard(), []);
  const workload = useMemo(() => getWorkload(), []);
  const presence = useMemo(() => getPresence(), []);
  const voiceAgents = useMemo(() => getVoiceAgentStats(), []);

  const [sortKey, setSortKey] = useState<keyof Operator>('count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const toggle = (k: keyof Operator) => { if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(k); setSortDir('desc'); } };
  const sorted = useMemo(() => [...lb].sort((a, b) => { const av = a[sortKey], bv = b[sortKey]; if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av; return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); }), [lb, sortKey, sortDir]);

  const st = (v: number, g: number, y: number) => (v >= g ? t.gn : v >= y ? t.am : t.rd);
  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const th: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.3, padding: '8px 10px', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.bd}` };
  const td: CSSProperties = { fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const sortTh = (k: keyof Operator, align: 'left' | 'right' | 'center' = 'right'): CSSProperties => ({ ...th, textAlign: align, cursor: 'pointer', color: sortKey === k ? t.pr : t.tx3 });

  const csatData = [...lb].sort((a, b) => b.csat - a.csat).map((o) => ({ name: o.name.replace('Dijital Operatör', 'D.Op.'), csat: +o.csat.toFixed(2), badge: o.badge }));
  const wlData = workload.map((o) => ({ name: o.name.replace('Dijital Operatör', 'D.Op.'), count: o.count, kind: o.kind }));
  const wlAvg = workload.reduce((s, o) => s + o.count, 0) / (workload.length || 1);

  const badgeEl = (b: Operator['badge']) => b === 'top'
    ? <StatusBadge t={t} tone="green" label={L('Top performer', 'Top performer')} />
    : b === 'attention' ? <StatusBadge t={t} tone="amber" label={L('Dikkat gerekli', 'Needs attention')} />
      : <span style={{ fontSize: 10.5, color: t.tx3 }}>—</span>;
  const durumTone = (d: string) => (d === 'Müsait' ? t.gn : d === 'Çağrıda' ? t.pr : t.tx3);

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Ekip & Temsilci', 'Team & Agents')}
      subtitle={L('Operatör performansı, memnuniyet, iş yükü dengesi ve canlı meşguliyet. Ses (Verimor) + dijital (Crisp). Son 6 ay.', 'Operator performance, satisfaction, workload balance and live presence. Voice + digital. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Aktif Temsilci', 'Active Agents')} value={fmtInt(kp.aktif.value)} trend={{ value: kp.aktif.mom }} goodDir="up" sparkColor={t.pr}
          infoText={L('Dönemde etkileşim işleyen benzersiz temsilci sayısı (ses + dijital).', 'Unique agents handling interactions in the period (voice + digital).')} hint={L('ses + dijital', 'voice + digital')} />
        <KPICard t={t} lang={lang} title={L('Ort. CSAT (ekip)', 'Avg CSAT (team)')} value={`${kp.csat.value.toFixed(2)}/5`} trend={{ value: kp.csat.mom }} goodDir="up" sparkColor={st(kp.csat.value, 4.25, 3.75)}
          infoText={L('Ekip geneli müşteri memnuniyeti. Hedef ≥4,25 (yeşil).', 'Team-wide customer satisfaction. Target ≥4.25 (green).')} hint={L('hedef ≥4,25', 'target ≥4.25')} />
        <KPICard t={t} lang={lang} title={L('Ort. Yanıt Süresi', 'Avg Response Time')} value={fmtMMSS(kp.ortYanit.value)} trend={{ value: kp.ortYanit.mom }} goodDir="down" sparkColor={t.tl}
          infoText={L('Canlı kanal ilk yanıt + cevaplanan ses ASA (e-posta async hariç).', 'Live-channel first response + answered voice ASA (email async excluded).')} hint={L('canlı + ses', 'live + voice')} />
        <KPICard t={t} lang={lang} title={L('Etkileşim / Temsilci', 'Interactions / Agent')} value={fmtInt(Math.round(kp.etkPerTemsilci.value))} trend={{ value: kp.etkPerTemsilci.mom }} goodDir="up" sparkColor={t.am}
          infoText={L('Temsilci başına ortalama işlenen etkileşim (iş yükü).', 'Average interactions handled per agent (workload).')} hint={L('iş yükü', 'workload')} />
      </KPIBand>

      {/* 1) Leaderboard */}
      <div style={{ ...card, marginTop: 18, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Operatör Leaderboard', 'Operator Leaderboard')} <span style={{ fontSize: 11, color: t.tx3, fontWeight: 400 }}>· {L('başlığa tıkla → sırala', 'click header → sort')}</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ ...th, textAlign: 'left' }}>{L('Temsilci', 'Agent')}</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Tip', 'Type')}</th>
              <th style={sortTh('count')} onClick={() => toggle('count')}>{L('Konuşma/Çağrı', 'Conv./Calls')}</th>
              <th style={sortTh('avgRespSec')} onClick={() => toggle('avgRespSec')}>{L('Ort. Yanıt', 'Avg Response')}</th>
              <th style={sortTh('csat')} onClick={() => toggle('csat')}>CSAT</th>
              <th style={{ ...th, textAlign: 'center' }}>{L('Rozet', 'Badge')}</th>
            </tr></thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{o.kind === 'voice' ? `${o.id} · ` : ''}{o.name}</td>
                  <td style={{ ...td, textAlign: 'center', color: t.tx2 }}>{o.kind === 'voice' ? L('Ses', 'Voice') : L('Dijital', 'Digital')}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmtInt(o.count)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{o.avgRespSec ? fmtMMSS(o.avgRespSec) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: st(o.csat, 4.25, 3.75) }}>{o.csat ? o.csat.toFixed(2) : '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{badgeEl(o.badge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2) Satisfaction per operator + 3) İş yükü dengesi */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={50} title={L('Operatör Başına CSAT', 'CSAT per Operator')}
          why={L('Ajan bazında memnuniyet; hedef 4,25 (renk). Crisp satisfaction-per-operator deseni.', 'Satisfaction by agent; target 4.25 (color). Crisp satisfaction-per-operator pattern.')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={csatData} margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={44} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [`${v.toFixed(2)}/5`, 'CSAT']} />
              <Bar dataKey="csat" radius={[3, 3, 0, 0]} barSize={22}>
                {csatData.map((d, i) => <Cell key={i} fill={d.csat >= 4.25 ? t.gn : d.csat >= 3.75 ? t.am : t.rd} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={46} title={L('İş Yükü Dengesi', 'Workload Balance')}
          why={L('Temsilci başına etkileşim hacmi; ortalama çizgisinin çok üstü/altı dengesizlik sinyali.', 'Interaction volume per agent; far above/below the average line signals imbalance.')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wlData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: t.tx2 }} axisLine={false} tickLine={false} width={64} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Etkileşim', 'Interactions')]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15}>
                {wlData.map((d, i) => <Cell key={i} fill={d.count > wlAvg * 1.15 ? t.rd : d.count < wlAvg * 0.85 ? t.am : t.pr} />)}
                <LabelList dataKey="count" position="right" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 9, fill: t.tx2, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx3, marginTop: 4 }}>{L(`Ortalama ${Math.round(wlAvg)} etkileşim/temsilci · kırmızı = %15 üstü, sarı = %15 altı`, `Avg ${Math.round(wlAvg)} interactions/agent · red = >15% over, amber = >15% under`)}</div>
        </ChartCard>
      </div>

      {/* 4) Ses Agent Tablosu + 5) Canlı Meşguliyet */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ ...card, flex: '1 1 60%', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Ses Agent Tablosu (Verimor)', 'Voice Agent Table (Verimor)')}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={{ ...th, textAlign: 'left' }}>{L('Dahili', 'Ext.')}</th>
                <th style={{ ...th, textAlign: 'right' }}>{L('Cevaplanan', 'Answered')}</th>
                <th style={{ ...th, textAlign: 'right' }}>{L('Kaçan', 'Aband.')}</th>
                <th style={{ ...th, textAlign: 'right' }}>{L('Başarı %', 'Success %')}</th>
                <th style={{ ...th, textAlign: 'right' }}>{L('Toplam Konuşma', 'Total Talk')}</th>
                <th style={{ ...th, textAlign: 'right' }}>{L('Ort. Konuşma', 'Avg Talk')}</th>
              </tr></thead>
              <tbody>
                {voiceAgents.map((a: VoiceAgentStat) => (
                  <tr key={a.id}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{a.id} <span style={{ color: t.tx2, fontWeight: 500 }}>{a.name}</span></td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtInt(a.cevaplanan)}</td>
                    <td style={{ ...td, textAlign: 'right', color: t.tx2 }}>{fmtInt(a.kacan)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: st(a.basariPct, 80, 60) }}>%{a.basariPct.toFixed(0)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtClock(a.toplamKonusmaSec)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtMMSS(a.ortKonusmaSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...card, flex: '1 1 34%', minWidth: 240, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Canlı Meşguliyet', 'Live Presence')}</div>
          <div style={{ display: 'flex', gap: 8, padding: '10px 16px', flexWrap: 'wrap' }}>
            {(['Müsait', 'Çağrıda', 'Çevrimdışı'] as const).map((d) => (
              <div key={d} style={{ flex: 1, minWidth: 64, textAlign: 'center', padding: '7px 4px', background: t.bg2, borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: durumTone(d) }}>{presence.filter((x) => x.durum === d).length}</div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{L(d, d === 'Müsait' ? 'Available' : d === 'Çağrıda' ? 'On call' : 'Offline')}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${t.bd}` }}>
            {presence.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', borderTop: `1px solid ${t.bd}` }}>
                <span style={{ fontSize: 11.5, color: t.tx }}>{a.kind === 'voice' ? `${a.id} · ` : ''}{a.name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: durumTone(a.durum) }}><span style={{ width: 7, height: 7, borderRadius: 4, background: durumTone(a.durum) }} />{L(a.durum, a.durum === 'Müsait' ? 'Available' : a.durum === 'Çağrıda' ? 'On call' : 'Offline')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReportPageLayout>
  );
};

export default EkipPerformans;
