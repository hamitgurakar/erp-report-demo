import type { LangStrings, Lang, SparkPoint, KPIDef, DeptReport, Alert } from '../types';
import type { Dict } from '../i18n/tr';

export const mosTR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const mosEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const revData = [
  { month: 'Oca', gelir: 280, brutKar: 78, netKar: 42 },
  { month: 'Şub', gelir: 295, brutKar: 82, netKar: 45 },
  { month: 'Mar', gelir: 310, brutKar: 87, netKar: 48 },
  { month: 'Nis', gelir: 290, brutKar: 80, netKar: 43 },
  { month: 'May', gelir: 340, brutKar: 95, netKar: 53 },
  { month: 'Haz', gelir: 355, brutKar: 99, netKar: 55 },
  { month: 'Tem', gelir: 350, brutKar: 98, netKar: 54 },
  { month: 'Ağu', gelir: 380, brutKar: 106, netKar: 59 },
];

export const revPct = revData.map((d) => ({
  month: d.month,
  gelir: 100,
  brutKar: Math.round((d.brutKar / d.gelir) * 1000) / 10,
  netKar: Math.round((d.netKar / d.gelir) * 1000) / 10,
}));

export const donutD = [
  { name: 'B2B', value: 55, tl: '1.35M ₺' },
  { name: 'B2C', value: 30, tl: '735K ₺' },
  { name: 'Other/Diğer', value: 15, tl: '368K ₺' },
];

export const hedefD = [
  { month: 'Eki', hedef: 260, gerceklesen: 270 },
  { month: 'Kas', hedef: 280, gerceklesen: 275 },
  { month: 'Ara', hedef: 300, gerceklesen: 310 },
  { month: 'Oca', hedef: 290, gerceklesen: 240 },
  { month: 'Şub', hedef: 310, gerceklesen: 325 },
  { month: 'Mar', hedef: 330, gerceklesen: 360 },
];

export const cfD = [
  { week: 'H1', giris: 420, cikis: 290 },
  { week: 'H2', giris: 380, cikis: 340 },
  { week: 'H3', giris: 450, cikis: 310 },
  { week: 'H4', giris: 395, cikis: 360 },
  { week: 'H5', giris: 510, cikis: 320 },
  { week: 'H6', giris: 440, cikis: 380 },
  { week: 'H7', giris: 320, cikis: 350 },
  { week: 'H8', giris: 480, cikis: 330 },
];

export const tahD = [
  { week: 'H1', oran: 85 },
  { week: 'H2', oran: 87 },
  { week: 'H3', oran: 84 },
  { week: 'H4', oran: 89 },
  { week: 'H5', oran: 91 },
  { week: 'H6', oran: 88 },
  { week: 'H7', oran: 86 },
  { week: 'H8', oran: 90 },
];

export const borcD = [
  { period: "Q1 '25", kisaVadeli: 180, uzunVadeli: 200, faiz: 40 },
  { period: "Q2 '25", kisaVadeli: 190, uzunVadeli: 205, faiz: 40 },
  { period: "Q3 '25", kisaVadeli: 195, uzunVadeli: 210, faiz: 45 },
];

export const nakitDD = [
  { quarter: 'Q1', operasyonel: 120, yatirim: -40, finansman: -30 },
  { quarter: 'Q2', operasyonel: 135, yatirim: -55, finansman: -25 },
  { quarter: 'Q3', operasyonel: 128, yatirim: -35, finansman: -40 },
  { quarter: 'Q4', operasyonel: 145, yatirim: -45, finansman: -30 },
];

export const wfD = [
  { name: 'Gelir', nameEN: 'Revenue', val: 2450 },
  { name: 'COGS', nameEN: 'COGS', val: -1830 },
  { name: 'Brüt Kâr', nameEN: 'Gross Profit', val: 620 },
  { name: 'Pazarlama', nameEN: 'Marketing', val: -95 },
  { name: 'Operasyon', nameEN: 'Operations', val: -72 },
  { name: 'Personel', nameEN: 'Personnel', val: -48 },
  { name: 'Faaliyet K.', nameEN: 'EBIT', val: 405 },
  { name: 'Finans G.', nameEN: 'Finance', val: -20 },
  { name: 'Net Kâr', nameEN: 'Net Profit', val: 385 },
];

export const mkSpk = (trend: string, unit = 'K ₺', lang: Lang = 'tr'): SparkPoint[] => {
  const base =
    trend === 'up'
      ? [20, 22, 21, 25, 24, 28, 27, 31, 30, 34, 33, 36]
      : trend === 'down'
        ? [36, 34, 35, 32, 33, 30, 31, 28, 29, 26, 27, 24]
        : [28, 30, 27, 32, 29, 31, 28, 33, 30, 32, 29, 31];
  const ms = lang === 'en' ? mosEN : mosTR;
  return base.map((v, i) => {
    const fv = v >= 1000 ? (v / 1000).toFixed(1) + 'M' : v.toLocaleString('tr-TR');
    const day = String(((i * 2 + 1) % 28) + 1).padStart(2, '0');
    const monIdx = (i + 4) % 12;
    const monNum = String(monIdx + 1).padStart(2, '0');
    void ms;
    return { v, label: `${fv} ${unit} — ${day}.${monNum}.2026` };
  });
};

