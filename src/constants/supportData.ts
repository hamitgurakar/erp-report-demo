// Müşteri Destek — birleşik mock data (Verimor ses + Crisp dijital). docs/support-suite-brief.md B1-B3.
// Deterministik seed → her build'de aynı. ~3.000 etkileşim / son 6 ay (2026-02 … 2026-07).

export type Channel = 'phone' | 'chat' | 'email' | 'whatsapp' | 'messenger' | 'instagram';
export type Direction = 'inbound' | 'outbound';
export type Result = 'agent_answered' | 'ivr_answered' | 'abandoned' | 'voicemail' | 'resolved' | 'bot_contained';
export type Reason = 'WISMO' | 'Teslimat' | 'Fatura/İrsaliye' | 'Ürün Kalite/Hasar' | 'Kişiselleştirme/Baskı' | 'İade/Değişim' | 'Toplu/Kurumsal Talep' | 'Diğer';

export interface SupportInteraction {
  id: string;
  channel: Channel;
  direction: Direction;
  customerRef: string;
  customerName?: string;
  segment: 'Kurumsal' | 'Bireysel';
  agentId: string | null;
  agentName?: string;
  queue: string;
  startAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  endAt: string;
  waitSec: number;
  talkSec: number;
  frtSec?: number;
  resolutionSec?: number;
  handleSec: number;      // TÜRETİLMİŞ AHT = waitSec + talkSec
  result: Result;
  abandoned: boolean;
  recovered: boolean;
  reopened: boolean;
  botContained?: boolean;
  hasRecording?: boolean;
  reason: Reason;
  csat?: number;
  csatComment?: string;
  city?: string;
  linkedOrderId?: string;
}

// ── deterministik PRNG (mulberry32) ──
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(r: number, items: [T, number][]): T => { let acc = 0; for (const [v, w] of items) { acc += w; if (r < acc) return v; } return items[items.length - 1][0]; };
const between = (r: number, lo: number, hi: number) => Math.round(lo + r * (hi - lo));
const iso = (y: number, mo: number, d: number, h: number, mi: number, sc: number) => new Date(Date.UTC(y, mo - 1, d, h, mi, sc)).toISOString();
const addSec = (isoStr: string, sec: number) => new Date(new Date(isoStr).getTime() + sec * 1000).toISOString();

const CHANNELS: [Channel, number][] = [['whatsapp', 0.30], ['phone', 0.25], ['chat', 0.25], ['email', 0.15], ['messenger', 0.03], ['instagram', 0.02]];
const REASONS: [Reason, number][] = [['WISMO', 0.20], ['Teslimat', 0.15], ['Ürün Kalite/Hasar', 0.15], ['Fatura/İrsaliye', 0.13], ['Kişiselleştirme/Baskı', 0.12], ['İade/Değişim', 0.10], ['Toplu/Kurumsal Talep', 0.10], ['Diğer', 0.05]];
const CITIES: [string, number][] = [['İstanbul', 0.35], ['Ankara', 0.18], ['İzmir', 0.13], ['Bursa', 0.09], ['Antalya', 0.07], ['Adana', 0.06], ['Konya', 0.06], ['Gaziantep', 0.06]];
// Son 6 ay + sezon zirvesi (Şub sevgililer; yıl ortası kurumsal hediye dönemi Tem)
const MONTHS: { y: number; m: number; w: number }[] = [
  { y: 2026, m: 2, w: 1.45 }, { y: 2026, m: 3, w: 1.0 }, { y: 2026, m: 4, w: 0.9 },
  { y: 2026, m: 5, w: 1.0 }, { y: 2026, m: 6, w: 0.95 }, { y: 2026, m: 7, w: 1.15 },
];
const DAYS_IN = (y: number, m: number) => (m === 7 ? 30 : new Date(Date.UTC(y, m, 0)).getUTCDate()); // Tem: 30'a kadar
const VOICE_AGENTS = [{ id: '1000', name: 'Batuhan' }, { id: '1001', name: 'Ahmet' }, { id: '1004', name: 'Benan' }, { id: '1005', name: 'Çisem' }];
const DIGITAL_AGENTS = [{ id: 'D01', name: 'Dijital Operatör 1' }, { id: 'D02', name: 'Dijital Operatör 2' }, { id: 'D03', name: 'Dijital Operatör 3' }, { id: 'D04', name: 'Dijital Operatör 4' }, { id: 'D05', name: 'Dijital Operatör 5' }];
const DIGITAL: Channel[] = ['chat', 'email', 'whatsapp', 'messenger', 'instagram'];
const FAST_DIGITAL: Channel[] = ['chat', 'whatsapp', 'messenger', 'instagram'];
export const SLA_TARGET_SEC: Record<Channel, number> = { chat: 900, whatsapp: 900, messenger: 900, instagram: 900, email: 86400, phone: 30 };
export const VOICE_SL_SEC = 30;

