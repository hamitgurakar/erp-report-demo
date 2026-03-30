import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Treemap, PieChart, Pie, LineChart, Line, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { FilterBar, type FilterOption } from '../ui/FilterBar';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';
import { mkSpk } from '../../constants/data';
import { type ColDef } from '../ui/ColumnManager';
import { ColumnPresetDropdown } from '../ui/ColumnPresetDropdown';

interface Props { t: Theme; l: LangStrings; lang: Lang; panels: Panel[]; onAddPanel: (name: string) => void; onPinTo: (panelName: string, cardId: string) => void; }

// ── Mock Data ───────────────────────────────────────────────────────────────────

const treemapData = [
  { name: 'Employee Welcome', size: 1200, marj: 22.4, deals: 145 },
  { name: 'Kurumsal Hediye', size: 840, marj: 18.1, deals: 92 },
  { name: 'Motivasyon Ödülü', size: 310, marj: 24.2, deals: 78 },
  { name: 'Wellness & Sağlık', size: 420, marj: 8.2, deals: 56 },
  { name: 'Bayram & Özel Gün', size: 290, marj: 15.3, deals: 120 },
];

const top10Products = [
  { name: 'Corporate Hamper XL', revenue: 482, profit: 125 },
  { name: 'Wellness Kit Premium', revenue: 378, profit: 98 },
  { name: 'Executive Gift Box', revenue: 340, profit: 92 },
  { name: 'Gourmet Selection Pack', revenue: 312, profit: 78 },
  { name: 'Tech Accessory Pack', revenue: 298, profit: 82 },
  { name: 'Premium Textile Set', revenue: 289, profit: 68 },
  { name: 'Organic Care Bundle', revenue: 267, profit: 72 },
  { name: 'Corporate Notebook Set', revenue: 234, profit: 58 },
  { name: 'Artisan Coffee Collection', revenue: 198, profit: 52 },
  { name: 'Holiday Special Box', revenue: 164, profit: 42 },
];

const marjHistogram = [
  { range: '0-10%', count: 12 }, { range: '10-20%', count: 28 }, { range: '20-30%', count: 45 },
  { range: '30-40%', count: 38 }, { range: '40-50%', count: 22 }, { range: '50%+', count: 11 },
];
const maxMarjCount = Math.max(...marjHistogram.map(d => d.count));

