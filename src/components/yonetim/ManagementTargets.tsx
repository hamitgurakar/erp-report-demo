import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Legend, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
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

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const summaryCards = [
  { title: 'Toplam Gelir (TL)', hedef: '187.827.262 ₺', gercek: '155.366.145 ₺', sapma: -17.3, badge: 'RİSK', bc: '#DC2626', bg: '#FEE2E2', pct: 82.7 },
  { title: 'B2C Gelir (TL)', hedef: '32.461.116 ₺', gercek: '28.450.000 ₺', sapma: -12.4, badge: 'DİKKAT', bc: '#D97706', bg: '#FEF3C7', pct: 87.6 },
  { title: 'B2B Gelir (TL)', hedef: '155.366.145 ₺', gercek: '126.916.145 ₺', sapma: -18.3, badge: 'RİSK', bc: '#DC2626', bg: '#FEE2E2', pct: 81.7 },
  { title: 'Toplam Gelir (USD)', hedef: '$3.976.466', gercek: '$3.280.000', sapma: -17.5, badge: 'RİSK', bc: '#DC2626', bg: '#FEE2E2', pct: 82.5 },
  { title: 'COGS', hedef: '93.913.631 ₺', gercek: '77.683.072 ₺', sapma: -17.3, badge: '—', bc: '#64748B', bg: '#F1F5F9', pct: 82.7 },
  { title: 'Net Sales Profit', hedef: '52.591.633 ₺', gercek: '43.500.000 ₺', sapma: -17.3, badge: 'RİSK', bc: '#DC2626', bg: '#FEE2E2', pct: 82.7 },
];

const b2cSummary = [
  { m: 'Sipariş Sayısı', v: '20.275' }, { m: 'Sepet Ortalaması', v: '1.601 ₺' },
  { m: 'Gelir USD', v: '$698.360' }, { m: 'Gelir TRY', v: '32.461.116 ₺' },
  { m: 'Hedef Gelir TRY', v: '37.000.000 ₺' },
];
const b2bSummary = [
  { m: 'Sipariş Sayısı', v: '91.640' }, { m: 'Sepet Ortalaması', v: '1.695 ₺' },
  { m: 'Gelir USD', v: '$3.278.106' }, { m: 'Gelir TRY', v: '155.366.145 ₺' },
  { m: 'Hedef Gelir TRY', v: '(Satış dept)' },
];
const consolidatedTotals = [
  { m: 'Toplam Gelir', v: '187.827.262 ₺' }, { m: 'Toplam Sipariş', v: '111.915' },
  { m: 'COGS', v: '93.913.631 ₺' }, { m: 'Gross Profit', v: '46.956.815 ₺' },
  { m: 'Net Profit', v: '52.591.633 ₺' },
];

// Matrix data
interface MRow { group: 'b2c'|'b2b'|'consolidated'; metric: string; values: (number|string)[]; total: number|string; fmt: 'n'|'tl'|'usd'|'p'; bold?: boolean; }

const b2cOrder = [2144,2303,1871,1263,2225,1072,890,979,1323,1069,2764,2372];
const b2cSepet = [1392,1452,1513,1530,1547,1564,1627,1645,1662,1728,1764,1800];
const b2cUSD = [68608,75987,63620,42948,75660,36442,31164,34272,46312,38476,99489,85377];
const b2cTRY = [2984448,3343447,2831125,1932696,3442539,1676373,1449126,1610784,2199820,1846886,4874990,4268880];

const b2bOrder = [5006,15133,5811,2295,5160,1940,1391,3490,3230,4566,22868,20750];
const b2bSepet = [1392,1452,1513,1530,1547,1564,1627,1645,1662,1728,1764,2000];
const b2bUSD = [160204,499374,197560,78030,175440,65960,48692,122164,113050,164383,823248,830000];
const b2bTRY = [6968908,21972462,8791437,3511350,7982520,3034160,2264178,5741708,5369875,7890393,40339152,41500000];

