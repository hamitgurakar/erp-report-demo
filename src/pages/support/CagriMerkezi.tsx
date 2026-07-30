import { useMemo, useState, type CSSProperties } from 'react';
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  getVoiceKpis, getVoiceHourly, getVoiceDaily, getWaitBuckets, getVoiceFunnel, getVoiceAgentStats, getCdrRows,
  type VoiceAgentStat, type CdrRow, type Direction, type Result,
} from '../../constants/supportData';
import {
  ReportPageLayout, KPIBand, KPICard, ChartCard, GaugeCard, StatusBadge,
} from '../../components/finance';
import { Icon } from '../../components/ui/Icon';
import type { FinancePageProps } from '../finance/_Placeholder';

const fmtMMSS = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtClock = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}s ${Math.round((s % 3600) / 60)}dk` : fmtMMSS(s));
const fmtInt = (n: number) => n.toLocaleString('tr-TR');
const mmdd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const dtLabel = (iso: string) => { const d = new Date(iso); return `${mmdd(iso)} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const RESULT_TR: Record<Result, string> = { agent_answered: 'Cevaplandı', ivr_answered: 'IVR', abandoned: 'Kaçan', voicemail: 'Sesli mesaj', resolved: 'Çözüldü', bot_contained: 'Bot' };

export const CagriMerkezi = ({ t, lang }: FinancePageProps) => {
  const en = lang === 'en';
  const L = (tr: string, e: string) => (en ? e : tr);

  const vk = useMemo(() => getVoiceKpis(), []);
  const hourly = useMemo(() => getVoiceHourly(), []);
  const daily = useMemo(() => getVoiceDaily(30), []);
  const waits = useMemo(() => getWaitBuckets(), []);
  const funnel = useMemo(() => getVoiceFunnel(), []);
  const agents = useMemo(() => getVoiceAgentStats(), []);
  const cdr = useMemo(() => getCdrRows(), []);

  const [sortKey, setSortKey] = useState<keyof VoiceAgentStat>('cevaplanan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [fltDir, setFltDir] = useState<'all' | Direction>('all');
  const [fltRes, setFltRes] = useState<'all' | Result>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 25;

  const st = (v: number, g: number, y: number, dir: 'up' | 'down' = 'up') => {
    const good = dir === 'up' ? v >= g : v <= g; const warn = dir === 'up' ? v >= y : v <= y;
    return good ? t.gn : warn ? t.am : t.rd;
  };
  const slColor = st(vk.sl.value, 80, 60, 'up');

  const sortedAgents = useMemo(() => {
    const arr = [...agents].sort((a, b) => { const av = a[sortKey] as number, bv = b[sortKey] as number; return sortDir === 'asc' ? av - bv : bv - av; });
    return arr;
  }, [agents, sortKey, sortDir]);
  const toggleSort = (k: keyof VoiceAgentStat) => { if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(k); setSortDir('desc'); } };

  const cdrFiltered = useMemo(() => cdr.filter((r) =>
    (fltDir === 'all' || r.direction === fltDir) && (fltRes === 'all' || r.result === fltRes) &&
    (search === '' || r.customerRef.includes(search) || r.id.includes(search))), [cdr, fltDir, fltRes, search]);
  const cdrPage = cdrFiltered.slice(page * PAGE, page * PAGE + PAGE);
  const pageCount = Math.ceil(cdrFiltered.length / PAGE);

  const card: CSSProperties = { background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10 };
  const th: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: t.tx3, textTransform: 'uppercase', letterSpacing: 0.3, padding: '8px 10px', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.bd}` };
  const td: CSSProperties = { fontSize: 11.5, color: t.tx, padding: '7px 10px', borderTop: `1px solid ${t.bd}`, whiteSpace: 'nowrap' };
  const sortTh = (k: keyof VoiceAgentStat, label: string, align: 'left' | 'right' = 'right'): CSSProperties => ({ ...th, textAlign: align, cursor: 'pointer', color: sortKey === k ? t.pr : t.tx3 });

  // heatmap renk (saatlik)
  const maxAns = Math.max(...hourly.map((h) => h.cevaplanan), 1);
  const maxKac = Math.max(...hourly.map((h) => h.kacan), 1);
  const cellBg = (v: number, max: number, base: string) => { const a = Math.max(0.05, v / max); return base === 'g' ? `rgba(13,148,136,${a.toFixed(2)})` : `rgba(220,38,38,${a.toFixed(2)})`; };

  const funnelMax = funnel[0].value || 1;
  const funnelColor = [t.pr, t.tl, t.rd, t.gn, t.tx3];

  // canlı kuyruk (statik mock)
  const liveAgents = [
    { id: '1000', name: 'Batuhan', durum: 'Çağrıda' }, { id: '1001', name: 'Ahmet', durum: 'Müsait' },
    { id: '1004', name: 'Benan', durum: 'Çağrıda' }, { id: '1005', name: 'Çisem', durum: 'Çevrimdışı' },
  ];
  const durumTone = (d: string) => (d === 'Müsait' ? t.gn : d === 'Çağrıda' ? t.pr : t.tx3);

  return (
    <ReportPageLayout
      t={t} lang={lang} title={L('Çağrı Merkezi', 'Call Center')}
      subtitle={L('%100 ses (Verimor Bulut Santral). Kuyruk 200 · Müşteri Destek. Son 6 ay.', '100% voice (Verimor). Queue 200 · Support. Last 6 months.')}
    >
      <KPIBand>
        <KPICard t={t} lang={lang} title={L('Toplam Çağrı', 'Total Calls')} value={fmtInt(vk.total.value)} trend={{ value: vk.total.mom }} goodDir="up" sparkColor={t.pr}
          infoText={L('Gelen + giden çağrı adedi. MoM önceki aya göre.', 'Inbound + outbound calls. MoM vs previous month.')} hint={L(`Gelen ${fmtInt(vk.gelen)} · Giden ${fmtInt(vk.giden)}`, `In ${fmtInt(vk.gelen)} · Out ${fmtInt(vk.giden)}`)} />
        <KPICard t={t} lang={lang} title={L('Cevaplama %', 'Answer Rate %')} value={`%${vk.cevaplamaPct.value.toFixed(0)}`} trend={{ value: vk.cevaplamaPct.mom }} goodDir="up" sparkColor={st(vk.cevaplamaPct.value, 80, 60, 'up')}
          infoText={L('Ajan/IVR ile cevaplanan gelen çağrı oranı.', 'Share of inbound calls answered by agent/IVR.')} hint={L('gelen çağrılar', 'inbound')} />
        <KPICard t={t} lang={lang} title={L('Kaçan %', 'Abandoned %')} value={`%${vk.kacanPct.value.toFixed(1)}`} trend={{ value: vk.kacanPct.mom }} goodDir="down" sparkColor={st(vk.kacanPct.value, 10, 25, 'down')}
          infoText={L('Cevaplanmadan bırakılan gelen çağrı. Dönülen ile birlikte okunur (B2B kurtarma).', 'Inbound calls dropped before answer. Read with recovered (B2B rescue).')} hint={L(`Dönülen %${vk.donulenPct.toFixed(0)}`, `Recovered ${vk.donulenPct.toFixed(0)}%`)} />
        <KPICard t={t} lang={lang} title={L('Servis Seviyesi %', 'Service Level %')} value={`%${vk.sl.value.toFixed(0)}`} trend={{ value: vk.sl.mom }} goodDir="up" sparkColor={slColor}
          infoText={L('30sn içinde ajanla cevaplama (Verimor SL). Hedef ≥%80.', 'Answered by agent within 30s (Verimor SL). Target ≥80%.')} hint={L('hedef 30sn ≥%80', 'target 30s ≥80%')} />
        <KPICard t={t} lang={lang} title={L('Ort. Bekletme + AHT', 'Avg Wait + AHT')} value={fmtMMSS(vk.avgWait.value)} trend={{ value: vk.avgWait.mom }} goodDir="down" sparkColor={t.tl}
          infoText={L('Ort. kuyruk beklemesi (cevaplananlarda) + türetilmiş AHT = bekleme + konuşma.', 'Avg queue wait (answered only) + derived AHT = wait + talk.')} hint={L(`AHT ${fmtMMSS(vk.aht.value)}`, `AHT ${fmtMMSS(vk.aht.value)}`)} />
      </KPIBand>

      {/* 1) Saatlik Heatmap + 3) Bekleme Histogram */}
      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={58} title={L('Saatlik Çağrı Heatmap (cevaplanan / kaçan)', 'Hourly Heatmap (answered / abandoned)')}
          why={L('Verimor saatlik istatistik — kurumsal mesai (09-18) yoğun; kaçan zirvesi personel planlaması.', 'Verimor hourly stats — corporate hours (09-18) peak; abandoned peak drives staffing.')}>
          <div style={{ overflowX: 'auto', padding: '6px 0' }}>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {([['cevaplanan', L('Cevaplanan', 'Answered'), 'g'], ['kacan', L('Kaçan', 'Abandoned'), 'r']] as const).map(([key, label, base]) => (
                  <tr key={key}>
                    <td style={{ fontSize: 10, color: t.tx2, fontWeight: 600, padding: '2px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{label}</td>
                    {hourly.map((h) => {
                      const v = key === 'cevaplanan' ? h.cevaplanan : h.kacan;
                      return <td key={h.hour} style={{ padding: 1 }}><div title={`${String(h.hour).padStart(2, '0')}:00 · ${label} ${v}`} style={{ width: 20, height: 22, borderRadius: 3, background: cellBg(v, base === 'g' ? maxAns : maxKac, base), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: t.tx3 }} /></td>;
                    })}
                  </tr>
                ))}
                <tr><td /> {hourly.map((h) => <td key={h.hour} style={{ fontSize: 8, color: t.tx3, textAlign: 'center', paddingTop: 2 }}>{h.hour % 3 === 0 ? String(h.hour).padStart(2, '0') : ''}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={L('Bekleme Kovası Histogram', 'Wait-Time Histogram')}
          why={L('Kuyruk bekleme dağılımı; 30sn SL eşiği çizili.', 'Queue wait distribution; 30s SL threshold marked.')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={waits} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 9.5, fill: t.tx3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} formatter={(v: number) => [fmtInt(v), L('Çağrı', 'Calls')]} />
              <ReferenceLine x="21-30" stroke={t.rd} strokeDasharray="5 3" label={{ value: L('30sn hedef', '30s target'), position: 'top', fontSize: 9, fill: t.rd }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={30}>
                {waits.map((w, i) => <Cell key={i} fill={i <= 2 ? t.gn : t.am} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: t.tx3, marginTop: 4 }}>{L('Bekleme yalnızca cevaplanan çağrılar üzerinden hesaplanmıştır.', 'Wait is computed on answered calls only.')}</div>
        </ChartCard>
      </div>

      {/* 2) Günlük Çağrı & Dakika + 4) Funnel */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <ChartCard t={t} lang={lang} span={58} title={L('Günlük Çağrı & Dakika Trendi (son 30 gün)', 'Daily Calls & Minutes (last 30 days)')}
          why={L('Çağrı adedi (bar) + konuşma dakikası (çizgi, sağ eksen); gelen/giden ayrı.', 'Call count (bar) + talk minutes (line, right axis); inbound/outbound split.')}>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={daily} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="date" tickFormatter={mmdd} tick={{ fontSize: 9, fill: t.tx3 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={32} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: t.tx3 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${t.bd}`, background: t.cd }} labelFormatter={(d) => mmdd(String(d))} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar yAxisId="l" dataKey="gelen" name={L('Gelen çağrı', 'Inbound')} fill={t.pr} radius={[2, 2, 0, 0]} barSize={5} />
              <Bar yAxisId="l" dataKey="giden" name={L('Giden çağrı', 'Outbound')} fill={t.tl} radius={[2, 2, 0, 0]} barSize={5} />
              <Line yAxisId="r" type="monotone" dataKey="gelenDk" name={L('Gelen dk', 'In min')} stroke={t.am} strokeWidth={1.8} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="gidenDk" name={L('Giden dk', 'Out min')} stroke={t.co} strokeWidth={1.8} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} lang={lang} span={40} title={L('Kaçan → Dönülen Hunisi', 'Abandoned → Recovered Funnel')}
          why={L('Gelen→Cevaplanan→Kaçan→Dönülen→Hâlâ kayıp. B2B’de kaçan geri aranır.', 'Offered→Answered→Abandoned→Recovered→Lost. B2B calls back abandoned callers.')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 6px' }}>
            {funnel.map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 84, fontSize: 11.5, color: t.tx2, textAlign: 'right' }}>{L(f.label, ['Offered', 'Answered', 'Abandoned', 'Recovered', 'Lost'][i])}</div>
                <div style={{ flex: 1, background: t.bg2, borderRadius: 6, overflow: 'hidden', height: 24 }}>
                  <div style={{ width: `${Math.max(4, (f.value / funnelMax) * 100)}%`, background: funnelColor[i], height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 8, color: '#fff', fontSize: 11, fontWeight: 700 }}>{fmtInt(f.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 5) Dahili Performans Tablosu + 6) Canlı Kuyruk */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ ...card, flex: '1 1 62%', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}` }}>{L('Dahili (Agent) Performansı', 'Extension (Agent) Performance')}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={{ ...th, textAlign: 'left' }}>{L('Dahili', 'Ext.')}</th>
                <th style={sortTh('cevaplanan', L('Cevaplanan', 'Answered'))} onClick={() => toggleSort('cevaplanan')}>{L('Cevaplanan', 'Answered')}</th>
                <th style={sortTh('kacan', L('Kaçan', 'Abandoned'))} onClick={() => toggleSort('kacan')}>{L('Kaçan', 'Aband.')}</th>
                <th style={sortTh('basariPct', L('Başarı %', 'Success %'))} onClick={() => toggleSort('basariPct')}>{L('Başarı %', 'Success %')}</th>
                <th style={sortTh('toplamKonusmaSec', L('Toplam', 'Total'))} onClick={() => toggleSort('toplamKonusmaSec')}>{L('Toplam Konuşma', 'Total Talk')}</th>
                <th style={sortTh('ortKonusmaSec', L('Ort.', 'Avg'))} onClick={() => toggleSort('ortKonusmaSec')}>{L('Ort.', 'Avg')}</th>
                <th style={sortTh('enUzunSec', L('En Uzun', 'Longest'))} onClick={() => toggleSort('enUzunSec')}>{L('En Uzun', 'Longest')}</th>
                <th style={sortTh('gidenBasariPct', L('Giden Başarı %', 'Out Success %'))} onClick={() => toggleSort('gidenBasariPct')}>{L('Giden Başarı %', 'Out Succ %')}</th>
              </tr></thead>
              <tbody>
                {sortedAgents.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{a.id} <span style={{ color: t.tx2, fontWeight: 500 }}>{a.name}</span></td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtInt(a.cevaplanan)}</td>
                    <td style={{ ...td, textAlign: 'right', color: t.tx2 }}>{fmtInt(a.kacan)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: st(a.basariPct, 80, 60, 'up') }}>%{a.basariPct.toFixed(0)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtClock(a.toplamKonusmaSec)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtMMSS(a.ortKonusmaSec)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmtMMSS(a.enUzunSec)}</td>
                    <td style={{ ...td, textAlign: 'right', color: st(a.gidenBasariPct, 80, 60, 'up') }}>%{a.gidenBasariPct.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...card, flex: '1 1 32%', minWidth: 240, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: t.tx, borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {L('Canlı Kuyruk', 'Live Queue')}
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx3, fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}><Icon name="refresh" size={11} color={t.tx3} /> {L('Yenile', 'Refresh')}</button>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', gap: 10 }}>
            {[[L('Bekleyen', 'Waiting'), '3', t.am], [L('Çağrıda', 'On call'), '2', t.pr], [L('Müsait', 'Available'), '1', t.gn]].map(([lbl, val, c]) => (
              <div key={lbl as string} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: t.bg2, borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{val as string}</div>
                <div style={{ fontSize: 10, color: t.tx3 }}>{lbl as string}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            <GaugeCard t={t} value={vk.sl.value} min={0} max={100} label={L('Canlı SL %', 'Live SL %')} format={(v) => `%${v.toFixed(0)}`}
              thresholds={[{ limit: 60, color: t.rd }, { limit: 80, color: t.am }, { limit: 100, color: t.gn }]} />
          </div>
          <div style={{ borderTop: `1px solid ${t.bd}` }}>
            {liveAgents.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', borderTop: `1px solid ${t.bd}` }}>
                <span style={{ fontSize: 11.5, color: t.tx }}>{a.id} · {a.name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: durumTone(a.durum) }}><span style={{ width: 7, height: 7, borderRadius: 4, background: durumTone(a.durum) }} />{L(a.durum, a.durum === 'Müsait' ? 'Available' : a.durum === 'Çağrıda' ? 'On call' : 'Offline')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CDR detay tablosu */}
      <div style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.tx }}>{L('CDR Detay', 'CDR Detail')}</span>
          <span style={{ fontSize: 11, color: t.tx3 }}>{fmtInt(cdrFiltered.length)} {L('kayıt', 'records')}</span>
          <div style={{ flex: 1 }} />
          <select value={fltDir} onChange={(e) => { setFltDir(e.target.value as 'all' | Direction); setPage(0); }} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 11.5 }}>
            <option value="all">{L('Tüm yönler', 'All directions')}</option><option value="inbound">{L('Gelen', 'Inbound')}</option><option value="outbound">{L('Giden', 'Outbound')}</option>
          </select>
          <select value={fltRes} onChange={(e) => { setFltRes(e.target.value as 'all' | Result); setPage(0); }} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 11.5 }}>
            <option value="all">{L('Tüm sonuçlar', 'All results')}</option><option value="agent_answered">{L('Cevaplandı', 'Answered')}</option><option value="ivr_answered">IVR</option><option value="abandoned">{L('Kaçan', 'Abandoned')}</option>
          </select>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={L('Arayan / kayıt no', 'Caller / id')} style={{ padding: '5px 9px', borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg, color: t.tx, fontSize: 11.5, width: 150 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[L('Kayıt No', 'ID'), L('Arama', 'Start'), L('Kapatma', 'End'), L('Yön', 'Dir.'), L('Arayan', 'Caller'), L('Dahili', 'Ext.'), L('Süre', 'Dur.'), L('Konuşma', 'Talk'), L('Sonuç', 'Result'), L('Kaçan', 'Aband.'), L('Dönülen', 'Recov.'), L('Kayıt', 'Rec.')].map((h, i) => (
                <th key={i} style={{ ...th, textAlign: i >= 6 && i <= 7 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {cdrPage.map((r: CdrRow) => (
                <tr key={r.id} style={{ cursor: r.linkedOrderId ? 'pointer' : 'default' }} title={r.linkedOrderId ? L(`Sipariş: ${r.linkedOrderId} (yakında)`, `Order: ${r.linkedOrderId} (soon)`) : ''}>
                  <td style={{ ...td, color: t.tx2 }}>{r.id}</td>
                  <td style={td}>{dtLabel(r.startAt)}</td>
                  <td style={{ ...td, color: t.tx3 }}>{dtLabel(r.endAt)}</td>
                  <td style={td}>{r.direction === 'inbound' ? L('Gelen', 'In') : L('Giden', 'Out')}</td>
                  <td style={{ ...td, color: t.tx2 }}>{r.customerRef}{r.linkedOrderId && <span style={{ color: t.pr, marginLeft: 5, fontSize: 10 }}>↗{r.linkedOrderId}</span>}</td>
                  <td style={td}>{r.agentId ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmtMMSS(r.durationSec)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{r.talkSec ? fmtMMSS(r.talkSec) : '—'}</td>
                  <td style={td}><span style={{ fontSize: 10.5, fontWeight: 600, color: r.result === 'abandoned' ? t.rd : r.result === 'agent_answered' ? t.gn : t.tx2 }}>{RESULT_TR[r.result]}</span></td>
                  <td style={td}>{r.abandoned ? L('Evet', 'Yes') : '—'}</td>
                  <td style={td}>{r.recovered ? <span style={{ color: t.gn }}>{L('Evet', 'Yes')}</span> : '—'}</td>
                  <td style={td}>{r.hasRecording ? <Icon name="headphones" size={12} color={t.tx3} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '9px 16px', borderTop: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: t.tx3 }}>
          <span>{L(`Sayfa ${page + 1}/${pageCount || 1}`, `Page ${page + 1}/${pageCount || 1}`)}</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.bd}`, background: page === 0 ? t.bg2 : t.cd, color: t.tx2, fontSize: 11, cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}>{L('Önceki', 'Prev')}</button>
            <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.bd}`, background: page >= pageCount - 1 ? t.bg2 : t.cd, color: t.tx2, fontSize: 11, cursor: page >= pageCount - 1 ? 'default' : 'pointer', opacity: page >= pageCount - 1 ? 0.5 : 1 }}>{L('Sonraki', 'Next')}</button>
          </span>
        </div>
      </div>
    </ReportPageLayout>
  );
};

export default CagriMerkezi;