const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(i+8).toString().padStart(2,'0')}:00`);
const heatmapValues = [
  [3,8,14,18,15,12,10,8,6,4,2,1],[4,12,22,28,20,15,11,9,7,5,3,1],[5,11,20,26,19,14,12,10,8,5,3,1],
  [3,9,16,20,17,13,10,8,6,4,2,1],[4,10,15,18,14,11,9,7,5,3,2,1],[1,2,4,5,4,3,2,2,1,1,0,0],[0,1,2,3,2,2,1,1,0,0,0,0],
];
const heatmapMax = Math.max(...heatmapValues.flat());

const monthlySales = [
  { month: 'Oca', adet: 1800 },{ month: 'Şub', adet: 2100 },{ month: 'Mar', adet: 2400 },{ month: 'Nis', adet: 1950 },
  { month: 'May', adet: 2200 },{ month: 'Haz', adet: 2050 },{ month: 'Tem', adet: 1700 },{ month: 'Ağu', adet: 1600 },
  { month: 'Eyl', adet: 2300 },{ month: 'Eki', adet: 2800 },{ month: 'Kas', adet: 3200 },{ month: 'Ara', adet: 3800 },
];
const maxMonthly = Math.max(...monthlySales.map(d => d.adet));

interface CatRow { id: number; kategori: string; deal: number; adet: number; ortSiparis: number; gelir: number; marj: number; durum: 'Optimal'|'Target'|'Review'; }
const categoryTable: CatRow[] = [
  { id:1, kategori:'Kurumsal Hediye', deal:278, adet:4200, ortSiparis:285, gelir:1197000, marj:19.2, durum:'Target' },
  { id:2, kategori:'Employee Welcome', deal:452, adet:12400, ortSiparis:85, gelir:1054000, marj:22.1, durum:'Optimal' },
  { id:3, kategori:'Milestone & Ödül', deal:312, adet:5200, ortSiparis:145, gelir:754000, marj:16.5, durum:'Target' },
  { id:4, kategori:'Motivasyon Ödülü', deal:185, adet:3100, ortSiparis:210, gelir:651000, marj:8.9, durum:'Review' },
  { id:5, kategori:'Bayram & Özel Gün', deal:320, adet:6100, ortSiparis:95, gelir:579500, marj:28.7, durum:'Optimal' },
  { id:6, kategori:'Wellness & Sağlık', deal:156, adet:2800, ortSiparis:175, gelir:490000, marj:12.3, durum:'Review' },
  { id:7, kategori:'İşe Başlama Kiti', deal:198, adet:3400, ortSiparis:120, gelir:408000, marj:21.8, durum:'Optimal' },
  { id:8, kategori:'Etkinlik & Tanıtım', deal:94, adet:8500, ortSiparis:45, gelir:382500, marj:25.4, durum:'Optimal' },
];

// Perf analysis table
interface PerfNode {
  id: string; name: string; satis: number; ciro: number; ciroPay: number; cogs: number; cogsOrani: number; brutKar: number; brutMarj: number; netKar: number; netMarj: number; ortFiyat: number; iade: number; devir: number; stokAdedi: number; stokDegeri: number; trend: 'up'|'down'|'flat';
  color?: string; children?: PerfNode[];
}

const PERF_ALL_COLUMNS: ColDef[] = [
  { key: 'satis', label: 'Satış Adedi' },
  { key: 'ciro', label: 'Ciro Net (K ₺)' },
  { key: 'ciroPay', label: 'Ciro Payı %' },
  { key: 'cogs', label: 'COGS (K ₺)' },
  { key: 'cogsOrani', label: 'COGS Oranı %' },
  { key: 'brutKar', label: 'Brüt Kâr (K ₺)' },
  { key: 'brutMarj', label: 'Brüt Kâr Marjı %' },
  { key: 'netKar', label: 'Net Kâr (K ₺)' },
  { key: 'netMarj', label: 'Net Kâr Marjı %' },
  { key: 'ortFiyat', label: 'Ort. Satış Fiyatı (₺)' },
  { key: 'iade', label: 'İade Oranı %' },
  { key: 'devir', label: 'Stok Devir Hızı (x)' },
  { key: 'stokAdedi', label: 'Stok Adedi' },
  { key: 'stokDegeri', label: 'Stok Değeri (K ₺)' },
  { key: 'trend', label: 'Trend' },
];
const PERF_DEFAULT_VISIBLE = ['satis','ciro','ciroPay','cogs','cogsOrani','brutMarj','netMarj','iade','devir','trend'];

// Add computed fields to nodes that only have core fields
const enrichNode = (n: Partial<PerfNode> & { id: string; name: string; satis: number; ciro: number; ciroPay: number; cogs: number; cogsOrani: number; brutMarj: number; netMarj: number; iade: number; devir: number; trend: 'up'|'down'|'flat'; color?: string; children?: PerfNode[] }): PerfNode => ({
  ...n,
  brutKar: n.brutKar ?? Math.round(n.ciro * n.brutMarj / 100),
  netKar: n.netKar ?? Math.round(n.ciro * n.netMarj / 100),
  ortFiyat: n.ortFiyat ?? (n.satis > 0 ? Math.round(n.ciro * 1000 / n.satis) : 0),
  stokAdedi: n.stokAdedi ?? Math.round(n.satis * 0.6),
  stokDegeri: n.stokDegeri ?? Math.round(n.ciro * 0.4),
  children: n.children?.map(c => enrichNode(c as Parameters<typeof enrichNode>[0])),
} as PerfNode);

const perfTree: PerfNode[] = [
  { id:'elektronik', name:'Elektronik', color:'#4F46E5', satis:4820, ciro:520, ciroPay:28.6, cogs:322, cogsOrani:61.9, brutKar:198, brutMarj:38.1, netKar:114, netMarj:21.9, ortFiyat:108, iade:4.2, devir:5.8, stokAdedi:2840, stokDegeri:890, trend:'up', children:[
    { id:'laptop', name:'Laptop', satis:1240, ciro:210, ciroPay:11.5, cogs:128, cogsOrani:61.0, brutKar:82, brutMarj:39.0, netKar:48, netMarj:22.9, ortFiyat:169, iade:3.1, devir:6.2, stokAdedi:820, stokDegeri:340, trend:'up', children:[
      { id:'gaming-laptop', name:'Gaming Laptop X500', satis:540, ciro:95, ciroPay:5.2, cogs:57, cogsOrani:60.0, brutKar:38, brutMarj:40.0, netKar:22, netMarj:23.2, ortFiyat:176, iade:2.8, devir:7.1, stokAdedi:320, stokDegeri:145, trend:'up' },
      { id:'is-laptop', name:'İş Laptopu Pro 14', satis:700, ciro:115, ciroPay:6.3, cogs:71, cogsOrani:61.7, brutKar:44, brutMarj:38.3, netKar:26, netMarj:22.6, ortFiyat:164, iade:3.3, devir:5.5, stokAdedi:500, stokDegeri:195, trend:'up' },
    ]},
    { id:'telefon', name:'Telefon & Aksesuar', satis:2180, ciro:180, ciroPay:9.9, cogs:112, cogsOrani:62.2, brutMarj:37.8, netMarj:21.1, iade:5.1, devir:5.4, trend:'up', children:[
      { id:'akilli-saat', name:'Akıllı Saat Pro', satis:420, ciro:38, ciroPay:2.1, cogs:23, cogsOrani:60.5, brutMarj:39.5, netMarj:22.8, iade:3.4, devir:6.8, trend:'up' },
      { id:'kulaklik', name:'Kablosuz Kulaklık Elite', satis:680, ciro:52, ciroPay:2.9, cogs:33, cogsOrani:63.5, brutMarj:36.5, netMarj:19.8, iade:4.8, devir:5.2, trend:'flat' },
      { id:'kilif-set', name:'Telefon Kılıf Set', satis:1080, ciro:90, ciroPay:4.9, cogs:56, cogsOrani:62.2, brutMarj:37.8, netMarj:21.4, iade:6.2, devir:4.8, trend:'up' },
    ]},
    { id:'tv-ev', name:'TV & Ev Elektroniği', satis:1400, ciro:130, ciroPay:7.1, cogs:82, cogsOrani:63.1, brutMarj:36.9, netMarj:21.5, iade:4.8, devir:5.1, trend:'flat', children:[
      { id:'robot-supurge', name:'Robot Süpürge A+', satis:380, ciro:42, ciroPay:2.3, cogs:26, cogsOrani:61.9, brutMarj:38.1, netMarj:22.4, iade:3.2, devir:5.8, trend:'up' },
      { id:'kahve-mak', name:'Kahve Makinesi X', satis:520, ciro:48, ciroPay:2.6, cogs:31, cogsOrani:64.6, brutMarj:35.4, netMarj:20.1, iade:5.4, devir:4.6, trend:'flat' },
      { id:'masa-kulaklik', name:'Masaüstü Kulaklık', satis:500, ciro:40, ciroPay:2.2, cogs:25, cogsOrani:62.5, brutMarj:37.5, netMarj:22.0, iade:5.8, devir:5.2, trend:'flat' },
    ]},
  ]},
  { id:'kozmetik', name:'Kozmetik', color:'#EC4899', satis:6240, ciro:310, ciroPay:17.0, cogs:174, cogsOrani:56.1, brutMarj:43.9, netMarj:25.2, iade:2.8, devir:7.2, trend:'up', children:[
    { id:'cilt', name:'Cilt Bakım', satis:2850, ciro:145, ciroPay:8.0, cogs:78, cogsOrani:53.8, brutMarj:46.2, netMarj:27.4, iade:2.2, devir:8.1, trend:'up', children:[
      { id:'serum', name:'Cilt Serumu A+', satis:920, ciro:52, ciroPay:2.9, cogs:27, cogsOrani:51.9, brutMarj:48.1, netMarj:28.8, iade:1.8, devir:9.2, trend:'up' },
      { id:'nemlendirici', name:'Nemlendirici Set', satis:1180, ciro:58, ciroPay:3.2, cogs:32, cogsOrani:55.2, brutMarj:44.8, netMarj:26.4, iade:2.4, devir:7.5, trend:'up' },
      { id:'anti-aging', name:'Anti-Aging Krem', satis:750, ciro:35, ciroPay:1.9, cogs:19, cogsOrani:54.3, brutMarj:45.7, netMarj:27.2, iade:2.1, devir:7.4, trend:'flat' },
    ]},
    { id:'makyaj', name:'Makyaj', satis:2140, ciro:105, ciroPay:5.8, cogs:62, cogsOrani:59.0, brutMarj:41.0, netMarj:22.8, iade:3.2, devir:6.5, trend:'up', children:[
      { id:'ruj', name:'Ruj Premium Set', satis:680, ciro:34, ciroPay:1.9, cogs:20, cogsOrani:58.8, brutMarj:41.2, netMarj:23.1, iade:2.8, devir:7.0, trend:'up' },
      { id:'fondoten', name:'Fondöten Kit', satis:860, ciro:42, ciroPay:2.3, cogs:25, cogsOrani:59.5, brutMarj:40.5, netMarj:22.4, iade:3.4, devir:6.2, trend:'flat' },
      { id:'goz-makyaj', name:'Göz Makyajı Seti', satis:600, ciro:29, ciroPay:1.6, cogs:17, cogsOrani:58.6, brutMarj:41.4, netMarj:23.0, iade:3.5, devir:6.4, trend:'up' },
    ]},
    { id:'parfum', name:'Parfüm', satis:1250, ciro:60, ciroPay:3.3, cogs:34, cogsOrani:56.7, brutMarj:43.3, netMarj:25.0, iade:3.1, devir:6.8, trend:'flat', children:[
      { id:'erkek-parfum', name:'Erkek Parfüm Set', satis:580, ciro:28, ciroPay:1.5, cogs:16, cogsOrani:57.1, brutMarj:42.9, netMarj:24.6, iade:3.0, devir:6.5, trend:'flat' },
      { id:'kadin-parfum', name:'Kadın Parfüm Premium', satis:670, ciro:32, ciroPay:1.8, cogs:18, cogsOrani:56.3, brutMarj:43.7, netMarj:25.4, iade:3.2, devir:7.1, trend:'up' },
    ]},
  ]},
  { id:'ev-yasam', name:'Ev & Yaşam', color:'#16A34A', satis:5120, ciro:280, ciroPay:15.4, cogs:182, cogsOrani:65.0, brutMarj:35.0, netMarj:17.9, iade:3.5, devir:4.9, trend:'flat', children:[
    { id:'mutfak', name:'Mutfak', satis:2340, ciro:132, ciroPay:7.3, cogs:85, cogsOrani:64.4, brutMarj:35.6, netMarj:18.4, iade:3.2, devir:5.2, trend:'flat', children:[
      { id:'bicak', name:'Bıçak Seti Premium', satis:480, ciro:28, ciroPay:1.5, cogs:17, cogsOrani:60.7, brutMarj:39.3, netMarj:21.8, iade:2.4, devir:6.0, trend:'up' },
      { id:'tencere', name:'Tencere Set', satis:720, ciro:45, ciroPay:2.5, cogs:30, cogsOrani:66.7, brutMarj:33.3, netMarj:16.2, iade:3.8, devir:4.8, trend:'flat' },
      { id:'kahve-aks', name:'Kahve Aksesuar Kit', satis:1140, ciro:59, ciroPay:3.2, cogs:38, cogsOrani:64.4, brutMarj:35.6, netMarj:18.5, iade:3.5, devir:5.0, trend:'flat' },
    ]},
    { id:'dekor', name:'Ev Dekor', satis:1680, ciro:92, ciroPay:5.1, cogs:62, cogsOrani:67.4, brutMarj:32.6, netMarj:16.2, iade:4.0, devir:4.4, trend:'flat', children:[
      { id:'mum', name:'Mum & Koku Seti', satis:820, ciro:44, ciroPay:2.4, cogs:29, cogsOrani:65.9, brutMarj:34.1, netMarj:17.4, iade:3.6, devir:4.8, trend:'up' },
      { id:'obje', name:'Dekoratif Obje Set', satis:860, ciro:48, ciroPay:2.6, cogs:33, cogsOrani:68.8, brutMarj:31.3, netMarj:15.0, iade:4.4, devir:4.0, trend:'flat' },
    ]},
    { id:'tekstil-ev', name:'Tekstil Ev', satis:1100, ciro:56, ciroPay:3.1, cogs:35, cogsOrani:62.5, brutMarj:37.5, netMarj:19.2, iade:3.4, devir:5.0, trend:'up', children:[
      { id:'havlu', name:'Havlu Set Premium', satis:520, ciro:26, ciroPay:1.4, cogs:16, cogsOrani:61.5, brutMarj:38.5, netMarj:20.0, iade:3.0, devir:5.4, trend:'up' },
      { id:'bornoz', name:'Bornoz Set', satis:580, ciro:30, ciroPay:1.7, cogs:19, cogsOrani:63.3, brutMarj:36.7, netMarj:18.5, iade:3.8, devir:4.6, trend:'flat' },
    ]},
  ]},
  { id:'gida', name:'Gıda', color:'#D97706', satis:8900, ciro:245, ciroPay:13.5, cogs:216, cogsOrani:88.2, brutMarj:11.8, netMarj:4.9, iade:1.1, devir:12.4, trend:'down', children:[
    { id:'cikolata', name:'Çikolata & Şeker', satis:4200, ciro:118, ciroPay:6.5, cogs:102, cogsOrani:86.4, brutMarj:13.6, netMarj:5.8, iade:0.8, devir:13.8, trend:'down', children:[
      { id:'prem-ciko', name:'Premium Çikolata Kutusu', satis:1800, ciro:52, ciroPay:2.9, cogs:44, cogsOrani:84.6, brutMarj:15.4, netMarj:6.8, iade:0.6, devir:14.2, trend:'down' },
      { id:'seker-set', name:'Özel Gün Şeker Seti', satis:2400, ciro:66, ciroPay:3.6, cogs:58, cogsOrani:87.9, brutMarj:12.1, netMarj:4.9, iade:1.0, devir:13.5, trend:'down' },
    ]},
    { id:'konserve', name:'Gıda Konserve', satis:2800, ciro:72, ciroPay:4.0, cogs:65, cogsOrani:90.3, brutMarj:9.7, netMarj:3.8, iade:1.2, devir:11.5, trend:'flat', children:[
      { id:'gurme', name:'Gurme Set', satis:1200, ciro:34, ciroPay:1.9, cogs:30, cogsOrani:88.2, brutMarj:11.8, netMarj:4.5, iade:1.0, devir:12.0, trend:'flat' },
      { id:'zeytinyagi', name:'Zeytinyağı Premium', satis:1600, ciro:38, ciroPay:2.1, cogs:35, cogsOrani:92.1, brutMarj:7.9, netMarj:3.2, iade:1.4, devir:11.0, trend:'flat' },
    ]},
    { id:'kuruyemis', name:'Kuruyemiş & Atıştırmalık', satis:1900, ciro:55, ciroPay:3.0, cogs:49, cogsOrani:89.1, brutMarj:10.9, netMarj:4.5, iade:1.4, devir:11.2, trend:'flat', children:[
      { id:'kuru-sepet', name:'Kuruyemiş Sepeti', satis:1100, ciro:32, ciroPay:1.8, cogs:28, cogsOrani:87.5, brutMarj:12.5, netMarj:5.2, iade:1.2, devir:11.8, trend:'flat' },
      { id:'detox', name:'Detox Set', satis:800, ciro:23, ciroPay:1.3, cogs:21, cogsOrani:91.3, brutMarj:8.7, netMarj:3.5, iade:1.6, devir:10.4, trend:'down' },
    ]},
  ]},
  { id:'tekstil', name:'Tekstil', color:'#DC2626', satis:3840, ciro:198, ciroPay:10.9, cogs:154, cogsOrani:77.8, brutMarj:22.2, netMarj:9.1, iade:7.8, devir:3.1, trend:'flat', children:[
    { id:'giyim-aks', name:'Giyim Aksesuar', satis:1920, ciro:102, ciroPay:5.6, cogs:78, cogsOrani:76.5, brutMarj:23.5, netMarj:10.2, iade:7.2, devir:3.4, trend:'flat', children:[
      { id:'atki-bere', name:'Kışlık Atkı-Bere Set', satis:680, ciro:36, ciroPay:2.0, cogs:27, cogsOrani:75.0, brutMarj:25.0, netMarj:11.5, iade:6.5, devir:3.8, trend:'up' },
      { id:'cuzdan', name:'Deri Cüzdan Premium', satis:540, ciro:32, ciroPay:1.8, cogs:25, cogsOrani:78.1, brutMarj:21.9, netMarj:9.0, iade:5.8, devir:3.2, trend:'flat' },
      { id:'kravat', name:'Kravat & Mendil Set', satis:700, ciro:34, ciroPay:1.9, cogs:26, cogsOrani:76.5, brutMarj:23.5, netMarj:10.2, iade:8.6, devir:3.2, trend:'flat' },
    ]},
    { id:'canta', name:'Çanta', satis:1920, ciro:96, ciroPay:5.3, cogs:76, cogsOrani:79.2, brutMarj:20.8, netMarj:8.0, iade:8.4, devir:2.8, trend:'flat', children:[
      { id:'laptop-canta', name:'Laptop Çantası', satis:820, ciro:42, ciroPay:2.3, cogs:33, cogsOrani:78.6, brutMarj:21.4, netMarj:8.5, iade:7.8, devir:3.0, trend:'flat' },
      { id:'sirt-canta', name:'Sırt Çantası Premium', satis:600, ciro:30, ciroPay:1.7, cogs:24, cogsOrani:80.0, brutMarj:20.0, netMarj:7.4, iade:9.2, devir:2.6, trend:'down' },
      { id:'clutch', name:'Clutch Set', satis:500, ciro:24, ciroPay:1.3, cogs:19, cogsOrani:79.2, brutMarj:20.8, netMarj:8.2, iade:8.4, devir:2.8, trend:'flat' },
    ]},
  ]},
].map(n => enrichNode(n as Parameters<typeof enrichNode>[0]));

// Ciro trend (multi-line)
const ciroTrendMonths = ['Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara','Oca','Şub'];
const ciroTrendData = ciroTrendMonths.map((m, i) => ({
  month: m, kurumsal: 42+i*3+Math.round(Math.random()*8), welcome: 28+i*2+Math.round(Math.random()*6),
  wellness: 22+i*1.5+Math.round(Math.random()*5), motivasyon: 18+i*1+Math.round(Math.random()*4),
  bayram: 14+i*2+Math.round(Math.random()*10), diger: 8+i*0.5+Math.round(Math.random()*3),
}));

// Revenue share change
const revShareData = [
  { amac:'Kurumsal Hediye', buAy:92, buAyPay:28.6, gecenAy:85, gecenAyPay:27.8, degisim:0.8, trend:'up' as const },
  { amac:'Employee Welcome', buAy:55, buAyPay:17.1, gecenAy:48, gecenAyPay:15.7, degisim:1.4, trend:'up' as const },
  { amac:'Wellness & Sağlık', buAy:49, buAyPay:15.2, gecenAy:51, gecenAyPay:16.7, degisim:-1.5, trend:'down' as const },
  { amac:'Motivasyon Ödülü', buAy:44, buAyPay:13.7, gecenAy:42, gecenAyPay:13.7, degisim:0.0, trend:'flat' as const },
  { amac:'Bayram & Özel Gün', buAy:35, buAyPay:10.9, gecenAy:38, gecenAyPay:12.4, degisim:-1.5, trend:'down' as const },
];

// Profitability matrix scatter
const profitMatrix = [
  { name:'Kurumsal Hediye', ciro:520, brutMarj:38.1, skuSayisi:42 },
  { name:'Employee Welcome', ciro:310, brutMarj:43.9, skuSayisi:65 },
  { name:'Wellness & Sağlık', ciro:280, brutMarj:35.0, skuSayisi:38 },
  { name:'Motivasyon Ödülü', ciro:245, brutMarj:11.8, skuSayisi:89 },
  { name:'Bayram & Özel Gün', ciro:198, brutMarj:22.2, skuSayisi:32 },
];
const avgCiro = Math.round(profitMatrix.reduce((s,d)=>s+d.ciro,0)/profitMatrix.length);
const avgMarj = Math.round(profitMatrix.reduce((s,d)=>s+d.brutMarj,0)/profitMatrix.length);

// Stock health donut
const stockHealth = [
  { name:'Sağlıklı', value:62, color:'#16A34A' }, { name:'Fazla Stok', value:18, color:'#D97706' },
  { name:'Kritik', value:12, color:'#DC2626' }, { name:'Ölü Stok', value:8, color:'#94A3B8' },
];

// Stock turnover trend
const stockTurnover = [
  { month:'Mar', devir:4.2 },{ month:'Nis', devir:4.4 },{ month:'May', devir:4.5 },
  { month:'Haz', devir:4.6 },{ month:'Tem', devir:4.7 },{ month:'Ağu', devir:4.8 },
];

// Stock aging
const stockAging = [
  { name:'Kurumsal Hediye', d0_30:45, d31_60:25, d61_90:18, d90plus:12 },
  { name:'Employee Welcome', d0_30:55, d31_60:22, d61_90:15, d90plus:8 },
  { name:'Wellness', d0_30:35, d31_60:28, d61_90:22, d90plus:15 },
  { name:'Motivasyon', d0_30:40, d31_60:24, d61_90:20, d90plus:16 },
  { name:'Bayram', d0_30:50, d31_60:20, d61_90:18, d90plus:12 },
];

// Stock vs sales scatter
const stockVsSales = [
  { name:'Corp. Hamper XL', stokDeg:85, satisHizi:32, color:'green' },
  { name:'Wellness Kit', stokDeg:120, satisHizi:8, color:'red' },
  { name:'Gift Box', stokDeg:60, satisHizi:24, color:'green' },
  { name:'Notebook Set', stokDeg:95, satisHizi:14, color:'amber' },
  { name:'Coffee Col.', stokDeg:45, satisHizi:18, color:'green' },
  { name:'Holiday Box', stokDeg:110, satisHizi:10, color:'red' },
  { name:'Textile Set', stokDeg:70, satisHizi:20, color:'amber' },
];

// Critical stock
const criticalStock = [
  { id:1, urun:'Corporate Hamper XL', amac:'Kurumsal Hediye', stok:8, hiz:3.2, tukenme:2, tedarik:14, durum:'acil' as const },
  { id:2, urun:'Wellness Kit Premium', amac:'Wellness & Sağlık', stok:24, hiz:4.8, tukenme:5, tedarik:7, durum:'acil' as const },
  { id:3, urun:'Premium Notebook Set', amac:'Motivasyon Ödülü', stok:15, hiz:2.1, tukenme:7, tedarik:10, durum:'uyari' as const },
  { id:4, urun:'Welcome Box Standard', amac:'Employee Welcome', stok:32, hiz:4.0, tukenme:8, tedarik:5, durum:'uyari' as const },
  { id:5, urun:'Holiday Gift Set', amac:'Bayram & Özel Gün', stok:18, hiz:1.8, tukenme:10, tedarik:8, durum:'uyari' as const },
  { id:6, urun:'Milestone Trophy', amac:'Milestone & Ödül', stok:45, hiz:3.5, tukenme:13, tedarik:10, durum:'izle' as const },
  { id:7, urun:'Event Tote Bag', amac:'Etkinlik & Tanıtım', stok:28, hiz:1.9, tukenme:14, tedarik:12, durum:'izle' as const },
  { id:8, urun:'Eco Wellness Pack', amac:'Wellness & Sağlık', stok:52, hiz:2.4, tukenme:22, tedarik:8, durum:'izle' as const },
];

// Brand data
const brandTop = [
  { name:'Samsung', ciro:482 },{ name:'Apple', ciro:420 },{ name:'L\'Oreal', ciro:368 },{ name:'Nike', ciro:345 },
  { name:'Dyson', ciro:298 },{ name:'Adidas', ciro:267 },{ name:'HP', ciro:234 },{ name:'Bosch', ciro:198 },
  { name:'Sony', ciro:176 },{ name:'Estée Lauder', ciro:152 },
];
const brandMatrix = [
  { name:'Samsung', buyume:18, marjDelta:2.4, ciro:482, color:'#16A34A' },
  { name:'Apple', buyume:12, marjDelta:1.8, ciro:420, color:'#16A34A' },
  { name:'L\'Oreal', buyume:8, marjDelta:-0.5, ciro:368, color:'#D97706' },
  { name:'Nike', buyume:-3, marjDelta:1.2, ciro:345, color:'#D97706' },
  { name:'Dyson', buyume:22, marjDelta:3.1, ciro:298, color:'#16A34A' },
  { name:'Adidas', buyume:-8, marjDelta:-2.1, ciro:267, color:'#DC2626' },
  { name:'HP', buyume:5, marjDelta:0.8, ciro:234, color:'#16A34A' },
];
const brandTable = [
  { marka:'Samsung', ciro:482, pay:15.2, marj:28.4, sku:42, satis:12400, stok:180, iade:2.1, buyume:18.2 },
  { marka:'Apple', ciro:420, pay:13.3, marj:32.1, sku:28, satis:8900, stok:145, iade:1.8, buyume:12.4 },
  { marka:'L\'Oreal', ciro:368, pay:11.6, marj:24.8, sku:65, satis:15200, stok:210, iade:3.2, buyume:8.1 },
  { marka:'Nike', ciro:345, pay:10.9, marj:22.5, sku:38, satis:9800, stok:165, iade:4.5, buyume:-3.2 },
  { marka:'Dyson', ciro:298, pay:9.4, marj:35.2, sku:18, satis:4200, stok:95, iade:1.2, buyume:22.4 },
  { marka:'Adidas', ciro:267, pay:8.4, marj:21.8, sku:45, satis:11200, stok:198, iade:5.1, buyume:-8.3 },
  { marka:'HP', ciro:234, pay:7.4, marj:26.3, sku:32, satis:6800, stok:120, iade:2.8, buyume:5.4 },
  { marka:'Bosch', ciro:198, pay:6.3, marj:29.1, sku:22, satis:3800, stok:85, iade:1.5, buyume:14.2 },
];

// Quarterly deal heatmap
const qDealRows = [
  { amac:'Kurumsal Hediye', q1:112, q2:145, q3:189, q4:84 },
  { amac:'Employee Welcome', q1:92, q2:45, q3:124, q4:241 },
  { amac:'Bayram & Özel Gün', q1:12, q2:8, q3:45, q4:512 },
  { amac:'Wellness & Sağlık', q1:156, q2:132, q3:41, q4:68 },
  { amac:'Motivasyon Ödülü', q1:78, q2:95, q3:68, q4:42 },
];
const qMax = Math.max(...qDealRows.flatMap(r => [r.q1,r.q2,r.q3,r.q4]));

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmtTL = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(2).replace('.',',')}M ₺` : v >= 1000 ? `${Math.round(v/1000).toLocaleString('tr-TR')}K ₺` : `${v.toLocaleString('tr-TR')} ₺`;
const treemapColor = (m: number) => m >= 22 ? '#16A34A' : m >= 15 ? '#D97706' : '#DC2626';
const heatColor = (v: number, max: number, base: string) => { const a = Math.round((max > 0 ? v/max : 0)*220+15).toString(16).padStart(2,'0'); return `${base}${a}`; };
const scatterFill = (c: number, m: number, t: Theme) => { if (c >= avgCiro && m >= avgMarj) return t.gn; if (c < avgCiro && m >= avgMarj) return t.tl; if (c >= avgCiro && m < avgMarj) return t.am; return t.rd; };
const scatterColor = (c: string, t: Theme) => c === 'green' ? t.gn : c === 'red' ? t.rd : t.am;
const cogsColor = (v: number) => v < 60 ? '#16A34A' : v <= 80 ? '#D97706' : '#DC2626';
const marjBarColor = (v: number) => v >= 20 ? '#16A34A' : v >= 15 ? '#3B82F6' : '#DC2626';