// Whitelist: report keys that have a real component in Dashboard.tsx's render chain.
// Any report key NOT in this set is treated as "coming soon" (Yakında) in the sidebar.
// When a new page is wired into Dashboard.tsx, add its key here and the badge disappears.
export const IMPLEMENTED_REPORTS = new Set<string>([
  'yonetim__0', 'yonetim__3', 'yonetim__4', 'yonetim__5',
  'satis__0', 'satis__1', 'satis__2', 'satis__3', 'satis__4', 'satis__5',
  'satis__6', 'satis__7', 'satis__8', 'satis__9', 'satis__10', 'satis__11',
  'destek__0', 'destek__1', 'destek__2', 'destek__3', 'destek__4',
  'kategori__0', 'kategori__1', 'kategori__2', 'kategori__3', 'kategori__4',
  'satin-alma__0', 'satin-alma__1', 'satin-alma__2', 'satin-alma__3', 'satin-alma__4', 'satin-alma__5', 'satin-alma__6', 'satin-alma__7', 'satin-alma__8',
  'muhasebe__0', 'muhasebe__1', 'muhasebe__2', 'muhasebe__3', 'muhasebe__4',
  'muhasebe__5', 'muhasebe__6', 'muhasebe__7', 'muhasebe__8', 'muhasebe__9', 'muhasebe__10',
]);

export const isComingSoon = (repKey: string): boolean => !IMPLEMENTED_REPORTS.has(repKey);

export const mkDeptReports = (d: Dict): DeptReport[] => [
  { id: 'yonetim', label: d.sidebar.depts.yonetim, icon: 'barChart3', reports: [...d.sidebar.reports.yonetim] },
  { id: 'satis', label: d.sidebar.depts.satis, icon: 'trendUp', reports: [...d.sidebar.reports.satis] },
  { id: 'kategori', label: d.sidebar.depts.kategori, icon: 'tag', reports: [...d.sidebar.reports.kategori] },
  { id: 'satin-alma', label: d.sidebar.depts.satinAlma, icon: 'shoppingBag', reports: [...d.sidebar.reports.satinAlma] },
  { id: 'operasyon', label: d.sidebar.depts.operasyon, icon: 'settings', reports: [...d.sidebar.reports.operasyon] },
  { id: 'muhasebe', label: d.sidebar.depts.muhasebe, icon: 'calculator', reports: [...d.sidebar.reports.muhasebe] },
  { id: 'pazarlama', label: d.sidebar.depts.pazarlama, icon: 'megaphone', reports: [...d.sidebar.reports.pazarlama] },
  { id: 'destek', label: d.sidebar.depts.destek, icon: 'headphones', reports: [...d.sidebar.reports.destek] },
];

export const mkAlerts = (l: LangStrings): Alert[] => [
  { type: 'warning', title: l.netMarj, desc: l.netMarjD, action: l.maliyetAnalizi },
  { type: 'danger', title: l.vadeAlacak, desc: l.vadeAlacakD, action: l.alacakDetay },
  { type: 'info', title: l.b2bIvme, desc: l.b2bIvmeD, action: l.satisDetay },
  { type: 'warning', title: l.borcEbitda, desc: l.borcEbitdaD, action: l.borcAnalizi },
];

export const kpiDefs = (l: LangStrings): Record<string, KPIDef> => ({
  'kpi-ciro': { title: l.toplamCiro, value: '2.45M ₺', trendValue: '+12.5%', sparkTrend: 'up', color: 'gn', unit: 'K ₺' },
  'kpi-brutkar': { title: l.brutKar, value: '620K ₺', altValue: '25.3%', trendValue: '+9.8%', sparkTrend: 'up', color: 'gn', unit: 'K ₺' },
  'kpi-netkar': { title: l.netKar, value: '385K ₺', altValue: '15.7%', trendValue: '+8.3%', sparkTrend: 'up', color: 'gn', unit: 'K ₺' },
  'kpi-siparis': { title: l.siparis, value: '1,247', trendValue: '+5.1%', sparkTrend: 'up', color: 'c1', unit: 'adet' },
  'kpi-musteri': { title: l.aktifMusteri, value: '342', trendValue: '-2.1%', sparkTrend: 'down', color: 'rd', unit: 'adet' },
  'kpi-ortsiparis': { title: l.ortSiparis, value: '1,964 ₺', trendValue: '+7.0%', sparkTrend: 'up', color: 'gn', unit: '₺' },
  'kpi-satisadedi': { title: l.satisAdedi, value: '3,842', trendValue: '+6.2%', sparkTrend: 'up', color: 'c2', unit: 'adet' },
  'kpi-stokmal': { title: l.stokMaliyeti, value: '121K ₺', trendValue: '+2.1%', sparkTrend: 'flat', color: 'pu', unit: 'K ₺' },
  'kpi-stokdeg': { title: l.stokDegeri, value: '291K ₺', trendValue: '+4.5%', sparkTrend: 'up', color: 'pu', unit: 'K ₺' },
  'kpi-potmarj': { title: l.potStokMarji, value: '%58.4', trendValue: '+3.2%', sparkTrend: 'up', color: 'tl', unit: '%' },
});