const kur = [36.05,37.73,39.40,41.03,42.50,43.80,44.90,45.80,46.50,47.20,48.00,48.80];
const totalUSD = b2cUSD.map((v,i) => v + b2bUSD[i]);
const totalTRY = b2cTRY.map((v,i) => v + b2bTRY[i]);
const cogs = totalTRY.map((v) => Math.round(v * 0.5));
const grossProfit = totalTRY.map((v,i) => v - cogs[i]);
const netProfit = grossProfit.map((v) => Math.round(v * 0.55));

const sum = (a: number[]) => a.reduce((s,v) => s+v, 0);

const matrixRows: MRow[] = [
  { group:'b2c', metric:'B2C Sipariş Sayısı', values:b2cOrder, total:sum(b2cOrder), fmt:'n' },
  { group:'b2c', metric:'B2C Sepet Ort. (₺)', values:b2cSepet, total:Math.round(sum(b2cSepet)/12), fmt:'tl' },
  { group:'b2c', metric:'B2C Gelir (USD)', values:b2cUSD, total:sum(b2cUSD), fmt:'usd' },
  { group:'b2c', metric:'B2C Gelir (TRY)', values:b2cTRY, total:sum(b2cTRY), fmt:'tl' },
  { group:'b2b', metric:'B2B Sipariş Sayısı', values:b2bOrder, total:sum(b2bOrder), fmt:'n' },
  { group:'b2b', metric:'B2B Sepet Ort. (₺)', values:b2bSepet, total:Math.round(sum(b2bSepet)/12), fmt:'tl' },
  { group:'b2b', metric:'B2B Gelir (USD)', values:b2bUSD, total:sum(b2bUSD), fmt:'usd' },
  { group:'b2b', metric:'B2B Gelir (TRY)', values:b2bTRY, total:sum(b2bTRY), fmt:'tl' },
  { group:'consolidated', metric:'Dolar Kur', values:kur, total:(sum(kur)/12).toFixed(2), fmt:'p' },
  { group:'consolidated', metric:'Gelir USD (Toplam)', values:totalUSD, total:sum(totalUSD), fmt:'usd' },
  { group:'consolidated', metric:'Gelir TRY (Toplam)', values:totalTRY, total:sum(totalTRY), fmt:'tl', bold:true },
  { group:'consolidated', metric:'COGS', values:cogs, total:sum(cogs), fmt:'tl' },
  { group:'consolidated', metric:'Gross Profit', values:grossProfit, total:sum(grossProfit), fmt:'tl' },
  { group:'consolidated', metric:'Net Sales Profit', values:netProfit, total:sum(netProfit), fmt:'tl', bold:true },
];

// Yearly comparison
const yearly = [
  { ay:'Oca', y23:5200, y24:6800, y25:9953 }, { ay:'Şub', y23:5800, y24:7500, y25:25315 },
  { ay:'Mar', y23:6200, y24:8100, y25:11622 }, { ay:'Nis', y23:5900, y24:7200, y25:5444 },
  { ay:'May', y23:7100, y24:8800, y25:11425 }, { ay:'Haz', y23:6500, y24:7900, y25:4710 },
  { ay:'Tem', y23:5800, y24:7100, y25:3713 }, { ay:'Ağu', y23:6000, y24:7400, y25:7352 },
  { ay:'Eyl', y23:7200, y24:8600, y25:7569 }, { ay:'Eki', y23:8500, y24:10200, y25:9737 },
  { ay:'Kas', y23:12000, y24:15500, y25:45214 }, { ay:'Ara', y23:13300, y24:17149, y25:45768 },
];
const yearlyTotals = { y23: sum(yearly.map(y=>y.y23)), y24: sum(yearly.map(y=>y.y24)), y25: sum(yearly.map(y=>y.y25)) };

