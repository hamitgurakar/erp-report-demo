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

// ══════════ L2.5 Çağrı Merkezi (Verimor, %100 ses) helper'ları ══════════
export const voiceInteractions = supportInteractions.filter((r) => r.channel === 'phone');
const isAnswered = (r: SupportInteraction) => r.result === 'agent_answered' || r.result === 'ivr_answered';

// Ses metrikleri (bir satır kümesi için) — ses tuzaklarına sadık (B1)
const voiceMetrics = (rows: SupportInteraction[]) => {
  const inbound = rows.filter((r) => r.direction === 'inbound');
  const outbound = rows.filter((r) => r.direction === 'outbound');
  const answered = inbound.filter(isAnswered);
  const abandoned = inbound.filter((r) => r.abandoned);
  const recovered = abandoned.filter((r) => r.recovered);
  const slHit = inbound.filter((r) => r.result === 'agent_answered' && r.waitSec <= VOICE_SL_SEC);
  const waitAns = answered.map((r) => r.waitSec);
  const ahtRows = answered.map((r) => r.handleSec);
  return {
    total: rows.length, gelen: inbound.length, giden: outbound.length,
    cevaplamaPct: inbound.length ? (answered.length / inbound.length) * 100 : 0,
    kacanPct: inbound.length ? (abandoned.length / inbound.length) * 100 : 0,
    donulenPct: abandoned.length ? (recovered.length / abandoned.length) * 100 : 0,
    sl: inbound.length ? (slHit.length / inbound.length) * 100 : 0,
    avgWait: mean(waitAns), aht: mean(ahtRows),
  };
};