const monthNorm = (() => { const tot = MONTHS.reduce((s, m) => s + m.w, 0); let acc = 0; return MONTHS.map((m) => { acc += m.w / tot; return { ...m, cum: acc }; }); })();

const TOTAL = 3000;

const generate = (): SupportInteraction[] => {
  const rng = mulberry32(20260730);
  const out: SupportInteraction[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const channel = pick(rng(), CHANNELS);
    const isVoice = channel === 'phone';
    const segment: 'Kurumsal' | 'Bireysel' = rng() < 0.70 ? 'Kurumsal' : 'Bireysel';
    const direction: Direction = rng() < 0.88 ? 'inbound' : 'outbound';
    const reason = pick(rng(), REASONS);
    const city = pick(rng(), CITIES);

    // tarih — sezon ağırlıklı ay + iş-saati ağırlıklı saat
    const mr = rng(); const mo = monthNorm.find((m) => mr < m.cum) ?? monthNorm[monthNorm.length - 1];
    const day = between(rng(), 1, DAYS_IN(mo.y, mo.m));
    // saat: Kurumsal 09-18 yoğun; Bireysel akşama da yayılır
    const hourBuckets: [number, number][] = segment === 'Kurumsal'
      ? [[10, 0.30], [14, 0.34], [17, 0.20], [20, 0.08], [8, 0.05], [23, 0.03]]
      : [[11, 0.22], [15, 0.24], [19, 0.26], [21, 0.16], [9, 0.08], [1, 0.04]];
    const hBase = pick(rng(), hourBuckets); const hour = Math.min(23, Math.max(0, hBase + between(rng(), -1, 2)));
    const minute = between(rng(), 0, 59); const sec = between(rng(), 0, 59);
    const startAt = iso(mo.y, mo.m, day, hour, minute, sec);

    const base: Partial<SupportInteraction> = {
      id: `SI${100000 + i}`, channel, direction, segment, reason, city, queue: 'Müşteri Destek',
      customerRef: isVoice ? `+9053${between(rng(), 1000000, 9999999)}` : `crisp_${between(rng(), 100000, 999999)}`,
      customerName: `${segment === 'Kurumsal' ? 'Kurumsal' : 'Bireysel'} Müşteri ${String(between(rng(), 1, 999)).padStart(3, '0')}`,
      reopened: false, recovered: false, abandoned: false,
      linkedOrderId: (reason === 'WISMO' || reason === 'Teslimat') && rng() < 0.6 ? `ORD-${between(rng(), 10000, 99999)}` : undefined,
    };

    if (isVoice) {
      const ag = VOICE_AGENTS[Math.floor(rng() * VOICE_AGENTS.length)];
      const r = rng();
      let result: Result, waitSec: number, talkSec: number, abandoned = false, recovered = false, agentId: string | null = ag.id, agentName: string | undefined = ag.name;
      if (r < 0.64) { result = 'agent_answered'; waitSec = between(rng(), 1, 29); talkSec = between(rng(), 45, 260); } // SL (≤30sn) içinde
      else if (r < 0.66) { result = 'ivr_answered'; waitSec = between(rng(), 0, 20); talkSec = between(rng(), 5, 25); agentId = null; agentName = undefined; }
      else { result = 'abandoned'; waitSec = between(rng(), 31, 180); talkSec = 0; abandoned = true; recovered = rng() < 0.55; agentId = null; agentName = undefined; }
      const handleSec = waitSec + talkSec;
      const csat = !abandoned && result === 'agent_answered' && rng() < 0.20 ? pick(rng(), [[5, 0.48], [4, 0.28], [3, 0.10], [2, 0.09], [1, 0.05]] as [number, number][]) : undefined;
      out.push({
        ...(base as SupportInteraction), agentId, agentName, startAt, endAt: addSec(startAt, handleSec),
        waitSec, talkSec, handleSec, result, abandoned, recovered, hasRecording: !abandoned,
        reopened: !abandoned && result === 'agent_answered' && rng() < 0.06, csat,
      });
    } else {
      const ag = DIGITAL_AGENTS[Math.floor(rng() * DIGITAL_AGENTS.length)];
      const fast = FAST_DIGITAL.includes(channel);
      const slow = fast && rng() < 0.20; // hızlı kanalların ~%20'si 15dk hedefini aşar → SLA sarı bandı
      const frtSec = fast ? (slow ? between(rng(), 901, 2400) : between(rng(), 20, 780)) : between(rng(), 3600, 72000); // email: 1-20h (24h hedef)
      const talkSec = between(rng(), 120, 1400);
      const resolutionSec = fast ? between(rng(), 900, 14400) : between(rng(), 10800, 129600); // hızlı ~2h ort. / email uzun
      const handleSec = talkSec;
      const botContained = fast && rng() < 0.12;
      const result: Result = botContained ? 'bot_contained' : 'resolved';
      const resolvedAt = addSec(startAt, resolutionSec);
      const csat = !botContained && rng() < 0.42 ? pick(rng(), [[5, 0.50], [4, 0.28], [3, 0.10], [2, 0.07], [1, 0.05]] as [number, number][]) : undefined;
      out.push({
        ...(base as SupportInteraction), agentId: botContained ? null : ag.id, agentName: botContained ? undefined : ag.name,
        startAt, firstResponseAt: addSec(startAt, frtSec), resolvedAt, endAt: resolvedAt,
        waitSec: 0, talkSec, frtSec, resolutionSec, handleSec, result, abandoned: false, recovered: false,
        reopened: !botContained && rng() < 0.08, botContained, csat,
      });
    }
  }
  return out.sort((a, b) => a.startAt.localeCompare(b.startAt));
};