// Charts
const stackedMonthly = MONTHS.map((m,i) => ({ month:m, b2c: Math.round(b2cTRY[i]/1000), b2b: Math.round(b2bTRY[i]/1000) }));
const qHedefActual = [
  { q:'Q1', hedef:44226, actual:37732 }, { q:'Q2', hedef:31391, actual:25038 },
  { q:'Q3', hedef:22103, actual:18869 }, { q:'Q4', hedef:107704, actual:85000 },
];
const yoyGrowth = MONTHS.map((m,i) => ({
  month:m,
  b2c: yearly[i].y24 > 0 ? +((b2cTRY[i]/(yearly[i].y24*1000/12*0.27)-1)*100).toFixed(1) : 0,
  b2b: yearly[i].y24 > 0 ? +((b2bTRY[i]/(yearly[i].y24*1000*0.73)-1)*100).toFixed(1) : 0,
}));
const profitTrend = MONTHS.map((m,i) => ({ month:m, gross: Math.round(grossProfit[i]/1000), net: Math.round(netProfit[i]/1000) }));

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtCell = (v: number|string, fmt: string): string => {
  if (typeof v === 'string') return v;
  switch(fmt) {
    case 'tl': return v >= 1e6 ? `${(v/1e6).toFixed(1).replace('.',',')}M ₺` : `${v.toLocaleString('tr-TR')} ₺`;
    case 'usd': return v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${v.toLocaleString('en-US')}`;
    case 'n': return v.toLocaleString('tr-TR');
    default: return typeof v === 'number' && v % 1 !== 0 ? v.toFixed(2).replace('.',',') + ' ₺' : String(v);
  }
};

const barColor = (pct: number) => pct >= 100 ? '#16A34A' : pct >= 80 ? '#22C55E' : pct >= 60 ? '#D97706' : '#DC2626';
const groupBg = (g: string) => g === 'b2c' ? '#F0FDFA' : g === 'b2b' ? '#F5F3FF' : '#F8FAFC';
const groupLabel = (g: string) => g === 'b2c' ? '🔵 B2C' : g === 'b2b' ? '🟣 B2B' : '⬛ Konsolide';
const groupLabelColor = (g: string) => g === 'b2c' ? '#0D9488' : g === 'b2b' ? '#7C3AED' : '#475569';

// ── Component ───────────────────────────────────────────────────────────────────

export const ManagementTargets = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [yearDD, setYearDD] = useState(false);
  const [toast, setToast] = useState(false);

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 2500); };

  // Determine group headers for matrix
  let lastGroup = '';

  return (
    <>
      {toast && (
        <div style={{ position:'fixed', top:80, right:24, background:t.cd, border:`1px solid ${t.bd}`, borderRadius:10, padding:'12px 20px', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', zIndex:100, fontSize:12, color:t.tx, display:'flex', alignItems:'center', gap:8 }}>
          <Icon name="info" size={14} color={t.pr} />
          {lang === 'tr' ? 'Düzenleme modu yakında aktif olacak' : 'Edit mode coming soon'}
        </div>
      )}

      {/* Üst Kısım */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative' }}>
          <span style={{ fontSize:12, color:t.tx2 }}>{lang === 'tr' ? 'Dönem:' : 'Period:'}</span>
          <button onClick={() => setYearDD(!yearDD)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1px solid ${t.bd}`, background:t.cd, color:t.tx, fontSize:12, fontWeight:500, cursor:'pointer', minWidth:100 }}>
            <span style={{ flex:1, textAlign:'left' }}>{selectedYear}</span>
            <Icon name="chevDown" size={12} color={t.tx3} />
          </button>
          {yearDD && (
            <div style={{ position:'absolute', top:'100%', left:50, marginTop:4, background:t.cd, border:`1px solid ${t.bd}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:20, minWidth:100, overflow:'hidden' }}>
              {['2023','2024','2025','2026'].map(y => (
                <div key={y} onClick={() => { setSelectedYear(y); setYearDD(false); }}
                  style={{ padding:'8px 14px', fontSize:12, cursor:'pointer', color: selectedYear === y ? t.pr : t.tx, background: selectedYear === y ? t.prL : 'transparent', fontWeight: selectedYear === y ? 600 : 400 }}
                  onMouseOver={e => { if (selectedYear !== y) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={e => { if (selectedYear !== y) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >{y}</div>
              ))}
            </div>
          )}
        </div>
        <button onClick={showToast} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:`1.5px solid ${t.pr}`, background:'transparent', color:t.pr, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          {lang === 'tr' ? 'Hedefleri Düzenle ✏️' : 'Edit Targets ✏️'}
        </button>
      </div>

      {/* Section 1 */}
      <SectionHeader title={l.mgtOzet ?? 'TOPLAM HEDEF ÖZET KARTLARI'} t={t} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:12 }}>
        {summaryCards.map(c => (
          <div key={c.title} style={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:600, color:t.tx2 }}>{c.title}</span>
              <span style={{ fontSize:8, fontWeight:700, color:c.bc, background:c.bg, padding:'2px 6px', borderRadius:4 }}>{c.badge}</span>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:t.tx, marginBottom:3 }}>{c.gercek}</div>
            <div style={{ fontSize:9, color:t.tx3, marginBottom:6 }}>Hedef: {c.hedef}</div>
            <div style={{ height:5, background:t.bg2, borderRadius:3, overflow:'hidden', marginBottom:3, position:'relative' }}>
              <div style={{ position:'absolute', left:`${(100/120)*100}%`, top:0, bottom:0, width:1, background:t.tx3, opacity:0.3 }} />
              <div style={{ height:'100%', width:`${Math.min(c.pct,120)/120*100}%`, background:barColor(c.pct), borderRadius:3 }} />
            </div>
            <span style={{ fontSize:10, fontWeight:600, color: c.sapma >= 0 ? '#16A34A' : '#DC2626' }}>{c.sapma > 0 ? '+' : ''}{c.sapma}%</span>
          </div>
        ))}
      </div>

      {/* Section 2 */}
      <SectionHeader title={l.mgtB2CB2B ?? 'B2C + B2B YAN YANA KARŞILAŞTIRMA'} t={t} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:4 }}>
        {[{ title:'B2C Özet', data:b2cSummary, color:'#0D9488' }, { title:'B2B Özet', data:b2bSummary, color:'#4F46E5' }].map(panel => (
          <ChartContainer key={panel.title} t={t} l={l} title={panel.title} id={`mgt-${panel.title}`} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {panel.data.map(r => (
                  <tr key={r.m} style={{ borderBottom:`1px solid ${t.bd}` }}>
                    <td style={{ padding:'7px 10px', fontSize:11, color:t.tx2 }}>{r.m}</td>
                    <td style={{ padding:'7px 10px', fontSize:12, fontWeight:600, color:t.tx, textAlign:'right' }}>{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartContainer>
        ))}
      </div>
      {/* Consolidated */}
      <div style={{ background:'#F0F9FF', border:`1px solid ${t.bd}`, borderRadius:10, padding:'12px 16px', marginBottom:12, display:'flex', gap:16, flexWrap:'wrap', justifyContent:'space-around' }}>
        {consolidatedTotals.map(c => (
          <div key={c.m} style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:t.tx3 }}>{c.m}</div>
            <div style={{ fontSize:13, fontWeight:700, color:t.tx }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Section 3 */}
      <SectionHeader title={l.mgtMatris ?? 'AYLIK DETAY MATRİSİ (B2C + B2B BİRLEŞİK)'} t={t} />
      <div style={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:10, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${t.bd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:500, color:t.tx }}>Aylık Detay Matrisi</span>
          <button style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid ${t.bd}`, background:t.bg2, color:t.tx2, fontSize:12, cursor:'pointer' }}>
            <Icon name="download" size={12} color={t.tx3} /> Excel
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', minWidth:1200 }}>
            <thead>
              <tr style={{ background:t.bg2, borderBottom:`1px solid ${t.bd}` }}>
                <th style={{ padding:'8px 12px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'left', position:'sticky', left:0, background:t.bg2, zIndex:2, minWidth:160, whiteSpace:'nowrap' }}>Metrik</th>
                {MONTHS.map(m => <th key={m} style={{ padding:'8px 8px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right', whiteSpace:'nowrap', minWidth:80 }}>{m}</th>)}
                <th style={{ padding:'8px 12px', fontSize:10, fontWeight:700, color:t.tx, textAlign:'right', minWidth:100, background:'#F0F9FF' }}>Yıl Toplam</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row, ri) => {
                const showGroupHeader = row.group !== lastGroup;
                lastGroup = row.group;
                return (
                  <>{showGroupHeader && (
                    <tr key={`gh-${row.group}`}>
                      <td colSpan={14} style={{ padding:'6px 12px', fontSize:10, fontWeight:700, color:groupLabelColor(row.group), background:groupBg(row.group), borderBottom:`1px solid ${t.bd}` }}>
                        {groupLabel(row.group)}
                      </td>
                    </tr>
                  )}
                  <tr key={ri} style={{ borderBottom:`1px solid ${t.bd}` }}>
                    <td style={{ padding:'6px 12px', fontSize:10, fontWeight:row.bold ? 600 : 400, color:t.tx, position:'sticky', left:0, zIndex:1, background:row.bold ? '#F0F9FF' : t.cd, whiteSpace:'nowrap' }}>{row.metric}</td>
                    {row.values.map((v, ci) => (
                      <td key={ci} style={{ padding:'6px 8px', fontSize:9, textAlign:'right', whiteSpace:'nowrap', fontWeight:row.bold ? 600 : 400, color:t.tx, background:row.bold ? '#F0F9FF' : 'transparent' }}>
                        {fmtCell(v as number, row.fmt)}
                      </td>
                    ))}
                    <td style={{ padding:'6px 12px', fontSize:10, textAlign:'right', fontWeight:700, color:t.tx, background:'#F0F9FF', whiteSpace:'nowrap' }}>
                      {fmtCell(row.total as number, row.fmt)}
                    </td>
                  </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 */}
      <SectionHeader title={l.mgtYillik ?? 'YILLIK PERFORMANS TABLOSU (SON 3 YIL)'} t={t} />
      <div style={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:10, overflow:'hidden', marginBottom:16 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.bd}`, background:t.bg2 }}>
                <th style={{ padding:'8px 12px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'left', position:'sticky', left:0, background:t.bg2, zIndex:2 }}>Ay</th>
                <th style={{ padding:'8px 10px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right' }}>2023 Gelir</th>
                <th style={{ padding:'8px 10px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right' }}>2024 Gelir</th>
                <th style={{ padding:'8px 10px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right' }}>2024 YoY</th>
                <th style={{ padding:'8px 10px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right' }}>2025 Gelir</th>
                <th style={{ padding:'8px 10px', fontSize:10, fontWeight:600, color:t.tx2, textAlign:'right' }}>2025 YoY</th>
              </tr>
            </thead>
            <tbody>
              {yearly.map(y => {
                const yoy24 = ((y.y24 / y.y23 - 1) * 100);
                const yoy25 = ((y.y25 / y.y24 - 1) * 100);
                return (
                  <tr key={y.ay} style={{ borderBottom:`1px solid ${t.bd}` }}>
                    <td style={{ padding:'7px 12px', fontSize:11, fontWeight:500, color:t.tx, position:'sticky', left:0, background:t.cd, zIndex:1 }}>{y.ay}</td>
                    <td style={{ padding:'7px 10px', fontSize:11, textAlign:'right', color:t.tx }}>{y.y23.toLocaleString('tr-TR')}K ₺</td>
                    <td style={{ padding:'7px 10px', fontSize:11, textAlign:'right', color:t.tx }}>{y.y24.toLocaleString('tr-TR')}K ₺</td>
                    <td style={{ padding:'7px 10px', fontSize:11, textAlign:'right', fontWeight:600, color:yoy24 >= 0 ? '#16A34A' : '#DC2626', background:yoy24 >= 20 ? '#DCFCE7' : yoy24 >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                      {yoy24 > 0 ? '+' : ''}{yoy24.toFixed(1)}%
                    </td>
                    <td style={{ padding:'7px 10px', fontSize:11, textAlign:'right', fontWeight:500, color:t.tx }}>{y.y25.toLocaleString('tr-TR')}K ₺</td>
                    <td style={{ padding:'7px 10px', fontSize:11, textAlign:'right', fontWeight:600, color:yoy25 >= 0 ? '#16A34A' : '#DC2626', background:yoy25 >= 50 ? '#DCFCE7' : yoy25 >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                      {yoy25 > 0 ? '+' : ''}{yoy25.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              {/* Total */}
              <tr style={{ borderTop:`2px solid ${t.bd}`, background:t.bg2 }}>
                <td style={{ padding:'8px 12px', fontSize:11, fontWeight:700, color:t.tx, position:'sticky', left:0, background:t.bg2, zIndex:1 }}>Toplam</td>
                <td style={{ padding:'8px 10px', fontSize:11, textAlign:'right', fontWeight:700, color:t.tx }}>{yearlyTotals.y23.toLocaleString('tr-TR')}K ₺</td>
                <td style={{ padding:'8px 10px', fontSize:11, textAlign:'right', fontWeight:700, color:t.tx }}>{yearlyTotals.y24.toLocaleString('tr-TR')}K ₺</td>
                <td style={{ padding:'8px 10px', fontSize:11, textAlign:'right', fontWeight:700, color:'#16A34A' }}>+{((yearlyTotals.y24/yearlyTotals.y23-1)*100).toFixed(1)}%</td>
                <td style={{ padding:'8px 10px', fontSize:11, textAlign:'right', fontWeight:700, color:t.tx }}>{yearlyTotals.y25.toLocaleString('tr-TR')}K ₺</td>
                <td style={{ padding:'8px 10px', fontSize:11, textAlign:'right', fontWeight:700, color:'#16A34A' }}>+{((yearlyTotals.y25/yearlyTotals.y24-1)*100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5 */}
      <SectionHeader title={l.mgtTrendler ?? 'TREND GRAFİKLERİ'} t={t} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <ChartContainer t={t} l={l} title={l.mgtB2CB2BChart ?? 'Aylık Gelir B2C vs B2B'} id="mgt-chart-stacked" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stackedMonthly} margin={{ top:10, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
              <Tooltip contentStyle={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:8, fontSize:12 }} formatter={(v:number,n:string) => [`${v}K ₺`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize:10 }} />
              <Bar dataKey="b2c" name="B2C" stackId="a" fill={t.tl} />
              <Bar dataKey="b2b" name="B2B" stackId="a" fill={t.pr} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.mgtHedefActual ?? 'Çeyreklik Hedef vs Gerçekleşen'} id="mgt-chart-qha" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={qHedefActual} margin={{ top:10, right:20, bottom:0, left:0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize:11, fill:t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
              <Tooltip contentStyle={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:8, fontSize:12 }} formatter={(v:number,n:string) => [`${v.toLocaleString('tr-TR')}K ₺`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize:10 }} />
              <Bar dataKey="hedef" name="Hedef" fill={t.tx3} opacity={0.3} radius={[4,4,0,0]} />
              <Bar dataKey="actual" name="Gerçekleşen" radius={[4,4,0,0]}>
                {qHedefActual.map((d,i) => <Cell key={i} fill={d.actual >= d.hedef ? t.gn : t.rd} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.mgtYoYTrend ?? 'YoY Büyüme Trendi'} id="mgt-chart-yoy" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={yoyGrowth} margin={{ top:10, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:8, fontSize:12 }} formatter={(v:number,n:string) => [`${v}%`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize:10 }} />
              <Line type="monotone" dataKey="b2c" name="B2C Büyüme %" stroke={t.tl} strokeWidth={2} dot={{ r:3, fill:t.tl }} />
              <Line type="monotone" dataKey="b2b" name="B2B Büyüme %" stroke={t.pr} strokeWidth={2} dot={{ r:3, fill:t.pr }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} title={l.mgtProfitTrend ?? 'Gross & Net Profit Trendi'} id="mgt-chart-profit" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={profitTrend} margin={{ top:10, right:20, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:t.tx2 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
              <Tooltip contentStyle={{ background:t.cd, border:`1px solid ${t.bd}`, borderRadius:8, fontSize:12 }} formatter={(v:number,n:string) => [`${v}K ₺`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize:10 }} />
              <Area type="monotone" dataKey="gross" name="Gross Profit" stroke="#22C55E" fill="#22C55E" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="net" name="Net Profit" stroke="#16A34A" fill="#16A34A" fillOpacity={0.3} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
};