const TreemapContent = (props: { x?: number; y?: number; width?: number; height?: number; name?: string; size?: number; marj?: number; index?: number }) => {
  const { x=0,y=0,width=0,height=0,name,size,marj,index } = props;
  if (width < 30 || height < 30) return null;
  const fill = treemapColor(marj ?? 0);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} opacity={0.82} stroke="#fff" strokeWidth={2} />
      {width > 60 && height > 40 && (<>
        {index === 0 && <rect x={x+6} y={y+6} width={62} height={16} rx={3} fill="#fff" opacity={0.9} />}
        {index === 0 && <text x={x+10} y={y+18} fontSize={9} fontWeight={700} fill={fill}>TOP DRIVER</text>}
        <text x={x+width/2} y={y+height/2-6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">{name && name.length > 18 ? name.slice(0,17)+'…' : name}</text>
        <text x={x+width/2} y={y+height/2+10} textAnchor="middle" fontSize={10} fill="#ffffffcc">{size}K ₺ • %{marj}</text>
      </>)}
    </g>
  );
};

// ── Component ───────────────────────────────────────────────────────────────────

export const SalesProductCategory = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [catSort, setCatSort] = useState<{key:string;dir:'asc'|'desc'}>({key:'gelir',dir:'desc'});
  const [bkMode, setBkMode] = useState('TL');
  const [nkMode, setNkMode] = useState('TL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [perfSearch, setPerfSearch] = useState('');
  const [perfShowFilters, setPerfShowFilters] = useState(false);
  const [perfFilters, setPerfFilters] = useState<{id:number;metric:string;operator:string;value:number}[]>([]);
  const [perfNextId, setPerfNextId] = useState(1);
  const [perfVisibleCols, setPerfVisibleCols] = useState<string[]>(PERF_DEFAULT_VISIBLE);
  const PERF_OPS = ['>','<','>=','<=','=','≠'] as const;

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll = () => { const all = new Set<string>(); const walk = (nodes: PerfNode[]) => { for (const n of nodes) { if (n.children) { all.add(n.id); walk(n.children); } } }; walk(perfTree); setExpanded(all); };
  const collapseAll = () => setExpanded(new Set());

  const addPerfFilter = () => { setPerfFilters(p=>[...p,{id:perfNextId,metric:'satis',operator:'>',value:0}]); setPerfNextId(n=>n+1); };
  const removePerfFilter = (id:number) => setPerfFilters(p=>p.filter(f=>f.id!==id));
  const updatePerfFilter = (id:number,field:string,val:string|number) => setPerfFilters(p=>p.map(f=>f.id===id?{...f,[field]:val}:f));

  const perfPassesFilters = (node: PerfNode): boolean => {
    if (perfFilters.length===0) return true;
    return perfFilters.every(f => {
      const v = (node as unknown as Record<string,number>)[f.metric];
      if (v===undefined) return true;
      const t = f.value;
      switch(f.operator) { case '>': return v>t; case '<': return v<t; case '>=': return v>=t; case '<=': return v<=t; case '=': return v===t; case '≠': return v!==t; default: return true; }
    });
  };

  const filterPerfTree = (nodes: PerfNode[]): PerfNode[] => {
    return nodes.map(n => {
      const children = n.children ? filterPerfTree(n.children) : undefined;
      const nameMatch = !perfSearch || n.name.toLowerCase().includes(perfSearch.toLowerCase());
      const metricMatch = perfPassesFilters(n);
      const childrenMatch = children && children.length > 0;
      if (nameMatch && metricMatch) return {...n, children};
      if (childrenMatch) return {...n, children};
      return null;
    }).filter(Boolean) as PerfNode[];
  };

  const getPerfAutoExpand = (nodes: PerfNode[], parents: string[] = []): Set<string> => {
    const ids = new Set<string>();
    for (const n of nodes) {
      if (perfSearch && n.name.toLowerCase().includes(perfSearch.toLowerCase())) parents.forEach(id => ids.add(id));
      if (n.children) getPerfAutoExpand(n.children, [...parents, n.id]).forEach(id => ids.add(id));
    }
    return ids;
  };
  const perfAutoExpand = perfSearch ? getPerfAutoExpand(perfTree) : new Set<string>();
  const perfEffectiveExpanded = new Set([...expanded, ...perfAutoExpand]);
  const isPerfHighlighted = (name: string) => perfSearch && name.toLowerCase().includes(perfSearch.toLowerCase());

  const handleCatSort = (key: string) => setCatSort(p => p.key === key && p.dir === 'desc' ? {key,dir:'asc'} : {key,dir:'desc'});
  const sortedCat = [...categoryTable].sort((a,b) => { const av=(a as Record<string,unknown>)[catSort.key]; const bv=(b as Record<string,unknown>)[catSort.key]; if (typeof av==='number'&&typeof bv==='number') return catSort.dir==='asc'?av-bv:bv-av; return catSort.dir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av)); });

  const filters: FilterOption[] = [
    { key:'kategori', label:l.filtreKategori??'Kategori', options:['Employee Welcome','Kurumsal Hediye','Motivasyon Ödülü','Wellness & Sağlık','Bayram & Özel Gün'] },
    { key:'altKategori', label:l.filtreAltKategori??'Alt Kategori', options:['Standard','Premium','Custom'] },
    { key:'urun', label:l.filtreUrun??'Ürün', options:[l.filtreTumu??'Tümü'] },
    { key:'kanal', label:l.filtreKanal??'Kanal', options:['b2b.muhiku.com','B2B Project'] },
  ];

  const durumBadge = (d: string) => { const cfg: Record<string,{color:string;bg:string}> = { Optimal:{color:'#059669',bg:'#D1FAE5'}, Target:{color:'#3B82F6',bg:'#DBEAFE'}, Review:{color:'#DC2626',bg:'#FEE2E2'} }; const c = cfg[d] ?? {color:t.tx2,bg:t.bg2}; return <span style={{fontSize:10,fontWeight:600,color:c.color,background:c.bg,borderRadius:5,padding:'2px 8px'}}>{d}</span>; };
  const stockDurumBadge = (d: string) => { const cfg: Record<string,{label:string;color:string;bg:string}> = { acil:{label:'Acil',color:'#DC2626',bg:'#FEE2E2'}, uyari:{label:'Uyarı',color:'#D97706',bg:'#FEF3C7'}, izle:{label:'İzle',color:'#3B82F6',bg:'#DBEAFE'} }; const c=cfg[d]??{label:d,color:t.tx2,bg:t.bg2}; return <span style={{fontSize:10,fontWeight:600,color:c.color,background:c.bg,borderRadius:5,padding:'2px 8px'}}>{c.label}</span>; };
  const stockAksiyonBtn = (d: string) => { const cfg: Record<string,{label:string;color:string}> = { acil:{label:'Sipariş Geç',color:'#16A34A'}, uyari:{label:'İncele',color:'#D97706'}, izle:{label:'İzleniyor',color:'#94A3B8'} }; const c=cfg[d]??{label:d,color:t.tx2}; return <button onClick={()=>window.open('#','_blank')} style={{fontSize:10,fontWeight:600,color:c.color,background:c.color+'14',border:`1px solid ${c.color}44`,borderRadius:6,padding:'4px 10px',cursor:'pointer',whiteSpace:'nowrap'}}>{c.label}</button>; };

  return (
    <>
      <FilterBar t={t} l={l} filters={filters} />
      <div style={{fontSize:10,color:t.tx3,marginBottom:8,fontStyle:'italic'}}>{lang==='tr'?'Bu filtreler B2B satış verileri için uyarlanacaktır':'These filters will be adapted for B2B sales data'}</div>

      {/* ── 1. ÜRÜN & KATEGORİ METRİKLERİ ────────────────────────────────────── */}
      <SectionHeader title={l.prdMetrikler ?? 'ÜRÜN & KATEGORİ METRİKLERİ'} t={t} />

      {/* Row 1 — Gelir & Karlılık */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:10,marginBottom:10}}>
        <KPICard id="prd-net-ciro" title="Net Satış Cirosu" value="2,48M ₺" trendValue="+12,4%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="prd-cogs" title="COGS" value="1,62M ₺" trendValue="+4,2%" sparkTrend="up" color="am" unit="K ₺" big info="Satılan Malın Maliyeti — ürün alış maliyeti, kargo ve gümrük dahil doğrudan maliyetler." {...kp} />
        <KPICard id="prd-brut" title="Brüt Kâr" value="860K ₺" trendValue="+8,1%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState={bkMode} onToggle={setBkMode} altValue="%34,7" {...kp} />
        <KPICard id="prd-net" title="Net Kâr" value="425K ₺" trendValue="+15,2%" sparkTrend="up" color="gn" unit="K ₺" big showToggle toggleState={nkMode} onToggle={setNkMode} altValue="%17,1" {...kp} />
        <KPICard id="prd-gelir" title={l.prdToplamGelir??'Toplam Gelir'} value="1.420.000 ₺" trendValue="+8,7%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="prd-aov" title={l.prdAOV??'Ort. Sipariş Değeri'} value="214,50 ₺" trendValue="-0,8%" sparkTrend="down" color="rd" unit="₺" big {...kp} />
      </div>

      {/* Row 2 — Stok & Operasyonel */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:10,marginBottom:10}}>
        <KPICard id="prd-stok-adet" title="Toplam Stok Adedi" value="28.920" trendValue="+45" sparkTrend="up" color="c1" unit="adet" {...kp} />
        <KPICard id="prd-stok-deger" title="Toplam Stok Değeri" value="2,91M ₺" trendValue="+4,5%" sparkTrend="up" color="pu" unit="K ₺" {...kp} />
        <KPICard id="prd-sepet" title="Ort. Sepet Tutarı" value="487 ₺" trendValue="+6,2%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="prd-fiyat" title="Ort. Ürün Fiyatı" value="342 ₺" trendValue="+4,7%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="prd-iade" title="İade Oranı" value="%3,8" trendValue="-0,4%" sparkTrend="down" color="gn" unit="%" {...kp} />
        <KPICard id="prd-stok-satis" title="Stok/Satış Oranı" value="2,1 ay" trendValue="-0,2 ay" sparkTrend="down" color="gn" unit="ay" info="Mevcut stokun kaç aylık satışa yeteceği" {...kp} />
      </div>


      {/* ── 2. PROJE AMACI KATKI DAĞILIMI & TOP ÜRÜNLER ─────────────────────── */}
      <SectionHeader title={l.prdTreemapSection ?? 'PROJE AMACI KATKI DAĞILIMI & TOP ÜRÜNLER'} t={t} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Proje Amacı Katkı Dağılımı" id="prd-chart-treemap" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap data={treemapData} dataKey="size" stroke="#fff" content={<TreemapContent />}>
              <Tooltip content={({active,payload})=>active&&payload?.[0]?(<div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,padding:'8px 12px',fontSize:12}}><div style={{fontWeight:600,marginBottom:4}}>{payload[0].payload.name}</div><div style={{color:t.tx2}}>Gelir: <b>{payload[0].payload.size}K ₺</b></div><div style={{color:t.tx2}}>Marj: <b>%{payload[0].payload.marj}</b></div><div style={{color:t.tx2}}>Deal: <b>{payload[0].payload.deals}</b></div></div>):null} />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer t={t} l={l} title={l.prdTop10??'Top 10 Ürün (Gelir & Kâr)'} id="prd-chart-top10" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10Products} layout="vertical" margin={{top:0,right:20,bottom:0,left:0}} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}K`} />
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:t.tx2}} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}} formatter={(v:number,n:string)=>[`${v}K ₺`,n]} />
              <Bar dataKey="revenue" name="Gelir" fill="#818CF8" radius={[0,3,3,0]} barSize={10} />
              <Bar dataKey="profit" name="Kâr" fill="#C7D2FE" radius={[0,3,3,0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── 3. PROJE AMACI PERFORMANS TABLOSU ────────────────────────────────── */}
      <SectionHeader title="PROJE AMACI PERFORMANS TABLOSU" t={t} />
      <div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.bd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,fontWeight:500,color:t.tx}}>Proje Amacı Performans Grid</span>
          <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${t.bd}`,background:t.bg2,color:t.tx2,fontSize:12,cursor:'pointer'}}><Icon name="download" size={12} color={t.tx3} />Excel</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${t.bd}`,background:t.bg2}}>
              {[{key:'kategori',label:'Proje Amacı',align:'left'},{key:'deal',label:'Deal',align:'right'},{key:'adet',label:'Satış Adedi',align:'right'},{key:'ortSiparis',label:'Ort. Sipariş',align:'right'},{key:'gelir',label:'Gelir',align:'right'},{key:'marj',label:'Net Marj %',align:'right'},{key:'durum',label:'Durum',align:'center'}].map(col=>(
                <th key={col.key} onClick={()=>handleCatSort(col.key)} style={{padding:'8px 14px',fontSize:11,fontWeight:600,color:catSort.key===col.key?t.pr:t.tx2,textAlign:col.align as 'left'|'right'|'center',whiteSpace:'nowrap',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:col.align==='left'?'flex-start':col.align==='center'?'center':'flex-end',gap:4}}>{col.label}<Icon name={catSort.key===col.key?(catSort.dir==='asc'?'arrowUp':'arrowDown'):'arrowDown'} size={10} color={catSort.key===col.key?t.pr:t.tx3}/></div>
                </th>
              ))}
            </tr></thead>
            <tbody>{sortedCat.map(r=>(
              <tr key={r.id} style={{borderBottom:`1px solid ${t.bd}`}} onMouseOver={e=>((e.currentTarget as HTMLElement).style.background='#F8FAFC')} onMouseOut={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
                <td style={{padding:'9px 14px',fontSize:12,fontWeight:500,color:t.tx}}>{r.kategori}</td>
                <td style={{padding:'9px 14px',fontSize:12,textAlign:'right',color:t.tx}}>{r.deal}</td>
                <td style={{padding:'9px 14px',fontSize:12,textAlign:'right',color:t.tx}}>{r.adet.toLocaleString('tr-TR')}</td>
                <td style={{padding:'9px 14px',fontSize:12,textAlign:'right',color:t.tx}}>{r.ortSiparis} ₺</td>
                <td style={{padding:'9px 14px',fontSize:12,textAlign:'right',fontWeight:500,color:t.tx}}>{fmtTL(r.gelir)}</td>
                <td style={{padding:'9px 14px',width:110}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{flex:1,height:6,background:t.bg2,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(r.marj/35*100,100)}%`,background:marjBarColor(r.marj),borderRadius:3}}/></div><span style={{fontSize:10,fontWeight:600,color:marjBarColor(r.marj),width:32,textAlign:'right'}}>{r.marj.toFixed(1)}%</span></div></td>
                <td style={{padding:'9px 14px',textAlign:'center'}}>{durumBadge(r.durum)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{padding:'10px 16px',borderTop:`1px solid ${t.bd}`,textAlign:'right'}}><button onClick={()=>window.open('#','_blank')} style={{fontSize:11,fontWeight:500,color:t.pr,background:'none',border:'none',cursor:'pointer'}}>{l.tumunuGor??'Tümünü Gör'} →</button></div>
      </div>

      {/* ── 4. PERFORMANS ANALİZİ (Kategori Bazlı, Hiyerarşik) ────────────── */}
      <SectionHeader title="PERFORMANS ANALİZİ" t={t} />
      <div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
        {/* Toolbar */}
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.bd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,fontWeight:500,color:t.tx}}>Kategori Performans Analizi</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.tx3} strokeWidth="2.5" strokeLinecap="round" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={perfSearch} onChange={e=>setPerfSearch(e.target.value)} placeholder={lang==='tr'?'Kategori, alt kategori veya ürün ara...':'Search...'} style={{paddingLeft:28,paddingRight:perfSearch?28:10,paddingTop:5,paddingBottom:5,borderRadius:7,border:`1px solid ${t.bd}`,background:t.bg2,fontSize:11,color:t.tx,outline:'none',width:260}} />
              {perfSearch && <button onClick={()=>setPerfSearch('')} style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.tx3,fontSize:14,lineHeight:1}}>×</button>}
            </div>
            <button onClick={()=>setPerfShowFilters(!perfShowFilters)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:`1px solid ${perfFilters.length>0?t.pr:t.bd}`,background:perfFilters.length>0?t.prL:t.bg2,color:perfFilters.length>0?t.pr:t.tx2,fontSize:11,cursor:'pointer',fontWeight:perfFilters.length>0?600:400}}>
              <Icon name="filter" size={12} color={perfFilters.length>0?t.pr:t.tx3}/>{lang==='tr'?'Filtreler':'Filters'}{perfFilters.length>0&&` (${perfFilters.length})`}
            </button>
            <ColumnPresetDropdown t={t} l={l} tableType="salesProduct" allColumns={PERF_ALL_COLUMNS} visibleKeys={perfVisibleCols} onChange={setPerfVisibleCols} />
            <button onClick={expanded.size>0?collapseAll:expandAll} style={{padding:'5px 10px',borderRadius:7,border:`1px solid ${t.bd}`,background:t.bg2,color:t.tx2,fontSize:11,cursor:'pointer'}}>{expanded.size>0?(lang==='tr'?'Tümünü Kapat':'Collapse'):(lang==='tr'?'Tümünü Aç':'Expand')}</button>
            <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${t.bd}`,background:t.bg2,color:t.tx2,fontSize:12,cursor:'pointer'}}><Icon name="download" size={12} color={t.tx3}/>Excel</button>
          </div>
        </div>
        {/* Filter panel */}
        {perfShowFilters && (
          <div style={{padding:'10px 16px',background:'#F8FAFC',borderBottom:`1px solid ${t.bd}`}}>
            {perfFilters.map(f=>(
              <div key={f.id} style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
                <select value={f.metric} onChange={e=>updatePerfFilter(f.id,'metric',e.target.value)} style={{width:140,padding:'4px 8px',borderRadius:6,border:`1px solid ${t.bd}`,fontSize:11,color:t.tx,background:t.cd,outline:'none'}}>
                  {PERF_ALL_COLUMNS.filter(c=>c.key!=='trend').map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={f.operator} onChange={e=>updatePerfFilter(f.id,'operator',e.target.value)} style={{width:60,padding:'4px 6px',borderRadius:6,border:`1px solid ${t.bd}`,fontSize:11,color:t.tx,background:t.cd,outline:'none'}}>
                  {PERF_OPS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                <input type="number" value={f.value||''} onChange={e=>updatePerfFilter(f.id,'value',parseFloat(e.target.value)||0)} style={{width:90,padding:'4px 8px',borderRadius:6,border:`1px solid ${t.bd}`,fontSize:11,color:t.tx,background:t.cd,outline:'none'}} placeholder="değer"/>
                <button onClick={()=>removePerfFilter(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:t.tx3,fontSize:16,lineHeight:1}}>×</button>
              </div>
            ))}
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={addPerfFilter} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${t.pr}`,background:'transparent',color:t.pr,fontSize:10,fontWeight:600,cursor:'pointer'}}>+ {lang==='tr'?'Filtre Ekle':'Add Filter'}</button>
              {perfFilters.length>0&&<button onClick={()=>setPerfFilters([])} style={{padding:'4px 10px',borderRadius:6,border:'none',background:'transparent',color:t.rd,fontSize:10,cursor:'pointer'}}>{lang==='tr'?'Tümünü Temizle':'Clear All'}</button>}
            </div>
            {perfFilters.length>0&&(
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                {perfFilters.map(f=>{const label=PERF_ALL_COLUMNS.find(c=>c.key===f.metric)?.label??f.metric;return(
                  <span key={f.id} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:16,background:'#EEF2FF',color:'#4F46E5',fontSize:10,fontWeight:600}}>
                    {label} {f.operator} {f.value}<button onClick={()=>removePerfFilter(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#4F46E5',fontSize:12,lineHeight:1,marginLeft:2}}>×</button>
                  </span>
                );})}
              </div>
            )}
          </div>
        )}
        {/* Table */}
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${t.bd}`,background:t.bg2}}>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'left',whiteSpace:'nowrap'}}>Kategori</th>
              {PERF_ALL_COLUMNS.filter(c=>perfVisibleCols.includes(c.key)).map((h,i)=>(
                <th key={h.key} style={{padding:'7px 10px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:h.key==='trend'?'center':'right',whiteSpace:'nowrap'}}>{h.label}</th>
              ))}
            </tr></thead>
            <tbody>
              {(() => {
                const filteredTree = filterPerfTree(perfTree);
                const rows: React.ReactNode[] = [];
                const visCols = PERF_ALL_COLUMNS.filter(c=>perfVisibleCols.includes(c.key));
                const renderNode = (node: PerfNode, depth: number) => {
                  const isExp = perfEffectiveExpanded.has(node.id);
                  const hasKids = !!node.children?.length;
                  const indent = depth * 24;
                  const hl = isPerfHighlighted(node.name);
                  const bgColor = hl ? '#FEF9C3' : depth === 0 ? 'transparent' : depth === 1 ? '#F8FAFC' : '#F1F5F9';
                  const fw = depth === 0 ? 600 : depth === 1 ? 500 : 400;
                  const fs = depth === 2 ? 10 : 11;
                  rows.push(
                    <tr key={node.id} style={{borderBottom:`1px solid ${t.bd}`,background:bgColor}}
                      onMouseOver={e=>(e.currentTarget as HTMLElement).style.background=hl?'#FEF9C3':'#EEF2FF'}
                      onMouseOut={e=>(e.currentTarget as HTMLElement).style.background=bgColor}
                    >
                      <td style={{padding:'7px 10px',fontSize:fs,fontWeight:fw,color:t.tx,whiteSpace:'nowrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,paddingLeft:indent}}>
                          {hasKids?(<button onClick={()=>toggleExpand(node.id)} style={{width:18,height:18,borderRadius:4,border:`1px solid ${t.bd}`,background:t.bg2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:t.tx3}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{isExp?<polyline points="6 9 12 15 18 9"/>:<polyline points="9 6 15 12 9 18"/>}</svg></button>):<div style={{width:18,flexShrink:0}}/>}
                          {depth===0&&node.color&&<div style={{width:8,height:8,borderRadius:'50%',background:node.color,flexShrink:0}}/>}
                          {node.name}
                        </div>
                      </td>
                      {visCols.map(col=>{
                        if(col.key==='trend') return <td key={col.key} style={{padding:'7px 10px',textAlign:'center'}}><Spark data={mkSpk(node.trend,'K ₺',lang)} color={node.trend==='up'?t.gn:node.trend==='down'?t.rd:t.am} t={t} compact/></td>;
                        if(col.key==='satis') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.satis.toLocaleString('tr-TR')}</td>;
                        if(col.key==='ciro') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',fontWeight:depth===0?600:400,color:t.tx}}>{node.ciro}K</td>;
                        if(col.key==='ciroPay') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.ciroPay}%</td>;
                        if(col.key==='cogs') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.cogs}K</td>;
                        if(col.key==='cogsOrani') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',fontWeight:600,color:cogsColor(node.cogsOrani)}}>{node.cogsOrani}%</td>;
                        if(col.key==='brutMarj') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',fontWeight:600,color:node.brutMarj>=30?'#16A34A':node.brutMarj>=15?'#D97706':'#DC2626'}}>{node.brutMarj}%</td>;
                        if(col.key==='netMarj') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',fontWeight:600,color:node.netMarj>=15?'#16A34A':node.netMarj>=5?'#D97706':'#DC2626'}}>{node.netMarj}%</td>;
                        if(col.key==='iade') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:node.iade>5?t.rd:t.tx}}>{node.iade}%</td>;
                        if(col.key==='devir') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',fontWeight:600,color:node.devir>6?'#16A34A':node.devir>=3?'#D97706':'#DC2626'}}>{node.devir}x</td>;
                        if(col.key==='brutKar') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.brutKar}K</td>;
                        if(col.key==='netKar') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.netKar}K</td>;
                        if(col.key==='ortFiyat') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.ortFiyat} ₺</td>;
                        if(col.key==='stokAdedi') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.stokAdedi.toLocaleString('tr-TR')}</td>;
                        if(col.key==='stokDegeri') return <td key={col.key} style={{padding:'7px 10px',fontSize:fs,textAlign:'right',color:t.tx}}>{node.stokDegeri}K</td>;
                        return <td key={col.key}/>;
                      })}
                    </tr>
                  );
                  if (isExp && node.children) node.children.forEach(c => renderNode(c, depth + 1));
                };
                filteredTree.forEach(n => renderNode(n, 0));
                return rows;
              })()}
              <tr style={{borderTop:`2px solid ${t.bd}`,background:t.bg2}}>
                <td style={{padding:'7px 10px',fontSize:11,fontWeight:700,color:t.tx}}>Toplam</td>
                {PERF_ALL_COLUMNS.filter(c=>perfVisibleCols.includes(c.key)).map(col=>{
                  const sum = (fn:(r:PerfNode)=>number) => perfTree.reduce((s,r)=>s+fn(r),0);
                  if(col.key==='satis') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.satis).toLocaleString('tr-TR')}</td>;
                  if(col.key==='ciro') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.ciro)}K</td>;
                  if(col.key==='cogs') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.cogs)}K</td>;
                  if(col.key==='brutKar') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.brutKar)}K</td>;
                  if(col.key==='netKar') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.netKar)}K</td>;
                  if(col.key==='stokAdedi') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.stokAdedi).toLocaleString('tr-TR')}</td>;
                  if(col.key==='stokDegeri') return <td key={col.key} style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:700,color:t.tx}}>{sum(r=>r.stokDegeri)}K</td>;
                  return <td key={col.key}/>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. CİRO TRENDİ & PAY DEĞİŞİMİ ───────────────────────────────────── */}
      <SectionHeader title="CİRO TRENDİ & PAY DEĞİŞİMİ" t={t} />
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Aylık Ciro Trendi (Proje Amacı Bazlı)" id="prd-chart-cirotrend" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ciroTrendData} margin={{top:10,right:20,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}K`}/>
              <Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}} formatter={(v:number,n:string)=>[`${v}K ₺`,n]}/>
              <Legend iconSize={10} wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="kurumsal" name="Kurumsal Hediye" stroke={t.pr} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="welcome" name="Employee Welcome" stroke={t.tl} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="wellness" name="Wellness" stroke={t.gn} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="motivasyon" name="Motivasyon" stroke={t.am} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="bayram" name="Bayram" stroke={t.rd} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="diger" name="Diğer" stroke={t.tx3} strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer t={t} l={l} title="Ciro Payı Değişim Tablosu" id="prd-chart-revshare" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{borderBottom:`1px solid ${t.bd}`,background:t.bg2}}>
                <th style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'left'}}>Amaç</th>
                <th style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'right'}}>Bu Ay</th>
                <th style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'right'}}>Pay %</th>
                <th style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'right'}}>Δ (pp)</th>
                <th style={{padding:'6px 8px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:'center'}}>Trend</th>
              </tr></thead>
              <tbody>{revShareData.map(r=>(
                <tr key={r.amac} style={{borderBottom:`1px solid ${t.bd}`}}>
                  <td style={{padding:'6px 8px',fontSize:10,fontWeight:500,color:t.tx}}>{r.amac}</td>
                  <td style={{padding:'6px 8px',fontSize:10,textAlign:'right',color:t.tx}}>{r.buAy}K</td>
                  <td style={{padding:'6px 8px',fontSize:10,textAlign:'right',color:t.tx}}>{r.buAyPay}%</td>
                  <td style={{padding:'6px 8px',fontSize:10,textAlign:'right',fontWeight:600,color:r.degisim>0?t.gn:r.degisim<0?t.rd:t.am}}>{r.degisim>0?'+':''}{r.degisim.toFixed(1)}</td>
                  <td style={{padding:'6px 8px',textAlign:'center'}}><Spark data={mkSpk(r.trend,'K ₺',lang)} color={r.trend==='up'?t.gn:r.trend==='down'?t.rd:t.am} t={t} compact/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </ChartContainer>
      </div>

      {/* ── 6. KARLILIK MATRİSİ ──────────────────────────────────────────────── */}
      <SectionHeader title="KARLILIK MATRİSİ" t={t} />
      <div style={{marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Proje Amacı Kârlılık Matrisi" id="prd-chart-matrix" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{position:'relative'}}>
            <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1}}>
              <div style={{position:'absolute',top:12,right:32,fontSize:10,color:t.gn,fontWeight:600,opacity:0.6}}>★ Yıldız</div>
              <div style={{position:'absolute',top:12,left:60,fontSize:10,color:t.tl,fontWeight:600,opacity:0.6}}>◆ Niş Yıldız</div>
              <div style={{position:'absolute',bottom:40,right:32,fontSize:10,color:t.am,fontWeight:600,opacity:0.6}}>▲ Büyüme Fırsatı</div>
              <div style={{position:'absolute',bottom:40,left:60,fontSize:10,color:t.rd,fontWeight:600,opacity:0.6}}>▼ Sorgulanabilir</div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{top:30,right:40,bottom:30,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.bd}/>
                <XAxis type="number" dataKey="ciro" tick={{fontSize:11,fill:t.tx2}} axisLine={false} tickLine={false} label={{value:'Ciro (K ₺)',position:'insideBottom',offset:-10,fontSize:10,fill:t.tx3}}/>
                <YAxis type="number" dataKey="brutMarj" tick={{fontSize:11,fill:t.tx2}} axisLine={false} tickLine={false} label={{value:'Marj %',angle:-90,position:'insideLeft',fontSize:10,fill:t.tx3}}/>
                <ZAxis type="number" dataKey="skuSayisi" range={[60,400]}/>
                <Tooltip content={({active,payload})=>active&&payload?.[0]?(<div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,padding:'8px 12px',fontSize:12}}><div style={{fontWeight:600,marginBottom:4}}>{payload[0].payload.name}</div><div style={{color:t.tx2}}>Ciro: <b>{payload[0].payload.ciro}K ₺</b></div><div style={{color:t.tx2}}>Marj: <b>{payload[0].payload.brutMarj}%</b></div></div>):null}/>
                <ReferenceLine x={avgCiro} stroke={t.tx3} strokeDasharray="4 4" strokeWidth={1.5}/>
                <ReferenceLine y={avgMarj} stroke={t.tx3} strokeDasharray="4 4" strokeWidth={1.5}/>
                <Scatter data={profitMatrix} shape={(props:{cx?:number;cy?:number;payload?:{name:string;ciro:number;brutMarj:number;skuSayisi:number}})=>{const{cx=0,cy=0,payload}=props;if(!payload)return<g/>;const fill=scatterFill(payload.ciro,payload.brutMarj,t);const r=Math.sqrt(payload.skuSayisi)*0.75+6;return(<g><circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.82}/><text x={cx} y={cy-r-4} textAnchor="middle" fontSize={10} fill={t.tx} fontWeight={500}>{payload.name}</text></g>);}}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* ── 7. STOK & ENVANTER ANALİZİ ───────────────────────────────────────── */}
      <SectionHeader title="STOK & ENVANTER ANALİZİ" t={t} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Stok Sağlığı Dağılımı" id="prd-chart-stockhealth" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <div style={{position:'relative'}}><ResponsiveContainer width={130} height={130}><PieChart><Pie data={stockHealth} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}>{stockHealth.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:16,fontWeight:700,color:t.tx}}>1,247</div><div style={{fontSize:9,color:t.tx2}}>SKU</div></div></div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>{stockHealth.map(d=>(<div key={d.name} style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:10,height:10,borderRadius:3,background:d.color,flexShrink:0}}/><span style={{fontSize:11,color:t.tx2,flex:1}}>{d.name}</span><span style={{fontSize:12,fontWeight:600,color:t.tx}}>{d.value}%</span></div>))}</div>
          </div>
        </ChartContainer>
        <ChartContainer t={t} l={l} title="Stok Devir Trendi" id="prd-chart-stockturn" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={stockTurnover}><CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:t.tx2}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:t.tx2}} axisLine={false} tickLine={false} domain={[3.5,7]}/><Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}}/><ReferenceLine y={6} stroke={t.rd} strokeDasharray="5 3" label={{value:'Hedef 6x',fontSize:10,fill:t.rd,position:'insideTopRight'}}/><Line type="monotone" dataKey="devir" stroke={t.tl} strokeWidth={2.5} dot={{r:4,fill:t.tl}}/></LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── 8. STOK DETAY GRAFİKLERİ ─────────────────────────────────────────── */}
      <SectionHeader title="STOK DETAY GRAFİKLERİ" t={t} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Stok Yaşlanma Analizi" id="prd-chart-aging" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockAging} layout="vertical" barCategoryGap="18%"><CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false}/><XAxis type="number" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} width={80}/><Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}} formatter={(v:number)=>`${v}%`}/><Bar dataKey="d0_30" name="0-30 gün" stackId="a" fill="#059669"/><Bar dataKey="d31_60" name="31-60 gün" stackId="a" fill="#10B981"/><Bar dataKey="d61_90" name="61-90 gün" stackId="a" fill="#D97706"/><Bar dataKey="d90plus" name="90+ gün" stackId="a" fill="#DC2626" radius={[0,3,3,0]}/></BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer t={t} l={l} title="Stok vs Satış Hızı" id="prd-chart-stockscatter" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{display:'flex',gap:10,marginBottom:4,flexWrap:'wrap'}}>{[{label:'İyi Denge',color:t.gn},{label:'Orta',color:t.am},{label:'Verimsiz',color:t.rd}].map(item=>(<span key={item.label} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:t.tx2}}><div style={{width:8,height:8,borderRadius:'50%',background:item.color}}/>{item.label}</span>))}</div>
          <ResponsiveContainer width="100%" height={170}>
            <ScatterChart margin={{top:6,right:16,bottom:0,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={t.bd}/><XAxis type="number" dataKey="stokDeg" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false}/><YAxis type="number" dataKey="satisHizi" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false}/><ZAxis range={[40,120]}/>
              <Tooltip content={({active,payload})=>active&&payload?.[0]?(<div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,padding:'6px 10px',fontSize:11}}><div style={{fontWeight:600}}>{payload[0].payload.name}</div><div style={{color:t.tx2}}>Stok: {payload[0].payload.stokDeg}K ₺</div><div style={{color:t.tx2}}>Hız: {payload[0].payload.satisHizi}</div></div>):null}/>
              {['green','amber','red'].map(c=>{const fill=scatterColor(c,t);return(<Scatter key={c} data={stockVsSales.filter(d=>d.color===c)} fill={fill} opacity={0.8} shape={(props:{cx?:number;cy?:number;payload?:{name:string}})=>{const{cx=0,cy=0,payload}=props;if(!payload)return<g/>;return(<g><circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.8}/><text x={cx} y={cy-10} textAnchor="middle" fontSize={9} fill={t.tx2} fontWeight={500} style={{pointerEvents:'none'}}>{payload.name}</text></g>);}}/>);})}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── 9. KRİTİK STOK & UYARILAR ────────────────────────────────────────── */}
      <SectionHeader title="KRİTİK STOK & UYARILAR" t={t} />
      <div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.bd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,fontWeight:500,color:t.tx}}>Kritik Stok Tablosu</span>
          <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${t.bd}`,background:t.bg2,color:t.tx2,fontSize:12,cursor:'pointer'}}><Icon name="download" size={12} color={t.tx3}/>Excel</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${t.bd}`,background:t.bg2}}>
              {['Ürün','Proje Amacı','Mevcut Stok','Gnlk Satış Hızı','Thmni Tükenme','Tedarik Süresi','Durum','Aksiyon'].map(h=>(
                <th key={h} style={{padding:'8px 12px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:['Ürün','Proje Amacı','Durum','Aksiyon'].includes(h)?'left':'right',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{criticalStock.map(r=>(
              <tr key={r.id} style={{borderBottom:`1px solid ${t.bd}`}}>
                <td style={{padding:'8px 12px',fontSize:11,fontWeight:500,color:t.tx}}>{r.urun}</td>
                <td style={{padding:'8px 12px',fontSize:11,color:t.tx2}}>{r.amac}</td>
                <td style={{padding:'8px 12px',fontSize:11,textAlign:'right',color:r.stok<10?t.rd:t.tx,fontWeight:r.stok<10?700:400}}>{r.stok}</td>
                <td style={{padding:'8px 12px',fontSize:11,textAlign:'right',color:t.tx}}>{r.hiz.toFixed(1)}</td>
                <td style={{padding:'8px 12px',fontSize:11,textAlign:'right',color:r.tukenme<=7?t.rd:r.tukenme<=14?t.am:t.gn,fontWeight:600}}>{r.tukenme} gün</td>
                <td style={{padding:'8px 12px',fontSize:11,textAlign:'right',color:t.tx2}}>{r.tedarik} gün</td>
                <td style={{padding:'8px 12px'}}>{stockDurumBadge(r.durum)}</td>
                <td style={{padding:'8px 12px'}}>{stockAksiyonBtn(r.durum)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ── 10. MARKA ANALİZİ ────────────────────────────────────────────────── */}
      <SectionHeader title="MARKA ANALİZİ" t={t} />

      {/* Top 20 Marka */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Top 10 Marka" id="prd-chart-brandtop" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={brandTop} layout="vertical" margin={{top:0,right:20,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false}/><XAxis type="number" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}K`}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} width={85}/>
              <Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}} formatter={(v:number)=>[`${v}K ₺`,'Ciro']}/>
              <Bar dataKey="ciro" fill={t.pr} radius={[0,4,4,0]} opacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer t={t} l={l} title="Marka Büyüme Matrisi" id="prd-chart-brandmatrix" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{top:20,right:20,bottom:10,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd}/><XAxis type="number" dataKey="buyume" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} label={{value:'Büyüme %',position:'insideBottom',offset:-5,fontSize:9,fill:t.tx3}}/><YAxis type="number" dataKey="marjDelta" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false} label={{value:'Marj Δ',angle:-90,position:'insideLeft',fontSize:9,fill:t.tx3}}/>
              <ZAxis type="number" dataKey="ciro" range={[40,200]}/>
              <ReferenceLine x={0} stroke={t.tx3} strokeDasharray="4 4"/><ReferenceLine y={0} stroke={t.tx3} strokeDasharray="4 4"/>
              <Tooltip content={({active,payload})=>active&&payload?.[0]?(<div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,padding:'6px 10px',fontSize:11}}><div style={{fontWeight:600}}>{payload[0].payload.name}</div><div style={{color:t.tx2}}>Büyüme: {payload[0].payload.buyume}%</div><div style={{color:t.tx2}}>Marj Δ: {payload[0].payload.marjDelta>0?'+':''}{payload[0].payload.marjDelta}</div></div>):null}/>
              <Scatter data={brandMatrix} shape={(props:{cx?:number;cy?:number;payload?:{name:string;color:string;ciro:number}})=>{const{cx=0,cy=0,payload}=props;if(!payload)return<g/>;return(<g><circle cx={cx} cy={cy} r={Math.sqrt(payload.ciro)*0.4+4} fill={payload.color} opacity={0.8}/><text x={cx} y={cy-Math.sqrt(payload.ciro)*0.4-6} textAnchor="middle" fontSize={9} fill={t.tx2} fontWeight={500}>{payload.name}</text></g>);}}/>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Marka Performans Tablosu */}
      <div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:10,overflow:'hidden',marginBottom:12}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.bd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,fontWeight:500,color:t.tx}}>Marka Performans Tablosu</span>
          <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${t.bd}`,background:t.bg2,color:t.tx2,fontSize:12,cursor:'pointer'}}><Icon name="download" size={12} color={t.tx3}/>Excel</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${t.bd}`,background:t.bg2}}>
              {['Marka','Ciro (K)','Pay %','Marj %','SKU','Satış','Stok (K)','İade %','Büyüme %'].map((h,i)=>(
                <th key={h} style={{padding:'7px 10px',fontSize:10,fontWeight:600,color:t.tx2,textAlign:i===0?'left':'right',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{brandTable.map(r=>(
              <tr key={r.marka} style={{borderBottom:`1px solid ${t.bd}`}} onMouseOver={e=>((e.currentTarget as HTMLElement).style.background='#F8FAFC')} onMouseOut={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
                <td style={{padding:'7px 10px',fontSize:11,fontWeight:500,color:t.tx}}>{r.marka}</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:500,color:t.tx}}>{r.ciro}K</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',color:t.tx}}>{r.pay}%</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:600,color:r.marj>=30?t.gn:r.marj>=20?t.am:t.rd}}>{r.marj}%</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',color:t.tx}}>{r.sku}</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',color:t.tx}}>{r.satis.toLocaleString('tr-TR')}</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',color:t.tx}}>{r.stok}K</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',color:r.iade>5?t.rd:t.tx}}>{r.iade}%</td>
                <td style={{padding:'7px 10px',fontSize:11,textAlign:'right',fontWeight:600,color:r.buyume>=0?t.gn:t.rd}}>{r.buyume>0?'+':''}{r.buyume}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ── AYLIK SATIŞ HACMİ & ÇEYREKLİK DEAL HEATMAP ─────────────────────── */}
      <SectionHeader title="AYLIK SATIŞ HACMİ & SEZONSAL" t={t} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <ChartContainer t={t} l={l} title="Aylık Satış Hacmi (Adet)" id="prd-chart-aylik" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySales} margin={{top:15,right:20,bottom:0,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false}/><XAxis dataKey="month" tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:t.tx2}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12}} formatter={(v:number)=>[`${v.toLocaleString('tr-TR')} adet`,'']}/><Bar dataKey="adet" radius={[4,4,0,0]}>{monthlySales.map((d,i)=><Cell key={i} fill={d.adet===maxMonthly?t.am:t.pr} opacity={d.adet===maxMonthly?1:0.7}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Satış Yoğunluğu Heatmap */}
        <ChartContainer t={t} l={l} title="Satış Yoğunluğu (Gün × Saat)" id="prd-chart-heatmap" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'40px repeat(12, 1fr)',gap:2,marginBottom:2}}><div/>{HOURS.map(h=><div key={h} style={{fontSize:8,color:t.tx3,textAlign:'center'}}>{h}</div>)}</div>
            {DAYS.map((day,di)=>(<div key={day} style={{display:'grid',gridTemplateColumns:'40px repeat(12, 1fr)',gap:2,marginBottom:2}}><div style={{fontSize:9,color:t.tx2,display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:4}}>{day}</div>{heatmapValues[di].map((val,hi)=>(<div key={hi} style={{height:18,borderRadius:3,background:heatColor(val,heatmapMax,'#4F46E5'),display:'flex',alignItems:'center',justifyContent:'center'}} title={`${day} ${HOURS[hi]}: ${val}`}>{val>10&&<span style={{fontSize:7,color:'#fff',fontWeight:600}}>{val}</span>}</div>))}</div>))}
          </div>
          <div style={{fontSize:9,color:t.tx2,textAlign:'center',marginTop:6,fontStyle:'italic'}}>Peak B2B sipariş: 09:00-11:00, Salı & Çarşamba</div>
        </ChartContainer>
      </div>

      {/* Çeyreklik Deal Heatmap */}
      <div style={{background:t.cd,border:`1px solid ${t.bd}`,borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.bd}`}}><span style={{fontSize:13,fontWeight:500,color:t.tx}}>Çeyreklik Deal Dağılımı (Amaç Bazlı)</span></div>
        <div style={{overflowX:'auto',padding:'12px 16px'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={{padding:'8px 14px',fontSize:11,fontWeight:600,color:t.tx2,textAlign:'left'}}>Amaç</th>{['Q1','Q2','Q3','Q4'].map(q=><th key={q} style={{padding:'8px 14px',fontSize:11,fontWeight:600,color:t.tx2,textAlign:'center'}}>{q}</th>)}<th style={{padding:'8px 14px',fontSize:11,fontWeight:600,color:t.tx2,textAlign:'right'}}>Toplam</th></tr></thead>
            <tbody>{qDealRows.map(r=>{const total=r.q1+r.q2+r.q3+r.q4;return(<tr key={r.amac} style={{borderTop:`1px solid ${t.bd}`}}><td style={{padding:'8px 14px',fontSize:12,fontWeight:500,color:t.tx}}>{r.amac}</td>{[r.q1,r.q2,r.q3,r.q4].map((v,qi)=>{const ratio=qMax>0?v/qMax:0;const alpha=Math.round(ratio*200+20).toString(16).padStart(2,'0');return(<td key={qi} style={{padding:'6px 10px',textAlign:'center'}}><div style={{background:`#4F46E5${alpha}`,color:ratio>0.5?'#fff':t.tx,borderRadius:4,padding:'6px 8px',fontSize:12,fontWeight:600}}>{v}</div></td>);})}<td style={{padding:'8px 14px',fontSize:12,fontWeight:700,color:t.tx,textAlign:'right'}}>{total}</td></tr>);})}</tbody>
          </table>
        </div>
      </div>
    </>
  );
};