export const supportInteractions: SupportInteraction[] = generate();

// ── türev helper'ları ──
export const isDigital = (i: SupportInteraction) => i.channel !== 'phone';
export const isResolved = (i: SupportInteraction) => i.result === 'resolved' || i.result === 'bot_contained' || i.result === 'agent_answered';
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const monthKey = (isoStr: string) => isoStr.slice(0, 7);
const mondayOf = (isoStr: string) => { const d = new Date(isoStr); const day = d.getUTCDay(); const delta = day === 0 ? -6 : 1 - day; const m = new Date(d.getTime() + delta * 86400000); return m.toISOString().slice(0, 10); };

export interface KpiVal { value: number; mom: number; }
export interface SupportKpis {
  total: KpiVal; csat: KpiVal; frtSec: KpiVal; resolutionSec: KpiVal; slaCompliance: KpiVal; voiceSL: KpiVal;
  abandonedPct: number; recoveredPct: number; spark: number[];
}

const kpisForSet = (rows: SupportInteraction[]) => {
  const csats = rows.filter((r) => r.csat != null).map((r) => r.csat!);
  // Hız metrikleri (FRT/çözüm): canlı kanallar + cevaplanan ses. Email async (24h) → SLA uyumunda ölçülür, hız KPI'ına girmez.
  const fastLive = (r: SupportInteraction) => (isDigital(r) && FAST_DIGITAL.includes(r.channel)) || (r.channel === 'phone' && !r.abandoned);
  const frts = rows.filter(fastLive).map((r) => (r.frtSec != null ? r.frtSec : r.waitSec));
  const resns = rows.filter((r) => fastLive(r) && (r.resolutionSec != null || r.channel === 'phone')).map((r) => (r.resolutionSec != null ? r.resolutionSec : r.handleSec));
  const digital = rows.filter(isDigital);
  const slaMet = digital.filter((r) => (r.frtSec ?? Infinity) <= SLA_TARGET_SEC[r.channel]);
  const voice = rows.filter((r) => r.channel === 'phone' && r.direction === 'inbound');
  const slHit = voice.filter((r) => r.result === 'agent_answered' && r.waitSec <= VOICE_SL_SEC);
  const abandonedV = voice.filter((r) => r.abandoned);
  return {
    total: rows.length,
    csat: mean(csats),
    frtSec: mean(frts),
    resolutionSec: mean(resns),
    slaCompliance: digital.length ? (slaMet.length / digital.length) * 100 : 0,
    voiceSL: voice.length ? (slHit.length / voice.length) * 100 : 0,
    abandonedPct: voice.length ? (abandonedV.length / voice.length) * 100 : 0,
    recoveredPct: abandonedV.length ? (abandonedV.filter((r) => r.recovered).length / abandonedV.length) * 100 : 0,
  };
};