export interface VoiceKpis {
  total: KpiVal; gelen: number; giden: number; cevaplamaPct: KpiVal; kacanPct: KpiVal; donulenPct: number;
  sl: KpiVal; avgWait: KpiVal; aht: KpiVal;
}
export const getVoiceKpis = (): VoiceKpis => {
  const months = [...new Set(voiceInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const all = voiceMetrics(voiceInteractions);
  const mL = voiceMetrics(voiceInteractions.filter((r) => monthKey(r.startAt) === last));
  const mP = voiceMetrics(voiceInteractions.filter((r) => monthKey(r.startAt) === prev));
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  return {
    total: { value: all.total, mom: mom(mL.total, mP.total) }, gelen: all.gelen, giden: all.giden,
    cevaplamaPct: { value: all.cevaplamaPct, mom: mom(mL.cevaplamaPct, mP.cevaplamaPct) },
    kacanPct: { value: all.kacanPct, mom: mom(mL.kacanPct, mP.kacanPct) }, donulenPct: all.donulenPct,
    sl: { value: all.sl, mom: mom(mL.sl, mP.sl) },
    avgWait: { value: all.avgWait, mom: mom(mL.avgWait, mP.avgWait) },
    aht: { value: all.aht, mom: mom(mL.aht, mP.aht) },
  };
};

export interface VoiceHourly { hour: number; cevaplanan: number; kacan: number; }
export const getVoiceHourly = (): VoiceHourly[] => {
  const inbound = voiceInteractions.filter((r) => r.direction === 'inbound');
  return Array.from({ length: 24 }, (_, h) => {
    const hr = inbound.filter((r) => new Date(r.startAt).getUTCHours() === h);
    return { hour: h, cevaplanan: hr.filter(isAnswered).length, kacan: hr.filter((r) => r.abandoned).length };
  });
};

export interface VoiceDaily { date: string; gelen: number; giden: number; gelenDk: number; gidenDk: number; }
export const getVoiceDaily = (days = 30): VoiceDaily[] => {
  const maxD = voiceInteractions.reduce((m, r) => (r.startAt > m ? r.startAt : m), '').slice(0, 10);
  const maxT = Date.parse(`${maxD}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(maxT - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    const rows = voiceInteractions.filter((r) => r.startAt.slice(0, 10) === d);
    const gelen = rows.filter((r) => r.direction === 'inbound'), giden = rows.filter((r) => r.direction === 'outbound');
    return { date: d, gelen: gelen.length, giden: giden.length, gelenDk: Math.round(gelen.reduce((s, r) => s + r.talkSec, 0) / 60), gidenDk: Math.round(giden.reduce((s, r) => s + r.talkSec, 0) / 60) };
  });
};

export interface WaitBucket { bucket: string; count: number; }
export const getWaitBuckets = (): WaitBucket[] => {
  // Bekleme YALNIZCA cevaplanan çağrılar üzerinden (B1 tuzağı #4)
  const answered = voiceInteractions.filter((r) => r.direction === 'inbound' && isAnswered(r));
  const defs: [string, (w: number) => boolean][] = [
    ['0-10', (w) => w <= 10], ['11-20', (w) => w > 10 && w <= 20], ['21-30', (w) => w > 20 && w <= 30],
    ['31-40', (w) => w > 30 && w <= 40], ['41-60', (w) => w > 40 && w <= 60], ['61+', (w) => w > 60],
  ];
  return defs.map(([bucket, f]) => ({ bucket, count: answered.filter((r) => f(r.waitSec)).length }));
};

export const getVoiceFunnel = (): { label: string; value: number }[] => {
  const inbound = voiceInteractions.filter((r) => r.direction === 'inbound');
  const answered = inbound.filter(isAnswered);
  const abandoned = inbound.filter((r) => r.abandoned);
  const recovered = abandoned.filter((r) => r.recovered);
  return [
    { label: 'Gelen', value: inbound.length },
    { label: 'Cevaplanan', value: answered.length },
    { label: 'Kaçan', value: abandoned.length },
    { label: 'Dönülen', value: recovered.length },
    { label: 'Hâlâ kayıp', value: abandoned.length - recovered.length },
  ];
};

export interface VoiceAgentStat {
  id: string; name: string; cevaplanan: number; kacan: number; basariPct: number;
  toplamKonusmaSec: number; ortKonusmaSec: number; enUzunSec: number; giden: number; gidenBasariPct: number;
}
export const getVoiceAgentStats = (): VoiceAgentStat[] => {
  const inbound = voiceInteractions.filter((r) => r.direction === 'inbound');
  const totalAbandoned = inbound.filter((r) => r.abandoned).length;
  const totalAnswered = inbound.filter(isAnswered).length || 1;
  const outbound = voiceInteractions.filter((r) => r.direction === 'outbound');
  const totalOutAbandoned = outbound.filter((r) => r.abandoned).length;
  const totalOutAnswered = outbound.filter(isAnswered).length || 1;
  return VOICE_AGENTS.map((ag) => {
    const ans = inbound.filter((r) => r.agentId === ag.id && r.result === 'agent_answered');
    const talks = ans.map((r) => r.talkSec);
    // kaçanlar dahili-atanmamış (Verimor kuyruk) → cevaplanan payına göre orantısal dağıt (deterministik mock)
    const kacan = Math.round(totalAbandoned * (ans.length / totalAnswered));
    const gidenAns = outbound.filter((r) => r.agentId === ag.id && r.result === 'agent_answered');
    const gidenKacan = Math.round(totalOutAbandoned * (gidenAns.length / totalOutAnswered));
    return {
      id: ag.id, name: ag.name, cevaplanan: ans.length, kacan, basariPct: (ans.length / (ans.length + kacan || 1)) * 100,
      toplamKonusmaSec: talks.reduce((a, b) => a + b, 0), ortKonusmaSec: mean(talks), enUzunSec: talks.length ? Math.max(...talks) : 0,
      giden: gidenAns.length, gidenBasariPct: (gidenAns.length / (gidenAns.length + gidenKacan || 1)) * 100,
    };
  });
};

export interface CdrRow {
  id: string; startAt: string; endAt: string; direction: Direction; customerRef: string;
  agentId: string | null; agentName?: string; durationSec: number; talkSec: number;
  result: Result; abandoned: boolean; recovered: boolean; hasRecording: boolean; linkedOrderId?: string;
}
export const getCdrRows = (): CdrRow[] => voiceInteractions
  .map((r) => ({
    id: r.id, startAt: r.startAt, endAt: r.endAt, direction: r.direction, customerRef: r.customerRef,
    agentId: r.agentId, agentName: r.agentName, durationSec: Math.round((Date.parse(r.endAt) - Date.parse(r.startAt)) / 1000),
    talkSec: r.talkSec, result: r.result, abandoned: r.abandoned, recovered: r.recovered, hasRecording: !!r.hasRecording, linkedOrderId: r.linkedOrderId,
  }))
  .sort((a, b) => b.startAt.localeCompare(a.startAt));

// ══════════ L2.1 Ticket & Konuşma Analizi helper'ları ══════════
const isTicketResolved = (r: SupportInteraction) => isResolved(r) && !r.reopened;

export interface TicketTrendPoint { week: string; yeni: number; cozulen: number; backlog: number; hacim: number; }
export const getTicketTrend = (): TicketTrendPoint[] => {
  const weeks = [...new Set(supportInteractions.map((r) => mondayOf(r.startAt)))].sort();
  let backlog = 0;
  return weeks.map((wk) => {
    const started = supportInteractions.filter((r) => mondayOf(r.startAt) === wk);
    const yeni = started.length;
    const cozulen = started.filter(isTicketResolved).length;
    backlog = Math.max(0, backlog + yeni - cozulen);
    return { week: wk, yeni, cozulen, backlog, hacim: yeni };
  });
};

export const getBacklog = (): number => { const tr = getTicketTrend(); return tr.length ? tr[tr.length - 1].backlog : 0; };
export const getReopenRate = (): number => (supportInteractions.length ? (supportInteractions.filter((r) => r.reopened).length / supportInteractions.length) * 100 : 0);

export interface SegmentStat { segment: 'Kurumsal' | 'Bireysel'; count: number; csat: number; }
export const getSegmentBreakdown = (): SegmentStat[] => (['Kurumsal', 'Bireysel'] as const).map((seg) => {
  const rows = supportInteractions.filter((r) => r.segment === seg);
  const cs = rows.filter((r) => r.csat != null).map((r) => r.csat!);
  return { segment: seg, count: rows.length, csat: mean(cs) };
});

export interface GeoStat { province: string; count: number; }
export const getGeoByProvince = (): GeoStat[] => {
  const map = new Map<string, number>();
  for (const r of supportInteractions) { if (!r.city) continue; map.set(r.city, (map.get(r.city) ?? 0) + 1); }
  return [...map.entries()].map(([province, count]) => ({ province, count })).sort((a, b) => b.count - a.count);
};

export interface TicketKpis { backlog: KpiVal; yeni: KpiVal; reopenPct: KpiVal; avgKonusma: KpiVal; }
export const getTicketKpis = (): TicketKpis => {
  const months = [...new Set(supportInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const inMonth = (m: string) => supportInteractions.filter((r) => monthKey(r.startAt) === m);
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  const tr = getTicketTrend();
  const backlogNow = tr.length ? tr[tr.length - 1].backlog : 0;
  const backlog4 = tr.length >= 5 ? tr[tr.length - 5].backlog : (tr[0]?.backlog ?? 0);
  const yeniL = inMonth(last).length, yeniP = inMonth(prev).length;
  const reopen = (rows: SupportInteraction[]) => (rows.length ? (rows.filter((r) => r.reopened).length / rows.length) * 100 : 0);
  const konusma = (rows: SupportInteraction[]) => mean(rows.filter((r) => !r.abandoned).map((r) => r.talkSec));
  return {
    backlog: { value: backlogNow, mom: mom(backlogNow, backlog4) },
    yeni: { value: yeniL, mom: mom(yeniL, yeniP) },
    reopenPct: { value: getReopenRate(), mom: mom(reopen(inMonth(last)), reopen(inMonth(prev))) },
    avgKonusma: { value: konusma(supportInteractions), mom: mom(konusma(inMonth(last)), konusma(inMonth(prev))) },
  };
};

// ══════════ L2.2 SLA & Yanıt Performansı helper'ları ══════════
export type OfficeFilter = 'all' | 'in' | 'out';
export type ChannelFilter = 'all' | 'chat';
const isOfficeHours = (r: SupportInteraction) => { const d = new Date(r.startAt); const dow = (d.getUTCDay() + 6) % 7; const h = d.getUTCHours(); return dow < 5 && h >= 9 && h < 18; };
const applyOffice = (rows: SupportInteraction[], office: OfficeFilter) => (office === 'all' ? rows : office === 'in' ? rows.filter(isOfficeHours) : rows.filter((r) => !isOfficeHours(r)));
const fastLiveRow = (r: SupportInteraction) => (isDigital(r) && FAST_DIGITAL.includes(r.channel)) || (r.channel === 'phone' && !r.abandoned);
export const FRT_IDEAL_SEC = 90; // B3 ideal ilk-yanıt benchmark (chat); SLA uyumu yanıt-SLA'sıyla (15dk/24h) ölçülür

const slaMetrics = (rows: SupportInteraction[]) => {
  const digital = rows.filter(isDigital);
  const met = digital.filter((r) => (r.frtSec ?? Infinity) <= SLA_TARGET_SEC[r.channel]);
  const frts = rows.filter(fastLiveRow).map((r) => (r.frtSec != null ? r.frtSec : r.waitSec));
  const resns = rows.filter((r) => fastLiveRow(r) && (r.resolutionSec != null || r.channel === 'phone')).map((r) => (r.resolutionSec != null ? r.resolutionSec : r.handleSec));
  return { sla: digital.length ? (met.length / digital.length) * 100 : 0, breaches: digital.length - met.length, frt: mean(frts), resn: mean(resns) };
};

export interface SlaKpis { sla: KpiVal; frt: KpiVal; resn: KpiVal; breaches: KpiVal; }
export const getSlaKpis = (office: OfficeFilter = 'all'): SlaKpis => {
  const rows = applyOffice(supportInteractions, office);
  const months = [...new Set(rows.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const all = slaMetrics(rows);
  const mL = slaMetrics(rows.filter((r) => monthKey(r.startAt) === last));
  const mP = slaMetrics(rows.filter((r) => monthKey(r.startAt) === prev));
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  return {
    sla: { value: all.sla, mom: mom(mL.sla, mP.sla) }, frt: { value: all.frt, mom: mom(mL.frt, mP.frt) },
    resn: { value: all.resn, mom: mom(mL.resn, mP.resn) }, breaches: { value: all.breaches, mom: mom(mL.breaches, mP.breaches) },
  };
};

export interface DistBucket { bucket: string; count: number; }
export const getFrtDistribution = (office: OfficeFilter = 'all'): { buckets: DistBucket[]; channelAvg: { channel: Channel; avgSec: number }[] } => {
  const rows = applyOffice(supportInteractions, office).filter(fastLiveRow);
  const val = (r: SupportInteraction) => (r.frtSec != null ? r.frtSec : r.waitSec);
  const defs: [string, (s: number) => boolean][] = [['0-30sn', (s) => s <= 30], ['31-90sn', (s) => s > 30 && s <= 90], ['91-300sn', (s) => s > 90 && s <= 300], ['5-10dk', (s) => s > 300 && s <= 600], ['10-15dk', (s) => s > 600 && s <= 900], ['15dk+', (s) => s > 900]];
  const buckets = defs.map(([bucket, f]) => ({ bucket, count: rows.filter((r) => f(val(r))).length }));
  const chans: Channel[] = ['chat', 'whatsapp', 'messenger', 'instagram', 'phone'];
  const channelAvg = chans.map((ch) => ({ channel: ch, avgSec: mean(rows.filter((r) => r.channel === ch).map(val)) })).filter((x) => x.avgSec > 0);
  return { buckets, channelAvg };
};

export const getResolutionDistribution = (office: OfficeFilter = 'all'): DistBucket[] => {
  const rows = applyOffice(supportInteractions, office).filter((r) => fastLiveRow(r) && (r.resolutionSec != null || r.channel === 'phone'));
  const val = (r: SupportInteraction) => (r.resolutionSec != null ? r.resolutionSec : r.handleSec);
  const defs: [string, (s: number) => boolean][] = [['≤1sa', (s) => s <= 3600], ['1-2sa', (s) => s > 3600 && s <= 7200], ['2-4sa', (s) => s > 7200 && s <= 14400], ['4-8sa', (s) => s > 14400 && s <= 28800], ['8sa+', (s) => s > 28800]];
  return defs.map(([bucket, f]) => ({ bucket, count: rows.filter((r) => f(val(r))).length }));
};

export interface CsatSlaPoint { week: string; csatPct: number; slaPct: number; }
export const getCsatSlaSeries = (office: OfficeFilter = 'all', channel: ChannelFilter = 'all'): CsatSlaPoint[] => {
  let rows = applyOffice(supportInteractions, office);
  if (channel === 'chat') rows = rows.filter((r) => r.channel === 'chat');
  const weeks = [...new Set(rows.map((r) => mondayOf(r.startAt)))].sort();
  return weeks.map((wk) => {
    const w = rows.filter((r) => mondayOf(r.startAt) === wk);
    const cs = w.filter((r) => r.csat != null).map((r) => r.csat!);
    const digital = w.filter(isDigital);
    const met = digital.filter((r) => (r.frtSec ?? Infinity) <= SLA_TARGET_SEC[r.channel]);
    return { week: wk, csatPct: cs.length ? (mean(cs) / 5) * 100 : 0, slaPct: digital.length ? (met.length / digital.length) * 100 : 0 };
  });
};

export interface SlaBreach { id: string; channel: Channel; agentName: string; targetSec: number; actualSec: number; delaySec: number; startAt: string; }
export const getSlaBreaches = (office: OfficeFilter = 'all'): SlaBreach[] => applyOffice(supportInteractions, office)
  .filter((r) => isDigital(r) && r.frtSec != null && r.frtSec > SLA_TARGET_SEC[r.channel])
  .map((r) => ({ id: r.id, channel: r.channel, agentName: r.agentName ?? '—', targetSec: SLA_TARGET_SEC[r.channel], actualSec: r.frtSec!, delaySec: r.frtSec! - SLA_TARGET_SEC[r.channel], startAt: r.startAt }))
  .sort((a, b) => b.delaySec - a.delaySec);

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

// ══════════ L2.3 Ekip & Temsilci helper'ları ══════════
const respTimeOf = (r: SupportInteraction): number | null => {
  if (isDigital(r)) return FAST_DIGITAL.includes(r.channel) ? (r.frtSec ?? null) : null; // email async (24h) → yanıt hızına girmez
  return r.result === 'agent_answered' ? r.waitSec : null; // ses ASA (cevaplanan)
};

export interface Operator { id: string; name: string; kind: 'voice' | 'digital'; count: number; avgRespSec: number; csat: number; badge: 'top' | 'attention' | 'normal'; }
export const getOperatorLeaderboard = (): Operator[] => {
  const map = new Map<string, { name: string; kind: 'voice' | 'digital'; count: number; csats: number[]; resp: number[] }>();
  for (const r of supportInteractions) {
    if (!r.agentId) continue;
    if (!map.has(r.agentId)) map.set(r.agentId, { name: r.agentName ?? r.agentId, kind: r.channel === 'phone' ? 'voice' : 'digital', count: 0, csats: [], resp: [] });
    const a = map.get(r.agentId)!; a.count++;
    if (r.csat != null) a.csats.push(r.csat);
    const rt = respTimeOf(r); if (rt != null) a.resp.push(rt);
  }
  const ops: Operator[] = [...map.entries()].map(([id, a]) => ({ id, name: a.name, kind: a.kind, count: a.count, avgRespSec: mean(a.resp), csat: mean(a.csats), badge: 'normal' as const }));
  const rated = ops.filter((o) => o.count >= 20).sort((x, y) => y.csat - x.csat);
  const topIds = new Set(rated.slice(0, 2).map((o) => o.id));
  const attIds = new Set(rated.slice(-2).map((o) => o.id));
  return ops.map((o) => ({ ...o, badge: topIds.has(o.id) ? 'top' : attIds.has(o.id) ? 'attention' : 'normal' })).sort((x, y) => y.count - x.count);
};

export interface WorkloadRow { id: string; name: string; kind: 'voice' | 'digital'; count: number; }
export const getWorkload = (): WorkloadRow[] => getOperatorLeaderboard().map((o) => ({ id: o.id, name: o.name, kind: o.kind, count: o.count })).sort((a, b) => b.count - a.count);

export interface PresenceRow { id: string; name: string; kind: 'voice' | 'digital'; durum: 'Müsait' | 'Çağrıda' | 'Çevrimdışı'; }
// Canlı meşguliyet — statik mock (Verimor Meşguliyet Panosu deseni), deterministik
export const getPresence = (): PresenceRow[] => [
  { id: '1000', name: 'Batuhan', kind: 'voice', durum: 'Çağrıda' },
  { id: '1001', name: 'Ahmet', kind: 'voice', durum: 'Müsait' },
  { id: '1004', name: 'Benan', kind: 'voice', durum: 'Çağrıda' },
  { id: '1005', name: 'Çisem', kind: 'voice', durum: 'Çevrimdışı' },
  { id: 'D01', name: 'Dijital Operatör 1', kind: 'digital', durum: 'Müsait' },
  { id: 'D02', name: 'Dijital Operatör 2', kind: 'digital', durum: 'Çağrıda' },
  { id: 'D03', name: 'Dijital Operatör 3', kind: 'digital', durum: 'Müsait' },
  { id: 'D04', name: 'Dijital Operatör 4', kind: 'digital', durum: 'Çevrimdışı' },
  { id: 'D05', name: 'Dijital Operatör 5', kind: 'digital', durum: 'Müsait' },
];

export interface EkipKpis { aktif: KpiVal; csat: KpiVal; ortYanit: KpiVal; etkPerTemsilci: KpiVal; }
export const getEkipKpis = (): EkipKpis => {
  const months = [...new Set(supportInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const m = (rows: SupportInteraction[]) => {
    const handled = rows.filter((r) => r.agentId);
    const agentIds = new Set(handled.filter((r) => { const c = handled.filter((x) => x.agentId === r.agentId).length; return c >= 5; }).map((r) => r.agentId));
    const csats = rows.filter((r) => r.csat != null).map((r) => r.csat!);
    const resp = rows.map(respTimeOf).filter((x): x is number => x != null);
    const aktif = agentIds.size || new Set(handled.map((r) => r.agentId)).size;
    return { aktif, csat: mean(csats), ortYanit: mean(resp), etkPer: aktif ? handled.length / aktif : 0 };
  };
  const all = m(supportInteractions), mL = m(supportInteractions.filter((r) => monthKey(r.startAt) === last)), mP = m(supportInteractions.filter((r) => monthKey(r.startAt) === prev));
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  return {
    aktif: { value: all.aktif, mom: mom(mL.aktif, mP.aktif) }, csat: { value: all.csat, mom: mom(mL.csat, mP.csat) },
    ortYanit: { value: all.ortYanit, mom: mom(mL.ortYanit, mP.ortYanit) }, etkPerTemsilci: { value: all.etkPer, mom: mom(mL.etkPer, mP.etkPer) },
  };
};

// ══════════ L2.4 Kanal & Memnuniyet helper'ları ══════════
export interface ChannelVolTrend { channel: Channel; count: number; trendPct: number; }
export const getChannelVolumeTrend = (): ChannelVolTrend[] => {
  const months = [...new Set(supportInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const cnt = (ch: Channel, m?: string) => supportInteractions.filter((r) => r.channel === ch && (!m || monthKey(r.startAt) === m)).length;
  return (['whatsapp', 'phone', 'chat', 'email', 'messenger', 'instagram'] as Channel[]).map((ch) => {
    const l = cnt(ch, last), p = cnt(ch, prev);
    return { channel: ch, count: cnt(ch), trendPct: p ? ((l - p) / p) * 100 : 0 };
  }).sort((a, b) => b.count - a.count);
};

export const getCsatByChannel = (): { channel: Channel; csat: number; rated: number }[] =>
  (['whatsapp', 'phone', 'chat', 'email', 'messenger', 'instagram'] as Channel[]).map((ch) => {
    const cs = supportInteractions.filter((r) => r.channel === ch && r.csat != null).map((r) => r.csat!);
    return { channel: ch, csat: mean(cs), rated: cs.length };
  }).sort((a, b) => b.csat - a.csat);

export interface RatingDist { dist: { star: number; count: number; pct: number }[]; mean: number; total: number; }
export const getRatingDistribution = (): RatingDist => {
  const rated = supportInteractions.filter((r) => r.csat != null).map((r) => r.csat!);
  const dist = [5, 4, 3, 2, 1].map((star) => { const count = rated.filter((c) => c === star).length; return { star, count, pct: rated.length ? (count / rated.length) * 100 : 0 }; });
  return { dist, mean: mean(rated), total: rated.length };
};

export interface RatingComment { id: string; text: string; rating: number; channel: Channel; date: string; tone: 'positive' | 'neutral' | 'negative'; }
const COMMENTS_POS = ['Hızlı ve çözüm odaklı destek, teşekkürler.', 'Temsilci çok ilgiliydi, sorun anında çözüldü.', 'Kurumsal siparişimizde harika yardım aldık.', 'Yanıt süresi beklentimin üzerinde iyiydi.', 'Kişiselleştirme talebimiz eksiksiz karşılandı.', 'İade sürecim sorunsuz ilerledi.'];
const COMMENTS_NEU = ['Sorun çözüldü ama biraz beklemek gerekti.', 'Yardımcı oldular, süreç ortalamaydı.', 'Fatura konusu netleşti, teşekkürler.', 'İkinci temasta hallolabildi.'];
const COMMENTS_NEG = ['Kargo gecikmesi hakkında net bilgi alamadım.', 'Uzun süre beklettiler, tekrar iletişime geçmek zorunda kaldım.', 'Ürün hasarlıydı, çözüm yavaş ilerledi.', 'Teslimat sorunu hâlâ tam çözülmedi.', 'Yanıt için çok bekledim.'];
export const getRatingComments = (limit = 16): RatingComment[] => {
  const rated = supportInteractions.filter((r) => r.csat != null).sort((a, b) => b.startAt.localeCompare(a.startAt));
  const step = Math.max(1, Math.floor(rated.length / limit));
  const out: RatingComment[] = [];
  for (let i = 0; i < rated.length && out.length < limit; i += step) {
    const r = rated[i]; const rt = r.csat!;
    const tone: RatingComment['tone'] = rt >= 4 ? 'positive' : rt === 3 ? 'neutral' : 'negative';
    const pool = tone === 'positive' ? COMMENTS_POS : tone === 'neutral' ? COMMENTS_NEU : COMMENTS_NEG;
    out.push({ id: r.id, text: pool[i % pool.length], rating: rt, channel: r.channel, date: r.startAt.slice(0, 10), tone });
  }
  return out;
};

export interface KanalKpis { hacim: KpiVal; csat: KpiVal; best: { channel: Channel; csat: number }; worst: { channel: Channel; csat: number }; yanitOrani: KpiVal; }
export const getKanalKpis = (): KanalKpis => {
  const months = [...new Set(supportInteractions.map((r) => monthKey(r.startAt)))].sort();
  const last = months[months.length - 1], prev = months[months.length - 2];
  const inM = (m: string) => supportInteractions.filter((r) => monthKey(r.startAt) === m);
  const mom = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  const csatOf = (rows: SupportInteraction[]) => mean(rows.filter((r) => r.csat != null).map((r) => r.csat!));
  const respRate = (rows: SupportInteraction[]) => { const responded = rows.filter((r) => (isDigital(r) && r.frtSec != null) || (r.channel === 'phone' && (r.result === 'agent_answered' || r.result === 'ivr_answered'))).length; return rows.length ? (responded / rows.length) * 100 : 0; };
  const byCh = getCsatByChannel().filter((c) => c.rated >= 10);
  return {
    hacim: { value: supportInteractions.length, mom: mom(inM(last).length, inM(prev).length) },
    csat: { value: csatOf(supportInteractions), mom: mom(csatOf(inM(last)), csatOf(inM(prev))) },
    best: { channel: byCh[0].channel, csat: byCh[0].csat }, worst: { channel: byCh[byCh.length - 1].channel, csat: byCh[byCh.length - 1].csat },
    yanitOrani: { value: respRate(supportInteractions), mom: mom(respRate(inM(last)), respRate(inM(prev))) },
  };
};