export const getKpis = (): SupportKpis => {
  const months = [...new Set(supportInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const all = kpisForSet(supportInteractions);
  const kLast = kpisForSet(supportInteractions.filter((r) => monthKey(r.startAt) === last));
  const kPrev = kpisForSet(supportInteractions.filter((r) => monthKey(r.startAt) === prev));
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  const spark = months.map((m) => supportInteractions.filter((r) => monthKey(r.startAt) === m).length);
  return {
    total: { value: all.total, mom: mom(kLast.total, kPrev.total) },
    csat: { value: all.csat, mom: mom(kLast.csat, kPrev.csat) },
    frtSec: { value: all.frtSec, mom: mom(kLast.frtSec, kPrev.frtSec) },
    resolutionSec: { value: all.resolutionSec, mom: mom(kLast.resolutionSec, kPrev.resolutionSec) },
    slaCompliance: { value: all.slaCompliance, mom: mom(kLast.slaCompliance, kPrev.slaCompliance) },
    voiceSL: { value: all.voiceSL, mom: mom(kLast.voiceSL, kPrev.voiceSL) },
    abandonedPct: all.abandonedPct, recoveredPct: all.recoveredPct, spark,
  };
};

export interface ChannelStat { channel: Channel; count: number; csat: number; }
export const getChannelBreakdown = (): ChannelStat[] =>
  (['whatsapp', 'phone', 'chat', 'email', 'messenger', 'instagram'] as Channel[]).map((ch) => {
    const rows = supportInteractions.filter((r) => r.channel === ch);
    const cs = rows.filter((r) => r.csat != null).map((r) => r.csat!);
    return { channel: ch, count: rows.length, csat: mean(cs) };
  }).sort((a, b) => b.count - a.count);

export interface TrendPoint { week: string; whatsapp: number; phone: number; chat: number; email: number; messenger: number; instagram: number; toplam: number; cozulen: number; }
export const getInteractionTrend = (): TrendPoint[] => {
  const map = new Map<string, TrendPoint>();
  for (const r of supportInteractions) {
    const wk = mondayOf(r.startAt);
    if (!map.has(wk)) map.set(wk, { week: wk, whatsapp: 0, phone: 0, chat: 0, email: 0, messenger: 0, instagram: 0, toplam: 0, cozulen: 0 });
    const p = map.get(wk)!; p[r.channel]++; p.toplam++; if (isResolved(r)) p.cozulen++;
  }
  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week));
};

export const getReasonBreakdown = (): { reason: Reason; count: number }[] =>
  REASONS.map(([reason]) => ({ reason, count: supportInteractions.filter((r) => r.reason === reason).length })).sort((a, b) => b.count - a.count);

export interface HeatCell { day: number; bucket: number; count: number } // day 0=Pzt..6=Paz, bucket 0..7 (3'er saat)
export const getHourDayHeatmap = (): HeatCell[] => {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(8).fill(0));
  for (const r of supportInteractions) {
    const d = new Date(r.startAt); const dow = (d.getUTCDay() + 6) % 7; const bucket = Math.floor(d.getUTCHours() / 3);
    grid[dow][bucket]++;
  }
  const cells: HeatCell[] = [];
  grid.forEach((row, day) => row.forEach((count, bucket) => cells.push({ day, bucket, count })));
  return cells;
};

export interface VoiceSLData { sl: number; abandonedPct: number; recoveredPct: number; funnel: { label: string; value: number }[]; }
export const getVoiceSL = (): VoiceSLData => {
  const voice = supportInteractions.filter((r) => r.channel === 'phone' && r.direction === 'inbound');
  const answered = voice.filter((r) => r.result === 'agent_answered' || r.result === 'ivr_answered');
  const abandoned = voice.filter((r) => r.abandoned);
  const recovered = abandoned.filter((r) => r.recovered);
  const slHit = voice.filter((r) => r.result === 'agent_answered' && r.waitSec <= VOICE_SL_SEC);
  return {
    sl: voice.length ? (slHit.length / voice.length) * 100 : 0,
    abandonedPct: voice.length ? (abandoned.length / voice.length) * 100 : 0,
    recoveredPct: abandoned.length ? (recovered.length / abandoned.length) * 100 : 0,
    funnel: [
      { label: 'Gelen', value: voice.length },
      { label: 'Cevaplanan', value: answered.length },
      { label: 'Kaçan', value: abandoned.length },
      { label: 'Dönülen', value: recovered.length },
      { label: 'Kayıp', value: abandoned.length - recovered.length },
    ],
  };
};

export interface AgentStat { id: string; name: string; count: number; csat: number; kind: 'voice' | 'digital'; }
export const getAgentSnapshot = (): { top: AgentStat[]; attention: AgentStat[] } => {
  const map = new Map<string, { name: string; count: number; csats: number[]; kind: 'voice' | 'digital' }>();
  for (const r of supportInteractions) {
    if (!r.agentId) continue;
    if (!map.has(r.agentId)) map.set(r.agentId, { name: r.agentName ?? r.agentId, count: 0, csats: [], kind: r.channel === 'phone' ? 'voice' : 'digital' });
    const a = map.get(r.agentId)!; a.count++; if (r.csat != null) a.csats.push(r.csat);
  }
  const stats: AgentStat[] = [...map.entries()].map(([id, a]) => ({ id, name: a.name, count: a.count, csat: mean(a.csats), kind: a.kind }))
    .filter((a) => a.count >= 20);
  const byCsat = [...stats].sort((x, y) => y.csat - x.csat);
  return { top: byCsat.slice(0, 2), attention: byCsat.slice(-2).reverse() };
};
